---
title: Storage Compression Ratio by Summary-Vertex Grain
description: Let the learner compare the storage compression ratio across the five grains that compress within-student evidence (QuestionResponse, PageEngagement, MicroSimEngagement, ConceptMastery, SectionRollup) and evaluate why SectionRollup's ratio is so much larger than the others.
status: scaffold
library: Chart.js
bloom_level: Analyze (L4)
---

# Storage Compression Ratio by Summary-Vertex Grain



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md).

```text
Type: chart
**sim-id:** compression-ratio-by-grain<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, evaluate

Learning objective: Let the learner compare the storage compression ratio across the five grains that compress within-student evidence (QuestionResponse, PageEngagement, MicroSimEngagement, ConceptMastery, SectionRollup) and evaluate why SectionRollup's ratio is so much larger than the others.

Purpose: Render the five storage-compression ratios from this section's prose as a single interactive bar chart, using a logarithmic y-axis so the ~3:1 and ~3,000:1 bars are both readable on one chart.

Data: Five bars, one per grain, x-axis labeled with the vertex label and y-axis labeled "Statements per summary vertex (log scale)". Values: QuestionResponse ≈ 3, PageEngagement ≈ 40, MicroSimEngagement ≈ 60, ConceptMastery ≈ 100, SectionRollup ≈ 3000.

Interactive features: Hovering any bar shows a tooltip with that grain's exact evidence-range text from this chapter's prose (e.g. "ConceptMastery: ~50-200 evidence events -> 1 vertex, ~100:1") plus its Analytical Grain key. Clicking a bar opens a side panel repeating that grain's evidence-count property name from the table above. A toggle switches the y-axis between logarithmic and linear scale, so the learner can see both how compressed SectionRollup is (log view) and how small QuestionResponse looks by comparison (linear view).

Color scheme: Bars colored on a single-hue gradient from the book's teal accent color (lightest for QuestionResponse, the smallest ratio) to the darkest teal (SectionRollup, the largest ratio), so color intensity visually tracks compression strength.

Responsive design: Chart canvas resizes to the width of its containing element on window resize, using Chart.js's built-in responsive option; bar labels rotate to a vertical orientation below 500px width to remain legible.
```

## Related Resources

- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../../chapters/08-summary-vertices-ingestion/index.md)
