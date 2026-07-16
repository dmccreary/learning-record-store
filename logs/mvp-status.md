# MVP Status — Session Handoff

**Last updated:** 2026-07-16
**Branch:** `main`
**Purpose:** Resume the LRS MVP build on a different machine without re-deriving anything.

> Named `mvp-status.md` (not `mvc-status.md`) — this tracks the **M**inimum **V**iable **P**roduct;
> "MVC" would read as model-view-controller to the next person.

---

## 1. Where we are, in one paragraph

The repo had a mature spec/design/hardware trio and **zero implementation**. We picked an MVP goal — **prove the architecture, don't chase a user** — and lifted the design doc's copy-paste-ready artifacts into real files, fixing four verified defects along the way. **Step 1 (foundation) is largely on disk. No Python exists yet.** The image cannot build until the `lrs` CLI and `uv.lock` are written, which is build step 1–2. The next physical action is provisioning a bigger host (this laptop is 8 GB and too small) and running the two code-free infrastructure checks.

**Plan of record:** [`docs/specs/mvp-plan.md`](../docs/specs/mvp-plan.md) — the full approved plan (context, what we're proving, lift-vs-rewrite table, 5 steps with exit criteria, what's deferred).
**Environment runbook:** [`docs/specs/dev-environment-setup.md`](../docs/specs/dev-environment-setup.md) — how to provision and use the larger host.

---

## 2. Decisions locked (do not re-litigate)

| Question | Decision | Why it matters |
|---|---|---|
| Who is the first user? | **Nobody yet — prove the architecture** | The docs' M0–M5 roadmap doesn't reach a user until week 21 because dashboards need a roster + district agreement + FERPA consent. We instead validate the one falsifiable claim everything rests on (design §4.1: graph writes stay flat through a 5× ingest burst). |
| Where does code live? | **This repo, under `src/`** | Not a separate `dmccreary/lrs` repo, despite the design doc assuming one in ~6 places. **Consequence: GitHub Actions path filters are mandatory** so a prose typo doesn't rebuild the image and a code change doesn't redeploy the site. Not yet written. |
| First emitter to instrument? | **`docs/sims/lrs-data-model/`** | Its quiz questions are already authored in `metadata.json` (`pedagogical.keyQuestions`), and the design's own `smoke.sh` already uses that page's URL as its object IRI. **Deferred — not part of this MVP**; `loadgen` emits the same contract, so instrumenting later changes nothing downstream. |
| Container runtime? | **Docker Desktop** | On a headless Linux host the equivalent is Docker Engine — same `docker compose` CLI, identical compose file. |
| Where does it run? | **A larger remote host, not this laptop** | 8 GB M2 can't hold the stack (~8 GB resident; Neo4j alone 3.3 GB). See §6. |

---

## 3. What exists on disk

All committed to `main` and pushed as of this doc.

| File | State | Notes |
|---|---|---|
| [`docs/specs/mvp-plan.md`](../docs/specs/mvp-plan.md) | done | The approved plan. Read this first. |
| [`docs/specs/dev-environment-setup.md`](../docs/specs/dev-environment-setup.md) | done | Host sizing, provisioning, remote dev loop, security, teardown. |
| [`pyproject.toml`](../pyproject.toml) | done | Declares `[project.scripts] lrs = "lrs.cli:app"` — the entry point the design assumes but never writes down. Deps pinned; **`uv.lock` does not exist yet** and the Dockerfile's `uv sync --frozen` needs it. |
| [`Dockerfile`](../Dockerfile) | done | Lifted from design §8.2 (lines 694–736) + OCI source label. |
| [`deploy/docker-compose.yml`](../deploy/docker-compose.yml) | done | Lifted from §8.4 with 4 fixes (§5 below). Validated: YAML parses, anchors resolve, `gateway depends_on == [redpanda]`. |
| [`Makefile`](../Makefile) | done | `up/down/smoke/smoke-graph/smoke-mastery/perf/burst/rebuild`. |
| [`scripts/smoke.sh`](../scripts/smoke.sh) | done | **Rewritten, not lifted** — see §5. Tiered `--tier=ingest\|graph\|mastery`. `bash -n` clean. |
| [`src/lrs/ddl/clickhouse.sql`](../src/lrs/ddl/clickhouse.sql) | done | Event log + 3 rollup MVs + `concept_mastery`. Contains the `raw` PII fix, the `last_seen` type fix, and an **open question** (§7). |
| [`src/lrs/ddl/neo4j.cypher`](../src/lrs/ddl/neo4j.cypher) | done | Constraints = C-1's enforcement mechanism. Community-edition caveat flagged inline. |
| `.env.example`, `.dockerignore`, `.gitignore` | done | Committed alongside this doc — they were stranded uncommitted. |

