---
title: Threshold and Complementary Suppression Simulator
description: Given a small table of per-mastery-band student counts and a row total, let the learner determine which cells Threshold Suppression hides and which additional cell Complementary Suppression must hide to prevent the first suppression from being recovered by subtraction.
status: scaffold
library: p5.js
bloom_level: Evaluate (L5)
---

# Threshold and Complementary Suppression Simulator



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md).

```text
Type: microsim
**sim-id:** threshold-complementary-suppression-simulator<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: determine, justify

Learning objective: Given a small table of per-mastery-band student counts and a row total, let the learner determine which cells Threshold Suppression hides and which additional cell Complementary Suppression must hide to prevent the first suppression from being recovered by subtraction.

Canvas layout:

- A 5-row by 4-column data table: rows are mastery bands ("Beginning", "Developing", "Proficient", "Advanced"), columns are student counts per band plus a "Row Total" column
- A control strip above the table: a "Threshold" slider (range 5-20, default 10), a "Load Scenario" dropdown with three presets ("Safe — all cells above threshold", "Single suppression needed", "Complementary suppression needed"), and a "Reset" button

Visual elements:

- Cells with a count at or above the threshold render with a normal white background and black text
- Cells below the threshold render with a red background and a lock icon, replacing the number with "—"
- When Complementary Suppression triggers, the second suppressed cell renders with an amber background and a lock icon, visually distinct from the primary (red) suppression
- A status line below the table states in plain language why each suppression happened, e.g. "Beginning (6) is below the threshold of 10 — suppressed. Developing (14) is now also suppressed: the row total and the two remaining visible cells would let a reader recover Beginning's value by subtraction."

Interactive controls:

- Slider: "Threshold" — recomputes suppression live as it moves
- Dropdown: "Load Scenario" — loads one of three preset row configurations to demonstrate no-suppression, single-suppression, and complementary-suppression cases
- Button: "Reset" — restores the default scenario and threshold

Behavior: On any threshold change or scenario load, the simulator recomputes which cells fall below threshold, then checks whether the remaining visible cells plus the row total would allow the suppressed cell's value to be derived by subtraction; if so, it suppresses the next-smallest visible cell and updates the status line to explain the chain of reasoning.

Interactive features: Clicking any cell (suppressed or not) opens an infobox stating its raw count (for instructor/demo mode only — a real dashboard would never expose this), whether it was suppressed, and which rule caused the suppression.

Color coding: Red background for primary Threshold Suppression, amber for secondary Complementary Suppression, matching the color logic used consistently across this chapter's other suppression discussion.

Responsive design: Table and control strip stack vertically on narrow viewports; the table itself scrolls horizontally within its container rather than shrinking column text below a readable size.
```

## Related Resources

- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../../chapters/15-privacy-and-dashboard-mechanics/index.md)
