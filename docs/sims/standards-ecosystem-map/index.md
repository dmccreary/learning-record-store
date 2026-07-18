---
title: The Wider Standards Ecosystem Map
description: Let the learner analyze how IEEE LTSC, the ADL Initiative, I2IDL, and the 1EdTech Consortium relate to one another and to the specifications each governs, correctly attributing xAPI, cmi5, and the Total Learning Architecture to one governance family and LTI, QTI, Caliper Analytics, and Learning Object Metadata to the other.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# The Wider Standards Ecosystem Map



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md).

```text
Type: graph-model
**sim-id:** standards-ecosystem-map<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/intelligent-textbooks/tree/main/docs/sims/standards-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how IEEE LTSC, the ADL Initiative, I2IDL, and the 1EdTech Consortium relate to one another and to the specifications each governs, correctly attributing xAPI, cmi5, and the Total Learning Architecture to one governance family and LTI, QTI, Caliper Analytics, and Learning Object Metadata to the other.

Purpose: Show a two-cluster vis-network graph with governing-body nodes as hubs and specification nodes as spokes, so the learner can trace every named specification back to exactly one governing body.

Nodes:

- Hub: "IEEE LTSC" — spokes to "IEEE 9274.1.1-2023 (xAPI core)" and "Learning Object Metadata (IEEE 1484.12.1)"
- Hub: "ADL Initiative" — spokes to "xAPI (origin)," "cmi5," and "Total Learning Architecture"
- Hub: "I2IDL" — spokes to "xAPI Conformance Suite," "xAPI Profile Server," and "TLA Reference Implementation"
- Hub: "1EdTech Consortium" — spokes to "Learning Tools Interoperability (LTI)," "Question and Test Interoperability (QTI)," and "Caliper Analytics"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking a hub node opens an infobox with that organization's one-sentence governance role, matching the definitions given in this chapter and Chapter 3. Clicking a spoke node opens an infobox with that specification's one-sentence purpose and which chapter first defined it.

Color coding: The xAPI/ADL/IEEE LTSC/I2IDL cluster in the book's teal accent color (matching Chapter 3's governance diagram); the 1EdTech Consortium cluster in a contrasting amber, so the two governance families are visually distinct at a glance.

Implementation: vis-network graph with physics-based layout, two hub-and-spoke clusters. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
```

## Related Resources

- [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md)
