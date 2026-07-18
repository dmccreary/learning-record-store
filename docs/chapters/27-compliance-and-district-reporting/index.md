---
title: Compliance, Privacy Law, and District-Level Reporting
description: How FERPA, COPPA, and GDPR shape a district's privacy and retention policy, how RBAC, SSO, SAML, and OIDC prove that only the right people acted on it, and the eight reports and two dashboards a district administrator reads to judge a rollout's health.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 16:50:55
version: 0.09
---

# Compliance, Privacy Law, and District-Level Reporting

## Summary

This chapter covers the compliance obligations a district administrator manages — FERPA, COPPA, and GDPR, enforced through RBAC and SSO — and all eight district-level reports, from the adoption dashboard to the privacy and access audit log.

## Concepts Covered

This chapter covers the following 19 concepts from the learning graph:

1. FERPA Compliance
2. COPPA Compliance
3. GDPR Compliance
4. Right To Erasure
5. Role-Based Access Control
6. Single Sign-On
7. SAML Protocol
8. OIDC Protocol
9. District Adoption Dashboard
10. School Comparison Report
11. Course Rollup Report
12. Deployment Inventory Report
13. Data Quality Monitor
14. Ingestion Health Report
15. License Seat Utilization
16. Privacy Access Audit
17. District Overview Dashboard
18. System Health Dashboard
19. District Rollout Plan

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 19: Failure Modes and Verification](../19-failure-modes-and-verification/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)
- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../25-district-admin-rosters-deployments/index.md)
- [Chapter 26: District Administrator: Access Control and System Configuration](../26-district-admin-access-control/index.md)

---

!!! mascot-welcome "The Paperwork Behind the Rollout"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapters 25 and 26 gave a district administrator the tools to onboard rosters, deploy textbooks, and configure access. This chapter answers a harder question: how does that same administrator *prove*, to a school board, a parent, or an auditor, that the rollout respects the law? Let's follow the record.

Every district that adopts this project's Learning Record Store is bound by student-privacy law before it writes a single Statement. That law does not care how elegant the pseudonymization pipeline from [Chapter 6](../06-multi-tenancy-rosters-identity/index.md) is, or how carefully the privacy filter from [Chapter 15](../15-privacy-and-dashboard-mechanics/index.md) enforces its threshold — it asks a narrower, more exacting question: can the district *demonstrate*, on request, exactly who was allowed to see a given student's data, and exactly how that student's data can be permanently removed? This chapter covers three privacy laws a district administrator must satisfy, the identity mechanisms that make satisfying them auditable rather than aspirational, and the eight reports plus two dashboards that turn all of it into something a human being can actually read.

## Three Laws, One District

The United States' **Family Educational Rights and Privacy Act**, almost always spoken of by its acronym **FERPA**, is the primary federal law governing student education records. FERPA gives parents (and eligible students themselves, once they turn 18) the right to inspect their education records and requires a school to have a legitimate educational interest before sharing those records with a third party — including, in this project's case, a Learning Record Provider or an intelligent-textbook vendor. A district that adopts this LRS is the FERPA-covered entity; every downstream contract with a textbook author ultimately answers to the district's FERPA obligations, not the other way around. Practically, this means the district — not the textbook vendor, not this LRS's operator — is the party who signs the data-sharing agreement, and the district's FERPA officer is who a parent's records request actually reaches.

The **Children's Online Privacy Protection Act**, or **COPPA**, applies specifically to children under 13 and adds a requirement FERPA does not: **verifiable parental consent** before a service collects personal information from a child that young. Because this project's target audience spans K-12 — and a meaningful share of students in an elementary or middle school are under 13 — a district's COPPA obligations determine which students can be included in non-essential processing (analytics that go beyond the learning experience itself) until consent is on file. A student without recorded consent is not blocked from using the textbook; they are simply excluded from anything beyond the core learning experience — a content-effectiveness study, for example, or a cross-district benchmark — until that consent status changes.

The **General Data Protection Regulation**, or **GDPR**, is the European Union's data-protection law. Most districts using this LRS operate entirely within the United States and are not directly subject to GDPR, but GDPR matters here for a specific reason: it is the law that popularized — and gave a precise, portable name to — a right that FERPA and COPPA both imply without spelling out as cleanly: the right to have your data deleted. A district that later expands to serve students in the EU, or one that simply wants to hold itself to the stricter of the three standards, adopts the GDPR policy profile instead of relaxing to whichever law technically applies to the smallest number of its students.

!!! mascot-thinking "Three Laws, One Shared Demand"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice what FERPA, COPPA, and GDPR have in common even though they come from different governments and cover different populations: each one, in its own words, insists that someone can ask "delete what you have on me" and receive a real answer. This project's specification does not implement three separate compliance systems — it implements **one mechanism**, described next, and lets a district choose the *policy profile* (FERPA, COPPA, or GDPR) that decides when that mechanism must fire.

