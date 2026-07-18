---
title: Textbook Author Dashboards and Content Reports
description: How the textbook author persona uses the Content Insights dashboard and eight content-effectiveness reports to judge whether pages, MicroSims, and questions are actually teaching.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 19:57:20
version: 0.09
---

# Textbook Author Dashboards and Content Reports

## Summary

This chapter introduces the textbook author persona through the Content Insights dashboard and all eight content-effectiveness reports — page effectiveness, MicroSim impact, confusing-content detection — that tell an author whether their content is actually teaching.

## Concepts Covered

This chapter covers the following 12 concepts from the learning graph:

1. Content Insights Dashboard
2. Experiments Dashboard
3. Page Effectiveness Report
4. MicroSim Impact Report
5. Confusing-Content Finder
6. Drop-Off Map
7. Concept-Coverage Gaps
8. Question Health Report
9. Version Comparison Report
10. Cross-District Benchmark
11. Correlation Explorer
12. Experiment Designer

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)

---

!!! mascot-welcome "From the Whole Section to the Whole Textbook"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 29 handed a teacher a lens wide enough to see thirty students at once. This chapter widens the lens again — past any one section, past any one district — to ask a question only the person who wrote the content can really answer: is the textbook itself doing its job? Let's follow the record.

Every report covered so far in this book evaluates a learner: how much a student has mastered, how a whole section is pacing, which names belong on an at-risk roster. This chapter turns that camera around. The **textbook author** — the third and final persona this book covers, after the district administrator and the teacher — is not asking "how is this student doing?" but "how is this page doing? How is this MicroSim doing? Is this question actually measuring anything useful?" The specification names this shift precisely: the author-facing reports "evaluate the textbook itself, not the students — the feedback loop for authors." Everything in this chapter is that feedback loop.

The author's home screen for this feedback loop is the **Content Insights Dashboard**, a single canvas built from eight fixed reports plus one interactive tool for exploring correlations on demand. A second, smaller dashboard — the **Experiments Dashboard** — sits beside it and holds one more interactive tool, the Experiment Designer, which is where an author moves from observing what already happened to deliberately testing what happens next. Both dashboards share the same underlying evidence as every report in this book: statements compressed into summary vertices, never a raw event log an author has to sift through by hand.

## Who the Author Is, and What They Can (and Cannot) See

Before touching a single report, it helps to be precise about what an author's role actually grants, because it is structured differently from a district administrator's or a teacher's. A District Administrator's scope is one district; a teacher's scope is their own rostered sections. An author's scope is neither — it is defined by **content**, not by tenant. The specification's role table states this directly: the Author / Curriculum role's scope is "Textbook definitions," and its capabilities are "Content insights, experiments; no student PII." A textbook is written once and deployed into many districts at once, each district's event stream kept isolated from the others (the same tenancy boundary [Chapter 6](../06-multi-tenancy-rosters-identity/index.md) established), yet the author who wrote that textbook needs to see how it performs everywhere it runs. Content-scoped access is what makes that possible without breaking the isolation guarantee.

Three facts about that scope are worth holding onto before the reports below start assuming them silently.

- An author's dashboards are scoped to the textbooks they author, not to any single school, district, or section.
- Every report and tool available to the author reads aggregated, de-identified evidence — never a named student's individual record. The role explicitly carries **no student PII**.
- Aggregating evidence across many districts at once is not unconditional; it is gated by the same privacy aggregation threshold this book has referenced since [Chapter 15](../15-privacy-and-dashboard-mechanics/index.md), and one report later in this chapter enforces it especially strictly.

!!! mascot-thinking "Content-Scoped, Not Tenant-Scoped"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Every earlier persona in this book had a scope shaped like a box on an org chart — one district, one school, one roster. The author's scope is shaped like a book instead. That difference is why the same eight reports an author reads for one textbook can, in principle, describe that textbook's performance across every district that has deployed it — as long as the privacy rules below are respected at every step.

## One Pipeline, Eight Windows

