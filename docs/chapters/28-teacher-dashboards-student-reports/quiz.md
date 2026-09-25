---
title: "Quiz: Teacher Dashboards and Student-Level Reports"
description: Review questions on the My Classes and Student Detail dashboards and the nine student-level reports — progress, mastery, reading-vs-doing, timing, velocity, quiz items, struggle, prerequisites, and disengagement.
social:
   cards: false
---
# Quiz: Teacher Dashboards and Student-Level Reports

Test your understanding of this project's teacher dashboards and student-level reports with these review questions.

---

#### 1. What is the key difference between the My Classes Dashboard and the Student Detail Dashboard?

<div class="upper-alpha" markdown>
1. My Classes is a section-level landing page built from class-wide reports; Student Detail is the single-student view reached by clicking one name, built from all nine student-level reports
2. My Classes is for the Textbook Author, while Student Detail is for the Teacher
3. My Classes shows raw statements, while Student Detail shows only aggregated summaries
4. My Classes and Student Detail are two names for the identical dashboard, shown to different roles
</div>

??? question "Show Answer"
    The correct answer is **A**. My Classes is the section-level landing page; clicking one student's name drills into the Student Detail Dashboard, built from all nine reports this chapter covers. B misassigns both dashboards to the wrong persona — both belong to the Teacher. C reverses which dashboard shows aggregated versus raw data, and neither shows raw statements directly. D wrongly collapses two distinct screens into one.

    **Concept Tested:** My Classes Dashboard / Student Detail Dashboard

    **See:** [Two Dashboards, One Drill-Down](index.md#two-dashboards-one-drill-down)

---

#### 2. How does the Concept Mastery Radar differ from the Student Progress Overview?

<div class="upper-alpha" markdown>
1. The Progress Overview uses BKT mastery scores, while the Concept Mastery Radar ignores mastery entirely and counts only page views
2. The two reports are identical in content, differing only in chart type
3. The Concept Mastery Radar only applies to concepts a student has not yet attempted
4. The Progress Overview asks "mastered or not" as a simple checklist against the full concept set; the Concept Mastery Radar asks "mastered how well, and in which taxonomy categories," rendering a shape rather than a single percentage
</div>

??? question "Show Answer"
    The correct answer is **D**. The Progress Overview is a binary checklist against the full concept catalog, while the Concept Mastery Radar groups BKT mastery scores by taxonomy category into a shape that reveals strengths and weaknesses a single percentage cannot. A reverses which report actually uses BKT scores — both ultimately draw from mastery data, but in different forms. B ignores their genuinely different content, not just chart type. C invents a restriction the radar does not have.

    **Concept Tested:** Concept Mastery Radar

    **See:** [Concept Mastery Radar: Mastery, Grouped and Shaped](index.md#concept-mastery-radar-mastery-grouped-and-shaped)

---

#### 3. What two families of xAPI verbs does the Reading vs. Doing Balance report compare?

<div class="upper-alpha" markdown>
1. voided versus completed statements
2. experienced statements (reading/watching) versus interacted and answered statements (actively doing something)
3. registered versus attempted statements
4. provisional versus reconciled statements
</div>

??? question "Show Answer"
    The correct answer is **B**. The report compares `experienced` statements, which record passive consumption, against `interacted` and `answered` statements, which record active engagement. A confuses this with Statement Immutability's voiding mechanism from an earlier chapter. C invents an unrelated verb pairing. D confuses this with the provisional/reconciled reconciliation status from earlier chapters, an entirely different concept.

    **Concept Tested:** Reading Vs Doing Balance

    **See:** [Reading vs. Doing Balance: A Quick Verb-Ratio Check](index.md#reading-vs-doing-balance-a-quick-verb-ratio-check)

---

#### 4. Why does the Time-on-Task Timeline matter even for two students who reach the identical final mastery score?

<div class="upper-alpha" markdown>
1. Because the mastery score itself is computed differently depending on session length
2. Because a cram session always produces a lower BKT mastery score than steady engagement
3. Because it reveals the pattern behind that score — one steady fifteen minutes nightly versus a single three-hour cram session — a difference in engagement pattern that the mastery score alone never shows
4. Because the Time-on-Task Timeline replaces the need for a mastery score entirely
</div>

??? question "Show Answer"
    The correct answer is **C**. The timeline surfaces a difference in engagement pattern — steady study versus a single cram session — that two students can share an identical mastery score while showing completely different session shapes underneath it. A invents an unsupported computational dependency. B makes an unsupported blanket claim about cram sessions always scoring lower. D overstates the timeline's role, which complements rather than replaces the mastery score.

    **Concept Tested:** Time-On-Task Timeline

    **See:** [Time-on-Task Timeline: When the Student Actually Worked](index.md#time-on-task-timeline-when-the-student-actually-worked)

---

#### 5. A student's Learning Velocity line has flattened even though their overall Progress Overview still shows a respectable completion percentage. What does this combination most likely indicate, and why is Velocity able to catch it when Progress Overview alone might not?

<div class="upper-alpha" markdown>
1. It indicates the student has fully mastered the course; Velocity simply confirms what Progress Overview already showed
2. It indicates a data-entry error, since Velocity and Progress Overview should always move in lockstep
3. It indicates the student needs no intervention, since a respectable Progress Overview always overrides a concerning Velocity trend
4. It indicates the student was previously making good progress but has since stalled — Velocity is a trend (is the snapshot improving or worsening) while Progress Overview is only a snapshot (how far along right now), so a student can look fine on one and concerning on the other
</div>

??? question "Show Answer"
    The correct answer is **D**. Because Progress Overview is a snapshot and Velocity is a trend, a student can look fine on the snapshot while the trend quietly signals a stall — exactly the "was ahead and has since stopped moving" case this chapter describes. A misreads a flattening trend as confirmation of success. B wrongly assumes the two measures must always agree. C wrongly lets one measure override a genuinely different signal from the other.

    **Concept Tested:** Learning Velocity Report

    **See:** [Learning Velocity Report: Speeding Up or Stalling Out](index.md#learning-velocity-report-speeding-up-or-stalling-out)

---

#### 6. A teacher notices a student's overall concept mastery score for a topic looks acceptable, but suspects something is still wrong with one specific assignment within that topic. Which report should the teacher open to investigate at the individual-question level?

<div class="upper-alpha" markdown>
1. Concept Mastery Radar
2. Reading vs. Doing Balance
3. Quiz Item Analysis
4. Time-on-Task Timeline
</div>

??? question "Show Answer"
    The correct answer is **C**. Quiz Item Analysis drops to the individual-question level, catching a pattern like consistently missing one specific question that a concept-level score would average away entirely. A stays at the category level, too coarse for this need. B compares reading versus doing activity, unrelated to per-question performance. D shows session timing, not question-level correctness.

    **Concept Tested:** Quiz Item Analysis

    **See:** [Quiz Item Analysis: Performance at the Question Level](index.md#quiz-item-analysis-performance-at-the-question-level)

---

#### 7. Why does the Struggle Detector require both a high attempt count and a low result score before flagging a concept, rather than flagging any concept with a low mastery score alone?

<div class="upper-alpha" markdown>
1. Because flagging low mastery alone would also flag concepts the student simply hasn't reached yet, which is a completely different situation from a concept the student has genuinely attempted repeatedly without success — the combination is what distinguishes "not yet attempted" from "actively stuck"
2. Because a high attempt count alone is always sufficient evidence of struggle, regardless of the resulting score
3. Because the Struggle Detector ignores result scores entirely and ranks concepts only by attempt count
4. Because low mastery scores are considered unreliable data and must be corroborated by a completely unrelated report before being trusted
</div>

??? question "Show Answer"
    The correct answer is **A**. Combining effort with low success is precisely what separates a concept the student hasn't gotten to yet from one they are actively stuck on, which is the distinction that makes this list actionable. B ignores the score half of the combination entirely. C contradicts the report's explicit use of result score alongside attempt count. D invents an unrelated data-reliability concern not described in the chapter.

    **Concept Tested:** Struggle Detector

    **See:** [Struggle Detector: Composing the Signals Into a Ranked List](index.md#struggle-detector-composing-the-signals-into-a-ranked-list)

---

#### 8. Why doesn't the default group-of-ten suppression threshold blank out every report on a Student Detail Dashboard, given that a single student is a group of exactly one?

<div class="upper-alpha" markdown>
1. Because the suppression threshold is disabled entirely for any dashboard viewed on a mobile device
2. Because the threshold's real purpose is stopping re-identification by parties without a legitimate relationship to the student, and a teacher viewing their own rostered student already knows that student by name — the threshold applies to cross-group, de-identified, and benchmark views, with a role's own directly-rostered scope explicitly exempted
3. Because Student Detail Dashboards are technically exempt from all privacy regulations
4. Because the mastery scores shown are randomized and therefore contain no identifiable information regardless of group size
</div>

??? question "Show Answer"
    The correct answer is **B**. The threshold exists to stop re-identification by parties without a legitimate relationship to the student, and a teacher already knows their own rostered students, so that specific exemption is what keeps Student Detail visible at all. A invents an unrelated device-based exemption. C overstates a scoped exemption into a blanket regulatory exemption. D fabricates a randomization mechanism the chapter never describes.

    **Concept Tested:** Idle Disengagement Alert (privacy threshold exemption)

    **See:** [Idle Disengagement Alert: The Report That Reaches Back to My Classes](index.md#idle-disengagement-alert-the-report-that-reaches-back-to-my-classes)

---

#### 9. A teacher tells a colleague, "This student's mastery score for photosynthesis is 0.62, so they got about 62% of the photosynthesis questions right." Evaluate this statement against what this chapter and Chapter 12 establish about what a mastery score actually represents.

<div class="upper-alpha" markdown>
1. The statement is correct, since a mastery score is defined as the percentage of questions answered correctly
2. The statement is correct only if the student answered exactly ten questions on that concept
3. The statement is a common but incorrect reading: 0.62 is a probability that the student has actually mastered the concept, not a percentage of questions answered correctly, and this misreading is especially risky for students sitting near the 0.75 "likely mastered" reference line, where a teacher's judgment matters most
4. The statement is irrelevant, since mastery scores are never shown to teachers in any report
</div>

??? question "Show Answer"
    The correct answer is **C**. A BKT mastery score is a probability of mastery, not a percent-correct score, and this exact misreading is most dangerous for students sitting near the reference line where a teacher's judgment matters most. A treats the score as the wrong kind of number entirely. B invents an arbitrary attempt-count condition that does not make the reading correct. D is false — mastery scores are the backbone of the Concept Mastery Radar and other reports teachers regularly view.

    **Concept Tested:** Concept Mastery Radar (mastery score interpretation)

    **See:** [Concept Mastery Radar: Mastery, Grouped and Shaped](index.md#concept-mastery-radar-mastery-grouped-and-shaped)

---

#### 10. A teacher has a student whose Progress Overview looks strong, whose Reading vs. Doing Balance shows a heavily reading-skewed ratio, and whose Time-on-Task Timeline shows one long session the night before every quiz deadline. Design a combination of this chapter's reports that would help the teacher form the most complete picture of what might actually be happening with this student, and briefly justify each choice.

<div class="upper-alpha" markdown>
1. Rely solely on the Concept Mastery Radar, since mastery scores alone always explain every engagement pattern
2. Cross-reference the Reading vs. Doing Balance (to confirm the student is mostly consuming rather than practicing), the Time-on-Task Timeline (to confirm the cram pattern rather than steady engagement), and the Learning Velocity Report (to see whether progress is still rising despite the pattern, or beginning to stall) — together distinguishing a student who crams effectively from one whose passive, last-minute habits are starting to catch up with them
3. Open only the Idle Disengagement Alert, since it is the single most comprehensive report in the set
4. Ignore all engagement-pattern reports and focus exclusively on whether the student's final grade meets the district's minimum threshold
</div>

??? question "Show Answer"
    The correct answer is **B**. Combining the three reports already named in the scenario — reading/doing ratio, session pattern, and progress trend — gives the teacher a genuinely fuller picture than any single report could, distinguishing a student whose habits are still working from one whose pattern is starting to catch up with them. A wrongly claims mastery alone explains engagement patterns it was never designed to capture. C picks a single, narrow report unrelated to the specific pattern described. D discards exactly the engagement signals the scenario is built around.

    **Concept Tested:** Reading Vs Doing Balance / Time-On-Task Timeline / Learning Velocity Report (synthesis)

---
