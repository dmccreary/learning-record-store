---
title: MicroSim Evidence to BKT Mapping Gap
description: Trace two candidate designs for turning raw MicroSim interaction facts into a soft-correctness value that feeds a concept's Bayesian Knowledge Tracing update, and critique the trade-off each one makes.
status: implemented
library: Mermaid
bloom_level: Evaluate (L5)
---

# MicroSim Evidence to BKT Mapping Gap



<iframe src="main.html" width="100%" height="682"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md).

```text
Type: workflow
**sim-id:** microsim-bkt-mapping-gap-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/spec-quality-checklist<br/>

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, critique

Learning objective: Trace two candidate designs for turning raw MicroSim interaction facts into a soft-correctness value that feeds a concept's Bayesian Knowledge Tracing update, and critique the trade-off each one makes.

Purpose: A Mermaid flowchart starting from one shared source node and branching into two competing designs, so the learner can compare them side by side rather than read about them only in prose.

Shared start: "MicroSim emits `interacted` statements (dwell time, range covered, direction reversals)" -> "MicroSimEngagement grain (Chapter 8 summary vertex)" -> decision node "Where does soft-correctness get computed?"

Branch A "Stream-side mapping": "MicroSimEngagement grain" -> "New stream-side component" -> "Looks up mapping in a per-MicroSim registry" -> "Computes soft-correctness in [0,1]" -> "Feeds ConceptMastery's BKT update". Tag: "Pro: scoring logic stays server-side. Con: needs a registry every new MicroSim must be added to."

Branch B "Client-side mapping": "MicroSim authoring tooling" -> "Computes soft-correctness proxy at authoring time" -> "Embeds value in `result.score` on each emitted statement" -> "Feeds ConceptMastery's BKT update directly, no new component". Tag: "Pro: no new pipeline component. Con: reopens a two-codebases problem — the same scoring logic must be authored and kept in sync in both the MicroSim's client code and wherever it is reviewed for the LRS."

Interactive features: Every node has a Mermaid click directive. Clicking either branch's final tag node opens an infobox with the full pro/con text from the prose above. Clicking the shared decision node opens an infobox stating this is Open Question 7, owned jointly by architecture and MicroSim tooling, tracked as an open retrofit-specification task.

Color coding: Branch A shaded teal; Branch B shaded amber; the shared start and decision nodes in neutral gray.

Responsive design: The two branches stack vertically below the shared start node on narrow viewports, preserving all click handlers and tag text.
```

## Related Resources

- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md)
