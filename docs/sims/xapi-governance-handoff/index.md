---
title: Standards Governance Handoff
description: Let the learner trace how stewardship of xAPI moved across three organizations over time, and correctly attribute each organization's distinct role rather than treating "the standard" as owned by one undifferentiated group.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# Standards Governance Handoff



<iframe src="main.html" width="100%" height="402"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md).

```text
Type: workflow
**sim-id:** xapi-governance-handoff<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/learning-standards-timeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: summarize, sequence

Learning objective: Let the learner trace how stewardship of xAPI moved across three organizations over time, and correctly attribute each organization's distinct role rather than treating "the standard" as owned by one undifferentiated group.

Purpose: Show a left-to-right Mermaid flowchart with four stages, each a labeled node, connected by arrows annotated with the year the handoff occurred.

Nodes:

- "ADL Initiative" — originates xAPI via Project Tin Can, publishes xAPI 1.0 (2013)
- "IEEE LTSC" — stewardship transition begins (2019), leading to a balloted standard
- "IEEE 9274.1.1-2023" — the published core standard (2023), shown as a document icon
- "I2IDL" — established (2025), takes over operational tooling, branching to three child nodes: "xAPI Conformance Suite," "xAPI Profile Server," "TLA Reference Implementation"

Interactive features: Every node has a Mermaid `click` directive. Clicking "ADL Initiative," "IEEE LTSC," or "I2IDL" opens an infobox with that organization's one-sentence role definition, matching the chapter's governance table. Clicking "IEEE 9274.1.1-2023" opens an infobox explaining what the standard covers (Statement structure, RESTful API, conformance requirements). Clicking any of the three I2IDL child nodes opens an infobox naming what that tool does and linking conceptually to where it is covered later in this chapter.

Color coding: ADL Initiative in amber (legacy/origin), IEEE LTSC and IEEE 9274.1.1-2023 in the book's teal accent color (formal standard), I2IDL and its three child nodes in green (active operational tooling).

Implementation: Mermaid flowchart, left-to-right orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md)
