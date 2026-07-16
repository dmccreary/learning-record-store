# MVP: Prove the LRS Architecture

## Context

`docs/specs/` contains a mature, self-aware spec (595 lines), design (1467 lines), and hardware estimate — and **zero implementation**. All three commits in this repo's history are documentation. The Dockerfile, `docker-compose.yml`, `Makefile`, `smoke.sh`, ClickHouse DDL, and Cypher constraints exist only as fenced code blocks inside `lrs-design-v1.md`.

The design's own roadmap (§12) is a 26-week, layer-by-layer build (M0→M5) that doesn't reach a real user until week 21, because M3's dashboards need a roster, a district agreement, and FERPA consent — none of which code can conjure.

**Decision: don't chase a user yet. Prove the architecture first.** The design rests on one central, falsifiable claim (§4.1):

> "The property that matters most is not the ratio — it's the insensitivity. A burst to 50,000 statements/sec means each active student emits *more* events; it does not create five times as many students... **the graph write rate stays ~2,500/sec through a 5× ingest burst.**"

Everything downstream — the $10K/month hardware estimate, the Neo4j licensing question, the C-1 prohibition on per-statement vertices — is a consequence of that claim. It has never been executed. This MVP executes it.

**Two findings make this urgent rather than academic** (both verified against the source):

1. **The proof harness doesn't prove anything.** `smoke.sh` (design lines 1169–1231) is M0's stated exit criterion. Three of its five checks are decorative — `... | grep -q '^1$' && echo "✓ clickhouse stored it"` (line 1206) exits **0** when the grep fails, because `set -e` is ignored for non-final commands in an `&&` list. Verified empirically. The C-6 compression block (lines 1221–1228) has no assertion at all — it prints a number and falls through to an unconditional `echo "✓ smoke passed"`. The doc's own commentary (line 1233) calls C-6 one of "the interesting" assertions.

2. **The mastery path is disconnected.** BKT's P(L) — ADR-006, function F-7, the product's central number — has no defined route to the graph. The summarizer's `SELECT` (lines 332–340) returns `statements_compressed, mean_score, last_seen`; its Cypher (line 349) writes `SET m.mastery_score = row.mastery_score`, a column the SELECT never produces. `mv_student_concept_rollup` (485–500) doesn't compute it. `lrs.concept_mastery` (449–460) has the column but §5.3 step 5 (line 311) says `lrs.statements` is "the processor's **only** durable write," and step 4 puts BKT state in Redis — which §9 (line 1354) says is not backed up.

An architecture proof that emits a green checkmark and a null mastery score is worse than no proof.

## What we are proving

| Claim | Source | Test |
|---|---|---|
| **Burst insensitivity** — graph writes decouple from ingest | design §4.1 | `loadgen` at rate N vs. 5N; graph upserts/sec stays flat |
| C-1 — no per-statement vertices | spec line 259 | `MATCH (s:Statement) RETURN count(s)` = 0, enforced by constraints |
| C-3 — materialization is idempotent | spec line 261 | summarizer twice → graph byte-identical |
| C-6 — compression ratio observable per grain | spec line 264 | ratio ≥ 20:1 on seeded data, **asserted** |
| C-2 — summaries reproducible from the log | spec line 260 | `lrs replay --rebuild-graph` reproduces the graph |
| §5.4 — ingest never blocks on the graph | spec §5.4 | kill Neo4j → gateway still 200s |

**The burst test is a ratio, not a throughput number** — so a laptop suffices. Running 200→1000 stmt/sec and showing graph writes flat proves the same property as 10k→50k. Do **not** buy the hardware-requirements §8 server for this; that tier is sized for ~10,000 concurrent students and belongs to the classroom pilot, not here.

## Lift vs. rewrite

| Artifact | Design lines | Verdict |
|---|---|---|
| Dockerfile | 694–736 | **Lift verbatim.** Add `LABEL org.opencontainers.image.source` so GHCR links to this repo. |
| docker-compose.yml | ~768–1075 | **Lift, 3 fixes** (below) |
| .env.example | 1085–1105 | Lift verbatim |
| Makefile | 1109–1142 | Lift |
| ClickHouse DDL | 413–518 | **Lift, 2 fixes** (below) |
| Cypher constraints | 528–569 | Lift; verify composite uniqueness on Community (step 1) |
| Kafka topics | 402–409 | Lift; **48 → 6 partitions** for MVP |
| scripts/smoke.sh | 1169–1231 | **Do not lift. Rewrite.** |
| release.yml | 1294–1311 | Defer — abridged, `${DIGEST}` undefined |

### Fixes that must land with the lift

