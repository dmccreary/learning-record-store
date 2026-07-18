---
title: Kafka Topic Map for the LRS Event Backbone
description: Let the learner classify each of the six Kafka topics by its key format, partition count, and retention policy, and explain why the compacted mastery-state topic differs structurally from the other five.
status: implemented
library: vis-network
bloom_level: Understand (L2)
---

# Kafka Topic Map for the LRS Event Backbone



<iframe src="main.html" width="100%" height="522"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md).

```text
Type: infographic
**sim-id:** kafka-topic-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Let the learner classify each of the six Kafka topics by its key format, partition count, and retention policy, and explain why the compacted mastery-state topic differs structurally from the other five.

Purpose: Show all six topics as nodes arranged around a central "Kafka / Redpanda Broker" hub node, so the learner can see the whole topic inventory at a glance before drilling into any one topic.

Nodes: One central hub node "Kafka / Redpanda Broker". Six satellite nodes, one per topic, each labeled with its exact topic string: "xapi.statements.raw", "xapi.statements.bulk", "xapi.statements.dlq", "lrs.reconcile", "lrs.mastery.state", "lrs.audit". Each satellite node's size scales with its partition count (48-partition topics render larger than 12-partition topics) so partition count is visible without clicking.

Interactive features: Clicking any satellite topic node opens an infobox showing that topic's key format, partition count, retention policy, and one-sentence purpose, matching the table already presented in this chapter. A toggle labeled "Group by retention family" re-colors nodes into three clusters — short-lived (7 days), long-lived (30-400 days), and compacted — so the learner can see the retention pattern structurally rather than by reading text.

Color coding: The compacted mastery-state topic in the book's teal accent color to visually flag it as the one structural outlier; the other five topics in a shared neutral blue-gray, differentiated only by node size (partition count).

Responsive design: Network graph resizes to the width of its containing element and re-centers on resize; on narrow viewports satellite nodes arrange in two rows instead of a full circle around the hub.
```

## Related Resources

- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md)
