---
title: Meet the Three Personas and the Admin UI Surface
description: Introduces the district administrator, teacher, and textbook author who use this LRS day to day, the three additional named roles the specification defines, and a survey-level tour of the nine administrative user interfaces.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 14:12:18
version: 0.09
---

# Meet the Three Personas and the Admin UI Surface

## Summary

Part 3 opens by introducing the three people this book is written for — the district administrator, the teacher, and the textbook author — alongside the specification's other three named roles, and previews the nine administrative user interfaces a district administrator relies on.

## Concepts Covered

This chapter covers the following 15 concepts from the learning graph:

1. District Administrator
2. Teacher
3. Textbook Author
4. System Administrator
5. School Administrator
6. Auditor Role
7. District Management UI
8. School Course Section UI
9. Textbook Deployment UI
10. xAPI Credentials UI
11. Experiment Administration UI
12. User Access Management UI
13. Privacy Compliance UI
14. Audit Monitoring UI
15. System Configuration UI

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)

---

!!! mascot-welcome "Who Actually Opens This Software?"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Part 2 spent nineteen chapters on gateways, queues, and clustered databases — the architecture had to be right before anyone could trust what it produces. Part 3 asks the question that architecture exists to answer: who logs in, what are they trying to decide, and what does this system show them? This chapter introduces the people first and the software second. Let's follow the record.

Every chapter so far has described a system built to survive load, compress statements, and stay available through a zone outage. None of that infrastructure matters to the people who use it unless it answers real questions on a Monday morning: *Is this textbook rolled out to every section that needs it? Which of my students is falling behind, and on what concept? Did the simulation I rewrote last month actually help anyone learn faster?* Those three questions belong to three different people, and this book is organized around them deliberately.

## Three People, Three Goals

The course description that frames this whole book names three **operational personas** — people who use this project's Learning Record Store (LRS) as part of their ordinary work, not people who build or maintain it. A **persona** here is a role defined by the decisions a person needs to make, not by a job title alone; two people with different titles at different districts can share a persona if they are trying to answer the same kind of question.

The **District Administrator** runs a rollout across an entire school system. Their goal is coverage and compliance: knowing which schools have adopted which textbooks, whether a deployment is on schedule, and whether the district's privacy obligations are actually being met rather than merely assumed. The **Teacher** runs one or more sections of students day to day. Their goal is intervention: knowing which student is stuck on which concept early enough to help, not after a report card already says so. The **Textbook Author** writes and revises the intelligent-textbook content itself — chapters, quizzes, and MicroSims. Their goal is evidence: knowing whether a specific page, question, or simulation actually improved learning, rather than assuming a rewrite helped just because it feels better.

!!! mascot-thinking "Same Data, Three Different Questions"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that none of these three goals require a different database, a different ingestion pipeline, or a different statement format. Every statement this LRS has ingested since Chapter 1 — an Actor performing a Verb on an Object Activity — already contains everything a district administrator, a teacher, and a textbook author each need. What differs is the *lens*: which slice of the statement log each person is shown, aggregated to which level, and filtered by which access boundary. That lens is exactly what the rest of Part 3 builds.

Before naming the software each persona touches, it helps to fix the goals in plain language, because every later chapter refers back to these three sentences rather than restating them.

- The **District Administrator** wants to know: is every school covered, on schedule, and compliant?
- The **Teacher** wants to know: which of my students needs help right now, and on what?
- The **Textbook Author** wants to know: did my change to this content actually work?

Chapters 25 through 27 return to the District Administrator in depth, Chapters 28 and 29 to the Teacher, and Chapter 30 to the Textbook Author — this chapter previews all three at survey level so the rest of Part 3 has a map to work from.

#### Diagram: Three Personas, One Statement Log

<iframe src="../../sims/three-personas-one-statement-log/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Three Personas, One Statement Log</summary>
Type: workflow
**sim-id:** three-personas-one-statement-log<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, summarize

Learning objective: Explain how the District Administrator, Teacher, and Textbook Author each draw on the same underlying xAPI statement log, filtered through a different aggregation and access lens, rather than three separate data sources.

Purpose: A single Mermaid flowchart with one shared source node fanning out into three persona-specific paths, so the learner sees structurally that the fan-out happens after ingestion, not before it.

Shared source node: "Statement Log (every ingested xAPI Statement, this project's system of record)."

Three outgoing paths from the shared node:

