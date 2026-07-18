---
title: The Twelve Core Functions Explorer
description: Let the learner classify all twelve core LRS functions by the architectural plane and specific component that implements each one, using a single explorable network rather than twelve separate diagrams.
status: implemented
library: vis-network
bloom_level: Analyze (L4)
---

# The Twelve Core Functions Explorer



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md).

```text
Type: infographic
**sim-id:** twelve-core-functions-explorer<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, organize

Learning objective: Let the learner classify all twelve core LRS functions by the architectural plane and specific component that implements each one, using a single explorable network rather than twelve separate diagrams.

Purpose: Show a clustered vis-network graph with four plane-cluster hubs — "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane" (reusing Chapter 5's plane names and color language) — and twelve function nodes attached to whichever plane cluster implements them.

Nodes and cluster assignment: Storage Plane cluster: "Statement Storage Function (F-1)", "Statement Retrieval Function (F-2)", "Voiding Function (F-3)". Processing Plane cluster: "Actor Pseudonymization Function (F-4)", "Activity Resolution Function (F-5)", "Concept Mapping Function (F-6)", "Mastery Computation Function (F-7)", "Progress Projection Function (F-8)", "Reconciliation Function (F-10)". Analytics Plane cluster: "Experiment Assignment Function (F-9)", "Export Function (F-11)". A fifth, unclustered node off to the side: "Retention Purge Function (F-12)", connected by a dashed edge to both the Storage Plane and Analytics Plane clusters, reflecting that it acts on stored data but is administered through the Analytics Plane's Admin API.

Interactive features: Clicking a plane-cluster hub opens an infobox recalling that plane's definition from Chapter 5. Clicking any function node opens an infobox with its full specification-language description (from `lrs-spec-v1.md` §6), its F-number, and the specific component that implements it (e.g. "F-7, Mastery Computation Function — implemented in the Stream Processor's mastery-scoring step"). A search box above the canvas lets the learner type an F-number or function name to highlight and center that node. A "Group by component" toggle re-clusters the same twelve nodes by implementing component (Ingestion Gateway, identity service, Stream Processor, Compression Pipeline, Reconciliation Worker, Experiment Service, Analytics API, Export API) instead of by plane, so the learner can explore the same catalog two different ways.

Color coding: Cluster hubs colored using Chapter 5's existing plane gradient (darkest teal for Ingestion Plane through lightest for Presentation-adjacent planes); function nodes colored to match their parent cluster; the unclustered Retention Purge Function node in the contrasting amber used for cross-cutting, compliance-adjacent elements throughout this book.

Responsive design: Network layout recalculates via vis-network's physics engine on window resize; below tablet width, cluster hubs collapse to a simple accordion list with function nodes as expandable children, preserving full interactivity without requiring precise clicking on a small canvas.
```

## Related Resources

- [Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md)
