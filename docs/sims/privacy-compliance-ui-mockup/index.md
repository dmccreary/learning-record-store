---
title: Privacy and Compliance UI Mockup
description: Operate a realistic mock-up of the Privacy & Compliance UI, locating each of the four fields this section explains — Policy Profile Preset, Data Subject Request, Consent Status, and Aggregation Threshold — within a plausible screen layout rather than a bulleted description.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# Privacy and Compliance UI Mockup



<iframe src="main.html" width="100%" height="502"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md).

```text
Type: infographic
**sim-id:** privacy-compliance-ui-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/token-efficiency/tree/main/docs/sims/privacy-compliance-pipeline<br/>

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, locate

Learning objective: Operate a realistic mock-up of the Privacy & Compliance UI, locating each of the four fields this section explains — Policy Profile Preset, Data Subject Request, Consent Status, and Aggregation Threshold — within a plausible screen layout rather than a bulleted description.

Canvas layout: A mock admin-screen rendered as a bordered browser-window frame with a left navigation rail showing "Districts > Riverbend Unified > Privacy & Compliance" as breadcrumb, and a main panel divided into four labeled cards: "Policy Profile," "Data Subject Request," "Consent Status," and "Aggregation Threshold."

Visual elements: The "Policy Profile" card shows three radio options ("FERPA," "COPPA," "GDPR") with "COPPA" selected. The "Data Subject Request" card shows a search field ("Search by roster identity...") and three buttons, "Access," "Rectify," "Erase," with "Erase" outlined in warning red to signal irreversibility. The "Consent Status" card shows three example students with status chips reading "Granted" (green), "Pending" (amber), and "Withdrawn" (gray). The "Aggregation Threshold" card shows a slider reading "Minimum group size: 10" with a caption "Groups smaller than this are suppressed on every report."

Interactive controls: Clicking a Policy Profile radio option updates the Aggregation Threshold slider and a small "Retention" readout elsewhere on the mock screen to that preset's typical value, demonstrating that a preset configures multiple fields at once. Clicking "Erase" on the Data Subject Request card opens a confirmation dialog reading "This will permanently remove this student's identity mapping. De-identified aggregates will be preserved. This cannot be undone." with "Confirm" and "Cancel" buttons. Clicking a Consent Status chip cycles it through Granted, Pending, and Withdrawn, and clicking "Withdrawn" updates a caption reading "This student is now excluded from non-essential processing."

Default state: COPPA preset selected; Aggregation Threshold at 10; three example students with mixed consent statuses; no dialog open.

Implementation notes: Use p5.js `createButton()` for Access, Rectify, and Erase, `createSlider()` for the Aggregation Threshold, and a custom radio-button group drawn with `ellipse()` and mouse-press detection for the Policy Profile Preset selector, per this project's convention of using p5.js's built-in controls wherever a native equivalent exists.

Responsive design: The four-card grid collapses from a 2x2 layout to a single stacked column on narrow viewports; the confirmation dialog becomes a full-width overlay below 600px width.
```

## Related Resources

- [Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md)
