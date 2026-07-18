---
title: Expand-Contract Step Sequencer
description: Given the five steps of an Expand Contract Migration in scrambled order, arrange them into the correct sequence and identify which steps can ship independently.
status: scaffold
library: p5.js
bloom_level: Apply (L3)
---

# Expand-Contract Step Sequencer



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md).

```text
Type: microsim
**sim-id:** expand-contract-step-sequencer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: apply, sequence

Learning objective: Given the five steps of an Expand Contract Migration in scrambled order, arrange them into the correct sequence and identify which steps can ship independently.

Canvas layout: A vertical drop-zone column of five numbered slots on the left; a scrambled shelf of five draggable tiles on the right — "Add new column (nullable)", "Backfill from old column", "Dual-write to both columns", "Switch reads to new column", "Drop old column". A bottom strip reads "Correctly placed: 0 / 5" with a "Check Order" button.

Visual elements: Teal rounded-rectangle tiles; a correctly placed tile turns green with a checkmark, an incorrect one flashes red and returns to the shelf.

Interactive controls: Drag-and-drop tiles into slots; "Check Order" validates and updates the score; "Reset" clears the board.

Default parameters: All five tiles start on the shelf in seeded (reproducible) random order; no slot pre-filled.

Behavior: On a fully correct order, display "Expand, contract, done — every step above could have shipped on its own." Clicking a placed tile reopens an infobox explaining why that step must precede the next.

Implementation notes: p5.js mouse-press/release drag-and-drop, matching Chapter 1's vocabulary-matching MicroSim. Responsive: canvas tracks container width; columns stack vertically on narrow viewports.
```

## Related Resources

- [Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md)
