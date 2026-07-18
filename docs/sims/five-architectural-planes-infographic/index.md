---
title: Sort the Component into Its Plane
description: Let the learner apply their understanding of the five architectural planes by sorting eight named components (Ingestion Gateway, Durable Event Queue, Stream Processor, Event Store, Analytics API, Admin API, Experiment API, Roster API, Export API, Dash/Plotly Dashboards) into the correct one of five labeled plane buckets.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# Sort the Component into Its Plane



<iframe src="main.html" width="100%" height="522"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md).

```text
Type: infographic
**sim-id:** five-architectural-planes-infographic<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: classify, sort

Learning objective: Let the learner apply their understanding of the five architectural planes by sorting eight named components (Ingestion Gateway, Durable Event Queue, Stream Processor, Event Store, Analytics API, Admin API, Experiment API, Roster API, Export API, Dash/Plotly Dashboards) into the correct one of five labeled plane buckets.

Canvas layout:

- Top strip: a shuffled row of small draggable tiles, one per component name
- Middle: five labeled drop zones arranged left to right in pipeline order — "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane", "Presentation Plane" — each drawn as a wide colored band matching the diagram above
- Bottom strip: score readout ("Sorted: 0 / 10") and a "Check All" button

Visual elements:

- Component tiles in a neutral cream color with the component name printed on them
- Each plane band tinted with the same left-to-right teal gradient used in the System Context Diagram, so the two visuals reinforce the same color language
- A tile dropped in its correct band locks in place with a green outline; a tile dropped in the wrong band bounces back to the top strip with a brief red flash

Interactive controls:

- Drag-and-drop: drag any tile onto any plane band
- Button: "Check All" — validates every placed tile at once and reveals a one-sentence explanation for any incorrect placement
- Button: "Reset" — returns all tiles to the top strip

Default parameters: all ten tiles unplaced at start, shuffled in random left-to-right order using a seeded index so layout is reproducible within a session.

Behavior: on a correct drop, increment "Sorted" and lock the tile; when all ten are correctly sorted, display "All ten components placed correctly — you know the five planes."; clicking any locked tile re-opens an infobox with that component's one-sentence role, matching the definition given earlier in this chapter.

Implementation notes: p5.js mouse-press/mouse-release drag-and-drop, same pattern as other chapter sorting MicroSims in this book. Responsive design: canvas width tracks the containing element's width, and the five bands stack into two rows at narrow (mobile) widths rather than compressing unreadably.
```

## Related Resources

- [Chapter 5: System Context and the Five Architectural Planes](../../chapters/05-system-context-architectural-planes/index.md)
