---
title: Reading the Experiment Readout Dashboard
description: Let the learner practice judging, from a single mocked-up readout, whether an experiment's result is trustworthy enough to act on — weighing effect size, confidence interval width, sample-ratio mismatch status, and guardrail flags together rather than looking at any one number in isolation.
status: implemented
library: p5.js
bloom_level: Evaluate (L5)
---

# Reading the Experiment Readout Dashboard



<iframe src="main.html" width="100%" height="502"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md).

```text
Type: chart
**sim-id:** experiment-readout-dashboard-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Let the learner practice judging, from a single mocked-up readout, whether an experiment's result is trustworthy enough to act on — weighing effect size, confidence interval width, sample-ratio mismatch status, and guardrail flags together rather than looking at any one number in isolation.

Canvas layout: A single dashboard mockup with four stacked panels matching the table in this section: (1) a small allocation bar showing 50/50 planned versus 52/48 actual with an SRM status badge; (2) a bar chart of mean primary-metric outcome for control versus treatment, each bar with a vertical confidence-interval whisker; (3) a row of guardrail metric badges (green "OK" or red "Regression Flag"); (4) a text verdict line that updates based on the controls below.

Interactive controls: A `createSlider()` control lets the learner drag the treatment arm's mean outcome up or down, which live-redraws the confidence-interval whiskers and recomputes a simplified Cohen's d shown beside the chart. A `createCheckbox()` toggles "Trigger sample-ratio mismatch" (shifts the allocation bar and flips the SRM badge to a failure state). A second `createCheckbox()` toggles "Trigger guardrail regression" (flips one guardrail badge to red). The verdict text at the bottom changes dynamically: a clean, significant, guardrail-safe result reads "Ready to ship"; an SRM failure reads "Investigate assignment before trusting this result"; a guardrail regression reads "Primary metric improved, but a guardrail regressed — do not ship without review."

Default parameters: Treatment mean set 0.3 standard deviations above control (Cohen's d ≈ 0.3), both mismatch and guardrail toggles off at start, so the default view shows a clean, shippable result.

Color coding: Control arm in gray-blue, treatment arm in the book's teal accent color, guardrail badges in green/red, verdict text background shifting from green to amber to red depending on which toggles are active.

Responsive design: Panels stack vertically at any width; on narrow viewports the sliders and checkboxes move below the chart rather than beside it, and the canvas width tracks its containing element.
```

## Related Resources

- [Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md)
