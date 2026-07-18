---
title: Multi-Tenancy, Rosters, and Pseudonymous Identity
description: How this Learning Record Store keeps thousands of districts, schools, and students cleanly separated, how rosters arrive from a district's own systems, and how a real student becomes a pseudonymous account before anything durable is written.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 07:43:45
version: 0.09
---

# Multi-Tenancy, Rosters, and Pseudonymous Identity

## Summary

This chapter covers how this LRS serves many school districts at once: the District→School→Course→Section→Student hierarchy, the hard and soft isolation guarantees between tenants, and how student rosters arrive via OneRoster. It ends with how a real student becomes a pseudonymous account before anything durable is written.

## Concepts Covered

This chapter covers the following 15 concepts from the learning graph:

1. Tenant
2. District
3. School
4. Course
5. Section
6. Enrollment
7. Tenancy Hierarchy
8. Hard Isolation
9. Soft Isolation
10. OneRoster
11. Student Information System
12. Student
13. Pseudonymous Account
14. Student Key
15. PII Vault

## Prerequisites

This chapter builds on concepts from:

- [Chapter 2: The Anatomy of an xAPI Statement](../02-anatomy-of-xapi-statement/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)

---

!!! mascot-welcome "Whose evidence is this, exactly?"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 5 traced a statement's path through five architectural planes, from an intelligent textbook to a rendered dashboard. This chapter asks a different question about that same statement: which district does it belong to, which class was it produced in, and whose learner produced it — without this Learning Record Store ever storing that learner's real name? Let's follow the record.

This Learning Record Store does not serve one school. It serves **many school districts at once**, each running its own courses, each course delivered through one or more intelligent textbooks, and each textbook producing a steady stream of xAPI Statements from every student using it. That arrangement — one system, many independent customers sharing it — has a name in software architecture: **multi-tenancy**. This chapter grounds every claim in this project's own specification, `lrs-spec-v1.md` §3 ("Multi-Tenancy Model") and `lrs-design-v1.md` §5.2 ("Identity Service & Pseudonymization"), because from here forward the book describes one particular system's actual design choices, not general industry practice.

## The Tenant: Who Owns This Data?

In this project's specification, a **Tenant** is defined precisely: it is a **school district** — the top-level unit whose data must never leak into another tenant's view, and the boundary every isolation guarantee in this chapter is drawn around. The word "tenant" comes from multi-tenant software architecture generally, where many customers share one running system the way many renters share one building — each tenant's space is theirs alone, even though the plumbing and wiring underneath are shared. In this LRS, the **District** node is the concrete, named thing that plays the Tenant role: every other structural entity you will meet in this chapter — a school, a course, a section, a student — exists *underneath* some specific district, and the district is what makes "underneath" a hard, enforceable boundary rather than just an organizing label.

Why build the whole system around district-level tenancy rather than, say, school-level or even student-level isolation? Because a district is the real-world unit that already has legal and administrative authority over student data: it is the district that signs a data-privacy agreement, the district that chooses which textbooks its schools use, and the district that a family's rights under FERPA or COPPA are ultimately exercised against. Tying the system's hardest isolation boundary to the district lines the architecture up with where accountability for that data already sits.

!!! mascot-thinking "One word, two jobs"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that "Tenant" and "District" name the same real-world thing from two different angles. **Tenant** is the architectural role — "the top-level isolation boundary," a term you would recognize in any multi-tenant system, from an email provider to a payroll platform. **District** is what that role is called *in this LRS specifically*, with its own graph properties (`district_id`, `name`, `state`, `timezone`). Every district is a tenant; the word you will actually see in this project's diagrams, tables, and code is District.

## The Tenancy Hierarchy: District Down to Student

A single district is not flat. It contains schools, each school offers courses, each course runs in one or more sections, and each section has students enrolled in it. This project's specification names that nested structure the **Tenancy Hierarchy**, and defines it explicitly, level by level:

- A **District** sits at the top as the tenant root.
- A **School** belongs to exactly one district and represents one physical or virtual school building.
- A **Course** belongs to a school and represents a subject offering — "Biology 101," for instance — independent of any particular group of students taking it.
- A **Section** belongs to a course and represents one actual class period or cohort of students taking that course together, such as "Biology 101, Period 3, Fall term."
- An **Enrollment** is not another level so much as the *link* that connects a student to a section — it is the fact that a specific student belongs to a specific section, and it carries its own properties (when the enrollment began, and its current status).

