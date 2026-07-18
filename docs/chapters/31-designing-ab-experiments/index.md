---
title: Designing and Reading A/B Experiments
description: How the Experiment Designer turns a correlational lead into a randomized A/B test, and how an author reads the resulting effect size, confidence interval, and guardrail checks to trust a verdict.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 20:04:09
version: 0.09
---

# Designing and Reading A/B Experiments

## Summary

This chapter covers the experimentation subsystem end to end: defining a hypothesis and its variants, sticky and deterministic assignment, guardrail metrics, and the statistical readout — effect size, confidence intervals, sample-ratio mismatch checks — an author uses to trust a result.

## Concepts Covered

This chapter covers the following 25 concepts from the learning graph:

1. Experiment Definition
2. Experiment Hypothesis
3. Primary Outcome Metric
4. Unit Of Randomization
5. Experiment Variant
6. Allocation Weight
7. Guardrail Metric
8. Eligibility Predicate
9. Deterministic Sticky Assignment
10. Sample-Ratio Mismatch
11. Effect Size
12. Cohens D
13. Confidence Interval
14. Two-Sided Significance Test
15. Sequential Testing Correction
16. Segmentation Analysis
17. Guardrail Regression Flag
18. Experiment Readout Dashboard
19. Textbook Registry
20. MicroSim Registry
21. Content Effectiveness Loop
22. AB Test Lifecycle
23. Cross-Persona Workflow
24. Shared Statement Log
25. Persona-Facing Report

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md)
- [Chapter 30: Textbook Author Dashboards and Content Reports](../30-author-dashboards-content-reports/index.md)

---

!!! mascot-welcome "From a Lead to a Real Answer"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 30 left you holding a lead, not an answer. The MicroSim Impact Report showed a mastery gap, and the Correlation Explorer showed a relationship between two metrics — but neither one could rule out a hidden third factor doing the real work. This chapter opens the Experiment Designer for real and shows you how to turn a lead like that into a result you can actually trust. Let's follow the record.

Every report and tool covered in the previous chapter shares the same limitation: it observes what already happened to students who made their own choices about what to read, click, or skip. A student who opens a MicroSim was never randomly assigned to open it, so any mastery difference between MicroSim users and everyone else might be caused by the MicroSim — or it might simply reflect that more prepared students were the ones who opened it in the first place. The only way to support a genuine causal claim — "this change *caused* better outcomes," not merely "this change is *associated with* better outcomes" — is to randomly assign students to different versions of content and compare what happens next. That is exactly what the **experimentation subsystem**, specified in §8 of the LRS specification, is built to do.

## Anatomy of an Experiment Definition

Every A/B test in this system starts as an **Experiment Definition**: a single node that gathers everything needed to run a controlled comparison in one place. Rather than treating a hypothesis, a metric, and a set of variants as separate scattered settings, the Experiment Definition binds them together so the whole test can be reviewed, approved, started, and later audited as one coherent object.

An Experiment Definition is built from six parts, and it helps to introduce each one in the order an author would actually fill them in:

- **Experiment Hypothesis** — a free-text statement of what the author expects to happen and why, such as "adding worked examples to Chapter 3 will raise concept mastery on the underlying photosynthesis concepts." It anchors the test to a specific, falsifiable claim rather than a vague hope that "the new version is better."
- **Primary Outcome Metric** — the single metric the experiment will be judged on, decided before the test starts: almost always downstream concept mastery, a quiz success rate, or a completion rate, never chosen after the fact from whichever metric happened to move the most.
- **Unit Of Randomization** — the thing randomly assigned to a variant. Usually `student_key`, so two students in the same class can see two different versions of a page. Sometimes `section_id` instead, meaning every student in a section is assigned together as one cluster.
- **Experiment Variant** — one arm of the test, mapped to a specific `TextbookVersion` or `MicroSimVersion`. Every experiment needs at least a control and a treatment, and each variant carries an **Allocation Weight**, the share of randomized units it should receive, such as 50% control and 50% treatment.
- **Guardrail Metric** — a metric that must not get meaningfully worse while the experiment runs, even if it isn't the thing being tested — engagement and disengagement-alert rates are typical examples.
- **Eligibility Predicate** — a rule deciding which districts, courses, or sections may participate at all. This is also where a district's opt-out of experimentation is enforced: opted-out students are excluded from randomization and always receive the control arm, a rule no author can override.

