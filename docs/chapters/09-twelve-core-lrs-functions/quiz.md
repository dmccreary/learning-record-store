---
title: "Quiz: The Twelve Core LRS Functions"
description: Review questions on this project's twelve core functions — storage, retrieval, voiding, activity resolution, concept mapping, mastery, progress, experiment assignment, export, and retention.
social:
   cards: false
---
# Quiz: The Twelve Core LRS Functions

Test your understanding of this project's twelve core LRS functions, F-1 through F-12, with these review questions.

---

#### 1. What does the Statement Storage Function (F-1) guarantee?

<div class="upper-alpha" markdown>
1. A compressed summary of every student's mastery, held in the property graph
2. A durable, immutable, queryable record of every xAPI event, held in the Event Store rather than the graph
3. A cached copy of recent statements, held in Redis for fast dashboard reads
4. A signed download URL for bulk statement exports
</div>

??? question "Show Answer"
    The correct answer is **B**. F-1 keeps every xAPI event as a durable, immutable, queryable record in the Event Store — the system of record that every other function ultimately reads from or writes into. A describes mastery computation, a separate function operating on the graph. C invents a caching layer not described as F-1's job. D describes the Export Function, a different function entirely.

    **Concept Tested:** Statement Storage Function

    **See:** [The Record-Keeping Core: Storage, Retrieval, and Voiding](index.md#the-record-keeping-core-storage-retrieval-and-voiding)

---

#### 2. What does the Statement Retrieval Function (F-2) provide?

<div class="upper-alpha" markdown>
1. A report that aggregates mastery scores across an entire section
2. A dashboard chart rendering engagement trends over time
3. A bulk, asynchronous export of an entire district's statement history
4. A conformant GET /xapi/statements endpoint that filters by actor, verb, activity, time range, and registration, returning raw statements rather than an aggregate
</div>

??? question "Show Answer"
    The correct answer is **D**. Retrieval is deliberately narrow: a filtered list of raw statements, not an aggregate figure or report. A and B each describe aggregated, computed output, which is a different function's job entirely. C describes the Export Function's bulk, asynchronous job, a distinct capability from live, filtered retrieval.

    **Concept Tested:** Statement Retrieval Function

    **See:** [The Record-Keeping Core: Storage, Retrieval, and Voiding](index.md#the-record-keeping-core-storage-retrieval-and-voiding)

---

#### 3. When a Learning Record Provider sends a statement voiding an earlier one, what actually happens to the original row in the Event Store?

<div class="upper-alpha" markdown>
1. The original row is deleted and replaced by the voiding statement
2. The original row's fields are edited in place to reflect the correction
3. The original row's voided_by property is set, and it is excluded from future rollups and default retrieval, but it is never deleted or edited
4. The original row is moved to a separate archive table inaccessible to any function
</div>

??? question "Show Answer"
    The correct answer is **C**. The original row's `voided_by` property is set to the retracting statement's identifier, and the row is excluded from rollups and default retrieval going forward, but it remains permanently in the Event Store as a fact that was later retracted. A and B both violate the Event Store's immutability rule. D invents an archive mechanism the chapter does not describe.

    **Concept Tested:** Voiding Function

    **See:** [The Record-Keeping Core: Storage, Retrieval, and Voiding](index.md#the-record-keeping-core-storage-retrieval-and-voiding)

---

#### 4. What does the Activity Resolution Function (F-5) do when a statement's Object IRI does not match anything the graph has seen before?

<div class="upper-alpha" markdown>
1. It falls back to creating a provisional stub rather than blocking, the same mechanism Chapter 8 calls Accept-First Ingestion
2. It rejects the statement with a 400 error
3. It queues the statement indefinitely until a human manually resolves the IRI
4. It silently discards the Object field and stores the statement without it
</div>

??? question "Show Answer"
    The correct answer is **A**. Activity Resolution falls back to a provisional stub rather than blocking on a miss, the same Provisional Node mechanism Chapter 8 already described in full under Accept-First Ingestion. B contradicts Schema On Read's non-rejecting design. C invents a manual, blocking step the chapter never describes. D would silently lose data, contradicting the no-data-loss guarantee established in Chapter 8.

    **Concept Tested:** Activity Resolution Function

    **See:** [Turning Raw Statements into Structure](index.md#turning-raw-statements-into-structure)

---

#### 5. What problem does the Concept Mapping Function (F-6) solve that would otherwise leave a completed quiz question with no path back to any concept?

<div class="upper-alpha" markdown>
1. It assigns the statement a Bloom's Taxonomy level based on its Verb
2. It attaches the statement to the concepts it addresses through the COVERS graph, using the object already resolved by Activity Resolution
3. It pseudonymizes the actor before any other enrichment step runs
4. It computes the student's mastery_score directly from the raw statement
</div>

??? question "Show Answer"
    The correct answer is **B**. Concept Mapping stamps the resolved object's `concept_ids` onto the enriched record by consulting the `COVERS` graph, turning "an event about question 47" into "evidence about Photosynthesis." A describes an unrelated Bloom's-level tagging step this function does not perform. C describes Actor Pseudonymization, an earlier step in the sequence. D describes Mastery Computation, a separate, later function.

    **Concept Tested:** Concept Mapping Function

    **See:** [Turning Raw Statements into Structure](index.md#turning-raw-statements-into-structure)

---

#### 6. A dashboard shows a student with long dwell times and many revisits on a page about Photosynthesis, but a low mastery_score for the Photosynthesis concept. Which two functions produced these two different figures, and why don't they need to agree?

<div class="upper-alpha" markdown>
1. Statement Retrieval Function and Export Function; because retrieval and export always disagree by design
2. Actor Pseudonymization Function and Concept Mapping Function; because pseudonymization always suppresses low scores
3. Voiding Function and Reconciliation Function; because a voided statement always lowers mastery
4. Mastery Computation Function and Progress Projection Function; because engagement evidence like dwell time is not itself evidence of mastery, only evidence that a student showed up
</div>

??? question "Show Answer"
    The correct answer is **D**. Progress Projection maintains `PageEngagement`'s dwell-time and revisit data, while Mastery Computation separately maintains `mastery_score` from quiz and interaction evidence — a student can show extensive engagement while still scoring low, because engagement is not itself proof of mastery. A, B, and C each pair two unrelated functions with a fabricated reason they would disagree.

    **Concept Tested:** Mastery Computation Function / Progress Projection Function

    **See:** [Turning Structure into Insight](index.md#turning-structure-into-insight)

---

#### 7. The system that assigns students to A/B-test variants becomes temporarily unavailable. According to the Experiment Assignment Function's design, what happens to a student's statement during that outage?

<div class="upper-alpha" markdown>
1. The student simply receives the control arm, and their statement is still recorded normally — assignment never blocks the event stream
2. The student's statement is held back until the assignment service recovers
3. The Ingestion Gateway rejects the statement with a 503 response
4. The statement is routed to the dead-letter stream for manual review
</div>

??? question "Show Answer"
    The correct answer is **A**. The specification states the assignment mechanism never blocks the event stream — if it is ever unavailable, a student simply receives the control arm and their statement is recorded as normal. B, C, and D each describe a blocking or rejecting behavior that directly contradicts this project's non-blocking ingestion principle.

    **Concept Tested:** Experiment Assignment Function

    **See:** [Functions at the System's Edges](index.md#functions-at-the-systems-edges)

---

#### 8. A system administrator requests a bulk export of an entire district's statement history. According to the Export Function's design, what should the administrator expect?

<div class="upper-alpha" markdown>
1. The full dataset streamed directly back in the same HTTP response that requested it
2. A real-time GraphQL subscription that pushes new statements as they arrive
3. An asynchronous job that, on completion, delivers a signed, time-limited download URL rather than streaming the data live
4. Immediate rejection, since bulk exports are not supported by this LRS
</div>

??? question "Show Answer"
    The correct answer is **C**. Because a district-scale export can take minutes to assemble, the Export Function runs as a background job and delivers a signed, time-limited download URL rather than streaming data live, keeping it from competing with fast dashboard queries. A and B each describe a live-streaming approach that this design specifically avoids. D is false — bulk export is exactly what F-11 provides.

    **Concept Tested:** Export Function

    **See:** [Functions at the System's Edges](index.md#functions-at-the-systems-edges)

---

#### 9. This project partitions statements by month specifically to support the Retention Purge Function. Why does that partitioning choice matter for enforcing a district's chosen retention window?

<div class="upper-alpha" markdown>
1. It allows every district to share exactly the same retention window regardless of their compliance requirements
2. It lets the system enforce a retention window by dropping an entire partition rather than editing or deleting individual rows one at a time
3. It is required so that Statement IDs can be reused across different months
4. It prevents the Reconciliation Worker from ever processing statements older than one month
</div>

??? question "Show Answer"
    The correct answer is **B**. Storing statements partitioned by month turns retention enforcement into dropping an entire partition rather than editing or deleting rows individually, which scales far better. A is false — each district chooses its own retention window. C invents an ID-reuse requirement the chapter never states. D fabricates an unrelated restriction on the Reconciliation Worker.

    **Concept Tested:** Retention Purge Function

    **See:** [Functions at the System's Edges](index.md#functions-at-the-systems-edges)

---

#### 10. Why do Actor Pseudonymization (F-4), Activity Resolution (F-5), and Concept Mapping (F-6) have to run in that specific fixed order inside the Stream Processor, rather than in any order?

<div class="upper-alpha" markdown>
1. Because Neo4j requires writes to occur in alphabetical order by function name
2. Because the order is arbitrary and could be freely rearranged without affecting mastery computation
3. Because Concept Mapping depends on Activity Resolution having already found or stubbed the object, and both downstream functions assume pseudonymization has already replaced the raw actor identity
4. Because the Ingestion Gateway enforces the order through its structural validation step
</div>

??? question "Show Answer"
    The correct answer is **C**. The three functions form a dependency chain: pseudonymization must run first so nothing downstream ever sees a raw identity, and Concept Mapping depends on Activity Resolution having already resolved or stubbed the object it maps to concepts. A is a fabricated database rule. B contradicts the chapter's explicit statement that order matters. D misattributes enforcement to the Ingestion Gateway, which runs earlier and performs only structural checks.

    **Concept Tested:** Activity Resolution Function / Concept Mapping Function (processing order)

    **See:** [Turning Raw Statements into Structure](index.md#turning-raw-statements-into-structure)

---
