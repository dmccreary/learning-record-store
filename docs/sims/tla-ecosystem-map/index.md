---
title: Total Learning Architecture Ecosystem Map
description: Let the learner analyze how a Learning Record Store relates to the other named components of the Total Learning Architecture, and locate this project's own LRS within that wider ecosystem rather than treating it as a standalone system.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# Total Learning Architecture Ecosystem Map



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md).

```text
Type: graph-model
**sim-id:** tla-ecosystem-map<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/ed-tech-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how a Learning Record Store relates to the other named components of the Total Learning Architecture, and locate this project's own LRS within that wider ecosystem rather than treating it as a standalone system.

Purpose: Show a central "Learner" node surrounded by connected component nodes representing the Total Learning Architecture, with this project's own LRS visually distinguished.

Nodes:

- Center: "Learner" — the person whose record moves across the whole ecosystem
- "This Project's LRS" — visually highlighted (thicker border, teal accent color) with an edge to "Learner" labeled "stores Statements about"
- "Competency and Skills Registry" — edge to LRS labeled "maps mastered concepts to skills"
- "Content Recommendation Engine" — edge to LRS labeled "reads Statement history to recommend next content"
- "Federated LRS (another organization)" — edge to LRS labeled "may exchange records for a learner who moves between organizations"
- "TLA Reference Implementation" — dashed-outline node connected to all of the above, labeled "the working demo of this whole map, maintained by I2IDL"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking any component node opens an infobox with its one-sentence role and, where relevant, which chapter concept it corresponds to (for example, clicking "This Project's LRS" reiterates the Learning Record Store definition from Chapter 1). Clicking "TLA Reference Implementation" opens an infobox distinguishing it from the xAPI Conformance Suite, reinforcing the distinction drawn earlier in this chapter.

Color coding: This project's LRS in the book's teal accent color; other TLA components in neutral gray-blue; the TLA Reference Implementation node with a dashed border to signal "reference/testing artifact" rather than a production system.

Implementation: vis-network graph with physics-based layout (learner at center, components arranged around it), full click-to-infobox coverage on every node. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
```

## Related Resources

- [Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md)
