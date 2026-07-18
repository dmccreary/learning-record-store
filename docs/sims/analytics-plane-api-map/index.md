---
title: Analytics Plane API Map
description: Let the learner analyze how the five Analytics Plane APIs relate to the Analytics Plane as a whole and to their primary audiences, correctly distinguishing the four outbound, report-serving APIs from the Roster API's inbound role.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# Analytics Plane API Map



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md).

```text
Type: graph-model
**sim-id:** analytics-plane-api-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: analyze, relate

Learning objective: Let the learner analyze how the five Analytics Plane APIs relate to the Analytics Plane as a whole and to their primary audiences, correctly distinguishing the four outbound, report-serving APIs from the Roster API's inbound role.

Purpose: Show a hub-and-spoke vis-network graph with "Analytics Plane" as the central hub and the five APIs as spokes, with edge direction visually distinguishing inbound from outbound APIs.

Nodes:

- Center: "Analytics Plane"
- Spoke: "Analytics API" — edge FROM Analytics Plane, labeled "backs every report and dashboard"
- Spoke: "Admin API" — edge FROM Analytics Plane, labeled "serves admin UIs, every mutation audited"
- Spoke: "Experiment API" — edge FROM Analytics Plane, labeled "assignment + readout for A/B tests"
- Spoke: "Export API" — edge FROM Analytics Plane, labeled "bulk async export"
- Spoke: "Roster API" — edge TO Analytics Plane, labeled "enrollment data flows in"

Interactive features: Every node is clickable via vis-network's built-in click event. Clicking the hub opens an infobox restating the Analytics Plane's definition from this chapter. Clicking any spoke opens an infobox with that API's one-sentence purpose and its primary audience, matching the table above.

Color coding: The four outbound APIs (Analytics, Admin, Experiment, Export) in the book's teal accent color; the Roster API in a contrasting amber to visually flag its reversed, inbound edge direction.

Implementation: vis-network graph with physics-based layout (hub at center, five spokes arranged around it), directional arrows on every edge matching inbound/outbound direction, full click-to-infobox coverage on every node. Responsive width and height tracking the containing element, with layout re-stabilizing on resize.
```

## Related Resources

- [Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md)
