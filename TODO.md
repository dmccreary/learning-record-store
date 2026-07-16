# TODO

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

**3. Interactive poster with hotspots** (`interactive-infographic-overlay` skill).
   - **Cardinality.** `Control` was proven to stay out of `student_page_rollup` with exactly *one*
     control. Twenty hotspots is the real test of the fragment-IRI scheme and the `GROUP BY object_id`
     behaviour.
   - **Dual mode.** The skill produces explore *and* quiz modes — one artifact emitting **two verb
     families against related IRIs**: explore → `interacted`/`Control`, quiz → `answered`/`Question`.
     Forces a genuine contract question: **does a hotspot's `object_type` depend on the mode it is
     clicked in?** The contract has no answer.

**4. Continuous 2D drag** (p5, but a new interaction class).
   - A slider has a natural quantum (`range/60`, per sine-wave's deadband). Dragging a point on a
     canvas has none, and `mouseDragged` fires per frame. This is the worst case for emission
     strategy, and it gives `loadgen` a realistic burst *shape* rather than a synthetic one.

### What no MicroSim can cover — do not wait on these

| Gap | Why a sim can't do it | Owner |
|---|---|---|
| `revisit_count` | It is `AggregateFunction(uniq, Date)` — the **only** non-`Simple` aggregate in the DDL, and the only one needing `uniqMerge` at read time. Needs statements spanning multiple **days**. | `loadgen` with backdated timestamps |
| Pseudonymization boundary (§8) | Every emitter hardcodes `demo-student`. One actor never exercises the per-district HMAC. | `loadgen` with many actors |
| F-3 retraction / `voided_by` | Voiding is an API call, not an emission. | gateway/API work |
| BKT **sequences** | `quiz-xapi.js` emits at most one `answered` per question per load, and none after the answer is revealed. BKT's value is a *sequence* of attempts; nothing produces one. See contract §12 item 6. | retry UX decision, then `loadgen` |

### Cross-cutting — DO THIS FIRST, it is now overdue

- **Extract a shared `docs/js/lrs-xapi.js` before the next emitter.** This was written as "do first if
  cheap — two is a coincidence, three is a pattern." **There are now four independent
  implementations** of the same ~60 lines (UUID, ISO-8601 duration, the actor block, the log panel,
  the canonical-IRI rule):

  | Copy | Notes |
  |---|---|
  | `docs/js/quiz-xapi.js` | *Derives* the page IRI from `location.pathname`, stripping the site base path. |
  | `sims/bouncing-ball/bouncing-ball.js` | *Hardcodes* `ACTIVITY_BASE_ID`. |
  | `sims/sine-wave/sine-wave.js` | Hardcodes it. |
  | `sims/scientific-method/script.js` | Hardcodes it. |

  **They already disagree** — the derive-vs-hardcode split is a real inconsistency, and only the quiz
  version enforces §1's "a local `mkdocs serve` must still emit the *published* IRI" rule. The
  hardcoded ones get it right by luck, not by construction. Every new sim is another chance to
  re-implement the contract slightly wrong, in a file nobody will re-read. **The next emitter should
  consume the shared module, not copy a fourth one.**

  Also worth folding in while extracting: the log-panel CSS is duplicated between
  `docs/css/extra.css` (site-wide) and `sims/scientific-method/style.css` (iframe payloads do **not**
  load the site CSS — that duplication is legitimate, but it should be one file included twice, not
  two hand-maintained copies).

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

**The one genuine case for keeping hover as evidence:** traversal *order* on a process diagram — did
the student follow the cycle, or jump to the end and miss the loop-back? That is a real question for
*this* diagram specifically. But the guide should insist on a hypothesis about what you would **do**
with the answer *before* collecting it, not after.

### Handoff state — 2026-07-16

**Committed:** `aede865` (xAPI producer contract) and `fde8f96` (bouncing ball, chapter 1 + quiz,
`quiz-xapi.js`, the DDL `Control`/MicroSim changes, sine-wave URI fixes, logs).

**Uncommitted at handoff:**

- `docs/sims/scientific-method/` — new, instrumented, verified. Untracked.
- `docs/sims/animal-cell/` — **untracked and not looked at.** Added outside this session; not
  instrumented, not in the nav, unexamined.
- `docs/specs/xapi-producer-contract-v1.md` — §2 fragment rule for named sub-activities; §12 items 8–9.
- `TODO.md`, `logs/mvp-status.md`, `logs/watcher-fix.md`, `mkdocs.yml` (nav entry).

**Environment (all verified this session):** Docker 23.43 GiB to containers; 5 backing services
healthy; the ClickHouse DDL applies cleanly and has been exercised with real emitted statements;
`click` **8.4.2** — do **not** let it resolve back into 8.3.x or `mkdocs serve` silently stops
watching (see `logs/watcher-fix.md`).

**Still the critical path, unchanged:** `uv lock` → `src/lrs/cli.py` → gateway + processor (step 2).
Every emitter so far renders statements into a panel; **nothing has ever POSTed one**. `make smoke`
still has no gateway to talk to.
