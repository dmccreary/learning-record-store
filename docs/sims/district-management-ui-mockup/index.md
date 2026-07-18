---
title: District Management UI Mock Dashboard
description: Operate a realistic mock-up of the District Management UI, locating each of the four fields this section explains — Roster Source Configuration, Data Residency Policy, Retention Policy, and Legal Hold Toggle — within a plausible screen layout rather than a bulleted description.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# District Management UI Mock Dashboard



<iframe src="main.html" width="100%" height="502"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md).

```text
Type: infographic
**sim-id:** district-management-ui-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, demonstrate

Learning objective: Operate a realistic mock-up of the District Management UI, locating each of the four fields this section explains — Roster Source Configuration, Data Residency Policy, Retention Policy, and Legal Hold Toggle — within a plausible screen layout rather than a bulleted description.

Canvas layout: A mock admin-screen rendered as a bordered browser-window frame with a left navigation rail (showing "Districts > Riverbend Unified" as breadcrumb) and a main panel divided into four labeled cards: "Roster Source," "Data Residency," "Retention Policy," and "Legal Hold."

Visual elements: The "Roster Source" card shows a masked credential field ("SIS Connector Key: ••••••••••42a1"), a sync-schedule dropdown reading "Nightly, 02:00 local," and a "Last sync: Success, 6 hours ago" status chip in green. A "Preview Roster Diff" button sits below it. The "Data Residency" card shows a region selector reading "US-East" with a note "district data stored and processed in-region." The "Retention Policy" card shows a slider reading "Retention window: 5 years" and a "Next purge: 2027-01-15" readout. The "Legal Hold" card shows a toggle switch, currently off, with the label "No active holds" in gray; clicking it flips the toggle to "1 record set on hold" in amber.

Interactive controls: A p5.js button labeled "Preview Roster Diff" opens a slide-out panel listing three mock diff rows (two additions in green, one removal in red) with an "Approve" and "Discard" button, directly demonstrating the four-step dry-run sequence from this chapter's prose. Clicking the Legal Hold toggle demonstrates that flipping it does not alter the Retention Policy card's numbers, reinforcing that a legal hold suspends rather than replaces the retention schedule. Hovering any card header shows a tooltip with that field's one-sentence definition from this chapter's prose.

Default state: All four cards collapsed to their summary view; Legal Hold off; no diff panel open.

Behavior: Clicking "Preview Roster Diff" expands the diff panel with a smooth slide-in transition; clicking "Approve" updates the "Last sync" chip to "Success, just now"; clicking "Discard" closes the panel with no change to sync status.

Implementation notes: Use p5.js `createButton()` for "Preview Roster Diff," "Approve," and "Discard," and a custom toggle drawn with `rect()` and mouse-press detection for Legal Hold, per this project's convention of using p5.js's built-in controls wherever a native equivalent exists.

Responsive design: The four-card grid collapses from a 2x2 layout to a single stacked column on narrow viewports; the diff slide-out panel becomes a full-width overlay instead of a side panel below 600px width.
```

## Related Resources

- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md)
