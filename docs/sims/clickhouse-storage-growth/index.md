---
title: ClickHouse Storage Growth Over the Retention Window
description: Let the learner apply the ~22 GB/day ClickHouse ingest figure to project cumulative storage across a seven-year retention window, and observe where the tiering policy changes the growth curve's slope.
status: scaffold
library: Chart.js
bloom_level: Apply (L3)
---

# ClickHouse Storage Growth Over the Retention Window



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md).

```text
Type: chart
**sim-id:** clickhouse-storage-growth<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: calculate, estimate

Learning objective: Let the learner apply the ~22 GB/day ClickHouse ingest figure to project cumulative storage across a seven-year retention window, and observe where the tiering policy changes the growth curve's slope.

Chart type: Line chart with one primary series and one annotated reference line

Purpose: Show cumulative ClickHouse storage climbing from day zero to the seven-year retention ceiling, so the reader sees the ~28 TB figure as the endpoint of a calculable curve rather than an isolated fact.

X-axis: Months since launch, 0 to 84 (seven years)
Y-axis: Cumulative storage, terabytes, 0 to 30

Data series:

1. "ClickHouse primary-disk storage" (teal line): rises at approximately 0.66 TB/month (22 GB/day × 30) up to month 13, then the slope visibly flattens as data older than 13 months tiers to the object store, leveling toward the ~28 TB figure by month 84.
2. Reference line (amber, dashed, horizontal): "Kafka disk, 7-day retention — always ~1.1 TB" — flat across the entire chart, to make the contrast explicit between a bounded replay buffer and a growing system of record.

Annotations:

- A marker at month 13 labeled "Tiering to S3/MinIO begins — data older than 13 months moves off primary disk"
- A marker at month 84 labeled "~28 TB at 7-year retention"

Interactive features: Hovering any point on either line reveals a tooltip with the exact month and cumulative GB/TB value. A toggle control lets the learner switch the X-axis between "Months" and "School years" (assuming a 180-day school year), recomputing the tick labels without changing the underlying data. Clicking the month-13 marker opens an infobox explaining the tiering policy in one sentence, matching this chapter's prose.

Color scheme: ClickHouse growth line in the book's teal accent color; the flat Kafka reference line in amber, consistent with this chapter's other diagrams' color language for "bounded buffer" versus "growing store."

Responsive design: Chart resizes to the width of its containing element and remains readable at tablet width, with the legend moving below the plot area on narrow viewports.
```

## Related Resources

- [Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md)
