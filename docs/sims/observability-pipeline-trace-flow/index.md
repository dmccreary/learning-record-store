---
title: The Observability Pipeline, From Statement to Screen
description: Let the learner trace how a single trace ID and a separate metrics stream flow through OpenTelemetry, Jaeger, Prometheus, and Grafana, from statement receipt to a screen a system administrator actually watches.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# The Observability Pipeline, From Statement to Screen



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md).

```text
Type: workflow
**sim-id:** observability-pipeline-trace-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a single trace ID and a separate metrics stream flow through OpenTelemetry, Jaeger, Prometheus, and Grafana, from statement receipt to a screen a system administrator actually watches.

Purpose: Show a single Mermaid flowchart with two parallel paths sharing a common source, reflecting that traces and metrics are two different signals produced by the same instrumentation.

Nodes: Common source: "Gateway mints a trace ID on statement receipt". Path A (traces): leads to "OpenTelemetry instrumentation attaches the trace ID at every hop (gateway, queue, processor, ClickHouse write, Neo4j write)" leads to "Jaeger stores the full trace as one connected timeline" leads to "Engineer looks up one statement's entire journey". Path B (metrics): "Every role emits metrics (queue depth, processing lag, dead-letter rate) via OpenTelemetry" leads to "Prometheus scrapes and stores the metrics as a time series" leads to "Grafana renders dashboards a system administrator watches" leads to "Same numbers back the Data Quality Monitor report for a district administrator".

Interactive features: Every node has a Mermaid click directive. Clicking "OpenTelemetry" opens an infobox defining it as the vendor-neutral instrumentation standard, distinguishing it from the three products that consume its output. Clicking "Jaeger" or "Prometheus" opens an infobox naming which signal type each stores (traces vs. metrics). Clicking "Grafana" opens an infobox naming its role as the presentation layer for both. Clicking the shared "trace ID" node reinforces the end-to-end-tracing requirement named in this chapter's prose.

Color coding: The trace path in the book's teal accent color; the metrics path in a complementary amber; the shared source node in a neutral color to show it is the common origin of both.

Responsive design: The two paths stack vertically at narrow widths, remaining independently readable; the flowchart resizes to the width of its containing element.
```

## Related Resources

- [Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md)
