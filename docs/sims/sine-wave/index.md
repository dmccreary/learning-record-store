---
title: Sine Wave
description: An interactive MicroSim demonstrating sine wave.
quality_score: 72
image: /sims/sine-wave/sine-wave.png
og:image: /sims/sine-wave/sine-wave.png
twitter:image: /sims/sine-wave/sine-wave.png
social:
   cards: false
---
# Sine Wave

<iframe src="main.html" height="1160px" scrolling="no"></iframe>

[Run the Sine Wave MicroSim Fullscreen](./main.html){ .md-button .md-button--primary }

[Edit the Sine Wave MicroSim Using the p5.js Editor](https://editor.p5js.org/dmccreary/sketches/CkgBfjdKl)
In this demo, we use three range control sliders to change 
the ways a sine wave is drawn on a canvas.
The three parameters are:

1. amplitude
2. period
3. and phase

[Edit This MicroSim with the P5.js Editor](https://editor.p5js.org/dmccreary/sketches/f7E377T03)

## Simulating an xAPI Event Stream

Two checkboxes below the sliders turn this MicroSim into a small demo of how
this project's [Learning Record Store](../../specs/lrs-spec-v1.md) turns raw
interactions into evidence of understanding:

- **Show Raw xAPI Events** streams one simulated xAPI statement (Actor–Verb–Object,
  with a `result.extensions` payload carrying the new slider value) every time a
  student drags the amplitude, period, or phase slider. This is intentionally
  noisy — a single drag can generate dozens of statements — to illustrate why an
  LRS never stores one graph vertex per statement.
- **Show MicroSim Summary** compresses that same stream into the kind of
  evidence the LRS spec's `ConceptMastery` and `MicroSimEngagement` summary
  vertices hold: whether the student tried all three controls, how much of each
  slider's range they explored, how many times they reversed direction (a signal
  of active comparison rather than a single accidental nudge), and a heuristic,
  clearly-labeled *estimated probability* that the student understands amplitude,
  period, and phase — not a substitute for a real formative assessment.

### Architecture Trade-off: Where Should the Scoring Happen?

To keep the demo self-contained, the compression above runs entirely in the
browser: `sine-wave.js` computes the three probability scores from this one
session's slider events and never sends anything to a server. That shortcut
is fine for a teaching demo, but it sidesteps a real design decision every
xAPI-emitting MicroSim has to make when it's wired up to an actual LRS: how
often should the client actually talk to the server?

**Option A — Send every raw interaction.** The browser fires off an xAPI
statement for essentially every `input` event a slider produces —
the finest possible grain, with nothing held back client-side.

**Option B — Send only a final summary.** The browser scores the session
itself (the same heuristic this demo runs) and, when the MicroSim loses
focus, is closed, or the tab is hidden (`blur` / `visibilitychange`), sends
one small payload — e.g. `{ student, concept: "amplitude", mastery_score:
0.42, evidence_count: 7 }` — instead of any of the interactions behind it.

**Option C — Send an event only when a new threshold is crossed.** The
browser tracks the slider locally but only emits (and sends) an xAPI
statement when the value has moved past a meaningful limit since the last
statement — e.g. amplitude has to move by 10 units, not 1, before another
`interacted` statement fires. This is often called *deadband* or
*exception-based* reporting, and it's a standard pattern in sensor/IoT
telemetry for the same reason a teacher proposes it here: most of the
in-between values carry no new information. **This demo already does a
version of this** — `handleSliderInput()` in `sine-wave.js` computes
`emitStep = range / 60` for each slider and only calls `emitXapiStatement()`
once the value has moved by at least that much, which is why one full slider
sweep produces on the order of 60 statements instead of the hundreds of raw
`input` events the browser actually fires. A real implementation could tune
that threshold — or make it adaptive — independently for amplitude, period,
and phase.

| Dimension | A: every raw interaction | B: summary only, sent on blur | C: threshold-triggered events |
|---|---|---|---|
| Network volume | Highest — one statement per raw `input` tick; easily hundreds per drag. | Lowest — one message per session, however long the student explores. | Middle — bounded by how many thresholds exist, not by how long or how finely the student drags (~60 per full sweep in this demo). |
| Why §5.5 sizes the LRS the way it does | This is the traffic pattern §5.5 is built for: **≥ 10,000 statements/sec sustained, bursting to 50,000/sec** district-wide. | Barely registers against that target — a few messages per student per session. | A small, predictable fraction of Option A's volume — most of the burst-capacity headroom without giving up a real statement stream. |
| Source of truth | The immutable statement log is the system of record (F-1); every statement is real evidence. | The client's derived number *is* the record — there is no underlying log to fall back on. | Still a real, replayable statement log (F-1) — just a sparser one. Each statement is still genuine evidence, not a derived guess. |
| Re-analysis | Full fidelity: every historical summary can be **replayed and rebuilt** from the log (C-2, §12.4) if the mastery heuristic improves later. | Impossible: the scoring logic at the moment of play is baked in permanently. A better algorithm next year can't improve last year's scores. | Mostly possible: replay reproduces coarse-grained mastery signals (range explored, roughly how many times direction changed) but can't reconstruct movement *within* a threshold band that never crossed it. |
| Trust & integrity | The log lets the server verify *how* a score was derived and catch a buggy or gamed client-side calculation. | The client is not a trusted execution environment; a tampered page or a bug in `computeConceptScore` ships a wrong score with nothing to audit it against. | Same audit story as A, at a coarser resolution — still real statements the server can independently re-aggregate and sanity-check. |
| Cross-session/device view | The server can join this MicroSim's statements with everything else the student has done, on any device. | The client only ever sees its own session; it can't know what the student did yesterday or in a different MicroSim. | Same as A — it's still a real statement stream the server can join with other activity. |
| Offline / low-bandwidth resilience | Needs a durable client-side queue if the network drops mid-session (the LRS's ingest queue, §5.3, only starts once statements arrive). | Naturally resilient — one small sync at session end is easy to retry or defer. | More resilient than A by construction — fewer, larger gaps between sends means fewer statements at risk if a queued batch is lost. |
| Fits this project's data-minimization rule | Only if the "raw interaction" is already a declared learning event (like this demo's slider `input`), not literal per-pixel mouse coordinates — §12.3 requires "only learning telemetry," not behavioral surveillance. | Yes, and most conservatively — least data ever leaves the device. | Yes — arguably the best fit: it's still declared learning events, just sampled by an explicit, tunable rule instead of continuously. |

!!! note "Why this project's LRS spec favors A or C over B"
    [`lrs-spec-v1.md` §5.6](../../specs/lrs-spec-v1.md) requires that summary
    vertices be compressed *server-side* from a durable log, never computed
    once on the client and thrown away: "Summary vertices MUST be reproducible
    by replaying the statement log... They are projections, never sources of
    truth" (C-2). Both **A** and **C** satisfy that — they differ only in
    *sampling rate*, and the log is still real and replayable either way.
    **B** does not: once only the derived score is sent, the raw evidence
    behind it is gone, so there is nothing left to replay.

In short: what's actually at stake with Option B isn't the *validity* of the
number it sends — a `mastery_score` computed and stored today stays an
accurate record of what that formula said about that session, forever.
What's lost is the *raw evidence behind the number*: the coverage, reversal,
and interaction counts that produced it. Some systems are perfectly fine
with that trade — a credit score, for instance, is deliberately frozen to
"the best model at the time," and nobody expects a 2010 score to be
recalculated under a 2024 model. This project's spec chose the opposite: C-2
requires a `mastery_score` to be reproducible by replaying the log,
specifically because a heuristic this new — revised more than once in this
very demo already — is expected to keep changing as real classroom outcomes
get compared against it. Option A keeps that door open at the highest
bandwidth cost; Option C, what this demo's raw-event panel already
approximates, usually keeps it open more cheaply. Option B closes that door
permanently, by design, in exchange for the smallest possible payload — a
deliberate and reasonable trade for some systems, just not this one.

### Server-Side Compression Logic, and the Two-Codebases Problem

Options A and C both push real work onto the server the moment a statement
lands. This demo's client-side JavaScript (`handleSliderInput`,
`handleSliderChanged`, `computeConceptScore` in `sine-wave.js`) has a
server-side counterpart that has to exist for either option to actually
produce a `ConceptMastery` or `MicroSimEngagement` vertex.

