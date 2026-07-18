---
title: Class-Level Reports and Teacher Tools
description: How a whole section's mastery, pace, and risk get aggregated from the same statement log into ten class-level reports and six interactive tools a teacher can use beyond fixed dashboards.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 19:49:02
version: 0.09
---

# Class-Level Reports and Teacher Tools

## Summary

This chapter covers the ten class-level reports a teacher uses to understand a whole section at once, from the mastery heatmap to the at-risk roster, and the six interactive tools — cohort builders, the learning-graph explorer, alert rules — that let a teacher go beyond fixed reports.

## Concepts Covered

This chapter covers the following 18 concepts from the learning graph:

1. Class Mastery Heatmap
2. Concept Difficulty Ranking
3. Completion Funnel
4. Pace Distribution
5. Class Engagement Calendar
6. Question Discrimination
7. MicroSim Utilization Report
8. Cohort Comparison Report
9. At-Risk Roster
10. Standards Coverage Report
11. Ad-Hoc Cohort Builder
12. Learning Graph Explorer
13. Statement Query Console
14. Funnel Builder
15. Alert Rule Builder
16. Report Scheduler
17. Section Enrollment
18. Co-Teacher Assignment

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)
- [Chapter 28: Teacher Dashboards and Student-Level Reports](../28-teacher-dashboards-student-reports/index.md)

---

!!! mascot-welcome "From One Name to a Whole Roster"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 28 handed you nine reports and a single student's whole story. This chapter widens the lens back out to the section — thirty names on a roster instead of one — and asks a harder question: how do you compress thirty stories into one screen without losing the student who needs help most? Let's follow the record.

The nine reports covered in [Chapter 28](../28-teacher-dashboards-student-reports/index.md) all answer questions about one learner at a time. A teacher rarely has time to open thirty separate Student Detail Dashboards before first period, though, so the **My Classes Dashboard** — introduced in that chapter as a teacher's landing page — exists to answer a section-wide version of the same question first: which students, and which concepts, deserve attention today? This chapter is where that dashboard's class-level mechanics finally get the depth Chapter 28 deferred: ten reports that describe a whole section at once, followed by six interactive tools that let a teacher go beyond whatever a fixed report happens to show.

## Before You Can Aggregate a Class, You Need One

Every class-level report in this chapter assumes a simple fact already exists: a specific, current list of which students belong to which section, and which instructor is responsible for it. That fact is not computed from statements — it is administrative data, maintained through the same School / Course / Section UI that [Chapter 25](../25-district-admin-rosters-deployments/index.md) covered from a District Administrator's chair. **Section Enrollment** is the graph relationship connecting a `Student` vertex to a `Section` vertex, carrying an enrollment date and a status; it is almost always populated automatically by a roster sync, the same mechanism Chapter 25 described feeding the Enrollment Editor. A teacher does not usually create Section Enrollment records directly, but every class-level report in this chapter reads that boundary before it reads a single statement — it is the fence around "my class."

The second administrative fact a class-level report depends on is who the "my" in "my class" refers to. **Co-Teacher Assignment** is the graph relationship connecting an `Instructor` vertex to a `Section` vertex, and the specification explicitly allows more than one instructor to hold that relationship for the same section at once — a co-taught biology class with a lead teacher and a special-education co-teacher, for instance, where both need the identical My Classes view for the identical roster. Neither instructor is recorded as a subordinate "assistant" role; both simply hold the same relationship to the same section, and both see the same class-level reports built from the same statement log.

Before moving to the reports themselves, it helps to be precise about what these two administrative facts do and do not do, since every report that follows assumes them without re-explaining them.

- Section Enrollment defines the exact roster of students a class-level report aggregates over — add or remove a student here, and every report in this chapter reflects that change on its next refresh.
- Co-Teacher Assignment defines which instructors see a section's reports at all — it grants viewing scope, not a different or filtered version of the data.
- Neither relationship is itself a report; both are prerequisites that the ten reports below silently depend on.
- Both are ordinarily roster-driven and change rarely mid-term, unlike the statement log underneath the reports, which changes continuously.

