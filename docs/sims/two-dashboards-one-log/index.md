---
title: District Overview vs. System Health — Two Lenses on One Log
description: Let the learner classify each of the eight reports under the dashboard it belongs to, and see that both dashboards read from the same underlying statement log rather than separate data sources.
status: implemented
library: vis-network
bloom_level: Understand (L2)
---

# District Overview vs. System Health — Two Lenses on One Log



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md).

```text
Type: graph-model
**sim-id:** two-dashboards-one-log<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, contrast

Learning objective: Let the learner classify each of the eight reports under the dashboard it belongs to, and see that both dashboards read from the same underlying statement log rather than separate data sources.

Purpose: A central "Statement Log" node with two dashboard nodes branching from it (District Overview, System Health), each connected to its four (or three) constituent report nodes.

Nodes: Statement Log (center), District Overview Dashboard, System Health Dashboard, and the eight report nodes from the table above, each attached to its owning dashboard.

Interactive features: Hovering the Statement Log node highlights all eight report nodes at once, showing they share one source. Clicking a dashboard node highlights only its own reports and dims the other dashboard's. Clicking any report node opens an infobox with that report's one-line description from the table above.

Color coding: District Overview Dashboard and its reports in the book's teal accent color; System Health Dashboard and its reports in amber.

Implementation: vis-network force-directed graph with click/hover handlers, responsive width tracking the containing element. Zoom and pan enabled.
```

## Related Resources

- [Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md)