Having named all six parts in the order they get authored, the following table reinforces the same six as a quick-reference summary — useful once you already understand what each one means, not as a substitute for the explanations above.

| Field | Answers |
|---|---|
| Experiment Hypothesis | What do we expect to happen, and why? |
| Primary Outcome Metric | What single metric decides whether the experiment "worked"? |
| Unit Of Randomization | What gets randomly assigned — a student or a whole section? |
| Experiment Variant + Allocation Weight | What are the arms, and what share of units does each get? |
| Guardrail Metric | What must not get worse, even if it isn't the thing being tested? |
| Eligibility Predicate | Who is even allowed to be randomized into this experiment? |

!!! mascot-thinking "Why Randomize a Whole Section Sometimes?"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    If the Unit Of Randomization were always `student_key`, two students sitting side by side in the same class could be assigned to different variants — and if they compare notes, or the teacher accidentally references content from one variant while helping the whole class, the comparison gets contaminated. Randomizing by `section_id` instead keeps an entire class on one arm, trading a little statistical power (whole sections behave more similarly to each other than individual students do) for a cleaner separation between the two groups being compared.

#### Diagram: Anatomy of an Experiment Definition

<iframe src="../../sims/experiment-definition-anatomy/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Anatomy of an Experiment Definition</summary>
Type: infographic
**sim-id:** experiment-definition-anatomy<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, exemplify

Learning objective: Let the learner map the six named parts of an Experiment Definition (Experiment Hypothesis, Primary Outcome Metric, Unit Of Randomization, Experiment Variant, Allocation Weight, Guardrail Metric, Eligibility Predicate) onto one concrete worked example, reinforcing the plain-language definitions given in this section's prose.

Purpose: A central node labeled "Experiment Definition: Chapter 3 Worked Examples Test" with six labeled child nodes branching outward, each populated with a concrete filled-in example value: Experiment Hypothesis ("Worked examples raise mastery on Chapter 3 concepts"), Primary Outcome Metric ("Chapter 3 concept mastery"), Unit Of Randomization ("student_key"), Experiment Variant ×2 ("Control: v2.3" and "Treatment: v2.4 with worked examples", each showing its Allocation Weight of 50%), Guardrail Metric ("Engagement must not drop by more than 5%"), and Eligibility Predicate ("Districts that have not opted out of experimentation").

Interactive features: Clicking any of the six child nodes opens an infobox with that field's one-sentence definition, matching this section's prose, plus the worked example's specific value. A "Reset view" button collapses all open infoboxes.

Color coding: The central Experiment Definition node in the book's teal accent color; the two Experiment Variant nodes distinguished as control (gray-blue) versus treatment (amber) so the reader can see the comparison at a glance.

Responsive design: The diagram re-flows from a radial layout on wide viewports to a vertical stacked layout on narrow viewports, with all six child nodes remaining independently clickable at any width.
</details>

## Assigning Students to Variants

Once an Experiment Definition exists and is approved to start, the system has to decide, for every eligible unit, which variant it sees — and it has to keep giving that same unit the same answer for as long as the experiment runs. This is handled through **Deterministic Sticky Assignment**: rather than flipping a fresh coin every time a student loads a page, the system computes assignment as a pure function of two fixed inputs, the experiment and the unit being assigned.

\[
\text{variant} = h(\text{experiment\_id}, \text{unit\_id}) \bmod k
\]

Here \( h \) is a hash function — a calculation that turns its two inputs into a number that looks random but is always the same for the same inputs — and \( k \) is the number of allocation buckets, sized to match the variants' Allocation Weights. Because the same `experiment_id` and `unit_id` always hash to the same bucket, a student assigned to the treatment arm on day one is still there on day thirty, with no lookup table required; the result is recorded as an `ASSIGNED_TO` edge for later audit, but the assignment itself is reproducible from the formula alone.

- Deterministic: the same experiment and unit always produce the same variant.
- Sticky: a student never flips between arms mid-experiment, which is what makes a before/after comparison meaningful.
- Tenancy-respecting: an opted-out district's students are excluded, via the Eligibility Predicate, before the hash is ever computed.
- Non-blocking: assignment is computed at serve time; if the assignment service is unreachable, the control arm is served and the statement is still recorded, so an experiment can never become a single point of failure for the textbook it is testing.

