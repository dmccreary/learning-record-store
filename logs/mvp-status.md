# MVP Status — Session Handoff

**Last updated:** 2026-07-16
**Branch:** `main`
**Purpose:** Resume the LRS MVP build on a different machine without re-deriving anything.

> Named `mvp-status.md` (not `mvc-status.md`) — this tracks the **M**inimum **V**iable **P**roduct;
> "MVC" would read as model-view-controller to the next person.

---

## 1. Where we are, in one paragraph

The repo had a mature spec/design/hardware trio and **zero implementation**. We picked an MVP goal — **prove the architecture, don't chase a user** — and lifted the design doc's copy-paste-ready artifacts into real files, fixing four verified defects along the way. **Step 1 (foundation) is largely on disk. No Python exists yet.** The image cannot build until the `lrs` CLI and `uv.lock` are written, which is build step 1–2.

**Update 2026-07-16 — the infrastructure is real now.** Development moved to a 32 GB workstation, the
environment constraint is gone (§6), and **the two code-free infrastructure checks both passed** (§8):
all five backing services come up healthy, the compose file survives a real Compose v5, and composite
`IS UNIQUE` is confirmed enforceable on Neo4j Community — so C-1 needs no Enterprise license. The
"nothing here has ever been executed" caveat in §4 is now **partly retired**: the infrastructure has
run, the Python still does not exist. **The next physical action is writing the producer contract, then
the CLI.**

**Plan of record:** [`docs/specs/mvp-plan.md`](../docs/specs/mvp-plan.md) — the full approved plan (context, what we're proving, lift-vs-rewrite table, 5 steps with exit criteria, what's deferred).
**Environment runbook:** [`docs/specs/dev-environment-setup.md`](../docs/specs/dev-environment-setup.md) — how to provision and use the larger host.

---

## 2. Decisions locked (do not re-litigate)

