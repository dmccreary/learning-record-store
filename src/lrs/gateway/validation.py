"""Tier-1 validation — the xAPI producer contract, made executable.

Normative reference: docs/specs/xapi-producer-contract-v1.md. Every rule below cites the
section it enforces. Where this file and that document disagree, the document wins.

WHY THE GATEWAY IS STRICT
-------------------------
Design §5.2's "tier-1" is structural (well-formed JSON, required actor/verb/object, parseable
timestamp). This module goes further and enforces the *contract*, because the contract says so
in two places — §3 "a statement with any other verb is rejected at the gateway" and §5's
mapping table, whose last row is "(anything else) — Reject at the gateway".

The reason to be strict here rather than forgiving: `lrs.statements` is the system of record
and it is APPEND-ONLY. A statement that violates the contract does not fail loudly downstream;
it fails *silently and permanently*. `grouping[0]` missing means `textbook_id` has no value for
a NOT NULL column. An `answered` with no `success` means `countIf(result_success IS NOT NULL)`
counts zero and that concept reports `attempts = 0` forever, looking exactly like a student who
never tried. A fragment IRI typed MicroSim mints a spurious PageEngagement vertex. None of
those raise. All of them are cheap to reject now and brutal to retrofit across an immutable log.

So: reject at the door, with a message naming the contract section, so the producer author can
fix it in the file that caused it.

These are pure functions over parsed JSON — no I/O, no framework — so the processor and the
tests can reuse them and so a rule can be tested without a broker.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

# §3 — exactly three verbs are valid in v1.
VERBS: dict[str, str] = {
    "http://adlnet.gov/expapi/verbs/answered": "answered",
    "http://adlnet.gov/expapi/verbs/experienced": "experienced",
    "http://adlnet.gov/expapi/verbs/interacted": "interacted",
}

# §5 — object.definition.type -> the object_type column the materialized views filter on.
# Note `cmi.interaction` (Question) and `interaction` (Control) differ by four characters and
# drive entirely different rollups. That trap is inherited from the ADL vocabulary, and it is
# exactly what a gateway validator should be strict about (§5's own note).
ACTIVITY_TYPES: dict[str, str] = {
    "http://adlnet.gov/expapi/activities/lesson": "Page",
    "http://adlnet.gov/expapi/activities/simulation": "MicroSim",
    "http://adlnet.gov/expapi/activities/cmi.interaction": "Question",
    "http://adlnet.gov/expapi/activities/interaction": "Control",
}

# §5 — these are page-grain objects. mv_student_page_rollup is GROUP BY object_id, so a
# fragment-qualified IRI typed as one of these becomes its own PageEngagement vertex.
PAGE_GRAIN_TYPES = frozenset({"Page", "MicroSim"})

CONCEPT_ID_EXT = "https://w3id.org/lrs/ext/concept_id"


@dataclass(frozen=True)
class Violation:
    """One contract breach, addressed to the human who has to fix the emitter."""

    index: int  # position in the POSTed array
    field: str  # dotted path into the statement
    section: str  # the contract section that decides it
    message: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "index": self.index,
            "field": self.field,
            "contract": self.section,
            "message": self.message,
        }


def parse_version_iri(iri: str) -> tuple[str, str] | None:
    """`{site_url}textbook/{textbook_id}/{version_id}` -> (textbook_id, version_id).

    §4. Returns None if the IRI is not that shape.

    This is the check that would have caught the real bug §1 documents: sine-wave's
    `grouping[0]` held *its own page URL* where the textbook version belongs. A host-only
    search-and-replace would have "fixed" the URL and left `textbook_id`/`version_id`
    unparseable — which is worse than the original, because it looks correct.
    """
    marker = "/textbook/"
    at = iri.find(marker)
    if at == -1:
        return None
    rest = iri[at + len(marker) :].strip("/")
    if not rest:
        return None
    parts = rest.split("/")
    if len(parts) != 2:
        return None
    textbook_id, version_id = parts
    if not textbook_id or not version_id:
        return None
    return textbook_id, version_id


def raw_actor_identity(actor: dict[str, Any]) -> str | None:
    """The HMAC input, and the Kafka partition key's learner half (§5.2, §8).

    `homePage || name` — the same bytes the processor will feed to HMAC-SHA256 with the
    per-district salt. The gateway never hashes (it has no salt, by design), it only keys on
    this so that all of one learner's statements land on one partition and are consumed in
    order. That ordering is load-bearing for BKT correctness, not just throughput (design
    §5.3).
    """
    account = actor.get("account")
    if not isinstance(account, dict):
        return None
    home = account.get("homePage")
    name = account.get("name")
    if not isinstance(home, str) or not isinstance(name, str) or not home or not name:
        return None
    return f"{home}|{name}"


def _check_object_iri(index: int, iri: str, object_type: str, out: list[Violation]) -> None:
    """§1 — the canonical activity IRI."""
    if not iri.startswith("https://"):
        out.append(
            Violation(
                index,
                "object.id",
                "§1",
                f"must be an absolute https IRI, got {iri!r}. The IRI is an identifier and "
                "must be stable across environments — a statement emitted from a local "
                "mkdocs serve must carry the published IRI, not 127.0.0.1.",
            )
        )
        return

    path = iri.split("#", 1)[0]
    if path.endswith("/main.html"):
        out.append(
            Violation(
                index,
                "object.id",
                "§1",
                "names the iframe payload, not the page. MkDocs renders index.md to "
                "/sims/x/ and copies main.html beside it; citing main.html mints a second "
                "IRI for one activity and splits student_page_rollup into two rows that "
                "never merge.",
            )
        )

    has_fragment = "#" in iri
    if object_type in PAGE_GRAIN_TYPES:
        if has_fragment:
            out.append(
                Violation(
                    index,
                    "object.id",
                    "§5",
                    f"a fragment-qualified IRI must not be typed {object_type}. "
                    "mv_student_page_rollup is GROUP BY object_id, so this mints a "
                    "PageEngagement vertex per fragment for a page visited once. A control "
                    "belongs to type Control.",
                )
            )
        elif not path.endswith("/"):
            # §1: "…/sims/x/ and …/sims/x are different strings to ORDER BY object_id."
            out.append(
                Violation(
                    index,
                    "object.id",
                    "§1",
                    "a page IRI must end with a trailing slash — the slash is significant to "
                    "ORDER BY object_id, and its absence silently splits the rollup.",
                )
            )


def _check_result(index: int, verb: str, statement: dict[str, Any], out: list[Violation]) -> None:
    """§3 — the `Required result` column of the verb table."""
    result = statement.get("result")
    result = result if isinstance(result, dict) else {}

    if verb == "answered":
        if not isinstance(result.get("success"), bool):
            out.append(
                Violation(
                    index,
                    "result.success",
                    "§3",
                    "`answered` requires result.success (bool). It is the only field feeding "
                    "countIf(result_success IS NOT NULL), so without it this concept reports "
                    "attempts = 0 forever — indistinguishable from a student who never tried. "
                    "This is the same defect that keeps `completed` out of v1.",
                )
            )
        score = result.get("score")
        if isinstance(score, dict) and "scaled" in score:
            scaled = score["scaled"]
            if not isinstance(scaled, (int, float)) or isinstance(scaled, bool):
                out.append(
                    Violation(index, "result.score.scaled", "§11", "must be a number 0.0–1.0.")
                )
            elif not 0.0 <= float(scaled) <= 1.0:
                out.append(
                    Violation(
                        index,
                        "result.score.scaled",
                        "§11",
                        f"must be within 0.0–1.0, got {scaled}.",
                    )
                )

    if verb == "experienced" and not isinstance(result.get("duration"), str):
        out.append(
            Violation(
                index,
                "result.duration",
                "§3/§7",
                "`experienced` requires an ISO-8601 result.duration — it is the only field "
                "feeding dwell_ms_total.",
            )
        )


def validate_statement(index: int, statement: Any) -> list[Violation]:
    """Every contract rule the gateway can decide without touching a store."""
    out: list[Violation] = []

    if not isinstance(statement, dict):
        return [Violation(index, "", "§9", "each array element must be a JSON object.")]

    # --- id (§9) — optional, but if supplied it round-trips verbatim, so it must be a UUID.
    if "id" in statement:
        try:
            UUID(str(statement["id"]))
        except (ValueError, AttributeError, TypeError):
            out.append(Violation(index, "id", "§9", f"not a UUID: {statement['id']!r}"))

    # --- actor (§8, §10)
    actor = statement.get("actor")
    if not isinstance(actor, dict):
        out.append(Violation(index, "actor", "§5.2", "required."))
    elif raw_actor_identity(actor) is None:
        out.append(
            Violation(
                index,
                "actor.account",
                "§8/§10",
                "requires account.homePage and account.name. That pair is the HMAC input for "
                "student_key and the learner half of the Kafka partition key; without it the "
                "statement cannot be pseudonymized or ordered per learner.",
            )
        )

    # --- verb (§3)
    verb_name: str | None = None
    verb = statement.get("verb")
    if not isinstance(verb, dict) or not isinstance(verb.get("id"), str):
        out.append(Violation(index, "verb.id", "§3", "required."))
    else:
        verb_name = VERBS.get(verb["id"])
        if verb_name is None:
            out.append(
                Violation(
                    index,
                    "verb.id",
                    "§3",
                    f"{verb['id']!r} is not one of the three v1 verbs "
                    f"({', '.join(sorted(VERBS.values()))}).",
                )
            )

    # --- object (§1, §5)
    obj = statement.get("object")
    if not isinstance(obj, dict):
        out.append(Violation(index, "object", "§5", "required."))
    else:
        definition = obj.get("definition")
        definition = definition if isinstance(definition, dict) else {}
        type_iri = definition.get("type")
        object_type = ACTIVITY_TYPES.get(type_iri) if isinstance(type_iri, str) else None

        if object_type is None:
            out.append(
                Violation(
                    index,
                    "object.definition.type",
                    "§5",
                    f"{type_iri!r} does not map to an object_type. Valid: "
                    f"{', '.join(ACTIVITY_TYPES)}. Note cmi.interaction (Question) and "
                    "interaction (Control) differ by four characters and drive different "
                    "rollups.",
                )
            )

        iri = obj.get("id")
        if not isinstance(iri, str) or not iri:
            out.append(Violation(index, "object.id", "§1", "required."))
        elif object_type is not None:
            _check_object_iri(index, iri, object_type, out)

    # --- result (§3)
    if verb_name is not None:
        _check_result(index, verb_name, statement, out)

    # --- context.contextActivities.grouping (§4)
    context = statement.get("context")
    context = context if isinstance(context, dict) else {}
    ctx_activities = context.get("contextActivities")
    ctx_activities = ctx_activities if isinstance(ctx_activities, dict) else {}
    grouping = ctx_activities.get("grouping")

    if not isinstance(grouping, list) or not grouping or not isinstance(grouping[0], dict):
        out.append(
            Violation(
                index,
                "context.contextActivities.grouping[0].id",
                "§4",
                "required on every statement. textbook_id and version_id are NOT NULL in "
                "lrs.statements and have no sensible default — a statement that cannot be "
                "attributed to a textbook version cannot be replayed against the content it "
                "describes.",
            )
        )
    else:
        gid = grouping[0].get("id")
        if not isinstance(gid, str) or parse_version_iri(gid) is None:
            out.append(
                Violation(
                    index,
                    "context.contextActivities.grouping[0].id",
                    "§4",
                    f"{gid!r} does not parse as {{site_url}}textbook/{{textbook_id}}/"
                    "{version_id}. grouping holds the textbook VERSION IRI, not a page URL — "
                    "a page URL belongs in `parent`.",
                )
            )

    # --- timestamp (§9) — event time, the producer's.
    ts = statement.get("timestamp")
    if ts is not None and (not isinstance(ts, str) or _parse_timestamp(ts) is None):
        out.append(Violation(index, "timestamp", "§9", f"not a parseable ISO-8601 instant: {ts!r}"))

    return out


def _parse_timestamp(value: str) -> datetime | None:
    try:
        # fromisoformat handles offsets natively on 3.11+; normalise the Zulu suffix it
        # historically choked on so a conformant producer is never rejected on a technicality.
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def validate_batch(body: Any) -> list[Violation]:
    """§9 — the body is always a JSON array, even for one statement.

    ALL-OR-NOTHING (§9, xAPI conformance): this returns every violation across the batch
    rather than stopping at the first. One invalid statement rejects the whole POST and
    stores none of it — so the caller gets one 400 listing everything wrong, instead of
    fixing one bug per round trip.
    """
    if not isinstance(body, list):
        return [
            Violation(
                0,
                "",
                "§9",
                "the request body must be a JSON array, even for a single statement.",
            )
        ]
    if not body:
        return [Violation(0, "", "§9", "the request body must contain at least one statement.")]

    out: list[Violation] = []
    for i, statement in enumerate(body):
        out.extend(validate_statement(i, statement))
    return out
