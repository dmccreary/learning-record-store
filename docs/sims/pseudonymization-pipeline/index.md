---
title: Pseudonymization Pipeline
description: Let the learner trace how a raw actor identifier becomes an irreversible `student_key`, following the hop from the statement body through the Mutual TLS Salt Fetch and the HMAC-SHA256 Pseudonymization computation to the pseudonymous key written to ClickHouse.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Pseudonymization Pipeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md).

```text
Type: workflow
**sim-id:** pseudonymization-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/pseudonymization-pipeline

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a raw actor identifier becomes an irreversible `student_key`, following the hop from the statement body through the Mutual TLS Salt Fetch and the HMAC-SHA256 Pseudonymization computation to the pseudonymous key written to ClickHouse.

Purpose: Show a single Mermaid flowchart tracing one raw actor identifier from the statement body to its final pseudonymous form, adapted from the template's existing LMS-to-LRS identity flow to this chapter's specific mechanism.

Nodes: "Raw actor identifier in statement body (homePage + name)" leads to "Processor fetches Per-District Salt via Mutual TLS Salt Fetch (once per district, cached in memory)" leads to "HMAC-SHA256 Pseudonymization computed locally in the processor" leads to "student_key (base32, first 16 bytes)" leads to "Written to ClickHouse and Neo4j — the only form any downstream store ever sees".

Interactive features: Every node has a Mermaid click directive opening an infobox with that step's definition — mutual TLS and fetch frequency at the salt node, the formula and cross-district unrelatedness at the HMAC node, and the "nothing downstream sees raw identity" guarantee at the final node.

Color coding: The raw-identity node in amber to flag it as sensitive; every node from the salt fetch onward in the book's teal accent color to show the boundary has been crossed.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom.
```

## Related Resources

- [Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md)