| Question | Decision | Why it matters |
|---|---|---|
| Who is the first user? | **Nobody yet — prove the architecture** | The docs' M0–M5 roadmap doesn't reach a user until week 21 because dashboards need a roster + district agreement + FERPA consent. We instead validate the one falsifiable claim everything rests on (design §4.1: graph writes stay flat through a 5× ingest burst). |
| Where does code live? | **This repo, under `src/`** | Not a separate `dmccreary/lrs` repo, despite the design doc assuming one in ~6 places. **Consequence: GitHub Actions path filters are mandatory** so a prose typo doesn't rebuild the image and a code change doesn't redeploy the site. Not yet written. |
| First emitter to instrument? | **`docs/sims/lrs-data-model/`** | Its quiz questions are already authored in `metadata.json` (`pedagogical.keyQuestions`), and the design's own `smoke.sh` already uses that page's URL as its object IRI. **Deferred — not part of this MVP**; `loadgen` emits the same contract, so instrumenting later changes nothing downstream. |
| Container runtime? | **Docker Desktop** | On a headless Linux host the equivalent is Docker Engine — same `docker compose` CLI, identical compose file. Now on engine 29.6.1 / **Compose v5.3.0**; the file was authored against v2 and still parses clean. |
| Where does it run? | **Locally, on the 32 GB workstation** — *revised 2026-07-16* | Was "a larger remote host" when dev was stuck on an 8 GB laptop. That reasoning no longer applies: 23.43 GiB reaches containers, which covers every step including the step-5 burst test. No host to provision, nothing to rent. See §6. |
| Python tooling? | **`uv` — for everything, including tools not yet on it** *(2026-07-16)* | Already how the backend works: the Dockerfile runs `uv sync --frozen` and the Makefile runs `uv run pytest` / `uv run ruff`. The standing decision extends it: **new tooling uses `uv`; existing tooling migrates to it.** Not a taste call — `--frozen` + `uv.lock` is what makes "the image I build in September is the image I built in July" true, which is the precondition for trusting a burst-test number. **The outlier is the docs toolchain** (conda + pip at `~/miniconda3/envs/mkdocs`, with **no requirements file and no lockfile of any kind**) — which is precisely how click 8.3.1 silently killed `mkdocs serve`'s live-reload for an hour (see [`watcher-fix.md`](watcher-fix.md)). A lockfile would have made that impossible, and would make the `click!=8.3.*` constraint durable instead of a note in a doc. |

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
.github/workflows/{docs,lrs}.yml          # path filters (mandatory, see §2)
```

(`uv.lock` was listed twice here and `docs/specs/xapi-producer-contract-v1.md` is now **written** — see §8 step 3.)

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

## 6. Environment constraint — RESOLVED 2026-07-16

**The stack now runs locally. No remote host is needed for any step, including step 5.**

Development moved to a 32 GB / 10-core M-series machine with Docker Desktop. The rented-Hetzner
plan in [`dev-environment-setup.md`](../docs/specs/dev-environment-setup.md) §3–§4 is **no longer on
the critical path** — keep it as the fallback if this machine becomes unavailable, but do not
provision anything.

**The trap, if you ever move machines again:** RAM on the box is not RAM available to containers.
Docker Desktop had `MemoryMiB: 8092` in
`~/Library/Group Containers/group.com.docker/settings-store.json`, so a 32 GB host was still handing
containers only **7.65 GiB** — the same ceiling that drove the original 8 GB diagnosis, just relocated
from hardware into a config file. Raised to `24576` (**23.43 GiB** to containers, confirmed via
`docker info`). Check `docker info --format '{{.MemTotal}}'` before concluding anything about capacity;
`sysctl hw.memsize` will lie to you about what the stack can actually have.

- Steps 1–4 (correctness: C-1, C-3, C-6, mastery join) need ~8 GB. Satisfied with room to spare.
- **Step 5 — the burst test — needs 16 GB / 8 vCPU / local NVMe.** Now satisfied: 23.43 GiB, 10 vCPU,
  Apple internal NVMe. This matters for the reason §9 gives — on a saturated box a flat graph-write
  line is ambiguous between "the architecture works" and "loadgen never reached 1,000/sec." It is no
  longer ambiguous for lack of headroom.
- Measured idle footprint of the five backing services: **1.6 GiB** (ClickHouse 734 MiB, Neo4j 512 MiB,
  Redpanda 327 MiB, vault-db 25 MiB, Redis 10 MiB). The docs' ~8 GB figure is loaded-state, not idle.

### `mkdocs serve` live-reload was silently dead — FIXED 2026-07-16

Full writeup: [`logs/watcher-fix.md`](watcher-fix.md).

**`mkdocs serve` was watching nothing** — it served its startup build forever, with no error and no
warning. Root cause, bisected: **`click` 8.3.x breaks `mkdocs` 1.6.1's `livereload` default**, so
`livereload` arrived `False`, every `server.watch(...)` call behind that one gate was skipped, and the
observer never started. `watchdog` was innocent.

**Fixed:** `click` upgraded to **8.4.2** (`pip check` clean). Verified end to end: an edit now
propagates to the server in ~6s.

**The broken range is exactly `8.3.*`** — click **8.4.0 fixed it upstream**. So the fix is to move
*forward*. Do **not** pin `click<8.3`: mkdocs 1.6.1 is the newest mkdocs release, so no future mkdocs
upgrade would ever release such a pin, and this env would sit on click 8.2.1 indefinitely to avoid a
bug that no longer exists. If a constraint is ever written down, write `click>=8.4` (or
`click!=8.3.*`). With 8.4.2 installed, `pip install -U` is safe — the risk now is anything resolving
click *backwards* into 8.3.x.

**If it ever returns, the tell is one line.** A healthy `mkdocs serve` prints
`Watching paths for changes: 'docs', 'mkdocs.yml'` at INFO, between "Documentation built" and "Serving
on". **Absent = watcher not armed = nothing you edit will ever appear.** Grep for it before debugging
anything else.

> **Why this matters beyond dev comfort.** A `mkdocs serve` serving a stale build is a trap for every
> future MicroSim: the sim's JS 404s, and the obvious conclusion is that the instrumentation is
> broken. It is not — the server never rebuilt. It cost real time today; a live emitter looked broken
> when the page simply predated it.

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

**Steps 1 and 2 are DONE (2026-07-16). Both passed. Do not redo them.**

1. ~~**Provision the host.**~~ **Done — no host needed.** Runs locally; see §6. Docker Desktop present
   (engine 29.6.1, Compose **v5.3.0**), `uv 0.11.29` on PATH, `.env` created with generated secrets.

2. ~~**Run the two code-free infrastructure checks.**~~ **Done. Both green.** Results:

   - **`make stores` — all five services healthy on the first attempt.** ClickHouse, Neo4j, Redpanda,
     vault-db, Redis. This was the first time *anything in this repo had ever been executed*. The
     §5 healthcheck fix holds (the images really don't ship `wget`; the replacements work).
   - **Compose file survived first contact with real Compose.** It had only ever been checked by
     inspection and a YAML parser. `docker compose config` exits 0 with no warnings under **v5.3.0** —
     note the major-version jump from the v2.29.7 the file was written against. Verified in the
     *resolved* config: `NEO4J_AUTH` interpolated to the real password (the §3b blank-password trap did
     **not** fire), nothing resolved to empty, both `lrs-net`/`vault-net` exist, vault-db unpublished.
   - **Composite `IS UNIQUE` WORKS on `neo4j:5.26-community` — C-1 is enforceable.** This was the open
     worry (it sits next to `IS NODE KEY`, which *is* Enterprise-only, and design line 571 makes these
     constraints C-1's whole enforcement mechanism). Verified on 5.26.28 community, not assumed: the
     constraint registers as type `UNIQUENESS` over `["student_key","concept_id"]`, and a duplicate
     insert is **rejected** with `Node(0) already exists with label ConceptMastery and properties...`,
     leaving exactly 1 node. **No Enterprise license is needed for the pilot tier.**

   > **Probe hygiene, learned the hard way.** The first version of this probe `grep`ed the duplicate
   > insert's output for constraint-error text — and printed a confident "C-1 is NOT enforced" when the
   > *probe itself* had failed to run (zsh doesn't word-split unquoted `$VAR`, so the command never
   > executed and the grep matched nothing). That is defect §5.1 all over again, reproduced in the test
   > of the fix for §5.1. **Assert on state, not on error text**, and make the probe prove itself alive
   > before it is allowed to report a negative. The corrected probe uses node count as the oracle and
   > exits `2` (inconclusive) rather than reporting a finding when it cannot read that oracle. It also
   > **drops the constraint it created** — leaving it behind would later mask whether `bootstrap`
   > actually creates it from `neo4j.cypher`.

**Then, in order — resume here:**

3. ~~**Write the producer contract.**~~ **Done 2026-07-16** —
   [`docs/specs/xapi-producer-contract-v1.md`](../docs/specs/xapi-producer-contract-v1.md), added to the
   mkdocs nav, `mkdocs build --strict` clean. Every `file:line` citation in it was verified
   mechanically, not by eye. What it settles, and what it deliberately leaves open:

   - **The activity IRI is pinned:** `{site_url}` + nav path + trailing slash, where `site_url` is
     `mkdocs.yml`'s. Never `main.html`, never another site.
   - **The "three sources disagree" framing was wrong**, and the correction is worth carrying forward:
     `smoke.sh` and the design use the *same* IRI form and merely name a *different page* — not a
     conflict. There is exactly **one** malformed emitter (`sine-wave.js:29`, pointing at the
     `microsims` site *and* at `main.html`) and **one** placeholder (`lrs-design-v1.md:1194`'s
     `example.edu` grouping). `main.html` is the load-bearing half: it is the iframe payload, not the
     page, so citing it mints a second IRI for one activity and silently splits
     `student_page_rollup`'s `ORDER BY (district_id, student_key, object_id)` — which would corrupt the
     C-6 ratio at the producer, before any of our code runs.
   - **`completed` is out.** It is the *only* verb anywhere in the design (`lrs-design-v1.md:1187`) and
     it is neither of the two contract verbs. It carries no `success`, so a rollup fed by it reports
     `attempts = 0` forever. The `smoke.sh` rewrite to `answered` was right; the contract ratifies it.
   - **`object.definition.type` → `object_type` is NEW** — the design never defined it, yet two MVs
     filter on it. Undefined, both rollups are empty and C-6 measures nothing.
   - **Newly surfaced conflict (contract §6):** design line 309 says the processor *enriches*
     `concept_ids` from the structural graph; `smoke.sh:111` has the *producer* send them as an
     extension. Different architectures. v1 makes the producer authoritative because no structural
     graph is seeded — but this **changes the ingest contract**, so it is tagged OPEN, not silently
     decided.
   - **Needs your call (contract §2):** `#q{N}` is pinned **zero-based**, inferred from `smoke.sh:103`
     emitting `#q2` while `smoke.sh:105` names `keyQuestions[2]` zero-based. If you meant one-based,
     `smoke.sh` has an off-by-one and both change together.

