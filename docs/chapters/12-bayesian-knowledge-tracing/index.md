---
title: Bayesian Knowledge Tracing for Mastery
description: How the LRS's Bayesian Knowledge Tracing model turns graded and ungraded xAPI evidence into a single mastery probability, using the prior, slip, guess, and transit parameters and the two-step conditioning-and-transition update.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 08:41:28
version: 0.09
---

# Bayesian Knowledge Tracing for Mastery

## Summary

A focused chapter on the mastery-scoring algorithm: how Bayesian Knowledge Tracing's slip, guess, and transit parameters combine to turn a stream of graded and ungraded evidence into a single probability that a student has mastered a concept.

## Concepts Covered

This chapter covers the following 8 concepts from the learning graph:

1. Bayesian Knowledge Tracing
2. Prior Mastery Probability
3. Slip Parameter
4. Guess Parameter
5. Transit Parameter
6. Evidence Conditioning Step
7. Learning Transition Step
8. Soft Correctness Mapping

## Prerequisites

This chapter builds on concepts from:

- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)

---

!!! mascot-welcome "The Model Behind Every Mastery Score"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 9 named the Mastery Computation Function and promised its scoring model a chapter of its own. This is that chapter. Let's follow the record.

Every dashboard that tells a teacher "this student is 78% likely to have mastered Balancing Chemical Equations" has to get that number from somewhere. Spec F-7, the **Mastery Computation Function** introduced in Chapter 9, requires the system to maintain a `ConceptMastery` vertex from mixed evidence — quiz results, MicroSim interactions, dwell time — without saying how the score is computed. The project's design specification answers that question in ADR-006: **Bayesian Knowledge Tracing**, universally abbreviated **BKT**, is the algorithm that turns a stream of graded and ungraded evidence into a single running probability that a student has mastered a concept.

BKT was not the only candidate the design specification considered. It names three alternatives it passed over: a weighted moving average of scores, the Elo rating system borrowed from chess ranking, and Item Response Theory (IRT). Each produces a number a dashboard could display, but none produces a probability a teacher can read at face value the way "78% likely to have mastered this" can be read.

The table below summarizes the comparison the design specification makes, now that each candidate has been named above.

| Candidate Model | What It Outputs | Why ADR-006 Passed on It (or Chose It) |
|---|---|---|
| Weighted moving average | A running average score | No probabilistic meaning — cannot honestly be read as "78% likely to have mastered this" |
| Elo rating system | An unscaled skill number | Same problem as the moving average — a number with no natural 0-to-1 interpretation |
| Item Response Theory (IRT) | A latent ability estimate | Requires calibrating item-difficulty parameters across a large item bank — heavier than the state a stream processor can afford per statement |
| Bayesian Knowledge Tracing (BKT) | A probability, written \(P(L_n)\) | An O(1) update with a single float of state per (student, concept); the standard model in intelligent tutoring systems; chosen in ADR-006 |

BKT wins on exactly the three grounds that table's last row names: its update touches only one number per (student, concept) pair, which is what lets a stream processor handling thousands of statements a second afford to run it on every single one; it is the model intelligent tutoring systems have used for decades, so its parameters are well studied; and its output is honestly a probability, not a score that merely happens to sit between 0 and 100.

## Prior Mastery Probability: Where Every Update Starts

Every BKT update begins from a starting point called the **Prior Mastery Probability**, written \(P(L_n)\). The letter \(L\) stands for "learned" — the event that the student has mastered the concept — and the subscript \(n\) indexes which observation the system is about to process. \(P(L_n)\) is the probability, before observation \(n\) arrives, that the student has already mastered the concept. It is a number between 0 and 1: a value near 0 means the model currently believes the student has not learned the concept, a value near 1 means the model is nearly certain the student has, and a value near 0.5 means the model genuinely does not know yet.

For a brand-new (student, concept) pair with no evidence at all, \(P(L_0)\) has to come from somewhere other than that student's own history, because there is no history yet. The design specification calls this the cold-start case: "until a concept has enough data, it inherits its taxonomy category's priors." Every concept eventually gets its own fitted slip, guess, transit, and starting-prior values from real evidence, but a brand-new concept borrows those values from the broader subject grouping it belongs to — its taxonomy category — until enough of its own evidence accumulates. A newly published simulation on a rarely-taught topic still gets a reasonable starting estimate on day one, rather than an arbitrary guess.

