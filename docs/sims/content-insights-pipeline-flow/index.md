---
title: How Eight Content Reports Read Four Summary Vertices
description: Explain how the four summary vertices already introduced in this book (PageEngagement, MicroSimEngagement, QuestionResponse, ConceptMastery) feed into the eight Content Insights reports, so the reports read as different views of the same evidence rather than eight separate data sources.
status: scaffold
library: p5.js
bloom_level: Understand (L2)
---

# How Eight Content Reports Read Four Summary Vertices



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md).

```text
Type: workflow
**sim-id:** content-insights-pipeline-flow<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/organizational-analytics/tree/main/docs/sims/end-to-end-pipeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Explain how the four summary vertices already introduced in this book (PageEngagement, MicroSimEngagement, QuestionResponse, ConceptMastery) feed into the eight Content Insights reports, so the reports read as different views of the same evidence rather than eight separate data sources.

Purpose: A horizontal pipeline diagram with four labeled source boxes on the left (PageEngagement, MicroSimEngagement, QuestionResponse, ConceptMastery), fanning through a central "Content Insights Dashboard" hub, out to eight report boxes on the right (Page Effectiveness, MicroSim Impact, Confusing-Content Finder, Drop-off Map, Concept-Coverage Gaps, Question Health, Version Comparison, Cross-District Benchmark). Each report box has a thin connecting line back to only the source boxes it actually reads, so a learner can see, for example, that Question Health connects only to QuestionResponse while Page Effectiveness connects to both PageEngagement and ConceptMastery.

Interactive features: Clicking any of the four source boxes opens an infobox recapping that vertex's grain and key properties from Chapter 8. Clicking any of the eight report boxes highlights its incoming connections and opens an infobox with that report's one-sentence purpose, matching the definition given in this chapter's prose. A "Reset" button clears all highlighting.

Color coding: The four source vertices in the book's teal accent color to mark "already covered evidence"; the eight report boxes in a warm amber to mark "new in this chapter"; highlighted connection lines thicken and darken on click.

Responsive design: Canvas width tracks the containing element's width. On narrow viewports the source boxes stack above the hub and the report boxes stack below it, rather than all three columns competing for horizontal space.
```

## Related Resources

- [Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md)
