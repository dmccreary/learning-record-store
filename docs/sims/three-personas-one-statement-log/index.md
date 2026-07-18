---
title: Three Personas, One Statement Log
description: Explain how the District Administrator, Teacher, and Textbook Author each draw on the same underlying xAPI statement log, filtered through a different aggregation and access lens, rather than three separate data sources.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Three Personas, One Statement Log



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md).

```text
Type: workflow
**sim-id:** three-personas-one-statement-log<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, summarize

Learning objective: Explain how the District Administrator, Teacher, and Textbook Author each draw on the same underlying xAPI statement log, filtered through a different aggregation and access lens, rather than three separate data sources.

Purpose: A single Mermaid flowchart with one shared source node fanning out into three persona-specific paths, so the learner sees structurally that the fan-out happens after ingestion, not before it.

Shared source node: "Statement Log (every ingested xAPI Statement, this project's system of record)."

Three outgoing paths from the shared node:

- Path 1 "District Administrator": Statement Log -> "Aggregated by school and district" -> "Adoption and deployment coverage view" -> "Answers: is every school covered and compliant?"
- Path 2 "Teacher": Statement Log -> "Aggregated by section and student, scoped to sections this teacher teaches" -> "Classroom mastery and at-risk view" -> "Answers: which student needs help, and on what?"
- Path 3 "Textbook Author": Statement Log -> "Aggregated by content version and MicroSim, no student identity" -> "Content-effectiveness and experiment view" -> "Answers: did my content change actually help?"

Interactive features: Every node has a Mermaid click directive. Clicking the shared "Statement Log" node opens an infobox recapping Chapter 1's Actor/Verb/Object Activity model and noting this single log is the only source for all three paths. Clicking any aggregation node opens an infobox naming the access boundary enforced at that step (district/school scope, section/roster scope, or de-identified content scope). Clicking any "Answers:" node opens an infobox restating that persona's goal sentence from this chapter's prose.

Color coding: The shared source node in the book's teal accent color; the District Administrator path in amber, the Teacher path in violet, the Textbook Author path in green — three distinct hues so a learner can trace one path at a glance without following arrows carefully.

Responsive design: The three paths stack vertically below the shared source node on narrow viewports instead of fanning out horizontally; click targets stay tap-sized.
```

## Related Resources

- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md)
