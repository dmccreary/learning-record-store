---
title: LMS-Centric versus LRS-Centric Architecture
description: Let the learner compare a single-hub LMS-centric architecture against a hub-and-spoke LRS-centric architecture, and see structurally why the second scales to many kinds of Learning Record Providers while the first does not.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# LMS-Centric versus LRS-Centric Architecture



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md).

```text
Type: workflow
**sim-id:** lms-vs-lrs-architecture<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/intelligent-textbooks/tree/main/docs/sims/standards-ecosystem<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Let the learner compare a single-hub LMS-centric architecture against a hub-and-spoke LRS-centric architecture, and see structurally why the second scales to many kinds of Learning Record Providers while the first does not.

Purpose: Show two side-by-side diagrams — "Before: LMS-Centric" and "After: LRS-Centric" — as a single Mermaid flowchart with two subgraphs.

Left subgraph "LMS-Centric (SCORM/AICC era)":

- One box: "Learning Management System"
- Three boxes labeled "SCO 1", "SCO 2", "SCO 3" each with an arrow pointing only to the LMS box (one-way, tightly coupled)
- No other system can receive data from the SCOs

Right subgraph "LRS-Centric (xAPI era)":

- One central box: "Learning Record Store"
- Five surrounding boxes, each with an arrow pointing to the LRS box: "Intelligent Textbook", "Mobile App", "VR Simulator", "Coding Lab", "Physical Kiosk" — each labeled with the small tag "Learning Record Provider"
- One additional box below the LRS labeled "Dashboards & Reports" with an arrow FROM the LRS (data flows out for analysis)

Interactive features: Every node in both subgraphs is clickable via a Mermaid `click` directive. Clicking "Learning Management System" opens an infobox defining LMS; clicking any "SCO" node opens an infobox defining Sharable Content Object; clicking "Learning Record Store" opens an infobox defining LRS; clicking any Learning Record Provider node opens an infobox explaining that term generally, then names the specific example (e.g., "VR Simulator — a Learning Record Provider might be flight-training software that emits a statement each time a trainee completes a maneuver").

Color coding: LMS-centric subgraph in a muted gray-blue to signal "legacy"; LRS-centric subgraph in the book's teal accent color to signal "current architecture."

Implementation: Mermaid flowchart with two subgraphs and full click-to-infobox coverage on every node.
```

## Related Resources

- [Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md)