Reading that list top to bottom traces exactly how this project's specification draws the hierarchy: `District → School → Course → Section → Enrollment`. Every one of those entities is stored as structure in the LRS's property graph — the same graph Chapter 5 mentioned as one of the two systems living in the Storage Plane — though this chapter only needs the names and relationships, not the underlying graph mechanics; Chapter 7 covers exactly how the graph represents structure like this.

#### Diagram: This Project's Tenancy Hierarchy

<iframe src="../../sims/tenancy-hierarchy-tree/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>This Project's Tenancy Hierarchy</summary>
Type: graph-model
**sim-id:** tenancy-hierarchy-tree<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/data-science-course/tree/main/docs/sims/data-structure-hierarchy<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Let the learner identify each level of this project's Tenancy Hierarchy, in order, and describe in one sentence what each level represents and which entities live directly beneath it.

Purpose: Render the roster side of the Tenancy Hierarchy from spec §3.1 as a single top-to-bottom Mermaid flowchart, one node per level plus a node representing the Enrollment link between Section and Student.

Nodes, top to bottom:

- "District — the Tenant (hard isolation boundary)"
- "School"
- "Course"
- "Section (a class period / cohort)"
- "Enrollment (Student ↔ Section)" — drawn as a diamond/rhombus node to visually distinguish a relationship from an entity
- "Student (pseudonymous)"

Edges: District to School labeled "HAS_SCHOOL"; School to Course labeled "OFFERS"; Course to Section labeled "HAS_SECTION"; Section to Enrollment and Enrollment to Student both labeled "ENROLLED_IN", showing Enrollment as the connective relationship rather than a strict tree node.

Interactive features: Every node has a Mermaid `click` directive. Clicking "District" opens an infobox defining Tenant and District together, and naming the hard isolation guarantee. Clicking "School," "Course," or "Section" opens an infobox with that level's one-sentence definition and its key graph properties (e.g., Section: `section_id`, `period`, `term`, `academic_year`). Clicking "Enrollment" opens an infobox explaining that it is a relationship, not a level, carrying `enrolled_at` and `status`. Clicking "Student" opens an infobox noting that the Student node is pseudonymous and holds no PII, previewing the identity section later in this chapter.

Color coding: A single top-to-bottom gradient in the book's teal accent color, darkest at District and lightest at Student, echoing the gradient convention established in Chapter 5's System Context Diagram.

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

Two details in that diagram are easy to skim past but matter a great deal. First, a Course is not the same thing as a Section: a course is the *offering* ("Biology 101" as a subject), while a section is one specific *running* of it with real students in real seats. A district can reuse one course definition across a dozen sections without duplicating anything about the course itself. Second, Enrollment is drawn as a relationship rather than another box in the stack, because that is what it structurally is — the fact that connects one Student to one Section, not a level with its own children underneath it.

## Hard Isolation and Soft Isolation

Naming the hierarchy is only half the story; the other half is what the hierarchy *guarantees*. This project's specification assigns a different isolation guarantee to different levels, and the two guarantees are deliberately not the same strength.

**Hard Isolation** applies at exactly one level: the District. The specification is direct about what this means — no query may cross district boundaries, except by explicit system-admin action for cross-district benchmarking, and even then only over de-identified aggregates above a privacy threshold. Hard isolation is not merely a permission check that a developer could accidentally omit; later in this book (Chapter 13) you will see that every query in this system is built through a request-scoped context object that makes it structurally impossible to construct a query with no tenant boundary at all. A district's data does not merely *look* separate from another district's — there is no code path capable of returning it mixed together.

**Soft Isolation** applies to everything nested inside a district: School, Course, and Section. This isolation is enforced by role-based access control rather than a hard architectural wall — a teacher's account is scoped to see only the sections that teacher actually teaches, a school administrator's account is scoped to their one school, and so on. The distinction is not that soft isolation is weaker security; it is that soft isolation is a *policy* enforced by roles and permissions, while hard isolation is a *structural property* of the boundary itself. Two teachers in the same district could, in principle, be granted overlapping section access if a school chose to configure it that way — two districts can never be granted overlapping access to each other's data by any configuration at all.

