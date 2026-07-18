---
title: This Project's Tenancy Hierarchy
description: Let the learner identify each level of this project's Tenancy Hierarchy, in order, and describe in one sentence what each level represents and which entities live directly beneath it.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# This Project's Tenancy Hierarchy



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md).

```text
Type: graph-model
**sim-id:** tenancy-hierarchy-tree<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/data-science-course/tree/main/docs/sims/data-structure-hierarchy<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Let the learner identify each level of this project's Tenancy Hierarchy, in order, and describe in one sentence what each level represents and which entities live directly beneath it.

Purpose: Render the roster side of the Tenancy Hierarchy from spec §3.1 as a single top-to-bottom Mermaid flowchart, one node per level plus a node representing the Enrollment link between Section and Student.

Nodes, top to bottom:

- "District — the Tenant (hard isolation boundary)"
- "School"
- "Course"
- "Section (a class period / cohort)"
- "Enrollment (Student ↔ Section)" — drawn as a diamond/rhombus node to visually distinguish a relationship from an entity
- "Student (pseudonymous)"

Edges: District to School labeled "HAS_SCHOOL"; School to Course labeled "OFFERS"; Course to Section labeled "HAS_SECTION"; Section to Enrollment and Enrollment to Student both labeled "ENROLLED_IN", showing Enrollment as the connective relationship rather than a strict tree node.

Interactive features: Every node has a Mermaid `click` directive. Clicking "District" opens an infobox defining Tenant and District together, and naming the hard isolation guarantee. Clicking "School," "Course," or "Section" opens an infobox with that level's one-sentence definition and its key graph properties (e.g., Section: `section_id`, `period`, `term`, `academic_year`). Clicking "Enrollment" opens an infobox explaining that it is a relationship, not a level, carrying `enrolled_at` and `status`. Clicking "Student" opens an infobox noting that the Student node is pseudonymous and holds no PII, previewing the identity section later in this chapter.

Color coding: A single top-to-bottom gradient in the book's teal accent color, darkest at District and lightest at Student, echoing the gradient convention established in Chapter 5's System Context Diagram.

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../../chapters/06-multi-tenancy-rosters-identity/index.md)
