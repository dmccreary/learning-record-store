---
title: "Quiz: Textbook Author Dashboards and Content Reports"
description: Review questions on the Content Insights and Experiments dashboards, the eight content-effectiveness reports, and the Correlation Explorer and Experiment Designer tools for a textbook author.
social:
   cards: false
---
# Quiz: Textbook Author Dashboards and Content Reports

Test your understanding of this project's textbook author dashboards and content-effectiveness reports with these review questions.

---

#### 1. What is the difference between the Content Insights Dashboard and the Experiments Dashboard?

<div class="upper-alpha" markdown>
1. Content Insights houses the eight fixed reports plus the Correlation Explorer; the Experiments Dashboard is a separate surface housing the Experiment Designer and per-experiment readouts
2. They are two names for the identical dashboard, shown to different roles
3. Content Insights is for teachers, while the Experiments Dashboard is for textbook authors
4. Content Insights only shows data from a single district, while the Experiments Dashboard aggregates across districts
</div>

??? question "Show Answer"
    The correct answer is **A**. Content Insights bundles the eight fixed reports and the Correlation Explorer, while the Experiments Dashboard is a distinct surface for the Experiment Designer and its readouts. B wrongly conflates two separate dashboards. C misassigns both dashboards to the wrong persona — both belong to the Textbook Author. D invents a scoping distinction that does not match either dashboard's actual design.

    **Concept Tested:** Content Insights Dashboard / Experiments Dashboard

    **See:** [Bringing the Author's Toolbox Together](index.md#bringing-the-authors-toolbox-together)

---

#### 2. What does the Author / Curriculum role's access explicitly exclude?

<div class="upper-alpha" markdown>
1. Access to any report about MicroSims
2. Access to any textbook the author did not personally deploy to a district
3. Access to the Experiment Designer
4. Student personally identifiable information — the role's capabilities are content insights and experiments, with no student PII
</div>

??? question "Show Answer"
    The correct answer is **D**. The specification is explicit that the Author / Curriculum role's capabilities are content insights and experiments, with no access to student PII at all. A is false — MicroSim reports are a core part of the author's toolkit. B misstates scope, which is tied to authored textbooks, not deployment relationships. C is false — the Experiment Designer is a core author tool.

    **Concept Tested:** (Author scope, no student PII)

    **See:** [Who the Author Is, and What They Can (and Cannot) See](index.md#who-the-author-is-and-what-they-can-and-cannot-see)

---

#### 3. What specific pattern does the Confusing-Content Finder look for that the Page Effectiveness Report alone would not catch?

<div class="upper-alpha" markdown>
1. Low dwell time paired with high mastery, indicating an unusually efficient page
2. A page with no engagement evidence at all
3. High dwell time and high revisit count paired with low subsequent success on related questions — the signature of a student rereading something and still not getting it, as opposed to lingering because material is rich and rewarding
4. A page that has been revised more than three times
</div>

??? question "Show Answer"
    The correct answer is **C**. This specific combination — high dwell, high revisits, low subsequent success — is the confusion signature the Confusing-Content Finder is built to catch, distinct from a page students simply enjoy spending time on. A describes an unrelated, opposite pattern. B describes the Concept-Coverage Gaps report's concern instead. D invents an arbitrary revision-count trigger the chapter never describes.

    **Concept Tested:** Confusing-Content Finder

    **See:** [Reading a Single Page: Effectiveness, Confusion, and Drop-Off](index.md#reading-a-single-page-effectiveness-confusion-and-drop-off)

---

#### 4. How does the Concept-Coverage Gaps report differ from the Question Health Report?

<div class="upper-alpha" markdown>
1. The two reports are functionally identical, differing only in chart type
2. Concept-Coverage Gaps overlays engagement evidence onto the concept dependency graph to find concepts with little or no content/engagement behind them; Question Health Report audits individual quiz items for being too easy, too hard, or non-discriminating
3. Concept-Coverage Gaps only examines MicroSims, while Question Health Report only examines pages
4. Question Health Report identifies missing content, while Concept-Coverage Gaps identifies poorly worded questions
</div>

??? question "Show Answer"
    The correct answer is **B**. Concept-Coverage Gaps looks for structurally under-covered concepts across the learning graph, while Question Health Report audits individual quiz items for the too-easy, too-hard, or non-discriminating pattern — two genuinely different units of analysis. A ignores their distinct purposes. C wrongly restricts each report to a single content type. D swaps their actual functions.

    **Concept Tested:** Concept-Coverage Gaps / Question Health Report

    **See:** [Seeing the Whole Textbook at Once](index.md#seeing-the-whole-textbook-at-once)

---

#### 5. An author wants to see, across an entire textbook version, exactly where in the chapter sequence students stop progressing. Which report is built for this?

<div class="upper-alpha" markdown>
1. Question Health Report
2. Correlation Explorer
3. Cross-District Benchmark
4. Drop-Off Map
</div>

??? question "Show Answer"
    The correct answer is **D**. The Drop-Off Map renders exactly this — a Sankey or funnel view showing where, across a whole textbook version, students stop progressing. A audits individual quiz items, not sequence progression. B is an ad hoc correlation tool, not a fixed sequence report. C aggregates performance across districts, not chapter progression.

    **Concept Tested:** Drop-Off Map

    **See:** [Reading a Single Page: Effectiveness, Confusion, and Drop-Off](index.md#reading-a-single-page-effectiveness-confusion-and-drop-off)

---

#### 6. A Cross-District Benchmark request includes one district group with only 6 students who used a particular textbook. According to the aggregation threshold rule this chapter describes, what happens to that group's data in the resulting report?

<div class="upper-alpha" markdown>
1. It is displayed as a named, disaggregated data point since 6 students is close enough to the threshold
2. It is displayed but with the district's name redacted, while the raw count and score remain fully visible
3. It is suppressed — merged with an adjacent group or omitted — because it falls below the minimum group size, enforced at the API layer so no client-side request can retrieve the raw group either
4. It automatically triggers a Data Subject Request for every student in that district
</div>

??? question "Show Answer"
    The correct answer is **C**. A group of 6 falls below the default minimum group size of 10, so it is suppressed — merged with an adjacent group or omitted — with enforcement happening at the API layer, not merely hidden in the display. A ignores the threshold entirely. B still exposes disaggregated values, which the threshold specifically prevents regardless of whether a name is attached. D invents an automatic legal action the chapter never describes.

    **Concept Tested:** Cross-District Benchmark

    **See:** [Comparing Across Versions, and Across Districts](index.md#comparing-across-versions-and-across-districts)

---

#### 7. Why does the specification label the MicroSim Impact Report's comparison as "observational; confounded" rather than presenting it as a clean measure of the MicroSim's effect?

<div class="upper-alpha" markdown>
1. Because students who chose to open the MicroSim and students who skipped it were never randomly assigned to those groups, so any mastery difference could reflect the MicroSim's actual effect, or could simply reflect that more motivated or better-prepared students were the ones who opened it in the first place
2. Because the report technically cannot display any data at all until an experiment has concluded
3. Because MicroSim usage is never actually recorded as an xAPI statement
4. Because the report only works for MicroSims that have been marked "approved" in the MicroSim Registry
</div>

??? question "Show Answer"
    The correct answer is **A**. Without random assignment, any mastery gap between MicroSim users and non-users could reflect the simulation's real effect or simply reflect pre-existing differences between the two groups, which is exactly why the label warns against treating the gap as proof. B contradicts the report's actual purpose, which is to show data immediately, not after an experiment. C is false — MicroSim interactions are recorded as xAPI statements throughout this book. D fabricates an approval-status restriction the chapter never states.

    **Concept Tested:** MicroSim Impact Report

    **See:** [Judging Impact Without Fooling Yourself](index.md#judging-impact-without-fooling-yourself)

---

#### 8. Why can't the Correlation Explorer answer the same kind of question the Experiment Designer answers, even though both tools let an author investigate a metric relationship?

<div class="upper-alpha" markdown>
1. Because the Correlation Explorer and the Experiment Designer are actually the identical tool with two different names
2. Because the Correlation Explorer only works with pre-existing, already-collected evidence and is explicitly labeled correlational, not causal, while the Experiment Designer runs a properly randomized comparison going forward, which is what supports an actual causal claim
3. Because the Correlation Explorer only works for teachers, while the Experiment Designer only works for authors
4. Because the Experiment Designer cannot use any of the same summary vertices the Correlation Explorer reads from
</div>

??? question "Show Answer"
    The correct answer is **B**. The Correlation Explorer works only with already-collected, correlational evidence, while the Experiment Designer runs a genuinely randomized comparison going forward — the mechanism that actually supports a causal claim. A wrongly treats two distinct tools as one. C misassigns both tools, which belong to the author persona alone. D is an unsupported technical claim the chapter never makes.

    **Concept Tested:** Correlation Explorer / Experiment Designer

    **See:** [Two Tools for When a Fixed Report Isn't Enough](index.md#two-tools-for-when-a-fixed-report-isnt-enough)

---

#### 9. An author sees a large mastery gap in the Version Comparison Report between textbook version 2.3 and version 2.4 (which added worked examples), and announces to their team that "the worked examples proved a measurable improvement." Evaluate this claim against what this chapter establishes about the Version Comparison Report.

<div class="upper-alpha" markdown>
1. The claim is fully supported, since the Version Comparison Report is designed specifically to prove causal improvements between versions
2. The claim is valid only if version 2.3 and 2.4 were deployed to the exact same district
3. The claim overstates what the report can support: the Version Comparison Report is an observational, side-by-side comparison without random assignment guaranteeing the two groups of students who saw each version were otherwise comparable, so the gap is a lead worth testing with the Experiment Designer, not proof on its own
4. The claim is irrelevant, since the Version Comparison Report does not measure mastery at all
</div>

??? question "Show Answer"
    The correct answer is **C**. The Version Comparison Report is explicitly an observational side-by-side, not a randomized comparison, so a gap between versions is a lead worth testing rather than proof of causation. A directly contradicts the chapter's characterization of this report. B invents a same-district requirement the chapter never states as sufficient for a causal claim. D is false — the report explicitly compares mastery and engagement across versions.

    **Concept Tested:** Version Comparison Report (evaluated)

    **See:** [Comparing Across Versions, and Across Districts](index.md#comparing-across-versions-and-across-districts)

---

#### 10. An author wants to systematically identify the single best candidate for their next revision effort, using this chapter's tools without yet committing to a full randomized experiment. Design an investigative sequence using this chapter's reports and tools that would build the strongest possible case before deciding what to test.

<div class="upper-alpha" markdown>
1. Open the Cross-District Benchmark alone, since it aggregates the most data and therefore contains the most reliable signal for revision priorities
2. Start with Concept-Coverage Gaps and the Question Health Report to identify structurally under-covered concepts or flagged questions, cross-check any flagged pages against the Confusing-Content Finder and Page Effectiveness Report for corroborating engagement patterns, then use the Correlation Explorer to test any additional metric relationships that emerge, before deciding which candidate is strong enough to justify an Experiment Designer test
3. Rely exclusively on the MicroSim Impact Report, since it is the only report in the catalog that measures instructional effectiveness
4. Skip all reports and tools, and revise content based solely on the author's own intuition about which chapter feels weakest
</div>

??? question "Show Answer"
    The correct answer is **B**. Layering structural reports (Concept-Coverage Gaps, Question Health) with page-level corroboration (Confusing-Content Finder, Page Effectiveness) and then the Correlation Explorer builds convergent evidence before committing to a full randomized test — exactly the escalating rigor this chapter models throughout. A relies on one highly aggregated report unsuited to pinpointing a specific revision candidate. C wrongly treats one report as the sole measure of effectiveness, ignoring the other seven. D discards the entire evidence-based toolkit this chapter builds.

    **Concept Tested:** Concept-Coverage Gaps / Question Health Report / Confusing-Content Finder / Correlation Explorer (synthesis)

---
