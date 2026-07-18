---
title: The AB Test Lifecycle
description: Let the learner sequence the states an experiment moves through — draft, running, paused, concluded, archived — and identify which transitions are reversible versus terminal.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# The AB Test Lifecycle



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md).

```text
Type: workflow
**sim-id:** ab-test-lifecycle-states<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Let the learner sequence the states an experiment moves through — draft, running, paused, concluded, archived — and identify which transitions are reversible versus terminal.

Purpose: A Mermaid state diagram with five nodes: "Draft" → "Running" (on approval), "Running" → "Paused" (on guardrail regression, SRM failure, or author judgment), "Paused" → "Running" (on resume once the issue is resolved), "Running" → "Concluded" (on stop; control arm served to everyone from this point forward), "Concluded" → "Archived" (terminal).

Interactive features: Every state node is wired with a Mermaid `click` directive. Clicking "Draft" opens an infobox noting the Experiment Definition is still editable and unapproved. Clicking "Running" opens an infobox noting assignment and data collection are both active. Clicking "Paused" opens an infobox listing the three common triggers (guardrail regression, SRM failure, author judgment) and noting no data is lost. Clicking "Concluded" opens an infobox emphasizing that stopping serves the control arm to everyone going forward, regardless of which arm the readout favored. Clicking "Archived" opens an infobox noting this is a terminal, read-only state kept for audit history.

Color coding: Draft in neutral gray, Running in teal, Paused in amber, Concluded in a deeper teal, Archived in muted gray-blue — a progression from "not yet active" through "active" to "done," with Paused visually distinct as an interruption rather than an ending.

Responsive design: The state diagram resizes to the containing element's width; on narrow viewports the states stack top-to-bottom in sequence rather than arranging left-to-right.
```

## Related Resources

- [Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md)