All eight content-effectiveness reports read from the same small set of summary vertices this book has already introduced. A `PageEngagement` vertex compresses everything a single student did on a single page into one record — dwell time, how many times they revisited it, how far they scrolled. A `MicroSimEngagement` vertex does the same for one student's interactions with one MicroSim. A `QuestionResponse` vertex compresses one student's attempts at one question into attempt counts, successes, and a mean score. And a `ConceptMastery` vertex — familiar from Chapter 28's Concept Mastery Radar — holds one student's mastery estimate for one concept. None of these vertices were built for authors specifically; they are the same compressed evidence every earlier persona's reports already draw from, just recombined at the grain of a page, a MicroSim, or a question instead of a student or a section.

Seeing all eight reports as different windows onto the same four vertex types is worth a diagram before the reports pile up individually, since every one of them refers back to this same small set of inputs.

#### Diagram: How Eight Content Reports Read Four Summary Vertices

<iframe src="../../sims/content-insights-pipeline-flow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>How Eight Content Reports Read Four Summary Vertices</summary>
Type: workflow
**sim-id:** content-insights-pipeline-flow<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/organizational-analytics/tree/main/docs/sims/end-to-end-pipeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Explain how the four summary vertices already introduced in this book (PageEngagement, MicroSimEngagement, QuestionResponse, ConceptMastery) feed into the eight Content Insights reports, so the reports read as different views of the same evidence rather than eight separate data sources.

Purpose: A horizontal pipeline diagram with four labeled source boxes on the left (PageEngagement, MicroSimEngagement, QuestionResponse, ConceptMastery), fanning through a central "Content Insights Dashboard" hub, out to eight report boxes on the right (Page Effectiveness, MicroSim Impact, Confusing-Content Finder, Drop-off Map, Concept-Coverage Gaps, Question Health, Version Comparison, Cross-District Benchmark). Each report box has a thin connecting line back to only the source boxes it actually reads, so a learner can see, for example, that Question Health connects only to QuestionResponse while Page Effectiveness connects to both PageEngagement and ConceptMastery.

Interactive features: Clicking any of the four source boxes opens an infobox recapping that vertex's grain and key properties from Chapter 8. Clicking any of the eight report boxes highlights its incoming connections and opens an infobox with that report's one-sentence purpose, matching the definition given in this chapter's prose. A "Reset" button clears all highlighting.

Color coding: The four source vertices in the book's teal accent color to mark "already covered evidence"; the eight report boxes in a warm amber to mark "new in this chapter"; highlighted connection lines thicken and darken on click.

Responsive design: Canvas width tracks the containing element's width. On narrow viewports the source boxes stack above the hub and the report boxes stack below it, rather than all three columns competing for horizontal space.
</details>

## Reading a Single Page: Effectiveness, Confusion, and Drop-Off

The simplest of the eight reports asks the simplest question: is this one page working? The **Page Effectiveness Report** answers it by correlating a page's engagement — the dwell time and scroll depth captured in its `PageEngagement` vertices — with the downstream mastery of whichever concepts that page covers. A page many students linger on, that is followed by strong mastery scores on its linked concepts, is doing its job. A page students blow past in four seconds, followed by weak mastery on the same concepts, is a candidate for revision — though, as with most of this chapter's reports, correlation is the tool, not causation; a page's dwell time and the mastery that follows it can both be explained by a third factor, such as how hard the underlying concept already was.

