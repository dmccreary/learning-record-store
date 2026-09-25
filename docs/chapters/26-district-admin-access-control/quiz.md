---
title: "Quiz: District Administrator - Access Control and System Configuration"
description: Review questions on Experiment Lifecycle Controls, the User Access Management UI, the Access Review Workflow and Impersonation Audit, the Privacy Compliance UI, and platform-wide audit and configuration screens.
social:
   cards: false
---
# Quiz: District Administrator - Access Control and System Configuration

Test your understanding of this project's access-control and governance screens with these review questions.

---

#### 1. What does the district-level experimentation opt-out flag do to Experiment Lifecycle Controls?

<div class="upper-alpha" markdown>
1. It is enforced as non-overridable — a Textbook Author cannot start or ramp an experiment against that district's learners no matter how the experiment is configured
2. It only prevents new experiments from being designed, but allows already-running experiments to continue unaffected
3. It requires a second approver but does not actually block the action
4. It applies only to the Stop action, leaving Start, Pause, and Ramp unaffected
</div>

??? question "Show Answer"
    The correct answer is **A**. A district's opt-out flag is enforced as genuinely non-overridable, blocking a Textbook Author from starting or ramping an experiment against that district's learners regardless of how the experiment itself is configured. B wrongly limits the protection to new experiments only. C understates the flag's force, which actually blocks the action rather than merely requiring extra approval. D wrongly restricts the flag to a single lifecycle action.

    **Concept Tested:** Experiment Lifecycle Controls

    **See:** [Governing an Experiment's Lifecycle, Not Its Design](index.md#governing-an-experiments-lifecycle-not-its-design)

---

#### 2. What is the difference between a role and a scope in this project's access-control model?

<div class="upper-alpha" markdown>
1. A role and a scope are interchangeable terms for the same concept
2. A scope is a fixed set of capabilities, while a role is the specific slice of the tenancy hierarchy it applies to
3. A role applies only to System Administrators, while a scope applies only to Teachers
4. A role names a fixed set of capabilities defined in the specification; a scope names the specific district, school, or section that role applies to for one particular account
</div>

??? question "Show Answer"
    The correct answer is **D**. A role is a fixed capability set, while a scope is the specific slice of the tenancy hierarchy that role applies to for one account — two accounts can share a role and still be authorized for different data. A wrongly conflates two distinct concepts. B reverses the actual definitions. C invents a restriction that neither term actually has.

    **Concept Tested:** Role Assignment Scope

    **See:** [The User & Access Management UI: Who Can Do What, and Where](index.md#the-user-access-management-ui-who-can-do-what-and-where)

---

#### 3. What happens to a permission grant that is not reconfirmed within the Access Review Workflow's configured window?

<div class="upper-alpha" markdown>
1. It is automatically and permanently revoked with no way to restore it
2. It is silently upgraded to a broader scope to avoid disrupting the account holder
3. It is flagged as stale and surfaced prominently until someone either re-confirms it or revokes it
4. Nothing happens; the review window has no effect on unreviewed grants
</div>

??? question "Show Answer"
    The correct answer is **C**. An unreviewed or unconfirmed grant is flagged as stale and stays prominently surfaced until an administrator acts on it, rather than being silently deleted or left unchecked. A overstates the consequence into an irreversible automatic revocation. B invents an implausible auto-upgrade the chapter never describes. D contradicts the entire purpose of the review window.

    **Concept Tested:** Access Review Workflow

    **See:** [Keeping Access Current: The Review Workflow and Impersonation](index.md#keeping-access-current-the-review-workflow-and-impersonation)

---

#### 4. What two things together make up the Impersonation Audit guarantee?

<div class="upper-alpha" markdown>
1. A one-time email notification sent to the impersonated user after the session ends
2. A persistent on-screen banner naming who is impersonating whom, visible for the entire session, plus full logging of every action taken during that session with an impersonation marker
3. A requirement that impersonation sessions never exceed five minutes
4. A rule that only the impersonated user's own account can view the session log afterward
</div>

??? question "Show Answer"
    The correct answer is **B**. The Impersonation Audit combines a persistent, visible banner for the session's entire duration with full action logging marked as having occurred under impersonation. A invents a weaker, after-the-fact notification instead of a real-time, persistent one. C fabricates a time limit the chapter never states. D invents an access restriction on the log the chapter never describes.

    **Concept Tested:** Impersonation Audit

    **See:** [Keeping Access Current: The Review Workflow and Impersonation](index.md#keeping-access-current-the-review-workflow-and-impersonation)

---

#### 5. A parent submits a legally valid erasure request for their child. According to the Data Subject Request workflow, what specifically happens to that student's data?

<div class="upper-alpha" markdown>
1. Every statement associated with any student in the district is deleted, to avoid the risk of missing a related record
2. The student's account is merely marked inactive, with all underlying data left fully intact and queryable
3. The request is queued indefinitely until the district's next scheduled retention purge cycle
4. The student's statements are voided or purged and their pseudonym mapping is deleted from the PII Vault, while de-identified aggregates that no longer resolve to any one person are preserved
</div>

??? question "Show Answer"
    The correct answer is **D**. Erasure voids or purges the specific student's statements and deletes their pseudonym mapping, while deliberately preserving de-identified aggregates that no longer trace back to any individual. A wildly overstates the scope to every student in the district. B understates erasure into a mere status flag with no actual data effect. C invents an indefinite delay the chapter never describes for a legally required action.

    **Concept Tested:** Data Subject Request

    **See:** [The Privacy & Compliance UI: Policies, Requests, and Consent](index.md#the-privacy-compliance-ui-policies-requests-and-consent)

---

#### 6. A district serving elementary-age students needs its privacy settings tuned to require verified parental consent before any non-essential processing occurs. Which Policy Profile Preset is built specifically for this concern?

<div class="upper-alpha" markdown>
1. FERPA
2. GDPR
3. COPPA
4. There is no preset for this; every setting must be configured manually
</div>

??? question "Show Answer"
    The correct answer is **C**. COPPA specifically tunes aggregation threshold and Consent Status enforcement to require verified parental consent before non-essential processing, exactly matching this scenario. A targets US education-record retention and export rules, a different concern. B targets a broader data-subject-rights model, not specifically parental consent for children. D is false — a purpose-built preset exists for exactly this case.

    **Concept Tested:** Policy Profile Preset

    **See:** [The Privacy & Compliance UI: Policies, Requests, and Consent](index.md#the-privacy-compliance-ui-policies-requests-and-consent)

---

#### 7. Why does erasing a student's identity mapping not also erase the de-identified aggregate counts that student's statements previously contributed to?

<div class="upper-alpha" markdown>
1. Because aggregates are computed and stored entirely separately from any student identity in the first place, so once a value is folded into a de-identified count, nothing in that count can be traced back to the erased individual — only the mapping that could re-identify them is removed
2. Because the specification requires district administrators to manually recompute every aggregate after each erasure
3. Because aggregates are technically impossible to delete once written to ClickHouse
4. Because erasure only applies to Neo4j, never to any ClickHouse-derived aggregate
</div>

??? question "Show Answer"
    The correct answer is **A**. Once a statement's contribution is folded into a de-identified aggregate, no thread remains that could trace it back to a specific person, so erasing the identity mapping alone is sufficient to sever any re-identification path. B invents an unnecessary manual step. C is a fabricated technical limitation. D wrongly scopes erasure to only one store, when it removes the vault mapping and purges matching event-store rows.

    **Concept Tested:** Data Subject Request (erasure and aggregation)

    **See:** [The Privacy & Compliance UI: Policies, Requests, and Consent](index.md#the-privacy-compliance-ui-policies-requests-and-consent)

---

#### 8. Why does this chapter apply the same second-approver pattern to experiment lifecycle actions, impersonation, and privacy erasure specifically, rather than to every administrative action equally?

<div class="upper-alpha" markdown>
1. Because these three actions are the only ones logged in the Audit Log Browser at all
2. Because these three actions share a common property: each is powerful enough to affect real students in a way that should never depend on a single person's judgment alone, unlike a routine, lower-stakes configuration change
3. Because these three actions are the only ones available to the System Administrator role
4. Because the second-approver pattern is required by the xAPI Conformance Suite for these three actions specifically
</div>

??? question "Show Answer"
    The correct answer is **B**. The chapter explicitly frames the recurring second-approver pattern as reserved for actions powerful enough to affect real students, not applied uniformly to every administrative action. A is false — the chapter describes every admin action in this chapter as logged, not just these three. C misattributes role availability, which spans several roles across this chapter, not just the System Administrator. D fabricates an unrelated conformance requirement.

    **Concept Tested:** Experiment Lifecycle Controls (second-approver pattern)

    **See:** [Governing an Experiment's Lifecycle, Not Its Design](index.md#governing-an-experiments-lifecycle-not-its-design)

---

#### 9. A vendor proposes adding an "edit entry" feature to the Audit Log Browser so administrators can correct typos in past log entries without creating a new entry. Evaluate this proposal against what this chapter establishes about the log's purpose.

<div class="upper-alpha" markdown>
1. The proposal is reasonable, since typo correction is a low-risk, purely cosmetic change
2. The proposal is reasonable as long as only the Auditor Role, not the System Administrator, can make the edit
3. The proposal undermines the log's core guarantee: the chapter is explicit that no role, not even the System Administrator, has a documented capability to alter or delete a past entry, because the log's value as evidence depends entirely on that immutability holding
4. The proposal has no bearing on the log's purpose, since the Audit Log Browser is not actually used as evidence for anything
</div>

??? question "Show Answer"
    The correct answer is **C**. The chapter is explicit that immutability is what gives the log its evidentiary value, and no role — including the System Administrator — has a documented capability to alter a past entry, so any edit feature, however well-intentioned, undermines that guarantee. A dismisses the real risk that any edit capability creates. B still grants edit capability to some role, which the chapter's design explicitly avoids for anyone. D contradicts the chapter's stated purpose for the log — external compliance review.

    **Concept Tested:** Audit Log Browser

    **See:** [Watching the Watchers: Audit, Alerting, and Platform-Wide Configuration](index.md#watching-the-watchers-audit-alerting-and-platform-wide-configuration)

---

#### 10. A district wants to create a new "Regional Privacy Officer" account that can execute Data Subject Requests across three specific schools within the district, review (but not create or delete) other accounts' role assignments across those same three schools, and view — but never alter — the Audit Log Browser for that scope. Using this chapter's existing building blocks, design the closest achievable configuration for this account.

<div class="upper-alpha" markdown>
1. Grant a District Administrator role with district-wide scope, since Data Subject Requests are only available at the district level
2. Grant a Role Assignment Scope tied to exactly those three schools (rather than the whole district), paired with access to the Privacy Compliance UI's Data Subject Request workflow and read-only access to the Audit Log Browser filtered to that same scope, while omitting User CRUD Management's create/delete capabilities
3. Grant System Administrator access, since only a global role can view the Audit Log Browser at all
4. This configuration is impossible to approximate with any combination of this chapter's existing controls
</div>

??? question "Show Answer"
    The correct answer is **B**. Scoping the role assignment to exactly the three named schools, combined with the specific Privacy Compliance UI capability and read-only, scope-filtered audit access, closely matches the requested boundaries while omitting the create/delete power the scenario explicitly excludes. A grants unnecessarily broad district-wide scope the scenario does not call for. C grants far more authority — global platform scope — than requested. D is wrong; the chapter's role-and-scope model is specifically built to support exactly this kind of tailored configuration.

    **Concept Tested:** Role Assignment Scope / Data Subject Request / Audit Log Browser (access design synthesis)

---
