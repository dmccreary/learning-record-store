---
title: Cross-Persona Workflow
description: Trace one ingested xAPI Statement through three independent, simultaneously-updated aggregations, and analyze why no persona's view requires a separate data pipeline from the others.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# Cross-Persona Workflow



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md).

```text
Type: workflow
**sim-id:** cross-persona-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, analyze

Learning objective: Trace one ingested xAPI Statement through three independent, simultaneously-updated aggregations, and analyze why no persona's view requires a separate data pipeline from the others.

Purpose: A single Mermaid flowchart tracing one concrete Statement (a student's correct MicroSim answer on cellular respiration) from ingestion into three parallel, non-interfering outcomes.

Flow: "Student answers MicroSim question correctly" -> "xAPI Statement ingested once (Actor, Verb, Object Activity, Result)" -> three parallel branches.

Branch A "Teacher": -> "Bayesian Knowledge Tracing update for this student's cellular-respiration mastery" -> "At-risk roster re-evaluated for this student."

Branch B "District Administrator": -> "Counted toward this section's textbook-usage coverage, no student named" -> "District adoption percentage updated."

Branch C "Textbook Author": -> "Added to this MicroSim version's running effectiveness estimate, no student named" -> "Feeds the Experiment Administration UI's readout if an experiment is running."

Interactive features: Every node has a Mermaid click directive. Clicking the shared ingestion node opens an infobox recapping that this is the same non-blocking ingestion path Chapter 8 described. Clicking any Branch A node opens an infobox linking to Chapter 12's Bayesian Knowledge Tracing explanation. Clicking any Branch B node opens an infobox naming the aggregation-threshold rule from Chapter 15 that would suppress this count if the group were smaller than ten. Clicking any Branch C node opens an infobox previewing Chapter 30 and Chapter 31's content-effectiveness and experiment coverage.

Color coding: Shared ingestion node in teal; Teacher branch in violet; District Administrator branch in amber; Textbook Author branch in green — matching the same three persona colors used in the "Three Personas, One Statement Log" diagram earlier in this chapter, so a reader recognizes the color scheme as a running convention.

Responsive design: The three branches stack vertically below the shared node on narrow viewports; click targets stay tap-sized.
```

## Related Resources

- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md)
