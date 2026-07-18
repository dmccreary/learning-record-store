---
title: Two Kinds of Identity in This Learning Record Store
description: Let the learner distinguish the Chapter 6 pseudonymization identity service from Keycloak's human single-sign-on role, so the two systems that both use the word "identity" are never conflated.
status: implemented
library: vis-network
bloom_level: Understand (L2)
---

# Two Kinds of Identity in This Learning Record Store



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md).

```text
Type: infographic
**sim-id:** two-kinds-of-identity<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: distinguish, contrast

Learning objective: Let the learner distinguish the Chapter 6 pseudonymization identity service from Keycloak's human single-sign-on role, so the two systems that both use the word "identity" are never conflated.

Purpose: Show a two-branch vis-network graph contrasting "Learner Identity (Chapter 6)" against "Human Identity (this chapter)" side by side.

Nodes: Root splits into two branches. Branch 1, "Learner Identity": "Raw actor in an xAPI statement" leads to "identity service — per-district HMAC salt" leads to "student_key (pseudonymous)" leads to "Used by: Stream Processor, analytics stores. Never a login.". Branch 2, "Human Identity": "District admin / teacher / author logs in" leads to "Keycloak (dev) / customer identity provider (prod) — OpenID Connect" leads to "Signed token carrying a role" leads to "Used by: Admin API, Analytics API, Dash dashboards. Enforces RBAC.".

Interactive features: Clicking any node opens an infobox with that node's one-sentence role. Clicking either branch's header opens an infobox contrasting it directly against the other branch, quoting this chapter's "keep the two apart" framing. A toggle labeled "Show what a breach would expose" annotates each branch's leaf node with the consequence of that specific system being compromised, reinforcing why the separation matters for privacy.

Color coding: Learner Identity branch in the book's teal accent color, matching Chapter 6's existing identity-service diagrams; Human Identity branch in a distinct violet, signaling this is a different system entirely.

Responsive design: Branches stack vertically on narrow viewports; vis-network physics layout recalculates on window resize.
```

## Related Resources

- [Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md)