## From One Student's Mastery to a Whole Section's

With the roster boundary settled, the next question is mechanical: how does a whole section's worth of individual mastery scores turn into one class-level number? The answer runs through a summary vertex Chapter 28 did not need — `SectionRollup`, a vertex materialized once per (section, concept) pair, holding a `mastery_distribution`, a `mean_score`, a `student_count`, and a timestamp for when it was last computed. A `ConceptMastery` vertex — the same per-student, per-concept summary Chapter 28's Concept Mastery Radar read directly — feeds into its section's `SectionRollup` through a `ROLLS_UP_TO` edge; the `SectionRollup` itself connects to its `Section` through a `FOR_SECTION` edge. Every class-level report in this chapter is, underneath, a different view onto that one aggregate vertex, or onto sibling aggregates built the same way from other summary types.

That mechanism is worth seeing as a diagram before the reports built on top of it start piling up, since every one of them will refer back to this same rollup step.

#### Diagram: How Concept Mastery Rolls Up to a Section

<iframe src="../../sims/section-rollup-aggregation/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>How Concept Mastery Rolls Up to a Section</summary>
Type: workflow
**sim-id:** section-rollup-aggregation<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/microsims/tree/main/docs/sims/learning-graph-v1<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Explain how many students' individual ConceptMastery vertices aggregate, through a ROLLS_UP_TO edge, into one SectionRollup vertex per concept, which the ten class-level reports in this chapter all read from.

Purpose: A Mermaid flowchart showing three sample `ConceptMastery` boxes (one per sample student: Amara, Devon, Priya), each with a small mastery-score label, each connected by a `ROLLS_UP_TO` arrow into one central `SectionRollup` box labeled with its key properties (`mastery_distribution`, `mean_score`, `student_count`, `last_computed`). A `FOR_SECTION` arrow connects the `SectionRollup` box to a `Section` box. A dashed arrow fans out from `SectionRollup` to three placeholder report boxes labeled "Class Mastery Heatmap," "Concept Difficulty Ranking," and "other class-level reports."

Interactive features: Clicking any `ConceptMastery` box opens an infobox recapping that it is the same per-student mastery score Chapter 28 introduced. Clicking the `SectionRollup` box opens an infobox listing its four key properties and stating it refreshes incrementally, not by re-scanning every statement. Clicking the `Section` box opens an infobox defining Section Enrollment as the boundary that determines which students' ConceptMastery vertices feed this particular rollup.

Color coding: The three student-level ConceptMastery boxes in a light neutral tone to signal "already covered in Chapter 28"; the SectionRollup box in the book's teal accent color to signal "new in this chapter"; the fan-out to report boxes in a muted gray dashed line.

Implementation: Mermaid flowchart adapted from the referenced template's node/edge layout conventions, with full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the three ConceptMastery boxes stack vertically above the SectionRollup box instead of side by side.
</details>

!!! mascot-thinking "Same Data, Different Grain"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that no new statements were needed to get here. `SectionRollup` is built entirely from `ConceptMastery` vertices that already existed for Chapter 28's reports — the aggregation is a change in grain, not a change in source. That is the same idea [Chapter 24](../24-three-personas-and-admin-uis/index.md) established for all three personas sharing one statement log, now showing up one level down: a teacher's own two dashboards share the identical underlying evidence, aggregated differently.

## The Class Mastery Heatmap: Where the Trouble Is

The most-used of the ten class-level reports is also the simplest to read at a glance. The **Class Mastery Heatmap** renders as a grid — one row per student, one column per concept — with each cell shaded by that student's mastery score for that concept, built directly from the `SectionRollup` mastery distribution just described. A teacher scanning this grid is looking for two different patterns: a whole column shaded dark, meaning most of the class is struggling with one specific concept (a signal the *content* may need re-teaching to everyone), versus a whole row shaded dark, meaning one specific student is struggling broadly (a signal that student, specifically, needs attention).

