---
title: Tracing One Student's Mastery Across Four Observations
description: Let the learner compute the Prior Mastery Probability after each of four observations using the Evidence Conditioning Step and the Learning Transition Step, tracing exactly how the numbers move rather than watching an abstract animation.
status: scaffold
library: p5.js
bloom_level: Apply (L3)
---

# Tracing One Student's Mastery Across Four Observations



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md).

```text
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
```

## Related Resources

- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md)
