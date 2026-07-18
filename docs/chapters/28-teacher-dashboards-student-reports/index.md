---
title: Teacher Dashboards and Student-Level Reports
description: How the My Classes and Student Detail dashboards give a teacher a per-student lens on the same statement log, and the nine student-level reports — progress, mastery, timing, struggle, prerequisites, quiz items, disengagement, velocity, and reading-versus-doing balance — that answer which student needs help today.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 19:42:28
version: 0.09
---

# Teacher Dashboards and Student-Level Reports

## Summary

This chapter introduces the teacher persona through the My Classes and Student Detail dashboards, then covers all nine student-level reports — progress overviews, mastery radars, struggle detection, and prerequisite-gap analysis — that a teacher uses to understand one learner at a time.

## Concepts Covered

This chapter covers the following 11 concepts from the learning graph:

1. My Classes Dashboard
2. Student Detail Dashboard
3. Student Progress Overview
4. Concept Mastery Radar
5. Time-On-Task Timeline
6. Struggle Detector
7. Prerequisite Gap Analysis
8. Quiz Item Analysis
9. Idle Disengagement Alert
10. Learning Velocity Report
11. Reading Vs Doing Balance

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)

---

!!! mascot-welcome "From the District's Ledger to One Student's Screen"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 27 closed out the district administrator's arc with laws, audits, and a rollout plan signed off on paper. This chapter puts down that paperwork and opens a laptop most teachers actually keep open all day: the classroom view. Same statement log, same ingestion pipeline, same mastery engine — but the question changes from "is this rollout compliant?" to "which of my students needs help right now, and on what?" Let's follow the record.

Recall from [Chapter 24](../24-three-personas-and-admin-uis/index.md) that the **Teacher** persona's goal sentence is short on purpose: *which of my students needs help right now, and on what?* Everything in this chapter exists to answer exactly that sentence, one student at a time. A district administrator reads coverage percentages and audit logs; a teacher reads a roster of names they already know, and the software's entire job is to turn a firehose of xAPI Statements into something that fits on one screen without losing the one student who is quietly falling behind.

## Two Dashboards, One Drill-Down

The specification's Dashboard Catalog assigns a teacher exactly two dashboards. The **My Classes Dashboard** is a teacher's landing page — a section-level view built from a class mastery heatmap, a completion funnel, an at-risk roster, and a rolled-up disengagement alert, so a teacher can scan an entire section for trouble spots in one glance. The **Student Detail Dashboard** is where a teacher lands after clicking one name on that roster — a single-student view built from all nine of the reports this chapter covers in depth. My Classes answers "which section, which concept, which student" at a glance; Student Detail answers "what exactly is going on with this one student."

This chapter is deliberately narrow about My Classes: the class-level mechanics behind its heatmap and at-risk roster — how a whole section's mastery gets aggregated, and how a composite risk score is computed across many students at once — are [Chapter 29](../29-class-level-reports-and-tools/index.md)'s subject, not this one. What matters here is only the *drill-down* itself: My Classes is the door, and the nine reports below are the room behind it.

The dashboard mechanics that make either screen work at all are not new. [Chapter 15](../15-privacy-and-dashboard-mechanics/index.md) already established that every dashboard in this project follows one shared anatomy — a header with breadcrumb and filters, a left-rail report menu, a main canvas of KPI tiles and figures, and a footer with export and refresh controls — and that clicking a row in one figure cross-filters every other figure on the same screen without a page reload. This chapter does not re-explain that mechanism; it shows where a teacher's two dashboards sit inside it.

| Dashboard | Audience | Backing Reports |
|---|---|---|
| **My Classes Dashboard** | Teacher | Class Mastery Heatmap, Completion Funnel, At-Risk Roster, Idle Disengagement Alert |
| **Student Detail Dashboard** | Teacher | All nine student-level reports covered in this chapter |

Reading that table top to bottom traces the exact click a teacher makes every morning: scan My Classes for a name that stands out on the at-risk roster or the disengagement alert, then click through to that student's own Student Detail Dashboard for the full nine-report picture. The diagram below walks that same click as an interactive sequence, distinguishing what each screen shows before and after the drill-down.