## The Right to Erasure, Mechanically

The **Right To Erasure** is the specific, implementable guarantee behind all three laws' delete-on-request language: a student's data can be permanently and verifiably removed from this Learning Record Store. Chapter 6 already showed half of this mechanism without naming it — every real student identity is replaced at ingestion by a pseudonym derived through an HMAC keyed to a per-district secret, so that no downstream component ever sees a real name. The Right to Erasure is what happens when a district actually invokes that design:

1. **Void.** Every Statement belonging to the student is voided using the mechanism from [Chapter 2](../02-anatomy-of-xapi-statement/index.md) — a new Statement that marks the original as no longer authoritative, without silently rewriting history.
2. **Purge.** The underlying rows for that student's Statements and any per-student summary vertices are physically deleted from the event store and the graph, not merely hidden from queries.
3. **Pseudonym-mapping deletion.** The per-district secret used to derive that specific student's pseudonym key is discarded from the identity service so the pseudonym can never again be traced back to the real student — this is the step that makes the erasure *irreversible*, not just inconvenient to reverse.

What survives erasure is only what the law requires to survive: **de-identified aggregates** — a school's overall completion rate, a course's mastery distribution — that never singled the student out to begin with and cannot be re-attributed to them after the fact.

A Right to Erasure request rarely originates inside this LRS at all — it starts with a parent, or an eligible student, contacting the district directly, and the district administrator relaying that request through the Privacy & Compliance UI referenced in [Chapter 26](../26-district-admin-access-control/index.md). The three-step mechanism above is what that UI executes once the district confirms the request is legitimate; the district, not this LRS, is responsible for verifying the requester's identity before triggering an irreversible action.

## Proving It Was the Right Person: RBAC, SSO, SAML, and OIDC

Erasure and access control both answer the same underlying question — *who is allowed to touch this student's data* — from opposite directions. Erasure controls what happens to the data; the mechanisms in this section control who can ask for anything about it in the first place.

**Role-Based Access Control**, or **RBAC**, is the rule, introduced operationally in [Chapter 26](../26-district-admin-access-control/index.md), that every action against this LRS is evaluated against the acting user's assigned role — System Admin, District Admin, School Admin, Instructor, Author, or Auditor — rather than against ad-hoc permission checks scattered through the code. What this chapter adds is the compliance angle: RBAC is what makes a district's answer to "who could have seen this student's record" a *provable* one rather than a best guess, because the role that could have granted access is a first-class, queryable fact, not a matter of trusting whoever wrote a particular screen.

Before an RBAC role can be checked, the system has to know who is asking — and this LRS delegates that question to a **Single Sign-On**, or **SSO**, identity provider rather than maintaining its own password database. With SSO, a district administrator, teacher, or author authenticates once against an identity system the district already trusts — often the same one used for school email — and that single authentication is honored across every admin screen and analytics dashboard in this project.

SSO is implemented using one of two federated-identity protocols. The **SAML Protocol** (Security Assertion Markup Language) is the older, XML-based standard many school districts' existing identity providers already speak. The **OIDC Protocol** (OpenID Connect), a newer, JSON-based standard built on top of OAuth 2.0, is the one this project's own development stack uses by default. Both protocols solve the identical problem — letting an Identity Provider vouch for a user to this LRS without the LRS ever handling that user's password directly — and a production deployment picks whichever one the district's existing identity provider already supports.

The diagram below traces one login from a district administrator's browser through to an RBAC-checked action, showing exactly where SAML or OIDC does its work and where RBAC takes over.

#### Diagram: From Login to RBAC-Checked Action

<iframe src="../../sims/sso-rbac-login-flow/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Login to RBAC-Checked Action</summary>
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
</details>

!!! mascot-tip "SSO Answers 'Who,' RBAC Answers 'What'"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you only remember one distinction from this section, make it this one: SSO (via SAML or OIDC) proves *identity* — it answers "is this really the district administrator it claims to be?" RBAC answers a completely different question — "even granting that this is really the district administrator, is a District Admin allowed to do *this specific thing*?" A system can get the first answer right and still fail badly on the second.

## The Eight District-Level Reports

With compliance and access settled, a district administrator's daily work is mostly reading reports. This project's specification defines eight district- and system-facing reports, each tied to a specific audience and visualization style.

Before the table, a bridging note on scaffolding: three of these reports — Deployment Inventory, Data Quality Monitor, and Ingestion Health — reuse vocabulary from earlier chapters. Deployment Inventory reports on **TextbookVersion**, the deployment-tracking entity from [Chapter 25](../25-district-admin-rosters-deployments/index.md); Data Quality Monitor and Ingestion Health report on the dead-letter volume, reconciliation backlog, and processing lag first introduced in [Chapter 19](../19-failure-modes-and-verification/index.md)'s discussion of failure modes. This chapter does not redefine those terms — it shows where they surface as a report a human reads.