#### Diagram: Class Mastery Heatmap for One Section

<iframe src="../../sims/class-mastery-heatmap/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Class Mastery Heatmap for One Section</summary>
Type: chart
**sim-id:** class-mastery-heatmap<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, distinguish

Learning objective: Let the learner distinguish a concept-wide weakness (a dark column across most students) from a student-specific weakness (a dark row across most concepts) in a class mastery heatmap, and identify which pattern calls for whole-class re-teaching versus individual attention.

Canvas layout: A grid of roughly 24 rows (sample students, labeled by first name and last initial) by 8 columns (sample concepts, labeled along the top, rotated diagonally to fit). Each cell is a filled rectangle shaded on a single-hue color scale from light (high mastery, near 1.0) to dark (low mastery, near 0.0), matching the book's teal accent hue so meaning is never carried by color alone.

Data: A synthetic mastery-score matrix with one deliberately dark column (a concept most of the class is weak on) and one deliberately dark row (a single student weak across most concepts), so both patterns are visible in the default view.

Interactive features: Hovering any cell reveals a tooltip with the exact mastery score and the student/concept pair. Clicking a column header highlights that entire column and opens an infobox stating the class-wide mean score for that concept. Clicking a row label highlights that entire row and opens a "View Student Detail" link representing the drill-down into that student's nine-report dashboard from Chapter 28. A `createSlider()` control lets the learner filter the grid to only students below a chosen mastery threshold.

Color coding: Single-hue sequential scale (light-to-dark teal) rather than a red-green scale, so the chart remains legible for color-vision-deficient readers; a numeric label appears on hover as a redundant, non-color-dependent cue.

Implementation: p5.js canvas rendering a grid of colored rectangles from a 2D array of scores, with mouse-position hit-testing for hover and click. Responsive design: canvas width tracks the containing element's width; at narrow viewports column headers abbreviate to two-letter concept codes and cell size shrinks rather than the grid overflowing horizontally.
</details>

## Four More Section-Level Views

Four more reports describe the same section from angles the heatmap cannot show. The **Concept Difficulty Ranking** takes the same mean scores behind the heatmap's columns and sorts them into a horizontal bar chart, ascending from hardest to easiest, so a teacher can name the single hardest concept in the section without scanning a whole grid for the darkest column. The **Completion Funnel** counts how many students in the section have reached each chapter or page in order, rendered as a classic funnel narrowing from "started" at the top to "reached the final page" at the bottom — the same funnel-chart component this book's Chapter 1 dashboard-mapping table already named as `go.Funnel`. The **Pace Distribution** shows, per chapter, a box plot of how many days each student took to complete it, revealing whether a chapter's pacing is tight and consistent across the class or wildly spread out. The **Class Engagement Calendar** renders a calendar heatmap — one cell per day across the whole term — shaded by how many statements the section produced that day, making patterns like "engagement drops every weekend" or "nobody touched the textbook during winter break" visible at a glance.

Having explained what each of these four reports shows, it is worth pausing on how they complement each other, since a teacher rarely reads just one in isolation.

| Report | Unit of Analysis | What It Answers |
|---|---|---|
| Concept Difficulty Ranking | Section, per concept | Which single concept is hardest for this class, ranked |
| Completion Funnel | Section, per chapter/page | How many students have reached each point in the sequence |
| Pace Distribution | Section, per chapter | Is this chapter's completion time tight or spread out across students |
| Class Engagement Calendar | Section, per day | When did the class engage, and when did engagement go quiet |

Reading that table top to bottom traces four different axes of the same section: difficulty (which concept), progress (how far), pace (how long), and rhythm (when) — four questions the Class Mastery Heatmap alone cannot answer, because it only shows the current mastery snapshot.

!!! mascot-tip "A Box Plot's Outliers Are Often the Real Story"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    When reading the Pace Distribution, resist the urge to look only at the median line. A tight box with two or three dots far outside it means most of the class paced a chapter normally, but a handful of students took dramatically longer — exactly the students the Class Mastery Heatmap's darkest rows and the At-Risk Roster later in this chapter are also likely to flag. A wide, evenly spread box with no outliers, by contrast, usually means the chapter's pacing itself needs attention, not any particular student.