#### Diagram: My Classes to Student Detail — One Click, Nine Reports

<iframe src="../../sims/my-classes-student-detail-drilldown/main.html" width="100%" height="682px" scrolling="no"></iframe>

<details markdown="1">
<summary>My Classes to Student Detail — One Click, Nine Reports</summary>
Type: workflow
**sim-id:** my-classes-student-detail-drilldown<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/search-microsims/tree/main/docs/sims/dashboard-patterns<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Explain how a teacher moves from a section-level roster on My Classes to a single student's nine-report Student Detail view, carrying filter context (the selected date range and textbook version) across the click.

Purpose: A two-lane Mermaid flowchart. Lane 1, "My Classes Dashboard," contains four boxes: Class Mastery Heatmap, Completion Funnel, At-Risk Roster, Idle Disengagement Alert. Lane 2, "Student Detail Dashboard," contains nine boxes, one per student-level report named later in this chapter (Student Progress Overview, Concept Mastery Radar, Time-on-Task Timeline, Reading vs. Doing Balance, Learning Velocity Report, Quiz Item Analysis, Struggle Detector, Prerequisite Gap Analysis, Idle Disengagement Alert). One labeled arrow, "click a student row," crosses from the At-Risk Roster box in Lane 1 to the whole Lane 2 group, annotated "filter context (date range, textbook version) carried across."

Interactive features: Every box in both lanes has a Mermaid click directive opening an infobox with that report's one-sentence purpose. Clicking the crossing arrow opens an infobox explaining server-side aggregation: the browser never re-fetches raw statements on drill-down, only a narrower pre-aggregated query for the one selected student.

Color coding: Lane 1 (My Classes) in the book's amber accent color; Lane 2 (Student Detail) in teal; the crossing arrow in a bold outline to draw the eye to the drill-down moment.

Implementation: Mermaid flowchart with two subgraphs and full click-to-infobox coverage, adapted from the referenced template's dashboard-composition layout. Responsive width tracking the containing element; on narrow viewports the two lanes stack vertically instead of side by side.
</details>

!!! mascot-thinking "One Log, Two Numbering Schemes, No New Data"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    The specification numbers a teacher's reports in two bands — a low band for student-level reports and a higher band for section-level ones, exactly mirroring the split you just saw between Student Detail and My Classes. Don't read that numbering as two different pipelines. It is the same idea Chapter 24 introduced with three personas sharing one statement log, now repeated one level down: a teacher's own reports split into "one student" and "one section" by aggregation grain alone, not by data source.

## Student Progress Overview: The Checklist a Teacher Opens First

The simplest of the nine student-level reports is also usually the first one a teacher opens. The **Student Progress Overview** is a progress bar paired with a concept checklist: it compares the concepts a student has evidence of mastering against the full concept set the textbook defines, and renders the gap as a percentage-complete bar plus a scrollable list of concept names with a checkmark or an empty box next to each. Mechanically, it walks the graph from a `Student` vertex to that student's `ConceptMastery` summary vertices and matches the result against the textbook's full concept catalog — the same `Concept` vertices and `DEPENDS_ON` edges [Chapter 7](../07-property-graph-data-model/index.md) introduced as the property graph's backbone.

Because this report answers "how far along is this student, overall" rather than "how well," it deliberately does not distinguish a concept mastered with high confidence from one mastered barely above threshold — that finer distinction belongs to the next report.

## Concept Mastery Radar: Mastery, Grouped and Shaped

Where the Progress Overview asks "mastered or not," the **Concept Mastery Radar** asks "mastered how well, and in which areas." It is a radar (spider) chart with one spoke per taxonomy category from the textbook's own concept taxonomy, each spoke's length set by the average mastery score of that student's concepts within that category. A student strong in vocabulary-heavy categories but weak in a category demanding multi-step reasoning shows up as a lopsided shape rather than a single flat number — exactly the kind of pattern a progress bar alone cannot reveal.

