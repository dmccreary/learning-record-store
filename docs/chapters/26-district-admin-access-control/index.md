---
title: District Administrator: Access Control and System Configuration
description: A practical tour of the User Access Management, Privacy and Compliance, Audit and Monitoring, and System Configuration UIs that govern who can touch a district's data and how the platform proves that access was appropriate.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 14:34:20
version: 0.09
---

# District Administrator: Access Control and System Configuration

## Summary

This chapter continues the district administrator's toolkit with user and role management, access review workflows, audit logging, and the system-wide feature-flag and rate-limit controls that round out the administrative surface.

## Concepts Covered

This chapter covers the following 14 concepts from the learning graph:

1. Experiment Lifecycle Controls
2. User CRUD Management
3. Role Assignment Scope
4. Access Review Workflow
5. Impersonation Audit
6. Policy Profile Preset
7. Data Subject Request
8. Consent Status
9. Aggregation Threshold
10. Audit Log Browser
11. Alerting Configuration
12. Retention Defaults Config
13. Feature Flag Config
14. Rate Limit Config

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)
- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../25-district-admin-rosters-deployments/index.md)

---

!!! mascot-welcome "The Screens Behind the Screens"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 25 put you in front of the screens a District Administrator uses to run day-to-day operations — rosters, enrollments, textbook deployments. This chapter asks a quieter but more consequential question: who is allowed to open those screens in the first place, and how does the system prove, after the fact, that only the right people did? Let's follow the record.

Every screen Chapter 25 described — the District Management UI, the School Course Section UI, the Textbook Deployment UI — silently assumed a District Administrator was already logged in with exactly the right permissions to use it. This chapter fills in that assumption. It covers four more screens from the specification's §10: the User & Access Management UI, the Privacy & Compliance UI, the Audit & Monitoring UI, and the System Configuration UI, plus one governance layer, Experiment Lifecycle Controls, that belongs here because it concerns who may start, pause, or stop an experiment rather than how that experiment is designed. Together, these screens answer a different question than Chapter 25's screens did: not "what does this district look like," but "who touched it, when, and were they allowed to."

## Governing an Experiment's Lifecycle, Not Its Design

Chapter 25 introduced the Experiment List View, the read-only table a District Administrator consults to see every experiment's status, owner, primary metric, and effect estimate. That view answers "what is running." This chapter's concern is different: who is allowed to change that status, and what stops a single person from quietly hiding an inconvenient result. The specification calls this set of controls **Experiment Lifecycle Controls**, and while a Textbook Author designs an experiment's hypothesis and variants — [Chapter 31: Designing and Reading A/B Experiments](../31-designing-ab-experiments/index.md) covers that design work — the lifecycle controls that move an experiment through its states are governed the same way every other admin action in this chapter is governed: by role, by scope, and by an audit trail.

An experiment lifecycle moves through five actions, always in the same order of availability even though not every experiment passes through all five:

- **Start** — launches an experiment from draft into running state, beginning random assignment of learners to variants.
- **Pause** — temporarily halts new assignments without ending the experiment, useful when an anomaly needs investigating before continuing.
- **Ramp** — adjusts allocation, typically increasing the share of learners assigned to a promising variant as confidence grows.
- **Stop** — ends the experiment permanently, with a required reason logged; from this point forward, every learner is served the control arm.
- **Archive** — removes a concluded experiment from active views while preserving its full history for later reference.

Two governance rules apply to every one of those five actions regardless of who initiates them. A district that has opted out of experimentation — a flag set on the District Management UI, as Chapter 25 described — is enforced as **non-overridable**: a Textbook Author cannot start or ramp an experiment against that district's learners no matter how the experiment is configured elsewhere. And every start and stop is logged, with a district's governance policy able to require a **second approver** — a different, elevated account explicitly confirming the change — before either action takes effect. That second-approver pattern reappears twice more in this chapter, for impersonation and for privacy erasure, because an action powerful enough to affect real students should never depend on a single person's judgment alone.

!!! mascot-thinking "One Audit Trail, Four Screens"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice a pattern before this chapter goes screen by screen: experiment lifecycle changes, user role assignments, privacy erasures, and configuration edits are four very different actions, but every one of them writes to the same place — the audit log this chapter reaches in its third section. The specific screen changes as we go; the accountability mechanism underneath does not.

## The User & Access Management UI: Who Can Do What, and Where

