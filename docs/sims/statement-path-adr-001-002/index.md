---
title: Statement Path Under ADR-001 and ADR-002
description: Let the learner trace one xAPI statement's storage path and explain, node by node, which decision (ADR-001 or ADR-002) governs each hop, reinforcing that the graph never receives a per-statement write.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Statement Path Under ADR-001 and ADR-002



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md).

```text
Type: workflow
**sim-id:** statement-path-adr-001-002<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Let the learner trace one xAPI statement's storage path and explain, node by node, which decision (ADR-001 or ADR-002) governs each hop, reinforcing that the graph never receives a per-statement write.

Purpose: A single Mermaid flowchart showing one statement's journey from arrival to its two eventual resting places — full-fidelity storage and, much later, a compressed summary.

Nodes: "Statement arrives at the gateway" leads to "Written to ClickHouse, full JSON, full fidelity (ADR-001)" leads to "AggregatingMergeTree materialized view rolls the statement into its grain, incrementally, at zero app cost (ADR-002)". A second branch from the materialized-view node leads to "Every 60s: summarizer reads only grains whose last_seen advanced" leads to "Summarizer writes an absolute value to Neo4j via MERGE + SET, never += (ADR-002)" leads to "One compressed summary vertex in Neo4j, per grain, never per statement (ADR-001)". A dead-end node off the ClickHouse node reads "No arrow from here ever reaches Neo4j directly — nothing per-statement is ever written to the graph."

Interactive features: Every node has a Mermaid click directive. Clicking the ClickHouse node opens an infobox explaining ADR-001 in one paragraph, quoting "ClickHouse is the immutable system of record for every statement, at full fidelity." Clicking the materialized-view node or the summarizer node opens an infobox explaining ADR-002's absolute-write mechanism and why streaming deltas were rejected. Clicking the final Neo4j summary-vertex node opens an infobox reminding the learner that the graph schema has no Statement label at all. Clicking the dead-end node opens an infobox stating the C-1 constraint from Chapter 8 in one sentence.

Color coding: The ClickHouse path in the book's teal accent color; the summarizer/graph path in a complementary amber to visually separate "every statement, immediately" from "one absolute value, every 60 seconds."

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom instead of left-to-right.
```

## Related Resources

- [Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md)