- Path 1 "District Administrator": Statement Log -> "Aggregated by school and district" -> "Adoption and deployment coverage view" -> "Answers: is every school covered and compliant?"
- Path 2 "Teacher": Statement Log -> "Aggregated by section and student, scoped to sections this teacher teaches" -> "Classroom mastery and at-risk view" -> "Answers: which student needs help, and on what?"
- Path 3 "Textbook Author": Statement Log -> "Aggregated by content version and MicroSim, no student identity" -> "Content-effectiveness and experiment view" -> "Answers: did my content change actually help?"

Interactive features: Every node has a Mermaid click directive. Clicking the shared "Statement Log" node opens an infobox recapping Chapter 1's Actor/Verb/Object Activity model and noting this single log is the only source for all three paths. Clicking any aggregation node opens an infobox naming the access boundary enforced at that step (district/school scope, section/roster scope, or de-identified content scope). Clicking any "Answers:" node opens an infobox restating that persona's goal sentence from this chapter's prose.

Color coding: The shared source node in the book's teal accent color; the District Administrator path in amber, the Teacher path in violet, the Textbook Author path in green — three distinct hues so a learner can trace one path at a glance without following arrows carefully.

Responsive design: The three paths stack vertically below the shared source node on narrow viewports instead of fanning out horizontally; click targets stay tap-sized.
</details>

## Naming the Roles Precisely

The course description's plain-language names — district administrator, teacher, textbook author — are the ones this book uses in prose. The specification that governs this project's actual permissions, however, defines its access-control roles using slightly different, more formal names, and a reader moving between the book and the specification needs the mapping between them made explicit rather than left implicit.

The specification calls the person running a district's rollout the **District Administrator** — same name, no translation needed. It calls the person teaching a section the **Instructor**; this book uses **Teacher** for that same role throughout, because that is the word the people who fill it use about themselves every day. It calls the person who writes and revises textbook content **Author / Curriculum**; this book uses **Textbook Author**, again matching the vocabulary the role's own occupants would recognize. Both pairs name exactly one role each — nothing is lost or split in translation, only relabeled for a non-technical reader.

Three further roles exist in the specification's access-control model but do not appear in the course description's persona list, because they are not the primary audience this book is written for — they are the roles that make the primary three trustworthy. The **System Administrator** has global scope: this is the one role that can create new districts, configure retention defaults across the whole platform, and see cross-district benchmarks no single district administrator is allowed to see. The **School Administrator** has a narrower scope than the District Administrator — one school rather than an entire district — and manages sections and teacher assignments within that single building. The **Auditor Role** is deliberately the most limited of all six: read-only access to audit logs and access records, with no ability to view student data, change a configuration, or approve anything. An auditor's job is to verify that everyone else followed the rules, not to exercise any power themselves.

!!! mascot-tip "Enforcement Lives at the API, Not the Screen"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A tempting but wrong mental model is "a role just decides which buttons a person sees." Chapter 15 already established that this project's Role-Based Access Control (RBAC) is enforced at the API layer — the same layer every admin UI in this chapter calls — not merely hidden in a screen's layout. Hiding a button from a School Administrator would not stop a School Administrator from calling the underlying Admin API directly. The permission has to be checked where the data actually moves, which is exactly what every admin action's audit-log entry (introduced later in this chapter) is proof of.

Now that all six roles have names, a table can do what a table does best: organize scope and capability side by side for a reader who already understands each role from the prose above.

| Role | Scope | Capabilities |
|---|---|---|
| System Administrator | Global, across every district | Everything: creates districts, configures ingestion and retention defaults, sees cross-district benchmarks |
| District Administrator | One district | Manages schools, courses, sections, deployments, users, and privacy policy within that district |
| School Administrator | One school | Manages sections and teacher (Instructor) assignments within that school |
| Teacher (Instructor) | Only sections this person teaches | Views analytics for owned sections; no administrative configuration |
| Textbook Author (Author / Curriculum) | Textbook definitions and experiments | Views content-effectiveness reports and runs experiments; never sees student-identifying data |
| Auditor Role | Read-only, platform-wide | Views audit logs and access records only; cannot change anything |

Reading down that table traces a hierarchy of scope even though the table itself doesn't draw it as one: a System Administrator's authority contains a District Administrator's, which contains a School Administrator's. The Teacher, Textbook Author, and Auditor Role sit outside that vertical chain — each is scoped to a different slice of the system (a set of sections, a set of content, or the audit log itself) rather than to a nested administrative territory. Seeing that shape laid out visually, rather than inferred from a table, is worth a dedicated diagram.

#### Diagram: Role Hierarchy and Scope

<iframe src="../../sims/lrs-role-hierarchy-scope/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>Role Hierarchy and Scope</summary>
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
</details>

