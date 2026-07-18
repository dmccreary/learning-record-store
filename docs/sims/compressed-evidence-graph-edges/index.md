---
title: From Compressed Evidence to Graph Edges
description: Let the learner trace how a Student node connects to compressed summary vertices through the Has Mastery, Of Concept, and Touched relationships, and explain what question each edge answers, without needing the compression mechanics Chapter 8 covers.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# From Compressed Evidence to Graph Edges



<iframe src="main.html" width="100%" height="422"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md).

```text
Type: infographic
**sim-id:** compressed-evidence-graph-edges<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/graph-viewer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a Student node connects to compressed summary vertices through the Has Mastery, Of Concept, and Touched relationships, and explain what question each edge answers, without needing the compression mechanics Chapter 8 covers.

Purpose: Show two short, parallel Mermaid flowchart branches, both starting from a single "Student" node, so the learner can see the mastery path and the engagement path as structurally similar patterns.

Branch A (mastery path): "Student" —`HAS_MASTERY`→ "ConceptMastery (summary vertex)" —`OF_CONCEPT`→ "Concept".

Branch B (engagement path): "Student" —`HAD_SESSION`→ "LearningSession (summary vertex)" —`TOUCHED`→ "Page / MicroSim / Question", with a small annotation box off the `TOUCHED` edge reading "carries event_count, dwell_ms".

Interactive features: Every node has a Mermaid `click` directive. Clicking "Student" opens an infobox recalling the pseudonymous Student node from Chapter 6. Clicking "ConceptMastery" or "LearningSession" opens an infobox stating that both are materialized summary vertices — compressed from many statements into one — with a note "full compression mechanics: Chapter 8." Clicking "Concept" opens an infobox tying back to the Learning Graph DAG. Clicking the `HAS_MASTERY`, `OF_CONCEPT`, or `TOUCHED` edge label opens an infobox naming the relationship type and its from → to direction, matching this chapter's prose.

Color coding: The mastery branch in the book's teal accent color; the engagement branch in a complementary amber, so the two parallel paths stay visually distinguishable at a glance.

Implementation: Mermaid flowchart with two branches sharing a root node, full click-to-infobox coverage on every node and edge label. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md)
