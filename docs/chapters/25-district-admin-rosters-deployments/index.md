---
title: District Administrator: Rosters, Deployments, and Registries
description: A hands-on tour of the District Management UI, School/Course/Section UI, and Textbook Deployment UI — the three screens a district administrator uses to configure rosters, run enrollment, and bind textbook versions to classrooms.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 14:25:54
version: 0.09
---

# District Administrator: Rosters, Deployments, and Registries

## Summary

This chapter follows a district administrator through day-to-day operational work: configuring roster and retention policy, managing enrollment and term rollovers, binding textbook deployments, and working the provisional-reconciliation queue and MicroSim registry.

## Concepts Covered

This chapter covers the following 14 concepts from the learning graph:

1. Roster Source Configuration
2. Data Residency Policy
3. Retention Policy
4. Legal Hold Toggle
5. Enrollment Editor
6. Instructor Assignment Tool
7. Term Academic Year Rollover
8. Deployment Editor
9. Provisional Reconcile Queue
10. MicroSim Registry View
11. Endpoint Key Rotation
12. Verb Vocabulary Browser
13. Dead-Letter Inspector
14. Experiment List View

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)
- [Chapter 18: Configuration, Migration, Backup, and Rollout](../18-config-migration-backup-rollout/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)

---

!!! mascot-welcome "From Survey to Screen"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 24 handed you a map: three personas, six roles, nine admin UIs, one shared statement log. This chapter puts you at the keyboard. We are going deep on the first three admin UIs a District Administrator actually opens — the District Management UI, the School / Course / Section UI, and the Textbook Deployment UI — and we are going to use the specification's exact field names the whole way through, because those are the fields you would see on the real screen. Let's follow the record.

A District Administrator's job starts before a single student ever opens a textbook. Someone has to tell the Learning Record Store (LRS) that a district exists, connect it to the roster system that already knows which students are enrolled where, and decide which textbook version each section will actually see. None of that work touches an xAPI Statement directly — it is entirely configuration — but every Statement that flows through this project's LRS afterward depends on it having been done correctly. Get the roster connection wrong, and enrollment counts drift from reality; get a deployment binding wrong, and a section's dashboard shows the wrong textbook's data. This chapter follows that configuration work in the order a District Administrator actually performs it: stand up the district, run the building day to day, and bind textbooks to classrooms.

## The Tenancy Hierarchy This Chapter Operates On

Every screen in this chapter edits some layer of the same nested structure. A **District** is the hard tenant boundary — no query is allowed to cross from one district into another except an explicit, de-identified system-wide benchmark a System Administrator runs. Inside a district sit one or more **Schools**, each offering one or more **Courses**, each course divided into one or more **Sections** — a single class period or cohort, identified by its period, term, and academic year. A **Section** is where the tenancy hierarchy meets real people: students join a section through an **Enrollment**, and a section is where a **Textbook Version** actually gets deployed for a group of learners to use.

That nesting is soft below the district line and hard at it. District isolation is enforced everywhere; school, course, and section boundaries are enforced by role scope rather than by a hard wall, which is why a School Administrator can see every section in their building but a Teacher sees only the sections they personally teach. Holding this hierarchy in view before opening any single screen matters, because every field name introduced in the rest of this chapter — roster source, enrollment, deployment — is really just a way of writing to, or reading from, one layer of this same structure.

#### Diagram: District Tenancy Hierarchy Explorer

<iframe src="../../sims/district-tenancy-hierarchy-explorer/main.html" width="100%" height="622px" scrolling="no"></iframe>

<details markdown="1">
<summary>District Tenancy Hierarchy Explorer</summary>
Type: graph-model
**sim-id:** district-tenancy-hierarchy-explorer<br/>
**Library:** vis-network<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/search-microsims/tree/main/docs/sims/subject-taxonomy-explorer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Identify the nested tenancy hierarchy a District Administrator operates within — District, School, Course, Section, Enrollment — and distinguish the hard isolation boundary at the district level from the soft, role-scoped boundaries below it.

Purpose: A vis-network hierarchical graph rooted at one District node, branching down through School, Course, Section, to Enrollment, with a separate branch showing a Textbook Version deployed onto a Section.

Nodes: One root "District" node. Two child "School" nodes. Each School has two child "Course" nodes. Each Course has two child "Section" nodes. Each Section has three child "Enrollment" nodes (representing students) and one dashed edge labeled "DEPLOYS" to a shared "Textbook Version" node drawn off to the side.

