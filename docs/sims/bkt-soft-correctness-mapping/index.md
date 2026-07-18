---
title: From Raw Evidence to Soft Correctness
description: Let the learner evaluate how different raw evidence signals (a graded quiz answer, dwell time on a page, MicroSim interaction depth) map to a soft correctness value and a blending weight, and differentiate why non-binary evidence should count for less than a graded response.
status: implemented
library: p5.js
bloom_level: Analyze (L4)
---

# From Raw Evidence to Soft Correctness



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md).

```text
Type: chart
**sim-id:** bkt-soft-correctness-mapping<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/theory-of-knowledge/tree/main/docs/sims/evidence-strength-hierarchy<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: evaluate, differentiate

Learning objective: Let the learner evaluate how different raw evidence signals (a graded quiz answer, dwell time on a page, MicroSim interaction depth) map to a soft correctness value and a blending weight, and differentiate why non-binary evidence should count for less than a graded response.

Purpose: Show, as an interactive bar chart, how three evidence types convert into a soft correctness value in [0,1] plus a separate evidence weight, so the learner sees both numbers move together as the underlying signal changes.

Controls: A toggle selecting evidence type — "Graded quiz response" (binary), "Page dwell time" (slider, 0–300 seconds), "MicroSim interaction depth" (slider, 0–20 interactions) — plus a "Compare to a graded response" checkbox that overlays a fixed reference bar at weight 1.0.

Visual elements: Two side-by-side bars per selection, "Soft Correctness" (0–1) and "Evidence Weight" (0–1), updating live as the slider moves. A graded response fixes Evidence Weight at 1.0; dwell time and interaction depth both show Soft Correctness rising smoothly with the slider but Evidence Weight capped well below 1.0 (illustrative default: 0.3), reinforcing that this evidence counts for less.

Interactive features: Moving a slider recomputes both bars immediately. Hovering a bar shows its exact value and a one-sentence explanation matching this chapter's prose. An "Open question" info icon notes that the specification leaves the owning component for this mapping undecided.

Color scheme: Soft Correctness bars in the book's teal accent color; Evidence Weight bars in muted gray; the reference graded-response bar in amber when enabled.

Responsive design: Chart resizes to its container; below tablet width the bars stack vertically and the toggle becomes a dropdown.
```

## Related Resources

- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../../chapters/12-bayesian-knowledge-tracing/index.md)
