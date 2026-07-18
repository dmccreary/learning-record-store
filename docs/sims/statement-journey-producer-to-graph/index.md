---
title: Statement Journey — Producer to Graph
description: Let the learner decompose a single xAPI Statement into its storage destinations, tracing one JSON field from the producer through the gateway to a ClickHouse column and on to a Neo4j summary-vertex property.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Statement Journey — Producer to Graph



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md).

```text
Type: workflow
**sim-id:** statement-journey-producer-to-graph<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, decompose

Learning objective: Let the learner decompose a single xAPI Statement into its storage destinations, tracing one JSON field from the producer through the gateway to a ClickHouse column and on to a Neo4j summary-vertex property.

Purpose: A Mermaid flowchart with four stages left to right: "Producer emits Statement JSON" → "Gateway validates" → "ClickHouse lrs.statements row" → "Compression pipeline" → "Neo4j summary vertex property." The ClickHouse stage fans out into five field boxes (object_id, object_type, result_success, duration_ms, concept_ids), each fanning into its Neo4j counterpart.

Interactive features: Every node and field box has a Mermaid `click` directive. Clicking "Gateway validates" lists the three rejection triggers from this chapter: an invalid verb, an unmapped object type, a missing grouping[0]. Clicking a field box shows that row from the Field To Column Map table. Clicking the Neo4j stage restates that summary vertices are projections, reproducible by replaying the log — tying back to Chapter 7.

Color coding: Producer and gateway stages in teal; ClickHouse and Neo4j in deeper blue; the compression arrow in amber.

Implementation: Mermaid flowchart, left-to-right, full click-to-infobox coverage. Responsive: stacks top-to-bottom below tablet width.
```

## Related Resources

- [Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md)
