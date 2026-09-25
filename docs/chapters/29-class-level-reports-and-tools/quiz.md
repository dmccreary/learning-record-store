---
title: "Quiz: Class-Level Reports and Teacher Tools"
description: Review questions on Section Enrollment and Co-Teacher Assignment, the SectionRollup aggregation, the ten class-level reports, and the six interactive tools that let a teacher go beyond a fixed report.
social:
   cards: false
---
# Quiz: Class-Level Reports and Teacher Tools

Test your understanding of this project's class-level reports and interactive teacher tools with these review questions.

---

#### 1. What is the difference between Section Enrollment and Co-Teacher Assignment?

<div class="upper-alpha" markdown>
1. Section Enrollment connects a Student to a Section and defines the roster a class-level report aggregates over; Co-Teacher Assignment connects an Instructor to a Section and defines which instructors can view that section's reports
2. Section Enrollment and Co-Teacher Assignment are two names for the identical graph relationship
3. Section Enrollment determines which instructors see a report; Co-Teacher Assignment determines which students are included
4. Both relationships are computed from statements rather than maintained as administrative data
</div>

??? question "Show Answer"
    The correct answer is **A**. Section Enrollment defines the student roster a class-level report aggregates over, while Co-Teacher Assignment defines which instructors can view a section's reports — two distinct relationships serving two distinct purposes. B wrongly conflates them. C swaps their actual functions. D is false — both are administrative data maintained through roster sync, not derived from statements.

    **Concept Tested:** Section Enrollment / Co-Teacher Assignment

    **See:** [Before You Can Aggregate a Class, You Need One](index.md#before-you-can-aggregate-a-class-you-need-one)

---

#### 2. What does the Standards Coverage Report show?

<div class="upper-alpha" markdown>
1. A ranked list of students combining disengagement, low mastery, and prerequisite gaps
2. A scatter plot of question difficulty versus discrimination
3. A calendar heatmap of daily statement volume across the term
4. A coverage matrix mapping a section's concepts to external standards frameworks, showing which standards are satisfied and which remain uncovered
</div>

??? question "Show Answer"
    The correct answer is **D**. The Standards Coverage Report maps a section's concepts against external standards frameworks to show which standards are satisfied and which remain uncovered. A describes the At-Risk Roster. B describes Question Discrimination. C describes the Class Engagement Calendar — each a real but different report.

    **Concept Tested:** Standards Coverage Report

    **See:** [Standards Coverage: Concepts Meet External Frameworks](index.md#standards-coverage-concepts-meet-external-frameworks)

---

#### 3. How does a SectionRollup vertex get its values, according to this chapter?

<div class="upper-alpha" markdown>
1. It is computed directly from raw xAPI statements, bypassing ConceptMastery entirely
2. It is manually entered by a teacher once per grading period
3. It aggregates many students' ConceptMastery vertices through a ROLLS_UP_TO edge — the same underlying evidence used at the student level, viewed at a coarser grain, not computed from new statements
4. It only exists for sections with fewer than ten enrolled students
</div>

??? question "Show Answer"
    The correct answer is **C**. SectionRollup aggregates existing ConceptMastery vertices through a ROLLS_UP_TO edge, reusing the same underlying evidence at a coarser grain rather than requiring any new statements. A bypasses the actual aggregation mechanism the chapter describes. B invents a manual process that contradicts the automated, graph-based design. D fabricates an arbitrary size restriction.

    **Concept Tested:** SectionRollup aggregation

    **See:** [From One Student's Mastery to a Whole Section's](index.md#from-one-students-mastery-to-a-whole-sections)

---

#### 4. In the Class Mastery Heatmap, what does a whole column shaded dark indicate, as distinct from a whole row shaded dark?

<div class="upper-alpha" markdown>
1. A column shaded dark means one specific student is struggling; a row shaded dark means the whole class is struggling with one concept
2. A column shaded dark means most of the class is struggling with one specific concept; a row shaded dark means one specific student is struggling broadly across concepts
3. Both patterns mean the identical thing: a concept-wide weakness
4. A dark column or row always indicates a data error requiring re-ingestion
</div>

??? question "Show Answer"
    The correct answer is **B**. A dark column signals a concept most of the class struggles with, calling for possible re-teaching, while a dark row signals one student struggling broadly, calling for individual attention. A reverses the two patterns' meanings. C wrongly collapses two distinct, differently-actionable patterns into one. D wrongly treats a real analytical signal as a data-quality problem.

    **Concept Tested:** Class Mastery Heatmap

    **See:** [The Class Mastery Heatmap: Where the Trouble Is](index.md#the-class-mastery-heatmap-where-the-trouble-is)

---

#### 5. A teacher wants to know whether a specific chapter's completion time is tight and consistent across the class, or wildly spread out, with some students taking much longer than others. Which report answers this?

<div class="upper-alpha" markdown>
1. Class Engagement Calendar
2. Completion Funnel
3. Concept Difficulty Ranking
4. Pace Distribution
</div>

??? question "Show Answer"
    The correct answer is **D**. Pace Distribution shows a box plot of completion time per chapter, revealing exactly whether pacing is tight or spread out across the class. A shows when engagement happens across the term, not completion time. B counts how many students reached each point in sequence, not how long they took. C ranks concept difficulty, not chapter pacing.

    **Concept Tested:** Pace Distribution

    **See:** [Four More Section-Level Views](index.md#four-more-section-level-views)

---

#### 6. A teacher suspects one quiz question is poorly written because it doesn't seem to separate students who understand the concept from students who don't, regardless of how "hard" it looks. Which report is built to confirm or refute this suspicion?

<div class="upper-alpha" markdown>
1. MicroSim Utilization Report
2. Cohort Comparison Report
3. Question Discrimination
4. Standards Coverage Report
</div>

??? question "Show Answer"
    The correct answer is **C**. Question Discrimination plots exactly this — how well a question separates students who mastered the surrounding concept from those who did not, regardless of raw difficulty. A measures simulation usage, unrelated to question quality. B compares two sections, not individual question performance. D maps concepts to external standards, unrelated to item quality.

    **Concept Tested:** Question Discrimination

    **See:** [Measuring the Content Itself: Item and Tool-Level Reports](index.md#measuring-the-content-itself-item-and-tool-level-reports)

---

#### 7. A teacher wants to ask a highly specific, one-off question — "show me the raw statements for this one verb, in this date range, for this activity" — that doesn't match any predicate the Ad-Hoc Cohort Builder offers. Which tool is built for exactly this kind of request?

<div class="upper-alpha" markdown>
1. Statement Query Console
2. Funnel Builder
3. Report Scheduler
4. Alert Rule Builder
</div>

??? question "Show Answer"
    The correct answer is **A**. The Statement Query Console is specifically a guided filter builder over the raw statement log, letting a teacher construct exactly this kind of verb/date/activity filter and export the matching statements. B builds a custom content progression, unrelated to raw statement filtering. C schedules recurring delivery of an existing view, not ad-hoc filtering. D pushes threshold-based notifications, not raw statement queries.

    **Concept Tested:** Statement Query Console

    **See:** [Six Tools for When a Fixed Report Isn't Enough](index.md#six-tools-for-when-a-fixed-report-isnt-enough)

---

#### 8. Why does this chapter warn against reading the Cohort Comparison Report as proof that a specific change a teacher made between two sections caused the difference in scores?

<div class="upper-alpha" markdown>
1. Because the Cohort Comparison Report only compares sections taught by different teachers, never sections taught by the same teacher
2. Because the two sections likely differ in ways unrelated to the change itself — time of day, which students enrolled, what else was happening that week — so a real causal answer requires a properly randomized comparison, not a simple side-by-side of two naturally different groups
3. Because the report never actually displays any numerical data, only qualitative descriptions
4. Because comparing two sections is technically impossible with this project's current graph schema
</div>

??? question "Show Answer"
    The correct answer is **B**. Two sections differ in many uncontrolled ways beyond whatever change a teacher made, so a real causal claim requires a properly randomized comparison rather than a simple side-by-side. A is false — the chapter's own example is one teacher comparing two of their own sections. C contradicts the report's description as a grouped bar chart of real data. D is false — the report is a real, specified capability.

    **Concept Tested:** Cohort Comparison Report

    **See:** [Measuring the Content Itself: Item and Tool-Level Reports](index.md#measuring-the-content-itself-item-and-tool-level-reports)

---

#### 9. Why can a student ranked near the top of the At-Risk Roster not necessarily be the student with the single lowest test score in the section?

<div class="upper-alpha" markdown>
1. Because the At-Risk Roster ignores test scores entirely and ranks students only by attendance
2. Because the roster is sorted alphabetically by default, not by any risk-related measure
3. Because only students with perfect attendance are eligible to appear on the roster at all
4. Because the At-Risk Roster's composite score combines several independent warning signals — disengagement, low mastery, and prerequisite gaps — so a student where multiple signals point the same direction can rank higher than a student with one low score but no other warning signs
</div>

??? question "Show Answer"
    The correct answer is **D**. Because the ranking is a composite of multiple independent signals, a student flagged on all three can outrank a student with one low score but no other warning signs. A and B each misstate the ranking basis entirely. C invents an eligibility restriction that contradicts the roster's actual purpose of surfacing struggling students.

    **Concept Tested:** At-Risk Roster

    **See:** [At-Risk Roster: Where Every Signal Converges](index.md#at-risk-roster-where-every-signal-converges)

---

#### 10. Why does the Alert Rule Builder complement the At-Risk Roster rather than duplicate it?

<div class="upper-alpha" markdown>
1. Because the Alert Rule Builder and the At-Risk Roster read from two entirely unrelated data sources
2. Because the Alert Rule Builder replaces the At-Risk Roster entirely, making the roster obsolete
3. Because the Alert Rule Builder pushes a notification the moment a teacher-defined threshold is crossed, rather than requiring the teacher to remember to manually check the At-Risk Roster every morning — a proactive push instead of a report the teacher has to remember to pull
4. Because the At-Risk Roster only works for sections with a single teacher, while the Alert Rule Builder works for co-taught sections
</div>

??? question "Show Answer"
    The correct answer is **C**. The Alert Rule Builder proactively pushes a notification when a threshold is crossed, while the At-Risk Roster is a report a teacher has to remember to check — complementary delivery mechanisms for related information. A invents a data-source split the chapter never describes. B overstates the tool's role as a full replacement. D fabricates a co-teaching restriction neither tool actually has.

    **Concept Tested:** Alert Rule Builder

    **See:** [Six Tools for When a Fixed Report Isn't Enough](index.md#six-tools-for-when-a-fixed-report-isnt-enough)

---

#### 11. A teacher argues that reviewing the Question Discrimination report is a waste of time, reasoning that "if most students got a question right, the question must be a good one." Evaluate this reasoning against what this chapter establishes about item-analysis statistics.

<div class="upper-alpha" markdown>
1. The reasoning is incomplete: a question everyone gets right regardless of their overall mastery has low discrimination and is actually a weak question, because discrimination measures whether a question separates students who mastered the surrounding concept from those who did not — difficulty alone does not capture this
2. The reasoning is sound, since a high percentage of correct answers is the only measure that matters for question quality
3. The reasoning is sound only for MicroSim-based questions, not for standard quiz questions
4. The reasoning is irrelevant, since this LRS does not track individual question performance at all
</div>

??? question "Show Answer"
    The correct answer is **A**. A question everyone gets right regardless of mastery level has low discrimination — it fails to separate students who understand the concept from those who don't — which is exactly the weakness the chapter's own example describes. B collapses difficulty and discrimination into a single, incomplete measure. C invents an arbitrary restriction the chapter never makes. D contradicts the chapter's own item-level tracking through `QuestionResponse` vertices.

    **Concept Tested:** Question Discrimination (evaluated)

    **See:** [Measuring the Content Itself: Item and Tool-Level Reports](index.md#measuring-the-content-itself-item-and-tool-level-reports)

---

#### 12. A teacher co-teaches a large section with a special-education co-teacher and wants to (1) be notified automatically if any student goes quiet for five days, (2) periodically email themselves a snapshot of only the students currently below a mastery threshold, and (3) let both co-teachers see the identical class view. Using this chapter's tools and relationships, design a configuration that satisfies all three needs.

<div class="upper-alpha" markdown>
1. Use only the Class Mastery Heatmap, since a single fixed report can satisfy all three needs simultaneously
2. Rely on Co-Teacher Assignment so both instructors share the same section-level view, combine the Alert Rule Builder (threshold: idle five days) for proactive notification, and use the Ad-Hoc Cohort Builder to define the below-threshold student group paired with the Report Scheduler to email that view on a recurring cadence
3. Create two separate sections, one per teacher, so each can configure their own independent alerts
4. This combination of needs cannot be achieved with any of this chapter's existing tools
</div>

??? question "Show Answer"
    The correct answer is **B**. Co-Teacher Assignment already provides shared viewing for both instructors, the Alert Rule Builder covers the idle-five-days notification directly, and combining the Ad-Hoc Cohort Builder with the Report Scheduler covers the recurring below-threshold email — each need mapped to the specific tool built for it. A wrongly assumes one fixed report can cover all three needs, none of which are what the heatmap does. C unnecessarily fragments a co-taught section that Co-Teacher Assignment already supports as one section. D is wrong; the chapter's six tools are specifically built to compose into requests like this one.

    **Concept Tested:** Co-Teacher Assignment / Alert Rule Builder / Ad-Hoc Cohort Builder / Report Scheduler (synthesis)

---
