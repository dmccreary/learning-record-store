---
title: Graph Write Rate vs. Compression Sync Cadence
description: Let the learner evaluate the tradeoff between sync cadence, graph write rate, and graph lag in Change-Driven Materialization, and predict how each candidate cadence would behave during an ingestion burst.
status: implemented
library: Chart.js
bloom_level: Analyze (L4)
---

# Graph Write Rate vs. Compression Sync Cadence



<iframe src="main.html" width="100%" height="472"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md).

```text
Type: chart
**sim-id:** write-rate-vs-sync-cadence<br/>
**Library:** Chart.js<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/it-management-graph/tree/main/docs/sims/native-graph-storage-vs-graph-layer-performance-comparison<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: evaluate, predict

Learning objective: Let the learner evaluate the tradeoff between sync cadence, graph write rate, and graph lag in Change-Driven Materialization, and predict how each candidate cadence would behave during an ingestion burst.

Purpose: Render the three sync-cadence scenarios from this section's prose as a grouped bar-and-line chart so the tradeoff is visible at a glance rather than read out of a table.

Data: Three x-axis categories — "5 s", "60 s (default)", "300 s". Bar series "Graph upserts/sec" (left y-axis, linear): 10000, 2500, 1000. Dashed line series "Graph lag" (right y-axis, labeled in seconds, log scale): 5, 60, 300.

Interactive features: Hovering any bar or line point shows a tooltip with that cadence's exact statements-coalesced and distinct-active-grain figures (e.g. "60 s: ~600K statements coalesced into ~150K distinct active grains -> ~2,500 upserts/sec"). A toggle labeled "Simulate 5x ingest burst" recomputes the statement-count figures upward five-fold in the tooltip while holding the "Graph upserts/sec" bars nearly constant, demonstrating the insensitivity property described below the chart. The "60 s (default)" bar carries a highlight border.

Color scheme: Bars in the book's teal accent color, with the default-cadence bar in the darkest shade; the graph-lag line in a contrasting amber dashed stroke so the two series stay visually distinct on shared axes.

Responsive design: Chart canvas resizes to the width of its containing element on window resize, using Chart.js's built-in responsive option; the legend moves below the chart on narrow viewports.
```

## Related Resources

- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md)