| Report | Audience | Visualization | What It Answers |
|---|---|---|---|
| **District Adoption Dashboard** | District | KPI tiles + trend lines | How many active textbooks and students, and how many Statements arrive per day? |
| **School Comparison Report** | School | Grouped bar chart | How does engagement and mastery compare across schools in the district? |
| **Course Rollup Report** | Course | Tree map | Where is student activity concentrated across courses? |
| **Deployment Inventory Report** | TextbookVersion | Table | Which textbook version is live in which school, and is it provisional or reconciled? |
| **Data Quality Monitor** | System | Status board | How large is the dead-letter volume, reconciliation backlog, and unknown-verb rate right now? |
| **Ingestion Health Report** | System | Time series | What is the current Statements-per-second rate, queue depth, and processing lag? |
| **License Seat Utilization** | District | Gauge + trend | How many licensed seats are actually active, and is the district near its cap? |
| **Privacy Access Audit** | System | Audit log table | Who queried which student's PII, and when? |

Reading this table left to right shows a deliberate progression: the first three reports (District Adoption, School Comparison, Course Rollup) answer "how is learning going," the middle two (Deployment Inventory, Data Quality Monitor) answer "is the pipeline itself healthy," and the last two (License Seat Utilization, Privacy Access Audit) answer questions that are really about contracts and law rather than pedagogy. A single dashboard rarely needs all eight at once — which is exactly the problem the two bundled dashboards later in this chapter solve.

Two of these reports deserve a closer look because of the compliance role they play specifically. **License Seat Utilization** is not just a budgeting tool — an over-utilized license is itself a contract-compliance question a district administrator has to answer before an auditor asks it. **Privacy Access Audit** is the report that makes RBAC's promise concrete: it is the literal, queryable answer to "who looked at this student's data, and when," pulled directly from the immutable admin-action audit log every privileged action writes to.

The following diagram lets a learner explore the Privacy Access Audit report the way an auditor actually would — by clicking a suspicious-looking row and following it back to the role that authorized it.

#### Diagram: Privacy Access Audit Explorer

<iframe src="../../sims/privacy-access-audit-explorer/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Privacy Access Audit Explorer</summary>
Type: infographic
**sim-id:** privacy-access-audit-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: examine, distinguish

Learning objective: Let the learner analyze a sample Privacy Access Audit table by clicking a row to reveal the actor's role, the RBAC rule that granted the access, and whether the access was routine or elevated (e.g., a data-subject erasure request).

Layout: A table of 6 sample audit rows (Actor, Action, Target Student Pseudonym, Timestamp, Role, Routine/Elevated tag) above a details panel that starts empty.

