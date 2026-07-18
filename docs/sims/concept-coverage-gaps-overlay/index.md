---
title: Concept-Coverage Gaps Overlaid on the Learning Graph
description: Let the learner identify which concepts in a dependency graph have little or no engagement evidence behind them, and distinguish a coverage gap (no content or no engagement) from a mastery gap (content exists but students are not learning it).
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# Concept-Coverage Gaps Overlaid on the Learning Graph



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md).

```text
Type: graph-model
**sim-id:** concept-coverage-gaps-overlay<br/>
**Library:** vis-network<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/signal-processing/tree/main/docs/sims/graph-viewer<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: identify, differentiate

Learning objective: Let the learner identify which concepts in a dependency graph have little or no engagement evidence behind them, and distinguish a coverage gap (no content or no engagement) from a mastery gap (content exists but students are not learning it).

Purpose: An interactive node-link rendering of a concept dependency graph (reusing the DEPENDS_ON structure Chapter 7 introduced), where each concept node is shaded by an evidence-count scale rather than a mastery scale: well-covered concepts in a solid teal fill, low-evidence concepts in a pale outline-only fill, and zero-evidence concepts marked with a dashed red outline.

Interactive features: Clicking any concept node opens an infobox showing its evidence count (how many PageEngagement, MicroSimEngagement, and QuestionResponse vertices reference it through a COVERS edge) and its position in the prerequisite chain. A search box lets the learner jump to a named concept. A toggle switches the overlay between "coverage" (evidence count) and "mastery" (the ConceptMastery-based shading used elsewhere in this book), making the distinction between the two kinds of gap visible on the same underlying graph.

Color coding: Solid teal for well-covered concepts, pale outline for low evidence, dashed red outline for zero evidence — a shape-and-fill distinction rather than a pure color distinction, so it remains legible for color-vision-deficient readers.

Responsive design: The graph canvas resizes to the containing element's width and re-runs its force layout on resize rather than clipping nodes off-screen; on narrow viewports the search box and toggle stack above the canvas instead of beside it.
```

## Related Resources

- [Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md)
