---
title: Role Hierarchy and Scope
description: Differentiate the three nested administrative roles (System Administrator, District Administrator, School Administrator) from the three scope-bound roles (Teacher, Textbook Author, Auditor Role) by tracing each role's scope boundary in a single graph.
status: implemented
library: vis-network
bloom_level: Analyze (L4)
---

# Role Hierarchy and Scope



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md).

```text
Type: graph-model
**sim-id:** lrs-role-hierarchy-scope<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Differentiate the three nested administrative roles (System Administrator, District Administrator, School Administrator) from the three scope-bound roles (Teacher, Textbook Author, Auditor Role) by tracing each role's scope boundary in a single graph.

Purpose: A vis-network graph with two visually distinct clusters sharing one root, so the learner can see the nested-authority chain and the scope-bound roles as structurally different shapes rather than read them off a flat list.

Nodes: One root node "LRS Access Control." Three nested-authority nodes in a vertical chain below the root: "System Administrator" (global) -> "District Administrator" (one district) -> "School Administrator" (one school), each connected by a "contains" edge pointing from the broader role to the narrower one. Three scope-bound nodes attached directly to the root, drawn off to one side rather than in the vertical chain: "Teacher" (own sections only), "Textbook Author" (content and experiments, no student identity), "Auditor Role" (read-only, audit log only).

Interactive features: Clicking any role node opens an infobox with that role's scope and capabilities, matching the table above. Clicking a "contains" edge opens an infobox explaining that a broader role's authority is a superset — a District Administrator can do everything a School Administrator in their district can do, plus more, but the reverse never holds. Hovering any scope-bound node (Teacher, Textbook Author, Auditor Role) highlights that its edge to the root is a single, non-nested scope line, visually distinguishing it from the vertical chain.

Color coding: The nested-authority chain (System Administrator, District Administrator, School Administrator) shaded in graduated teal, darkest at System Administrator; the three scope-bound roles (Teacher, Textbook Author, Auditor Role) each in a distinct accent color to signal they are not ranked relative to one another.

Responsive design: Graph re-centers and node spacing adjusts on window resize using vis-network's built-in physics layout; on narrow viewports, the nested chain renders vertically and the scope-bound roles collapse into a horizontal row beneath it.
```

## Related Resources

- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../../chapters/24-three-personas-and-admin-uis/index.md)
