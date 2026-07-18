---
title: Complementary Suppression Attack
description: Demonstrate how a single suppressed small-group value in a published table can be recovered by subtraction from the row's published total, and justify why complementary suppression — hiding a second, larger cell — is required to actually protect it.
status: scaffold
library: Chart.js
bloom_level: Evaluate (L5)
---

# Complementary Suppression Attack



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md).

```text
Type: chart
**sim-id:** complementary-suppression-attack<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: demonstrate, justify

Learning objective: Demonstrate how a single suppressed small-group value in a published table can be recovered by subtraction from the row's published total, and justify why complementary suppression — hiding a second, larger cell — is required to actually protect it.

Chart type: Grouped bar chart with a toggle control, showing nine category counts (e.g., "reading level bands" across a grade) plus their published total.

Default state: All nine bars visible with real values; total bar shown alongside, correct and summing to the nine visible bars.

Toggle 1 — "Threshold suppression only": the one bar below the group-size threshold (value 4, threshold 10) is redrawn as a hatched "Suppressed" bar with no numeric label; the total bar is unchanged. An automatically computed "Recovered value" readout beneath the chart subtracts the eight visible bars from the total and displays the exact suppressed value, labeled in red: "Recovered by subtraction: 4 — suppression failed."

Toggle 2 — "Complementary suppression (D-5)": the same small bar is hidden, and a second, larger bar (chosen automatically as the smallest bar still above threshold) is also redrawn as hatched "Suppressed." The "Recovered value" readout now shows "Cannot be recovered — two unknowns, one equation," in teal, because subtracting seven known bars from the total leaves two suppressed values and one equation, which is not solvable.

Interactive features: Clicking either toggle animates the transition and updates the readout live. Hovering any bar shows a tooltip with its category label and value (or "Suppressed" if hidden). A small annotation links this scenario to Chapter 19's Privacy Adversarial Suite and its differencing-attack tests.

Color scheme: Visible bars in the book's teal accent color; suppressed bars in a hatched pattern over muted gray; the "Recovered" readout text in warning red when the attack succeeds and teal when it fails.

Responsive design: Chart and readout stack vertically on narrow viewports; toggle controls remain full-width and tappable.
```

## Related Resources

- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md)
