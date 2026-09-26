---
title: Bouncing Ball
description: An interactive MicroSim demonstrating motion and collision, and the reference emitter for the xAPI Start/Pause dwell pattern.
image: /sims/bouncing-ball/bouncing-ball.png
og:image: /sims/bouncing-ball/bouncing-ball.png
twitter:image: /sims/bouncing-ball/bouncing-ball.png
social:
   cards: false
---
# Bouncing Ball

<iframe src="main.html" height="860px" scrolling="no"></iframe>

[Run the Bouncing Ball MicroSim Fullscreen](./main.html){ .md-button .md-button--primary }

A ball bounces inside the drawing region. The slider changes its speed; the
**Start/Pause** button runs and halts the animation.

The second row of controls is about the **data**, not the ball:

- **xAPI events: Full / Compact** switches between the two statement streams this book
  describes — the **Full** per-interaction stream a full LRS ingests over a good network,
  and the **Compact** stream [LRS-Lite](../../lrs-lite/index.md) stores in the browser.
- **Simulate Done** does what the host page does when the student moves on: it takes
  focus away from the sim. In Compact mode that is the moment the one summary statement
  is emitted.

Note that the ball is **not moving when the page loads**. That is deliberate, and it is
a MicroSim standard with no exceptions: a simulation that animates as a student scrolls
past is a distraction and a source of cognitive load. Here it also matters for the data
— an auto-running sim would emit engagement time the student never chose to spend.

## Why This Sim Exists

This is the reference emitter for the **Start/Pause dwell pattern** in the
[xAPI Producer Contract v1](../../specs/xapi-producer-contract-v1.md). A Start/Pause
control is the most common thing a MicroSim has, and it was the one interaction the
contract's verbs could not express until the pattern was written down.

Like [Sine Wave](../sine-wave/index.md), this sim **never sends anything to a server** —
the statements appear in the log panel under the canvas so you can read them. But the
shape is exactly what a real gateway would accept, which is the point of a test emitter:
if the shape is wrong here, it is wrong everywhere.

## The Start/Pause Plan

The naive instrumentation emits **one** statement per button press — `started` on Start,
`paused` on Pause — and reconstructs the dwell interval by pairing them up at read time.
This sim does **not** compute duration that way. It still emits exactly **one**
`experienced` statement per run interval, on Pause, and that statement alone carries
`result.duration`:

