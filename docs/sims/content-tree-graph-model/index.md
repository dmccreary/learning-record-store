---
title: The Content Tree — From Textbook to Concept
description: Let the learner identify every content-tree node label from Textbook down to Concept, and describe which relationship type connects each pair, exactly as cataloged in this project's specification §4.1–§4.2.
status: implemented
library: vis-network
bloom_level: Understand (L2)
---

# The Content Tree — From Textbook to Concept



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md).

```text
Type: graph-model
**sim-id:** content-tree-graph-model<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/concept-to-content-viewer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Let the learner identify every content-tree node label from Textbook down to Concept, and describe which relationship type connects each pair, exactly as cataloged in this project's specification §4.1–§4.2.

Purpose: Render the full content-tree portion of the graph data model as an interactive vis-network diagram, using this project's actual node labels and relationship types, so the learner can see the tree from the spec as a real graph rather than a table.

Nodes (colored by node label, one color per label): `Textbook`, `TextbookVersion`, `Chapter`, `Page`, `MicroSim`, `MicroSimVersion`, `Quiz`, `Question`, `Concept`. Layout: hierarchical, top to bottom, Textbook at the top.

Edges, each labeled with its relationship type and drawn as a directed arrow: `TextbookVersion` → `Textbook` (`VERSION_OF`); `Textbook` → `Chapter` (`CONTAINS`); `Chapter` → `Page` (`CONTAINS`); `Page` → `MicroSim` (`EMBEDS`); `Page` → `Quiz` (`EMBEDS`); `MicroSim` → `MicroSimVersion` (`HAS_VERSION`); `Quiz` → `Question` (`CONTAINS`); `Page` → `Concept` (`COVERS`); `MicroSim` → `Concept` (`COVERS`); `Question` → `Concept` (`COVERS`).

Interactive features: Clicking any node opens an infobox listing that node label's key properties, matching the table in this chapter's prose exactly. Clicking any edge opens an infobox naming the relationship type, its direction (from → to), and a one-sentence description of what it structurally means. Hovering over a node highlights all of its direct edges and dims the rest of the graph so the learner can trace one node's connections in isolation.

Color scheme: Each node label gets a distinct, consistent color from the book's palette (Textbook and TextbookVersion in one hue-pair, Chapter and Page in a second, MicroSim/MicroSimVersion/Quiz/Question in a third, Concept in the book's teal accent color to visually mark it as the bridge into the learning graph proper).

Responsive design: The network canvas resizes to the width of its containing element on window resize, using vis-network's built-in responsive container option; on narrow (mobile) viewports the hierarchical layout switches from top-to-bottom to left-to-right to make better use of vertical scroll space.
```

## Related Resources

- [Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md)
