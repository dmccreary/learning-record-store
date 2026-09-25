---
title: "Quiz: Bayesian Knowledge Tracing for Mastery"
description: Review questions on the BKT mastery model — the prior, slip, guess, and transit parameters, the Evidence Conditioning Step, the Learning Transition Step, and Soft Correctness Mapping.
social:
   cards: false
---
# Quiz: Bayesian Knowledge Tracing for Mastery

Test your understanding of this project's Bayesian Knowledge Tracing mastery model with these review questions.

---

#### 1. Why did ADR-006 select Bayesian Knowledge Tracing over a weighted moving average, Elo, and Item Response Theory for computing mastery?

<div class="upper-alpha" markdown>
1. BKT's update touches only one float per (student, concept), it is well-studied in intelligent tutoring systems, and its output is an honest probability rather than an unscaled score
2. BKT is the only one of the four that can process graded quiz results at all
3. BKT requires no parameters to be fit, unlike the other three candidates
4. BKT was chosen because it runs entirely inside the Ingestion Gateway rather than the Stream Processor
</div>

??? question "Show Answer"
    The correct answer is **A**. BKT wins on cheap per-update state, decades of study in intelligent tutoring systems, and an honestly probabilistic output, unlike the other three candidates' unscaled or heavier-weight alternatives. B is false — all four candidates can process graded results. C is wrong; BKT fits prior, slip, guess, and transit parameters, more than some alternatives. D misplaces the update, which runs in the Stream Processor, not the gateway.

    **Concept Tested:** Bayesian Knowledge Tracing

---

#### 2. For a brand-new (student, concept) pair with no evidence at all, where does the model get its starting Prior Mastery Probability?

<div class="upper-alpha" markdown>
1. It defaults to exactly 0.5 for every new concept regardless of subject
2. It waits until at least ten statements have arrived before assigning any prior at all
3. It copies the Prior Mastery Probability of a different student's most recent concept
4. It borrows the fitted slip, guess, transit, and starting-prior values from the concept's taxonomy category until enough of the concept's own evidence accumulates
</div>