Two more reports look at the same page-level evidence from different angles. The **Confusing-Content Finder** looks for a specific, telling pattern: a page with *both* high dwell time *and* high revisit count, paired with *low* subsequent success on related questions — the signature of a student rereading something several times and still not getting it, as opposed to a student lingering because the material is simply rich and rewarding to explore. The **Drop-Off Map** takes a step back from any single page to look at the whole sequence: where, across an entire textbook version, do students stop progressing? It renders as a Sankey diagram or a funnel narrowing chapter by chapter, the same funnel-chart component ([Chapter 1](../01-lms-to-experience-api/index.md)'s dashboard-mapping table already named `go.Funnel`) that powers a class-level Completion Funnel, but scoped here to an entire textbook version rather than one section's roster.

Having explained what each of these three page-and-progression reports shows, the following table organizes them side by side, since an author typically checks all three together rather than reading just one in isolation.

| Report | Unit of Analysis | What It Answers |
|---|---|---|
| Page Effectiveness Report | Page | Does this page's engagement correlate with strong downstream mastery? |
| Confusing-Content Finder | Page / Question | Which pages show the high-dwell, high-revisit, low-success pattern of genuine confusion? |
| Drop-Off Map | Chapter / Page | Where, across a whole textbook version, do students stop progressing? |

## Seeing the Whole Textbook at Once

Two more reports drop the single-page view entirely and look at the textbook as a whole. The **Concept-Coverage Gaps** report overlays engagement evidence directly onto the concept dependency graph — the same DAG [Chapter 7](../07-property-graph-data-model/index.md) introduced as the property graph's backbone — and highlights concepts with little or no evidence behind them at all: no page, MicroSim, or question meaningfully covers them, or the ones that do have drawn almost no student engagement. A concept sitting in the middle of a prerequisite chain with a coverage gap underneath it is a structural risk the mastery reports alone would never surface, because there is no engagement to measure in the first place.

#### Diagram: Concept-Coverage Gaps Overlaid on the Learning Graph

<iframe src="../../sims/concept-coverage-gaps-overlay/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Concept-Coverage Gaps Overlaid on the Learning Graph</summary>
Type: graph-model
**sim-id:** concept-coverage-gaps-overlay<br/>
**Library:** vis-network<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/signal-processing/tree/main/docs/sims/graph-viewer<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: identify, differentiate

Learning objective: Let the learner identify which concepts in a dependency graph have little or no engagement evidence behind them, and distinguish a coverage gap (no content or no engagement) from a mastery gap (content exists but students are not learning it).

Purpose: An interactive node-link rendering of a concept dependency graph (reusing the DEPENDS_ON structure Chapter 7 introduced), where each concept node is shaded by an evidence-count scale rather than a mastery scale: well-covered concepts in a solid teal fill, low-evidence concepts in a pale outline-only fill, and zero-evidence concepts marked with a dashed red outline.

Interactive features: Clicking any concept node opens an infobox showing its evidence count (how many PageEngagement, MicroSimEngagement, and QuestionResponse vertices reference it through a COVERS edge) and its position in the prerequisite chain. A search box lets the learner jump to a named concept. A toggle switches the overlay between "coverage" (evidence count) and "mastery" (the ConceptMastery-based shading used elsewhere in this book), making the distinction between the two kinds of gap visible on the same underlying graph.

Color coding: Solid teal for well-covered concepts, pale outline for low evidence, dashed red outline for zero evidence — a shape-and-fill distinction rather than a pure color distinction, so it remains legible for color-vision-deficient readers.

Responsive design: The graph canvas resizes to the containing element's width and re-runs its force layout on resize rather than clipping nodes off-screen; on narrow viewports the search box and toggle stack above the canvas instead of beside it.
</details>

The **Question Health Report** performs a related audit at the level of individual quiz items, across every section in every district that uses the textbook rather than one teacher's own roster. It flags questions that are too easy (nearly everyone answers correctly, so the question tells an author nothing about who has actually mastered the concept), too hard (nearly everyone answers incorrectly, which just as often signals a badly worded question as a hard concept), or non-discriminating (students who otherwise show strong mastery of the surrounding concept answer it no better than students who do not). This is the same difficulty-and-discrimination logic behind a section-level Question Discrimination report a teacher might run, but computed across the textbook's entire population of learners rather than one classroom's worth.

Before moving on, it is worth naming the flags this report can raise explicitly, since a table works better here than another paragraph of prose.

| Flag | What It Means | Likely Fix |
|---|---|---|
| Too easy | Nearly all students answer correctly regardless of mastery | Raise difficulty, or accept it as a confidence-building item |
| Too hard | Nearly all students answer incorrectly regardless of mastery | Check wording, or check whether the underlying concept was actually taught |
| Non-discriminating | High- and low-mastery students perform about the same | Rewrite the question so it distinguishes true understanding from guessing |

!!! mascot-tip "Check the Evidence Count Before You Trust a Flag"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A question flagged "too hard" after three attempts total is a very different signal than the same flag after three thousand attempts. Every `QuestionResponse` vertex behind this report carries its own attempt count, so a working habit is to glance at that count before acting on a flag — a low-evidence flag is a reason to gather more data, not a reason to rewrite a question yet.

## Judging Impact Without Fooling Yourself

The next report is the one place in this chapter's whole catalog where the specification stops to warn the reader directly. The **MicroSim Impact Report** compares the mastery of students who used a given MicroSim against students who skipped it, rendered as an effect-size chart. On its face, that sounds like exactly what an author wants to know: did this simulation help? But the specification labels the comparison explicitly as "observational; confounded" — the students who chose to open a MicroSim and the students who skipped it were never randomly assigned to those two groups, so any mastery difference between them might be caused by the MicroSim, or might simply reflect that more motivated or better-prepared students were the ones who opened it in the first place.

#### Diagram: MicroSim Impact — Observational Delta vs. a Controlled Effect

<iframe src="../../sims/microsim-impact-observational-vs-controlled/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>MicroSim Impact — Observational Delta vs. a Controlled Effect</summary>
Type: chart
**sim-id:** microsim-impact-observational-vs-controlled<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/theory-of-knowledge/tree/main/docs/sims/correlation-causation<br/>

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Let the learner evaluate why an observational mastery delta between MicroSim users and non-users can be confounded by a hidden third factor, and justify why only a controlled experiment can support a causal claim about the MicroSim's effect.

Canvas layout: Two side-by-side panels. The left panel shows a simple bar comparison — "Used the MicroSim" versus "Skipped the MicroSim" — each bar's height set by mean mastery score, with a visible gap between them labeled "Observed Delta." The right panel shows the same two groups after a third variable, "Prior Mastery Band," is revealed as a `createSlider()`-controlled toggle: when toggled on, both groups split into low/medium/high prior-mastery sub-bars, and the gap in the left panel visibly shrinks or reverses within each sub-band.

Interactive features: A "Reveal confound" button animates the transition from the left panel's simple comparison to the right panel's stratified view. Hovering any bar shows the exact mean mastery score and student count behind it. A caption below the chart updates dynamically: before the reveal, "Naive comparison: MicroSim users score higher"; after the reveal, "Within each prior-mastery band, the gap shrinks — the naive comparison was partly measuring who was already stronger, not what the MicroSim taught."

Color coding: Both groups shaded in neutral gray-blue before the reveal; after the reveal, prior-mastery sub-bands shaded on a light-to-dark scale to visually separate the confound from the outcome measure.

Responsive design: The two panels stack vertically on narrow viewports instead of appearing side by side, with the "Reveal confound" button remaining full-width and easy to tap.
</details>

!!! mascot-warning "An Observed Gap Is a Question, Not an Answer"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to read a MicroSim Impact Report showing a large mastery gap as proof the MicroSim works. The specification's own language — "observational; confounded" — is a direct instruction not to make that leap. Treat every gap this report shows you as a lead worth investigating, not a conclusion worth publishing. The tool built for turning a lead into a real answer is the Experiment Designer, covered later in this chapter and in full in [Chapter 31](../31-designing-ab-experiments/index.md).

## Comparing Across Versions, and Across Districts

Two reports widen the lens once more, this time across time and across tenants rather than across content. The **Version Comparison Report** lets an author place two published versions of the same textbook side by side — say, version 2.3 against a version 2.4 that added worked examples to a difficult chapter — and compare engagement and mastery across them using a small-multiples layout, one small chart per metric, arranged so the two versions are easy to eyeball together. This is the same kind of question the Experiment Designer can answer with real statistical confidence, but the Version Comparison Report answers it the fast, observational way: two versions were both deployed, and their outcomes are simply placed next to each other, without random assignment guaranteeing the two groups of students who happened to see each version were otherwise comparable.

The **Cross-District Benchmark** goes a step further still, aggregating a textbook's performance across every district that has deployed it into a single de-identified box plot. Because this report crosses tenant boundaries that this book has otherwise treated as a hard wall since Chapter 6, it is one of only two reports in the entire specification singled out for strict enforcement of the privacy aggregation threshold — the same minimum-group-size rule [Chapter 15](../15-privacy-and-dashboard-mechanics/index.md) introduced, which blocks any report from revealing a disaggregated result for a group smaller than the threshold. No district's numbers ever appear named or alone in this report; every value shown has already been folded into an aggregate above the minimum size.

#### Diagram: Cross-District Benchmark — Applying the Privacy Aggregation Threshold

<iframe src="../../sims/cross-district-benchmark-privacy-threshold/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Cross-District Benchmark — Applying the Privacy Aggregation Threshold</summary>
Type: workflow
**sim-id:** cross-district-benchmark-privacy-threshold<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: apply, determine

Learning objective: Apply the aggregation-threshold rule to determine whether a cross-district comparison may be displayed to an author, given a set of candidate district groupings of varying size.

Purpose: A Mermaid flowchart starting from a "Candidate district group" decision node, branching on "group size >= 10 students?" Yes leads to a "Display de-identified aggregate (box plot)" box; No leads to a "Suppress — merge with an adjacent group or omit" box. A third box below both outcomes, "Cross-District Benchmark Report," receives arrows from both branches, showing that the report always renders something, but never a suppressed group's raw values.

Interactive features: Every node is wired with a Mermaid `click` directive. Clicking the decision node opens an infobox defining the aggregation threshold and its default value (group size >= 10). Clicking "Display de-identified aggregate" opens an infobox explaining that even a displayed aggregate never identifies a single district by name in the chart itself. Clicking "Suppress" opens an infobox explaining that suppression is enforced at the API layer, not merely hidden in the dashboard, so no client-side request can retrieve the raw group either.

Color coding: The threshold decision node in the book's amber accent color to mark it as the single enforcement choke point; the "Display" outcome in teal; the "Suppress" outcome in a muted gray to signal "intentionally withheld," not "missing data."

Responsive design: The flowchart resizes to the containing element's width; on narrow viewports the two outcome boxes stack vertically beneath the decision node instead of branching left and right.
</details>

The following recap places every report this chapter has covered into one reference table, now that each has been explained individually — useful as a quick lookup rather than new material.

| Report | Unit | Primary Visualization |
|---|---|---|
| Page Effectiveness Report | Page | Scored table |
| MicroSim Impact Report | MicroSim | Effect-size chart |
| Confusing-Content Finder | Page / Question | Ranked list |
| Drop-Off Map | Chapter / Page | Sankey / funnel |
| Concept-Coverage Gaps | Textbook | Learning-graph overlay |
| Question Health Report | Question | Table with flags |
| Version Comparison Report | TextbookVersion | Small multiples |
| Cross-District Benchmark | Textbook | Box plot (de-identified) |

!!! mascot-encourage "Eight Reports Is a Catalog, Not a Checklist"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    You do not need to run all eight of these reports every week. Most authors settle into a rhythm: Concept-Coverage Gaps and Question Health when planning a revision, Page Effectiveness and the Confusing-Content Finder while drafting it, and Version Comparison and Cross-District Benchmark after it ships. The reports are a toolbox organized around one recurring question — is the content working — not a sequence you must complete in order.

## Two Tools for When a Fixed Report Isn't Enough

Just as a teacher's ten class-level reports were joined by six interactive tools in the previous chapter, an author's eight fixed reports are joined by two interactive tools that let a question be asked directly instead of waiting for the right report to exist. The **Correlation Explorer** lets an author pick any engagement metric and any outcome metric and see a scatter plot with a trendline — dwell time against mastery, revisit count against completion, whatever pairing the author wants to test informally. Its defining feature is not the scatter plot itself but the label the specification insists sit next to it: every result is "clearly labeled correlational, not causal." That label is not a legal disclaimer bolted on afterward; it is the same caution this chapter has already applied to the Page Effectiveness Report and the MicroSim Impact Report, generalized into a tool an author can point at any pair of metrics they like.

The **Experiment Designer** is the tool that answers the question the Correlation Explorer and the MicroSim Impact Report cannot: it lets an author define a genuine, randomized A/B test — a hypothesis, a primary outcome metric, variants bound to specific textbook or MicroSim versions, and an eligibility predicate deciding which districts and sections participate. Unlike the Correlation Explorer, which lives on the Content Insights Dashboard alongside the eight fixed reports, the Experiment Designer belongs to the separate **Experiments Dashboard**, where it sits next to a readout view showing enrollment, the primary metric with a confidence interval, and a plain-language verdict once an experiment concludes. One governance detail is worth knowing before Chapter 31 goes further: a district's decision to opt out of experimentation entirely is enforced automatically and cannot be overridden by an author, no matter how promising a hypothesis looks.

- The **Correlation Explorer** answers "is there a relationship between these two metrics?" using existing, already-collected evidence — fast, flexible, and explicitly correlational.
- The **Experiment Designer** answers "does changing this actually cause a better outcome?" by running a properly randomized comparison going forward — slower to set up, but built to support a causal claim the other seven reports and one tool in this chapter cannot.

Interestingly, the two dashboards this chapter introduces do not ship on the same timeline. The specification's delivery roadmap places the Experiments Dashboard's underlying service alongside the admin UI in an earlier milestone, while the full Content Insights report catalog is scheduled only for the final, general-availability milestone. In practice, that means an author's path into this system may well begin with defining an experiment before all eight fixed reports are even available to browse casually — one more reason the Correlation Explorer and the Experiment Designer matter as much as the fixed reports around them.

## Bringing the Author's Toolbox Together

Step back from the eight individual reports and two tools, and one shape emerges: every piece of this chapter reads the same four summary vertices this book has used since Chapter 8, just recombined at the grain of a page, a MicroSim, a question, a textbook version, or a whole deployed textbook — never at the grain of a single named student, because the author role explicitly carries no student PII. The **Content Insights Dashboard** houses the eight fixed reports plus the Correlation Explorer for open-ended, correlational questions. The **Experiments Dashboard** houses the Experiment Designer for the one kind of question none of those reports can answer on their own: whether a specific change actually causes a better outcome, not merely correlates with one.

That distinction — correlational evidence that generates a hypothesis, versus a controlled experiment that tests it — is the thread this chapter leaves for [Chapter 31: Designing and Reading A/B Experiments](../31-designing-ab-experiments/index.md) to pick up. Everything from the MicroSim Impact Report's confounded comparison to the Correlation Explorer's scatter plots exists to help an author notice something worth testing. The Experiment Designer is where that noticing turns into a real answer.

## Key Takeaways

- The **Content Insights Dashboard** is the textbook author's home screen, built from eight fixed reports plus the Correlation Explorer.
- The **Experiments Dashboard** houses the Experiment Designer and a per-experiment readout, and is a separate surface from Content Insights.
- An author's scope is content-based — the textbooks they author — not tied to any one district or school, though it still carries no access to individual student PII.
- The **Page Effectiveness Report** correlates a page's engagement with the downstream mastery of the concepts it covers.
- The **Confusing-Content Finder** flags the specific pattern of high dwell, high revisits, and low subsequent success.
- The **Drop-Off Map** shows where students stop progressing across an entire textbook version.
- **Concept-Coverage Gaps** overlays engagement evidence onto the concept dependency graph to reveal concepts with little or no content behind them.
- The **Question Health Report** flags items that are too easy, too hard, or non-discriminating, across every section using the textbook.
- The **MicroSim Impact Report** is explicitly observational and confounded — a lead to investigate, not a causal conclusion.
- The **Version Comparison Report** places two published textbook versions side by side, observationally.
- The **Cross-District Benchmark** aggregates performance across districts under strict enforcement of the privacy aggregation threshold.
- The **Correlation Explorer** lets an author test any metric pairing informally, always labeled correlational, not causal.
- The **Experiment Designer** is the one tool built to support an actual causal claim, through a properly randomized comparison.

!!! mascot-celebration "You've Now Met All Three Personas"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    What does the evidence show? You've now walked in the shoes of a district administrator, a teacher, and a textbook author, and seen how the same compressed statement log serves all three without ever mixing up their scopes. Next, in [Chapter 31: Designing and Reading A/B Experiments](../31-designing-ab-experiments/index.md), we open the Experiment Designer for real and learn how to turn a correlational lead — like the one the MicroSim Impact Report gave you — into a properly tested, causal answer.
