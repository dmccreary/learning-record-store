---
title: Deterministic Bucketing and the Ramping Rule
description: Let the learner manipulate an experiment's allocation percentage and observe that xxhash64 Bucketing keeps every student's bucket number fixed while only the Bucket To Variant Map's boundary moves, and that the Ramping Allocation Rule prevents the boundary from ever moving backward.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# Deterministic Bucketing and the Ramping Rule



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md).

```text
Type: infographic
**sim-id:** experiment-bucketing-ramp<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: demonstrate, predict

Learning objective: Let the learner manipulate an experiment's allocation percentage and observe that xxhash64 Bucketing keeps every student's bucket number fixed while only the Bucket To Variant Map's boundary moves, and that the Ramping Allocation Rule prevents the boundary from ever moving backward.

Canvas layout:

- A horizontal strip of 10,000 small tick marks representing bucket numbers 0-9,999, compressed to roughly 200 visible segments
- A vertical boundary line separating "treatment" (left, teal) from "control" (right, neutral gray)
- A slider labeled "Treatment allocation %" ranging from 0 to 100
- A row of five labeled student dots at fixed bucket positions, each showing its current variant

Interactive controls:

- Slider: "Treatment allocation %" — moving it right attempts to move the boundary right (more treatment)
- Checkbox: "Enforce Ramping Allocation Rule" — checked blocks any leftward boundary move with a red flash; unchecked lets the boundary move freely and flags in red any student dot that flips from treatment back to control, labeled "This is the bug the rule prevents"
- Button: "Reset"

Behavior: Each student dot's bucket position is fixed for the session, computed once from a seeded hash so the layout is reproducible; only the boundary moves in response to the slider.

Color coding: Treatment region and its student dots in the book's teal accent color; control region and its dots in neutral gray; the "bug" highlight in red, shown only when the rule checkbox is unchecked.

Responsive design: Canvas width tracks its containing element; the tick strip and slider stack vertically below the student-dot row on narrow viewports.
```

## Related Resources

- [Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md)
