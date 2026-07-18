---
title: Two Summary-Building Functions — Mastery and Progress
description: Let the learner differentiate the Mastery Computation Function's single grain (ConceptMastery) from the Progress Projection Function's five grains (PageEngagement, MicroSimEngagement, QuestionResponse, LearningSession, SectionRollup), classifying each of Chapter 8's six summary-vertex labels under the correct function.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# Two Summary-Building Functions — Mastery and Progress



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md).

```text
Type: infographic
**sim-id:** mastery-vs-progress-rollup<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/intelligent-textbooks/tree/main/docs/sims/question-color-update<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, classify

Learning objective: Let the learner differentiate the Mastery Computation Function's single grain (ConceptMastery) from the Progress Projection Function's five grains (PageEngagement, MicroSimEngagement, QuestionResponse, LearningSession, SectionRollup), classifying each of Chapter 8's six summary-vertex labels under the correct function.

Purpose: Show a two-branch vis-network graph rooted at "Enriched Statement (concept_ids attached)", splitting into a "Mastery Computation Function (F-7)" branch and a "Progress Projection Function (F-8)" branch.

Nodes: Root: "Enriched Statement". Branch F-7: single child node "ConceptMastery — (student, concept)". Branch F-8: five child nodes "PageEngagement — (student, page)", "MicroSimEngagement — (student, microsim)", "QuestionResponse — (student, question)", "LearningSession — (student, session)", "SectionRollup — (section, concept)".

Interactive features: Clicking "Mastery Computation Function" or "Progress Projection Function" opens an infobox with that function's definition from this chapter's prose and its F-number. Clicking any of the six grain nodes opens an infobox recalling that vertex's key properties from Chapter 8's grain table. A toggle labeled "Show statement compression ratio" annotates each leaf node with its approximate compression ratio from Chapter 8 (e.g. ConceptMastery ~100:1, SectionRollup ~3,000:1) when enabled.

Color coding: The F-7 branch in the book's teal accent color; the F-8 branch in a complementary amber, matching the two-function color language established for the "accept immediately / reconciled later" split in Chapter 8's Accept-First diagram.

Responsive design: Graph layout recalculates on window resize using vis-network's physics engine; on narrow viewports the two branches stack vertically rather than side by side.
```

## Related Resources

- [Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md)