Assignment quality itself needs a check, because a buggy eligibility filter or a subtle bug in how buckets map to variants can silently skew who ends up where. The **Sample-Ratio Mismatch (SRM)** check exists exactly for this: it compares the actual split of units across arms against the intended Allocation Weight and flags a mismatch too large to be chance. An experiment designed for an even 50/50 split that actually lands at 55/45 has failed its SRM check — and once that happens, every other statistic the experiment produces becomes suspect.

!!! mascot-tip "Check Sample-Ratio Mismatch First, Every Time"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Before you read an effect size or a confidence interval on any experiment readout, glance at the Sample-Ratio Mismatch check. A clean SRM check doesn't guarantee the rest of the results are meaningful, but a failed one means the rest of the readout isn't worth reading yet — fix the assignment bug first, then re-run.

#### Diagram: Deterministic Sticky Assignment and District Opt-Out

<iframe src="../../sims/sticky-assignment-and-opt-out/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Deterministic Sticky Assignment and District Opt-Out</summary>
Type: workflow
**sim-id:** sticky-assignment-and-opt-out<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, apply

Learning objective: Let the learner trace a single student's request through the eligibility check, the hash-based assignment formula, and the non-blocking fallback path, applying the deterministic sticky assignment rule to a concrete decision.

Purpose: A Mermaid flowchart beginning at "Student requests a page covered by an active experiment," branching first on "Is the student's district opted out of experimentation?" — Yes leads directly to "Serve control arm (excluded from randomization)"; No proceeds to "Is the assignment service reachable?" — No leads to "Serve control arm (non-blocking fallback); statement still recorded"; Yes leads to "Compute variant = hash(experiment_id, unit_id) mod k" which leads to "Look up ASSIGNED_TO edge, or create it on first assignment" and finally to "Serve the assigned variant; assignment is now sticky for this student."

Interactive features: Every node is wired with a Mermaid `click` directive. Clicking the opt-out decision node opens an infobox explaining that eligibility is enforced through the Eligibility Predicate and cannot be overridden by an author. Clicking the hash-formula node opens an infobox restating the formula from this section's prose in plain language. Clicking either "Serve control arm" outcome opens an infobox distinguishing the two reasons a student might land in control: policy exclusion versus a temporary service outage.

Color coding: The two decision (branch) nodes in the book's amber accent color; the two control-arm outcomes in muted gray-blue; the "sticky assignment" terminal node in teal to mark the normal, successful path.

Responsive design: The flowchart resizes to the containing element's width and stacks its branches vertically rather than horizontally on narrow viewports, preserving click targets at mobile widths.
</details>

## Reading the Statistical Readout

Once an experiment has run long enough to accumulate meaningful data, the question shifts from "who got which variant" to "did it matter, and how sure are we?" Answering that requires a small vocabulary of statistical terms — each one worth defining in plain language before it appears in the readout dashboard below.

**Effect Size** is a way of expressing how large a difference is between two variants, on a scale that stays meaningful regardless of the metric's original units. A raw score difference of "3 points" means very little on its own — three points out of what, and how much do scores normally vary? **Cohen's d** is the specific effect-size statistic this system reports: it divides the difference between two variants' average outcomes by the pooled standard deviation, a measure of how spread out the results normally are.

\[
d = \frac{\bar{x}_{\text{treatment}} - \bar{x}_{\text{control}}}{s_{\text{pooled}}}
\]

Here \( \bar{x}_{\text{treatment}} \) and \( \bar{x}_{\text{control}} \) are the average outcome in each arm, and \( s_{\text{pooled}} \) is the standard deviation shared by both. A Cohen's d of 0.2 is conventionally considered a small effect, 0.5 a medium effect, and 0.8 or higher a large one — so a d of 0.5 means the treatment arm's average outcome sits about half a standard deviation above the control arm's, a useful, unit-free way to compare effect sizes across completely different metrics and experiments.

- Cohen's d around 0.2: a small effect — noticeable in large samples, but a small practical shift.
- Cohen's d around 0.5: a medium effect — the kind of change most curriculum revisions hope to see.
- Cohen's d around 0.8 or higher: a large effect — substantial enough to be obvious without statistical tools.

An effect size on its own does not say how confident the readout is that the true effect isn't zero. That is the job of the **Confidence Interval (CI)**: a range of plausible values for the true effect, computed so that, under repeated sampling, an interval built this way would contain the true value a stated percentage of the time — typically 95%. Reporting "mastery improved by 7% ± 2%" is a plain-language way of expressing a 95% confidence interval of roughly 5% to 9%. A wide interval signals not enough data yet; a narrow interval signals a more confident estimate.

