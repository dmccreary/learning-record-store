---
title: Grain Constraints and the Statement Label Prohibition
description: Let the learner simulate a summarizer write attempt against a Grain Uniqueness Constraint and observe why a second write for the same grain upserts rather than duplicates, then contrast that outcome with a hypothetical write carrying a forbidden :Statement label.
status: scaffold
library: vis-network
bloom_level: Evaluate (L5)
---

# Grain Constraints and the Statement Label Prohibition



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md).

```text
Type: graph-model
**sim-id:** grain-constraint-enforcement<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: justify, critique

Learning objective: Let the learner simulate a summarizer write attempt against a Grain Uniqueness Constraint and observe why a second write for the same grain upserts rather than duplicates, then contrast that outcome with a hypothetical write carrying a forbidden :Statement label.

Canvas layout:

- A central graph view showing one ConceptMastery node for a sample (student_key, concept_id) pair
- A control panel with two buttons: "Simulate MERGE write (same grain)" and "Simulate write with :Statement label"
- An event log panel below the graph showing the outcome of each simulated write attempt

Interactive controls:

- Button "Simulate MERGE write (same grain)" — animates a second write attempt for the identical (student_key, concept_id) pair; the graph shows the existing node's properties updating in place (mastery_score, evidence_count) rather than a new node appearing, and the event log records "MERGE matched existing grain — properties updated, no new vertex created"
- Button "Simulate write with :Statement label" — animates an attempted write of a per-statement node; the graph flashes the attempted node in red and it fails to attach, and the event log records "REJECTED — :Statement label is prohibited; lrs bootstrap --verify would fail this deployment"
- Button "Reset" — clears the event log and returns the graph to its single starting vertex

Behavior: Each simulated write appends a timestamped line to the event log panel so the learner can review the sequence of attempts and outcomes after several clicks.

Color coding: The legitimate ConceptMastery vertex in the book's teal accent color; the rejected hypothetical :Statement node flashes red before disappearing; the event log's successful entries in teal text and rejected entries in red text.

Responsive design: Control panel and event log stack below the graph view on narrow viewports instead of beside it; the graph canvas resizes to the width of its containing element.
```

## Related Resources

- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md)