!!! mascot-thinking "A Probability, Not a Verdict"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Resist the urge to read \(P(L_n)\) as "the student knows it" or "the student doesn't." It is a degree of belief the model holds, and every observation nudges that belief rather than replacing it outright. A single correct answer moves \(P(L_n)\) up; it almost never jumps straight to 1. That restraint is the entire point of building this on Bayesian inference rather than a simple pass/fail flag.

## The Four Parameters Behind Every Update

Beyond the Prior Mastery Probability, BKT relies on three more numbers, all fit per concept rather than shared across the whole textbook. Together, these four numbers are everything the model needs to process one new piece of evidence.

The **Slip Parameter**, written \(p_{slip}\), is the probability that a student who *has* mastered the concept still answers incorrectly on any given attempt — a careless error, a misread question, a moment of distraction. Without a slip parameter, a single wrong answer from an otherwise strong student would look like proof they never learned the material at all, which does not match how real students behave.

The **Guess Parameter**, written \(p_{guess}\), is the mirror image: the probability that a student who has *not* mastered the concept still answers correctly, typically by chance on a multiple-choice item. Without a guess parameter, one lucky guess would look like proof of mastery.

The **Transit Parameter**, written \(p_{transit}\), is different from the other three — it is not about how evidence is read, but about how the student changes between opportunities. It is the probability that a student who has not yet mastered the concept moves into mastery between one observation and the next, whether from studying, from a teacher's explanation, or simply from working through another practice problem. The transit parameter is the only place in the whole model where learning itself, rather than the interpretation of a test result, enters the mathematics.

The table below reinforces the four parameters now that each has been defined above, alongside the question each one answers.

| Parameter | Symbol | Question It Answers |
|---|---|---|
| Prior Mastery Probability | \(P(L_n)\) | How likely is the student to have already mastered this concept, before this observation? |
| Slip Parameter | \(p_{slip}\) | If the student has mastered it, how often do they still answer incorrectly? |
| Guess Parameter | \(p_{guess}\) | If the student has not mastered it, how often do they still answer correctly by chance? |
| Transit Parameter | \(p_{transit}\) | Between this opportunity and the next, how likely is the student to move from not-mastered to mastered? |

Before looking at how these four numbers combine, it helps to see them side by side and feel how changing any one of them shifts a mastery estimate. The infographic below lets you click each parameter to read its definition again in context, and drag a slider to watch a fixed sequence of evidence produce a different final estimate depending on that parameter's value.

#### Diagram: The Four BKT Parameters Explorer

<iframe src="../../sims/bkt-four-parameters-explorer/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Four BKT Parameters Explorer</summary>
Type: infographic
**sim-id:** bkt-four-parameters-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, illustrate

Learning objective: Let the learner explain what each of the four BKT parameters (prior, slip, guess, transit) controls, and illustrate how changing one parameter's value shifts a mastery trajectory while holding the evidence sequence fixed.

Purpose: Give the learner a hands-on feel for the four parameters before the equations that combine them are introduced.

Canvas layout: Four clickable cards across the top — "Prior P(L0)", "Slip p_slip", "Guess p_guess", "Transit p_transit" — each showing its current value, above a line chart plotting P(Ln) across a fixed five-observation sequence (correct, incorrect, correct, correct, correct), with a slider below bound to whichever card is selected.

Interactive features: Clicking a card selects it and opens an infobox with that parameter's definition, matching this chapter's prose. Dragging the selected parameter's slider (range 0.0–1.0, step 0.01; defaults: prior 0.30, slip 0.10, guess 0.20, transit 0.15) immediately recomputes the trajectory using this chapter's conditioning and transition equations. A "Reset to defaults" button restores the starting values.

Color scheme: Each card uses a distinct book-palette color (prior teal, slip amber, guess rose, transit green); the trajectory line reuses the selected card's color.

Responsive design: Cards reflow into a two-by-two grid below tablet width; chart and slider stay full width at every size.
</details>

!!! mascot-tip "Slip and Guess Are Diagnostic, Not Just Correction Terms"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A working practitioner reads a concept's fitted slip and guess values as information in their own right, not just as noise the model corrects for. A high slip value on a concept usually means the assessment items for it are worded confusingly or graded too strictly. A high guess value usually means the item's wrong answers are too easy to eliminate. If a concept's mastery scores look noisy, check its slip and guess parameters before assuming the students are the problem.

