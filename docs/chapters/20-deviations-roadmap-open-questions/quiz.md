---
title: "Quiz: Spec Deviations, the Delivery Roadmap, and Open Questions"
description: Review questions on the three open specification deviations, the six delivery milestones and their exit criteria, and the seven open questions this project's design specification has not yet resolved.
social:
   cards: false
---
# Quiz: Spec Deviations, the Delivery Roadmap, and Open Questions

Test your understanding of this project's spec deviations, delivery roadmap, and open questions with these review questions.

---

#### 1. Why does the D-3 Partition Key Deviation replace district-only Kafka partitioning with a composite {district_id}:{student_key} key?

<div class="upper-alpha" markdown>
1. Because the functional specification never mentioned a partition key at all
2. Keying by district alone would route a large district's entire traffic onto a single partition, a write hotspot the specification's own scale targets forbid, while the composite key still keeps one learner's statements together in order
3. Because Kafka technically requires every partition key to include at least two fields
4. Because BKT updates do not depend on statement ordering in any way
</div>

??? question "Show Answer"
    The correct answer is **B**. District-only keying would route a large district's entire traffic onto one partition, exactly the hotspot the specification's own scale targets forbid, while the composite key spreads load evenly and still keeps one learner's own statements in strict order. A is false — the specification does name a partition key, just a narrower one. C invents a fabricated Kafka requirement. D directly contradicts Chapter 12's BKT ordering dependency, which is the whole reason per-learner ordering must be preserved.

    **Concept Tested:** D-3 Partition Key Deviation

    **See:** [D-3: Partitioning by Learner, Not Just by District](index.md#d-3-partitioning-by-learner-not-just-by-district)

---

#### 2. What problem does the D-4 Privacy Threshold Deviation solve?

<div class="upper-alpha" markdown>
1. A literal reading of the group-size threshold rule would suppress a teacher's own single-student or small-class reports on day one, so D-4 scopes the threshold to non-rostered views only
2. It removes the group-size threshold requirement from the specification entirely
3. It raises the default threshold from 10 students to 20
4. It applies the threshold only to district-level reports, never to section-level ones
</div>

??? question "Show Answer"
    The correct answer is **A**. Read literally, the threshold rule would blank a Student Detail report (a group of one) and many Class Detail reports for every teacher, so D-4 narrows the rule to non-rostered views, exempting a role's own directly-rostered scope. B overstates the fix as a full removal rather than a scoping change. C invents an unrelated numeric change. D misdescribes the actual scope, which is about rostered relationship, not report level.

    **Concept Tested:** D-4 Privacy Threshold Deviation

    **See:** [D-4 and D-5: The Threshold That Would Blank Every Dashboard](index.md#d-4-and-d-5-the-threshold-that-would-blank-every-dashboard)

---

#### 3. How does D-5 Complementary Suppression close the gap D-4 leaves open?

<div class="upper-alpha" markdown>
1. By removing row totals from every published report entirely
2. By requiring every report to include at least ten rows regardless of actual data
3. By applying threshold suppression twice in sequence to the same cell
4. By suppressing at least one additional, larger cell whenever one small cell is hidden in a row that publishes its total, so the small cell's value cannot be recovered by subtraction
</div>

??? question "Show Answer"
    The correct answer is **D**. D-5 hides a second, larger cell alongside the first whenever leaving the row's total and remaining cells visible would let the suppressed value be recovered by arithmetic. A would break legitimate reporting entirely rather than closing a specific loophole. B invents an unrelated minimum-row requirement. C misdescribes the mechanism as reapplying the same rule rather than a distinct, second suppression.

    **Concept Tested:** D-5 Complementary Suppression

    **See:** [D-4 and D-5: The Threshold That Would Blank Every Dashboard](index.md#d-4-and-d-5-the-threshold-that-would-blank-every-dashboard)

---

#### 4. What is the exit criterion for M0 Walking Skeleton?

<div class="upper-alpha" markdown>
1. The ADL Conformance Test Suite passing in full
2. Replay reproducing mastery scores bit-for-bit
3. make up && make smoke passing from a cold clone
4. A load test sustaining 10,000 statements per second
</div>

??? question "Show Answer"
    The correct answer is **C**. M0's exit criterion is `make up && make smoke` passing from a cold clone, proving the deployment story is real from week three rather than week twenty. A is M1's exit criterion. B is M2's. D is M5's — each answer names a real milestone's criterion, just not M0's.

    **Concept Tested:** M0 Walking Skeleton

    **See:** [Six Milestones from an Empty Repository to Production Scale](index.md#six-milestones-from-an-empty-repository-to-production-scale)

---

#### 5. A team wants to confirm that its Neo4j graph structure, ClickHouse rollup materialized views, summarizer, and BKT engine are all working correctly together before moving on to build dashboards. Which milestone's exit criterion is specifically designed to prove this, and what does that criterion require?

<div class="upper-alpha" markdown>
1. M1 Ingestion Complete; its exit criterion requires the dead-letter queue to be empty
2. M2 Compression Graph Mastery; its exit criterion requires replay to reproduce mastery scores bit-for-bit, the C-1/C-3/C-4/C-6 compression tests to pass, and graph lag under load to stay under 90 seconds
3. M3 Analytics Dashboards; its exit criterion requires a 95th-percentile response under two seconds
4. M4 Admin Experiments; its exit criterion requires a sample-ratio mismatch check to stay green
</div>

??? question "Show Answer"
    The correct answer is **B**. M2 Compression Graph Mastery is built around exactly this stack, and its exit criterion is a strict, falsifiable claim: bit-for-bit replay reproducibility, the named compression tests passing, and bounded graph lag. A, C, and D each name a real milestone and a real exit criterion, but for a different milestone than the one described.

    **Concept Tested:** M2 Compression Graph Mastery

    **See:** [Six Milestones from an Empty Repository to Production Scale](index.md#six-milestones-from-an-empty-repository-to-production-scale)

---

#### 6. A team is preparing to ship M3 Analytics Dashboards, which delivers the first teacher-facing reports including Student Detail and My Classes. According to this chapter, which open deviation must land before this milestone ships, and what happens if it does not?

<div class="upper-alpha" markdown>
1. D-3 Partition Key Deviation; without it, Kafka would develop a write hotspot during the M3 launch
2. The Neo4j Licensing Question; without a decision, the graph has no home by M3
3. D-4 Privacy Threshold Deviation; without it, a literal reading of the suppression rule would blank a teacher's own class roster on their very first login
4. The Gateway Language Trigger; without it, the gateway cannot handle M3's request volume
</div>

??? question "Show Answer"
    The correct answer is **C**. The design specification calls D-4 "the one worth acting on before M3" — without it, the literal threshold rule would suppress a teacher's own class roster the moment M3 ships. A misplaces D-3's urgency, which concerns ingestion, not M3's dashboard launch. B confuses the Neo4j Licensing Question's deadline, which is before M2, not M3. D misapplies an unrelated open question's timing to M3.

    **Concept Tested:** D-4 Privacy Threshold Deviation

    **See:** [D-4 and D-5: The Threshold That Would Blank Every Dashboard](index.md#d-4-and-d-5-the-threshold-that-would-blank-every-dashboard)

---

#### 7. What makes the Neo4j Licensing Question a real open decision rather than a settled matter?

<div class="upper-alpha" markdown>
1. Neo4j has already been fully replaced by ClickHouse in the current design
2. The functional specification mandates Neo4j Enterprise unconditionally
3. Memgraph is legally required for any project handling student data
4. Neo4j Community cannot cluster and has no high-availability story on its own, while Neo4j Enterprise/Aura carry real cost at this project's scale, and Memgraph is a credible but unconfirmed alternative
</div>

??? question "Show Answer"
    The correct answer is **D**. Community edition's lack of clustering, Enterprise/Aura's real licensing cost, and Memgraph's status as a credible but unadopted alternative together make this a genuine, unresolved budget decision. A is false — Neo4j still holds structure and summary vertices in the current design. B and C each invent a mandate or legal requirement the chapter never states.

    **Concept Tested:** Neo4j Licensing Question

    **See:** [Seven Questions the Design Specification Leaves Open](index.md#seven-questions-the-design-specification-leaves-open)

---

#### 8. This project's M1 milestone instruments the distribution of real batch sizes arriving at the ingestion gateway. According to the Gateway Language Trigger, under what condition would this data justify moving the gateway off Python?

<div class="upper-alpha" markdown>
1. If the average batch size trends toward one statement per batch, since that is the point where Python's per-request overhead, not raw throughput, becomes the bottleneck
2. If the number of registered districts exceeds a fixed count
3. If ClickHouse disk usage exceeds 28 terabytes
4. If the Neo4j Licensing Question resolves in favor of Memgraph
</div>

??? question "Show Answer"
    The correct answer is **A**. The gateway stays in Python unless real batch sizes trend toward one statement per batch, the specific point where per-request overhead rather than raw throughput becomes the constraint. B and C each invent an unrelated numeric trigger. D confuses this decision with an entirely separate open question about graph database licensing.

    **Concept Tested:** Gateway Language Trigger

    **See:** [Seven Questions the Design Specification Leaves Open](index.md#seven-questions-the-design-specification-leaves-open)

---

#### 9. Why does the MicroSim BKT Mapping Gap exist, given that the MicroSimEngagement grain already captures session-shaped interaction data like range explored and dwell time?

<div class="upper-alpha" markdown>
1. Because MicroSimEngagement is never actually written to the graph at all
2. Because BKT cannot process any evidence besides graded quiz responses under any circumstances
3. Because the event schema's result_score and result_success columns assume the emitting client already computed a per-statement score, which fits a graded question but not a continuous, exploratory control, and nothing today feeds MicroSimEngagement's fields into ConceptMastery
4. Because the gap was closed by ADR-006 and no longer exists in the current design
</div>

??? question "Show Answer"
    The correct answer is **C**. The schema's score fields assume a per-statement score the emitting client already computed, which does not fit a continuous control like a slider, and no mechanism today routes `MicroSimEngagement`'s captured session shape into `ConceptMastery`'s BKT update. A contradicts Chapter 8, which describes this grain as an existing summary vertex. B is false — Chapter 12 already describes Soft Correctness Mapping for non-binary evidence in principle. D is wrong; ADR-006 selected the BKT algorithm itself, not this unresolved mapping question.

    **Concept Tested:** MicroSim BKT Mapping Gap

    **See:** [The Deepest Open Question: Mapping MicroSim Evidence into Mastery](index.md#the-deepest-open-question-mapping-microsim-evidence-into-mastery)

---

#### 10. Why are D-1 and D-2 described as "closed" while D-3 through D-5 remain "open," even though all five originally described a real gap between the specification and the design?

<div class="upper-alpha" markdown>
1. Because D-1 and D-2 were later found to be factually incorrect and simply deleted from the document
2. Because D-1 and D-2's resolution was to amend the specification itself to match the design — the per-statement-vertex model was rejected outright — while D-3 through D-5 each still have a proposed amendment awaiting adoption into the spec text
3. Because D-3 through D-5 apply only to a future version of the system that has not been built yet
4. Because D-1 and D-2 concern Kafka, which this project no longer uses
</div>

??? question "Show Answer"
    The correct answer is **B**. D-1 and D-2 closed because the specification itself was amended to prohibit per-statement vertices, matching the design that was already built; D-3 through D-5 each have a proposed fix that has not yet been formally adopted into the spec text. A mischaracterizes a resolved disagreement as an error deletion. C is false — all three open deviations describe the current, already-built design. D confuses D-1/D-2's actual subject, the graph data model, with an unrelated Kafka topic.

    **Concept Tested:** D-3 Partition Key Deviation / D-4 Privacy Threshold Deviation / D-5 Complementary Suppression

---