!!! mascot-warning "Soft does not mean weak"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A natural but wrong reading of "soft isolation" is that school- and section-level boundaries are somehow less secure than the district boundary. They are not insecure — they are enforced differently. Hard isolation is a wall that cannot be reconfigured away. Soft isolation is a fence with gates, and role-based access control decides who holds a key to which gate. Both stop unauthorized access; only one of them makes cross-boundary access architecturally impossible rather than merely unpermitted.

The table below organizes the isolation guarantees for every level named in this chapter, now that hard and soft isolation have both been defined in the prose above.

| Level | Isolation Guarantee | Enforcement Mechanism |
|---|---|---|
| District (Tenant) | **Hard** | No query can cross district boundaries; structurally enforced, not merely permission-checked |
| School | **Soft** | Role-based access control — an account is scoped to its school |
| Course | **Soft** | Role-based access control, inherited from the school scope |
| Section | **Soft** | Role-based access control — a teacher sees only their own sections |

With hard versus soft isolation defined and tabulated, the sorting exercise below is a quick way to check that the distinction has actually landed before moving on to how rosters populate this hierarchy in the first place.

#### Diagram: Sort Each Level into Hard or Soft Isolation

<iframe src="../../sims/hard-vs-soft-isolation-sorter/main.html" width="100%" height="442px" scrolling="no"></iframe>

<details markdown="1">
<summary>Sort Each Level into Hard or Soft Isolation</summary>
Type: microsim
**sim-id:** hard-vs-soft-isolation-sorter<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: classify, sort

Learning objective: Let the learner apply the definitions of Hard Isolation and Soft Isolation by sorting the four Tenancy Hierarchy levels (District, School, Course, Section) into the correct isolation-guarantee bucket.

Canvas layout:

- Top strip: four shuffled draggable tiles, one per level name — "District", "School", "Course", "Section"
- Middle: two labeled drop zones side by side — "Hard Isolation" (left, darkest teal) and "Soft Isolation" (right, lighter teal)
- Bottom strip: score readout ("Sorted: 0 / 4") and a "Check All" button

Visual elements:

- Tiles in a neutral cream color with the level name printed on them
- A tile dropped in its correct zone locks in place with a green outline and a brief checkmark animation
- A tile dropped in the wrong zone bounces back to the top strip with a half-second red flash

Interactive controls:

- Drag-and-drop: drag any tile onto either isolation zone
- Button: "Check All" — validates every placed tile and reveals a one-sentence explanation for any incorrect placement, matching this chapter's prose
- Button: "Reset" — returns all tiles to the top strip

Default parameters: all four tiles unplaced at start, shuffled via a seeded index so the layout is reproducible within a session.

Behavior: on a correct drop, increment "Sorted" and lock the tile; when all four are sorted correctly, display "All four levels sorted — District is the only hard boundary." Clicking any locked tile re-opens an infobox with that level's isolation guarantee and enforcement mechanism, matching the table above.

Implementation notes: p5.js mouse-press/mouse-release drag-and-drop, matching the pattern used in this book's other sorting MicroSims. Responsive design: canvas width tracks the containing element's width; the two drop zones stack vertically at narrow (mobile) widths.
</details>

## Rosters: How Enrollment Data Actually Gets In

Everything in the Tenancy Hierarchy below District — schools, courses, sections, and enrollments — has to come from somewhere, and this project's specification is explicit that it does not come from this LRS itself. A district already keeps its official enrollment records in a **Student Information System**, universally abbreviated **SIS**: the system of record a school or district uses for enrollment, scheduling, grades, and other administrative student records, entirely separate from any learning-content platform. Every school district already runs one, long before it adopts any intelligent textbook, and that system — not the Learning Record Store — remains the authoritative source of who is enrolled in what.

This project's specification states that constraint directly: rosters are ingested via **OneRoster** (Comma-Separated Values, or CSV, files, or a Representational State Transfer, or REST, feed) or other SIS integrations, and the LRS never becomes the authoritative source of student identity. OneRoster is a data-interchange standard, maintained by 1EdTech, purpose-built for exactly this problem: letting a Student Information System hand off its enrollment structure — schools, courses, sections, and who belongs to which section — to another piece of educational software in a predictable, vendor-neutral format. Rather than this project inventing its own roster format and asking every district's SIS vendor to support it, this project speaks a format the SIS side already knows.

