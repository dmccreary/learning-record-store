---
title: Four Functions at the System's Edges
description: Let the learner explain what triggers each of the four functions that run off the main statement pipeline — Experiment Assignment, Reconciliation, Export, and Retention Purge — and classify each by whether its trigger is per-statement, scheduled, or on-demand.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# Four Functions at the System's Edges



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md).

```text
Type: workflow
**sim-id:** functions-at-the-edges<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Let the learner explain what triggers each of the four functions that run off the main statement pipeline — Experiment Assignment, Reconciliation, Export, and Retention Purge — and classify each by whether its trigger is per-statement, scheduled, or on-demand.

Purpose: Show four independent Mermaid flowchart branches, each rooted at a distinct trigger rather than a shared starting node, visually reinforcing that these functions do not share one pipeline.

Nodes, one branch per function: Branch 1: "A student reaches an experiment's eligibility check" leads to "Experiment Assignment Function (F-9): deterministic, sticky variant assignment" leads to "Chapter 31: full assignment and readout mechanics". Branch 2: "Scheduled scan of provisional nodes" leads to "Reconciliation Function (F-10): match + promote + back-fill" leads to "Chapter 8: full reconciliation mechanics". Branch 3: "District or system admin requests a bulk export" leads to "Export Function (F-11): async job, signed download URL". Branch 4: "Scheduled partition drop, or an on-demand erasure request" leads to "Retention Purge Function (F-12): policy-driven retention, FERPA/COPPA-compliant purge" leads to "A later chapter: full compliance treatment".

Interactive features: Every node has a Mermaid click directive. Clicking a trigger node opens an infobox stating whether the trigger is per-statement, scheduled, or on-demand. Clicking a function node opens an infobox with that function's one-sentence definition and F-number from this chapter's prose. Clicking a "full mechanics" reference node opens an infobox naming which earlier or later chapter covers that function in depth.

Color coding: Scheduled-trigger branches (Reconciliation, the retention half of F-12) in a muted slate color; on-demand/per-statement branches (Experiment Assignment, Export, the erasure half of F-12) in the book's teal accent color, distinguishing "runs on a timer" from "runs because someone asked."

Responsive design: The four branches stack vertically and remain independently readable at any viewport width; each branch's internal flow remains left-to-right down to tablet width, then reflows top-to-bottom below it.
```

## Related Resources

- [Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md)
