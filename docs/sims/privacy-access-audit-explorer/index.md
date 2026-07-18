---
title: Privacy Access Audit Explorer
description: Let the learner analyze a sample Privacy Access Audit table by clicking a row to reveal the actor's role, the RBAC rule that granted the access, and whether the access was routine or elevated (e.g., a data-subject erasure request).
status: implemented
library: p5.js
bloom_level: Analyze (L4)
---

# Privacy Access Audit Explorer



<iframe src="main.html" width="100%" height="472"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md).

```text
Type: infographic
**sim-id:** privacy-access-audit-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: examine, distinguish

Learning objective: Let the learner analyze a sample Privacy Access Audit table by clicking a row to reveal the actor's role, the RBAC rule that granted the access, and whether the access was routine or elevated (e.g., a data-subject erasure request).

Layout: A table of 6 sample audit rows (Actor, Action, Target Student Pseudonym, Timestamp, Role, Routine/Elevated tag) above a details panel that starts empty.

Data Visibility Requirements:
Stage 1: Show the 6-row table with an "Elevated" row highlighted in amber (e.g., a District Admin viewing PII during a data-subject erasure request) among 5 "Routine" rows (e.g., an Instructor viewing their own section's mastery report).
Stage 2: On row click, populate the details panel with that row's Role, the specific RBAC permission that authorized the action, and one sentence distinguishing routine analytics access from elevated PII access.

Interactive features: Every row is clickable; the details panel updates without navigating away from the table. A toggle filters the table to "Elevated only."

Instructional Rationale: An Analyze-level objective calls for the learner to distinguish categories of access rather than just view a static log — the routine/elevated filter and per-row role attribution make the distinction something the learner exercises, not just reads.

Implementation: p5.js canvas with a clickable table and a side detail panel, responsive width tracking the containing element.
```

## Related Resources

- [Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md)
