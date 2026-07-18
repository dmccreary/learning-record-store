---
title: From Student Information System to Enrollment
description: Let the learner trace how roster data travels from a district's Student Information System, through the OneRoster standard and the Roster API, into School, Course, Section, and Enrollment structure inside this LRS.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# From Student Information System to Enrollment



<iframe src="main.html" width="100%" height="422"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md).

```text
Type: workflow
**sim-id:** roster-ingestion-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, demonstrate

Learning objective: Let the learner trace how roster data travels from a district's Student Information System, through the OneRoster standard and the Roster API, into School, Course, Section, and Enrollment structure inside this LRS.

Purpose: Show a five-step, left-to-right Mermaid flowchart tracing one roster sync from the district's system of record to materialized Tenancy Hierarchy structure, with a branch showing the dry-run safety check.

Steps:

1. "District's Student Information System holds the official enrollment records" — the authoritative source, entirely outside this LRS
2. "District admin configures a roster source" — a OneRoster REST or CSV endpoint, or another SIS connector, with credentials stored in a secret manager
3. "Roster sync runs on a schedule" — data is exported in OneRoster format
4. "Roster API ingests the sync" — the inbound member of the Analytics Plane's five APIs
5. "School, Course, Section, and Enrollment nodes are created or updated in the Tenancy Hierarchy"

Branch: from step 3, a dashed arrow to a side node "Dry-run diff preview" leading to "District admin reviews added/removed enrollments before the sync is applied — nothing is overwritten silently."

Interactive features: Every node has a Mermaid `click` directive. Clicking step 1 opens an infobox defining Student Information System and stating that the LRS never becomes the authoritative source of student identity. Clicking step 3 opens an infobox defining OneRoster as a 1EdTech data-interchange standard (CSV or REST). Clicking step 4 opens an infobox connecting back to the Roster API's role from Chapter 5. Clicking step 5 opens an infobox listing which Tenancy Hierarchy levels get created or refreshed. Clicking the dry-run branch node opens an infobox explaining the diff-preview safety check.

Color coding: Steps 1-2 (district-owned systems) in a neutral gray to signal "outside this LRS"; steps 3-5 (this LRS's own ingestion path) in the book's teal accent color, consistent with the gradient used in this chapter's other diagrams.

Implementation: Mermaid flowchart, left-to-right orientation, one dashed branch node, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md)