- **`smoke.sh`**: rewrite every check as `if ! ...; then exit 1; fi`. Tier it `--tier=ingest|graph|mastery` so each step has a real gate. Assert the C-6 ratio; don't print it.
- **`raw` column PII hole** (line 433, `-- the full original JSON, verbatim`; line 444, "kept forever"): the original JSON contains `actor.account.name`. Any analytics reader can `JSONExtractString(raw, 'actor', 'account', 'name')` and re-identify without vault access — contradicting §5.2's claim (line 297) that "nothing downstream of the processor ever sees anything but the derived key." Fix now: processor rewrites the actor block in `raw` before insert, **or** `raw` moves to an access-restricted table. Cheap today; brutal to retrofit across an immutable append-only log.
- **`last_seen` type** (line 497 `maxState(timestamp)`, line 338 `WHERE last_seen >= {watermark:DateTime64}`): `WHERE` runs pre-aggregation against an `AggregateFunction(max, DateTime64(3))` column — type error. Declare `last_seen SimpleAggregateFunction(max, DateTime64(3))` so it stays plain, filterable, and indexable. `HAVING maxMerge(...)` compiles but full-scans, destroying the "changed rows only" claim (line 330).
- **Mastery join**: processor writes `lrs.concept_mastery` alongside `lrs.statements`; summarizer JOINs it with the rollup. This is clearly the intent — it's why `lrs replay --into concept_mastery` exists (line 1138).
- **compose**: add a `vault-net` only `identity` joins and drop `vault-db`'s host port (hardware §8.2 calls this "a compliance boundary, not a scale-driven one"); add `vault-db` to `bootstrap`'s `depends_on` (it runs Alembic per §8.7); the ClickHouse/Neo4j healthchecks shell out to `wget`, which neither image reliably ships.
- **`.gitignore`**: add `.env`. It is **not** currently ignored, though `.env.example` line 1087 says it is.
- **`.dockerignore`**: exclude `docs/`, `site/` (5.4 MB), `.git`.

> **Do not touch** the single most load-bearing line: `gateway` must `depend_on` only `redpanda`. Adding `clickhouse` "for consistency" makes the analytics store an ingestion dependency and breaks spec §5.4.

## Repo layout (this repo, per decision)

```
pyproject.toml          [project.scripts] lrs = "lrs.cli:app"   ← shown nowhere in the docs
uv.lock                 must exist — Dockerfile runs `uv sync --frozen`
src/lrs/                cli.py, gateway/, processor/, summarizer/, identity/, ddl/
deploy/docker-compose.yml
scripts/smoke.sh
tests/                  test_c1_no_statement_vertices.py, test_c3_idempotent_resync.py
Dockerfile  Makefile  .dockerignore  .env.example
.github/workflows/docs.yml   paths: docs/**, mkdocs.yml       → mkdocs gh-deploy
.github/workflows/lrs.yml    paths: src/**, tests/**, Dockerfile, pyproject.toml
```

`mkdocs` only reads `docs_dir`, so `src/` is invisible to the site build. The existing `plugins/social_override.py` hook is unaffected. **Path filters are mandatory** — without them a prose typo rebuilds and rescans the image, and a code change redeploys the site.

Roles to build (10 of 13 CLI commands): `bootstrap`, `gateway`, `processor`, `summarizer`, `identity`, `loadgen`, `replay`, `healthcheck`, `seed --demo`. Skip `analytics-api`, `admin-api`, `dashboards`.

## Steps

**Step 1 — Foundation + an honest harness.** `uv init`, lift Dockerfile/compose/Makefile/DDL/Cypher with the fixes above. `lrs bootstrap` creates topics, DDL, constraints; `--verify` fails if any `:Statement` node exists. Write the **producer contract** (~1 page, `docs/specs/xapi-producer-contract-v1.md`): 2 verbs (`answered`, `experienced`), `object.id` = canonical published page URL, `grouping[0]` = textbook version IRI, required `result` fields. This pins the DDL and becomes loadgen's spec. It closes the top item in `TODO.md`, scoped minimally.

> Three sources currently disagree on the activity IRI: `sine-wave.js`'s `ACTIVITY_BASE_ID` points at `dmccreary.github.io/microsims/...`, but it's served from `learning-record-store/sims/sine-wave/`, and `smoke.sh:1190` uses a third form. Pin this before any statement is durable.

*Two things to prove on day 1, before writing Python:* do the compose healthchecks actually go healthy on the pinned tags, and does `REQUIRE (m.student_key, m.concept_id) IS UNIQUE` work on `neo4j:5.26-community`? Composite uniqueness sits adjacent to `IS NODE KEY`, which **is** Enterprise-only. Line 571 says those constraints *are* C-1's enforcement mechanism, and both compose and the §8 pilot tier run Community. Better to learn this in minute 10 than month 6.

**Exit:** `make up && lrs bootstrap --verify` green from a cold clone. `make smoke --tier=ingest` correctly **red**.

**Step 2 — Ingest path.** `lrs gateway` (FastAPI, UUIDv7 for time-sortable IDs, tier-1 validation, all-or-nothing batches per xAPI conformance, produce with `acks=all`) → `lrs processor` (consume ≤1000/200ms, pseudonymize via HMAC with salts from `lrs identity`, resolve IRIs, accept-first stub `MERGE`, batched INSERT, commit offset only after the ack). Land the `raw` PII fix here.

