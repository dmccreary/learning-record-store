---
title: Prerequisite Gap Analysis — Walking Upstream From a Weak Concept
description: Prerequisite Gap Analysis — Walking Upstream From a Weak Concept
status: scaffold
library: vis-network
bloom_level: TBD
---

# Prerequisite Gap Analysis — Walking Upstream From a Weak Concept



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md).

```text
Type: graph-model
**sim-id:** concept-dependencies<br/>
**Library:** vis-network<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/automating-instructional-design/sims/concept-dependencies/<br/>
**Source Repo:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/concept-dependencies

Reused from the MicroSim catalog (WHAT match score 0.7919). Learning objective: let the learner trace upstream prerequisite concepts from a student's flagged weak concept, distinguishing already-mastered ancestors from unmastered ones that are the likely root cause of the struggle. The reused sim's existing REQUIRES/SUPPORTS dependency-edge model and click-to-highlight-upstream-and-downstream interaction map directly onto this report's "walk `DEPENDS_ON` upstream and flag unmastered prerequisites" behavior — a weak concept plays the role of the clicked node, and its unmastered ancestors are the highlighted upstream set.
```

## Related Resources

- [Chapter 28: Teacher Dashboards and Student-Level Reports](../../chapters/28-teacher-dashboards-student-reports/index.md)