The mastery score behind every spoke is the same `mastery_score` property that [Chapter 12](../12-bayesian-knowledge-tracing/index.md) introduced as Bayesian Knowledge Tracing's output: a probability, updated after every relevant statement, that a given student has mastered a given concept. That reuse matters pedagogically as much as technically — a teacher reading this radar chart is looking at the identical number Chapter 12 explained how to compute, just aggregated by category and rendered as a shape instead of read one concept at a time.

#### Diagram: Concept Mastery Radar for One Student

<iframe src="../../sims/concept-mastery-radar/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Concept Mastery Radar for One Student</summary>
Type: chart
**sim-id:** concept-mastery-radar<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/blockchain/tree/main/docs/sims/quality-attribute-radar<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: interpret, compare

Learning objective: Let the learner interpret a radar chart of one student's Bayesian Knowledge Tracing mastery scores grouped by taxonomy category, identifying the category where that student is weakest.

Purpose: A radar/spider chart with five to seven spokes, one per taxonomy category (e.g., Vocabulary, Procedures, Analysis, Application, Synthesis), each spoke scaled 0 to 1 to match the BKT mastery-score range.

Data: A sample student's per-category average mastery scores plotted as a filled polygon; a faint dashed reference polygon at 0.75 mastery marks the textbook's default "likely mastered" line so the learner can see at a glance which spokes fall short of it.

Interactive features: Clicking any spoke's label opens an infobox naming that taxonomy category and listing the two or three concepts within it that pull the average down the most. A slider (p5.js `createSlider()`) lets the learner switch between three sample students to see how the same chart shape changes with a different mastery profile.

Color coding: The filled mastery polygon in the book's teal accent color; the 0.75 reference line in a neutral dashed gray so it reads as a threshold, not a second data series.

Implementation: p5.js canvas rendering a polar/radar plot from an array of category-score pairs, adapted from the referenced template's radar-chart structure. Responsive width tracking the containing element; spoke labels rotate to remain horizontal and legible at narrow widths.
</details>

!!! mascot-tip "A Mastery Score Is a Probability, Not a Percentage Grade"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    It is tempting to read a 0.62 mastery score the way you would read a 62% quiz grade — as "more than half right." Chapter 12 was precise about why that reading is wrong: 0.62 means the model estimates a 62% *chance* this student has actually mastered the concept, not that they answered 62% of questions correctly. A teacher who treats the Concept Mastery Radar's spokes as percentage grades will misjudge exactly the students sitting near the 0.75 reference line — which is precisely where a teacher's judgment matters most.

## Reading vs. Doing Balance: A Quick Verb-Ratio Check

Not every useful report requires a chart with multiple axes. The **Reading vs. Doing Balance** report is a single stacked bar built from a ratio of two xAPI verb families already familiar from [Chapter 1](../01-lms-to-experience-api/index.md): `experienced` statements, which record a student reading a passage or watching a walkthrough, against `interacted` and `answered` statements, which record a student actively doing something — dragging a MicroSim's slider, submitting a quiz answer, working a practice problem. The ratio between the two segments tells a teacher, at a glance, whether a given student is spending a chapter mostly reading or mostly doing.

Neither extreme is automatically bad — a student previewing a chapter before lab time might reasonably show all reading and no doing yet — but a student who is *only* ever reading, chapter after chapter, is a student a teacher may want to nudge toward the interactive material the textbook actually provides.

| Student (sample) | Reading Statements | Doing Statements | Reading:Doing Ratio |
|---|---|---|---|
| Amara | 42 | 38 | roughly 1:1 |
| Devon | 61 | 9 | roughly 7:1 |
| Priya | 18 | 55 | roughly 1:3 |

Reading down that table, Devon's 7:1 ratio is the one worth a teacher's attention — not because reading is wrong, but because a ratio that lopsided, chapter after chapter, usually means the interactive material is being skipped rather than merely deferred.

## Time-on-Task Timeline: When the Student Actually Worked

