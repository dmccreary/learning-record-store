---
title: The Nine Admin UIs at a Glance
description: Identify each of the nine admin UIs, its one-line purpose, and which of the six roles from this chapter can open it, as a quick-reference survey before Chapters 25 through 27 cover several of them in depth.
status: implemented
library: p5.js
bloom_level: Remember (L1)
---

# The Nine Admin UIs at a Glance



<iframe src="main.html" width="100%" height="502"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md).

```text
Type: infographic
**sim-id:** nine-admin-uis-survey<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/xapi-data-flow<br/>

Bloom Taxonomy: Remember (L1)
Bloom Taxonomy Verb: identify, recall

Learning objective: Identify each of the nine admin UIs, its one-line purpose, and which of the six roles from this chapter can open it, as a quick-reference survey before Chapters 25 through 27 cover several of them in depth.

Canvas layout: A 3x3 grid of nine tiles, one per admin UI, each labeled with its short name (District Management, School Course Section, Textbook Deployment, xAPI Credentials, Experiment Administration, User Access Management, Privacy Compliance, Audit Monitoring, System Configuration).

Visual elements: Each tile shows the UI's short name in bold and a small icon suggesting its function (a building for District Management, a roster grid for School Course Section, a package for Textbook Deployment, a key for xAPI Credentials, a flask for Experiment Administration, a badge for User Access Management, a shield for Privacy Compliance, a magnifying glass for Audit Monitoring, a set of dials for System Configuration). Tiles are colored by which chapter covers them in depth: three tiles destined for Chapter 25 in one hue, two for Chapter 26 in a second hue, one for Chapter 27 in a third hue, and the remaining three (xAPI Credentials, Experiment Administration, Audit Monitoring) in a neutral hue since they are introduced here but revisited more briefly elsewhere in the book.

Interactive controls: Clicking any tile expands it into a detail panel showing the UI's full one- or two-sentence description from this chapter's prose, plus a chip for each role permitted to use it (matching the roles-to-UIs table above). A "Filter by role" dropdown (p5.js `createSelect()`) lets the reader choose one of the six roles and dims every tile that role cannot access, leaving only that role's accessible UIs at full opacity — a direct, exploratory version of reading one column of the table above.

Default state: All nine tiles shown at full opacity, no role filter applied, no tile expanded.

Behavior: Selecting a role from the dropdown dims inaccessible tiles to 30% opacity with a smooth 300ms transition; selecting "All roles" (the default option) restores full opacity to every tile. Clicking an expanded tile a second time collapses it back to its compact form.

Implementation notes: Use p5.js `createSelect()` for the role-filter control, per this project's convention of always using p5.js's built-in controls rather than hand-drawn UI. Store the nine UI-to-roles mappings as a simple array of objects so the filter logic is a single lookup rather than nine hardcoded conditionals.

Responsive design: Grid collapses from 3x3 to a single scrollable column of nine tiles on narrow viewports; the role-filter dropdown remains pinned above the grid at every width.
```

## Related Resources

- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md)