## 3b. Does a fresh clone work? (tested 2026-07-16)

A real `git clone` of `main` into a clean directory was inspected. Result:

| Action | Works? |
|---|---|
| `git clone` → all docs, config, DDL, Makefile, smoke.sh present | **Yes.** `smoke.sh` keeps its executable bit; `.env` is ignored. |
| `cp .env.example .env` | **Yes** (it was stranded uncommitted until `bccbe6a`). |
| **`make stores`** — the five backing services, no image build | **Yes.** This is the day-1 path. |
| `make up` — full stack | **No.** The image build fails: `uv.lock` and `src/lrs/cli.py` don't exist. |
| `make smoke` | **No.** There is no gateway to post to. |

Two bugs the clone test caught, both now fixed:

- **`README.md` didn't exist**, but the Dockerfile does `COPY README.md ./` and `pyproject.toml` declares `readme = "README.md"` — the build would have failed on those lines. A README now exists.
- **`.env` lookup was ambiguous.** Compose resolves its project directory from the first `-f` file (`deploy/`), so a bare `docker compose -f deploy/docker-compose.yml` may look for `deploy/.env`, find nothing, and interpolate every `${VAR}` to **empty** — starting Neo4j with `NEO4J_AUTH: neo4j/` (blank password) instead of failing loudly. The Makefile and `smoke.sh` now pass `--env-file .env` explicitly, which is correct under either lookup rule. (Do **not** add `--project-directory` — the build `context: ..` resolves against it.)

## 4. What does NOT exist yet

**No Python at all.** This is the gap. Nothing can build or run until it's written:

```
uv.lock                   # `uv lock` — the Dockerfile's `uv sync --frozen` needs it
src/lrs/__init__.py       # the package itself
src/lrs/cli.py            # Typer app; dispatches 10 roles (ADR-005: one image, many roles)
src/lrs/config.py         # Pydantic Settings; crash on boot if a var is missing
src/lrs/bootstrap.py      # --create-topics --apply-ddl --apply-constraints --verify
src/lrs/gateway/          # FastAPI; UUIDv7; validate; produce acks=all
src/lrs/identity/         # per-district salt; HMAC pseudonymization
src/lrs/processor/        # consume -> pseudonymize -> enrich -> BKT -> ClickHouse
src/lrs/summarizer/       # 60s loop; absolute SET writes; the mastery join
src/lrs/loadgen.py        # synthetic firehose at the producer-contract shape
tests/                    # test_c1_no_statement_vertices.py, test_c3_idempotent_resync.py
uv.lock                   # `uv lock` — Dockerfile needs it
docs/specs/xapi-producer-contract-v1.md   # ~1 page; pins the statement shape
.github/workflows/{docs,lrs}.yml          # path filters (mandatory, see §2)
```

**Nothing in this repo has ever been executed.** No Docker runtime was installed on the laptop, so every artifact above is verified by inspection and structural validation only — never by running it. That is precisely the failure mode this MVP exists to correct, so treat "it looks right" as untested.

---

## 5. Verified defects found in the design doc (already fixed in the lifted files)

