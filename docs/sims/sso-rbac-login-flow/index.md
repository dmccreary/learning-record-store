---
title: From Login to RBAC-Checked Action
description: Let the learner trace a single login from browser to RBAC-checked action across four lanes, distinguishing the identity-proving job (SSO via SAML or OIDC) from the authorization-granting job (RBAC).
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# From Login to RBAC-Checked Action



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md).

```text
Type: workflow
**sim-id:** sso-rbac-login-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/cybersecurity/tree/main/docs/sims/iam-request-flow<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Let the learner trace a single login from browser to RBAC-checked action across four lanes, distinguishing the identity-proving job (SSO via SAML or OIDC) from the authorization-granting job (RBAC).

Purpose: A four-lane Mermaid sequence diagram — User, Browser, Identity Provider, and this LRS's Admin API — showing a District Admin logging in and then requesting a report.

Steps:

1. User opens the District Overview Dashboard URL in the Browser.
2. Browser redirects to the district's Identity Provider (labeled "SAML or OIDC, district's choice").
3. User authenticates once against the Identity Provider (their existing school credentials).
4. Identity Provider returns a signed assertion/token to the Browser.
5. Browser presents that token to the Admin API.
6. Admin API validates the token, resolves the user's Role (District Admin), and checks RBAC before returning the requested report data.

Interactive features: Every lane header and every numbered step is clickable via a Mermaid `click` directive. Clicking a lane header opens an infobox naming that lane's responsibility. Clicking step 2 or 4 opens an infobox distinguishing SAML's XML assertion from OIDC's JSON token. Clicking step 6 opens an infobox stating RBAC is enforced at the API layer, never only in the UI.

Color coding: Identity-proving steps (2-4) in blue; authorization-checking step (6) in the book's teal accent color.

Implementation: Mermaid sequence diagram with full click-to-infobox coverage, adapted from the referenced template's four-lane federated-login structure. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../../chapters/27-compliance-and-district-reporting/index.md)