Alongside the confidence interval sits the **Two-Sided Significance Test**, which asks whether the observed difference is large enough to be surprising by chance alone if there were truly no effect in either direction — "two-sided" because the treatment could turn out better *or* worse than control. The test produces a p-value, conventionally compared against a threshold such as \( \alpha = 0.05 \); a smaller p-value means the observed gap would be rarer under the assumption of no true effect.

One subtlety trips up even careful readers: checking a p-value once a day while an experiment is still collecting data — "peeking" — inflates the chance of a false positive, because each extra look is another chance for random noise to briefly cross the threshold. The **Sequential Testing Correction** makes repeated peeking statistically safe by spending the allowed false-positive rate gradually across multiple looks instead of all at once, so an author can check a running experiment daily without secretly increasing the odds of a false "win."

!!! mascot-warning "Don't Stop an Experiment the Moment It Looks Significant"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    The most common mistake with a live experiment is stopping it the instant the p-value first dips below the threshold — that first dip is exactly when uncorrected peeking is most likely to produce a false positive. Trust the readout's corrected verdict, not a raw p-value glanced at mid-experiment.

Two more pieces round out a trustworthy readout. **Segmentation Analysis** breaks the primary result down by subgroup — grade band, prior-mastery band, or district — with the same privacy aggregation threshold from Chapter 15 still applying, so no segment smaller than the threshold is ever shown broken out on its own. And a **Guardrail Regression Flag** fires automatically whenever a guardrail metric moves the wrong way beyond its configured tolerance, regardless of what the primary outcome metric shows — a treatment arm can win decisively on its primary metric and still get flagged if it quietly damages engagement.

!!! mascot-encourage "This Is a Lot of New Vocabulary at Once"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Effect size, confidence interval, significance test, sequential correction, segmentation, guardrail flag — that is a lot of new terms at once, even at a college reading level. You do not need to compute any of these by hand. Recognize what each is *for*: effect size answers "how big," the confidence interval answers "how sure," the significance test answers "how surprising," and the guardrail flag answers "did we break anything else."

All of these pieces converge on one screen: the **Experiment Readout Dashboard**, a per-experiment Dash view built from the same reactive-layout skeleton every other dashboard in this book follows. Rather than describing its layout in prose alone, the table below organizes what appears on it, now that every term inside it has already been defined.

| Panel | Shows |
|---|---|
| Allocation | The Experiment Variants and their Allocation Weights, plus the current Sample-Ratio Mismatch check |
| Enrollment over time | A running count of units assigned per arm since the experiment started |
| Primary metric with CI band | The Primary Outcome Metric's per-arm mean, effect size (Cohen's d), and confidence interval |
| Guardrails | Every Guardrail Metric's current status, with any Guardrail Regression Flag surfaced prominently |
| Segment table | Segmentation Analysis broken down by grade band, prior-mastery band, or district, above the privacy threshold |
| Verdict | A plain-language summary, such as "Variant B improved mastery by 7% ± 2%, p < 0.01" |

#### Diagram: Reading the Experiment Readout Dashboard

<iframe src="../../sims/experiment-readout-dashboard-mockup/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Reading the Experiment Readout Dashboard</summary>
Type: chart
**sim-id:** experiment-readout-dashboard-mockup<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Let the learner practice judging, from a single mocked-up readout, whether an experiment's result is trustworthy enough to act on — weighing effect size, confidence interval width, sample-ratio mismatch status, and guardrail flags together rather than looking at any one number in isolation.

Canvas layout: A single dashboard mockup with four stacked panels matching the table in this section: (1) a small allocation bar showing 50/50 planned versus 52/48 actual with an SRM status badge; (2) a bar chart of mean primary-metric outcome for control versus treatment, each bar with a vertical confidence-interval whisker; (3) a row of guardrail metric badges (green "OK" or red "Regression Flag"); (4) a text verdict line that updates based on the controls below.

Interactive controls: A `createSlider()` control lets the learner drag the treatment arm's mean outcome up or down, which live-redraws the confidence-interval whiskers and recomputes a simplified Cohen's d shown beside the chart. A `createCheckbox()` toggles "Trigger sample-ratio mismatch" (shifts the allocation bar and flips the SRM badge to a failure state). A second `createCheckbox()` toggles "Trigger guardrail regression" (flips one guardrail badge to red). The verdict text at the bottom changes dynamically: a clean, significant, guardrail-safe result reads "Ready to ship"; an SRM failure reads "Investigate assignment before trusting this result"; a guardrail regression reads "Primary metric improved, but a guardrail regressed — do not ship without review."

