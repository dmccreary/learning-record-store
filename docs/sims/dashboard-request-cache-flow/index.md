---
title: Analytics Cache Key and the Privacy Filter Choke Point
description: Let the learner trace a dashboard request from its Report ID Endpoint Pattern URL through an Analytics Cache Key lookup, a Data Version Invalidation check, and the single Privacy Filter Choke Point, to a response that meets the P95 Latency Budget.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# Analytics Cache Key and the Privacy Filter Choke Point



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md).

```text
Type: workflow
**sim-id:** dashboard-request-cache-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/it-management-graph/tree/main/docs/sims/performance-monitoring-dashboard-workflow

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, justify

Learning objective: Let the learner trace a dashboard request from its Report ID Endpoint Pattern URL through an Analytics Cache Key lookup, a Data Version Invalidation check, and the single Privacy Filter Choke Point, to a response that meets the P95 Latency Budget.

Purpose: Show a Mermaid flowchart tracing one dashboard request, adapted from the template's existing performance-dashboard workflow to this chapter's cache and privacy mechanisms.

Nodes: "Dash callback calls GET /v1/reports/R-201?... (Report ID Endpoint Pattern)" leads to "Build Analytics Cache Key: report_id + tenant + params + data_version" then splits: "Cache hit" leads to "Skip straight to Privacy Filter Choke Point"; "Cache miss or Data Version Invalidation triggered" leads to "Query pre-aggregated ClickHouse view / Redis mastery vector" leads to "Privacy Filter Choke Point". Both paths converge at "Privacy Filter Choke Point (threshold + complementary suppression, always applied)" leads to "Response returned within P95 Latency Budget".

Interactive features: Every node has a Mermaid click directive opening a definition infobox — the cache-key node lists all four key parts, the Data Version Invalidation node explains watermark-driven versus fixed-TTL invalidation, and the choke-point node stresses that both paths converge there so no response can bypass it.

Color coding: The cache-hit path in the book's teal accent color; the cache-miss path in a lighter tint of the same hue; the shared Privacy Filter Choke Point node in amber to flag it as the mandatory convergence point.

Responsive design: Flowchart resizes to the width of its containing element; the two branches stack vertically above their shared convergence node on narrow viewports.
```

## Related Resources

- [Chapter 13: Component Design in Depth](../../chapters/13-component-design-in-depth/index.md)
