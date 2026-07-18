---
title: Accept-First Ingestion and Reconciliation Flow
description: Let the learner explain how a newly published textbook can emit statements before its metadata is registered, and sequence the four steps of Accept-First Ingestion from a statement's arrival to a Provisional Node's promotion.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Accept-First Ingestion and Reconciliation Flow



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md).

```text
Type: workflow
**sim-id:** accept-first-reconciliation-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Let the learner explain how a newly published textbook can emit statements before its metadata is registered, and sequence the four steps of Accept-First Ingestion from a statement's arrival to a Provisional Node's promotion.

Purpose: Show a six-node, left-to-right Mermaid flowchart tracing one never-before-seen textbook's first statement from arrival through reconciliation, matching the four numbered steps described in this chapter's prose.

Nodes, in order: "Statement arrives naming an unknown textbook_id/version_id"; "Ingestion Gateway accepts it (Accept-First Ingestion)"; "Stream Processor auto-provisions a stub (Provisional Node, provisional: true)"; "Event Store retains the statement immutably"; "Reconciliation Worker matches the stub against published metadata (git_sha, then IRI path, then title similarity)"; "Node promoted (provisional: false), COVERS/EMBEDS/DEPENDS_ON back-filled — earlier statements become richly queryable retroactively". Edges connect each node to the next in sequence.

Interactive features: Every node has a Mermaid `click` directive opening an infobox with that node's definition from this chapter's prose — Schema On Read, Accept-First Ingestion, Provisional Node and its `provisional: true` property, the no-data-loss guarantee, the Reconciliation Worker's three-tier matching order, and retroactive queryability with a link back to Chapter 7's `COVERS`, `EMBEDS`, and `DEPENDS_ON` relationship types, in node order.

Color coding: The three "accept immediately" nodes in the book's teal accent color; the three "reconciled later" nodes in a complementary amber — visually separating what happens instantly from what happens eventually.

Implementation: Mermaid flowchart, single left-to-right chain, full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the chain reflows top-to-bottom.
```

## Related Resources

- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md)
