---
title: The Privacy Filter Pipeline
description: Let the learner trace an Analytics API request from Tenant Context Injection through Threshold Suppression, Complementary Suppression, and Privacy Audit Write, and identify at which stage a rostered-teacher exemption applies versus a cross-group view.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# The Privacy Filter Pipeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md).

```text
Type: workflow
**sim-id:** privacy-filter-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/information-systems/tree/main/docs/sims/privacy-regulatory-landscape<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace an Analytics API request from Tenant Context Injection through Threshold Suppression, Complementary Suppression, and Privacy Audit Write, and identify at which stage a rostered-teacher exemption applies versus a cross-group view.

Purpose: Show a single Mermaid flowchart tracing one request end to end through the privacy filter's structural stages.

Nodes in order: "Dash callback issues request" -> "TenantContext injection (query cannot compile without it)" -> "Query builder reads pre-aggregated ClickHouse view" -> "Is this the caller's own rostered scope?" (decision diamond) -> two branches: "Yes: exempt from Threshold Suppression" and "No: apply Threshold Suppression" -> both branches rejoin at "Complementary Suppression check" -> "Privacy Audit Write to lrs.audit" -> "Response returned to Dash callback, cached by (report_id, tenant, params, data_version)".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition matching this chapter's prose. Clicking the decision diamond opens an infobox explaining the rostered-scope exemption: a teacher viewing their own students already knows those students by name, so showing their own roster's progress discloses nothing new, while cross-district, cross-school, and segment-breakdown views always pass through full suppression.

Color coding: The two AuthN/AuthZ nodes (Dash callback, TenantContext injection) in neutral gray; the three privacy-filter stages (threshold, complementary, audit) in the book's teal accent color to visually group them as "the one choke point."

Responsive design: The flowchart resizes to the width of its containing element; on narrow viewports the decision branches stack vertically instead of side by side.
```

## Related Resources

- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md)
