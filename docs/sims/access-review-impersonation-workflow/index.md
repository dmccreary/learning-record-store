---
title: Access Review and Impersonation Audit Workflow
description: Operate the Access Review Workflow as an administrator would, and differentiate its routine, scheduled nature from an Impersonation session's exceptional, heavily-audited one, even though both live on the same admin screen.
status: scaffold
library: Mermaid
bloom_level: Apply (L3)
---

# Access Review and Impersonation Audit Workflow



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md).

```text
Type: workflow
**sim-id:** access-review-impersonation-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, differentiate

Learning objective: Operate the Access Review Workflow as an administrator would, and differentiate its routine, scheduled nature from an Impersonation session's exceptional, heavily-audited one, even though both live on the same admin screen.

Purpose: A Mermaid flowchart with two parallel swimlanes sharing one starting node, so a learner can compare a routine process against an exceptional one side by side.

Swimlane A "Access Review (routine, scheduled)": "Review window opens" -> "Administrator sees every active account and scope in their territory" -> "Administrator confirms grant is still needed?" -- branches into "Yes: grant reconfirmed, review timestamp reset" and "No or no response: grant flagged as stale" -> "Administrator revokes or later reconfirms the stale grant."

Swimlane B "Impersonation (exceptional, heavily audited)": "System Administrator initiates impersonation for support" -> "Persistent banner displays 'Impersonating: [user]' on every screen" -> "Support action taken as impersonated user" -> "Action logged with impersonation marker" -> "Session ends; banner disappears."

Interactive features: Every node has a Mermaid `click` directive. Clicking any Swimlane A node opens an infobox matching this chapter's prose on stale-grant flagging. Clicking any Swimlane B node opens an infobox matching this chapter's prose on the persistent banner and full action logging. Clicking the shared starting node opens an infobox stating that both processes exist on the User & Access Management UI, and both write to the Audit Log Browser this chapter covers next.

Color coding: Swimlane A in the book's teal accent color to signal routine, low-stakes operation; Swimlane B in amber to signal an exceptional, closely-watched operation.

Responsive design: Swimlanes stack vertically on narrow viewports instead of running side by side, preserving the left-to-right sequence within each lane.
```

## Related Resources

- [Chapter 26: District Administrator: Access Control and System Configuration](../../chapters/26-district-admin-access-control/index.md)
