---
title: The Start/Pause Dwell Pattern
description: Let the learner trace a MicroSim's Start/Pause lifecycle through four branches — normal Pause, tab hidden while running, sub-250ms run, walk-away-with-no-pause — and predict which emits an Experienced Verb statement.
status: scaffold
library: Mermaid
bloom_level: Apply (L3)
---

# The Start/Pause Dwell Pattern



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md).

```text
Type: workflow
**sim-id:** start-pause-dwell-pattern-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, predict

Learning objective: Let the learner trace a MicroSim's Start/Pause lifecycle through four branches — normal Pause, tab hidden while running, sub-250ms run, walk-away-with-no-pause — and predict which emits an Experienced Verb statement.

Purpose: A Mermaid flowchart from "Student clicks Start (loaded paused)" branching into four paths: (1) "Pause after a normal run" → "Emit ONE Experienced statement, duration = elapsed"; (2) "Switches tabs while running" → "visibilitychange fires → Visibility Change Flush: emit immediately"; (3) "Pause under 250ms" → "Emit nothing — mis-click"; (4) "Walks away, Pause never clicked" → "Emit nothing — unclosed interval."

Interactive features: Every node has a Mermaid `click` directive opening an infobox explaining that outcome using the reasoning above (unclosed intervals, mis-click noise, mobile Safari's visibilitychange requirement).

Color coding: The two "emit nothing" outcomes in muted gray-blue; the two statement-emitting outcomes in the book's teal accent color.

Implementation: Mermaid flowchart, top-to-bottom, full click-to-infobox coverage. Responsive: stacks branches vertically on narrow viewports.
```

## Related Resources

- [Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md)
