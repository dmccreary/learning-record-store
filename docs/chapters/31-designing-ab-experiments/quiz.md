---
title: "Quiz: Designing and Reading A/B Experiments"
description: Review questions on the Experiment Definition, deterministic sticky assignment, the statistical readout (effect size, confidence intervals, sample-ratio mismatch), the AB Test Lifecycle, and the Content Effectiveness Loop.
social:
   cards: false
---
# Quiz: Designing and Reading A/B Experiments

Test your understanding of this project's experimentation subsystem with these review questions.

---

#### 1. What is an Experiment Definition?

<div class="upper-alpha" markdown>
1. A single node gathering a hypothesis, primary metric, unit of randomization, variants, guardrails, and eligibility rules into one reviewable, auditable object
2. A single number representing an experiment's final effect size
3. A per-student record of which variant that student was assigned to
4. The dashboard where an experiment's readout is displayed
</div>

??? question "Show Answer"
    The correct answer is **A**. An Experiment Definition binds together all six parts of a test — hypothesis, metric, randomization unit, variants, guardrails, and eligibility — into one object that can be reviewed, approved, and audited as a whole. B confuses it with Cohen's d, a single output statistic. C describes an individual assignment record, not the definition itself. D describes the Experiment Readout Dashboard, a separate screen.

    **Concept Tested:** Experiment Definition

    **See:** [Anatomy of an Experiment Definition](index.md#anatomy-of-an-experiment-definition)

---

#### 2. When must an experiment's Primary Outcome Metric be decided?

<div class="upper-alpha" markdown>
1. At any point during the experiment, once initial results start looking promising
2. Only after the experiment has concluded and the readout dashboard is reviewed
3. By the Guardrail Regression Flag, automatically, based on which metric moved most
4. Before the experiment starts, never chosen after the fact from whichever metric happened to move the most
</div>

??? question "Show Answer"
    The correct answer is **D**. The Primary Outcome Metric is fixed before the experiment starts, precisely to prevent choosing whichever metric happened to move the most after the fact. A and B both allow the metric to be selected after data starts arriving, exactly what this design avoids. C misattributes metric selection to an unrelated automated flag.

    **Concept Tested:** Primary Outcome Metric

    **See:** [Anatomy of an Experiment Definition](index.md#anatomy-of-an-experiment-definition)

---

#### 3. Why might an experiment randomize by section_id rather than student_key?

<div class="upper-alpha" markdown>
1. Because section_id randomization is always statistically more powerful than student_key randomization
2. Because student_key randomization is technically impossible in this system
3. Because randomizing individual students within the same class risks contamination — students comparing notes or a teacher referencing content from one variant while helping the whole class — even though it trades away some statistical power
4. Because section_id is the only unit of randomization the Eligibility Predicate supports
</div>

??? question "Show Answer"
    The correct answer is **C**. Randomizing at the section level avoids contamination between students in the same class, at the cost of some statistical power, since whole sections behave more similarly to each other than individual students do. A reverses the actual power tradeoff. B is false — student_key is the usual default unit. D invents a restriction the Eligibility Predicate does not impose.

    **Concept Tested:** Unit Of Randomization

    **See:** [Anatomy of an Experiment Definition](index.md#anatomy-of-an-experiment-definition)

---

#### 4. What makes Deterministic Sticky Assignment "sticky"?

<div class="upper-alpha" markdown>
1. Assignment is stored in a lookup table that an administrator manually updates each week
2. A student never flips between arms mid-experiment, because the assignment is a reproducible function of the experiment and unit IDs, computed the same way every time
3. Every student is reassigned to a new random arm on each page load
4. Assignment only applies to the first statement a student ever sends, then stops mattering
</div>

??? question "Show Answer"
    The correct answer is **B**. Because assignment is a pure, reproducible function of fixed inputs, the same student always lands in the same arm for the life of the experiment, with no lookup table required. A invents a manual process the formula-based approach specifically avoids. C directly contradicts the stickiness property. D understates the assignment's persistence across the whole experiment.

    **Concept Tested:** Deterministic Sticky Assignment

    **See:** [Assigning Students to Variants](index.md#assigning-students-to-variants)

---

#### 5. An experiment is designed for an even 50/50 split between control and treatment, but the actual observed split turns out to be 55/45, more than chance would explain. What has this experiment failed, and what should happen next?

<div class="upper-alpha" markdown>
1. It has failed its Guardrail Regression Flag, and the experiment should be archived immediately
2. It has passed its Two-Sided Significance Test, so the results can be trusted as-is
3. It has triggered a Sequential Testing Correction, which automatically fixes the split going forward
4. It has failed its Sample-Ratio Mismatch check, and every other statistic the experiment produces becomes suspect until the assignment bug is found and fixed
</div>

??? question "Show Answer"
    The correct answer is **D**. A split skewed beyond what chance would explain is exactly a Sample-Ratio Mismatch failure, and once that happens, every other statistic the experiment produces becomes suspect until the underlying assignment bug is fixed. A misapplies an unrelated guardrail mechanism. B is unrelated to assignment balance. C misapplies the sequential-testing mechanism, which addresses repeated peeking, not assignment skew.

    **Concept Tested:** Sample-Ratio Mismatch

    **See:** [Assigning Students to Variants](index.md#assigning-students-to-variants)

---

#### 6. An experiment reports a Cohen's d of 0.75 for its primary outcome metric. How should this be interpreted?

<div class="upper-alpha" markdown>
1. As a small effect, since anything below 1.0 is considered negligible
2. As proof that the treatment variant caused exactly 75% more learning than the control variant
3. As a large effect — substantial enough to be obvious without statistical tools — since 0.8 or higher is conventionally considered large and 0.75 sits close to that range
4. As a guardrail regression, since Cohen's d only ever measures negative outcomes
</div>

??? question "Show Answer"
    The correct answer is **C**. A Cohen's d of 0.75 sits just below the conventional large-effect threshold of 0.8, well past the medium-effect range of 0.5 — a substantial, practically noticeable difference. A misstates the conventional thresholds. B misinterprets d as a percentage rather than a standard-deviation-scaled measure. D confuses this effect-size statistic with an entirely separate guardrail mechanism.

    **Concept Tested:** Effect Size / Cohens D

    **See:** [Reading the Statistical Readout](index.md#reading-the-statistical-readout)

---

#### 7. An experiment is temporarily halted after a guardrail metric regresses, but none of its collected data is lost, and it can later resume from where it left off. Which state in the AB Test Lifecycle is this experiment in?

<div class="upper-alpha" markdown>
1. Paused
2. Draft
3. Running
4. Archived
</div>

??? question "Show Answer"
    The correct answer is **A**. Paused is exactly the state triggered by a guardrail regression, sample-ratio mismatch, or author judgment, and it preserves all collected data for a later resume. B describes an experiment not yet approved to start. C describes active assignment and data collection, not a halted state. D describes a terminal, read-only state, not a resumable one.

    **Concept Tested:** AB Test Lifecycle

    **See:** [Registries, Variants, and the Life of an Experiment](index.md#registries-variants-and-the-life-of-an-experiment)

---

#### 8. Why does checking a running experiment's p-value once a day without a Sequential Testing Correction inflate the risk of a false positive?

<div class="upper-alpha" markdown>
1. Because daily checks always cause the assignment service to become unreachable
2. Because the Sample-Ratio Mismatch check only runs once per day, conflicting with more frequent p-value checks
3. Because peeking at a p-value changes which students are randomized into the treatment arm
4. Because each additional look at the data is another independent chance for random noise to briefly cross the significance threshold, so uncorrected repeated peeking spends the allowed false-positive rate faster than a single planned check would
</div>

??? question "Show Answer"
    The correct answer is **D**. Every extra look at the data is another opportunity for random noise alone to briefly cross the significance threshold, so repeated uncorrected checks inflate the overall chance of a false positive well beyond the nominal rate. A and B each invent an unrelated technical side effect of checking data. C is false — observing a p-value has no effect on randomization itself.

    **Concept Tested:** Sequential Testing Correction

    **See:** [Reading the Statistical Readout](index.md#reading-the-statistical-readout)

---

#### 9. Why can a treatment variant "win decisively on its primary outcome metric and still get flagged" by the Guardrail Regression Flag?

<div class="upper-alpha" markdown>
1. Because the Guardrail Regression Flag always overrides and invalidates a winning primary metric result
2. Because the Guardrail Regression Flag fires automatically whenever any guardrail metric moves the wrong way beyond its configured tolerance, entirely independent of what the primary outcome metric shows — a real improvement on one measure does not guarantee no damage on another
3. Because guardrail metrics and primary outcome metrics are actually computed from the exact same statistic
4. Because a Guardrail Regression Flag can only fire during the draft state, before any real data exists
</div>

??? question "Show Answer"
    The correct answer is **B**. The guardrail check runs independently of the primary metric, so a treatment can genuinely improve the thing being tested while quietly damaging something else entirely, such as engagement — both facts can be true at once. A overstates the flag's effect, which surfaces a concern rather than automatically invalidating the primary result. C wrongly conflates two independently tracked metrics. D is false — guardrail flags fire during the running state, when real data exists.

    **Concept Tested:** Guardrail Regression Flag

    **See:** [Reading the Statistical Readout](index.md#reading-the-statistical-readout)

---

#### 10. Why does a district's experimentation opt-out flag need to be enforced automatically at assignment time rather than relying on an author to manually exclude that district from a new experiment each time?

<div class="upper-alpha" markdown>
1. Because district opt-out only applies to guardrail metrics, not to primary outcome metrics
2. Because an author is technically incapable of viewing which districts have opted out
3. Because manual exclusion would require an author to remember and correctly apply the opt-out for every single experiment they ever design, while automatic enforcement through the Eligibility Predicate makes the exclusion structurally guaranteed regardless of any individual author's diligence
4. Because automatic enforcement only became necessary after the Content Effectiveness Loop was introduced
</div>

??? question "Show Answer"
    The correct answer is **C**. Automatic enforcement through the Eligibility Predicate makes the exclusion structural rather than dependent on every author remembering to apply it correctly every time — the same "push the rule into the system" pattern this book has used for other guarantees. A invents an unrelated restriction to guardrail metrics only. B contradicts the chapter's framing of opt-out as a policy fact, not a hidden one. D invents an unrelated historical dependency.

    **Concept Tested:** Eligibility Predicate (Cross-Persona Workflow)

    **See:** [One Loop, Three Personas](index.md#one-loop-three-personas)

---

#### 11. An author sees a running experiment's p-value briefly dip below 0.05 on day three of a planned thirty-day run and decides to stop the experiment immediately and ship the treatment variant. Evaluate this decision against what this chapter establishes about reading a live experiment.

<div class="upper-alpha" markdown>
1. The decision is sound, since any p-value below 0.05 is definitive proof of a real effect regardless of when it is observed
2. The decision is risky: this chapter explicitly warns against stopping the moment a raw p-value first dips below threshold, since that is exactly when uncorrected peeking is most likely to produce a false positive — the corrected, Sequential Testing Correction-adjusted verdict should be trusted instead of a single early glance
3. The decision is sound as long as the Sample-Ratio Mismatch check also passed on day three
4. The decision is irrelevant, since stopping an experiment early has no effect on its guardrail metrics
</div>

??? question "Show Answer"
    The correct answer is **B**. The chapter's own warning is explicit: stopping the instant a raw p-value first dips below threshold is exactly when uncorrected peeking is most likely to produce a false positive, so the corrected verdict, not a single early glance, should be trusted. A treats an uncorrected single observation as definitive, which this chapter directly cautions against. C adds an unrelated condition that does not address the peeking risk. D ignores that stopping early forecloses further guardrail monitoring entirely.

    **Concept Tested:** Sequential Testing Correction (evaluated)

    **See:** [Reading the Statistical Readout](index.md#reading-the-statistical-readout)

---

#### 12. A textbook author wants to test whether replacing a static diagram with an interactive MicroSim on the photosynthesis chapter improves concept mastery, without risking damage to overall student engagement, and wants to make sure a school district that has opted out of experimentation is never affected. Design the six-part Experiment Definition that would set this test up correctly.

<div class="upper-alpha" markdown>
1. Hypothesis: "the MicroSim will improve mastery"; Primary Outcome Metric: chosen after the experiment ends, based on whichever metric moved the most; Unit of Randomization: unspecified; Variant: only a treatment arm, no control; Guardrail Metric: omitted; Eligibility Predicate: all districts included regardless of opt-out status
2. Hypothesis: "replacing the static diagram with the interactive MicroSim will raise concept mastery on the photosynthesis concepts"; Primary Outcome Metric: photosynthesis concept mastery, fixed before the test starts; Unit of Randomization: student_key (or section_id if contamination is a concern); Variants: control (static diagram) and treatment (MicroSim) with defined Allocation Weights; Guardrail Metric: overall engagement, must not regress meaningfully; Eligibility Predicate: excludes the opted-out district automatically
3. Hypothesis and Primary Outcome Metric only; the other four fields are optional extras not required to run a valid experiment
4. Skip the Experiment Definition entirely and rely solely on the Correlation Explorer, since it requires no formal setup
</div>

??? question "Show Answer"
    The correct answer is **B**. This configuration correctly fills all six required fields to match the scenario: a falsifiable hypothesis, a metric fixed in advance, an appropriate randomization unit, both a control and treatment arm, an engagement guardrail matching the stated concern, and an eligibility rule that automatically respects the district's opt-out. A violates several of this chapter's core requirements at once, including choosing the metric after the fact and including an opted-out district. C wrongly treats four required fields as optional. D substitutes a correlational tool for the randomized test the scenario specifically calls for.

    **Concept Tested:** Experiment Definition (design synthesis)

---
