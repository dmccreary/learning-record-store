---
title: Role Assignment Scope Explorer
description: Distinguish a role (a fixed set of capabilities) from a scope (the specific district, school, or section that role applies to for one account), and see how two accounts sharing a role can still be authorized for different data.
status: scaffold
library: vis-network
bloom_level: Understand (L2)
---

# Role Assignment Scope Explorer



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md).

```text
Type: graph-model
**sim-id:** role-assignment-scope-explorer<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: distinguish, classify

Learning objective: Distinguish a role (a fixed set of capabilities) from a scope (the specific district, school, or section that role applies to for one account), and see how two accounts sharing a role can still be authorized for different data.

Purpose: A vis-network graph showing five example User accounts, each connected to one role node and one scope node, so a learner can trace that the role stays constant while the scope varies.

Nodes: Five "User Account" nodes (Ada, Ben, Chi, Dev, Eli). Three "Role" nodes: "District Administrator," "School Administrator," "Instructor." Five "Scope" nodes from Chapter 25's tenancy hierarchy: "Riverbend Unified (District)," "Lincoln Middle School," "Cedar Heights Middle School," "Section: Biology 101, Period 3," "Section: Algebra I, Period 5."

Edges: Ada -> District Administrator -> Riverbend Unified. Ben -> School Administrator -> Lincoln Middle School. Eli -> School Administrator -> Cedar Heights Middle School (same role as Ben, different scope). Chi -> Instructor -> Section: Biology 101, Period 3. Dev -> Instructor -> Section: Algebra I, Period 5.

Interactive features: Clicking any User Account node opens an infobox reading "This account's role is [role] and its scope is [scope]." Clicking a Role node opens an infobox with that role's fixed capability description, matching Chapter 24's role table. Clicking a Scope node opens an infobox naming that scope's place in the tenancy hierarchy and, for the two School Administrator scope nodes, a note explicitly stating "same role, different scope — Ben cannot see Cedar Heights, and Eli cannot see Lincoln Middle School."

Color coding: User Account nodes in cream, Role nodes in the book's teal accent color, Scope nodes in amber, so a learner can visually separate "who," "what they can do," and "where they can do it" at a glance.

Responsive design: Force-directed layout re-stabilizes on window resize; on narrow viewports the graph switches to a vertically stacked layout with pan-and-zoom enabled so all thirteen nodes remain reachable.
```

## Related Resources

- [Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md)
