---
title: The Four BKT Parameters Explorer
description: Let the learner explain what each of the four BKT parameters (prior, slip, guess, transit) controls, and illustrate how changing one parameter's value shifts a mastery trajectory while holding the evidence sequence fixed.
status: implemented
library: p5.js
bloom_level: Understand (L2)
---

# The Four BKT Parameters Explorer



<iframe src="main.html" width="100%" height="482"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md).

```text
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
```

## Related Resources

- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md)