3b. **Contract v1 amended the same day, and the first real emitter exists.** Three decisions were taken
   (all confirmed, none silent):

   - **`interacted` is now a third verb**, widening `mvp-plan.md:82`'s "2 verbs" scope. Forced by
     reality: `sine-wave.js` already emits it and its `index.md` argues for it at length. A slider drag
     is neither an answer nor dwell. `interacted` still carries `concept_id`, so it feeds
     `statements_compressed` — the C-6 signal — at `attempts = 0`.
   - **`object_type` gained `Control`** for sub-page elements (sliders, buttons). Needed because
     `mv_student_page_rollup` GROUPs BY `object_id` and control IRIs are fragment-qualified — a
     `MicroSim`-typed slider would become its own PageEngagement vertex. Free: the column is a
     `LowCardinality(String)`, not an `ENUM`, so no migration.
   - **`mv_student_page_rollup` widened to `object_type IN ('Page','MicroSim')`.** MicroSim dwell was
     being stored and then silently dropped at the rollup.

   **`docs/sims/bouncing-ball/`** is new — the reference emitter for contract §7's Start/Pause dwell
   pattern: Start records the clock and emits **nothing**; Pause emits **one** `experienced` carrying
   `result.duration`; a tab-hide flushes the open interval; a sub-250ms run is dropped as a mis-click.

   **This was verified by running it, not by reading it:**

   - Driven in a real browser. One Start→Pause cycle emitted exactly **one** statement, `PT26.12S`,
     object = the page IRI, typed `MicroSim`. The slider emitted a *different* shape — `interacted`,
     `#speed-slider`, typed `Control`, page as `parent`.
   - **The DDL was applied to live ClickHouse for the first time ever** — all 9 objects create cleanly,
     including the `SimpleAggregateFunction` fix and the `minmax` skip index.
   - Those *actual emitted statements* were mapped per contract §11 and pushed through the real DDL:
     `student_page_rollup` → 1 vertex, 26120ms dwell, Control excluded; `student_concept_rollup` →
     **2 statements → 1 `motion` vertex**, `attempts = 0`. C-6 compression, in miniature, measured.

   **"Fix the broken URI" was not one line.** `sine-wave.js` had **six** wrong URLs, not the one
   `mvp-plan.md:84` names. The instructive one: `grouping[0]` held *this sim's own page URL* where the
   textbook **version IRI** belongs — the wrong *kind* of thing, not just the wrong host. A
   search-and-replace on the hostname would have left `textbook_id`/`version_id` unparseable while
   looking fixed.

   > **Method note, earned three times today.** Every probe that reported a verdict it hadn't earned
   > did so the same way: treating *absence of an error* as *proof of a negative*. The C-1 probe
   > printed "NOT enforced" when the command never ran; a browser probe reported `runStartedAtSet:true`
   > by testing `undefined !== null`. **Assert on state, and make the probe prove itself alive before
   > it may report a negative.** The citation verifier is the same idea applied to prose — it caught
   > two claims that *my own edits* invalidated within the hour (`sine-wave.js:29` after I fixed it,
   > `clickhouse.sql:20` after I added `Control`). Line-number citations in a doc that lives beside the
   > code it cites go stale immediately; assert on content, not position.

