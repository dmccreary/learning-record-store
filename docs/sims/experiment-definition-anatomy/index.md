---
title: Anatomy of an Experiment Definition
description: Let the learner map the six named parts of an Experiment Definition (Experiment Hypothesis, Primary Outcome Metric, Unit Of Randomization, Experiment Variant, Allocation Weight, Guardrail Metric, Eligibility Predicate) onto one concrete worked example, reinforcing the plain-language definitions given in this section's prose.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# Anatomy of an Experiment Definition



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md).

```text
Type: infographic
**sim-id:** experiment-definition-anatomy<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, exemplify

Learning objective: Let the learner map the six named parts of an Experiment Definition (Experiment Hypothesis, Primary Outcome Metric, Unit Of Randomization, Experiment Variant, Allocation Weight, Guardrail Metric, Eligibility Predicate) onto one concrete worked example, reinforcing the plain-language definitions given in this section's prose.

Purpose: A central node labeled "Experiment Definition: Chapter 3 Worked Examples Test" with six labeled child nodes branching outward, each populated with a concrete filled-in example value: Experiment Hypothesis ("Worked examples raise mastery on Chapter 3 concepts"), Primary Outcome Metric ("Chapter 3 concept mastery"), Unit Of Randomization ("student_key"), Experiment Variant ×2 ("Control: v2.3" and "Treatment: v2.4 with worked examples", each showing its Allocation Weight of 50%), Guardrail Metric ("Engagement must not drop by more than 5%"), and Eligibility Predicate ("Districts that have not opted out of experimentation").

Interactive features: Clicking any of the six child nodes opens an infobox with that field's one-sentence definition, matching this section's prose, plus the worked example's specific value. A "Reset view" button collapses all open infoboxes.

Color coding: The central Experiment Definition node in the book's teal accent color; the two Experiment Variant nodes distinguished as control (gray-blue) versus treatment (amber) so the reader can see the comparison at a glance.

Responsive design: The diagram re-flows from a radial layout on wide viewports to a vertical stacked layout on narrow viewports, with all six child nodes remaining independently clickable at any width.
```

## Related Resources

- [Chapter 31: Designing and Reading A/B Experiments](../../chapters/31-designing-ab-experiments/index.md)