## The Evidence Conditioning Step: Applying Bayes' Rule

With all four parameters defined, the update itself happens in two steps, run in a fixed order every time a new piece of evidence arrives. The first is the **Evidence Conditioning Step**: applying Bayes' rule to fold the new observation into the current Prior Mastery Probability, producing a posterior estimate that reflects what the observation actually implies.

If the observation is correct, the conditioning step computes:

\[
P(L_n \mid \text{correct}) = \frac{P(L_n)(1 - p_{slip})}{P(L_n)(1 - p_{slip}) + (1 - P(L_n)) \, p_{guess}}
\]

Read the numerator and denominator in plain language. The numerator, \(P(L_n)(1 - p_{slip})\), is the probability of both being a masterful student *and* not slipping on this attempt — one of the two ways a correct answer can happen. The denominator adds the other way a correct answer can happen: not having mastered the concept at all, \((1 - P(L_n))\), but guessing correctly anyway, \(p_{guess}\). Dividing the first quantity by the sum of both is exactly Bayes' rule: the probability of mastery given the correct answer is the share of all the ways a correct answer could have happened that come from actually having mastered the concept.

If the observation is incorrect, the mirror-image equation applies:

\[
P(L_n \mid \text{incorrect}) = \frac{P(L_n) \, p_{slip}}{P(L_n) \, p_{slip} + (1 - P(L_n))(1 - p_{guess})}
\]

Here the numerator is the probability of having mastered the concept *and* slipping anyway, and the denominator adds the probability of not having mastered it and not guessing correctly. The same logic applies: divide the way an incorrect answer happens *because of mastery going wrong* by every way an incorrect answer could happen at all.

!!! mascot-warning "One Wrong Answer Is Not a Verdict Either"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A common misreading of this equation treats a single incorrect answer as proof the student has not learned the concept. Look at the equation again: the slip parameter is baked directly into the numerator, so a student with a well-established high \(P(L_n)\) and a low slip rate only drops moderately after one wrong answer, not to zero. The whole point of conditioning on evidence through Bayes' rule, rather than simply resetting the score, is that one data point updates a belief — it does not overwrite it.

## The Learning Transition Step: Accounting for Growth

The conditioning step alone would leave the model static between observations — it would only ever react to evidence, never account for the fact that students actually learn in the time between one opportunity and the next. That is the job of the second step, the **Learning Transition Step**, which applies the transit parameter to the posterior the conditioning step just produced:

\[
P(L_{n+1}) = P(L_n \mid \text{evidence}) + \left(1 - P(L_n \mid \text{evidence})\right) p_{transit}
\]

Read this the same way: \(P(L_n \mid \text{evidence})\) is whichever posterior the conditioning step produced — the "correct" version or the "incorrect" version, depending on what actually happened. The term \(\left(1 - P(L_n \mid \text{evidence})\right)\) is the remaining probability mass that the student has *not yet* mastered the concept, and multiplying that remainder by \(p_{transit}\) moves some of it across into "mastered," representing the chance that learning happened since the last opportunity. The result, \(P(L_{n+1})\), becomes the Prior Mastery Probability the *next* observation will condition on — the cycle repeats every time new evidence arrives.

The list below reinforces the two-step process now that both equations have been explained, as a quick reference before the worked example.

1. **Evidence Conditioning Step** — apply Bayes' rule to the new correct-or-incorrect observation, producing a posterior that reflects what the evidence implies about current mastery.
2. **Learning Transition Step** — apply the transit parameter to that posterior, producing the prior the next observation will use, accounting for learning that may have happened since the last opportunity.

Seeing the two steps run across several real observations, with the actual numbers at each stage, makes the process far more concrete than the equations alone. The MicroSim below traces one student, one concept, and four observations end to end.

#### Diagram: Tracing One Student's Mastery Across Four Observations

<iframe src="../../sims/bkt-mastery-trace-stepper/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Tracing One Student's Mastery Across Four Observations</summary>
Type: microsim
**sim-id:** bkt-mastery-trace-stepper<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: compute, trace

Learning objective: Let the learner compute the Prior Mastery Probability after each of four observations using the Evidence Conditioning Step and the Learning Transition Step, tracing exactly how the numbers move rather than watching an abstract animation.

Purpose: A step-through worked example for a fixed, concrete scenario — one student, one concept, four graded observations — so the learner sees every intermediate number the two equations produce, per the "data visibility" pattern rather than a continuous animation that would hide the arithmetic.