3c. **The mastery path now has a real emitter — the biggest gap is closed.** An audit found that
   **no emitter in the repo produced `answered`**, and the only `result` field any of them emitted was
   `duration`. That left three things structurally dark: `mv_student_question_rollup` had never seen a
   real statement; the concept rollup's `attempts`/`successes` were **structurally zero** for every
   producer; and `lrs.concept_mastery` — BKT's P(L), F-7, the product's central number — had **no input
   path at all**. Step 4's mastery join was a fix for a null-forever bug that would still have joined
   against nothing.

   New: **`docs/chapters/01-what-is-an-ibook-lrs/`** (chapter, 1,850 words) + a 10-question `quiz.md`
   generated by the quiz-generator skill, made answerable by **`docs/js/quiz-xapi.js`** (site-wide,
   no-ops off quiz pages).

   - **The answer key is not duplicated in JS.** It is parsed out of the rendered
     `<details class="question">` that mkdocs-material generates from `??? question "Show Answer"`, so
     `quiz.md` stays the single source of truth. A quiz whose emitted `success` disagreed with its own
     displayed answer would be worse than no telemetry.
   - **The options are native radio buttons**, with a plain-language verdict under each question
     ("You answered B — incorrect. The correct answer is A.") and the chosen radio left checked. See
     the UI note below for why this was not the first attempt.
   - **Verified by driving it in a browser, then through the DDL.** Answering q1 right and q2 wrong
     emitted `success: true/scaled: 1` and `success: false/scaled: 0`. Mapped per contract §11 into
     live ClickHouse: question rollup → 2 questions, **2 attempts, 1 success**; concept rollup →
     **attempts = 2**, the first non-zero any producer has generated; page rollup → empty, correctly.
   - **The §1 local-serve rule works.** Served from `127.0.0.1:8899`, the emitted object IRI was still
     `https://dmccreary.github.io/learning-record-store/chapters/01-what-is-an-ibook-lrs/quiz/#q1` —
     the *published* IRI, as §1 requires. The script reconstructs it from the path rather than reading
     `window.location.origin`.
   - **Peeked answers emit nothing.** Reveal the explanation before choosing and no statement is sent,
     even if the choice is correct. Emitting `success: true` there would teach BKT precisely the false
     mastery it exists to detect. Same instinct as the bouncing ball's sub-250ms mis-click filter: not
     all interaction is evidence.

   **§2 is resolved: `#q{N}` is ONE-based**, one rule for every source (your call). The zero-based pin
   was an inference from `smoke.sh` — and the inference was reading a **latent off-by-one**, not an
   intent: the fragment was written as a zero-based array index while the question *name* beside it was
   chosen by counting the way a human does. Those two conventions were already in conflict *inside a
   single statement*; nothing had noticed because nothing consumed it. `smoke.sh` now emits `#q3`.

   > **Why the second emitter mattered more than more thinking.** A 4-question sim can hide an
   > off-by-one indefinitely. A quiz that prints "1." through "10." next to its own emitted IRIs
   > cannot. The bug was found by building a differently-shaped emitter, not by re-reading the first.

   > **A bug I introduced and caught.** Documenting the `#q3` fix, I put `#` comment lines *inside*
   > `smoke.sh`'s `<<JSON` heredoc — where they are not comments but payload, producing malformed JSON.
   > `bash -n` does not look inside heredocs, and `--tier=ingest` is *expected* to be red until step 2,
   > so this would have hidden for weeks and then looked like a gateway bug. Comments about a heredoc
   > payload go **above** the heredoc. The payload is now extracted and parsed as JSON as a check.

   > **UI note — verifying the mechanism is not verifying the feature.** The first version made the
   > `<li>` elements clickable. It worked, and it was useless: a plain list gives a reader **no signal
   > that it is answerable at all**, and the only affordance was `cursor: pointer`, which is invisible
   > until you happen to hover. Dan opened the page and could not tell how to answer or what had been
   > recorded — the emitter was live and would have collected nothing, because nobody would have known
   > to use it. **The verification gap was mine:** I tested by calling `.click()` from JavaScript and
   > screenshotting the page *after* clicking. I never looked at the resting state and asked whether a
   > person would know what to do. Same failure as the probes that reported unearned positives —
   > confirming the thing I was looking for instead of the thing that mattered. When a change has a
   > human in the loop, the resting state is the test. Now: native radios (which also bring real
   > keyboard and screen-reader semantics that the `role="button"` version only approximated), an
   > instruction line, and a written verdict per question.