Interactive features: Clicking the District node opens an infobox stating the hard isolation guarantee — no cross-district query without explicit, de-identified system-admin benchmarking. Clicking any School, Course, or Section node opens an infobox naming that node's key properties from the graph data model (school_id/name/grade_band; course_id/title/subject; section_id/period/term/academic_year) and noting the boundary here is soft, enforced by role scope. Clicking an Enrollment node opens an infobox defining enrollment as the student-to-section relationship. Clicking the Textbook Version node or the DEPLOYS edge opens an infobox previewing the Textbook Deployment UI section later in this chapter.

Color coding: The District node in a saturated teal to mark the hard boundary; School, Course, Section, and Enrollment nodes in graduated lighter shades of the same hue to show they nest inside it; the Textbook Version node and DEPLOYS edge in amber to visually separate "who a student is" from "what content they see."

Responsive design: Hierarchical layout re-centers on window resize using vis-network's built-in layout engine; on narrow viewports the tree renders top-to-bottom rather than left-to-right and remains pannable.
</details>

!!! mascot-thinking "Four Screens, One Underlying Graph"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that nothing about this hierarchy is unique to any one admin UI. The District Management UI edits the District node itself. The School Course Section UI edits everything from School down through Enrollment. The Textbook Deployment UI edits the DEPLOYS edge and everything attached to it. Three different screens, one shared graph — which is exactly the same lesson Chapter 24 taught about dashboards, applied here to configuration instead of analytics.

## The District Management UI: Standing Up and Configuring a District

The **District Management UI** is the single highest-scope screen in the entire admin surface, reserved for the System Administrator role alone — not even a District Administrator can create the district they will go on to manage. Its list/create/edit form captures a district's `district_id`, name, state, and timezone, alongside a privacy-policy profile, an experimentation opt-in flag, and a retention policy. Once a district exists, a District Administrator's actual day-to-day time here goes to two things: telling the LRS where student and enrollment data comes from, and deciding how long that data sticks around.

**Roster Source Configuration** is how a district tells the LRS where its students, schools, and sections actually live. Recall from Chapter 6 that the LRS never becomes the authoritative source of student identity — it ingests rosters from somewhere else. This screen configures that connection: a OneRoster REST or CSV endpoint, or a direct Student Information System (SIS) connector, along with the credentials that connection needs. Those credentials are stored in a secret manager and never displayed back to an administrator once saved — the screen shows only that a credential exists and when it was last rotated, never its value. The screen also sets a sync schedule and shows a last-sync status so an administrator can tell at a glance whether last night's sync succeeded.

The single most consequential control on this screen runs before any sync actually writes anything: a **dry-run preview of roster diffs**. Rather than applying a roster sync blind, the District Management UI computes what would change — which students would be added, removed, or moved between sections — and shows that diff to the administrator before anything is committed. This matters because roster data seeds a large share of what the graph tracks: approve a bad dry-run anyway, and the mistake propagates into enrollments, sections, and eventually every SectionRollup computed from them.

!!! mascot-tip "Read the Diff Like a Pull Request"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A practicing district administrator treats the roster dry-run preview the way a software engineer treats a pull-request diff before merging: read every removal line, not just the additions. A student who disappears from a diff because they transferred schools is normal; a student who disappears because a SIS export glitched and dropped half a grade level is not, and the only way to catch the difference is to actually read the diff instead of clicking "apply" on reflex.

The **dry-run preview** itself follows a predictable sequence every time it runs, and it is worth naming that sequence explicitly since it is the same four steps regardless of whether the source is a OneRoster CSV drop or a live SIS connector.

1. Pull the latest roster export from the configured OneRoster or SIS source.
2. Compute a diff against the LRS's current School, Course, Section, and Enrollment records.
3. Present the diff — additions, removals, and renames — for the administrator to review, with nothing yet written.
4. On explicit approval, apply the diff and update the last-sync status; on rejection, discard the computed diff and leave existing records untouched.

Two more controls round out this screen, both governing how long data lives rather than where it comes from. The **Retention Policy** sets a per-district retention window and an accompanying purge schedule — how long statements and their summaries are kept before permanent deletion. The **Legal Hold Toggle** is a deliberate override on top of that window: switched on for a district, school, or specific record set, it suspends the scheduled purge entirely. A legal hold exists for the rare but real case — a dispute, an investigation, a records request — where deleting data on schedule would be actively harmful rather than routine housekeeping.