## Measuring the Content Itself: Item and Tool-Level Reports

Three more class-level reports drop below the concept level to look at individual questions, individual MicroSims, and one section compared against another. The **Question Discrimination** report is a scatter plot — difficulty on one axis, discrimination on the other — built from classic item-analysis statistics over a section's `Question` statements. Difficulty here means how many students answered correctly; discrimination means how well a question separates students who mastered the surrounding concept from students who did not. A question that everyone gets right, or everyone gets wrong regardless of their overall mastery, has low discrimination and is a weak question no matter how "hard" it looks on paper.

The **MicroSim Utilization Report** shifts from questions to interactive simulations, rendering as a bar chart of interaction counts paired with a dwell-time distribution per MicroSim — which simulations a section actually opened and lingered on, versus which ones nobody touched. The **Cohort Comparison Report** is the one report in this set that looks outside a single section entirely: a grouped bar chart or small-multiples layout comparing two sections the same teacher owns on whatever concepts they share, useful for a teacher running two sections of the same course back to back.

!!! mascot-warning "Two Sections Are Not a Controlled Experiment"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to read the Cohort Comparison Report as proof that whatever a teacher changed between two sections — a different pacing, a different in-class activity — *caused* the difference in scores. It doesn't prove that. The two sections likely differ in ways having nothing to do with the change: time of day, which students enrolled, what else was happening that week. A real answer to "did this change work" requires a properly randomized comparison, which is a different topic this book returns to later. Read the Cohort Comparison Report as a prompt for a question, not as the answer to one.

## At-Risk Roster: Where Every Signal Converges

Most of the reports so far each isolate one signal. The **At-Risk Roster** is the first class-level report to combine several: a ranked table of students, each tagged with a composite risk score built from three ingredients Chapter 28 already explained one at a time — the Idle Disengagement Alert's inactivity signal, a student's low overall mastery, and the Prerequisite Gap Analysis's evidence of unmastered upstream concepts. A student flagged near the top of this roster is not necessarily the student with the single lowest test score; it is the student where multiple independent warning signs point in the same direction at once.

Because the At-Risk Roster draws on the exact same three signals from Chapter 28, seeing how they combine is more useful as an interactive breakdown than as another paragraph of description.

#### Diagram: At-Risk Roster — How the Composite Score Is Built

<iframe src="../../sims/at-risk-roster-composite-score/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>At-Risk Roster — How the Composite Score Is Built</summary>
Type: workflow
**sim-id:** at-risk-roster-composite-score<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/atam/tree/main/docs/sims/risk-register-explorer<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: decompose, justify

Learning objective: Let the learner decompose one student's composite at-risk score into its three contributing signals (disengagement, low mastery, prerequisite gaps) and justify why a student flagged on all three ranks higher than a student flagged on only one.

Purpose: A Mermaid flowchart with three input boxes — "Idle Disengagement Alert" (no statements in N days), "Low Overall Mastery" (below-threshold ConceptMastery average), "Prerequisite Gap Analysis" (unmastered upstream concepts) — each with a labeled weight arrow flowing into one central "Composite Risk Score" box, which itself flows into a ranked "At-Risk Roster" table box showing three sample rows with different score compositions (one flagged on all three signals, ranked highest; one flagged on only disengagement, ranked lower; one flagged on only prerequisite gaps, ranked lowest of the three).

Interactive features: Clicking any of the three input boxes opens an infobox recapping that signal's definition from Chapter 28 (Idle Disengagement Alert, Struggle Detector's low-mastery evidence, Prerequisite Gap Analysis). Clicking the "Composite Risk Score" box opens an infobox explaining that the score is a weighted combination, not a simple count, and that a student can rank highly on strength of one severe signal alone. Clicking any roster row opens an infobox showing that student's individual signal breakdown.