The **Time-on-Task Timeline** answers a question none of the reports above can: not *what* a student did, but *when*, and for how long in one sitting. It renders as a Gantt-style timeline built from `LearningSession` summary vertices and the `TOUCHED` edges connecting a session to the concepts it covered — each session appears as a horizontal bar positioned at its start time and stretched to its duration, with a click available to drill into the individual statements inside that session down at the event-store level.

This report exists because two students can reach an identical mastery score by two very different paths — one steady fifteen minutes every evening, another a single three-hour cram session the night before a deadline — and that difference in *pattern*, not just outcome, is often exactly what a teacher needs to see before deciding how to intervene.

#### Diagram: One Student's Time-on-Task Timeline

<iframe src="../../sims/time-on-task-timeline/main.html" width="100%" height="462px" scrolling="no"></iframe>

<details markdown="1">
<summary>One Student's Time-on-Task Timeline</summary>
Type: timeline
**sim-id:** time-on-task-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/goal-horizon-timeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: interpret, distinguish

Learning objective: Let the learner interpret a Gantt-style timeline of one student's learning sessions across a week, distinguishing a steady engagement pattern from a single last-minute cram session.

Time period: One sample week, Monday through Sunday

Orientation: Horizontal, left to right, one row per day

Events: Six to eight session bars of varying length and time of day placed across the week, including one deliberately long bar the night before a sample "quiz due" marker to illustrate a cram pattern, and several short, evenly spaced bars earlier in the week to illustrate steady engagement for comparison.