Data Visibility Requirements:
Stage 1: Show the 6-row table with an "Elevated" row highlighted in amber (e.g., a District Admin viewing PII during a data-subject erasure request) among 5 "Routine" rows (e.g., an Instructor viewing their own section's mastery report).
Stage 2: On row click, populate the details panel with that row's Role, the specific RBAC permission that authorized the action, and one sentence distinguishing routine analytics access from elevated PII access.

Interactive features: Every row is clickable; the details panel updates without navigating away from the table. A toggle filters the table to "Elevated only."

Instructional Rationale: An Analyze-level objective calls for the learner to distinguish categories of access rather than just view a static log — the routine/elevated filter and per-row role attribution make the distinction something the learner exercises, not just reads.

Implementation: p5.js canvas with a clickable table and a side detail panel, responsive width tracking the containing element.
</details>

## Two Dashboards, Eight Reports

A district administrator rarely opens a report in isolation — this project's specification bundles the eight reports above into two dashboards, each aimed at a different half of the job. The **District Overview Dashboard** bundles the District Adoption Dashboard, School Comparison Report, Course Rollup Report, and License Seat Utilization report — everything a District Admin needs to judge the *business and academic* health of a rollout. The **System Health Dashboard** bundles the Data Quality Monitor, Ingestion Health Report, and Privacy Access Audit — everything a System Admin needs to judge the *technical and compliance* health of the same rollout.

That split matters pedagogically: it is the same statement log from [Chapter 8](../08-summary-vertices-ingestion/index.md) and [Chapter 9](../09-twelve-core-lrs-functions/index.md), read through two different lenses for two different questions, exactly the way the course description frames every persona chapter in this book.

#### Diagram: District Overview vs. System Health — Two Lenses on One Log

<iframe src="../../sims/two-dashboards-one-log/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>District Overview vs. System Health — Two Lenses on One Log</summary>
Type: graph-model
**sim-id:** two-dashboards-one-log<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, contrast

Learning objective: Let the learner classify each of the eight reports under the dashboard it belongs to, and see that both dashboards read from the same underlying statement log rather than separate data sources.

Purpose: A central "Statement Log" node with two dashboard nodes branching from it (District Overview, System Health), each connected to its four (or three) constituent report nodes.

Nodes: Statement Log (center), District Overview Dashboard, System Health Dashboard, and the eight report nodes from the table above, each attached to its owning dashboard.

Interactive features: Hovering the Statement Log node highlights all eight report nodes at once, showing they share one source. Clicking a dashboard node highlights only its own reports and dims the other dashboard's. Clicking any report node opens an infobox with that report's one-line description from the table above.

Color coding: District Overview Dashboard and its reports in the book's teal accent color; System Health Dashboard and its reports in amber.

Implementation: vis-network force-directed graph with click/hover handlers, responsive width tracking the containing element. Zoom and pan enabled.
</details>

!!! mascot-warning "A Dashboard Is Not a Report Generator"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Don't read "District Overview Dashboard" as an eight-report catch-all — it deliberately excludes the Data Quality Monitor, Ingestion Health Report, and Privacy Access Audit, because those three are System Admin's job, not District Admin's. If a district administrator can't find the Privacy Access Audit on their own dashboard, that isn't a bug — it's the RBAC-driven separation of concerns from Chapter 26 showing up one more time, on purpose.

## From Reports to a Rollout Plan

Everything in this chapter — the three laws, the erasure mechanism, RBAC/SSO/SAML/OIDC, and the eight reports — exists to support one document a district administrator actually produces: a **District Rollout Plan**. A rollout plan is the sequenced, written commitment that ties together roster onboarding (Chapter 25), textbook deployment (Chapter 25), and privacy-policy configuration (this chapter) into an order that respects each step's real dependencies — you cannot configure a privacy policy profile meaningfully before a district has chosen which of FERPA, COPPA, or GDPR applies to its population, and you cannot deploy a textbook to students whose rosters have not yet been onboarded.

The following list sequences a rollout plan's three workstreams as one dependency chain — useful as a self-check before moving on:

1. Choose the district's policy profile (FERPA, COPPA, GDPR, or a combination) based on the student population's age and jurisdiction.
2. Onboard rosters via OneRoster or manual SIS import (Chapter 25), which establishes the pseudonymous student accounts everything downstream depends on.
3. Configure RBAC role assignments and confirm SSO/SAML/OIDC is wired to the district's identity provider (Chapter 26 and this chapter).
4. Deploy the chosen textbook version(s) to the now-onboarded schools and sections (Chapter 25).
5. Verify the District Overview and System Health dashboards both show healthy, expected data before declaring the rollout live.

!!! mascot-encourage "Nineteen Terms, One Signature Line"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    This chapter introduced three laws, four identity/access mechanisms, eight reports, and two dashboards — nineteen new terms in one sitting. You don't need to recite each report's visualization type from memory. You need to recognize that every one of them ultimately supports a single signature on a rollout plan: a district administrator's documented assurance that this system respects the law before a single student's Statement is recorded.

## Key Takeaways

- **FERPA Compliance** governs U.S. student education records generally; **COPPA Compliance** adds verifiable parental consent for children under 13; **GDPR Compliance** is the EU law that named the **Right To Erasure** most explicitly — all three share the demand that a student's data be deletable on request.
- The Right to Erasure is implemented mechanically as void, purge, and pseudonym-mapping deletion, preserving only de-identified aggregates.
- **Role-Based Access Control** decides *what* an authenticated user may do; **Single Sign-On** (via the **SAML Protocol** or **OIDC Protocol**) decides *who* that user is in the first place — two different questions, two different mechanisms.
- Eight reports — **District Adoption Dashboard**, **School Comparison Report**, **Course Rollup Report**, **Deployment Inventory Report**, **Data Quality Monitor**, **Ingestion Health Report**, **License Seat Utilization**, and **Privacy Access Audit** — cover a district's business, academic, technical, and compliance health.
- The **District Overview Dashboard** and **System Health Dashboard** bundle those eight reports into two audience-specific lenses on the same underlying statement log.
- A **District Rollout Plan** sequences policy-profile selection, roster onboarding, access configuration, and textbook deployment into one dependency-respecting commitment.

!!! mascot-celebration "You Can Now Sign Off on a Rollout"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    What does the evidence show? You now have every piece a district administrator needs to answer "is this rollout legal, auditable, and healthy" — in writing, with reports to back it up. In [Chapter 28](../28-teacher-dashboards-student-reports/index.md), the lens shifts from the district administrator to the teacher, and the same statement log starts answering a very different daily question: which student needs help today?