Color coding: The three input boxes each in a distinct muted hue; the composite box in the book's amber accent color to mark it as the point of convergence; the roster rows shaded darkest-to-lightest by rank to reinforce the ranking visually.

Implementation: Mermaid flowchart adapted from the referenced template's factor-to-composite-score layout, with full click-to-infobox coverage. Responsive width tracking the containing element; on narrow viewports the three input boxes stack vertically above the composite box instead of fanning in from the sides.
</details>

## Standards Coverage: Concepts Meet External Frameworks

The tenth and last class-level report looks outward rather than at the class's own performance. The **Standards Coverage Report** renders as a coverage matrix mapping the section's concepts to external standards frameworks, when a standards graph is present in the deployment — letting a teacher or curriculum lead see, at a glance, which state or national standards a given chapter's concepts actually satisfy, and which standards remain uncovered by anything in the current textbook.

With all ten class-level reports now explained, the following recap organizes them the same way the Concept Difficulty Ranking through Class Engagement Calendar table did earlier — by what question each one answers — as a single reference, not new material.

- **Class Mastery Heatmap** — where the trouble is, student by concept, all at once.
- **Concept Difficulty Ranking** — the single hardest concept in the section, sorted.
- **Completion Funnel** — how many students have reached each point in the sequence.
- **Pace Distribution** — whether a chapter's completion time is tight or spread out.
- **Class Engagement Calendar** — when the class engaged, and when it went quiet.
- **Question Discrimination** — which individual questions separate strong from weak students well.
- **MicroSim Utilization Report** — which simulations the section actually used.
- **Cohort Comparison Report** — how two of a teacher's own sections compare on shared concepts.
- **At-Risk Roster** — a ranked list combining disengagement, low mastery, and prerequisite gaps.
- **Standards Coverage Report** — which external standards the section's concepts satisfy.

!!! mascot-encourage "Ten Reports Plus Six Tools Is a Full Toolbox"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If that list of ten is starting to blend together, that is a normal reaction — Chapter 28 already asked you to hold nine student-level reports in mind, and this chapter just added ten more at a different grain. You do not need perfect recall of each report's exact backing query. You need the shape: most of these ten reports view the same `SectionRollup` and its sibling aggregates from a different angle — by concept, by student, by day, by question, by simulation — and the At-Risk Roster is the one report built by combining several of those angles at once.

## Six Tools for When a Fixed Report Isn't Enough

Every report covered so far is fixed: its layout, its grouping, its chart type are all decided in advance. Sometimes a teacher's actual question does not match any of the ten reports exactly — "show me only the students who scored below 70% on the midterm *and* are in my third-period section" is a perfectly reasonable question that no single fixed report answers directly. The specification's answer is a set of six interactive tools that let a teacher construct a view on demand rather than wait for a new report to be built.

The **Ad-Hoc Cohort Builder** lets a teacher define a custom group of students by predicates — grade level, section, a mastery band — and then run any of the ten reports above against just that custom group instead of an entire section. The **Learning Graph Explorer** is an interactive version of the concept dependency graph Chapter 7 introduced as the property graph's backbone: a teacher clicks any concept node and sees that concept's class-wide mastery, its prerequisite chain, and the content linked to it, all without leaving the graph view.

#### Diagram: Learning Graph Explorer for Class Mastery

<iframe src="https://dmccreary.github.io/signal-processing/sims/graph-viewer/main.html" width="100%" height="500px" scrolling="no"></iframe>

