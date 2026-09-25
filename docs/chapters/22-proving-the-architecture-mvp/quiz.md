---
title: "Quiz: Proving the Architecture - the MVP Plan"
description: Review questions on the MVP Architecture Proof, the falsifiable Burst Insensitivity Claim, bugs found in the design's own proof harness, the Lift Vs Rewrite Decision, and the five MVP build steps.
social:
   cards: false
---
# Quiz: Proving the Architecture - the MVP Plan

Test your understanding of this project's MVP plan for proving its central architectural bet with these review questions.

---

#### 1. Why does the MVP Architecture Proof skip the twenty-one-week path to a real user rather than building toward dashboards first?

<div class="upper-alpha" markdown>
1. Because it deliberately drives straight at testing the one architectural decision every other decision in the book depends on, rather than waiting weeks to learn whether the central bet even works
2. Because district agreements and privacy consent are not actually required for any part of this system
3. Because dashboards are technically impossible to build before the graph exists
4. Because the design specification forbids building user-facing features before month six
</div>

??? question "Show Answer"
    The correct answer is **A**. The MVP plan drives straight at the measurement the whole architecture rests on, rather than spending twenty-one weeks discovering whether the central bet works only after reaching a real user. B contradicts the chapter, which cites consent and rostering as real prerequisites for dashboards. C overstates a sequencing choice as a technical impossibility. D invents a prohibition the specification never states.

    **Concept Tested:** MVP Architecture Proof

    **See:** [Proving the Architecture Before Chasing a User](index.md#proving-the-architecture-before-chasing-a-user)

---

#### 2. What makes the Burst Insensitivity Claim a falsifiable claim rather than a vague promise?

<div class="upper-alpha" markdown>
1. It is stated only in qualitative terms, such as "the architecture should scale well"
2. It has never been tested against any real code, only reasoned about on paper
3. It applies only to the development host tier, never to production
4. It states a specific number (~2,500 upserts/sec), a specific stress test (5x ingest), and a specific pass/fail line (flat versus climbing graph write rate) — outcomes that could actually fail to match reality
</div>

??? question "Show Answer"
    The correct answer is **D**. A specific number, a specific stress test, and a specific pass/fail condition together make the claim something that could actually turn out to be wrong, unlike a vague scalability promise. A describes exactly what this claim avoids being. B correctly describes the claim's status before the MVP, but is not what makes it falsifiable. C invents a scope restriction the claim does not have.

    **Concept Tested:** Burst Insensitivity Claim

    **See:** [The Claim the Architecture Rests On](index.md#the-claim-the-architecture-rests-on)

---

#### 3. What specifically makes a Smoke Harness Decorative Check misleading?

<div class="upper-alpha" markdown>
1. It requires a paid license to run correctly
2. It only runs once per week instead of on every commit
3. Shell command chaining with && silently swallows a failing check unless that check is the final command, so the script can print a checkmark and exit 0 even though the actual assertion never ran or never matched
4. It always reports failure, even when the system is working correctly
</div>

??? question "Show Answer"
    The correct answer is **C**. Because of how `&&` chaining works in a shell script, a failing check that isn't the final command in the chain gets silently swallowed, letting the script print success regardless of what actually happened. A and B each invent an unrelated operational limitation. D describes the opposite failure mode — a check that is too strict rather than one that cannot fail.

    **Concept Tested:** Smoke Harness Decorative Check

    **See:** [Two Bugs Hiding Behind a Green Checkmark](index.md#two-bugs-hiding-behind-a-green-checkmark)

---

#### 4. What is the Mastery Path Disconnection?

<div class="upper-alpha" markdown>
1. A network misconfiguration that prevents the identity service from reaching the vault database
2. The route a student's BKT mastery score is supposed to take from computation to the graph does not actually exist end to end — no query selects the mastery column, no materialized view computes it, and the durable store never carries it forward
3. A missing Kafka topic that prevents statements from reaching the processor at all
4. A licensing restriction that prevents Neo4j Community edition from computing mastery scores
</div>

??? question "Show Answer"
    The correct answer is **B**. Three independent pieces of the pipeline each fail to carry the mastery value forward, so a graph that looks complete never actually receives a mastery score. A confuses this with the unrelated Vault Net Isolation mechanism. C invents a missing infrastructure component this defect does not involve. D fabricates a licensing restriction unrelated to this data-flow defect.

    **Concept Tested:** Mastery Path Disconnection

    **See:** [Two Bugs Hiding Behind a Green Checkmark](index.md#two-bugs-hiding-behind-a-green-checkmark)

---

#### 5. What is the Lift Vs Rewrite Decision, and why does it apply file by file rather than as a single blanket instruction?

<div class="upper-alpha" markdown>
1. It requires every file in the design document to be rewritten from scratch, regardless of whether it is correct
2. It requires every file to be lifted verbatim, regardless of any known defects
3. It only applies to the Dockerfile and Compose file, not to the schema or constraints
4. It reuses an artifact verbatim when correct, reuses it with named fixes when close but flawed, and rewrites it entirely when its core logic cannot be trusted — a decisive, checkable list rather than a vague "review everything" instruction that rarely gets built
</div>

??? question "Show Answer"
    The correct answer is **D**. Applying the decision file by file produces a short, decisive list of concrete verdicts, which is far more likely to actually get built than an open-ended instruction to "review everything." A and B each collapse the decision into a single blanket choice, defeating its whole purpose. C wrongly restricts its scope to only two artifacts, when the chapter applies it across the schema and constraints too.

    **Concept Tested:** Lift Vs Rewrite Decision

    **See:** [Lift Where You Can, Rewrite Where You Must](index.md#lift-where-you-can-rewrite-where-you-must)

---

#### 6. The design document's ClickHouse schema stores the full original statement JSON, verbatim, in a column described as "kept forever," and that column includes the learner's original account name. What does this specifically violate, and how must it be fixed before any statement becomes durable?

<div class="upper-alpha" markdown>
1. It violates Idempotent Delivery, and must be fixed by adding a statement_id uniqueness constraint
2. It violates the pseudonymization boundary from Chapter 6, since any reader with analytics query access — not just the identity vault — could extract the name; the fix is to strip the identifying field before writing it, or move the column behind the vault's own restricted access
3. It violates the Grain Uniqueness Constraint, and must be fixed by adding a composite key
4. It violates the Statement Label Prohibition, and must be fixed by removing the raw column's node label
</div>

??? question "Show Answer"
    The correct answer is **B**. Storing the raw identifying name in the analytics store lets any analytics reader, not just the vault, re-identify a supposedly de-identified learner — a direct contradiction of the pseudonymization boundary. A misapplies an unrelated delivery-idempotency mechanism. C and D each name a real Neo4j-side constraint that has nothing to do with this ClickHouse column.

    **Concept Tested:** Raw Column PII Hole

    **See:** [Three Fixes That Ride Along With the Lift](index.md#three-fixes-that-ride-along-with-the-lift)

---

#### 7. A downstream query needs to filter directly on a column tracking when a student last engaged with a concept, but the design declares that column as an aggregate-function type meant only to be merged across rows during a rollup. What problem does this create, and what is the Last Seen Type Fix?

<div class="upper-alpha" markdown>
1. The aggregate type causes the summarizer to crash on every write; the fix removes the column entirely
2. The aggregate type leaks PII; the fix moves it behind the vault's restricted access
3. The aggregate type cannot support a direct filter comparison without a type error or a full table scan that defeats the column's own "only touch changed rows" purpose; the fix declares it as a plain, filterable value instead
4. The aggregate type prevents the Kafka topic from partitioning correctly; the fix increases the partition count
</div>

??? question "Show Answer"
    The correct answer is **C**. A pre-merged aggregate type cannot be filtered on directly without a type error or a full table scan that undermines the column's own change-driven purpose, so declaring it as a plain, filterable value resolves both problems at once. A invents a crash this type mismatch does not cause. B confuses this with an unrelated PII fix. D fabricates a connection to Kafka partitioning that this ClickHouse column type has nothing to do with.

    **Concept Tested:** Last Seen Type Fix

    **See:** [Three Fixes That Ride Along With the Lift](index.md#three-fixes-that-ride-along-with-the-lift)

---

#### 8. A team has just confirmed that every service's healthcheck goes healthy on the pinned container versions and that the graph's uniqueness constraint works on the free Neo4j Community licensing tier, from a freshly cloned repository. Which MVP build step have they just completed?

<div class="upper-alpha" markdown>
1. MVP Step 4 Compression Graph
2. MVP Step 1 Foundation
3. MVP Step 5 Burst Proof
4. MVP Step 3 Loadgen Contract
</div>

??? question "Show Answer"
    The correct answer is **B**. MVP Step 1 Foundation's exit criterion is exactly this: a clean boot from a freshly cloned repository, with every healthcheck passing and the uniqueness constraint confirmed on Community edition. A, C, and D each name a real, later step whose exit criteria involve different, more advanced checks that have not yet been described in this scenario.

    **Concept Tested:** MVP Step 1 Foundation

    **See:** [Five Steps From a Cold Clone to a Measurement](index.md#five-steps-from-a-cold-clone-to-a-measurement)

---

#### 9. Why does the MVP Deferred Scope defer the full A/B-experimentation framework and every admin-facing dashboard, given that neither is described as a bad idea?

<div class="upper-alpha" markdown>
1. Because both are legitimate, eventually-necessary pieces of the system, but building them now would not inform the one measurement this MVP exists to produce — a controlled experiment on synthetic students would yield noise, not evidence, and dashboards need a roster and consent this MVP does not have
2. Because both features were found to be technically impossible to implement given the current architecture
3. Because both features have already been fully built in a previous milestone and do not need to be repeated
4. Because both features would violate the Statement Label Prohibition if implemented
</div>

??? question "Show Answer"
    The correct answer is **A**. Deferring good ideas that would not move the central measurement forward is a deliberate protective choice, not a judgment that either feature is flawed. B wrongly claims technical impossibility for what is really a scoping decision. C is false — this is a fresh MVP build, not a continuation of prior milestone work. D invents an unrelated technical violation neither feature would actually cause.

    **Concept Tested:** MVP Deferred Scope

    **See:** [What This MVP Deliberately Leaves Out](index.md#what-this-mvp-deliberately-leaves-out)

---

#### 10. In Step 5's burst-proof chart, what specifically distinguishes a passing result from a failing one, and what would a failing result mean for the rest of the book's conclusions?

<div class="upper-alpha" markdown>
1. A passing result shows the ingest-rate line rising five-fold while the graph-write-rate line stays essentially flat; a failing result would show the graph-write-rate line climbing in step with ingest, meaning compression does not actually decouple the two, and conclusions like the production cost estimate and the no-per-statement-vertex rule would need to be revisited
2. A passing result shows both lines climbing together in perfect proportion; a failing result shows both lines staying flat
3. A passing result requires the graph database to be intentionally stopped mid-test; a failing result requires it to stay running throughout
4. A passing result is defined only by whether the smoke check prints a checkmark, regardless of what either line does
</div>

??? question "Show Answer"
    The correct answer is **A**. A passing burst proof shows ingest rising five-fold while graph writes barely move; a failing one shows both climbing together, which would force a revisit of every downstream conclusion — like the production cost estimate and the ban on per-statement graph vertices — that assumes compression decouples the two. B reverses the actual pass and fail patterns. C confuses the burst proof with the separate chaos-check component of Step 5. D contradicts this whole chapter's warning against trusting an undiscriminating checkmark.

    **Concept Tested:** Burst Insensitivity Claim (reading the proof)

    **See:** [Reading the Proof](index.md#reading-the-proof)

---