Interactive features: Clicking any session bar opens an infobox listing the concepts touched during that session (drawn from that session's `TOUCHED` edges) and a link labeled "view individual statements," representing the drill-down into the event store. A toggle switches between two sample students — one steady, one cram-pattern — so the learner can compare timeline shapes directly.

Visual style: Session bars colored by duration (short sessions in a lighter shade, long sessions in a darker shade of the book's teal accent color) so a cram session visually stands out without needing to read the bar's length precisely.

Responsive design: Timeline resizes to the width of its containing element; on narrow viewports the day labels abbreviate and bars remain tap-sized for the click-to-infobox interaction.
</details>

## Learning Velocity Report: Speeding Up or Stalling Out

The **Learning Velocity Report** takes the same mastery scores the radar chart displayed and asks a different question: is this student's rate of progress increasing, holding steady, or stalling? It renders as a simple line chart — concepts mastered per week — computed as the slope of a student's cumulative mastery count over time. A rising line means a student is gaining ground; a flattening line, even at a respectable overall mastery level, is often the earliest warning sign a teacher gets, well before a Struggle Detector alert fires on any single concept.

Velocity and the Progress Overview answer related but distinct questions worth keeping straight: the Progress Overview is a snapshot ("how far along is this student right now"), while Learning Velocity is a trend ("is that snapshot getting better or worse over time"). A student can have a middling Progress Overview and a strongly rising Velocity line — a student catching up — or a strong Progress Overview and a flattening Velocity line — a student who was ahead and has since stopped moving.

## Quiz Item Analysis: Performance at the Question Level

Where the reports so far have looked at whole concepts, the **Quiz Item Analysis** report drops down one more level, to the individual question. It renders as a table — one row per question the student has attempted — with a small sparkline showing the sequence of attempts on that question, backed by `QuestionResponse` summary vertices that track each question's attempt count and success count for that student, with a drill-down available to the individual attempts in the event store.

This is the report a teacher reaches for when a concept-level score looks fine but something still feels off about a specific assignment — Quiz Item Analysis is where a teacher can see, for example, that a student is only ever getting the *last* question in a set wrong, a pattern invisible at the concept-mastery level because the concept's overall score still looks acceptable.

| Question | Attempts | Successes | Pattern |
|---|---|---|---|
| Cellular Respiration Q3 | 4 | 1 | Struggling — mostly incorrect across attempts |
| Cellular Respiration Q7 | 2 | 2 | Solid — correct on first or second try |
| Cellular Respiration Q9 | 5 | 4 | Recovering — early misses, now consistent |

Reading that table row by row shows exactly the kind of detail a concept-level mastery score would average away: Q3's pattern is worth a teacher's attention even if the concept's overall mastery score looks merely "adequate."

## Struggle Detector: Composing the Signals Into a Ranked List

Several of the reports above each answer one narrow question. The **Struggle Detector** is the first report in this chapter to combine signals: it is a ranked list, each entry tagged with a severity chip, built from concepts where a student shows a high attempt count paired with a low result score — evidence of real effort without matching success — cross-checked against prerequisite gaps found by walking the `DEPENDS_ON` edges upstream from each struggling concept.

That last clause matters: the Struggle Detector does not just flag "low mastery here" — it flags low mastery *combined with* effort already spent, which is what separates "hasn't gotten to this concept yet" from "is actively stuck on this concept." A concept a student has never attempted does not appear on this list at all; a concept attempted five times with little to show for it appears near the top, tagged with the highest severity chip.

## Prerequisite Gap Analysis: Walking Upstream From the Struggle

The Struggle Detector's ranked list names a symptom; the **Prerequisite Gap Analysis** report traces it back to a cause. For any concept the Struggle Detector flags, this report walks the same `DEPENDS_ON` edges upstream through the learning graph and highlights every prerequisite concept the student has not yet mastered — rendering the result as a subgraph of the full learning graph with the weak concept and its unmastered ancestors visually distinguished from the surrounding, already-mastered graph.

This is often the single most actionable report in the whole set, because it turns "student is struggling with cellular respiration" into something a teacher can actually act on: "student is struggling with cellular respiration because they never solidified ATP synthesis, three concepts upstream." Re-teaching the downstream concept directly rarely works as well as filling the actual gap it depends on.

#### Diagram: Prerequisite Gap Analysis — Walking Upstream From a Weak Concept

<iframe src="../../sims/concept-dependencies/main.html" width="100%" height="522px" scrolling="no"></iframe>

[Run the Concept Dependencies Graph MicroSim fullscreen](https://dmccreary.github.io/automating-instructional-design/sims/concept-dependencies/main.html){ .md-button }

<details markdown="1">
<summary>Prerequisite Gap Analysis — Walking Upstream From a Weak Concept (reused MicroSim)</summary>
Type: graph-model
**sim-id:** concept-dependencies<br/>
**Library:** vis-network<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/automating-instructional-design/sims/concept-dependencies/<br/>
**Source Repo:** https://github.com/dmccreary/automating-instructional-design/tree/main/docs/sims/concept-dependencies

Reused from the MicroSim catalog (WHAT match score 0.7919). Learning objective: let the learner trace upstream prerequisite concepts from a student's flagged weak concept, distinguishing already-mastered ancestors from unmastered ones that are the likely root cause of the struggle. The reused sim's existing REQUIRES/SUPPORTS dependency-edge model and click-to-highlight-upstream-and-downstream interaction map directly onto this report's "walk `DEPENDS_ON` upstream and flag unmastered prerequisites" behavior — a weak concept plays the role of the clicked node, and its unmastered ancestors are the highlighted upstream set.
</details>

!!! mascot-encourage "Nine Reports Is a Lot to Hold at Once"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If Progress Overview, Mastery Radar, Reading vs. Doing Balance, Time-on-Task, Velocity, Quiz Item Analysis, Struggle Detector, and Prerequisite Gap Analysis are starting to blur together, that is a completely normal reaction to eight reports in one sitting — and there is one more still to come. You do not need to recite each report's exact backing query from memory. You need the shape: some reports describe *how much* (Progress Overview, Velocity), some describe *how well* (Mastery Radar, Quiz Item Analysis), some describe *when* (Time-on-Task), and the last two — Struggle Detector and Prerequisite Gap Analysis — combine those signals into "where to intervene, and why."

## Idle Disengagement Alert: The Report That Reaches Back to My Classes

The ninth and final student-level report is also the one that appears on both of a teacher's dashboards. The **Idle Disengagement Alert** is a simple alert card, triggered when a student has produced no statements at all in the trailing N days for an otherwise-active textbook deployment — no reading, no quiz attempts, nothing. Unlike every other report in this chapter, it does not require the student to have done anything poorly; the absence of activity is itself the signal.

Because a whole section's worth of silent students is exactly what a teacher needs to catch at a glance, the Idle Disengagement Alert is one of the four reports pulled directly into the My Classes Dashboard alongside the Class Mastery Heatmap, the Completion Funnel, and the At-Risk Roster — the same table shown earlier in this chapter. A teacher does not have to open nine separate Student Detail dashboards looking for silence; the section-level rollup of this one report surfaces it directly on the landing page.

!!! mascot-warning "Why Doesn't the Group-of-Ten Rule Blank Out a Single Student's Report?"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    [Chapter 15](../15-privacy-and-dashboard-mechanics/index.md) and [Chapter 27](../27-compliance-and-district-reporting/index.md) both established a default privacy rule: no report may show a disaggregated result for a group smaller than ten. A Student Detail Dashboard is a group of exactly one — so why isn't every report in this chapter blank on day one? The threshold's real purpose is to stop re-identification by parties *without* a legitimate relationship to the student, and a teacher viewing their own rostered student already knows that student by name; showing them nothing new. So the threshold applies to cross-group, de-identified, and benchmark views — a district's School Comparison Report, say — and is explicitly exempted for a role's own directly-rostered scope. Don't mistake that exemption for a loophole: it is the documented, deliberate reason a teacher's own students' reports are visible at all.

The following list recaps all nine student-level reports together, now that each has been explained in full — a summary of what this chapter already covered, not new information.

- **Student Progress Overview** — how far along, overall: a progress bar and concept checklist.
- **Concept Mastery Radar** — how well, by category: a radar chart of BKT mastery scores.
- **Reading vs. Doing Balance** — reading verbs versus doing verbs, as a stacked bar.
- **Time-on-Task Timeline** — when and how long, as a session-level Gantt timeline.
- **Learning Velocity Report** — speeding up or stalling, as a slope of cumulative mastery.
- **Quiz Item Analysis** — performance at the individual question level, with drill-down.
- **Struggle Detector** — high effort, low success, ranked by severity.
- **Prerequisite Gap Analysis** — the likely upstream cause behind a flagged struggle.
- **Idle Disengagement Alert** — no activity at all in the trailing window, shared with My Classes.

## Key Takeaways

- The **My Classes Dashboard** is a teacher's section-level landing page; the **Student Detail Dashboard** is the single-student view reached by clicking one name on it — the same drill-down mechanic Chapter 15 already described.
- **Student Progress Overview** measures how far a student has come against the textbook's full concept set, without judging confidence.
- **Concept Mastery Radar** groups a student's Bayesian Knowledge Tracing mastery scores by taxonomy category into a shape a teacher can read at a glance.
- **Reading Vs Doing Balance** compares reading-verb statements against doing-verb statements to flag students who are only ever consuming content passively.
- **Time-On-Task Timeline** shows session-level timing, distinguishing steady engagement from a single cram session with the same eventual mastery score.
- **Learning Velocity Report** tracks whether a student's rate of progress is rising, flat, or falling over time.
- **Quiz Item Analysis** drops to the individual-question level, catching patterns a concept-level score would average away.
- **Struggle Detector** combines high attempt count with low success to flag concepts a student is actively stuck on, not merely hasn't reached yet.
- **Prerequisite Gap Analysis** walks the learning graph upstream from a flagged struggle to name the likely root-cause concept.
- **Idle Disengagement Alert** flags total inactivity and is the one student-level report that also rolls up into My Classes.

!!! mascot-celebration "You Can Now Read a Student's Whole Story"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    What does the evidence show? You can now open a single student's Student Detail Dashboard and read a complete, evidence-backed story — how far they've come, how well, when they worked, where they're stuck, and why. In [Chapter 29: Class-Level Reports and Teacher Tools](../29-class-level-reports-and-tools/index.md), the lens widens from one student back to the whole section — the Class Mastery Heatmap, the At-Risk Roster, and the rest of My Classes, covered in the depth this chapter reserved for a single learner.