??? question "Show Answer"
    The correct answer is **D**. A brand-new concept inherits its taxonomy category's cold-start priors until enough of its own evidence accumulates to fit its own values, so a newly published simulation still gets a reasonable starting estimate on day one. A invents an arbitrary fixed default the specification does not use. B fabricates a waiting threshold. C confuses per-student and per-concept scoping, which BKT keeps separate.

    **Concept Tested:** Prior Mastery Probability

    **See:** [Prior Mastery Probability: Where Every Update Starts](index.md#prior-mastery-probability-where-every-update-starts)

---

#### 3. What problem does the Slip Parameter solve?

<div class="upper-alpha" markdown>
1. It prevents one lucky guess from an unmastered student from inflating the mastery estimate
2. It computes how likely a student is to move from not-mastered to mastered between opportunities
3. It keeps a single careless mistake from an otherwise mastered student from crashing the mastery estimate to near zero
4. It converts non-binary evidence like dwell time into a value BKT's equations can use
</div>

??? question "Show Answer"
    The correct answer is **C**. The Slip Parameter accounts for a mastered student still answering incorrectly by chance, so a single careless error does not crash the mastery estimate to near zero. A describes the Guess Parameter's mirror-image job. B describes the Transit Parameter. D describes Soft Correctness Mapping, an unrelated step.

    **Concept Tested:** Slip Parameter

    **See:** [The Four Parameters Behind Every Update](index.md#the-four-parameters-behind-every-update)

---

#### 4. What problem does the Guess Parameter solve?

<div class="upper-alpha" markdown>
1. It prevents a single lucky correct answer from a student who has not mastered the concept from looking like proof of mastery
2. It keeps a single careless mistake from an otherwise mastered student from crashing the mastery estimate
3. It determines the cold-start prior for a brand-new concept
4. It accounts for learning that happens between one observation and the next
</div>

??? question "Show Answer"
    The correct answer is **A**. The Guess Parameter accounts for an unmastered student answering correctly by chance, so one lucky guess does not look like proof of mastery. B describes the Slip Parameter's opposite role. C describes the cold-start mechanism tied to Prior Mastery Probability. D describes the Transit Parameter.

    **Concept Tested:** Guess Parameter

    **See:** [The Four Parameters Behind Every Update](index.md#the-four-parameters-behind-every-update)

---

#### 5. What makes the Transit Parameter different in kind from the other three BKT parameters?

<div class="upper-alpha" markdown>
1. It is the only parameter fit at the textbook level rather than per concept
2. It is the only parameter that can take a negative value
3. It is applied before the Evidence Conditioning Step rather than after it
4. It is not about how evidence is read, but about how the student actually changes — moving from not-mastered to mastered — between one observation and the next
</div>

??? question "Show Answer"
    The correct answer is **D**. Unlike prior, slip, and guess, which all concern how a given piece of evidence should be interpreted, the transit parameter is the only place actual learning between opportunities enters the mathematics. A is false — all four parameters are fit per concept. B is an invented mathematical property never claimed for it. C reverses the fixed order — transition runs after conditioning, not before.

    **Concept Tested:** Transit Parameter

    **See:** [The Four Parameters Behind Every Update](index.md#the-four-parameters-behind-every-update)

---

#### 6. Using P(Ln) = 0.30, p_slip = 0.10, and p_guess = 0.20, a student answers correctly. What is P(Ln | correct), using the Evidence Conditioning Step's formula for a correct observation?

<div class="upper-alpha" markdown>
1. Approximately 0.30, unchanged from the prior
2. Approximately 0.66
3. Approximately 0.93
4. Approximately 0.10
</div>

??? question "Show Answer"
    The correct answer is **B**. Substituting into the conditioning formula gives (0.30 × 0.90) / (0.30 × 0.90 + 0.70 × 0.20) = 0.27 / 0.41 ≈ 0.66, exactly matching this chapter's worked example. A wrongly assumes the observation has no effect. C is the value reached only after several more correct observations. D inverts the direction a correct answer should move the estimate.

    **Concept Tested:** Evidence Conditioning Step

    **See:** [The Evidence Conditioning Step: Applying Bayes' Rule](index.md#the-evidence-conditioning-step-applying-bayes-rule)

---

#### 7. Continuing from a posterior of P(Ln | evidence) ≈ 0.66 with a transit parameter of p_transit = 0.15, what does the Learning Transition Step produce as P(Ln+1)?

<div class="upper-alpha" markdown>
1. Approximately 0.66, unchanged, since the transition step only applies after an incorrect answer
2. Approximately 0.15, since the transition step resets toward the transit parameter's own value
3. Approximately 0.71, since the transition step adds a share of the remaining not-yet-mastered probability to the posterior
4. Approximately 1.00, since any positive transit parameter rounds mastery up to certainty
</div>

??? question "Show Answer"
    The correct answer is **C**. The transition formula gives 0.66 + (1 − 0.66) × 0.15 ≈ 0.71, matching the chapter's worked example exactly. A is wrong — the transition step runs after every observation, correct or incorrect. B misreads the formula as resetting toward the parameter itself rather than nudging the posterior. D wildly overstates the effect of a small transit value.

    **Concept Tested:** Learning Transition Step

    **See:** [The Learning Transition Step: Accounting for Growth](index.md#the-learning-transition-step-accounting-for-growth)

---

#### 8. A student spends three minutes scrolling through a page with no graded question on it. According to Soft Correctness Mapping, how should this evidence be incorporated into the student's BKT update?

<div class="upper-alpha" markdown>
1. It should be mapped to a value in [0,1] and blended into the update with a lower evidence weight than a graded response, since reading a page is weaker evidence of mastery
2. It should be ignored entirely, since BKT only accepts graded quiz responses
3. It should be treated exactly like a correct quiz answer, since time spent implies understanding
4. It should immediately reset P(Ln) to the taxonomy category's cold-start prior
</div>

??? question "Show Answer"
    The correct answer is **A**. Soft Correctness Mapping converts non-binary evidence like dwell time into a [0,1] value and blends it in with a lower evidence weight than a graded response, since the specification treats reading a page as weak evidence of mastery. B contradicts the whole purpose of this mapping. C overstates dwell time's evidentiary strength. D invents an unrelated reset behavior.

    **Concept Tested:** Soft Correctness Mapping

    **See:** [Soft Correctness Mapping: Evidence Beyond Right and Wrong](index.md#soft-correctness-mapping-evidence-beyond-right-and-wrong)

---

#### 9. Why does this project's Kafka partition key, `district_id:student_key`, matter specifically for BKT's correctness, beyond the hotspot-avoidance reason covered in an earlier chapter?

<div class="upper-alpha" markdown>
1. Because BKT requires all of a district's students to be processed in the same partition simultaneously
2. Because sequential Bayesian updates do not commute, so the same evidence processed out of order would produce a different final P(Ln); the partition key guarantees one learner's statements are consumed in the order they arrived
3. Because the partition key determines which taxonomy category a concept's cold-start prior borrows from
4. Because Redis caches P(Ln) only for statements arriving on an even-numbered partition
</div>

??? question "Show Answer"
    The correct answer is **B**. Sequential Bayesian updates do not commute, so processing evidence out of order would produce a different final mastery estimate; the partition key's per-student ordering guarantee is what keeps BKT's updates correct. A misreads the key as forcing simultaneous processing rather than per-student ordering. C and D each invent a fabricated connection between the partition key and unrelated mechanisms.

    **Concept Tested:** Bayesian Knowledge Tracing (processing order)

    **See:** [Where the Update Actually Runs](index.md#where-the-update-actually-runs)

---

#### 10. A teacher sees a student's mastery estimate drop from 0.71 to 0.35 after one incorrect answer, then recover to 0.75 after a subsequent correct one. Why does BKT's design produce this kind of bounded, recoverable swing rather than either a catastrophic collapse to zero or no movement at all?

<div class="upper-alpha" markdown>
1. Because the slip parameter keeps evidence from ever changing P(Ln), while the guess parameter forces recovery afterward
2. Because P(Ln) is reset to the cold-start prior after every incorrect answer, then recomputed from scratch
3. Because the conditioning step takes each new observation seriously enough to move the estimate substantially, while the slip parameter keeps a wrong answer from implying certainty of non-mastery, and the transit parameter keeps nudging the estimate upward afterward
4. Because Soft Correctness Mapping overrides the conditioning step whenever a graded response is involved
</div>

??? question "Show Answer"
    The correct answer is **C**. The conditioning step responds meaningfully to each observation, the slip parameter keeps one wrong answer from implying certain non-mastery, and the transit parameter keeps nudging the estimate upward between observations — together producing evidence that matters but never catastrophically, with steady room for recovery. A misattributes both parameters' actual roles. B invents a reset mechanism BKT does not use. D misapplies Soft Correctness Mapping, which concerns non-binary evidence, not graded responses.

    **Concept Tested:** Evidence Conditioning Step / Learning Transition Step (synthesis)

    **See:** [The Learning Transition Step: Accounting for Growth](index.md#the-learning-transition-step-accounting-for-growth)

---
