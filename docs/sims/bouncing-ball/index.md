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

<iframe src="main.html" height="700px" scrolling="no"></iframe>

[Run the Bouncing Ball MicroSim Fullscreen](./main.html){ .md-button .md-button--primary }

A ball bounces inside the drawing region. The slider changes its speed; the
**Start/Pause** button runs and halts the animation.

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

The naive instrumentation emits a statement when the student presses Start and another
when they press Pause. This sim does **not** do that. It emits **one statement per run
interval**, on Pause:

| Event | What is emitted | Why |
|---|---|---|
| **Start** | *Nothing.* The wall clock is recorded. | A student who starts the sim and walks away has produced no evidence. A `started` with no matching `paused` is an unclosed interval that nothing can score. |
| **Pause** | One `experienced` statement, with `result.duration` = the elapsed run time. | The interval is the evidence. `result.duration` is the only field that feeds `dwell_ms_total`, and one statement carries it as well as two would. |
| **Tab hidden while running** | The same `experienced` statement, flushed. | Start-it-and-close-the-tab is the *common* case, not the edge case. Without the flush it would emit nothing at all. |
| **Run shorter than 250 ms** | *Nothing.* | A mis-click is not engagement. Emitting it would put `PT0S` rows into `dwell_ms_total`. |
| **Speed slider moved** | An `interacted` statement, throttled by a deadband. | See the trade-off discussion in [Sine Wave](../sine-wave/index.md#architecture-trade-off-where-should-the-scoring-happen). The raw `input` event fires hundreds of times per drag; almost none of those values carry new information. |

### Why the button and the slider produce different `object_type`s

This is subtle and it is the kind of thing that silently corrupts a metric:

- The **Start/Pause statement**'s object is the **page itself** —
  `…/sims/bouncing-ball/`, no fragment — typed `MicroSim`. That is what makes it roll up
  into exactly one `PageEngagement` row for this sim.
- The **slider statement**'s object is a **control** —
  `…/sims/bouncing-ball/#speed-slider` — typed `Control`.

`mv_student_page_rollup` groups by `object_id`. If the slider were also typed `MicroSim`,
every control on the page would become **its own `PageEngagement` row** for a page the
student visited once — the same defect as naming `main.html` instead of the page. So
controls are deliberately excluded from the page rollup; they are engagement evidence for
the concept rollup instead.

## Things Worth Asking

1. Why does pressing Start emit no xAPI statement at all?
2. A student starts the simulation and closes the tab without pausing. What is emitted,
   and why?
3. Why does the speed slider produce a different `object_type` than the Start/Pause
   button?
4. Why is the ball paused when the page loads instead of already moving?

## References

- [xAPI Producer Contract v1](../../specs/xapi-producer-contract-v1.md) — the statement
  shape this sim emits, and why.
- [Sine Wave](../sine-wave/index.md) — the emission-strategy trade-off (send every
  interaction vs. summary-on-blur vs. deadband) this sim's slider follows.