## A Survey of the Nine Admin UIs

Every role in the table above needs somewhere to actually exercise its capabilities, and that somewhere is one of nine **administrative user interfaces**, or **admin UIs** — screens gated by an elevated role and kept deliberately separate from the analytics dashboards Chapter 9 and Chapter 15 already introduced. That separation matters: a dashboard shows a teacher or an author what the data says, while an admin UI lets a District Administrator, School Administrator, or System Administrator change how the system itself is configured — who has access, which textbook is deployed where, and what a district's privacy policy actually permits. The next nine chapters-in-miniature give each UI one or two sentences; Chapters 25 through 27 return to several of them in operational depth.

The **District Management UI** is where a System Administrator creates and configures districts themselves — timezone, privacy-policy profile, and roster-source connection — the single highest-scope screen in the whole surface. The specification's full name for the next one is the **School / Course / Section Management UI**; this book shortens that to the **School Course Section UI**, and it is where a District Administrator or School Administrator manages the actual schools, courses, and sections a roster sync produces, including enrollment edits and teacher assignments. The specification calls the third the **Textbook & Deployment Management UI**; shortened here to the **Textbook Deployment UI**, it is where a District Administrator binds a textbook version to specific sections and works through the queue of provisionally auto-registered textbooks Chapter 8 described.

The specification's **xAPI Endpoint & Credentials UI** — shortened to the **xAPI Credentials UI** — is where ingestion credentials for a textbook or district are issued, rotated, and inspected, including a view of any dead-lettered statements Chapter 23 explained. The **Experiment Administration UI** is where a Textbook Author designs, launches, and stops a controlled experiment comparing two versions of a chapter or MicroSim — Chapter 31 covers reading its results in depth. The specification's **User & Access Management UI**, shortened to the **User Access Management UI**, is where accounts are created and roles assigned, and where a periodic access review flags stale permissions that should be revoked.

The specification's **Privacy & Compliance UI** — the **Privacy Compliance UI** in this book's shorthand — is where a District Administrator configures a FERPA/COPPA/GDPR policy profile and, when legally required, executes a data-subject access or erasure request. The specification's **Audit & Monitoring UI**, the **Audit Monitoring UI** here, is the Auditor Role's home screen: an immutable, filterable log of every administrative action alongside live ingestion health metrics. Finally, the **System Configuration UI** is the System Administrator's platform-wide control panel for retention defaults, feature flags, and rate limits that apply everywhere at once.

That prose covered nine names in dense sequence, so before going further, it is worth reading them back as a plain list — a summary of what was just explained, not new information.

1. District Management UI — create and configure districts (System Administrator).
2. School Course Section UI — manage schools, courses, sections, enrollment, and teacher assignment.
3. Textbook Deployment UI — bind textbook versions to sections; reconcile provisional registrations.
4. xAPI Credentials UI — issue and rotate ingest credentials; inspect dead-lettered statements.
5. Experiment Administration UI — design, launch, and stop controlled content experiments.
6. User Access Management UI — create accounts, assign roles, review stale access.
7. Privacy Compliance UI — configure policy profiles; execute data-subject requests.
8. Audit Monitoring UI — browse the immutable admin-action log; watch ingestion health.
9. System Configuration UI — set platform-wide defaults, feature flags, and rate limits.

!!! mascot-warning "An Admin UI Is Not a Dashboard"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is easy to blur these nine screens together with the analytics dashboards from Chapter 9 — both are web interfaces a person logs into, after all. The specification is explicit that they are architecturally separate: dashboards answer "what does the data show," gated by ordinary role scope, while admin UIs answer "how is the system configured," gated by an elevated role and backed by an audit trail. A Teacher's **My Classes** dashboard and a District Administrator's **District Management UI** are not two views of one screen — they are two different systems built for two different kinds of decision.

Because six roles map onto nine UIs in a pattern that is easier to see than to read as prose, the table below organizes exactly which roles can open which screen — reinforcing, not introducing, the role and UI names already explained above.

| Admin UI | Roles that use it |
|---|---|
| District Management UI | System Administrator |
| School Course Section UI | District Administrator, School Administrator |
| Textbook Deployment UI | District Administrator |
| xAPI Credentials UI | District Administrator, System Administrator |
| Experiment Administration UI | Textbook Author |
| User Access Management UI | District Administrator, School Administrator, System Administrator |
| Privacy Compliance UI | District Administrator |
| Audit Monitoring UI | Auditor Role, System Administrator |
| System Configuration UI | System Administrator |