These were each confirmed against the source. Fixes are in the files; **the design doc itself has not been amended** — that's an open task (plan §"Amend the docs as we go").

1. **`smoke.sh`'s assertions don't assert.** Design lines 1169–1231 is M0's stated exit criterion. Three of five checks use `... | grep -q '^1$' && echo "✓ ..."`, which **exits 0 when the grep fails** — `set -e` is ignored for non-final commands in an `&&` list. Proven empirically. The C-6 compression block has no assertion at all; it prints a number and falls through to an unconditional `echo "✓ smoke passed"`. The doc's own commentary (line 1233) calls C-6 one of "the interesting" assertions. → Rewritten with `if ! ...; then fail; fi` throughout.

2. **The mastery path is disconnected.** BKT's P(L) (ADR-006 / F-7 — the product's central number) has no route to the graph. The summarizer's Cypher (line 349) writes `SET m.mastery_score = row.mastery_score`, but its SELECT (lines 332–340) never produces that column and `mv_student_concept_rollup` (485–500) never computes it. It would write **null forever**. → Processor writes `lrs.concept_mastery`; summarizer JOINs it. (This is clearly the intent — it's why `lrs replay --into concept_mastery` exists at line 1138.)

3. **The `raw` column defeats the pseudonymization boundary.** Design line 433 specifies "the full original JSON, verbatim", kept forever (line 444). That JSON contains `actor.account.name`, so any analytics reader could `JSONExtractString(raw,'actor','account','name')` and re-identify **without vault access** — contradicting §5.2's claim (line 297) that "nothing downstream of the processor ever sees anything but the derived key." → Processor rewrites the actor block before insert; `smoke.sh --tier=ingest` asserts the boundary on every run.

4. **The summarizer's incremental read doesn't compile.** `WHERE last_seen >= {watermark:DateTime64}` (line 338) filters an `AggregateFunction(max, DateTime64(3))` column pre-aggregation — a type error. `HAVING maxMerge(...)` compiles but full-scans, destroying the "changed rows only" claim (line 330) at 400M rows. → `SimpleAggregateFunction(max, DateTime64(3))` + a `minmax` skip index.

Plus smaller ones: compose had no `networks` at all (vault-db reachable by everything, and publishing port 5433 to the host); `bootstrap` raced vault-db despite §8.7 running Alembic against it; ClickHouse/Neo4j healthchecks shell out to `wget`, which neither image reliably ships; `.gitignore` didn't ignore `.env` though `.env.example` line 1087 claims it does.

---

## 6. Environment constraint

**This laptop (8 GB M2) is too small and the decision is to not run the stack on it.** No container runtime is installed (no Docker Desktop/OrbStack/colima/podman). Homebrew is available.

- Steps 1–4 (correctness: C-1, C-3, C-6, mastery join) fit on a **dedicated 8 GB** box.
- **Step 5 — the burst test — needs 16 GB / 8 vCPU / local NVMe.** On a saturated box a flat graph-write line is ambiguous: it could mean the architecture works, or that loadgen never pushed 1,000/sec. NVMe matters because AWS's default network-attached EBS would contaminate the number (hardware §8.2).
- Recommended: Hetzner CPX41 or equivalent, by the hour (~€0.20 per burst session), destroy after.

Full provisioning steps, remote dev loop, and security in [`dev-environment-setup.md`](../docs/specs/dev-environment-setup.md).

---

## 7. Open question — needs a decision before step 4

**Materialized views double-count on Kafka redelivery.** The MVs fire on the *insert stream*, not on the deduplicated table; `ReplacingMergeTree` dedup is eventual, at merge time. So a statement redelivered because the processor crashed after the ClickHouse ack but before the offset commit is counted **twice** in every rollup, and the resulting absolute is silently wrong — the exact failure ADR-002's absolute-write design exists to prevent.

**C-3 does not catch this**: re-running the summarizer over an already-inflated rollup is perfectly idempotent. It just materializes the wrong number twice.

