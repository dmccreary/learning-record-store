---
title: Sync Cadence Tradeoff Explorer
description: Let the learner manipulate the summarizer's sync cadence and observe, with real computed numbers, how distinct active grains, graph upserts per second, and graph lag all move together — building intuition for why the design specification chose 60 seconds as the default.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# Sync Cadence Tradeoff Explorer



<iframe src="main.html" width="100%" height="472"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md).

```text
Type: microsim
**sim-id:** sync-cadence-tradeoff-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: calculate, experiment, apply

Learning objective: Let the learner manipulate the summarizer's sync cadence and observe, with real computed numbers, how distinct active grains, graph upserts per second, and graph lag all move together — building intuition for why the design specification chose 60 seconds as the default.

Canvas layout:

- Top area (400px): a horizontal slider labeled "Sync cadence (seconds)" ranging from 5 to 300, with tick marks at 5, 60, and 300 matching the three rows of this chapter's table
- Middle area: four large numeric readouts that update live as the slider moves — "Statements coalesced," "Distinct active grains," "Graph upserts/sec," and "Graph lag"
- Bottom area: a horizontal bar showing "Graph upserts/sec" scaled against a fixed reference line at "10,000/sec (naive, prohibited)" so the learner can see how far below the naive rate every cadence setting stays

Visual elements:

- Slider track in the book's teal accent color, with a draggable handle
- The four numeric readouts in large, high-contrast text, each with a small icon (clock for cadence-dependent, database for grain count)
- The bottom comparison bar shrinks and grows in real time as the slider moves, always dwarfed by the fixed 10,000/sec reference line

Interactive controls:

- Slider: "Sync cadence (seconds)," 5 to 300, default 60
- Toggle button: "Show burst scenario (50,000 stmt/sec)" — recomputes all four readouts using the burst ingest rate instead of the peak sustained rate, so the learner can see directly that upserts/sec barely changes even though ingest quintuples
- Button: "Reset to default (60s)"

Default parameters:

- Cadence: 60 seconds
- Ingest scenario: peak sustained (10,000 stmt/sec)

Behavior:

- Moving the slider recomputes all four readouts using this chapter's derivation: statements coalesced = ingest rate × cadence; distinct active grains scales sub-linearly toward a ceiling around 300K as cadence grows; graph upserts/sec = distinct active grains ÷ cadence; graph lag = cadence itself
- At the three tick marks (5s, 60s, 300s) the readouts snap to and display the exact figures from this chapter's Sync Cadence Tradeoff table, so the learner can verify the simulation against the printed numbers
- Toggling "Show burst scenario" visibly changes "Statements coalesced" a great deal while "Graph upserts/sec" changes only modestly, making the burst-insensitivity property directly observable rather than merely asserted in prose

Instructional Rationale: An Apply-level objective calls for parameter exploration rather than a passive animation — the learner should be able to drag the cadence slider themselves and watch the tradeoff numbers respond, which builds the intuition that a longer cadence trades freshness for a gentler write rate, matching exactly the design decision ADR-002 and this chapter's prose describe.

Implementation notes: Use p5.js `slider()` for the cadence control and redraw the four readouts and the comparison bar every frame based on the current slider value; interpolate distinct-active-grains between the three anchor points (50K at 5s, 150K at 60s, 300K at 300s) using a smooth curve rather than linear interpolation, since the underlying relationship saturates. Responsive design: canvas width tracks the containing element's width, with the readout panel reflowing beneath the slider on narrow viewports instead of beside it.
```

## Related Resources

- [Chapter 11: Architecture Decision Records and the Capacity Model](../../chapters/11-adrs-and-capacity-model/index.md)
