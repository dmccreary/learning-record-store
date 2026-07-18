---
title: How Concept Mastery Rolls Up to a Section
description: Explain how many students' individual ConceptMastery vertices aggregate, through a ROLLS_UP_TO edge, into one SectionRollup vertex per concept, which the ten class-level reports in this chapter all read from.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# How Concept Mastery Rolls Up to a Section



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md).

```text
Type: workflow
**sim-id:** section-rollup-aggregation<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/microsims/tree/main/docs/sims/learning-graph-v1<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Explain how many students' individual ConceptMastery vertices aggregate, through a ROLLS_UP_TO edge, into one SectionRollup vertex per concept, which the ten class-level reports in this chapter all read from.

Purpose: A Mermaid flowchart showing three sample `ConceptMastery` boxes (one per sample student: Amara, Devon, Priya), each with a small mastery-score label, each connected by a `ROLLS_UP_TO` arrow into one central `SectionRollup` box labeled with its key properties (`mastery_distribution`, `mean_score`, `student_count`, `last_computed`). A `FOR_SECTION` arrow connects the `SectionRollup` box to a `Section` box. A dashed arrow fans out from `SectionRollup` to three placeholder report boxes labeled "Class Mastery Heatmap," "Concept Difficulty Ranking," and "other class-level reports."

Interactive features: Clicking any `ConceptMastery` box opens an infobox recapping that it is the same per-student mastery score Chapter 28 introduced. Clicking the `SectionRollup` box opens an infobox listing its four key properties and stating it refreshes incrementally, not by re-scanning every statement. Clicking the `Section` box opens an infobox defining Section Enrollment as the boundary that determines which students' ConceptMastery vertices feed this particular rollup.

Color coding: The three student-level ConceptMastery boxes in a light neutral tone to signal "already covered in Chapter 28"; the SectionRollup box in the book's teal accent color to signal "new in this chapter"; the fan-out to report boxes in a muted gray dashed line.

Implementation: Mermaid flowchart adapted from the referenced template's node/edge layout conventions, with full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the three ConceptMastery boxes stack vertically above the SectionRollup box instead of side by side.
```

## Related Resources

- [Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md)