Default parameters: Treatment mean set 0.3 standard deviations above control (Cohen's d ≈ 0.3), both mismatch and guardrail toggles off at start, so the default view shows a clean, shippable result.

Color coding: Control arm in gray-blue, treatment arm in the book's teal accent color, guardrail badges in green/red, verdict text background shifting from green to amber to red depending on which toggles are active.

Responsive design: Panels stack vertically at any width; on narrow viewports the sliders and checkboxes move below the chart rather than beside it, and the canvas width tracks its containing element.
</details>

## Registries, Variants, and the Life of an Experiment

An Experiment Variant is only as good as the exact content it points to, which is why every variant is bound to a specific, named version rather than "whatever is currently live." The **Textbook Registry** is the authoritative list of every `Textbook` definition and its `TextbookVersion`s, each carrying a reconciliation status of provisional or reconciled. The **MicroSim Registry** does the same job one level down, listing every MicroSim and its versions per textbook, with a build status of scaffold, built, or approved. Defining a variant means picking a specific row out of one of these registries — "v2.3" or "v2.4," "the static diagram" or "`microsim-ohms-law`" — so the comparison is anchored to exact content, not a moving target.

An experiment itself moves through a small, well-defined set of states the specification calls the **AB Test Lifecycle**: **draft** (editable, unapproved), **running** (assignment and data collection active), **paused** (triggered by a guardrail regression, a sample-ratio mismatch, or author judgment, without losing collected data), **concluded** (stopping serves the control arm to everyone going forward, whichever arm "won"), and **archived** for long-term record-keeping. Every start and stop is logged, and higher-stakes experiments require a second approver before a stop takes effect — the same governance guardrail Chapter 26 introduced for district configuration, now applied to experimentation.

#### Diagram: The AB Test Lifecycle

<iframe src="../../sims/ab-test-lifecycle-states/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The AB Test Lifecycle</summary>
Type: workflow
**sim-id:** ab-test-lifecycle-states<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Let the learner sequence the states an experiment moves through — draft, running, paused, concluded, archived — and identify which transitions are reversible versus terminal.

Purpose: A Mermaid state diagram with five nodes: "Draft" → "Running" (on approval), "Running" → "Paused" (on guardrail regression, SRM failure, or author judgment), "Paused" → "Running" (on resume once the issue is resolved), "Running" → "Concluded" (on stop; control arm served to everyone from this point forward), "Concluded" → "Archived" (terminal).

Interactive features: Every state node is wired with a Mermaid `click` directive. Clicking "Draft" opens an infobox noting the Experiment Definition is still editable and unapproved. Clicking "Running" opens an infobox noting assignment and data collection are both active. Clicking "Paused" opens an infobox listing the three common triggers (guardrail regression, SRM failure, author judgment) and noting no data is lost. Clicking "Concluded" opens an infobox emphasizing that stopping serves the control arm to everyone going forward, regardless of which arm the readout favored. Clicking "Archived" opens an infobox noting this is a terminal, read-only state kept for audit history.

Color coding: Draft in neutral gray, Running in teal, Paused in amber, Concluded in a deeper teal, Archived in muted gray-blue — a progression from "not yet active" through "active" to "done," with Paused visually distinct as an interruption rather than an ending.

Responsive design: The state diagram resizes to the containing element's width; on narrow viewports the states stack top-to-bottom in sequence rather than arranging left-to-right.
</details>

## One Loop, Three Personas

Step back from any single experiment, and a larger pattern comes into view — one that ties this chapter back to every persona this book has introduced. The specification calls this pattern the **Content Effectiveness Loop**: the Content Insights Dashboard and its Correlation Explorer surface a correlational lead, the Experiment Designer turns that lead into a randomized test, the Experiment Readout Dashboard delivers a verdict, and an author who ships a winning variant feeds a better-performing version straight back into Content Insights — where the cycle surfaces its next lead. This is an ongoing feedback mechanism, not a one-time process; it keeps a textbook improving after it ships, not just at launch.

That loop only works because it crosses persona boundaries without breaking any of them — a pattern the specification calls a **Cross-Persona Workflow**. A district administrator's opt-out policy is enforced automatically at assignment time without any author action. A teacher's classroom keeps functioning normally throughout an experiment — dashboards, rosters, and reports work identically no matter which arm a student was assigned to, since sticky assignment is invisible at the point of daily teaching. And the textbook author is the one persona who designs the experiment and reads its verdict.

- A **Textbook Author** designs the Experiment Definition, chooses variants from the Textbook and MicroSim Registries, and reads the readout dashboard's verdict.
- A **District Administrator**'s district-level opt-out flag is enforced automatically at assignment time and cannot be overridden by an author.
- A **Teacher**'s day-to-day dashboards and reports continue to function normally for every student, regardless of which experiment arm that student was assigned to.

Underneath all three personas sits one fact this book has repeated since its earliest chapters: every persona-facing report — the administrator's adoption dashboard, the teacher's class mastery heatmap, the author's experiment readout — reads from the same **Shared Statement Log**, the compressed summary-vertex layer built from the raw xAPI Event Store first introduced in Chapter 1. Running an experiment requires no separate data pipeline; an Experiment Variant assignment is just one more piece of context attached to statements already flowing through that same log. Any dashboard or report scoped to a persona's role and permissions is, in the specification's own general term, a **Persona-Facing Report**: the same underlying evidence, reshaped to answer the question that persona is allowed to ask.

## Key Takeaways

- An **Experiment Definition** gathers a hypothesis, primary metric, unit of randomization, variants, guardrails, and eligibility rules into one reviewable object.
- The **Experiment Hypothesis** is a free-text, falsifiable statement of what the author expects a change to do.
- The **Primary Outcome Metric** is the single metric an experiment is judged on, fixed before the experiment starts.
- The **Unit Of Randomization** is what gets assigned to a variant — usually a student, sometimes a whole section to avoid contamination.
- An **Experiment Variant** is one arm of the test, bound to a specific TextbookVersion or MicroSimVersion.
- The **Allocation Weight** is the share of randomized units each variant is meant to receive.
- A **Guardrail Metric** must not regress meaningfully while an experiment runs, even if it isn't the metric being tested.
- The **Eligibility Predicate** decides who can be randomized at all, and is where district opt-out is enforced.
- **Deterministic Sticky Assignment** computes a student's variant from a reproducible hash formula, so it never changes mid-experiment.
- A **Sample-Ratio Mismatch** flags an assignment skew serious enough to make the rest of an experiment's results suspect.
- **Effect Size**, and specifically **Cohen's d**, expresses how large a difference is between two variants in standard-deviation units.
- A **Confidence Interval** gives a range of plausible values for the true effect, not just a single point estimate.
- A **Two-Sided Significance Test** checks whether an observed gap is surprising under the assumption of no true effect in either direction.
- A **Sequential Testing Correction** makes it statistically safe to check a running experiment's results more than once.
- **Segmentation Analysis** breaks a result down by subgroup, still bounded by the privacy aggregation threshold.
- A **Guardrail Regression Flag** fires automatically when a guardrail metric moves the wrong way beyond tolerance.
- The **Experiment Readout Dashboard** brings allocation, enrollment, the primary metric, guardrails, segments, and a plain-language verdict together on one screen.
- The **Textbook Registry** and **MicroSim Registry** are the authoritative sources of the exact versions an Experiment Variant can be bound to.
- The **AB Test Lifecycle** moves an experiment through draft, running, paused, concluded, and archived states.
- The **Content Effectiveness Loop** connects observational leads to randomized tests to shipped improvements, on an ongoing cycle.
- A **Cross-Persona Workflow** lets one experiment respect a district administrator's opt-out, a teacher's undisturbed classroom view, and an author's design and readout, all at once.
- The **Shared Statement Log** is the single compressed evidence base every persona-facing report and every experiment reads from.
- A **Persona-Facing Report** is any report or dashboard reshaped from that shared evidence to answer the specific question one persona's role is allowed to ask.

!!! mascot-celebration "You Can Now Read a Real Experiment"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    What does the evidence show? You now know how to define an experiment, trust its assignment mechanism, and read its verdict without being fooled by a stopped-too-early p-value or a hidden guardrail regression. That closes the loop this book has been building since Chapter 24 — three personas, one shared log, and now one way to test a change instead of just guessing at it. Next, in [Chapter 32: The Producer Contract - Writing Conformant Statements](../32-producer-contract-conformant-statements/index.md), we turn to the other end of that shared log: what it takes to write a Statement worth trusting in the first place.