Candidates (documented at the bottom of `src/lrs/ddl/clickhouse.sql`):
- **(a)** Gateway-side dedup on `statement_id` via Redis `SETNX` before produce — cheap, but Redis is "not backed up" (§9) and a miss reopens the hole.
- **(b)** `insert_deduplication_token = statement_id` on the processor's INSERT — native, but block-level dedup is `Replicated*`-only, forcing `ReplicatedReplacingMergeTree` even single-node.
- **(c)** Accept it, reconcile nightly from `lrs.statements_deduped` — cheapest, but means the graph is provably-wrong-but-eventually-right, contradicting §9's "the graph goes stale but is never wrong."

Left open because it changes the ingest contract, not just the schema.

---

## 8. Resume here — exact next actions

**On the new machine:**

```bash
git clone https://github.com/dmccreary/learning-record-store.git
cd learning-record-store
git log --oneline -3          # expect the handoff commit on top of 2421a9a
```

**Then, in order:**

1. **Provision the host** per [`dev-environment-setup.md`](../docs/specs/dev-environment-setup.md) §3–§4. If the new machine has 16 GB+, just install Docker Desktop and use it directly.

2. **Run the two code-free infrastructure checks** (`dev-environment-setup.md` §4a step 5). These need **no Python** and de-risk the two assumptions everything rests on:
   ```bash
   cp .env.example .env && $EDITOR .env      # change every password
   make stores                               # backing services only; prints health
   ```
   Then: **does composite `IS UNIQUE` work on `neo4j:5.26-community`?** It sits adjacent to `IS NODE KEY`, which *is* Enterprise-only, and design line 571 says these constraints **are** C-1's enforcement mechanism. If it needs Enterprise, C-1 is unenforced in dev *and* in the pilot tier — a finding worth having in minute 10 rather than month 6.
   ```bash
   source .env
   docker compose -f deploy/docker-compose.yml exec neo4j cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
     "CREATE CONSTRAINT mastery_grain IF NOT EXISTS
      FOR (m:ConceptMastery) REQUIRE (m.student_key, m.concept_id) IS UNIQUE;"
   ```

3. **Write the producer contract** (~1 page, `docs/specs/xapi-producer-contract-v1.md`) — 2 verbs (`answered`, `experienced`), `object.id` = canonical published page URL, `grouping[0]` = textbook version IRI, required `result` fields. It pins the DDL and becomes loadgen's spec. **Three sources currently disagree on the activity IRI** (`sine-wave.js`'s `ACTIVITY_BASE_ID`, the page's actual served URL, and `smoke.sh:1190`) — pin it before any statement is durable.

4. **Then build step 2**: `uv lock`, `src/lrs/cli.py`, gateway, processor. Exit criterion: `make smoke` green — *and provably red when the processor is broken*.

**To rehydrate a Claude session**, point it at this file plus `docs/specs/mvp-plan.md`. Note that the session memory from the original machine (`~/.claude/projects/.../memory/`) is **local and does not travel with the repo** — these two docs are the durable handoff.

---

## 9. Sequencing reminder

| Step | Deliverable | Exit criterion | Host |
|---|---|---|---|
| 1 | Foundation + honest harness + producer contract | `make up && lrs bootstrap --verify` green from a cold clone; `make smoke` correctly **red** | 8 GB |
| 2 | Ingest path (gateway → processor → ClickHouse) | `make smoke --tier=ingest` green, and red when broken | 8 GB |
| 3 | `loadgen` at the contract shape | ≥200 stmt/sec; ClickHouse count == emitted count | 8 GB |
| 4 | Compression + graph + mastery join | `--tier=graph` green; C-1 = 0; C-3 identical; C-6 ≥ 20:1 **asserted**; scores non-null | 8 GB |
| **5** | **The proof** | **a chart: ingest 5×, graph writes flat** | **16 GB NVMe** |

Step 5 is the point. Everything before it earns the right to measure.
