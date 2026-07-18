---
title: My Classes to Student Detail — One Click, Nine Reports
description: Explain how a teacher moves from a section-level roster on My Classes to a single student's nine-report Student Detail view, carrying filter context (the selected date range and textbook version) across the click.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# My Classes to Student Detail — One Click, Nine Reports



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md).

```text
Type: workflow
**sim-id:** my-classes-student-detail-drilldown<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/search-microsims/tree/main/docs/sims/dashboard-patterns<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Explain how a teacher moves from a section-level roster on My Classes to a single student's nine-report Student Detail view, carrying filter context (the selected date range and textbook version) across the click.

Purpose: A two-lane Mermaid flowchart. Lane 1, "My Classes Dashboard," contains four boxes: Class Mastery Heatmap, Completion Funnel, At-Risk Roster, Idle Disengagement Alert. Lane 2, "Student Detail Dashboard," contains nine boxes, one per student-level report named later in this chapter (Student Progress Overview, Concept Mastery Radar, Time-on-Task Timeline, Reading vs. Doing Balance, Learning Velocity Report, Quiz Item Analysis, Struggle Detector, Prerequisite Gap Analysis, Idle Disengagement Alert). One labeled arrow, "click a student row," crosses from the At-Risk Roster box in Lane 1 to the whole Lane 2 group, annotated "filter context (date range, textbook version) carried across."

Interactive features: Every box in both lanes has a Mermaid click directive opening an infobox with that report's one-sentence purpose. Clicking the crossing arrow opens an infobox explaining server-side aggregation: the browser never re-fetches raw statements on drill-down, only a narrower pre-aggregated query for the one selected student.

Color coding: Lane 1 (My Classes) in the book's amber accent color; Lane 2 (Student Detail) in teal; the crossing arrow in a bold outline to draw the eye to the drill-down moment.

Implementation: Mermaid flowchart with two subgraphs and full click-to-infobox coverage, adapted from the referenced template's dashboard-composition layout. Responsive width tracking the containing element; on narrow viewports the two lanes stack vertically instead of side by side.
```

## Related Resources

- [Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md)
