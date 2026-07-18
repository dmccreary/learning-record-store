---
title: Naive vs. Compressed Graph Write Rate
description: Let the learner compare the naive per-statement graph write rate against the compressed summarizer write rate side by side, and attribute the ~20x reduction to the specific mechanism (ADR-001/ADR-002) that produces it.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# Naive vs. Compressed Graph Write Rate



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md).

```text
Type: graph-model
**sim-id:** naive-vs-compressed-graph-write-rate<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Let the learner compare the naive per-statement graph write rate against the compressed summarizer write rate side by side, and attribute the ~20x reduction to the specific mechanism (ADR-001/ADR-002) that produces it.

Purpose: Two clusters of nodes in one vis-network canvas, contrasting a rejected design against the accepted one, both grounded in this chapter's own figures.

Nodes, left cluster "Naive (rejected)": "10,000 statements/sec" connects to "~4 edges per statement" connects to "~50,000 graph writes/sec" connects to a red-flagged node "Prohibited — spec §5.6 C-1, no property graph operates here."

Nodes, right cluster "Compressed (ADR-001 + ADR-002, accepted)": "10,000 statements/sec" connects to "ClickHouse AggregatingMergeTree rollup (no app-level state)" connects to "~150,000 distinct active grains per 60s window" connects to "~2,500 batched graph upserts/sec via summarizer" connects to a green-flagged node "Comfortable for Neo4j via UNWIND."

Interactive features: Clicking any node opens an infobox with that node's number and a one-sentence source (this chapter's capacity model or the ADR that produced it). Hovering an edge shows the multiplier or reduction it represents (e.g., hovering the edge into "~50,000 graph writes/sec" shows "10,000 × ~4"). A toggle labeled "Show burst scenario" re-labels the "10,000 statements/sec" nodes to "50,000 statements/sec (burst)" and updates the naive cluster's math to ~250,000 writes/sec while the compressed cluster's downstream numbers stay visibly unchanged — reinforcing that compression absorbs a 5x burst almost entirely.

Color coding: The naive cluster in a muted red-gray to signal "rejected"; the compressed cluster in the book's teal accent color to signal "accepted design."

Responsive design: vis-network's physics layout recalculates on window resize; clusters stack vertically below tablet width.
```

## Related Resources

- [Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md)
