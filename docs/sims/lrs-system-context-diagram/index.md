---
title: This Project's System Context Diagram
description: Let the learner identify the external actors and the five internal planes of this project's Learning Record Store, and describe in one sentence what crosses the system boundary in each direction.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# This Project's System Context Diagram



<iframe src="main.html" width="100%" height="682"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md).

```text
Type: graph-model
**sim-id:** lrs-system-context-diagram<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/xapi-data-flow<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: describe, identify

Learning objective: Let the learner identify the external actors and the five internal planes of this project's Learning Record Store, and describe in one sentence what crosses the system boundary in each direction.

Purpose: Render the system context from the LRS specification's §2 diagram as a single Mermaid flowchart, top to bottom, with the external actors outside a bounding subgraph labeled "Learning Record Store" and the five planes as ordered nodes inside it.

Nodes, top to bottom:

- External: "Intelligent Textbooks (thousands, concurrent)" — sends xAPI statements
- Inside the LRS boundary, in order: "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane", "Presentation Plane"
- External: "Instructors" — receives dashboards
- External: "District & System Admins" — receives admin reports

Edges: "Intelligent Textbooks" to "Ingestion Plane" labeled "xAPI statements"; each plane to the next labeled with what flows between them ("durably queued statements", "validated + enriched events", "aggregated queries", "rendered reports"); "Presentation Plane" to "Instructors" labeled "dashboards"; "Presentation Plane" to "District & System Admins" labeled "admin UIs".

Interactive features: Every node has a Mermaid `click` directive. Clicking an external-actor node opens an infobox naming its role (Learning Record Provider, dashboard viewer, or administrator). Clicking any plane node opens an infobox with that plane's one-sentence definition and the two or three components it contains, previewing the deep-dive sections later in this chapter.

Color coding: External actors in a neutral gray; the five internal planes in a left-to-right gradient of the book's teal accent color, darkest at Ingestion and lightest at Presentation, so the reader can visually track the direction data flows.

Implementation: Mermaid flowchart, top-to-bottom orientation, one bounding subgraph for the system boundary, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md)