**Exit:** `make smoke --tier=ingest` green — **and provably red when the processor is broken.** Verify the harness before trusting it.

**Step 3 — loadgen that emits the real contract.** `lrs loadgen --rate N` generates exactly the step-1 contract shape. This is the bridge to instrumenting `lrs-data-model` later: same shape in, nothing downstream changes.

> Emit `answered` (MCQ) + `experienced` (page dwell) — **not** `interacted`. This is deliberate. `sine-wave.js:282` already builds well-formed xAPI, but emits `interacted` with `result.extensions.value` and **no `result.score`/`result.success`** — so `mv_student_concept_rollup`'s `countIfState(result_success IS NOT NULL)` yields `attempts = 0` and BKT has nothing to condition on. That's design §13.7 (nothing owns the continuous-interaction → soft-correctness mapping) made concrete. `answered` has a natural author-defined score, so the MVP dodges §13.7 entirely; `experienced`/dwell is a measured fact, not a derived score, and buys the ~40:1 ratio that makes C-6 demonstrable (quiz answers alone compress only ~3:1 — the worst grain).

**Exit:** loadgen sustains ≥200 stmt/sec against compose; ClickHouse row count matches emitted count exactly.

**Step 4 — Compression + graph.** Three rollup MVs (`concept_mastery`, `question_response`, `page_engagement` — **spec C-7 line 265 explicitly authorizes materializing fewer grains**, and `SUMMARIZER_GRAINS` is already the config knob at line 797). `lrs summarizer` on the 60s loop writing **absolute values — `SET`, never `+=`**. Land the mastery join. Write `SUMMARIZES`, `ENGAGED_WITH`, `RESPONDED_TO` edges, not just `HAS_MASTERY`/`OF_CONCEPT`.

> Skip `LearningSession` — its grain is unbuildable as specified. No sessionization gap threshold is defined anywhere in either doc.

**Exit:** `make smoke --tier=graph` green. C-1 = 0. C-3 double-run identical. C-6 ratio **asserted** ≥ 20:1. Mastery scores are non-null.

**Step 5 — The proof.** `lrs replay --rebuild-graph` (C-2). The burst test: loadgen 200 → 1000 stmt/sec, measure graph upserts/sec across the step. Chaos: `docker compose stop neo4j` → ingest continues, graph goes stale but never wrong.

**Exit:** **a chart showing ingest 5× while graph writes stay flat.** That is the architecture proven — or falsified, which is worth more.

## Deferred, explicitly

Experiments (spec §8) and the admin UIs (§10) entirely — an A/B test at n=50 is noise. 33 of 35 reports, `analytics-api`, dashboards, RBAC, audit, `meta-db`, OIDC/Keycloak, OneRoster, the reconciler *worker* (keep the accept-first stub `MERGE` — it's the non-blocking claim), Helm/KEDA/managed stores, cosign/SBOM/Trivy, the observability stack, the ADL conformance suite.

**D-4 (the privacy threshold that would blank every instructor dashboard) defers for free** — synthetic actors have no rostered scope. It bites the day a teacher logs in, which is exactly when it must be resolved. The design already flags it as "the one worth acting on before M3."

**What cannot be cut:** C-1/C-3 enforcement (cutting them means proving nothing), ClickHouse-as-SoR, `ReplacingMergeTree` idempotency, the absolute-write summarizer, and the pseudonymization boundary — the vault is ~100 lines, it's already in compose, it keeps the processor's hot path honest for throughput numbers, and it means the shape doesn't change the day a real roster arrives.

## Verification

```bash
make up && lrs bootstrap --verify     # constraints exist; zero :Statement nodes
make smoke --tier=ingest              # each tier a hard exit 1, never a decorative echo
make smoke --tier=graph
pytest tests/ -k "c1 or c3"           # test names cite spec IDs so drift fails CI
lrs loadgen --rate 200  --duration 300 && lrs loadgen --rate 1000 --duration 300
```

Then falsify deliberately: break the processor and confirm smoke goes red; `SET n.x = n.x + 1` instead of `SET n.x = $v` and confirm the C-3 test catches it. A harness that has never failed has never been tested.

## Follow-on (not this MVP)

Instrument `docs/sims/lrs-data-model/` with the step-1 contract — its quiz questions are already authored in `metadata.json` under `pedagogical.keyQuestions`, and `smoke.sh:1190` already uses that page's URL. The LRS textbook becomes the LRS's first customer, and because the emitter matches loadgen's contract, nothing downstream changes. Then: author-facing content analytics (R-303/R-306, no roster, no PII) → hardware §8 pilot tier + roster + D-4 → §13.7 retrofit spec + `interacted` → experiments.

## Amend the docs as we go

The specs are `status: scaffold` and this repo is their home. Fold back: the `smoke.sh` rewrite, the `last_seen` type, the mastery join, the `raw` PII resolution, and the IRI convention. Left unamended, the next reader inherits verified-broken copy-paste.