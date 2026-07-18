---
title: Production Monthly Cost Breakdown
description: Break down the production system's monthly cost into its component line items, and compare the on-demand total against the reserved-pricing total to see which line items are fixed and which shrink under a multi-year commitment.
status: implemented
library: Chart.js
bloom_level: Analyze (L4)
---

# Production Monthly Cost Breakdown



<iframe src="main.html" width="100%" height="452"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md).

```text
Type: chart
**sim-id:** production-monthly-cost-breakdown<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, break down

Learning objective: Break down the production system's monthly cost into its component line items, and compare the on-demand total against the reserved-pricing total to see which line items are fixed and which shrink under a multi-year commitment.

Chart type: Horizontal stacked bar chart, one bar per pricing mode, segments colored by line item (Kubernetes, Kafka, ClickHouse hot + cold tier, Neo4j infrastructure, Neo4j license, Redis, PostgreSQL, other).

Default state: "On-Demand" (~$10,300, Neo4j license as a hatched "unresolved" segment at the $3,000–8,000 placeholder midpoint) beside "Reserved (1–3 yr)" (~$7,000, segments scaled down 30–50% except the S3 cold tier and the Neo4j license, which don't discount).

Toggle — "Show Memgraph alternative": zeroes the Neo4j license segment on both bars, relabeling it "Memgraph (Apache-2.0, no license cost)," and shrinks each bar's total accordingly.

Interactive features: Hovering any segment shows its line item name, configuration, and dollar figure. Clicking the Neo4j license segment opens an infobox on why it's the largest source of uncertainty in the estimate.

Color scheme: Each line item a distinct palette hue; the unresolved Neo4j license segment hatched rather than solid to flag it as an estimate.

Responsive design: Bars and legend stack vertically on narrow viewports; hover targets stay tap-sized.
```

## Related Resources

- [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md)
