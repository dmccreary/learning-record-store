---
title: District Tenancy Hierarchy Explorer
description: Identify the nested tenancy hierarchy a District Administrator operates within — District, School, Course, Section, Enrollment — and distinguish the hard isolation boundary at the district level from the soft, role-scoped boundaries below it.
status: implemented
library: vis-network
bloom_level: Understand (L2)
---

# District Tenancy Hierarchy Explorer



<iframe src="main.html" width="100%" height="622"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md).

```text
Type: graph-model
**sim-id:** district-tenancy-hierarchy-explorer<br/>
**Library:** vis-network<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/search-microsims/tree/main/docs/sims/subject-taxonomy-explorer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Identify the nested tenancy hierarchy a District Administrator operates within — District, School, Course, Section, Enrollment — and distinguish the hard isolation boundary at the district level from the soft, role-scoped boundaries below it.

Purpose: A vis-network hierarchical graph rooted at one District node, branching down through School, Course, Section, to Enrollment, with a separate branch showing a Textbook Version deployed onto a Section.

Nodes: One root "District" node. Two child "School" nodes. Each School has two child "Course" nodes. Each Course has two child "Section" nodes. Each Section has three child "Enrollment" nodes (representing students) and one dashed edge labeled "DEPLOYS" to a shared "Textbook Version" node drawn off to the side.

Interactive features: Clicking the District node opens an infobox stating the hard isolation guarantee — no cross-district query without explicit, de-identified system-admin benchmarking. Clicking any School, Course, or Section node opens an infobox naming that node's key properties from the graph data model (school_id/name/grade_band; course_id/title/subject; section_id/period/term/academic_year) and noting the boundary here is soft, enforced by role scope. Clicking an Enrollment node opens an infobox defining enrollment as the student-to-section relationship. Clicking the Textbook Version node or the DEPLOYS edge opens an infobox previewing the Textbook Deployment UI section later in this chapter.

Color coding: The District node in a saturated teal to mark the hard boundary; School, Course, Section, and Enrollment nodes in graduated lighter shades of the same hue to show they nest inside it; the Textbook Version node and DEPLOYS edge in amber to visually separate "who a student is" from "what content they see."

Responsive design: Hierarchical layout re-centers on window resize using vis-network's built-in layout engine; on narrow viewports the tree renders top-to-bottom rather than left-to-right and remains pannable.
```

## Related Resources

- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md)
