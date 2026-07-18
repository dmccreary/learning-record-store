---
title: HPA vs. KEDA — Two Autoscalers React to a Burst
description: Differentiate between CPU/RPS-driven autoscaling (HPA on the gateway) and consumer-lag-driven autoscaling (KEDA on the processor), and trace how each responds to the same 5x ingest burst.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# HPA vs. KEDA — Two Autoscalers React to a Burst



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md).

```text
Type: workflow
**sim-id:** hpa-vs-keda-burst-response<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, contrast

Learning objective: Differentiate between CPU/RPS-driven autoscaling (HPA on the gateway) and consumer-lag-driven autoscaling (KEDA on the processor), and trace how each responds to the same 5x ingest burst.

Purpose: A single Mermaid flowchart with two parallel tracks sharing one "5x burst begins" starting node, so the learner can compare the two autoscaling paths side by side rather than read them as separate diagrams.

Top track "Gateway — Horizontal Pod Autoscaler": "5x burst begins" -> "Request rate and CPU climb per gateway pod" -> "HPA compares live metric to target" -> "HPA adds gateway replicas" -> "Requests spread across more pods, CPU normalizes."

Bottom track "Processor — KEDA Autoscaler": "5x burst begins" -> "Kafka consumer lag grows on xapi.statements.raw" -> "KEDA scaler polls lag metric" -> "KEDA adds processor replicas, each claiming idle partitions" -> "Replicas drain backlog over the following minute, lag returns to baseline."

Interactive features: Every node has a Mermaid click directive. Clicking a Gateway-track node opens an infobox on RPS/CPU-based scaling; clicking a Processor-track node opens an infobox on consumer-lag scaling and why an HPA cannot read that metric natively. Clicking the shared "5x burst begins" node opens an infobox recapping Chapter 22's burst insensitivity claim and noting this diagram shows the pod-level mechanism behind it.

Color coding: Gateway track in the book's teal accent color; Processor/KEDA track in a contrasting violet, so the two signal types stay visually distinct even when read quickly.

Responsive design: Tracks stack vertically on narrow viewports with the shared starting node repeated at the top of each; click targets stay tap-sized.
```

## Related Resources

- [Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md)