The **User & Access Management UI** is where every account with elevated privileges in this LRS — an admin, an instructor, an author, or an auditor — is created, edited, and eventually removed. The specification's term for this basic capability is **User CRUD Management**: standard Create, Read, Update, and Delete operations over accounts, the same CRUD pattern Chapter 25 described for schools, courses, and sections, applied here to the people who administer them rather than to the students inside them. The specification's stated preference is that these accounts authenticate through Single Sign-On (SSO) using SAML or OpenID Connect (OIDC), protocols that let a district's own identity system vouch for a login rather than this LRS storing a password itself, with a local account and password kept only as a fallback where no SSO integration exists.

Creating an account answers "who exists." It does not by itself answer "what can that account touch," which is the second half of this screen's job: **Role Assignment Scope**. Assigning a role is not simply picking a label such as "District Administrator" from a list — the specification requires that assignment be scoped to a specific district, school, or section, so the same "Instructor" role means "these two sections" for one person and "that different section" for another. A School Administrator account, for instance, is not just tagged "School Administrator" in the abstract; it is tagged "School Administrator, Lincoln Middle School" — and that scope value is exactly what Chapter 15's Role-Based Access Control enforcement checks at the API layer before any request runs, not merely what a screen's navigation menu happens to show.

Before looking at how this plays out visually, it helps to hold two terms apart clearly. A **role** names a fixed set of capabilities defined in the specification and already catalogued in Chapter 24 — District Administrator, School Administrator, Instructor, and so on. A **scope** names the specific slice of the tenancy hierarchy that role applies to for one particular account. Two accounts can share the identical role and still be authorized for entirely different data, because their scopes differ.

#### Diagram: Role Assignment Scope Explorer

<iframe src="../../sims/role-assignment-scope-explorer/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>Role Assignment Scope Explorer</summary>
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
</details>

## Keeping Access Current: The Review Workflow and Impersonation

Granting the right scope once is necessary but not sufficient. People change schools, leave a district, or move from teaching into an administrative role, and a scope assigned correctly on day one can become wrong by day two hundred. The **Access Review Workflow** is the specification's answer to that drift: a periodic attestation process in which a District or School Administrator is presented with every account and scope currently active in their territory and must explicitly confirm, one by one or in bulk, that each grant is still needed. Any grant not reviewed within the configured window, or that the reviewing administrator does not affirmatively confirm, is **flagged as stale** and surfaced prominently until someone either re-confirms it or revokes it.

!!! mascot-tip "Treat a Stale Flag as a Question, Not an Accusation"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A flagged grant does not mean someone did something wrong; it usually just means nobody has looked at that permission in a while. A practicing administrator treats the access review the way a homeowner treats a smoke-detector battery check: routine, scheduled, and far cheaper to do on a calendar than to regret after the fact.

The second capability on this screen, **Impersonation**, is reserved for the System Administrator role alone and exists for one legitimate purpose: letting platform support staff see exactly what a confused or stuck user sees, without asking that user to share a password that, under SSO, does not even exist to share. Because impersonation means one account temporarily acting as another, the specification requires it be heavily audited — every impersonation session displays a **persistent banner** naming who is impersonating whom, visible on every screen for the session's entire duration, and every action taken during that session is logged with the same detail as if the impersonated user had performed it, plus a marker noting it happened under impersonation. This chapter's term for that combined guarantee — the banner plus the full logging — is the **Impersonation Audit**.

Now that both features on this screen have been explained in prose, it is worth summarizing what each one actually guards against before moving to the next screen.

| Feature | What It Guards Against | Enforcement Mechanism |
|---|---|---|
| Role Assignment Scope | An account holding a role but reaching data outside its intended district, school, or section | Scope value checked at the API layer on every request, per Chapter 15's RBAC enforcement |
| Access Review Workflow | Permissions that were correct once but were never revisited as people's jobs changed | Periodic attestation; grants not reconfirmed within the review window are flagged as stale |
| Impersonation Audit | Support staff acting as a user without accountability for what happens during that session | Persistent on-screen banner plus full action logging for the entire impersonation session |

#### Diagram: Access Review and Impersonation Audit Workflow

<iframe src="../../sims/access-review-impersonation-workflow/main.html" width="100%" height="682px" scrolling="no"></iframe>

<details markdown="1">
<summary>Access Review and Impersonation Audit Workflow</summary>
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
</details>

## The Privacy & Compliance UI: Policies, Requests, and Consent

The **Privacy & Compliance UI** is where the privacy commitments this book described more abstractly in Chapter 6 and Chapter 15 become concrete, per-district settings a District Administrator actually sets. As in Chapter 15, this chapter treats what follows as a set of screen mechanics — the legal reasoning behind why a district in one state configures its aggregation threshold differently from a district in another belongs to [Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../27-compliance-and-district-reporting/index.md).