Scenario: A student working on "Balancing Chemical Equations." Parameters pinned at the top for the whole session: prior P(L0) = 0.30, slip p_slip = 0.10, guess p_guess = 0.20, transit p_transit = 0.15. Evidence sequence: correct, incorrect, correct, correct.

Controls: "Next Observation" and "Back" buttons to step through one observation at a time, a "Reset" button, and a dropdown offering two alternate preset sequences ("all four correct" and "two slips in a row") for comparison.

Data Visibility Requirements:
Stage 0 (before any observation): show "P(L0) = 0.30" alongside the four pinned parameter values.
Stage 1 (Observation 1: correct): show the conditioning equation with numbers substituted — P(L0 | correct) = (0.30 × 0.90) / (0.30 × 0.90 + 0.70 × 0.20) = 0.27 / 0.41 ≈ 0.66 — then the transition equation — P(L1) = 0.66 + (1 − 0.66) × 0.15 ≈ 0.71.
Stage 2 (Observation 2: incorrect): show P(L1 | incorrect) = (0.71 × 0.10) / (0.71 × 0.10 + 0.29 × 0.80) = 0.071 / 0.303 ≈ 0.23, then P(L2) = 0.23 + (1 − 0.23) × 0.15 ≈ 0.35.
Stage 3 (Observation 3: correct): show P(L2 | correct) ≈ 0.71, then P(L3) ≈ 0.75.
Stage 4 (Observation 4: correct): show P(L3 | correct) ≈ 0.93, then P(L4) ≈ 0.94.
At every stage, a running line chart below the equations plots P(Ln) for all stages reached so far, with the current stage's point highlighted.

Interactive features: Every displayed number is computed live in JavaScript from the pinned parameters and selected sequence, not pre-baked text, so switching the preset recomputes every stage. Hovering an equation term (e.g., "p_slip") opens a tooltip repeating that parameter's definition.

Instructional Rationale: A step-through, data-visible worked example suits this Apply-level objective because the learner needs the exact intermediate numbers before generalizing; a continuous animation would hide which arithmetic step produced which number.

Responsive design: Layout stacks the parameter bar, equation panel, and chart vertically below tablet width; all controls remain keyboard-reachable.
</details>

Notice what the trajectory in that MicroSim shows: mastery does not climb in a straight line. Observation 2's incorrect answer pulls \(P(L_n)\) down sharply, from roughly 0.71 to roughly 0.35, because the conditioning step takes the evidence seriously. But it never crashes to zero, because the slip parameter already accounts for the possibility that a mostly-competent student can still answer incorrectly. And it never gets stuck, because the transit parameter keeps nudging the estimate upward between observations even after a setback. That combination — evidence that matters, but never catastrophically, plus steady room for growth — is what BKT was built to produce.

## Soft Correctness Mapping: Evidence Beyond Right and Wrong

Both update equations above expect a strictly binary input: correct or incorrect. Most of what a Learning Record Store actually receives is not that clean. A student scrolling through a page, dragging a slider on a MicroSim, or replaying part of a simulation produces evidence that is real but is not naturally a pass/fail result. **Soft Correctness Mapping** is the step that converts this non-binary evidence into a value in \([0,1]\) that the two BKT equations can treat as a stand-in for "how correct was this," before it is blended into the update.

The design specification is explicit that this mapped value should not be trusted as much as a graded response: "Non-binary evidence (dwell time, MicroSim interaction depth) is mapped to a soft correctness in \([0,1]\) and blended, with a lower evidence weight than a graded response — reading a page is weak evidence of mastery and the model should say so." A student who spends three minutes on a page has done *something*, but that something is far weaker evidence of mastery than answering a quiz question correctly.

!!! mascot-encourage "The Math Looks Intimidating — the Idea Doesn't Have to"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If the fractions in the two update equations still feel dense, hold onto the plain-language version instead: a correct answer counts for more when the student rarely slips, an incorrect answer counts for less when a lucky guess is common, and anything short of a graded answer counts for less still. Every equation in this chapter is a precise way of saying exactly that.

Worth being candid about here: the design specification names this mapping as genuinely unresolved. No component yet owns the decision of *where* soft correctness gets computed — whether a stream-side component derives it from raw `MicroSimEngagement` facts using a per-MicroSim registry, or authoring tooling computes a proxy client-side and embeds it directly in a statement's `result.score`. That open question changes only which component produces the \([0,1]\) input; the chart below makes the *shape* of the mapping concrete regardless of who implements it.

