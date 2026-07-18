---
title: Rebuild Time by Scenario and Cache State
description: Given three rebuild scenarios, determine which of ordinary layer caching versus the build cache mount is responsible for the time saved in each case.
status: scaffold
library: Chart.js
bloom_level: Evaluate (L5)
---

# Rebuild Time by Scenario and Cache State



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md).

```text
Type: chart
**sim-id:** build-cache-rebuild-times<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: determine, justify

Learning objective: Given three rebuild scenarios, determine which of ordinary layer caching versus the build cache mount is responsible for the time saved in each case.

Purpose: A grouped bar chart comparing simulated rebuild wall-clock time across three scenarios, each with and without the uv cache mount, isolating the mount's effect from ordinary layer-skipping.

Data (illustrative, labeled as representative, not measured): Scenario 1 "Code only changed (layer skip applies)" -- with mount 8s, without 9s (dependency layer is skipped entirely either way). Scenario 2 "uv.lock changed (dependency layer reruns)" -- with mount 12s, without 65s (mount reuses already-downloaded packages). Scenario 3 "Cold machine, no prior cache" -- with mount 70s, without 70s (nothing cached yet to reuse).

Controls: Toggle "Absolute seconds / Multiple of fastest"; dropdown to highlight one scenario's bars while the others dim to 40% opacity.

Interactive features: Hovering or clicking a bar opens a tooltip explaining, in one sentence, why that bar has its value. Scenario 3's tooltip notes a cache mount cannot help a build with nothing cached yet.

Color coding: "With cache mount" bars in the book's teal accent color; "without" bars in muted gray, so Scenario 2's size difference reads immediately as the mount's payoff.

Responsive design: Legend moves below the plot on narrow viewports; bar labels rotate rather than overlap.
```

## Related Resources

- [Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md)