!!! mascot-warning "A Legal Hold Overrides Retention, It Does Not Replace It"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is easy to conflate these two controls because they both appear on the same screen and both talk about how long data survives. They are not the same lever. Retention Policy is the everyday, scheduled rule; the Legal Hold Toggle is an exception switch that pauses that rule for specific records without changing the underlying policy itself. Turning off a legal hold does not delete anything immediately — it simply lets the existing retention schedule resume from wherever it left off.

Bringing roster configuration and retention together on one mock screen makes the relationship between them easier to see than reading the four controls as separate paragraphs.

#### Diagram: District Management UI Mock Dashboard

<iframe src="../../sims/district-management-ui-mockup/main.html" width="100%" height="502px" scrolling="no"></iframe>

<details markdown="1">
<summary>District Management UI Mock Dashboard</summary>
Type: infographic
**sim-id:** district-management-ui-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, demonstrate

Learning objective: Operate a realistic mock-up of the District Management UI, locating each of the four fields this section explains — Roster Source Configuration, Data Residency Policy, Retention Policy, and Legal Hold Toggle — within a plausible screen layout rather than a bulleted description.

Canvas layout: A mock admin-screen rendered as a bordered browser-window frame with a left navigation rail (showing "Districts > Riverbend Unified" as breadcrumb) and a main panel divided into four labeled cards: "Roster Source," "Data Residency," "Retention Policy," and "Legal Hold."

Visual elements: The "Roster Source" card shows a masked credential field ("SIS Connector Key: ••••••••••42a1"), a sync-schedule dropdown reading "Nightly, 02:00 local," and a "Last sync: Success, 6 hours ago" status chip in green. A "Preview Roster Diff" button sits below it. The "Data Residency" card shows a region selector reading "US-East" with a note "district data stored and processed in-region." The "Retention Policy" card shows a slider reading "Retention window: 5 years" and a "Next purge: 2027-01-15" readout. The "Legal Hold" card shows a toggle switch, currently off, with the label "No active holds" in gray; clicking it flips the toggle to "1 record set on hold" in amber.

Interactive controls: A p5.js button labeled "Preview Roster Diff" opens a slide-out panel listing three mock diff rows (two additions in green, one removal in red) with an "Approve" and "Discard" button, directly demonstrating the four-step dry-run sequence from this chapter's prose. Clicking the Legal Hold toggle demonstrates that flipping it does not alter the Retention Policy card's numbers, reinforcing that a legal hold suspends rather than replaces the retention schedule. Hovering any card header shows a tooltip with that field's one-sentence definition from this chapter's prose.

Default state: All four cards collapsed to their summary view; Legal Hold off; no diff panel open.

Behavior: Clicking "Preview Roster Diff" expands the diff panel with a smooth slide-in transition; clicking "Approve" updates the "Last sync" chip to "Success, just now"; clicking "Discard" closes the panel with no change to sync status.

Implementation notes: Use p5.js `createButton()` for "Preview Roster Diff," "Approve," and "Discard," and a custom toggle drawn with `rect()` and mouse-press detection for Legal Hold, per this project's convention of using p5.js's built-in controls wherever a native equivalent exists.

Responsive design: The four-card grid collapses from a 2x2 layout to a single stacked column on narrow viewports; the diff slide-out panel becomes a full-width overlay instead of a side panel below 600px width.
</details>

## The School / Course / Section UI: Running the Building Day to Day

Where the District Management UI is a screen a District Administrator visits occasionally — mostly at setup and whenever the roster connection needs attention — the **School / Course / Section UI** (shortened, as Chapter 24 established, to the **School Course Section UI**) is where a District or School Administrator spends routine, week-to-week time. It provides full Create, Read, Update, and Delete (CRUD) capability for schools, courses, and sections, with bulk import directly from a roster sync, so a district that just enrolled four hundred new students in August does not need four hundred manual entries.

Three tools inside this screen do most of the operational work. The **Enrollment Editor** adds and removes students from sections. Most changes arrive automatically from the roster sync, but the editor also supports a manual override for the exceptional case — a late transfer, a scheduling correction — and every manual override requires a logged reason, so an audit trail exists for changes that did not come from the roster system of record. The **Instructor Assignment Tool** creates the `TEACHES` relationship between an Instructor and a Section and explicitly supports co-teachers, so two instructors can share responsibility for one section without either being recorded as a mere assistant.