Reading the table by column rather than by row reveals the same hierarchy the earlier role diagram showed: the System Administrator row is checked more often than any other, because global scope means access to nearly every configuration screen, while the Teacher never appears in this table at all — teaching does not require administrative access to anything. A reader scanning for "everything a District Administrator can touch" is doing exactly the kind of lookup this table exists for, which is also exactly what the clickable infographic below lets a reader do interactively rather than by scanning rows.

#### Diagram: The Nine Admin UIs at a Glance

<iframe src="../../sims/nine-admin-uis-survey/main.html" width="100%" height="502px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Nine Admin UIs at a Glance</summary>
Type: infographic
**sim-id:** nine-admin-uis-survey<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/xapi-data-flow<br/>

Bloom Taxonomy: Remember (L1)
Bloom Taxonomy Verb: identify, recall

Learning objective: Identify each of the nine admin UIs, its one-line purpose, and which of the six roles from this chapter can open it, as a quick-reference survey before Chapters 25 through 27 cover several of them in depth.

Canvas layout: A 3x3 grid of nine tiles, one per admin UI, each labeled with its short name (District Management, School Course Section, Textbook Deployment, xAPI Credentials, Experiment Administration, User Access Management, Privacy Compliance, Audit Monitoring, System Configuration).

Visual elements: Each tile shows the UI's short name in bold and a small icon suggesting its function (a building for District Management, a roster grid for School Course Section, a package for Textbook Deployment, a key for xAPI Credentials, a flask for Experiment Administration, a badge for User Access Management, a shield for Privacy Compliance, a magnifying glass for Audit Monitoring, a set of dials for System Configuration). Tiles are colored by which chapter covers them in depth: three tiles destined for Chapter 25 in one hue, two for Chapter 26 in a second hue, one for Chapter 27 in a third hue, and the remaining three (xAPI Credentials, Experiment Administration, Audit Monitoring) in a neutral hue since they are introduced here but revisited more briefly elsewhere in the book.

Interactive controls: Clicking any tile expands it into a detail panel showing the UI's full one- or two-sentence description from this chapter's prose, plus a chip for each role permitted to use it (matching the roles-to-UIs table above). A "Filter by role" dropdown (p5.js `createSelect()`) lets the reader choose one of the six roles and dims every tile that role cannot access, leaving only that role's accessible UIs at full opacity — a direct, exploratory version of reading one column of the table above.

Default state: All nine tiles shown at full opacity, no role filter applied, no tile expanded.

Behavior: Selecting a role from the dropdown dims inaccessible tiles to 30% opacity with a smooth 300ms transition; selecting "All roles" (the default option) restores full opacity to every tile. Clicking an expanded tile a second time collapses it back to its compact form.

Implementation notes: Use p5.js `createSelect()` for the role-filter control, per this project's convention of always using p5.js's built-in controls rather than hand-drawn UI. Store the nine UI-to-roles mappings as a simple array of objects so the filter logic is a single lookup rather than nine hardcoded conditionals.

Responsive design: Grid collapses from 3x3 to a single scrollable column of nine tiles on narrow viewports; the role-filter dropdown remains pinned above the grid at every width.
</details>

## One Statement, Three Reports: A Cross-Persona Workflow

The clearest way to see why one statement log can serve three personas without three separate pipelines is to follow a single statement through the system and watch it surface in three unrelated places. Suppose a student in a ninth-grade biology section opens an intelligent-textbook chapter, works through an embedded MicroSim on cellular respiration, and submits an answer that the MicroSim scores as correct. That single interaction produces an xAPI Statement — an Actor, a Verb, an Object Activity, and a Result, exactly the vocabulary Chapter 1 introduced — and that one Statement is ingested exactly once.

From there, three independent aggregations read the same ingested Statement without touching each other. The Teacher's classroom mastery view, scoped to the sections that Teacher owns, rolls this Statement into that one student's per-concept mastery estimate using the Bayesian Knowledge Tracing model Chapter 12 described — if the student is now correct on cellular respiration three times running, their mastery estimate for that concept rises, and the Teacher's at-risk roster may quietly drop that student from its list. The District Administrator's adoption view, aggregated at the school and district level with no individual student ever named, counts this Statement only as one more sign that this textbook's cellular-respiration chapter is actively in use in this section, contributing to a coverage percentage. The Textbook Author's content-effectiveness view, scoped to the MicroSim itself rather than to any student or section, adds this Statement's correctness outcome to the running effectiveness estimate for that specific MicroSim version — evidence that feeds directly into the kind of controlled experiment the Experiment Administration UI manages.

