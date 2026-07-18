---
title: Processor Batch Loop — Dedup, Score, and Replay
description: Let the learner trace a batch of statements through the processor's Kafka Consumer Batch Window, ReplacingMergeTree Dedup, and BKT Streaming Update, then differentiate the ordinary redelivery path from the late-arrival path that triggers a Targeted Replay Command.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Processor Batch Loop — Dedup, Score, and Replay



<iframe src="main.html" width="100%" height="642"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md).

```text
Type: workflow
**sim-id:** processor-batch-dedup-replay<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace a batch of statements through the processor's Kafka Consumer Batch Window, ReplacingMergeTree Dedup, and BKT Streaming Update, then differentiate the ordinary redelivery path from the late-arrival path that triggers a Targeted Replay Command.

Purpose: Show a Mermaid flowchart with a main loop and one branch for the late-arrival exception.

Nodes: "Consume batch: up to 1,000 statements or 200ms (Kafka Consumer Batch Window)" leads to "Pseudonymize + resolve + enrich" leads to "BKT Streaming Update per (student, concept), in partition order" leads to "Write batch to ClickHouse; ReplacingMergeTree Dedup absorbs any redelivered rows" leads to "Checkpoint mastery state to Compacted State Checkpoint topic" leads to "Commit Kafka offset". A separate branch from "Consume batch": "Late Arrival Detector flags a statement far behind the watermark" leads to "Enqueue Targeted Replay Command scoped to (student, concept)" leads to "Recompute mastery trajectory in order, directly from the ClickHouse log" leads back into "Checkpoint mastery state".

Interactive features: Every node has a Mermaid click directive opening a definition infobox, with the dedup and BKT nodes' infoboxes explicitly contrasting idempotent-by-construction against order-sensitive. A toggle labeled "Show why order matters" highlights the BKT node and the late-arrival branch in a shared color, dimming the rest of the diagram.

Color coding: The main loop in the book's teal accent color; the late-arrival branch in amber to flag it as the exception path; the Compacted State Checkpoint node in a distinct violet since it is a durability mechanism rather than a processing step.

Responsive design: Flowchart resizes to the width of its containing element; the late-arrival branch collapses beneath the main loop on narrow viewports rather than sitting beside it.
```

## Related Resources

- [Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md)
