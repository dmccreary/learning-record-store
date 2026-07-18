# TODO

## Learning graph — quality follow-up

- **Tighten the terminal-node rate in `docs/learning-graph/learning-graph.csv`.**
  `quality-metrics.md` (2026-07-17, 578 concepts / 871 edges) reports **49.8%
  terminal nodes** — concepts nothing depends on — against the analyzer's
  healthy 5–40% band. Everything else checks out clean: valid DAG, 0 cycles,
  0 orphaned nodes, 1 connected component, 5 foundational roots, average 1.52
  deps/concept. Overall assessed quality: **~83/100**.
  - **Why it's high:** Part 2 (the spec/design concepts, IDs 61–427) contains
    hundreds of granular implementation facts — individual Makefile targets,
    named failure modes, deployment-supply-chain steps — that are genuine
    leaves. Nothing in the source spec builds *on top of* "GHA Layer Cache"
    or "Chaos Kill Test," so this isn't a construction error.
  - **Proposed fix:** thread ~40–60 additional cross-links from those Part 2
    leaves into the testing/failure-mode/roadmap clusters (IDs 320–369) and
    into Part 3's report concepts (IDs 479–530), which should pull the rate
    down toward the healthy range without changing what's covered or
    renumbering anything (dependencies only ever need to reference existing,
    lower-numbered IDs).
  - **Status:** deferred at the user's request — they wanted to see the
    rendered graph viewer first before approving more cross-links. Revisit
    once reviewed.

## Skill improvements

- **Teach the `microsim-generator` Mermaid guidance the LR-vs-TD narrow-column rule.** This
  session converted 9 of 11 `flowchart LR` diagrams under `docs/sims/*/main.html` to `flowchart
  TD` so they'd fit a chapter's narrow iframe column instead of squeezing illegibly-small text
  into ~436px — full writeup in
  [`logs/flowchart-lr-and-td-analysis.md`](logs/flowchart-lr-and-td-analysis.md). The user called
  the analysis "excellent work" and was explicitly happy with the empirical-verification approach,
  which is the reason this is worth generalizing rather than re-deriving from scratch next time.
  - **The reusable rule:** Mermaid's dagre layout stacks disconnected components (or sibling
    subgraphs with no edge between them) along the axis *perpendicular* to the flow direction —
    so LR stacks them narrow (good for a narrow column) and TD would spread them wide (bad). A
    single **connected** graph (chain/tree/diamond) does the opposite: LR is wide and TD collapses
    it narrow. The fix must check connectivity before flipping direction, not just search-and-replace.
  - **Proposed addition:** in the `microsim-generator` skill's Mermaid section (and/or
    `microsim-utils`), add a decision check — "does this diagram contain >1 connected component or
    sibling subgraphs joined only by proximity? If yes, keep/prefer `LR` for narrow embedding; if
    it's one connected component, prefer `TD`." Document the empirical test method too (temporarily
    flip direction, reload in-repo, read the SVG `viewBox` via JS) since layout behavior isn't
    reliably predictable from the source alone.
  - **Status:** not started — flagged here rather than edited directly, since it changes shared
    skill guidance rather than this project's content.

## Open specification work

