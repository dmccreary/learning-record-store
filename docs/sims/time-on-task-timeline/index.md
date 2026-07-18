---
title: One Student's Time-on-Task Timeline
description: Let the learner interpret a Gantt-style timeline of one student's learning sessions across a week, distinguishing a steady engagement pattern from a single last-minute cram session.
status: implemented
library: vis-timeline
bloom_level: Understand (L2)
---

# One Student's Time-on-Task Timeline



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md).

```text
Type: timeline
**sim-id:** time-on-task-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/goal-horizon-timeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: interpret, distinguish

Learning objective: Let the learner interpret a Gantt-style timeline of one student's learning sessions across a week, distinguishing a steady engagement pattern from a single last-minute cram session.

Time period: One sample week, Monday through Sunday

Orientation: Horizontal, left to right, one row per day

Events: Six to eight session bars of varying length and time of day placed across the week, including one deliberately long bar the night before a sample "quiz due" marker to illustrate a cram pattern, and several short, evenly spaced bars earlier in the week to illustrate steady engagement for comparison.

Interactive features: Clicking any session bar opens an infobox listing the concepts touched during that session (drawn from that session's `TOUCHED` edges) and a link labeled "view individual statements," representing the drill-down into the event store. A toggle switches between two sample students — one steady, one cram-pattern — so the learner can compare timeline shapes directly.

Visual style: Session bars colored by duration (short sessions in a lighter shade, long sessions in a darker shade of the book's teal accent color) so a cram session visually stands out without needing to read the bar's length precisely.

Responsive design: Timeline resizes to the width of its containing element; on narrow viewports the day labels abbreviate and bars remain tap-sized for the click-to-infobox interaction.
```

## Related Resources

- [Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md)