#### Diagram: From Raw Evidence to Soft Correctness

<iframe src="../../sims/bkt-soft-correctness-mapping/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Raw Evidence to Soft Correctness</summary>
Type: chart
**sim-id:** bkt-soft-correctness-mapping<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/theory-of-knowledge/tree/main/docs/sims/evidence-strength-hierarchy<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: evaluate, differentiate

Learning objective: Let the learner evaluate how different raw evidence signals (a graded quiz answer, dwell time on a page, MicroSim interaction depth) map to a soft correctness value and a blending weight, and differentiate why non-binary evidence should count for less than a graded response.

Purpose: Show, as an interactive bar chart, how three evidence types convert into a soft correctness value in [0,1] plus a separate evidence weight, so the learner sees both numbers move together as the underlying signal changes.

Controls: A toggle selecting evidence type — "Graded quiz response" (binary), "Page dwell time" (slider, 0–300 seconds), "MicroSim interaction depth" (slider, 0–20 interactions) — plus a "Compare to a graded response" checkbox that overlays a fixed reference bar at weight 1.0.

Visual elements: Two side-by-side bars per selection, "Soft Correctness" (0–1) and "Evidence Weight" (0–1), updating live as the slider moves. A graded response fixes Evidence Weight at 1.0; dwell time and interaction depth both show Soft Correctness rising smoothly with the slider but Evidence Weight capped well below 1.0 (illustrative default: 0.3), reinforcing that this evidence counts for less.

Interactive features: Moving a slider recomputes both bars immediately. Hovering a bar shows its exact value and a one-sentence explanation matching this chapter's prose. An "Open question" info icon notes that the specification leaves the owning component for this mapping undecided.

Color scheme: Soft Correctness bars in the book's teal accent color; Evidence Weight bars in muted gray; the reference graded-response bar in amber when enabled.

Responsive design: Chart resizes to its container; below tablet width the bars stack vertically and the toggle becomes a dropdown.
</details>

## Where the Update Actually Runs

Every equation in this chapter runs inside the Stream Processor, as the fourth enrichment step Chapter 9 named: pseudonymize, resolve the activity, map to concepts, then score mastery. That ordering matters for a reason specific to BKT — sequential Bayesian updates do not commute, so the same evidence processed in a different order produces a different final \(P(L_n)\). The partition key `district_id:student_key` guarantees one learner's statements are consumed in the order they arrived, so the two update steps almost always see evidence in the right sequence; a rare late-arriving statement instead triggers a targeted replay of the affected (student, concept) pair from the ordered log. \(P(L_n)\) itself is checkpointed to a compacted topic keyed by `{student_key}:{concept_id}`, so a cache failure loses only performance, never the mastery state itself.

## Key Takeaways

- **Bayesian Knowledge Tracing (BKT)** is the algorithm ADR-006 selects to implement the Mastery Computation Function, chosen over a weighted moving average, Elo, and IRT because its output is an interpretable probability with O(1) update cost.
- **Prior Mastery Probability**, \(P(L_n)\), is the running estimate that feeds every update; a brand-new concept borrows its starting value from its taxonomy category's cold-start priors.
- The **Slip Parameter**, \(p_{slip}\), keeps a single careless mistake from a mastered student from crashing the mastery estimate.
- The **Guess Parameter**, \(p_{guess}\), keeps a single lucky guess from an unmastered student from inflating the mastery estimate.
- The **Transit Parameter**, \(p_{transit}\), is the only place actual learning between opportunities enters the model.
- The **Evidence Conditioning Step** applies Bayes' rule to fold a new correct-or-incorrect observation into the current prior, producing a posterior.
- The **Learning Transition Step** applies the transit parameter to that posterior, producing the prior the next observation will condition on.
- **Soft Correctness Mapping** converts non-binary evidence like dwell time or MicroSim interaction depth into a \([0,1]\) value, blended with a lower weight than a graded response — a mapping the design specification names but does not yet assign an owning component.

!!! mascot-celebration "You Can Now Read a Mastery Score Like an Expert"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Every \(P(L_n)\) on every dashboard in this book now has a name for where it came from. What does the evidence show? The equations are only half the system — next, [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md) opens up the specific components, including the Stream Processor that runs this very update, in much finer detail.