| Event | What is emitted | Why |
|---|---|---|
| **Start** | One `interacted` statement — the button press itself. The wall clock is also recorded, but nothing about the *interval* is emitted yet. | The press is real evidence a control was touched, but a student who starts the sim and walks away has produced no *dwell* evidence. An `experienced` with no matching close would be an unclosed interval that nothing can score. |
| **Pause** | One `interacted` statement for the press, then one `experienced` statement with `result.duration` = the elapsed run time. | Two different questions, two different statements: "was the control touched?" (`interacted`, no duration) and "how long did the sim run?" (`experienced`, `result.duration`). Neither substitutes for the other. |
| **Tab hidden while running** | Only the `experienced` statement, flushed — no `interacted`. | This is a flush, not a click. Start-it-and-close-the-tab is the *common* case, not the edge case; without the flush the run interval would emit nothing at all. |
| **Run shorter than 250 ms** | The Start/Pause `interacted` statements still fire (the clicks happened); the `experienced` statement does not. | A mis-click is not *dwell* evidence. Emitting it would put `PT0S` rows into `dwell_ms_total`. It is still evidence the control was touched, which is what `interacted` is for. |
| **Speed slider moved** | An `interacted` statement, throttled by a deadband, tagged with its own concept `adjustable-speed`. | See the trade-off discussion in [Sine Wave](../sine-wave/index.md#architecture-trade-off-where-should-the-scoring-happen). The raw `input` event fires hundreds of times per drag; almost none of those values carry new information. |

**Why this isn't the naive pattern after all.** Contract [§7](../../specs/xapi-producer-contract-v1.md#7-startpause-the-dwell-pattern)
rejects computing `result.duration` by pairing a `started` and a `paused` statement — that
still holds, and nothing here does it. The `interacted` statements added for the Start and
Pause presses carry no duration at all; they exist alongside the single `experienced`
dwell statement, not instead of it. Pressing Start→Pause once now emits **three**
statements instead of one (two `interacted`, one `experienced`) — more statements, but for
genuinely different information, not a reconstruction of the same fact from two pieces.

### Why the button's two statement types get different `object_type`s

This is subtle and it is the kind of thing that silently corrupts a metric:

- The **dwell (`experienced`) statement**'s object is the **page itself** —
  `…/sims/bouncing-ball/`, no fragment — typed `MicroSim`. That is what makes it roll up
  into exactly one `PageEngagement` row for this sim.
- The **button-press (`interacted`) statement**'s object is a **control** —
  `…/sims/bouncing-ball/#start-pause-control` — typed `Control`. Same fragment for both
  Start and Pause presses: the button's label toggles, but it is still one control.
- The **slider statement**'s object is also a **control** —
  `…/sims/bouncing-ball/#speed-slider` — typed `Control`.

`mv_student_page_rollup` groups by `object_id`. If the button-press or slider statements
were also typed `MicroSim`, every control on the page would become **its own
`PageEngagement` row** for a page the student visited once — the same defect as naming
`main.html` instead of the page. So controls are deliberately excluded from the page
rollup; they are engagement evidence for the concept rollup instead.

## Full vs. Compact xAPI Streams

The same student actions can be reported two ways. Use the **xAPI events** radio buttons
to compare them:

| Mode | Built for | What the log panel shows |
|---|---|---|
| **Full** | The full LRS: high-bandwidth network, a gateway and queue that absorb thousands of statements per second | The stream described above: one `interacted` per slider step past the deadband, one `interacted` per Start/Pause press, one `experienced` per completed run. Statements appear **as you act**. |
| **Compact** | [LRS-Lite](../../lrs-lite/index.md#6-producer-side-summarization): a 10 MB browser store, no server | **Nothing while you work.** Slider steps, Start/Pause presses, and runs are folded into **one** `experienced` summary, emitted when the sim loses focus. A run still going at that moment is closed into the summary. |

### Try it

1. Leave the mode on **Full**. Move the slider a few times, press **Start**, wait, press
   **Pause**. Count the statements.
2. Switch to **Compact** and repeat exactly the same actions. The log stays silent.
3. Press **Simulate Done**. One `experienced` statement appears.
4. Press **View Formatted JSON ↗** in the log panel. The statement opens in a new tab,
   formatted and explained. Find `statements_represented`: that is how many Full
   statements it replaced. The highlighted lines are what compact mode adds, including
   `runs` (your Start/Pause intervals) and the Start/Pause control's `modes` count.
5. Press **Simulate Done** again. Nothing happens — the session already ended, and a new
   one starts only when you interact again.

Any line in the log can also be clicked to open that statement formatted. In Full mode
that includes the `interacted` press events, whose `action` is `start` or `pause`. The tab
is built in your browser, not inside the sim, because the sim sits in a fixed-height frame
and a 70-line statement would not fit. Nothing is sent to a server.

**What "Simulate Done" stands for.** Embedded in a textbook page, the sim is in an iframe,
and the session ends when the host page takes focus away: the student switches tabs,
leaves the page, scrolls the sim mostly out of view for `offscreenMs`, or stops
interacting for `idleMs` while it is paused. The button fires that same ending on demand
(`end_reason: "simulated-done"`), so you don't have to scroll away to see it. In **Full**
mode there is nothing folded to flush; if the ball is running, Simulate Done closes the run
into its `experienced` statement, exactly as a hidden tab would. Either way it never emits
an `interacted` statement — it is not a button press on the sim's own controls, it is the
page going away.

**Switching modes mid-session.** Going from Compact back to Full ends the open session
first, so anything already folded is emitted as a summary with `end_reason: "mode-switch"`
rather than silently lost. If the ball was running, that also pauses it.

### Where the starting mode comes from

The radio's starting position is read from the `xapi` block in this sim's
[`metadata.json`](metadata.json) — the same switch every instrumented sim uses:

```json
"xapi": { "compact": false, "idleMs": 90000, "offscreenMs": 10000, "blurMs": 30000 }
```

The summary is an ordinary contract statement on this page's IRI. Its extensions carry
the session: `controls` (the speed slider's count/min/max/last value and its `concept`;
the Start/Pause control's press count and a `modes` breakdown of `start` vs. `pause`),
`runs` (count and total milliseconds), `active_ms`, `end_reason`, and
`statements_represented`, which counts the full-mode statements it stands for. The panel
header says which mode is active.

This sim starts in Full mode because it is the producer contract's reference emitter for
the Start/Pause pattern. A `metadata.json` with no `xapi` block starts compact. The radio
is a teaching control: other sims take their mode from `metadata.json` alone.
`make test-sims` checks both modes, the live switch, and Simulate Done in headless
Chromium.

## Concepts This Sim Could Evidence

Every `concept_id` in this sim so far is an **illustrative placeholder** — this book's own
learning graph is about learning record stores, not physics, so `motion` and
`adjustable-speed` stand in for what a *consuming* physics textbook's graph might call
them (the same role `sine-wave`'s `sine-wave` and `scientific-method`'s
`iterative-investigation` play). Rename them freely for a real deployment.

What's wired up today is **exposure evidence only** — dwell and interaction counts, never
a `success`. Nothing here is `answered`, so nothing currently reaches a BKT mastery
estimate as *assessed* evidence (see [LRS-Lite §9](../../lrs-lite/index.md#9-estimating-mastery-in-the-browser):
"reading and exploring mark a concept exposed, never mastered"). Candidates for what else
this sim could tag, and what it would take to make each one *assessed* rather than merely
*exposed*:

| Candidate `concept_id` | What's already evidence for it | What's still missing |
|---|---|---|
| `boundary-reflection` (or `collision-prediction`) | Nothing yet, but `metadata.json`'s `learningObjectives` already names it — "Predict where the ball will travel after a collision with a boundary" — and `pedagogical.supportsPrediction` is already `true`. | A prediction UI (e.g., click where the ball will be, or which wall it hits next) that calls `xapi.predict('boundary-reflection', correct)` before the bounce happens. This is the one candidate below that's a real, not cosmetic, feature. |
| `constant-velocity-motion` | The run interval itself — `dx`/`dy` never change between bounces. | Nothing extra to instrument; would just be a second concept tag on the existing `experienced` dwell statement, if multi-concept statements existed (contract §6 open item 5: v1 allows only one `concept_id` per statement). |
| `two-dimensional-motion` / `vector-components` | Same as above — `dx` and `dy` update independently. | Same limitation: one `concept_id` per statement in v1. |
| `simulation-control` | The new Start/Pause `interacted` statements, if retagged off the umbrella `motion` concept. | Nothing — this is a naming choice, not a feature. Swap `CONCEPT_ID` for a dedicated constant in `recordControlAction`'s `touch()`/`emitControlInteracted()` calls if you want button-press evidence to roll up separately from dwell evidence. |

## Things Worth Asking

1. Pressing Start now emits an `interacted` statement. So why does the sim still need a
   *separate* `experienced` statement on Pause, instead of computing the run's duration
   from the Start and Pause timestamps?
2. A student starts the simulation and closes the tab without pausing. What is emitted,
   and what is not?
3. Why do the Start and Pause presses share **one** fragment id, `#start-pause-control`,
   instead of `#start-button` and `#pause-button`?
4. Why does the speed slider get its own `concept_id` (`adjustable-speed`) instead of
   reusing the sim's `motion` concept?
5. Why is the ball paused when the page loads instead of already moving?
6. In compact mode, a student moves the slider five times, presses Start, then Pause. How
   many statements does the log hold, and what does `statements_represented` say?

## References

- [xAPI Producer Contract v1](../../specs/xapi-producer-contract-v1.md) — the statement
  shape this sim emits, and why.
- [Sine Wave](../sine-wave/index.md) — the emission-strategy trade-off (send every
  interaction vs. summary-on-blur vs. deadband) this sim's slider follows.
