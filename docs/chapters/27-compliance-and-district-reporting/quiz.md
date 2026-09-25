---
title: "Quiz: Compliance, Privacy Law, and District-Level Reporting"
description: Review questions on FERPA, COPPA, and GDPR compliance, the Right to Erasure mechanism, RBAC and SSO identity/authorization, the eight district-level reports, and the two bundled dashboards.
social:
   cards: false
---
# Quiz: Compliance, Privacy Law, and District-Level Reporting

Test your understanding of this project's compliance obligations, identity and access mechanisms, and district-level reporting with these review questions.

---

#### 1. What does COPPA add to FERPA's baseline requirements?

<div class="upper-alpha" markdown>
1. A requirement for verifiable parental consent before collecting personal information from a child under 13
2. A right to erasure that FERPA does not provide in any form
3. A requirement that all data be stored exclusively within the European Union
4. A prohibition on any district ever sharing records with a textbook vendor
</div>

??? question "Show Answer"
    The correct answer is **A**. COPPA specifically adds a verifiable-parental-consent requirement for children under 13, a demand FERPA does not make. B overstates FERPA's gap — all three laws imply a deletion right, even if GDPR names it most explicitly. C confuses COPPA with GDPR's data-residency concerns. D contradicts the chapter's description of legitimate educational-interest sharing under FERPA.

    **Concept Tested:** COPPA Compliance

    **See:** [Three Laws, One District](index.md#three-laws-one-district)

---

#### 2. What are the three steps of the Right to Erasure mechanism, in order?

<div class="upper-alpha" markdown>
1. Encrypt, archive, and export
2. Suspend, notify, and reactivate
3. Backup, replicate, and compress
4. Void, purge, and pseudonym-mapping deletion
</div>

??? question "Show Answer"
    The correct answer is **D**. The mechanism voids the student's Statements, purges the underlying rows and summary vertices, and deletes the pseudonym mapping so the key can never again be traced back to the real student. A, B, and C each invent an unrelated sequence of operations the chapter never describes for erasure.

    **Concept Tested:** Right To Erasure

    **See:** [The Right to Erasure, Mechanically](index.md#the-right-to-erasure-mechanically)

---

#### 3. What is the key difference between what RBAC and SSO each answer?

<div class="upper-alpha" markdown>
1. RBAC and SSO are two names for the identical mechanism, implemented redundantly for safety
2. SSO decides what actions a user may take, while RBAC proves who the user is
3. SSO answers "is this really who they claim to be" (identity); RBAC answers "is this specific action allowed for that identity" (authorization) — two different questions
4. RBAC only applies to System Administrators, while SSO only applies to Teachers
</div>

??? question "Show Answer"
    The correct answer is **C**. SSO proves identity, while RBAC separately governs authorization for a specific action, and a system can get one right while still failing the other. A wrongly treats two distinct mechanisms as one. B reverses their actual roles. D invents a role restriction that neither mechanism actually has.

    **Concept Tested:** Role-Based Access Control / Single Sign-On

    **See:** [Proving It Was the Right Person: RBAC, SSO, SAML, and OIDC](index.md#proving-it-was-the-right-person-rbac-sso-saml-and-oidc)

---

#### 4. What do the SAML Protocol and the OIDC Protocol have in common, despite their technical differences?

<div class="upper-alpha" markdown>
1. Both are XML-based standards developed by the same standards body
2. Both let an Identity Provider vouch for a user to this LRS without the LRS ever handling that user's password directly
3. Both are used exclusively for encrypting statement payloads in transit
4. Both require this LRS to store a local copy of the user's password as a fallback
</div>

??? question "Show Answer"
    The correct answer is **B**. Both protocols solve the same problem — letting an Identity Provider vouch for a user without the LRS ever handling that user's password — even though one is XML-based and the other JSON-based. A is false; only SAML is XML-based. C confuses these identity protocols with an unrelated transport-security concern. D contradicts the whole point of federated identity, which is to avoid local password storage.

    **Concept Tested:** SAML Protocol / OIDC Protocol

    **See:** [Proving It Was the Right Person: RBAC, SSO, SAML, and OIDC](index.md#proving-it-was-the-right-person-rbac-sso-saml-and-oidc)

---

#### 5. A district administrator wants to know how many of the district's purchased licenses are actually being used, and whether the district is approaching its contractual cap. Which report answers this?

<div class="upper-alpha" markdown>
1. Data Quality Monitor
2. Course Rollup Report
3. Ingestion Health Report
4. License Seat Utilization
</div>

??? question "Show Answer"
    The correct answer is **D**. License Seat Utilization is specifically built to answer how many licensed seats are active and whether the district is near its cap, framed explicitly as a contract-compliance question. A monitors dead-letter volume and reconciliation backlog, an unrelated technical concern. B reports where student activity concentrates across courses. C reports statement throughput and queue depth, not licensing.

    **Concept Tested:** License Seat Utilization

    **See:** [The Eight District-Level Reports](index.md#the-eight-district-level-reports)

---

#### 6. An auditor asks a district to produce a record of exactly who queried a specific student's personally identifiable information and when. Which report is built to answer this directly?

<div class="upper-alpha" markdown>
1. School Comparison Report
2. Deployment Inventory Report
3. Privacy Access Audit
4. District Adoption Dashboard
</div>

??? question "Show Answer"
    The correct answer is **C**. The Privacy Access Audit report is the literal, queryable answer to who accessed which student's data and when, pulled directly from the immutable admin-action audit log. A compares engagement and mastery across schools, unrelated to access records. B tracks which textbook version is deployed where. D shows adoption KPI tiles, not access logs.

    **Concept Tested:** Privacy Access Audit

    **See:** [The Eight District-Level Reports](index.md#the-eight-district-level-reports)

---

#### 7. A System Administrator wants to check the current dead-letter volume, reconciliation backlog, and processing lag across the whole platform in one place. Which dashboard bundles the reports that answer this?

<div class="upper-alpha" markdown>
1. System Health Dashboard
2. District Overview Dashboard
3. District Rollout Plan
4. License Seat Utilization
</div>

??? question "Show Answer"
    The correct answer is **A**. The System Health Dashboard bundles exactly the Data Quality Monitor and Ingestion Health Report, which together cover dead-letter volume, reconciliation backlog, and processing lag. B bundles the business and academic reports instead, not technical health. C names a planning document, not a dashboard. D names one individual report, not a bundled dashboard.

    **Concept Tested:** System Health Dashboard

    **See:** [Two Dashboards, Eight Reports](index.md#two-dashboards-eight-reports)

---

#### 8. Why does this chapter emphasize that a Right to Erasure request typically originates outside the LRS, with the district responsible for verifying the requester's identity before triggering the mechanism?

<div class="upper-alpha" markdown>
1. Because the LRS automatically verifies every requester's identity through its own SSO system before any erasure request reaches a district administrator
2. Because erasure requests are always fraudulent unless filed directly with the LRS operator, not the district
3. Because the district has no actual role in the Right to Erasure process; only the LRS operator can approve it
4. Because the erasure mechanism itself is irreversible, and the LRS has no way to verify a requester's real-world identity on its own — the district, which already has that relationship, must confirm legitimacy before an unrecoverable action is triggered
</div>

??? question "Show Answer"
    The correct answer is **D**. Because erasure is irreversible and the LRS itself has no independent way to confirm a requester's real-world identity, the district — which already has that relationship — must verify legitimacy before the district administrator triggers the mechanism. A invents an automatic verification the chapter never describes. B and C both misstate the district's central, required role in this process.

    **Concept Tested:** Right To Erasure (verification responsibility)

    **See:** [The Right to Erasure, Mechanically](index.md#the-right-to-erasure-mechanically)

---

#### 9. Why does the District Rollout Plan sequence roster onboarding before textbook deployment, rather than allowing them to happen in either order?

<div class="upper-alpha" markdown>
1. Because textbook deployment is technically faster to complete and should always happen first for efficiency
2. Because textbook deployment binds a TextbookVersion to sections and students, which cannot happen meaningfully until the roster sync has established which students and sections actually exist
3. Because the specification requires alphabetical ordering of rollout steps
4. Because roster onboarding depends on a textbook already being deployed to generate section data
</div>

??? question "Show Answer"
    The correct answer is **B**. Deployment binds a textbook version to sections and students, which requires those sections and students to already exist from a completed roster sync — a genuine dependency, not an arbitrary ordering choice. A misstates the actual constraint as one of speed rather than dependency. C invents an alphabetical rule the chapter never states. D reverses the actual dependency direction.

    **Concept Tested:** District Rollout Plan (dependency ordering)

    **See:** [From Reports to a Rollout Plan](index.md#from-reports-to-a-rollout-plan)

---

#### 10. Why might a district that operates entirely within the United States still choose to adopt the GDPR policy profile rather than relying solely on FERPA and COPPA?

<div class="upper-alpha" markdown>
1. Because GDPR is legally mandatory for any district using cloud infrastructure, regardless of location
2. Because FERPA and COPPA do not actually address data deletion in any form, making GDPR legally required to fill the gap
3. Because adopting the stricter of the three standards is a deliberate choice some districts make to hold themselves to a higher bar, or in anticipation of later serving students in the EU, not because GDPR technically applies to them today
4. Because GDPR replaces the need for RBAC and SSO entirely
</div>

??? question "Show Answer"
    The correct answer is **C**. A US-only district can voluntarily adopt GDPR as a deliberate choice to hold itself to the stricter standard, or to prepare for future EU students, without GDPR being legally required for its current population. A is a fabricated legal requirement. B overstates FERPA and COPPA's actual gap — both imply a deletion right, even if less explicitly than GDPR. D confuses an unrelated privacy law with the separate RBAC/SSO access mechanisms.

    **Concept Tested:** GDPR Compliance

    **See:** [Three Laws, One District](index.md#three-laws-one-district)

---

#### 11. A district administrator proposes skipping the RBAC/SSO configuration step in the rollout plan, arguing that "since we trust all our staff, a shared login for the admin dashboard is simpler and just as safe." Evaluate this proposal against what this chapter establishes.

<div class="upper-alpha" markdown>
1. The proposal is reasonable, since RBAC and SSO exist only to prevent malicious insiders, and a trusted staff makes them unnecessary
2. The proposal undermines the district's ability to prove compliance: RBAC is what makes "who could have seen this student's record" a provable, queryable fact rather than a best guess, and a shared login destroys that traceability regardless of how trustworthy the staff actually are
3. The proposal is reasonable as long as the shared login password is changed monthly
4. The proposal has no bearing on compliance, since RBAC and SSO are purely technical conveniences unrelated to any legal requirement
</div>

??? question "Show Answer"
    The correct answer is **B**. RBAC's value is specifically that it makes access to a student's record a provable, queryable fact rather than a best guess — a shared login destroys that traceability entirely, independent of how trustworthy the actual staff are. A wrongly narrows RBAC's purpose to only stopping malicious actors, ignoring its role in provable compliance. C proposes a superficial mitigation that does not restore per-user traceability. D contradicts the chapter's explicit framing of RBAC as compliance-relevant, not merely a convenience.

    **Concept Tested:** Role-Based Access Control (evaluated)

    **See:** [Proving It Was the Right Person: RBAC, SSO, SAML, and OIDC](index.md#proving-it-was-the-right-person-rbac-sso-saml-and-oidc)

---

#### 12. A new multi-state district network wants to design a rollout plan for a population that includes some students under 13, some students turning 18 mid-year, and no current plans to serve EU students. Using this chapter's dependency-ordered rollout plan as a template, propose which policy profile(s) this district should select and where that choice fits in the sequence.

<div class="upper-alpha" markdown>
1. Select GDPR only, since it is the strictest standard and covers every other law's requirements automatically
2. Select a combination of FERPA (for general education records and eligible-student rights as students turn 18) and COPPA (for verifiable parental consent for students under 13), chosen as the very first step in the rollout plan before roster onboarding, since the correct policy profile depends on knowing the student population's age composition
3. Select no policy profile at all, since the district is not currently serving EU students
4. Select the policy profile only after textbook deployment is complete, since privacy policy has no bearing on which textbooks are assigned
</div>

??? question "Show Answer"
    The correct answer is **B**. This district's population directly matches FERPA's eligible-student provisions and COPPA's under-13 consent requirement, and the rollout plan's own sequence places policy-profile selection first, before roster onboarding, precisely because later steps depend on it. A wrongly assumes GDPR automatically subsumes the other two laws' specific provisions. C ignores that FERPA and COPPA apply regardless of EU plans. D reverses the rollout plan's actual dependency order, where policy selection precedes deployment.

    **Concept Tested:** District Rollout Plan (policy profile selection)

    **See:** [From Reports to a Rollout Plan](index.md#from-reports-to-a-rollout-plan)

---