The third tool, **Term / Academic-Year Rollover**, handles the one event every school experiences on a predictable calendar: the end of a term or academic year. Rather than forcing an administrator to rebuild every course and section from scratch each fall, this tool archives the prior term's sections — preserving their historical data intact — and rolls section templates forward into the new term, so a course that existed as "Biology 101, Period 3" last year starts the new year with the same shape, ready for a fresh roster of enrollments and a (possibly reassigned) instructor.

Don't read the phrase "manual override with reason logged" as the system tolerating a mistake. It is a deliberate design choice: roster-driven enrollment handles the overwhelming majority of cases correctly, and the Enrollment Editor's manual path exists precisely for the minority of real-world situations no automated sync can anticipate — a student who needs to join a section mid-term for a documented accommodation, for instance. The reason field is what turns that exception into an auditable, defensible decision rather than an untracked one.

A term rollover is easier to picture as a sequence of dated events than as a single abstract action, which is exactly what a timeline is for.

#### Diagram: Term Rollover Timeline

<iframe src="../../sims/term-rollover-timeline/main.html" width="100%" height="422px" scrolling="no"></iframe>

<details markdown="1">
<summary>Term Rollover Timeline</summary>
Type: timeline
**sim-id:** term-rollover-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the steps of a Term / Academic-Year Rollover, from archiving the outgoing term through rolling section templates forward into the new one, and see where the Enrollment Editor and Instructor Assignment Tool fit into that sequence.

Time period: One academic year cycle, late May through early September

Orientation: Horizontal, left to right

Events:

- Late May: Spring term's sections marked for archival; historical enrollment and rollup data frozen and preserved
- Early June: Prior-term sections archived; read-only from this point forward
- Mid-June: Section templates for the upcoming term generated from the archived shapes (same course, same period structure)
- July: New roster sync populates the upcoming term's Enrollment Editor with incoming students
- Mid-August: Instructor Assignment Tool used to confirm or reassign `TEACHES` edges for the new term, including any co-teacher pairings
- Early September: New term goes live; sections begin accepting Textbook Deployment bindings and ingesting statements

Interactive features: Clicking any milestone opens an infobox describing what changed at that step and which tool (Enrollment Editor, Instructor Assignment Tool, or the rollover mechanism itself) is responsible for it, plus a note on which prior-term data remains queryable afterward.

Visual style: Archived-term milestones shown in a muted gray; new-term milestones shown in the book's teal accent color, so a learner can see at a glance which side of the rollover each event falls on.

Responsive design: Timeline resizes to its containing element's width and remains readable at tablet width, collapsing event labels to abbreviated form below 600px.
</details>

## The Textbook Deployment UI: Binding Content to Classrooms

The third screen this chapter covers in depth is the specification's **Textbook & Deployment Management UI**, shortened to the **Textbook Deployment UI**. Where the previous two screens manage people and organizational structure, this one manages content — which version of which textbook a given section sees, and how newly-arriving textbook data gets folded cleanly into that structure over time.

The screen's **textbook registry** lists every `Textbook` definition the LRS knows about, along with each of its `TextbookVersion`s, and prominently surfaces each entry's reconciliation status: **provisional** or **reconciled**. That distinction should be familiar — Chapter 8 already explained the mechanism behind it under the name Accept-First Ingestion: a brand-new textbook or version can start emitting xAPI Statements the moment it launches, with the Stream Processor auto-provisioning a stub `Textbook`, `TextbookVersion`, `MicroSim`, and `Concept` node marked `provisional: true` on first sight, and a Reconciliation Worker later matching those stubs against the textbook's real published metadata. This chapter's job is narrower than Chapter 8's: it describes the screen a District Administrator uses to *see and act on* that process, not the pipeline mechanics behind it.

That screen is the **Provisional Reconcile Queue** — a work list of every auto-provisioned stub still waiting for its metadata match. For each entry, the queue offers a one-click "accept auto-match" when the Reconciliation Worker has already found a confident candidate, or a manual mapping path for the rarer case where an administrator needs to point a stub at the correct published textbook themselves. Working this queue regularly is what keeps the accept-first ingestion model clean over time — statements about a not-yet-reconciled MicroSim are never lost, but they also are not richly queryable by title, concept coverage, or version until something promotes that stub out of the queue.