- **Retrofit specification for existing intelligent textbooks.** Write a new
  specification covering how *existing* intelligent textbooks — which already
  contain interactive MicroSims (p5.js simulations, etc.) and interactive
  infographics — get retrofitted to emit xAPI statements and integrate with
  this LRS. Neither [`docs/specs/lrs-spec-v1.md`](docs/specs/lrs-spec-v1.md)
  nor [`docs/specs/lrs-design-v1.md`](docs/specs/lrs-design-v1.md) currently
  addresses the *producer* side of the system — both are scoped to the LRS
  backend itself (see `lrs-design-v1.md` §1.3, "What This Document Decides,
  and What It Defers"). Candidate topics for the new spec:
  - A contract for MicroSim/infographic authors: which xAPI verbs and
    activity types to use, and required vs. optional `result` fields.
    **Largely delivered** by
    [`docs/specs/xapi-producer-contract-v1.md`](docs/specs/xapi-producer-contract-v1.md),
    but that document tells an author *how* to emit. It does not tell them
    *what is worth emitting at all*, which is the harder half and the part a
    teacher-author most needs. See **"OPEN DESIGN QUESTION: should an emitter
    track hover *and* click?"** below — that is the first worked example for a
    future **guide for MicroSim instructional designers**, whose thesis is
    *instrument the act you designed; do not infer from the act you did not.*
    Related open questions already logged for that guide: whether a hotspot's
    `object_type` should depend on explore-vs-quiz mode, and whether a diagram
    node click is `interacted` or something the verb set does not yet have.
  - Client-side emission strategy guidance — when to send an event
    immediately, batch, or throttle by a threshold/deadband (see the
    Architecture Trade-off discussion in
    [`docs/sims/sine-wave/index.md`](docs/sims/sine-wave/index.md) for a
    worked example: send-every-interaction vs. summary-on-blur vs.
    threshold-triggered sending).
  - How a continuous, exploratory interaction (a slider, a drag target) with
    no single "correct" per-event value supplies evidence to
    `ConceptMastery`'s BKT update — this is currently an explicit open
    question in `lrs-design-v1.md` §13, item 7.
  - A migration/rollout plan for MicroSims and infographics that predate the
    LRS and were never instrumented, including versioning so that changing a
    MicroSim's scoring logic doesn't silently reinterpret historical
    evidence.
  - Where the "two-codebases problem" gets resolved: whether scoring logic is
    duplicated between the client and the LRS's compression pipeline, shared
    via a declarative per-MicroSim descriptor, or deliberately kept as two
    independent implementations (fast local feedback vs. authoritative
    server truth).

---

## MicroSim emitter coverage — diversify the producers

**Goal:** exercise the xAPI → LRS chain from producers of genuinely different *shapes*, not more of
the same shape. Each entry below names what it proves that nothing currently proves, and the contract
question it forces. Contract = [`docs/specs/xapi-producer-contract-v1.md`](docs/specs/xapi-producer-contract-v1.md).

Templates live in the `microsim-generator` skill:
`assets/templates/{p5,chartjs,plotly,mermaid,vis-network,timeline,map}`.

### Already closed (2026-07-16) — do not redo

| Path | Closed by | Verified |
|---|---|---|
| `experienced` + `result.duration` → `dwell_ms_total` | `sims/bouncing-ball` (Start/Pause, contract §7) | Browser + live ClickHouse: 1 vertex, 26120ms |
| `interacted` → Control, concept rollup `statements_compressed` | `sims/sine-wave`, `sims/bouncing-ball` | ✔ |
| **`answered` + `result.success` + `score.scaled`** | `chapters/01-what-is-an-ibook-lrs/quiz.md` + `docs/js/quiz-xapi.js` | Question rollup: 2 attempts, 1 success. Concept `attempts=2` — first non-zero from any producer. |
| `Page` / `MicroSim` / `Question` / `Control` type mapping | contract §5 | ✔ |
| **Non-p5 emitter — the contract is library-agnostic** | `sims/scientific-method` (Mermaid) | Browser + live ClickHouse. See below. |
| Hover-as-evidence, with a dwell threshold | `sims/scientific-method` | Sweeping 5 nodes instantly → **0 statements**; a >0.6s pause → 1. |
| Fragment rule for **named** (non-question) sub-activities | contract §2 | `#hypothesis`, `#speed-slider` — name, not ordinal. |
| **Dual-mode: two verb families from one artifact** | `sims/animal-cell` (image-overlay hotspots) | Browser. Explore → `interacted`/Control; quiz → `answered`/Question. See below. |
| **`object_type` does not depend on UI mode** | contract §5 "one object, one type" | `#nucleus` (Control) vs `#q-nucleus` (Question) — two objects, not one retyped. |
| **The first BKT sequence** | `sims/animal-cell` quiz | 3 clicks → `false,false,true` on ONE IRI → rollup `attempts=3, successes=1`. |
| **Shared `docs/js/lrs-xapi.js` extracted** | `sims/animal-cell` is the first consumer | Derive beats hardcode: localhost iframe `…/main.html` → published page IRI. Older four **not** migrated. |

**Note:** "instrument `lrs-data-model`'s keyQuestions" was the original #1 recommendation. The chapter
quiz closed the `answered` gap instead, so that work is now **optional**, not blocking. It would still
be the natural way to test `#q{N}` against a `keyQuestions` array (contract §2's other source type).

### What `scientific-method` (Mermaid) settled — 2026-07-16

The **non-p5 claim is now proven**: every other emitter is p5.js, and the contract survived a
Mermaid/SVG artifact with a completely different interaction model (hover, not manipulation) without
amendment to the verbs or the type mapping. That was the reason to build it first.

It also produced findings that are **not** Mermaid-specific and apply to everything after it:

- **Hover needs a dwell threshold or it fabricates evidence.** A mouse crossing a tall top-down
  workflow enters and leaves a dozen nodes in a few hundred ms. Without the 0.6s gate that is 12
  statements from one meaningless movement. Same family as the bouncing ball's sub-250ms mis-click
  filter and sine-wave's slider deadband: **not all interaction is evidence**, and each new
  interaction *class* needs its own answer to "what here is real?"
- **A pin and a hover on one visit are ONE engagement, not two.** Clicking all 12 nodes emitted **24**
  statements before this was fixed — every node produced both. Pinning is simply the stronger evidence
  for the same act, so it must *suppress* the hover, not merely restart its clock. Any emitter with two
  overlapping interaction paths on one object has this bug latent in it.
- **Per-node dwell reaches no rollup** (contract §12 item 9). `Control` statements carry
  `result.duration`, but `mv_student_page_rollup` sums duration while excluding `Control`, and
  `mv_student_concept_rollup` ignores duration entirely. "Which step did they labour over?" lives only
  in `lrs.statements`. Fine for now — the log is the system of record, so a rollup can be added later
  without re-collecting — but a dashboard cannot show it today.
- **The same activity in two textbooks is indistinguishable in every rollup** (contract §12 item 8).
  `scientific-method` is embedded by physics and chemistry too. Its `object.id` is its canonical URL, so
  it is the *same IRI* everywhere; only `grouping[0]` differs. No rollup keys on `textbook_id`, so
  exposures **merge into one vertex**. Verified with two real sessions: both merged into a single
  `PageEngagement` with dwell summed (137.6s). `lrs.statements` retains `textbook_id`, so it is a log
  question, never a `ConceptMastery` question. **Consequence: a student skimming because they met the
  material in physics looks identical to one who did not engage.** Low engagement ≠ low mastery.
- **Engagement mode is not recoverable from the graph.** A click-through session and a hover-only
  session produce *identical* ConceptMastery rows — `engagement-mode` exists only in the log. Same
  shape of finding as the textbook one: the rollup is a deliberate projection, and what it drops is
  gone from the graph forever.
- **It cannot measure understanding, and no amount of hover data will change that.** 24 node statements
  → 9 ConceptMastery vertices with **`attempts = 0` on every one**, measured. Only `answered` carries
  `result.success`. `metadata.json` has no `keyQuestions`; adding them (wired like the chapter quiz) is
  what would give this diagram a mastery signal.

### What `animal-cell` (image-overlay hotspots) settled — 2026-07-16

The **dual-mode claim is proven**: one artifact, two verb families, no amendment to the verb set. It
is also the first emitter to consume `docs/js/lrs-xapi.js` rather than copy it. Findings that are
**not** specific to this sim:

- **`object_type` is a property of the object, not of the UI mode** — now contract §5. The tempting
  answer was one IRI (`#nucleus`) retyped per mode. Rejected: that is §1's `main.html` defect from the
  other direction — *two activities with one identity* instead of one activity with two. Today's
  rollups happen to keep them apart by type filter, which is what makes it dangerous: correct by
  accident of the current DDL, not by construction. **The tell that two acts are two objects: they
  need different `result` fields to be honest.** An inspection has no `success`; an answer must have
  one.
- **§2's ordinal rule was wrong, and only a real artifact could show it.** `initQuiz()` does
  `sort(() => Math.random() - 0.5)` — the question order reshuffles **every load**, so `#q1` names a
  different question each time and `mv_student_question_rollup`'s `GROUP BY object_id` would average
  six unrelated questions into six position-keyed rows. **Worse than collecting nothing, because it
  looks like data.** §2's own test catches it — "would an edit that does not change what the thing
  *is* change its IRI?" — except here not even an edit is needed; *a reload* does it. Amended: the
  ordinal requires a stable presentation order.
- **The first BKT sequence exists, and brute-force is why it must.** Verified: 3 clicks → 3
  `answered` on one IRI, `false,false,true` → `attempts=3, successes=1`. With six hotspots a student
  can click every marker and be *guaranteed* correct. Emitting only the success would make that
  student **identical** to one who knew it instantly. The sequence is not noise around the signal —
  for click-to-identify it *is* the signal. Consistent with `quiz-xapi.js`'s peek rule rather than an
  exception to it: both are *do not report success the interaction does not support.*
- **The hover middle path is not a general rule — it depends on whether click is a separate act.**
  The open question below proposes dropping `concept_id` from hover so only pins count. **Applying
  that here would have inverted the very bias it exists to prevent.** `diagram.js` wires hover and
  click to the *same function* — there is no pin, and click is simply what hover is called on a
  touchscreen. Demoting hover would have counted tablet users and discarded laptop users for the
  identical act. Verified: a bare tap with zero hover dwell still emits exactly one statement.
  **Revised rule: weight hover against click only where clicking is a separate designed act.**
- **Deriving the page IRI needs a rule the old derive-based copy did not have.** `quiz-xapi.js`
  stripped only the site base path — correct for a site page, and it would have produced
  `…/sims/animal-cell/main.html` inside an iframe, the exact IRI §1 forbids. Stripping the payload
  filename is what makes one rule serve both. Also learned: **`mkdocs serve` honours `site_url`'s
  base path locally** (it 302s `/` → `/learning-record-store/`), so the strip is exercised in dev, and
  `quiz-xapi.js`'s comment claiming "locally the path is `/chapters/x/quiz/`" is wrong — harmless,
  because the strip is conditional, but wrong.
- **A vendored shared library can be instrumented without forking it.** `diagram.js` is vendored
  byte-identical from `../biology` and shared by many sims there. `xapi.js` wraps three of its methods
  and adds listeners alongside its own — possible only because `diagram.js` assigns handlers as
  *properties* (`btn.onclick = …`), which `addEventListener` coexists with. Worth knowing before the
  next transplanted sim: **check how the upstream binds handlers before planning to instrument it.**
- **Test-harness lesson, recorded because it produced a false result first.** A background tab clamps
  `setTimeout` to ~1s, so a scripted "40ms sweep" dwelled ~1000ms and emitted **19 statements** —
  which reads exactly like a broken threshold. The threshold was fine; the *test* was measuring the
  clamp. A synchronous busy-wait on `Date.now()` is immune and gave the real answer (0 / 0 / 1). Any
  future timing-sensitive verification in this repo needs the same treatment.

### Ranked

**1. `vis-network` concept map — highest value, closes two dark areas at once.**
   - **Non-p5.** *Every* emitter today is p5.js. The contract claims to be library-agnostic and
     **nothing proves it.** A contract that only works for one rendering library is not a contract.
   - **Multi-concept.** A concept map's nodes *are* concepts; one interaction legitimately touches
     several. This forces contract §12 open item 5: `ext/concept_id` is a **single string**, and
     `concept_ids` is `Array(String)` in the DDL. If a node click covers three concepts, v1 cannot say
     so. Either add `ext/concept_ids` (array) in v1.1 keeping the singular as an alias, or decide
     multi-concept is out of scope — but decide it against a real artifact.
   - Forces: what verb is a node click? Not `answered` (no success), not `experienced` (no interval).
     Probably `interacted` → `Control` with a node fragment IRI — but then the fragment scheme (§2 is
     only defined for `#q{N}`) needs a rule for non-question sub-activities.

**2. `chartjs` — non-p5 with a different interaction grammar.**
   - A **legend toggle** is a Control with no scalar value — `sine-wave` and `bouncing-ball` both emit
     `ext/value` as a number. Tests whether `result.extensions` generalizes past sliders.
   - A **data-point click** is an inspection, not a manipulation. Verb? Nothing in §3 obviously fits.
   - Chart.js has its own event model (`onClick` with element lookup), so it independently tests that
     the emission strategy (deadband, contract §7 / sine-wave's Options A/B/C) is not p5-specific.

~~**3. `mermaid`**~~ — **DONE 2026-07-16**, `sims/scientific-method`. See "What it settled" above.

~~**3. Interactive poster with hotspots**~~ — **DONE 2026-07-16**, `sims/animal-cell`. See "What
   `animal-cell` settled" below. Both claims held: dual mode forced the `object_type` question (now
   answered in contract §5), and it exposed a §2 defect nobody had predicted. Cardinality was tested
   at **6** hotspots, not the twenty this item imagined — 12 fragment IRIs across two modes on one
   page. That is enough to prove the fragment scheme and `GROUP BY object_id` behave; it is *not*
   enough to say anything about scale.

**4. Continuous 2D drag** (p5, but a new interaction class).
   - A slider has a natural quantum (`range/60`, per sine-wave's deadband). Dragging a point on a
     canvas has none, and `mouseDragged` fires per frame. This is the worst case for emission
     strategy, and it gives `loadgen` a realistic burst *shape* rather than a synthetic one.

### What no MicroSim can cover — do not wait on these

| Gap | Why a sim can't do it | Owner |
|---|---|---|
| `revisit_count` | It is `AggregateFunction(uniq, Date)` — the **only** non-`Simple` aggregate in the DDL, and the only one needing `uniqMerge` at read time. Needs statements spanning multiple **days**. | `loadgen` with backdated timestamps |
| Pseudonymization boundary (§8) | Every emitter hardcodes `demo-student`. One actor never exercises the per-district HMAC. | `loadgen` with many actors |
| F-3 retraction / `voided_by` | Voiding is an API call, not an emission. **And it does not work the way the DDL says** — see "Voiding cannot work incrementally" below. | gateway/API work |
| ~~BKT **sequences**~~ | **CLOSED 2026-07-16** by `sims/animal-cell`'s retry-until-correct quiz: 3 clicks → `false,false,true` on one IRI → `attempts=3, successes=1`. `loadgen` is still wanted for *cross-session* sequences (this one is within a single question). Contract §12 item 6. | done / `loadgen` for multi-day |

### LRS backend — what the first real inspection of ClickHouse found (2026-07-16)

Prompted by a simple question — *"did the animal-cell events reach the LRS?"* — which forced the first
look at the actual database rather than at emitters. Two findings, one of them a correctness bug in a
design claim.

#### Nothing has ever POSTed. "Verified against live ClickHouse" does not mean what it looks like.

`lrs.statements` contains **0 rows**. Not zero animal-cell rows — zero rows, and `max(stored_at)` is
the Unix epoch. Confirmed alongside: no emitter contains any network call (`grep` for `fetch(`,
`XMLHttpRequest`, `sendBeacon`, `axios`, `.post(` across `docs/js/` and `docs/sims/*/*.js` → nothing),
`src/lrs/` contains only `ddl/`, and nothing listens on `:8080`.

**So how were the "Browser + live ClickHouse" rows in the Already-closed table verified?**
`system.mutations` answers it — four rounds of hand-inserted probes, each cleaned up after:

```
UPDATE _row_exists = 0 WHERE district_id = 'probe-district'   16:00
UPDATE _row_exists = 0 WHERE district_id = 'e2e-district'     16:05
UPDATE _row_exists = 0 WHERE district_id = 'quiz-district'    16:35
UPDATE _row_exists = 0 WHERE district_id = 'sm-district'      17:46
```

The browser produced a statement *shape*; a human copied it into an `INSERT` and checked the rollups.
**That is a real and worthwhile test of the DDL — but it is not a test of the producer→LRS path, and
nothing in the table's phrasing says so.** Those rows should be read as "the DDL does the right thing
when given this shape", never as "this sim's statements arrive". Re-read them that way until the
gateway exists.

Residue of that method: 26 rows are still physically present in the `202607` part
(`system.parts.rows = 26`) while `count()` returns 0 — lightweight deletes mask rows rather than
removing them until merge.

#### Voiding cannot work incrementally — `clickhouse.sql:167` is wrong

The comment above `mv_student_concept_rollup` claims:

> "A voided statement (F-3) drops out of the rollup automatically and the next sync writes the
> corrected absolute. Retraction needs no special path — it is just another input to a pure function."

**It does not, and it cannot.** Two independent reasons, either of which is fatal:

1. **A ClickHouse MV is an INSERT TRIGGER, not a view.** Its `SELECT` — including
   `WHERE voided_by IS NULL` — is evaluated *only* over the block being inserted into `lrs.statements`.
   Setting `voided_by` on a row that is already stored is a **mutation**, and mutations do not re-fire
   the MV. The rollup row that statement already contributed to stays exactly as it was.
2. **The targets are additive aggregates over unsigned integers.** All three rollups are
   `AggregatingMergeTree` whose counters are `SimpleAggregateFunction(sum, UInt64)`. Even if you
   *could* re-fire the MV on a void, the only thing an insert can do is **add**. Retracting evidence
   requires writing a negative delta, and `UInt64` cannot hold one.

**Proved by accident, and the proof is still sitting in the database.** `probe-district`'s statements
were removed from `lrs.statements` via lightweight delete, yet its row survives in
`student_concept_rollup`:

```
district_id: probe-district   student_key: probe-student   concept_id: motion
statements_compressed: 2      attempts: 0                  successes: 0
```

An orphan: a concept vertex with no backing evidence anywhere in the log. Deleting is not voiding, but
it is the *same mechanism* — a mutation on the source that the MV never sees — so voiding will behave
identically.

**Consequence.** Retraction needs a **full recompute of the affected key**, not an incremental
correction. That is presumably why `lrs replay` exists (`clickhouse.sql:92` already reaches for it for
`concept_mastery`), but the comment as written would lead someone to implement the void API, watch the
log update correctly, and never notice the rollups did not move — and the graph would be silently
wrong in the direction of *over-reporting* evidence, which is the dangerous direction.

**Actions:**
- [ ] Correct the `clickhouse.sql:167` comment — it is actively misleading and cheap to fix.
- [ ] Decide the retraction path before the void API is built: replay-per-key, or a
      `sign`-column/`CollapsingMergeTree`-style design that *can* represent a negative delta. This is a
      DDL decision, and it is much cheaper now than after the rollups hold real data.
- [ ] Delete the orphan `probe-district` row, or accept it and use `district_id`-scoped test tenancy
      knowing cleanup does not cascade.
- [ ] Contract §12 item 3 ("the design doc is not yet amended") now has one more entry.

### Cross-cutting — DO THIS FIRST, it is now overdue

- ~~**Extract a shared `docs/js/lrs-xapi.js` before the next emitter.**~~ **DONE 2026-07-16 — but
  only half the job.** The module exists and `sims/animal-cell` consumes it. It owns the UUID,
  ISO-8601 duration, actor block, canonical-IRI rule, statement builder, and log panel, and it
  *enforces* the contract rather than merely implementing it: non-v1 verbs and types **throw**, and a
  `main.html` IRI, a fragment-qualified `MicroSim`/`Page`, an `answered` with no `success`, or a local
  origin all **warn**. All six guards verified in-browser.

  The derive-vs-hardcode split is resolved in favour of **derive**, so §1 now holds by construction —
  an emitter cannot supply a page IRI, therefore cannot supply a wrong one. (sine-wave's was wrong
  twice.)

  **STILL OUTSTANDING — the four originals are not migrated:**

  | Copy | Status |
  |---|---|
  | `docs/js/quiz-xapi.js` | Own impl. Derives, but does **not** strip `main.html` — latent §1 bug if ever iframed. Its "locally the path has no base path" comment is wrong. |
  | `sims/bouncing-ball/bouncing-ball.js` | Own impl. Hardcodes `ACTIVITY_BASE_ID`. |
  | `sims/sine-wave/sine-wave.js` | Own impl. Hardcodes it. |
  | `sims/scientific-method/script.js` | Own impl. Hardcodes it. |

  **Be honest about what this means: there are now FIVE implementations, four of which still
  disagree.** The extraction stops the bleeding for new emitters; it has not healed the old ones.
  Migrating them is mechanical but each needs re-verifying in the browser (bouncing-ball's dwell and
  sine-wave's deadband are the fiddly ones), and they were deliberately left alone rather than
  refactored unverified at the end of a session. **Do this before, not after, the next emitter** — the
  same argument that made the extraction overdue applies to finishing it.

- ~~**Log-panel CSS duplicated between `docs/css/extra.css` and `sims/scientific-method/style.css`.**~~
  **DONE 2026-07-16.** Now `docs/css/lrs-xapi.css`, one file included twice — `mkdocs.yml`'s
  `extra_css` for site pages, a `<link>` for iframe payloads. It serves both by keying off Material's
  `--md-*` variables **with fallbacks**, so it follows dark mode inside the site and degrades to fixed
  colours in a bare iframe. The split that made this work: **the shared file decides what the panel
  looks like; the sim decides where it goes** — scientific-method keeps `flex: 1 0 100%` locally
  because that is a fact about *its* flex row, not about panels. Verified both consumers still render
  and the chapter quiz still emits.

- **`smoke.sh` asserts none of the new paths.** Its single statement is one `answered` against
  `lrs-data-model`. `interacted`, the §7 dwell pattern, the quiz path, and hover-with-threshold have
  **no tier asserting them**. A harness that has never failed has never been tested — and four of the
  five things built this session are invisible to it.

### OPEN DESIGN QUESTION: should an emitter track hover *and* click?

**Raised 2026-07-16.** `sims/scientific-method` currently emits both — hover (gated at 0.6s) and
click-to-pin — which was built to answer the *engineering* question ("can we track both?": yes). The
*instructional design* question is different and is **not settled**: should we?

**This belongs in a future guide for MicroSim instructional designers** — see the "Retrofit
specification" item at the top of this file, whose first bullet already scopes "a contract for
MicroSim/infographic authors: which xAPI verbs and activity types to use." That contract tells an
author *how* to emit. This question is *what is worth emitting at all*, and it is the harder half.
The audience is a MicroSim author who is a teacher, not an engineer, and who will otherwise
instrument whatever is technically easiest.

The argument as it stands, to be pressure-tested rather than adopted:

- **Hover does not exist on touch devices — this is the disqualifying one.** Tablets and touchscreen
  Chromebooks emit *zero* hover statements no matter how carefully a student studies. In the rollup
  that is indistinguishable from disengagement (the same shape as the physics/chemistry problem in
  §12 item 8). It is **systematic bias correlated with device**, which in schools correlates with
  funding — not random noise that averages out. An engagement metric that silently under-reports the
  Chromebook cohort is worse than none, because it will be believed.
- **Hover measures mouse habit, not attention.** Some readers track text with the cursor; others park
  it. Two students with identical understanding produce wildly different hover data.
- **Hover inflates C-6 without adding signal.** `statements_compressed` *is* the compression metric,
  and hover is ~10–50× the volume of clicks. Collecting it makes the headline architecture number look
  better while adding noise. **Any metric that improves when you collect noise will eventually be
  gamed**, including by well-meaning people.
- **The actionability test.** "Maria hovered on *Formulate Hypothesis* for 2.3s" changes no teaching
  decision. "Maria answered the hypothesis question wrong twice" changes Tuesday's lesson.

**Candidate principle for the guide:** *instrument the act you designed; do not infer from the act you
did not.* This diagram already declares its designed act — its own infobox reads **"Tip: Click on any
node to keep its information displayed."** The click is the interaction; hover is the affordance that
makes the click discoverable. Instrument the click.

**Candidate middle path, one line of code.** The architecture already supports it: drop the
`concept_id` extension from *hover* statements only. `mv_student_concept_rollup`'s own
`WHERE notEmpty(concept_ids)` then excludes them automatically, so hover lands in `lrs.statements`
(cheap, and impossible to backfill later) while only pins count as concept evidence and C-6 is
measured on signal. **Not yet done** — it is a real change to what the sim records, and worth deciding
deliberately rather than mid-session.

> **UPDATE 2026-07-16 — `animal-cell` narrowed this question, and the middle path is NOT general.**
>
> Building the hotspot sim showed the middle path would have **inverted the very bias it exists to
> prevent**. In `scientific-method`, hover and click are different acts — clicking *pins* the
> infobox — so demoting hover is defensible. In `animal-cell`, `diagram.js` wires hover and click to
> the *same function*: there is no pin, and **click is what hover is called on a touchscreen**.
> Dropping `concept_id` from hover there would have counted tablet users and discarded laptop users
> for the identical act — the same device-correlated bias, pointed the other way.
>
> **So the question is not "should we track hover?" but "is clicking a separate designed act?"**
> Where it is, weight them differently. Where click is merely the touch fallback, they are one act
> and must be counted once, together — `animal-cell` emits one statement per inspection via either
> path, with `engagement-mode` recording which as an *input-device* fact, explicitly not an
> evidence-strength one.
>
> This strengthens rather than weakens the guide's thesis. *Instrument the act you designed* requires
> first identifying **what the designed act is** — and the sim's own affordances tell you. This one's
> infobox reads "Hover over a numbered marker **or a label**"; scientific-method's reads "Click on any
> node to keep its information displayed." Those are different designs and deserve different
> instrumentation. **The candidate middle path remains open for `scientific-method` specifically; it
> must not be adopted as a blanket rule.**

**The one genuine case for keeping hover as evidence:** traversal *order* on a process diagram — did
the student follow the cycle, or jump to the end and miss the loop-back? That is a real question for
*this* diagram specifically. But the guide should insist on a hypothesis about what you would **do**
with the answer *before* collecting it, not after.

### Handoff state — 2026-07-16

**Committed:** `aede865` (xAPI producer contract), `fde8f96` (bouncing ball, chapter 1 + quiz,
`quiz-xapi.js`, the DDL `Control`/MicroSim changes, sine-wave URI fixes, logs), and `6074c48`
(scientific-method complete; animal-cell **pre-instrumentation**; `docs/sims/shared-libs/` vendored).

**Uncommitted at handoff:**

- `docs/sims/scientific-method/` — instrumented and verified; committed in `6074c48`. `style.css` and
  `main.html` edited **since** that commit to consume the shared panel CSS (re-verified).
- `docs/sims/animal-cell/` — **now instrumented and verified.** `xapi.js` + `metadata.json` are new;
  `main.html` links the shared JS/CSS; `index.md` documents what it emits and its iframe is 960px
  (measured worst case 923px at mobile with a full log — do **not** shrink it on the basis of an
  empty-log screenshot). `data.json`, `animal-cell.png`, `image-prompt.md` remain byte-identical to
  `../biology/docs/sims/animal-cell/` — deliberately, so a re-sync cannot silently break the concept
  mapping, which lives in `xapi.js`.
- `docs/sims/shared-libs/` — vendored byte-identical from `../biology/docs/sims/shared-libs/`
  (`diagram.js`, `style.css`); committed in `6074c48`. **Do not edit these.** `animal-cell/xapi.js`
  instruments `diagram.js` by wrapping its methods precisely so this stays a clean copy — verified
  still byte-identical to upstream at handoff.
- `docs/js/lrs-xapi.js`, `docs/css/lrs-xapi.css` — **new**, the shared module and panel CSS.
- `docs/js/quiz-xapi.js` — unchanged, but now **duplicates** the shared module. Migration pending.
- `docs/css/extra.css` — `.xapi-*` block removed (moved to `lrs-xapi.css`).
- `docs/specs/xapi-producer-contract-v1.md` — §2 fragment rule for named sub-activities and the
  stable-order amendment; §5 "one object, one type"; §12 items 6, 8–10.
- `TODO.md`, `logs/mvp-status.md`, `logs/watcher-fix.md`, `mkdocs.yml` (nav + `extra_css`).
- **`src/lrs/`** — **new Python**: `config.py`, `cli.py`, `bootstrap.py`, `envelope.py`,
  `gateway/{app,validation,producer}.py`. **`tests/test_producer_contract.py`** — new, 28 tests.
- `deploy/docker-compose.yml` — gateway healthcheck added (see the critical path above).
- `uv.lock` — untracked but **valid**; `uv sync --frozen` resolves 57 packages. Note `uv sync` had
  to be re-run with `--reinstall-package lrs` once `src/lrs/` gained its first `.py` file: the
  wheel had been built when the directory held only `ddl/`, so `import lrs` failed with the
  package "installed".
- `.env` — present and its `CLICKHOUSE_PASSWORD` matches the running container. **Not** committed
  (`.gitignore` covers it).

**Environment (all verified this session):** Docker 23.43 GiB to containers; 5 backing services
healthy; the ClickHouse DDL applies cleanly and has been exercised with real emitted statements;
`click` **8.4.2** — do **not** let it resolve back into 8.3.x or `mkdocs serve` silently stops
watching (see `logs/watcher-fix.md`).

**Critical path — the gateway now exists. The processor does not.**

`uv lock` ✔ · `src/lrs/cli.py` ✔ · **gateway ✔** · processor ✗ (step 2 half done).

**`make smoke --tier=ingest` is now red one check LATER than before**, which is the only kind of
progress this harness recognises:

```
✓ gateway accepted 77d76d97-…        <- new. previously died here: nothing on :8080
✗ FAIL  F-1: statement never reached lrs.statements after 30s   <- the processor's absence
exit 1
```

**Built and verified against live Redpanda** (`uv run lrs gateway`):

| | |
|---|---|
| `src/lrs/config.py` | env names read back off compose's `x-lrs-env`, not invented |
| `src/lrs/cli.py` | typer; `gateway`, `bootstrap`. Unbuilt roles are **absent, not stubbed green** |
| `src/lrs/bootstrap.py` | §6.1 topics — raw 6 parts (48→6 per the plan), bulk 12, dlq 12. `--verify` checks partition counts |
| `src/lrs/envelope.py` | gateway→processor wire format. Shared **because** §8's `district_id`/`stored_at` are gateway-owned and must not ride inside `statement` (which becomes `raw`) |
| `src/lrs/gateway/validation.py` | the contract, executable. 17 reject paths verified |
| `src/lrs/gateway/producer.py` | acks=all, idempotence on, poll thread, await-the-ack |
| `src/lrs/gateway/app.py` | auth → validate → mint UUIDv7 → produce → 200 |
| `tests/test_producer_contract.py` | 28 tests, named by contract §. **Falsified 3 ways** — allowing `completed`, dropping the page-grain check, truthiness on `success` — each caught by the right test |

**Verified, not assumed:**

- End-to-end into Kafka: key `demo-district:https://demo.example.edu|smoke-1`, partition 5/6,
  envelope carrying gateway-owned `district_id`/`stored_at`, statement byte-identical to what was
  POSTed. Producer-supplied `id` round-trips (smoke.sh queries by it).
- **All-or-nothing (§9) holds** — 2 valid + 1 invalid → 400, **0 messages produced**, with a
  positive control proving the probe can see writes (3 valid → delta 3). The first attempt at this
  test was a **false pass**: it summed `rpk topic describe`'s `$4` (REPLICAS) instead of `$6`
  (HIGH-WATERMARK), so it read 0 before and 0 after and could not have failed. Same family as the
  `setTimeout`-clamp false result above — **a probe needs its own positive control.**
- `smoke.sh --tier=ingest` exits **1**, and its ClickHouse probe genuinely works (`.env` password
  matches the running container; `SELECT count()` returns 0). This mattered: `ch()` swallows errors
  via `|| echo 0`, so a **wrong password produces a message identical to "no processor"**. Worth
  hardening — the harness cannot currently distinguish *store unreachable* from *statement absent*.

**Found while building — a latent compose bug, now fixed.** `loadgen` has
`depends_on: gateway: {condition: service_healthy}` but the `gateway` service declared **no
healthcheck at all**. The perf profile is "the whole point of this MVP" and could never have
started. Added one, using `python` rather than curl/wget — the same trap the plan already caught on
the ClickHouse/Neo4j healthchecks ("wget, which neither image reliably ships").

**Next, in order:**

1. **`lrs processor`** — consume `xapi.statements.raw` ≤1000/200ms → HMAC the actor (§5.2) →
   derive `object_type` from `definition.type` (§5) → parse `grouping` → `textbook_id`/`version_id`
   (§4) → wrap `ext/concept_id` into `concept_ids` (§6) → ISO duration → `duration_ms` → **rewrite
   the actor block in `raw` before insert** (the plan's PII fix — cheap now, brutal across an
   append-only log) → batched INSERT → commit offset only after the ack. That turns
   `--tier=ingest` green and is the first time a statement is durable.
2. **`lrs identity`** — the per-district salt. Until it exists the processor must not invent one:
   a hardcoded salt would make the §8 boundary look tested when it is not.
3. **Then, and only then, teach the emitters to POST.** `docs/js/lrs-xapi.js` has a `transport`
   seam and no network call by design. When it lands, the four un-migrated emitters matter more —
   they would each need their own transport otherwise.

**Nothing is POSTed by any emitter yet, and `lrs.statements` still has 0 rows.** The gateway is
reachable and correct; nothing is pointed at it except `smoke.sh` and curl.
