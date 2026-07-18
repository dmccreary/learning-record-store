---
title: Makefile Target Command Explorer
description: Given a development scenario, select the correct make target, distinguish implemented targets from the deferred obs target, and identify the underlying docker compose (or script) command each one expands to.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# Makefile Target Command Explorer



<iframe src="main.html" width="100%" height="492"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md).

```text
Type: infographic
**sim-id:** makefile-target-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: select, apply

Learning objective: Given a development scenario, select the correct make target, distinguish implemented targets from the deferred obs target, and identify the underlying docker compose (or script) command each one expands to.

Canvas layout: Left column, a scrollable list of eleven target tiles in monospace (up, down, clean, logs, seed, smoke, perf, burst, rebuild, test, obs). Right panel, a detail card populated on click showing the expanded command, a one-sentence description, and a status tag ("Implemented" or "Deferred"). Top strip: a search box and "Implemented only / Show all" toggle.

Visual elements: Implemented-target tiles show a teal left border; the deferred obs tile shows a dashed amber border with a "deferred" badge. The selected tile has a highlighted outline; its detail card slides in from the right.

Interactive controls: Click a tile to populate the detail panel. The search box keyword-matches each tile's tags (e.g. "burst" tagged "load test," "5x"; "obs" tagged "tracing," "not yet built") and highlights the best match. The filter toggle hides the obs tile when set to "Implemented only."

Color coding: Teal left border for implemented targets, amber dashed border for the deferred target, matching this chapter's compose-profile table.

Responsive design: The two-column layout collapses to a single stacked column on narrow viewports, with the detail card below the selected tile.
```

## Related Resources

- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md)
