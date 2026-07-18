---
title: MicroSim Impact — Observational Delta vs. a Controlled Effect
description: Let the learner evaluate why an observational mastery delta between MicroSim users and non-users can be confounded by a hidden third factor, and justify why only a controlled experiment can support a causal claim about the MicroSim's effect.
status: implemented
library: p5.js
bloom_level: Evaluate (L5)
---

# MicroSim Impact — Observational Delta vs. a Controlled Effect



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md).

```text
Type: chart
**sim-id:** microsim-impact-observational-vs-controlled<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/theory-of-knowledge/tree/main/docs/sims/correlation-causation<br/>

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Let the learner evaluate why an observational mastery delta between MicroSim users and non-users can be confounded by a hidden third factor, and justify why only a controlled experiment can support a causal claim about the MicroSim's effect.

Canvas layout: Two side-by-side panels. The left panel shows a simple bar comparison — "Used the MicroSim" versus "Skipped the MicroSim" — each bar's height set by mean mastery score, with a visible gap between them labeled "Observed Delta." The right panel shows the same two groups after a third variable, "Prior Mastery Band," is revealed as a `createSlider()`-controlled toggle: when toggled on, both groups split into low/medium/high prior-mastery sub-bars, and the gap in the left panel visibly shrinks or reverses within each sub-band.

Interactive features: A "Reveal confound" button animates the transition from the left panel's simple comparison to the right panel's stratified view. Hovering any bar shows the exact mean mastery score and student count behind it. A caption below the chart updates dynamically: before the reveal, "Naive comparison: MicroSim users score higher"; after the reveal, "Within each prior-mastery band, the gap shrinks — the naive comparison was partly measuring who was already stronger, not what the MicroSim taught."

Color coding: Both groups shaded in neutral gray-blue before the reveal; after the reveal, prior-mastery sub-bands shaded on a light-to-dark scale to visually separate the confound from the outcome measure.

Responsive design: The two panels stack vertically on narrow viewports instead of appearing side by side, with the "Reveal confound" button remaining full-width and easy to tap.
```

## Related Resources

- [Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md)