!!! mascot-encourage "Nine Names Is a Lot; One Pattern Is Not"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If the last few sections felt like a wall of new proper nouns — six roles, nine admin UIs, three personas — that reaction is entirely reasonable on a first pass. But notice that every one of those eighteen names answers exactly one of two questions: "who is this person" or "what screen do they use." You do not need all eighteen memorized before Chapter 25; you need the shape — one shared log, six roles with clearly bounded scope, nine UIs each doing one job — and the names will stick as each gets its own chapter.

Chapter 15 already showed the mechanics that make this fan-out safe rather than chaotic: server-side aggregation so raw per-statement rows never reach a browser, cross-filtering and drill-down within a single dashboard, and the aggregation-threshold rule that keeps any group below ten students from being shown disaggregated. Every one of the three views in the workflow above is built on exactly that same enforcement layer — the difference between the District Administrator's, the Teacher's, and the Textbook Author's screens is entirely in the query each one is authorized to run, not in the underlying data or the mechanics that protect it.

#### Diagram: Cross-Persona Workflow

<iframe src="../../sims/cross-persona-workflow/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Cross-Persona Workflow</summary>
Type: workflow
**sim-id:** cross-persona-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, analyze

Learning objective: Trace one ingested xAPI Statement through three independent, simultaneously-updated aggregations, and analyze why no persona's view requires a separate data pipeline from the others.

Purpose: A single Mermaid flowchart tracing one concrete Statement (a student's correct MicroSim answer on cellular respiration) from ingestion into three parallel, non-interfering outcomes.

Flow: "Student answers MicroSim question correctly" -> "xAPI Statement ingested once (Actor, Verb, Object Activity, Result)" -> three parallel branches.

Branch A "Teacher": -> "Bayesian Knowledge Tracing update for this student's cellular-respiration mastery" -> "At-risk roster re-evaluated for this student."

Branch B "District Administrator": -> "Counted toward this section's textbook-usage coverage, no student named" -> "District adoption percentage updated."

Branch C "Textbook Author": -> "Added to this MicroSim version's running effectiveness estimate, no student named" -> "Feeds the Experiment Administration UI's readout if an experiment is running."

Interactive features: Every node has a Mermaid click directive. Clicking the shared ingestion node opens an infobox recapping that this is the same non-blocking ingestion path Chapter 8 described. Clicking any Branch A node opens an infobox linking to Chapter 12's Bayesian Knowledge Tracing explanation. Clicking any Branch B node opens an infobox naming the aggregation-threshold rule from Chapter 15 that would suppress this count if the group were smaller than ten. Clicking any Branch C node opens an infobox previewing Chapter 30 and Chapter 31's content-effectiveness and experiment coverage.

Color coding: Shared ingestion node in teal; Teacher branch in violet; District Administrator branch in amber; Textbook Author branch in green — matching the same three persona colors used in the "Three Personas, One Statement Log" diagram earlier in this chapter, so a reader recognizes the color scheme as a running convention.

Responsive design: The three branches stack vertically below the shared node on narrow viewports; click targets stay tap-sized.
</details>

## Key Takeaways

- The **District Administrator** runs a district-wide rollout and needs to know whether every school is covered, on schedule, and compliant.
- The **Teacher** owns one or more sections and needs to know which student needs help right now, and on which concept.
- The **Textbook Author** writes and revises content and needs evidence about whether a specific change actually improved learning.
- The **System Administrator** has global, cross-district scope and is the only role that can create new districts or set platform-wide defaults.
- The **School Administrator** manages sections and teacher assignments within a single school, one level narrower than a District Administrator.
- The **Auditor Role** is read-only by design, limited to reviewing the audit log and access records without the power to change anything.
- Nine **administrative user interfaces** — the District Management UI, School Course Section UI, Textbook Deployment UI, xAPI Credentials UI, Experiment Administration UI, User Access Management UI, Privacy Compliance UI, Audit Monitoring UI, and System Configuration UI — are architecturally separate from analytics dashboards and gated by these six roles.
- All three personas, and all six roles, draw from a single ingested statement log; what differs between them is the aggregation, scope, and access boundary applied to the same underlying evidence.

!!! mascot-celebration "The Map Is Drawn"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Six roles, nine UIs, three personas, one shared log — that's the whole surface of Part 3 laid out at a glance. What does the evidence show? You now know exactly where each later chapter fits before you read it. In [Chapter 25: District Administrator - Rosters, Deployments, and Registries](../25-district-admin-rosters-deployments/index.md), we go deep on the first three admin UIs this chapter only surveyed.
