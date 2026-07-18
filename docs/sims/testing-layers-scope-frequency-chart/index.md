---
title: Testing Layers by Scope and Run Frequency
description: Compare the eight testing layers by how much of the system each exercises and how often each runs, and justify why the widest-scope layer is also the least frequent.
status: scaffold
library: Chart.js
bloom_level: Evaluate (L5)
---

# Testing Layers by Scope and Run Frequency



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md).

```text
Type: chart
**sim-id:** testing-layers-scope-frequency-chart<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, justify

Learning objective: Compare the eight testing layers by how much of the system each exercises and how often each runs, and justify why the widest-scope layer is also the least frequent.

Chart type: Scatter/quadrant chart. X-axis: "Scope," from "Single function" to "Whole live system." Y-axis: "Run frequency," from "Scheduled/quarterly" to "Every commit," on a reversed log-like scale.

Data points: Unit Test Layer (narrow scope, every commit), Compression Test Suite (narrow-medium, every commit), ADL Conformance Test Suite (medium, every CI run), Testcontainers Integration Test (medium-wide, every CI run), Privacy Adversarial Suite (medium, every CI run), Load Test Loadgen (wide, pre-release), Replay Nightly Test (wide, nightly), Chaos Kill Test (widest, scheduled/staging-only).

Interactive features: Hovering a point shows a tooltip with the layer's name and what it checks. Clicking opens an infobox with the full prose description. A toggle switches the y-axis to "blast radius if this layer alone were skipped," re-plotting the same points.

Color scheme: Gradient from teal (narrow, frequent) to amber (wide, infrequent).

Annotation: A dashed diagonal trend line labeled "Wider scope, slower cadence."

Responsive design: Chart resizes to container width; axis labels abbreviate on narrow viewports while tooltips retain full text.
```

## Related Resources

- [Chapter 19: Failure Modes and Verification](../../chapters/19-failure-modes-and-verification/index.md)