**What the compression pipeline needs, per [§5.6](../../specs/lrs-spec-v1.md)**

For every `(student, concept)` grain and every `(student, microsim)` grain,
the pipeline has to maintain a running aggregate and update it incrementally
as statements arrive:

- **Per-grain state** — min/max value seen, the last value seen, the
  direction of the last observed move, a reversal counter, an event counter,
  first_seen/last_seen. This is the same shape as `stats[key]` in
  `sine-wave.js` today, just persisted per student on the server instead of
  per browser tab.
- **The scoring formula itself.** `computeConceptScore()`'s coverage /
  reversal / interaction-count weighting has to be re-implemented (or
  shared) server-side — a `mastery_score` on a `ConceptMastery` vertex has
  to be *derived from the log*, per §5.6; it can't be the number the client
  already computed and discarded.
- **Idempotent, absolute-value writes (C-3).** The pipeline can't "add one
  reversal" every time a statement is reprocessed — redelivering the same
  statement twice has to leave the graph unchanged, so rollups are computed
  fresh (or from a persisted aggregate), not accumulated destructively.
- **Timestamp-driven, not arrival-driven ([§5.3](../../specs/lrs-spec-v1.md)).**
  The browser sees slider moves in true real-time order; the server does not
  — statements can arrive out of order from retries, multiple tabs, or
  network jitter. An order-dependent signal like "reversals" has to be
  computed by sorting a grain's statements by `timestamp`, not by processing
  arrival order, which the client-side version never has to worry about.
