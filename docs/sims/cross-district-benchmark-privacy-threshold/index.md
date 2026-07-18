---
title: Cross-District Benchmark — Applying the Privacy Aggregation Threshold
description: Apply the aggregation-threshold rule to determine whether a cross-district comparison may be displayed to an author, given a set of candidate district groupings of varying size.
status: scaffold
library: Mermaid
bloom_level: Apply (L3)
---

# Cross-District Benchmark — Applying the Privacy Aggregation Threshold



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md).

```text
Type: workflow
**sim-id:** cross-district-benchmark-privacy-threshold<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: apply, determine

Learning objective: Apply the aggregation-threshold rule to determine whether a cross-district comparison may be displayed to an author, given a set of candidate district groupings of varying size.

Purpose: A Mermaid flowchart starting from a "Candidate district group" decision node, branching on "group size >= 10 students?" Yes leads to a "Display de-identified aggregate (box plot)" box; No leads to a "Suppress — merge with an adjacent group or omit" box. A third box below both outcomes, "Cross-District Benchmark Report," receives arrows from both branches, showing that the report always renders something, but never a suppressed group's raw values.

Interactive features: Every node is wired with a Mermaid `click` directive. Clicking the decision node opens an infobox defining the aggregation threshold and its default value (group size >= 10). Clicking "Display de-identified aggregate" opens an infobox explaining that even a displayed aggregate never identifies a single district by name in the chart itself. Clicking "Suppress" opens an infobox explaining that suppression is enforced at the API layer, not merely hidden in the dashboard, so no client-side request can retrieve the raw group either.

Color coding: The threshold decision node in the book's amber accent color to mark it as the single enforcement choke point; the "Display" outcome in teal; the "Suppress" outcome in a muted gray to signal "intentionally withheld," not "missing data."

Responsive design: The flowchart resizes to the containing element's width; on narrow viewports the two outcome boxes stack vertically beneath the decision node instead of branching left and right.
```

## Related Resources

- [Chapter 30: Textbook Author Dashboards and Content Reports](../../chapters/30-author-dashboards-content-reports/index.md)