[Run the Learning Graph Viewer MicroSim fullscreen](https://dmccreary.github.io/signal-processing/sims/graph-viewer/main.html){ .md-button }

<details markdown="1">
<summary>Learning Graph Explorer for Class Mastery (reused MicroSim)</summary>
Type: graph-model
**sim-id:** graph-viewer<br/>
**Library:** vis-network<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/signal-processing/sims/graph-viewer/<br/>
**Source Repo:** https://github.com/dmccreary/signal-processing/tree/main/docs/sims/graph-viewer

Reused from the MicroSim catalog (WHAT match score 0.8296). Learning objective: let the learner use an interactive learning-graph explorer to click a concept node and inspect its prerequisite chain and linked content, applying the same DEPENDS_ON traversal Chapter 7 introduced to a class-level "why is this concept hard" question. The reused sim's existing search, taxonomy filtering, and node-click interaction map directly onto the Learning Graph Explorer's specified behavior — clicking a concept plays the role of surfacing its class mastery and prerequisite chain, and the taxonomy filter lets a teacher narrow the graph to one category at a time.
</details>

Four more tools round out the set. The **Statement Query Console** is a guided filter builder over the raw statement log itself — no query language required — letting a teacher construct a filter (this verb, this date range, this activity) and export the matching statements directly, for the rare case where even the Ad-Hoc Cohort Builder's predicates are not specific enough. The **Funnel Builder** lets a teacher drag content nodes into a custom order to define a progression funnel of their own choosing, rather than relying on the fixed chapter-by-chapter sequence the Completion Funnel report assumes. The **Alert Rule Builder** lets a teacher define a threshold — "notify me when a student is idle five days" is the specification's own example — that pushes a notification to the teacher automatically instead of requiring them to check the At-Risk Roster manually every morning. The **Report Scheduler** takes any of the ten fixed reports, or any custom view built with the tools above, and schedules it to email or export on a recurring cadence, so a report a teacher checks every Monday morning does not require opening the dashboard at all.

The following list recaps all six tools together, now that each has been explained, organized by what kind of flexibility each one adds beyond a fixed report.

- **Ad-Hoc Cohort Builder** — define a custom student group by predicate, then run any report against it.
- **Learning Graph Explorer** — click any concept to see its class mastery, prerequisite chain, and linked content.
- **Statement Query Console** — a guided, non-query-language filter builder over the raw statement log, with export.
- **Funnel Builder** — drag content nodes to define a custom progression funnel.
- **Alert Rule Builder** — define a threshold that pushes a notification instead of waiting to be checked.
- **Report Scheduler** — schedule any report or custom view to email or export on a recurring cadence.

## Key Takeaways

- **Section Enrollment** is the roster boundary that determines exactly which students a class-level report aggregates over.
- **Co-Teacher Assignment** lets more than one instructor hold the same viewing relationship to a section without either being a subordinate role.
- A `SectionRollup` vertex aggregates many students' `ConceptMastery` vertices through a `ROLLS_UP_TO` edge — the same underlying evidence Chapter 28 used, viewed at a coarser grain.
- The **Class Mastery Heatmap** distinguishes a concept-wide weakness (a dark column) from a student-specific weakness (a dark row).
- The **Concept Difficulty Ranking**, **Completion Funnel**, **Pace Distribution**, and **Class Engagement Calendar** each describe a different axis of the same section — difficulty, progress, pace, and rhythm.
- **Question Discrimination**, the **MicroSim Utilization Report**, and the **Cohort Comparison Report** drop to the item, simulation, and cross-section level respectively — with cohort comparisons read as correlational prompts, not causal proof.
- The **At-Risk Roster** combines disengagement, low mastery, and prerequisite gaps into one composite, ranked score.
- The **Standards Coverage Report** maps a section's concepts against external standards frameworks.
- Six tools — the **Ad-Hoc Cohort Builder**, **Learning Graph Explorer**, **Statement Query Console**, **Funnel Builder**, **Alert Rule Builder**, and **Report Scheduler** — let a teacher build a custom view when none of the ten fixed reports fits the exact question being asked.

!!! mascot-celebration "You Can Now Read a Whole Section, Not Just One Student"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    What does the evidence show? You can now open My Classes and read a whole section's story at once — where the trouble concentrates, who is falling through the cracks, and which of six tools to reach for when a fixed report doesn't quite fit. In [Chapter 30: Textbook Author Dashboards and Content Reports](../30-author-dashboards-content-reports/index.md), the lens shifts one more time — from the teacher watching students to the author watching the textbook itself.
