---
title: At-Risk Roster — How the Composite Score Is Built
description: Let the learner decompose one student's composite at-risk score into its three contributing signals (disengagement, low mastery, prerequisite gaps) and justify why a student flagged on all three ranks higher than a student flagged on only one.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# At-Risk Roster — How the Composite Score Is Built



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md).

```text
Type: workflow
**sim-id:** at-risk-roster-composite-score<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/atam/tree/main/docs/sims/risk-register-explorer<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: decompose, justify

Learning objective: Let the learner decompose one student's composite at-risk score into its three contributing signals (disengagement, low mastery, prerequisite gaps) and justify why a student flagged on all three ranks higher than a student flagged on only one.

Purpose: A Mermaid flowchart with three input boxes — "Idle Disengagement Alert" (no statements in N days), "Low Overall Mastery" (below-threshold ConceptMastery average), "Prerequisite Gap Analysis" (unmastered upstream concepts) — each with a labeled weight arrow flowing into one central "Composite Risk Score" box, which itself flows into a ranked "At-Risk Roster" table box showing three sample rows with different score compositions (one flagged on all three signals, ranked highest; one flagged on only disengagement, ranked lower; one flagged on only prerequisite gaps, ranked lowest of the three).

Interactive features: Clicking any of the three input boxes opens an infobox recapping that signal's definition from Chapter 28 (Idle Disengagement Alert, Struggle Detector's low-mastery evidence, Prerequisite Gap Analysis). Clicking the "Composite Risk Score" box opens an infobox explaining that the score is a weighted combination, not a simple count, and that a student can rank highly on strength of one severe signal alone. Clicking any roster row opens an infobox showing that student's individual signal breakdown.

Color coding: The three input boxes each in a distinct muted hue; the composite box in the book's amber accent color to mark it as the point of convergence; the roster rows shaded darkest-to-lightest by rank to reinforce the ranking visually.

Implementation: Mermaid flowchart adapted from the referenced template's factor-to-composite-score layout, with full click-to-infobox coverage. Responsive width tracking the containing element; on narrow viewports the three input boxes stack vertically above the composite box instead of fanning in from the sides.
```

## Related Resources

- [Chapter 29: Class-Level Reports and Teacher Tools](../../chapters/29-class-level-reports-and-tools/index.md)
