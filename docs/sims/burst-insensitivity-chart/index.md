---
title: Burst Insensitivity — Graph Write Rate vs. Ingest Rate
description: Evaluate a burst-test result by comparing an ingest-rate line against a graph-write-rate line across a 5x load increase, and judge whether the pattern confirms or falsifies the burst insensitivity claim.
status: implemented
library: Chart.js
bloom_level: Evaluate (L5)
---

# Burst Insensitivity — Graph Write Rate vs. Ingest Rate



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md).

```text
Type: chart
**sim-id:** burst-insensitivity-chart<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Evaluate a burst-test result by comparing an ingest-rate line against a graph-write-rate line across a 5x load increase, and judge whether the pattern confirms or falsifies the burst insensitivity claim.

Chart type: Dual-line chart over a shared time axis (seconds, 0-600s), left y-axis "Ingest rate (statements/sec)" 0-1200, right y-axis "Graph write rate (upserts/sec)" 0-1200.

Default state ("Passing result"): Ingest-rate line steps from 200 to 1,000 statements/sec at t=300s and holds. Graph-write-rate line stays essentially flat around 60-70 upserts/sec (scaled to this MVP's smaller population) through the step change, with minor jitter.

Toggle — "Show failing (hypothetical) result": redraws the graph-write-rate line climbing in step with ingest after t=300s, so the learner can contrast both outcomes on the same axes.

Toggle — "Show test parameters": overlays an annotation panel listing baseline rate, burst rate, ratio (5x), and the 60s sync cadence.

Interactive features: Hovering any point shows its value and timestamp. Clicking the dashed line at t=300s (burst onset) opens an infobox on what changes at that moment. A caption below updates per toggle: "Flat graph writes under 5x ingest: the architecture holds" versus "Climbing graph writes: the architecture does not decouple as designed."

Color scheme: Ingest-rate line in the book's teal accent color; graph-write-rate line in a contrasting warm color; the failing line renders in warning amber.

Responsive design: Resizes to its container's width; legend and toggles stack below on narrow viewports; touch targets stay tap-sized.
```

## Related Resources

- [Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md)
