---
title: Term Rollover Timeline
description: Sequence the steps of a Term / Academic-Year Rollover, from archiving the outgoing term through rolling section templates forward into the new one, and see where the Enrollment Editor and Instructor Assignment Tool fit into that sequence.
status: implemented
library: vis-timeline
bloom_level: Understand (L2)
---

# Term Rollover Timeline



<iframe src="main.html" width="100%" height="422"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md).

```text
Type: timeline
**sim-id:** term-rollover-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the steps of a Term / Academic-Year Rollover, from archiving the outgoing term through rolling section templates forward into the new one, and see where the Enrollment Editor and Instructor Assignment Tool fit into that sequence.

Time period: One academic year cycle, late May through early September

Orientation: Horizontal, left to right

Events:

- Late May: Spring term's sections marked for archival; historical enrollment and rollup data frozen and preserved
- Early June: Prior-term sections archived; read-only from this point forward
- Mid-June: Section templates for the upcoming term generated from the archived shapes (same course, same period structure)
- July: New roster sync populates the upcoming term's Enrollment Editor with incoming students
- Mid-August: Instructor Assignment Tool used to confirm or reassign `TEACHES` edges for the new term, including any co-teacher pairings
- Early September: New term goes live; sections begin accepting Textbook Deployment bindings and ingesting statements

Interactive features: Clicking any milestone opens an infobox describing what changed at that step and which tool (Enrollment Editor, Instructor Assignment Tool, or the rollover mechanism itself) is responsible for it, plus a note on which prior-term data remains queryable afterward.

Visual style: Archived-term milestones shown in a muted gray; new-term milestones shown in the book's teal accent color, so a learner can see at a glance which side of the rollover each event falls on.

Responsive design: Timeline resizes to its containing element's width and remains readable at tablet width, collapsing event labels to abbreviated form below 600px.
```

## Related Resources

- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md)
