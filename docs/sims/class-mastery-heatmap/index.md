---
title: Class Mastery Heatmap for One Section
description: Let the learner distinguish a concept-wide weakness (a dark column across most students) from a student-specific weakness (a dark row across most concepts) in a class mastery heatmap, and identify which pattern calls for whole-class re-teaching versus individual attention.
status: scaffold
library: p5.js
bloom_level: Analyze (L4)
---

# Class Mastery Heatmap for One Section



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md).

```text
Type: chart
**sim-id:** class-mastery-heatmap<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, distinguish

Learning objective: Let the learner distinguish a concept-wide weakness (a dark column across most students) from a student-specific weakness (a dark row across most concepts) in a class mastery heatmap, and identify which pattern calls for whole-class re-teaching versus individual attention.

Canvas layout: A grid of roughly 24 rows (sample students, labeled by first name and last initial) by 8 columns (sample concepts, labeled along the top, rotated diagonally to fit). Each cell is a filled rectangle shaded on a single-hue color scale from light (high mastery, near 1.0) to dark (low mastery, near 0.0), matching the book's teal accent hue so meaning is never carried by color alone.

Data: A synthetic mastery-score matrix with one deliberately dark column (a concept most of the class is weak on) and one deliberately dark row (a single student weak across most concepts), so both patterns are visible in the default view.

Interactive features: Hovering any cell reveals a tooltip with the exact mastery score and the student/concept pair. Clicking a column header highlights that entire column and opens an infobox stating the class-wide mean score for that concept. Clicking a row label highlights that entire row and opens a "View Student Detail" link representing the drill-down into that student's nine-report dashboard from Chapter 28. A `createSlider()` control lets the learner filter the grid to only students below a chosen mastery threshold.

Color coding: Single-hue sequential scale (light-to-dark teal) rather than a red-green scale, so the chart remains legible for color-vision-deficient readers; a numeric label appears on hover as a redundant, non-color-dependent cue.

Implementation: p5.js canvas rendering a grid of colored rectangles from a 2D array of scores, with mouse-position hit-testing for hover and click. Responsive design: canvas width tracks the containing element's width; at narrow viewports column headers abbreviate to two-letter concept codes and cell size shrinks rather than the grid overflowing horizontally.
```

## Related Resources

- [Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md)