The **Deployment Editor** is the screen's other core tool: it binds a specific `TextbookVersion` to one or more sections or courses, creating the `DEPLOYS` relationship this chapter's tenancy diagram already previewed, and it schedules version rollovers — moving a section from one textbook version to a newer one on a chosen date rather than instantly, so a class does not change textbooks mid-lesson.

Rounding out the screen, the **MicroSim Registry View** lists every MicroSim and its versions per textbook, together with a `status` field drawn from exactly three values.

| Status | Meaning |
|---|---|
| scaffold | The MicroSim's structure exists but its interactive behavior is not yet built. |
| built | The MicroSim is functional and emitting statements, but has not yet been reviewed. |
| approved | The MicroSim has been reviewed and is considered production-ready for classroom use. |

The registry view also links each MicroSim to its utilization data, so a District Administrator can see not just that a MicroSim exists, but whether sections are actually using it.

These two screens sit side by side and both use a status word that starts near the beginning of the alphabet, which invites confusion. A `provisional: true` flag describes a *node the pipeline auto-created because a statement mentioned it* — it is about how the record entered the graph. A `scaffold` status describes *how finished a MicroSim's actual build is* — it is about the content's maturity. A MicroSim can be fully `approved` and still show up as `provisional` for a few minutes if its very first statement just arrived; the two fields answer completely different questions.

Watching one stub move from arrival to promotion in the Provisional Reconcile Queue, specifically as an administrator would see it on this screen, is worth tracing as its own diagram.

#### Diagram: Provisional Reconcile Queue Workflow

<iframe src="../../sims/provisional-reconcile-queue-workflow/main.html" width="100%" height="642px" scrolling="no"></iframe>

<details markdown="1">
<summary>Provisional Reconcile Queue Workflow</summary>
Type: workflow
**sim-id:** provisional-reconcile-queue-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, resolve

Learning objective: Operate the Provisional Reconcile Queue as a District Administrator would — reviewing a queued entry, choosing between one-click accept and manual mapping — and connect that screen-level action to the underlying promotion from provisional to reconciled that Chapter 8 already explained.

Purpose: A Mermaid flowchart showing the queue's decision path for a single provisional stub, starting where Chapter 8's ingestion mechanics leave off.

Flow: "Stub appears in Provisional Reconcile Queue (provisional: true)" -> "Reconciliation Worker suggests a candidate match?" -- branches into two paths.

Path A (confident match found): "Confident candidate shown" -> "Administrator clicks 'Accept Auto-Match'" -> "Stub promoted to provisional: false; COVERS/EMBEDS/DEPENDS_ON back-filled."

Path B (no confident match): "No confident candidate" -> "Administrator opens Manual Mapping" -> "Administrator selects the correct published Textbook/TextbookVersion/MicroSim/Concept" -> "Stub promoted to provisional: false; COVERS/EMBEDS/DEPENDS_ON back-filled."

Both paths converge on: "Entry removed from queue; historical statements about this stub become richly queryable retroactively."

Interactive features: Every node has a Mermaid `click` directive. Clicking the initial stub node opens an infobox linking back to Chapter 8's Accept-First Ingestion and Provisional Node definitions. Clicking either branch condition opens an infobox explaining what "confident" means (a match by git_sha, then IRI path, then title similarity, per Chapter 8). Clicking either promotion node opens an infobox naming the three relationship types being back-filled. Clicking the final convergence node opens an infobox restating the no-data-loss guarantee from Chapter 8's ingestion mechanics.

Color coding: Path A (auto-match) in the book's teal accent color to signal the common, low-effort case; Path B (manual mapping) in amber to signal the less common case that needs administrator judgment; the shared convergence node in a neutral gray.

Responsive design: Flowchart reflows to a single vertical column on narrow viewports, keeping branch labels legible and click targets tap-sized.
</details>

## Rounding Out the Surface: Credentials, Vocabulary, and Experiments at a Glance

Three more concepts belong in this chapter, not because they get the same depth as the three screens above, but because a District Administrator brushes against them while working the screens already described, and Chapter 24 promised they would be introduced here before being revisited more briefly elsewhere in the book.

