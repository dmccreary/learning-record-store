---
title: Chaos Kill Test Simulator
description: Given a choice of which service to kill in a simulated staging environment, predict the resulting system behavior before revealing it, reinforcing this chapter's failure-mode-to-behavior mapping.
status: implemented
library: p5.js
bloom_level: Evaluate (L5)
---

# Chaos Kill Test Simulator



<iframe src="main.html" width="100%" height="482"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md).

```text
Type: microsim
**sim-id:** chaos-kill-test-simulator<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: predict, verify

Learning objective: Given a choice of which service to kill in a simulated staging environment, predict the resulting system behavior before revealing it, reinforcing this chapter's failure-mode-to-behavior mapping.

Canvas layout: A simplified system diagram across the top (Gateway, Kafka, Processor, ClickHouse, Summarizer, Neo4j, Redis, Identity Service as clickable icons) and a control/readout panel below.

Visual elements: Each icon shows a green "healthy" indicator by default. A row of status lights tracks "Ingestion," "Graph Freshness," and "Dashboard Latency" as green/amber/red, updating live as the simulated failure plays out.

Interactive controls: A dropdown listing the eight services; a "Predict" step where the learner picks "No data loss" / "Some data loss" / "System fully down" before revealing the result; "Kill Service," "Restore Service," and "Reset" buttons.

Default parameters: All services healthy; none pre-selected; prediction required before the kill button activates.

Behavior: On "Kill Service," the icon turns red and the status lights animate to that failure's actual behavior from this chapter's table (killing Kafka turns "Ingestion" red immediately; killing Neo4j turns "Graph Freshness" amber and climbing; killing Redis turns only "Dashboard Latency" amber). An infobox then reveals the failure's detection, behavior, and response, comparing it against the learner's prediction. "Restore Service" recovers the icon and lights at the pace described for that failure (immediate for Redis, gradual for Neo4j and the summarizer).

Implementation notes: p5.js with a simple per-service state machine (healthy/failing/recovering) driven by a lookup table keyed to the twelve failure modes. Responsive design: diagram and panel stack vertically on narrow viewports; click targets stay at least 44 pixels for touch use.
```

## Related Resources

- [Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md)