That roster data flows in through the **Roster API**, the inbound member of the Analytics Plane's five APIs that Chapter 5 named but did not detail. Where the Analytics, Admin, Experiment, and Export APIs all answer questions by reading what the system already knows, the Roster API's entire job is accepting organizational facts the system cannot infer from statements alone — because no xAPI statement ever says "this student transferred into Section 4," a roster sync does.

!!! mascot-tip "The LRS is a reader of rosters, never their author"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you are ever unsure whether a piece of enrollment data should be edited directly inside this LRS, the answer from the specification is almost always no. A district administrator can review a sync before it applies and can manually override an enrollment with a logged reason, but the *source of truth* stays the district's own SIS. Treat any enrollment record you see in this system as a faithful copy, not an original.

#### Diagram: From Student Information System to Enrollment

<iframe src="../../sims/roster-ingestion-workflow/main.html" width="100%" height="422px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Student Information System to Enrollment</summary>
Type: workflow
**sim-id:** roster-ingestion-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, demonstrate

Learning objective: Let the learner trace how roster data travels from a district's Student Information System, through the OneRoster standard and the Roster API, into School, Course, Section, and Enrollment structure inside this LRS.

Purpose: Show a five-step, left-to-right Mermaid flowchart tracing one roster sync from the district's system of record to materialized Tenancy Hierarchy structure, with a branch showing the dry-run safety check.

Steps:

1. "District's Student Information System holds the official enrollment records" — the authoritative source, entirely outside this LRS
2. "District admin configures a roster source" — a OneRoster REST or CSV endpoint, or another SIS connector, with credentials stored in a secret manager
3. "Roster sync runs on a schedule" — data is exported in OneRoster format
4. "Roster API ingests the sync" — the inbound member of the Analytics Plane's five APIs
5. "School, Course, Section, and Enrollment nodes are created or updated in the Tenancy Hierarchy"

Branch: from step 3, a dashed arrow to a side node "Dry-run diff preview" leading to "District admin reviews added/removed enrollments before the sync is applied — nothing is overwritten silently."

Interactive features: Every node has a Mermaid `click` directive. Clicking step 1 opens an infobox defining Student Information System and stating that the LRS never becomes the authoritative source of student identity. Clicking step 3 opens an infobox defining OneRoster as a 1EdTech data-interchange standard (CSV or REST). Clicking step 4 opens an infobox connecting back to the Roster API's role from Chapter 5. Clicking step 5 opens an infobox listing which Tenancy Hierarchy levels get created or refreshed. Clicking the dry-run branch node opens an infobox explaining the diff-preview safety check.

