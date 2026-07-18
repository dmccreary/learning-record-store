---
title: Statement Ingestion Pipeline — From Statement to Summary Vertex
description: Let the learner trace a single xAPI statement's full path from the xAPI Statement Resource through the Ingestion Gateway, the Durable Event Queue, the Stream Processor, the Event Store, and the Compression Pipeline, to a Summary Vertex, and explain what each stage is responsible for.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# Statement Ingestion Pipeline — From Statement to Summary Vertex



<iframe src="main.html" width="100%" height="622"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md).

```text
Type: workflow
**sim-id:** statement-ingestion-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/context-graph/tree/main/docs/sims/graph-etl-pipeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, sequence

Learning objective: Let the learner trace a single xAPI statement's full path from the xAPI Statement Resource through the Ingestion Gateway, the Durable Event Queue, the Stream Processor, the Event Store, and the Compression Pipeline, to a Summary Vertex, and explain what each stage is responsible for.

Purpose: Show a seven-node, left-to-right Mermaid flowchart tracing one statement's complete journey, reusing the component names this book has already established in Chapter 5 and this chapter, so the learner sees the two chapters' vocabulary as one continuous pipeline rather than two separate diagrams.

Nodes, in order: "xAPI Statement Resource (POST /xapi/statements)"; "Ingestion Gateway (Structural Validation)"; "Durable Event Queue (At-Least-Once Delivery)"; "Stream Processor (Semantic Validation, Schema On Read)"; "Event Store (immutable statement log)"; "Compression Pipeline (Change-Driven Materialization)"; "Summary Vertex (Absolute Value Write)". Edges connect each node to the next in a single left-to-right chain.

Interactive features: Every node has a Mermaid `click` directive opening an infobox with that node's definition from this chapter's prose (Structural Validation, At-Least-Once Delivery, Semantic Validation plus Schema On Read, the Event Store recalled from Chapter 5, Change-Driven Materialization, and Absolute Value Write, in node order).

Color coding: Nodes 1-3 (Ingestion Plane and the queue) in the darkest teal from Chapter 5's plane-gradient palette; node 4 (Processing Plane) in a mid-teal; nodes 5-7 (Storage Plane and the compression pipeline) in the lightest teal.

Implementation: Mermaid flowchart, single left-to-right chain, full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the chain reflows top-to-bottom.
```

## Related Resources

- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md)
