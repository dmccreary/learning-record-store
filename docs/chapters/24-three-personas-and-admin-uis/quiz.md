---
title: "Quiz: Meet the Three Personas and the Admin UI Surface"
description: Review questions on the District Administrator, Teacher, and Textbook Author personas, the six formal access-control roles, and the nine administrative user interfaces they use.
social:
   cards: false
---
# Quiz: Meet the Three Personas and the Admin UI Surface

Test your understanding of this project's three personas, six roles, and nine administrative user interfaces with these review questions.

---

#### 1. What is the District Administrator persona's primary goal, as this chapter defines it?

<div class="upper-alpha" markdown>
1. Coverage and compliance — knowing which schools have adopted which textbooks and whether privacy obligations are actually being met
2. Intervention — knowing which student is stuck on which concept early enough to help
3. Evidence — knowing whether a specific content change actually improved learning
4. Read-only verification that everyone else followed the rules
</div>

??? question "Show Answer"
    The correct answer is **A**. The District Administrator's goal is coverage and compliance across an entire school system's rollout. B describes the Teacher's goal instead. C describes the Textbook Author's goal. D describes the unrelated Auditor Role, which is not one of the three primary personas.

    **Concept Tested:** District Administrator

    **See:** [Three People, Three Goals](index.md#three-people-three-goals)

---

#### 2. How does the specification's formal role name "Author / Curriculum" map onto this book's persona vocabulary?

<div class="upper-alpha" markdown>
1. It maps to the System Administrator, since content authoring requires platform-wide access
2. It maps to the Auditor Role, since content review is a form of auditing
3. It does not map to any persona this book covers; it is a role unique to the specification
4. It maps to the Textbook Author, the same role relabeled for a non-technical reader
</div>

??? question "Show Answer"
    The correct answer is **D**. "Author / Curriculum" is the specification's formal name for exactly the role this book calls the Textbook Author — nothing is split or lost in the relabeling. A and B each misattribute the mapping to an unrelated role. C is false; the chapter explicitly provides this mapping.

    **Concept Tested:** Textbook Author

    **See:** [Naming the Roles Precisely](index.md#naming-the-roles-precisely)

---

#### 3. How does a School Administrator's scope relate to a District Administrator's scope?

<div class="upper-alpha" markdown>
1. A School Administrator's authority is broader, covering every school in the district, while a District Administrator is limited to one school
2. The two roles have completely unrelated, non-overlapping scopes with no containment relationship
3. A District Administrator's authority contains a School Administrator's — the District Administrator can do everything a School Administrator in their district can do, plus more, but the reverse never holds
4. A School Administrator and a District Administrator have identical scope and capabilities
</div>

??? question "Show Answer"
    The correct answer is **C**. The District Administrator's authority is a strict superset of a School Administrator's within that district — the nested-authority chain the chapter describes explicitly. A reverses the actual containment direction. B contradicts the chapter's description of a nested hierarchy. D ignores the real scope difference between one school and an entire district.

    **Concept Tested:** School Administrator

    **See:** [Naming the Roles Precisely](index.md#naming-the-roles-precisely)

---

#### 4. What distinguishes the Auditor Role from every other role in this chapter's table?

<div class="upper-alpha" markdown>
1. It is the only role with global, cross-district scope
2. It is deliberately the most limited of all six roles — read-only access to audit logs and access records, with no ability to view student data, change configuration, or approve anything
3. It is the only role that can create new districts
4. It is the only role that also appears as a persona in the course description, alongside the three primary personas
</div>

??? question "Show Answer"
    The correct answer is **B**. The Auditor Role is deliberately the most limited role, restricted to read-only review of audit logs and access records. A and C both describe the System Administrator instead. D is false — the Auditor Role is one of the three supporting roles, not one of the three primary personas.

    **Concept Tested:** Auditor Role

    **See:** [Naming the Roles Precisely](index.md#naming-the-roles-precisely)

---

#### 5. A teacher wants to see which of their students is struggling with a concept, while a district administrator wants to change which textbook version is deployed to a section. Which of these two requests uses a dashboard, and which uses an admin UI, according to this chapter's distinction?

<div class="upper-alpha" markdown>
1. Both requests use the same admin UI, since both are viewing screens built into the LRS
2. The teacher's request uses an admin UI, since viewing student data always requires elevated access; the district administrator's request uses a dashboard
3. Neither request uses a dashboard or an admin UI; both are handled directly through the Analytics API without any UI at all
4. The teacher's request uses a dashboard (what the data shows); the district administrator's request uses an admin UI (how the system is configured) — two architecturally separate systems
</div>

??? question "Show Answer"
    The correct answer is **D**. Dashboards answer "what does the data show," while admin UIs answer "how is the system configured" — two architecturally separate systems, exactly matching the teacher's viewing request versus the administrator's configuration change. A wrongly collapses two distinct systems into one. B reverses which request needs which kind of screen. C ignores that both requests are in fact served through dedicated interfaces.

    **Concept Tested:** District Management UI (dashboard vs. admin UI distinction)

    **See:** [A Survey of the Nine Admin UIs](index.md#a-survey-of-the-nine-admin-uis)

---

#### 6. A district administrator needs to bind a specific textbook version to several sections and also needs to resolve a queue of provisionally auto-registered textbooks. Which admin UI is built for this task?

<div class="upper-alpha" markdown>
1. xAPI Credentials UI
2. System Configuration UI
3. Textbook Deployment UI
4. School Course Section UI
</div>

??? question "Show Answer"
    The correct answer is **C**. The Textbook Deployment UI is exactly where a District Administrator binds textbook versions to sections and works through the queue of provisionally auto-registered textbooks. A handles ingestion credentials, an unrelated task. B sets platform-wide defaults, not textbook deployment. D manages schools, courses, and sections, not textbook version binding.

    **Concept Tested:** Textbook Deployment UI

    **See:** [A Survey of the Nine Admin UIs](index.md#a-survey-of-the-nine-admin-uis)

---

#### 7. Why does this chapter warn that "a role just decides which buttons a person sees" is a tempting but wrong mental model for how RBAC actually works in this system?

<div class="upper-alpha" markdown>
1. Because RBAC is enforced at the API layer, the same layer every admin UI calls, so hiding a button from a School Administrator in the UI would not stop that same person from calling the underlying Admin API directly and bypassing the restriction
2. Because this LRS has no user interface at all, only a command-line tool
3. Because every role, including the Auditor Role, can see every button regardless of permission
4. Because button visibility is determined randomly rather than by role
</div>

??? question "Show Answer"
    The correct answer is **A**. RBAC enforcement happens at the API layer, so a UI-level restriction alone would not stop a determined user from reaching restricted data or actions by calling the Admin API directly. B contradicts the chapter's entire focus on admin UIs as real interfaces. C and D each invent a behavior that contradicts the whole point of role-based access control.

    **Concept Tested:** District Management UI (RBAC enforcement)

    **See:** [Naming the Roles Precisely](index.md#naming-the-roles-precisely)

---

#### 8. Why does the cross-persona workflow example — one student's correct MicroSim answer feeding the Teacher's mastery view, the District Administrator's adoption view, and the Textbook Author's effectiveness view — demonstrate that this LRS does not need three separate data pipelines?

<div class="upper-alpha" markdown>
1. Because only the Teacher's view actually uses the Statement; the other two views are computed from unrelated synthetic data
2. Because the same single ingested Statement is read by three independent aggregations that differ only in scope and query, not in which underlying data or pipeline produced them — the fan-out happens after ingestion, not before it
3. Because the three views are generated on three different days, one after another, using the same pipeline sequentially
4. Because the District Administrator's view and the Textbook Author's view are actually the same screen shown to different people
</div>

??? question "Show Answer"
    The correct answer is **B**. The Statement is ingested exactly once, and the fan-out into three persona-specific aggregations happens entirely after ingestion, differing only in scope and query rather than in any underlying pipeline. A wrongly claims two of the three views ignore the actual Statement. C invents a sequential, day-by-day processing order the chapter never describes. D wrongly collapses two distinct screens into one.

    **Concept Tested:** Cross-Persona Workflow

    **See:** [One Statement, Three Reports: A Cross-Persona Workflow](index.md#one-statement-three-reports-a-cross-persona-workflow)

---

#### 9. A vendor proposes that this LRS meet its access-control obligations by simply hiding administrative menu items from users without the right role, arguing this is sufficient because "regular users would never find those screens anyway." Evaluate this proposal against what this chapter establishes about RBAC enforcement.

<div class="upper-alpha" markdown>
1. The proposal is adequate, since hiding menu items is the same protection this chapter describes for every admin UI
2. The proposal is adequate as long as the hidden menu items are also removed from the page's HTML source entirely
3. The proposal is insufficient, because this chapter is explicit that RBAC must be enforced at the API layer that every admin UI calls, not merely at the screen layer — a hidden button does not stop a determined user from calling the Admin API directly and reaching data or actions their role should not permit
4. The proposal is insufficient only for the System Administrator role; for every other role, UI-level hiding is judged sufficient
</div>

??? question "Show Answer"
    The correct answer is **C**. The chapter is explicit that hiding a screen element is not the enforcement mechanism — permission has to be checked where the data actually moves, at the API layer, or a determined user could call the Admin API directly and bypass a merely hidden button. A directly contradicts the chapter's stated position. B proposes a partial fix that still leaves the API itself unprotected. D invents a role-specific exemption the chapter never makes; the enforcement principle applies uniformly across roles.

    **Concept Tested:** District Management UI (RBAC enforcement, evaluated)

    **See:** [Naming the Roles Precisely](index.md#naming-the-roles-precisely)

---

#### 10. A new project wants to design a minimal set of role-to-UI access grants for a hypothetical "Regional Coordinator" who oversees several districts (broader than a District Administrator but narrower than the System Administrator's full global scope) and needs to review privacy compliance and textbook deployment status across those districts, without being able to create new districts or change platform-wide defaults. Based on this chapter's existing role-and-UI pattern, which combination of existing UI access would most closely approximate this new role's needs?

<div class="upper-alpha" markdown>
1. Grant access to the District Management UI and System Configuration UI only, since those are the highest-scope screens
2. Grant read access scoped to a subset of districts on the Privacy Compliance UI and the Textbook Deployment UI, mirroring how a District Administrator already uses both, but without the System Administrator's district-creation or platform-wide configuration capabilities
3. Grant access to the Audit Monitoring UI only, since auditing covers all necessary compliance needs
4. Grant full System Administrator access, since any multi-district role requires global scope
</div>

??? question "Show Answer"
    The correct answer is **B**. This design reuses the two UIs whose purpose already matches the coordinator's stated needs — privacy compliance and textbook deployment — scoped to a multi-district set rather than one district, while deliberately excluding the district-creation and platform-wide configuration capabilities the scenario explicitly rules out. A grants two UIs unrelated to the actual stated needs. C narrows the role to auditing only, dropping the compliance and deployment tasks the scenario requires. D grants far more authority than the scenario calls for, including capabilities explicitly excluded.

    **Concept Tested:** Privacy Compliance UI / Textbook Deployment UI (role design synthesis)

---
