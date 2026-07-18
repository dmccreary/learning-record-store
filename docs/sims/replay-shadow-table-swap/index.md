---
title: Replay Command and Rebuild Graph Command Compared
description: Let the learner trace the Replay Command's shadow-table-and-swap path side by side with the Rebuild Graph Command's watermark-reset path, and explain why the second needs no separate rebuild logic of its own.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# Replay Command and Rebuild Graph Command Compared



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md).

```text
Type: workflow
**sim-id:** replay-shadow-table-swap<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, trace

Learning objective: Let the learner trace the Replay Command's shadow-table-and-swap path side by side with the Rebuild Graph Command's watermark-reset path, and explain why the second needs no separate rebuild logic of its own.

Purpose: Show two parallel Mermaid flowchart lanes under one heading, so the learner reads across both paths and sees them diverge from a shared starting point.

Left lane "Replay Command: lrs replay --from T1 --to T2 --into <table>": "Read immutable log for district + time window" -> "Recompute projection, keyed by statement_id" -> "Write into new shadow table (invisible to live queries)" -> "Rebuild complete: atomic swap" -> "Shadow table becomes the live table".

Right lane "Rebuild Graph Command: lrs replay --rebuild-graph": "Reset summarizer watermark to zero" -> "Ordinary 60-second sync loop runs as normal" -> "Summarizer reads 'unsynced' rollups (which is now all of them)" -> "MERGE upserts every summary vertex, guarded by the Grain Uniqueness Constraint" -> "Graph fully rebuilt with no dedicated rebuild code path".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence explanation. A toggle labeled "Highlight shared safety guarantee" highlights the "keyed by statement_id" node in the left lane and the "Grain Uniqueness Constraint" node in the right lane simultaneously, with a connecting annotation: "Both paths are safe to re-run because each relies on a different structural guarantee against duplication."

Color coding: Left lane in one tint of the book's teal accent color, right lane in a second tint, so the two paths stay visually distinct while clearly belonging to the same diagram; the shared safety-guarantee toggle highlight in amber.

Responsive design: The two lanes stack vertically on narrow viewports instead of side by side, each still reading top to bottom.
```

## Related Resources

- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md)
