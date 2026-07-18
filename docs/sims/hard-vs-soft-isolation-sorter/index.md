---
title: Sort Each Level into Hard or Soft Isolation
description: Let the learner apply the definitions of Hard Isolation and Soft Isolation by sorting the four Tenancy Hierarchy levels (District, School, Course, Section) into the correct isolation-guarantee bucket.
status: scaffold
library: p5.js
bloom_level: Apply (L3)
---

# Sort Each Level into Hard or Soft Isolation



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md).

```text
Type: microsim
**sim-id:** hard-vs-soft-isolation-sorter<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: classify, sort

Learning objective: Let the learner apply the definitions of Hard Isolation and Soft Isolation by sorting the four Tenancy Hierarchy levels (District, School, Course, Section) into the correct isolation-guarantee bucket.

Canvas layout:

- Top strip: four shuffled draggable tiles, one per level name — "District", "School", "Course", "Section"
- Middle: two labeled drop zones side by side — "Hard Isolation" (left, darkest teal) and "Soft Isolation" (right, lighter teal)
- Bottom strip: score readout ("Sorted: 0 / 4") and a "Check All" button

Visual elements:

- Tiles in a neutral cream color with the level name printed on them
- A tile dropped in its correct zone locks in place with a green outline and a brief checkmark animation
- A tile dropped in the wrong zone bounces back to the top strip with a half-second red flash

Interactive controls:

- Drag-and-drop: drag any tile onto either isolation zone
- Button: "Check All" — validates every placed tile and reveals a one-sentence explanation for any incorrect placement, matching this chapter's prose
- Button: "Reset" — returns all tiles to the top strip

Default parameters: all four tiles unplaced at start, shuffled via a seeded index so the layout is reproducible within a session.

Behavior: on a correct drop, increment "Sorted" and lock the tile; when all four are sorted correctly, display "All four levels sorted — District is the only hard boundary." Clicking any locked tile re-opens an infobox with that level's isolation guarantee and enforcement mechanism, matching the table above.

Implementation notes: p5.js mouse-press/mouse-release drag-and-drop, matching the pattern used in this book's other sorting MicroSims. Responsive design: canvas width tracks the containing element's width; the two drop zones stack vertically at narrow (mobile) widths.
```

## Related Resources

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md)
