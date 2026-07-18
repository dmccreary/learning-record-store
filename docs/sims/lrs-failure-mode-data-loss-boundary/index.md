---
title: The Data-Loss Boundary Across the Compression Pipeline
description: Given any one of six failure modes in the compression pipeline, classify it as occurring before or after the Kafka durability boundary and predict whether it can lose data.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# The Data-Loss Boundary Across the Compression Pipeline



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md).

```text
Type: workflow
**sim-id:** lrs-failure-mode-data-loss-boundary<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, trace

Learning objective: Given any one of six failure modes in the compression pipeline, classify it as occurring before or after the Kafka durability boundary and predict whether it can lose data.

Purpose: A Mermaid flowchart of the statement's path from a Learning Record Provider through the gateway, Kafka, the processor, ClickHouse, the summarizer, and Neo4j, with a vertical boundary line after Kafka separating "can lose data" from "cannot lose data."

Nodes in path order: "Learning Record Provider" -> "Ingestion Gateway" -> "Kafka (durability boundary)" -> "Processor" -> "ClickHouse (event log)" -> "Summarizer" -> "Neo4j (graph projection)". A separate node "Redis (mastery cache)" branches off ClickHouse/Neo4j reads.

Visual boundary: A dashed red vertical line crosses the diagram immediately after the Kafka node, labeled "Only failures left of this line can lose data."

Interactive features: Every node has a Mermaid click directive opening an infobox naming its associated failure mode (Gateway/Kafka: Kafka Unavailable Failure; Processor/ClickHouse: ClickHouse Unavailable Failure; Summarizer: Summarizer Stopped Failure and Summarizer Split Brain; Neo4j: Neo4j Unavailable Failure; Redis: Redis Unavailable Failure) with that failure's detection, behavior, and response. Clicking the boundary line opens an infobox on the "only the first row loses data" rule.

Color coding: Nodes left of the boundary shaded warning amber; nodes right of the boundary shaded the book's calm teal to signal "recoverable."

Responsive design: The flowchart reflows to a single column on narrow viewports, preserving the boundary line's position and all click handlers.
```

## Related Resources

- [Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md)