Color coding: Steps 1-2 (district-owned systems) in a neutral gray to signal "outside this LRS"; steps 3-5 (this LRS's own ingestion path) in the book's teal accent color, consistent with the gradient used in this chapter's other diagrams.

Implementation: Mermaid flowchart, left-to-right orientation, one dashed branch node, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## The Student Node: Present in the Graph, Absent as a Person

Once a roster sync has run, the Tenancy Hierarchy has a Section with real enrolled learners in it — but this project's specification is careful about exactly what "real" means once that data lands inside the LRS. The **Student** node that appears in the graph is deliberately thin: it holds a `student_key`, which is pseudonymous, and a `grade_level`, and this project's specification states plainly that no PII is stored there. Nothing about the Student node — not a name, not an email address, not a roster ID — could, on its own, identify the actual person behind it. The colloquial "student" you picture — a specific twelve-year-old in a specific classroom — and the `Student` node in this LRS's graph are related but not identical: the graph node is a pseudonymized *shadow* of that person, deliberately stripped of anything that would let a reader work backward to who they are.

That design choice did not happen by accident once the system was already built; it is one of the design principles this project committed to from the start, stated as plainly as any other requirement: student identifiers are pseudonymized, and Personally Identifiable Information lives behind a separate access boundary. The rest of this chapter is about the mechanism that makes that principle actually true, statement by statement.

## From a Pseudonymous Account to a Student Key

Every xAPI Statement, as Chapter 1 explained, has an Actor — the learner who performed the experience. But the Actor field that actually arrives at this LRS's Ingestion Gateway is never a student's real name. This project's specification calls what arrives a **Pseudonymous Account**: every actor on the event stream carries an account made of two parts, `account.homePage` and `account.name`, where `homePage` identifies the issuing system (the specific textbook or platform that produced the statement) and `name` is an opaque identifier that system uses for that learner — not a real name, not an email address, just a label the sending system already keeps internally. In other words, the *sending* Learning Record Provider has already agreed never to put a real identity directly on the wire.

That is the first layer of privacy, and this LRS adds a second, independent one. The identity service resolves every incoming Pseudonymous Account to an internal **Student Key** — the pseudonymous identifier this project's specification calls `student_key`, the same value stored on the Student node. The derivation is exact, and this project's design specification states the formula directly:

$$\text{student\_key} = \text{base32}\left(\text{HMAC-SHA256}\left(\text{salt}_{district},\ \texttt{homePage} \,\|\, \texttt{name}\right)[0{:}16]\right)$$

Read in words rather than notation: take the incoming account's `homePage` and `name`, concatenate them, and run them through the Hash-Based Message Authentication Code (HMAC) algorithm keyed by a secret value unique to that one district — the district's **salt**. The first sixteen bytes of that result, encoded in base32, become the `student_key`. Two properties of that formula matter more than the cryptographic detail: it is deterministic (the same learner always derives the same key within one district, so their statements stay linked to one Student node), and it is one-way (there is no formula that runs backward from a `student_key` to recover the original account).

The **per-district salt** is what turns "one-way" into "isolated across districts" as well. Because every district has its own distinct salt, the same physical learner enrolled in two different districts — a student who transfers schools, say — derives two completely unrelated `student_key` values, one per district. Nobody holding only the analytics data, not even someone with a compromised read-only account, could correlate that one learner's activity across two districts, because the two derived keys share no discoverable relationship. This is the concrete mechanism underneath the Hard Isolation guarantee from earlier in this chapter: it holds even against a reader who somehow gained illegitimate access to derived data, not just against an honest query that respects the tenant boundary.

!!! mascot-encourage "You do not need to compute an HMAC by hand"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    That formula can look intimidating the first time you see cryptographic notation on a textbook page, but the idea underneath it is simple: scramble the learner's identity with a district-specific secret, keep only the scrambled result, and throw away nothing except the ability to reverse it. You do not need to run HMAC-SHA256 by hand to understand this system — you need to remember what goes in (a pseudonymous account, plus a district's own salt) and what comes out (a `student_key` that is consistent, but never reversible).

Where does the raw account information go, then, if not into the event store or the graph? It goes to exactly one place, built to hold it and nothing else.

## The PII Vault: Where the Real Mapping Lives

The **PII Vault** is a separate, access-restricted store holding the mapping between a district's roster identity and each learner's `student_key`, along with the per-district salt itself and consent state. This project's design specification is emphatic that this is not merely a separate database schema but a **separate instance** — its own PostgreSQL deployment, its own credentials, its own network policy — because a shared instance would put the entire privacy boundary one accidental permission grant away from collapsing. The only component in this whole system permitted to read from it is the identity service itself; not the Analytics API, not any dashboard, not any report a teacher or administrator can view.

That separation is what makes the earlier claim about the Student node literally true: PII lives behind a separate access boundary means the boundary is architectural, not a promise about how a shared table is queried. It is also what makes the system's right-to-erasure obligation actually achievable. When a district exercises erasure on behalf of a student, the process deletes that student's row from the PII Vault's mapping table and purges the matching event-store rows — and because the salt is per-district and the mapping row is now gone, that student's `student_key` becomes permanently un-derivable. Nobody, including the operators of this LRS, can reconstruct which pseudonymous statements belonged to that learner after that point. What survives are only de-identified aggregates that no longer resolve to any one person.

The list below reinforces the boundary just described, sorting what lives on each side of it now that both halves have been introduced in the prose above.

- **Inside the PII Vault (identity service only):** roster identity records, the district-to-salt mapping, and consent state — the raw material an actual name or roster ID could be recovered from.
- **Inside the graph and event store (everything downstream of the processor):** `student_key` values, `grade_level`, section and enrollment structure, and every statement's pseudonymized actor — nothing an outside reader could use to work backward to a real identity.
- **Never written anywhere durable:** a learner's real name, email address, or raw roster ID, once the identity service has finished resolving a statement's actor.
- **Deleted together on erasure:** the vault mapping row and the matching event-store rows, leaving only de-identified aggregates behind.

#### Diagram: From Pseudonymous Account to Student Key

<iframe src="../../sims/pseudonymization-pipeline/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Pseudonymous Account to Student Key</summary>
Type: infographic
**sim-id:** pseudonymization-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/pseudonymization-pipeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a raw learner identity becomes an irreversible pseudonymous Student Key before anything durable is written, and explain why the PII Vault and the event store never share access.

