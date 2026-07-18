---
title: System Configuration and Alerting Dashboard
description: Interpret a live-style processing-lag chart against a configurable Alerting Configuration threshold line, and relate that threshold to the platform-wide Retention Defaults Config, Feature Flag Config, and Rate Limit Config panels a System Administrator manages on the same screen.
status: implemented
library: Chart.js
bloom_level: Analyze (L4)
---

# System Configuration and Alerting Dashboard



<iframe src="main.html" width="100%" height="542"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md).

```text
Type: chart
**sim-id:** system-config-alerting-dashboard<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: relate, interpret

Learning objective: Interpret a live-style processing-lag chart against a configurable Alerting Configuration threshold line, and relate that threshold to the platform-wide Retention Defaults Config, Feature Flag Config, and Rate Limit Config panels a System Administrator manages on the same screen.

Purpose: A combination line chart plus control panel: the chart shows a simulated processing-lag time series across the last 60 minutes, with a horizontal threshold line the learner can drag to any value between 1 and 15 minutes.

Chart data: Sixty data points, one per simulated minute, oscillating between 1 and 4 minutes of processing lag with three deliberate spikes (minute 20 reaching 6 minutes; minute 35 reaching 8 minutes; minute 50 reaching 3 minutes), so the learner sees both alert-triggering and non-triggering fluctuation.

Interactive controls: A draggable horizontal threshold line, default 5 minutes per the specification's example. Any segment crossing above the threshold turns red and shows an "ALERT: paging System Administrator" banner; dragging the threshold live-updates which spikes trigger an alert. Below the chart, three read-only panels labeled "Retention Defaults," "Feature Flags," and "Rate Limits" show one example value each, and hovering any panel opens a tooltip with that field's one-sentence definition from this chapter's prose.

Color coding: Chart line in the book's teal accent color below threshold, red above it; threshold line in dashed amber.

Implementation notes: Use Chart.js's line chart type with an annotation layer for the draggable threshold line; the three configuration panels can be plain HTML/CSS elements since they hold static reference values rather than chart data.

Responsive design: Chart resizes to its containing element's width using Chart.js's built-in responsive option; the three configuration panels stack vertically below the chart on viewports narrower than 700px instead of sitting in a row.
```

## Related Resources

- [Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md)