- **Accept-first onboarding ([§5.4](../../specs/lrs-spec-v1.md)).** If this
  MicroSim's slider ranges ever change (say amplitude becomes 0–300), the
  new activity IDs just show up as provisional data — ingestion doesn't
  block, but a server-side scoring rule still tuned for the old 0–200 range
  will now silently misjudge "range explored" until someone updates it.

**The two-codebases problem**

This is the real cost of Options A and C. Today, the MicroSim authoring
workflow's whole value is "one prompt, one self-contained bundle" —
`sine-wave.js`, `main.html`, `metadata.json`, and `index.md`, generated
together and verified with nothing more than `mkdocs serve`. Real xAPI
wiring breaks that: the scoring *formula* now has to exist in two places
that must agree —

1. **Client-side**, for the optional local/live preview this demo shows,
   and
2. **Server-side**, in the LRS's compression pipeline — a different
   repository, most likely a different language, a different deploy
   pipeline, and a different set of reviewers than this docs site's
   `mkdocs gh-deploy`.

If those two implementations drift — someone tweaks the reversal weighting
in `sine-wave.js` and forgets the server — the number a teacher sees live in
the browser will quietly disagree with the number that lands in the
instructor dashboard weeks later, and nobody notices until a report looks
wrong.

Two ways to shrink that gap, rather than pretend it isn't there:

- **Push the scoring formula into data, not code.** `metadata.json` already
  carries a `pedagogical` block per MicroSim. A small declarative
  scoring-rule descriptor — weights, thresholds, which fields count as
  "coverage" vs. "reversal" — could live there too, generated once by the
  same authoring pass that builds the rest of the bundle. A single generic
  "slider-exploration scorer" in the compression pipeline would read that
  descriptor at runtime instead of every MicroSim shipping bespoke
  server-side code. Config can still drift, but it's far easier to diff,
  version, and validate than two hand-written implementations in two
  languages.
- **Stop expecting the two numbers to match at all.** Treat the client-side
  score explicitly as a provisional "your progress so far" estimate — which
  is already how this demo's caveat text is worded — and let the
  server-side `mastery_score` draw on more evidence than any single
  MicroSim session could ever see (other sessions, other devices, other
  MicroSims covering the same concept). That turns the two locations from
  an accidental duplication bug into a deliberate split: fast local
  feedback versus slow, authoritative truth.

Either way, wiring up real xAPI turns MicroSim authoring from a one-repo,
one-review change into at least a two-repo, two-review change, with a
version-coordination problem between them that this project's current
generation workflow has no step for yet.

