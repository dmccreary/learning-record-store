---
title: From Gateway to Event Store — the Ingestion and Processing Pipeline
description: Let the learner trace one xAPI statement's path from an intelligent textbook through the Ingestion Gateway, the Durable Event Queue, and the Stream Processor, into the Event Store, and predict which steps can proceed even if a later step is temporarily unavailable.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# From Gateway to Event Store — the Ingestion and Processing Pipeline



<iframe src="main.html" width="100%" height="672px"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md).

```text
Type: workflow
**sim-id:** ingestion-processing-storage-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/context-graph/tree/main/docs/sims/ingestion-pipeline-architecture<br/>

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, demonstrate

Learning objective: Let the learner trace one xAPI statement's path from an intelligent textbook through the Ingestion Gateway, the Durable Event Queue, and the Stream Processor, into the Event Store, and predict which steps can proceed even if a later step is temporarily unavailable.

Purpose: Show a six-step, left-to-right Mermaid flowchart tracing one statement from submission to durable storage, with a visible branch showing non-blocking behavior.

Steps:

1. "Intelligent Textbook sends statement" — a POST request carrying one xAPI statement
2. "Ingestion Gateway validates structure" — checks actor, verb, object, and timestamp are present and well-formed
3. "Ingestion Gateway queues statement" — hands the statement to the Durable Event Queue and responds immediately
4. "Durable Event Queue holds statement in order" — preserves per-learner sequence until a processor consumes it
5. "Stream Processor consumes and enriches" — resolves the learner, attaches section and concept context, pseudonymizes the actor
6. "Stream Processor writes to Event Store" — the statement becomes part of the durable, queryable log

Branch: from step 3, a dashed arrow to a side node "If the Stream Processor is temporarily down" leading to "Statement waits safely in the Durable Event Queue — the textbook already received its response in step 3."

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-3 opens an infobox describing the Ingestion Plane's narrow responsibility. Clicking steps 4-6 opens an infobox describing the Processing Plane's enrichment work and the Storage Plane's role as the destination. Clicking the branch node opens an infobox explaining non-blocking ingestion in one worked sentence.

Color coding: Steps 1-3 (Ingestion Plane) in the darkest teal from the System Context Diagram's gradient; steps 4-5 (Processing Plane) in a mid-teal; step 6 and the Event Store destination (Storage Plane) in the lightest teal, keeping the color language consistent across every diagram in this chapter.

Implementation: Mermaid flowchart, left-to-right orientation, one dashed branch node, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md)
