---
title: Concept Mastery Radar for One Student
description: Let the learner interpret a radar chart of one student's Bayesian Knowledge Tracing mastery scores grouped by taxonomy category, identifying the category where that student is weakest.
status: implemented
library: p5.js
bloom_level: Understand (L2)
---

# Concept Mastery Radar for One Student



<iframe src="main.html" width="100%" height="472"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md).

```text
Type: chart
**sim-id:** concept-mastery-radar<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/blockchain/tree/main/docs/sims/quality-attribute-radar<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: interpret, compare

Learning objective: Let the learner interpret a radar chart of one student's Bayesian Knowledge Tracing mastery scores grouped by taxonomy category, identifying the category where that student is weakest.

Purpose: A radar/spider chart with five to seven spokes, one per taxonomy category (e.g., Vocabulary, Procedures, Analysis, Application, Synthesis), each spoke scaled 0 to 1 to match the BKT mastery-score range.

Data: A sample student's per-category average mastery scores plotted as a filled polygon; a faint dashed reference polygon at 0.75 mastery marks the textbook's default "likely mastered" line so the learner can see at a glance which spokes fall short of it.

Interactive features: Clicking any spoke's label opens an infobox naming that taxonomy category and listing the two or three concepts within it that pull the average down the most. A slider (p5.js `createSlider()`) lets the learner switch between three sample students to see how the same chart shape changes with a different mastery profile.

Color coding: The filled mastery polygon in the book's teal accent color; the 0.75 reference line in a neutral dashed gray so it reads as a threshold, not a second data series.

Implementation: p5.js canvas rendering a polar/radar plot from an array of category-score pairs, adapted from the referenced template's radar-chart structure. Responsive width tracking the containing element; spoke labels rotate to remain horizontal and legible at narrow widths.
```

## Related Resources

- [Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md)
