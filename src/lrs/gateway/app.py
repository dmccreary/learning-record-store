"""`lrs gateway` — the ingestion endpoint. Design §5.1, contract §9.

Per request:
  1. AuthN            bearer token -> district_id
  2. Tier-1 validate  structural + contract; batch is all-or-nothing
  3. Assign ids       UUIDv7 if the client did not supply one; stamp stored_at
  4. Produce          acks=all, keyed {district_id}:{raw actor}
  5. Respond          200 with the array of statement ids, AFTER the durable queue ack

HARD DEPENDENCIES: KAFKA ONLY.
This is the single most load-bearing property of the service (compose says so in a banner
comment). Nothing here may import a ClickHouse, Neo4j, or Redis client. If ingest could fail
because the analytics store is down, a classroom loses a lesson's worth of telemetry every
time ClickHouse restarts — that is spec §5.4, and it is the whole reason the write path is
Kafka-first.

The auth cache is the subtle version of the same trap: design §5.1 puts token->district in
Redis with an LRU fallback *specifically* so that "auth must not become an ingestion
dependency". The MVP resolves the dev token in-process, which has that property trivially.
When the identity service lands it must keep it — see `resolve_district`.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from uuid6 import uuid7

from lrs.config import Settings, settings
from lrs.envelope import Envelope
from lrs.gateway.producer import QueueFull, StatementProducer
from lrs.gateway.validation import raw_actor_identity, validate_batch

log = logging.getLogger(__name__)

XAPI_VERSION_HEADER = "X-Experience-API-Version"
SUPPORTED_XAPI = "1.0."


def _problem(status: int, title: str, **extra: Any) -> JSONResponse:
    body: dict[str, Any] = {"error": title}
    body.update(extra)
    return JSONResponse(status_code=status, content=body)


def resolve_district(token: str, cfg: Settings) -> str | None:
    """Bearer token -> district_id, or None.

    MVP: one dev token, one district, resolved in-process.

    This is the seam for design §5.1 step 1 — per-district tokens from the identity service,
    cached in Redis for 60s with a local LRU fallback. Whatever replaces this MUST keep
    serving when its cache is unreachable. A token lookup that can hard-fail turns auth into
    an ingestion dependency and quietly undoes the Kafka-only guarantee above.
    """
    if not cfg.dev_ingest_token:
        return None
    # Compared as plain equality: this is a dev token in a laptop compose file, and the
    # production path (§10.5) stores token HMACs and never sees the plaintext at all.
    if token == cfg.dev_ingest_token:
        return cfg.dev_district_id
    return None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    cfg = settings()
    app.state.cfg = cfg
    app.state.producer = StatementProducer(cfg.kafka_bootstrap, cfg.topic_raw)
    log.info(
        "gateway ready: kafka=%s topic=%s district=%s",
        cfg.kafka_bootstrap,
        cfg.topic_raw,
        cfg.dev_district_id,
    )
    try:
        yield
    finally:
        app.state.producer.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="LRS Ingestion Gateway",
        version="0.1.0",
        lifespan=lifespan,
    )

    @app.get("/health")
    async def health() -> dict[str, Any]:
        """Liveness only — deliberately NOT a broker probe.

        compose's `loadgen` waits on this via `condition: service_healthy`. It must report
        the process, not its dependencies: a health check that fails when Kafka is briefly
        unreachable would take the gateway out of rotation exactly when the local produce
        queue is doing the buffering the design asks it to do (§5.5), converting a
        recoverable blip into an outage.
        """
        return {"status": "ok", "role": "gateway", "queue_depth": app.state.producer.queue_depth}

    @app.post("/xapi/statements")
    async def post_statements(request: Request) -> Response:
        cfg: Settings = app.state.cfg

        # --- 1. AuthN -------------------------------------------------------------
        auth = request.headers.get("authorization", "")
        if not auth.lower().startswith("bearer "):
            return _problem(401, "missing or malformed Authorization: Bearer <token>")
        district_id = resolve_district(auth[7:].strip(), cfg)
        if district_id is None:
            return _problem(401, "unrecognised ingest token")

        # xAPI conformance requires the version header; contract §9 sends it. Rejecting a
        # missing one is how a producer learns it is not speaking xAPI before its data is
        # durable and wrong.
        version = request.headers.get(XAPI_VERSION_HEADER)
        if not version or not version.startswith(SUPPORTED_XAPI):
            return _problem(
                400,
                f"{XAPI_VERSION_HEADER} must be present and 1.0.x",
                got=version,
                contract="§9",
            )

        # --- 2. Tier-1 validation -------------------------------------------------
        raw = await request.body()
        try:
            body = json.loads(raw)
        except json.JSONDecodeError as e:
            return _problem(400, "body is not valid JSON", detail=str(e), contract="§9")

        violations = validate_batch(body)
        if violations:
            # ALL-OR-NOTHING (§9 / xAPI conformance): one invalid statement rejects the whole
            # POST and stores none of it. Every violation is returned, not just the first, so
            # a producer author fixes one batch instead of one bug per round trip.
            size = len(body) if isinstance(body, list) else 0
            log.info("rejected batch of %d: %d violations", size, len(violations))
            return _problem(
                400,
                "batch rejected — no statements were stored (all-or-nothing, §9)",
                violations=[v.as_dict() for v in violations],
            )

        # --- 3. Assign identifiers ------------------------------------------------
        stored_at = datetime.now(UTC).isoformat(timespec="milliseconds")
        statement_ids: list[str] = []
        messages: list[tuple[str, bytes]] = []

        for statement in body:
            sid = statement.get("id")
            if not sid:
                # UUIDv7 sorts by time (§5.1), so statement_id is a usable secondary order in
                # a ReplacingMergeTree keyed on it. A producer-supplied id round-trips
                # verbatim — smoke.sh queries by the id it sent, and contract §9 notes that
                # gateway-side dedup would make `id` required rather than optional.
                sid = str(uuid7())
                statement["id"] = sid
            sid = str(sid)
            statement_ids.append(sid)

            # §5.1 step 4: keyed {district_id}:{student_key_raw}. The gateway has no salt and
            # must not have one — it keys on the raw identity so every statement from one
            # learner lands on one partition and is consumed in order. Ordering is what makes
            # BKT correct (§5.3), so this key is load-bearing for mastery, not just balance.
            actor_identity = raw_actor_identity(statement["actor"])
            key = f"{district_id}:{actor_identity}"

            messages.append((key, Envelope(district_id, stored_at, statement).to_json()))

        # --- 4. Produce, and 5. respond only after the ack -------------------------
        try:
            await app.state.producer.produce_batch(messages)
        except QueueFull:
            # The one case the design permits a 503 (§5.1/§5.5) — and it says this is
            # page-worthy, not routine.
            log.error("503: local queue full and broker unreachable")
            return JSONResponse(
                status_code=503,
                content={"error": "ingest queue saturated and broker unreachable"},
                headers={"Retry-After": "5"},
            )
        except Exception:
            log.exception("produce failed")
            return _problem(500, "could not durably queue the batch")

        return JSONResponse(status_code=200, content=statement_ids)

    return app
