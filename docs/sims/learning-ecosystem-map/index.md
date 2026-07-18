---
title: Learning Ecosystem Map
description: Let the learner analyze how a Learning Record Store, a Competency Framework, a content repository, and analytics tools interoperate within a Learning Ecosystem, in a general, vendor-neutral form that generalizes Chapter 3's Total Learning Architecture map.
status: implemented
library: vis-network
bloom_level: Analyze (L4)
---

# Learning Ecosystem Map



<iframe src="main.html" width="100%" height="522"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md).

```text
Type: graph-model
**sim-id:** learning-ecosystem-map<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/ed-tech-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how a Learning Record Store, a Competency Framework, a content repository, and analytics tools interoperate within a Learning Ecosystem, in a general, vendor-neutral form that generalizes Chapter 3's Total Learning Architecture map.

Purpose: Show a central "Learner" node surrounded by concentric rings of connected component nodes representing a general Learning Ecosystem.

Nodes:

- Center: "Learner"
- Inner ring: "Learning Record Store" — edge to Learner labeled "stores Statements about"
- Inner ring: "Competency Framework" — edge to Learning Record Store labeled "supplies identifiers Statements reference"
- Outer ring: "Content Repository (cataloged with Learning Object Metadata)" — edge to Learning Record Store labeled "describes the resources Statements reference"
- Outer ring: "Analytics Dashboard" — edge to Learning Record Store labeled "reads Statement history"
- Outer ring: "Federated Learning Record Store (different vendor)" — edge to Learning Record Store labeled "may exchange records when a learner moves organizations"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking any node opens an infobox with its one-sentence role in the ecosystem, and, where relevant, which earlier chapter concept it corresponds to (for example, clicking "Content Repository" reiterates the Learning Object Metadata definition from earlier in this chapter).

Color coding: "Learner" in a neutral center color; "Learning Record Store" and "Competency Framework" in the book's teal accent color as the inner, most tightly coupled ring; the outer-ring nodes in a lighter gray-blue to signal looser, standards-mediated coupling.

Implementation: vis-network graph with physics-based layout (learner at center, components arranged in rings around it), full click-to-infobox coverage on every node. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
```

## Related Resources

- [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../../chapters/04-standards-governance-ecosystem/index.md)