4. **Then build step 2**: `uv lock`, `src/lrs/cli.py`, gateway, processor. Exit criterion: `make smoke` green — *and provably red when the processor is broken*.

   Three things `smoke.sh` does **not** yet cover, all introduced today: `interacted`, the §7 dwell
   pattern, and the quiz's `answered` path. Its single statement is one `answered` against
   `lrs-data-model`. A harness that has never failed has never been tested — and these paths have never
   been asserted at all.

**To rehydrate a Claude session**, point it at this file plus `docs/specs/mvp-plan.md`. Note that the session memory from the original machine (`~/.claude/projects/.../memory/`) is **local and does not travel with the repo** — these two docs are the durable handoff.

---

## 9. Sequencing reminder

All five steps now run on the one 32 GB workstation (§6), so the old per-step host column is dropped —
there is no longer a machine decision embedded in the sequence.

| Step | Deliverable | Exit criterion |
|---|---|---|
| 0 | *Infrastructure up, C-1 enforceable* | **DONE 2026-07-16** — 5/5 services healthy; composite `IS UNIQUE` enforces on community |
| 1 | Foundation + honest harness + producer contract | `make up && lrs bootstrap --verify` green from a cold clone; `make smoke` correctly **red** |
| 2 | Ingest path (gateway → processor → ClickHouse) | `make smoke --tier=ingest` green, and red when broken |
| 3 | `loadgen` at the contract shape | ≥200 stmt/sec; ClickHouse count == emitted count |
| 4 | Compression + graph + mastery join | `--tier=graph` green; C-1 = 0; C-3 identical; C-6 ≥ 20:1 **asserted**; scores non-null |
| **5** | **The proof** | **a chart: ingest 5×, graph writes flat** |

Step 5 is the point. Everything before it earns the right to measure.