The screen's starting point is the **Policy Profile Preset**. Rather than asking an administrator to configure a dozen separate privacy settings from scratch, the specification defines named presets — FERPA, COPPA, and GDPR — each of which sets a bundle of retention windows, aggregation thresholds, and export rules to values already aligned with that regulation's typical requirements. Selecting a preset does not lock a district out of adjusting individual settings afterward; it simply gives every district a sensible starting point rather than a blank form.

Now that retention windows, aggregation thresholds, and export rules have each been introduced, a short comparison table reinforces what selecting each preset actually configures.

| Policy Profile Preset | Regulatory Concern It Targets | What Selecting It Pre-Configures |
|---|---|---|
| FERPA | US student education records | Retention window and export rules tuned to a school system's typical record-keeping obligations |
| COPPA | US children under 13 and parental consent | Aggregation threshold and Consent Status enforcement tuned to require verified parental consent before non-essential processing |
| GDPR | Broader personal-data rights | Retention window, export rules, and Data Subject Request handling tuned to a wider data-subject-rights model |

Below the preset selector sits the screen's most operationally significant tool: the **Data Subject Request** workflow. An administrator searches for a specific student, not directly by name, but through the roster identity that Chapter 6's PII Vault holds, unlocked only with elevated authentication for this specific purpose, and then executes one of three actions: **access** (produce a copy of everything recorded about that student), **rectification** (correct an inaccurate record), or **erasure** (permanently remove that student's identifiable trace from the system). Erasure is the most consequential of the three: it voids or purges the student's statements and deletes their pseudonym mapping from the PII Vault, using exactly the mechanism Chapter 6 described, while deliberately preserving the de-identified aggregates that no longer resolve to any one person.

!!! mascot-warning "Erasure Removes the Mapping, Not the History of Learning"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A newcomer to this screen sometimes assumes erasure deletes "all the data," full stop. It does not, and the distinction matters: erasure severs the link between a real student and their pseudonymous `student_key`, and purges the statements tied to that key — but the de-identified, aggregated counts those statements already contributed to, a school's overall completion rate, say, remain, because nothing in an aggregate can be traced back to the erased individual. Confusing "erase the identity" with "erase the evidence that anyone learned anything" is exactly the kind of mistake this chapter wants you to avoid.

Closely related to erasure, but distinct from it, is **Consent Status**, a field this screen displays and lets an administrator manage for every student subject to COPPA's parental-consent requirement. A student's consent status is not a single permanent flag; it can be granted, withdrawn, or pending, and the specification is explicit about the consequence of anything other than granted: **students without consent are excluded from any non-essential processing**, meaning their statements may still be recorded for the core purpose of running the textbook, but excluded from experiments, cross-district benchmarking, or any analytical use beyond direct instruction.

Finally, the **Aggregation Threshold** control on this screen sets the actual number Chapter 15's suppression mechanism enforces against every report and dashboard. Chapter 15 showed what happens once that threshold is set: Threshold Suppression and Complementary Suppression hide any group smaller than the configured minimum, ten students by default. This screen is simply where a District Administrator, working from whatever Policy Profile Preset they selected, actually sets that number for their own district. Chapter 15 explained the mechanism; this chapter explains the knob that drives it.

#### Diagram: Privacy and Compliance UI Mockup

<iframe src="../../sims/privacy-compliance-ui-mockup/main.html" width="100%" height="502px" scrolling="no"></iframe>

<details markdown="1">
<summary>Privacy and Compliance UI Mockup</summary>
Type: infographic
**sim-id:** privacy-compliance-ui-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/token-efficiency/tree/main/docs/sims/privacy-compliance-pipeline<br/>

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, locate

Learning objective: Operate a realistic mock-up of the Privacy & Compliance UI, locating each of the four fields this section explains — Policy Profile Preset, Data Subject Request, Consent Status, and Aggregation Threshold — within a plausible screen layout rather than a bulleted description.

Canvas layout: A mock admin-screen rendered as a bordered browser-window frame with a left navigation rail showing "Districts > Riverbend Unified > Privacy & Compliance" as breadcrumb, and a main panel divided into four labeled cards: "Policy Profile," "Data Subject Request," "Consent Status," and "Aggregation Threshold."

Visual elements: The "Policy Profile" card shows three radio options ("FERPA," "COPPA," "GDPR") with "COPPA" selected. The "Data Subject Request" card shows a search field ("Search by roster identity...") and three buttons, "Access," "Rectify," "Erase," with "Erase" outlined in warning red to signal irreversibility. The "Consent Status" card shows three example students with status chips reading "Granted" (green), "Pending" (amber), and "Withdrawn" (gray). The "Aggregation Threshold" card shows a slider reading "Minimum group size: 10" with a caption "Groups smaller than this are suppressed on every report."

Interactive controls: Clicking a Policy Profile radio option updates the Aggregation Threshold slider and a small "Retention" readout elsewhere on the mock screen to that preset's typical value, demonstrating that a preset configures multiple fields at once. Clicking "Erase" on the Data Subject Request card opens a confirmation dialog reading "This will permanently remove this student's identity mapping. De-identified aggregates will be preserved. This cannot be undone." with "Confirm" and "Cancel" buttons. Clicking a Consent Status chip cycles it through Granted, Pending, and Withdrawn, and clicking "Withdrawn" updates a caption reading "This student is now excluded from non-essential processing."

Default state: COPPA preset selected; Aggregation Threshold at 10; three example students with mixed consent statuses; no dialog open.

Implementation notes: Use p5.js `createButton()` for Access, Rectify, and Erase, `createSlider()` for the Aggregation Threshold, and a custom radio-button group drawn with `ellipse()` and mouse-press detection for the Policy Profile Preset selector, per this project's convention of using p5.js's built-in controls wherever a native equivalent exists.

Responsive design: The four-card grid collapses from a 2x2 layout to a single stacked column on narrow viewports; the confirmation dialog becomes a full-width overlay below 600px width.
</details>

## Watching the Watchers: Audit, Alerting, and Platform-Wide Configuration

The last two screens in this chapter's tour share a single audience: the System Administrator and the Auditor Role, the two roles Chapter 24 described as least concerned with day-to-day district operations and most concerned with whether the whole platform is behaving.

The **Audit & Monitoring UI** centers on the **Audit Log Browser**, an immutable log of every admin action described in this chapter so far: every user created, every role scope assigned, every access review completed, every impersonation session, every data-subject request executed, every experiment started or stopped. The log is filterable by actor, action, target, and time range, and it can be exported wholesale for an external compliance review. "Immutable" here means what it says: no role, not even the System Administrator, has a documented capability to alter or delete a past entry, because the log's value as evidence depends entirely on that guarantee holding.

The same screen surfaces ingestion and processing health metrics familiar from earlier chapters — statements per second, queue depth, processing lag, reconciliation backlog, dead-letter rate — but adds one new control on top of them: **Alerting Configuration**. This is where a System Administrator sets the specific thresholds that page someone when those health metrics cross a dangerous line — the specification's own examples are processing lag exceeding five minutes, or a dead-letter rate exceeding one percent. Below those thresholds, the metrics are simply numbers on a screen; above them, the same numbers become an active page to whoever is on call.

!!! mascot-encourage "Yes, This Is the Same Dead-Letter Rate From Chapter 19"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If "dead-letter rate" and "processing lag" sound familiar, they should — Chapter 19 covered the failure modes those numbers describe. Nothing new is happening here except a threshold and a page. You already understand what the numbers mean; this screen just decides how loudly the system shouts when they get bad.

Rounding out the admin surface, the **System Configuration UI** is the platform's single highest-scope settings screen, visible to the System Administrator alone, and every control on it applies globally rather than to one district. **Retention Defaults Config** sets the platform-wide default retention window every new district inherits when it is created, the starting point Chapter 25's District Management UI then lets an individual district override with its own Retention Policy, within whatever bounds this global default permits. **Feature Flag Config** turns platform capabilities on or off, a new dashboard type, an experimental ingestion path, without a code deployment, letting the operations team roll a change out gradually or roll it back instantly if something goes wrong. **Rate Limit Config** sets the ceiling on how many requests a single textbook's or district's ingest credentials may submit per second, protecting the shared ingestion pipeline Chapter 14 described from any one Learning Record Provider overwhelming it, whether through a bug or a genuine traffic spike.

#### Diagram: System Configuration and Alerting Dashboard

<iframe src="../../sims/system-config-alerting-dashboard/main.html" width="100%" height="542px" scrolling="no"></iframe>

<details markdown="1">
<summary>System Configuration and Alerting Dashboard</summary>
Type: chart
**sim-id:** system-config-alerting-dashboard<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: relate, interpret

Learning objective: Interpret a live-style processing-lag chart against a configurable Alerting Configuration threshold line, and relate that threshold to the platform-wide Retention Defaults Config, Feature Flag Config, and Rate Limit Config panels a System Administrator manages on the same screen.

Purpose: A combination line chart plus control panel: the chart shows a simulated processing-lag time series across the last 60 minutes, with a horizontal threshold line the learner can drag to any value between 1 and 15 minutes.

Chart data: Sixty data points, one per simulated minute, oscillating between 1 and 4 minutes of processing lag with three deliberate spikes (minute 20 reaching 6 minutes; minute 35 reaching 8 minutes; minute 50 reaching 3 minutes), so the learner sees both alert-triggering and non-triggering fluctuation.

Interactive controls: A draggable horizontal threshold line, default 5 minutes per the specification's example. Any segment crossing above the threshold turns red and shows an "ALERT: paging System Administrator" banner; dragging the threshold live-updates which spikes trigger an alert. Below the chart, three read-only panels labeled "Retention Defaults," "Feature Flags," and "Rate Limits" show one example value each, and hovering any panel opens a tooltip with that field's one-sentence definition from this chapter's prose.

Color coding: Chart line in the book's teal accent color below threshold, red above it; threshold line in dashed amber.

Implementation notes: Use Chart.js's line chart type with an annotation layer for the draggable threshold line; the three configuration panels can be plain HTML/CSS elements since they hold static reference values rather than chart data.

Responsive design: Chart resizes to its containing element's width using Chart.js's built-in responsive option; the three configuration panels stack vertically below the chart on viewports narrower than 700px instead of sitting in a row.
</details>

## From Governance Back to the Whole Chapter

Every mechanism this chapter described solves a version of the same problem: a system built to serve many districts at once must be able to prove, not merely assert, that access was appropriate and that a privileged action happened for a legitimate reason. Tracing that idea from the first section to the last makes the connective thread easier to hold onto than reading each screen as an isolated feature list.

1. An experiment's lifecycle actions (start, pause, ramp, stop, archive) are gated by role and, for the most consequential ones, a second approver, so no single account can unilaterally start or hide an experiment's results.
2. A user account's Role Assignment Scope ties a fixed role to a specific district, school, or section, so two accounts with the same role can still be authorized for entirely different data.
3. The Access Review Workflow catches scope that was correct once but has since gone stale, while Impersonation Audit ensures a support session acting as another user is fully visible and fully logged.
4. The Privacy & Compliance UI turns Chapter 6 and Chapter 15's privacy commitments into per-district controls: a Policy Profile Preset, a Data Subject Request workflow, Consent Status tracking, and the Aggregation Threshold knob.
5. The Audit Log Browser and Alerting Configuration make every action from steps 1 through 4 reviewable after the fact, while Retention Defaults Config, Feature Flag Config, and Rate Limit Config set the platform-wide bounds every district operates inside.

## Key Takeaways

- **Experiment Lifecycle Controls** govern the start, pause, ramp, stop, and archive actions on an experiment, enforcing a non-overridable district opt-out and, for the most consequential actions, a second approver.
- **User CRUD Management** creates and maintains admin, instructor, author, and auditor accounts, preferring SSO via SAML or OIDC over local passwords.
- **Role Assignment Scope** ties a fixed role to a specific district, school, or section, so the same role can mean different authorized data for different accounts.
- The **Access Review Workflow** periodically requires an administrator to reconfirm every active grant, flagging any grant left unreviewed as stale.
- **Impersonation Audit** requires a persistent on-screen banner and full action logging whenever a System Administrator temporarily acts as another user.
- A **Policy Profile Preset** (FERPA, COPPA, or GDPR) pre-configures a district's retention window, aggregation threshold, and export rules to a sensible regulatory starting point.
- A **Data Subject Request** lets an administrator execute access, rectification, or erasure on behalf of one student, with erasure removing identity mapping while preserving de-identified aggregates.
- **Consent Status** tracks a student's parental-consent state and excludes students without granted consent from non-essential processing.
- The **Aggregation Threshold** is the per-district control that sets the minimum group size Chapter 15's suppression mechanism enforces.
- The **Audit Log Browser** is an immutable, filterable record of every admin action covered in this chapter, and **Alerting Configuration** sets the thresholds that turn a health metric into an active page.
- **Retention Defaults Config**, **Feature Flag Config**, and **Rate Limit Config** are the System Administrator's platform-wide settings that bound what any single district can override.

!!! mascot-celebration "Every Screen Now Has an Owner and a Trail"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You now know not just what a District Administrator can configure, but who is allowed to configure it and how the system proves it happened responsibly. That closes out the operational and governance half of the District Administrator's toolkit. What does the evidence show? The legal reasoning behind these same controls — why FERPA, COPPA, and GDPR shape a district's choices the way they do — is exactly where we go next. [Chapter 27: Compliance, Privacy Law, and District-Level Reporting](../27-compliance-and-district-reporting/index.md) picks up from here.