The **xAPI Endpoint & Credentials UI** is where a District Administrator handles two related but distinct jobs. **Endpoint Key Rotation** issues and rotates the per-textbook or per-district ingest credentials — OAuth 2.0 client credentials or scoped bearer tokens — that a Learning Record Provider needs to submit statements at all; like the roster credentials on the District Management UI, a rotated key is shown once at creation and masked forever after. The same screen hosts a **Verb Vocabulary Browser**: a searchable view of the controlled Verb vocabulary Chapter 7 catalogued, alongside a list of unknown verbs and activities the Schema-On-Read path has accepted from the live stream, each with a count, so an administrator can decide whether an unfamiliar verb deserves to be canonicalized into the controlled vocabulary or simply ignored as noise. A third feature on this same screen, the **Dead-Letter Inspector**, lets an administrator browse statements that failed structural validation and landed in the dead-letter queue — shown in redacted form — with the ability to replay a statement back through ingestion once whatever made it malformed has been fixed upstream.

The **Experiment Administration UI** belongs mostly to the Textbook Author persona, and its full design, launch, and governance workflow is out of scope for this chapter. But its **Experiment List View** — the simple table of every experiment's status (draft, running, paused, or concluded), owner, primary metric, and current effect estimate — is visible to a District Administrator too, because a district that has opted into experimentation, via the flag the District Management UI sets, has a right to see what is actively running against its own students.

!!! mascot-encourage "You Have Now Covered the Whole First Half of Part 3's Toolkit"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Fourteen concepts and three full screens in one chapter is a genuine amount of ground. If the credentials-and-vocabulary section above feels thinner than the three main screens, that is intentional, not a shortcut — those pieces get their full due when the roles that actually own them take center stage later in the book. What you should carry forward is the shape: every screen in this chapter edits one layer of the same tenancy graph, and every status field — provisional, scaffold, draft — answers a narrow, specific question rather than a vague one.

Because this chapter introduced three screens in sequence, it helps to see all three side by side one final time, reinforcing the field names already explained above rather than adding anything new.

| Admin UI | Primary Screen Elements | Governs |
|---|---|---|
| District Management UI | Roster Source Configuration, dry-run diff preview, Data Residency Policy, Retention Policy, Legal Hold Toggle | The District node and its connection to the outside roster/SIS system |
| School Course Section UI | Enrollment Editor, Instructor Assignment Tool, Term/Academic-Year Rollover | School, Course, Section, and Enrollment records |
| Textbook Deployment UI | Textbook registry, Deployment Editor, Provisional Reconcile Queue, MicroSim Registry View | The DEPLOYS relationship and the Textbook/TextbookVersion/MicroSim content tree |

## Key Takeaways

- The **District Management UI**, reserved for the System Administrator, creates districts and configures **Roster Source Configuration**, **Data Residency Policy**, **Retention Policy**, and the **Legal Hold Toggle**.
- A roster sync always runs a **dry-run diff preview** before committing any addition, removal, or rename to School, Course, Section, or Enrollment records.
- A **Legal Hold Toggle** suspends a district's scheduled retention purge for specific records without altering the underlying **Retention Policy** itself.
- The **School Course Section UI** gives a District or School Administrator the **Enrollment Editor**, the **Instructor Assignment Tool**, and the **Term / Academic-Year Rollover** to run day-to-day enrollment, teaching assignments, and the yearly calendar transition.
- The **Textbook Deployment UI** is where a **Deployment Editor** binds `TextbookVersion`s to sections, where the **Provisional Reconcile Queue** promotes auto-provisioned stubs to fully reconciled content, and where the **MicroSim Registry View** tracks each MicroSim's scaffold/built/approved status.
- **Endpoint Key Rotation**, the **Verb Vocabulary Browser**, and the **Dead-Letter Inspector** live on the xAPI Endpoint & Credentials UI and support the ingestion pipeline a District Administrator otherwise mostly leaves alone.
- The **Experiment List View** gives a District Administrator visibility into running experiments without granting the design and governance controls that belong to the Textbook Author's Experiment Administration UI.

!!! mascot-celebration "Rosters Configured, Content Deployed"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now stand up a district, run its enrollment through a full academic year, and bind textbook versions to the sections that need them — the operational backbone underneath every dashboard this book has shown so far. What does the evidence show? There is still one more layer of the District Administrator's job left: who is allowed to touch any of these screens, and how the system proves it. [Chapter 26: District Administrator - Access Control and System Configuration](../26-district-admin-access-control/index.md) picks up exactly there.