Purpose: Show a six-step, left-to-right Mermaid flowchart tracing one statement's actor from arrival to its two separate destinations — the derived key going one way, the raw mapping going the other.

Steps:

1. "Learning Record Provider sends a Statement whose Actor is a Pseudonymous Account (`homePage` + `name`)"
2. "Stream Processor's identity step fetches this district's salt over mTLS, cached in memory only"
3. "student_key = base32(HMAC-SHA256(salt, homePage \| name)[0:16])"
4. "student_key is written to the event store and the graph — the account itself never is"

Branch A (from step 1, parallel to step 2): "Raw roster identity ↔ student_key mapping is written to the PII Vault" leading to "PII Vault: separate PostgreSQL instance, identity service only"

Branch B (from the PII Vault node): "Erasure request" leading to "Vault mapping row deleted → student_key permanently un-derivable"

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-4 opens an infobox matching this chapter's prose explanation of Pseudonymous Account and Student Key. Clicking the PII Vault node opens an infobox stating it is a separate instance, not a separate schema, reachable only by the identity service. Clicking the erasure node opens an infobox explaining the right-to-erasure mechanism.

Color coding: The derived-key path (steps 1-4) in the book's teal accent color; the PII Vault branch in a contrasting amber to visually flag that it is a separate, restricted-access path, consistent with the amber-for-inbound convention used for the Roster API in Chapter 5.

Implementation: Mermaid flowchart, left-to-right orientation with one branching path, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
</details>

## One Statement's Journey Through Tenancy and Identity

With every concept in this chapter now introduced, it helps to trace one statement's complete path as a self-check before moving to Chapter 7 — the same kind of cause-and-effect walkthrough Chapters 1 and 5 both closed with.

1. A district's Student Information System is the authoritative source of who is enrolled where; a OneRoster sync copies that structure — School, Course, Section, Enrollment — into this LRS through the Roster API.
2. A student in that section opens an intelligent textbook, which constructs an xAPI Statement whose Actor is a Pseudonymous Account: a `homePage` and an opaque `name`, never the student's real identity.
3. The Ingestion Gateway accepts the statement structurally, without resolving the actor at all, and queues it — exactly as Chapter 5 described.
4. The Stream Processor's identity step resolves the Pseudonymous Account to a Student Key using that district's own salt; the raw account, separately, is recorded only in the PII Vault.
5. Everything written to the event store and the graph from this point forward — the enriched statement, the Student node, any later summary — carries the Student Key and nothing that could identify the learner directly.
6. Because the District is a Hard Isolation boundary and every district's salt is unique, this student's activity can never be correlated with the same student's activity in a different district without vault access.

## Key Takeaways

- A **Tenant** is the top-level isolation boundary in this LRS, and a **District** is the concrete entity that plays that role.
- The **Tenancy Hierarchy** nests `District → School → Course → Section`, with **Enrollment** as the relationship linking a Student to a Section.
- **Hard Isolation** applies only at the District level — no query can cross it; **Soft Isolation** governs School, Course, and Section through role-based access control.
- A **Student Information System (SIS)** remains the authoritative source of enrollment; this LRS never displaces it.
- **OneRoster** is the standard format — CSV or REST — that carries roster structure from a district's SIS into this LRS's Roster API.
- The **Student** node in the graph is pseudonymous by design and stores no PII, even though it represents a real learner.
- A **Pseudonymous Account** (`homePage` + `name`) is what actually arrives on the event stream — never a real identity.
- A **Student Key** is the district-salted, one-way HMAC derivation of that account — consistent for one learner within one district, unrecoverable outside it.
- The **PII Vault** is a separate, access-restricted store holding the real roster-identity mapping, reachable only by the identity service, and is what makes right-to-erasure actually possible.

!!! mascot-celebration "You just watched a real name disappear on purpose"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    That is exactly what this chapter was building toward: a real student, in a real district, producing real evidence of learning — while this LRS itself never durably stores who they are. What does the evidence show? The tenancy hierarchy and the pseudonymization pipeline together answer "whose data is this" and "who can never be re-identified from it" at the same time. Next, in [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md), we open up the graph itself and see exactly how District, School, Section, Student, and everything else in this chapter is actually represented as nodes and relationships.
