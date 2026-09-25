---
title: "Quiz: Summary Vertices and Statement Ingestion Mechanics"
description: Review questions on the six summary-vertex grains, statement compression ratios, structural and semantic validation, delivery guarantees, Accept-First Ingestion, and Change-Driven Materialization.
social:
   cards: false
---
# Quiz: Summary Vertices and Statement Ingestion Mechanics

Test your understanding of this project's compression pipeline and statement ingestion mechanics with these review questions.

---

#### 1. What does a Summary Vertex's Analytical Grain define?

<div class="upper-alpha" markdown>
1. The exact combination of dimensions, such as (student, concept), that one summary vertex is computed at and willing to answer questions about
2. The number of districts a summary vertex is visible to
3. The Bloom's Taxonomy level of the quiz question a statement responds to
4. The retention period before a summary vertex is purged
</div>

??? question "Show Answer"
    The correct answer is **A**. A grain is the exact unit a summary vertex answers questions about, such as (student, concept) or (section, concept) — not a rounding choice, but the precise combination of dimensions materialized. B, C, and D each attribute an unrelated property — visibility, Bloom's level, or retention — to the grain concept, none of which the chapter describes.

    **Concept Tested:** Analytical Grain

    **See:** [What a Summary Vertex Actually Compresses](index.md#what-a-summary-vertex-actually-compresses)

---

#### 2. A dashboard needs to know how many times a specific student has attempted one specific quiz question, and what fraction succeeded. Which summary-vertex grain answers this directly?

<div class="upper-alpha" markdown>
1. SectionRollup, at the (section, concept) grain
2. LearningSession, at the (student, session) grain
3. PageEngagement, at the (student, page) grain
4. QuestionResponse, at the (student, question) grain
</div>

??? question "Show Answer"
    The correct answer is **D**. `QuestionResponse` compresses every attempt at one quiz question at the (student, question) grain, carrying `attempts` and `successes` properties that answer exactly this question. A aggregates across a whole class, not one student's attempts. B compresses a burst of session activity, not question-specific outcomes. C compresses page-reading behavior, unrelated to quiz attempts.

    **Concept Tested:** Question Response Vertex

    **See:** [The Six Grains This Deployment Materializes](index.md#the-six-grains-this-deployment-materializes)

---

#### 3. What does the `statements_compressed` property (or its equivalent, such as `event_count` or `student_count`) let a report determine?

<div class="upper-alpha" markdown>
1. Which district the statement originated from
2. Whether the statement passed Semantic Validation
3. How much evidence a given summary value rests on, not just what the value itself is
4. The exact timestamp of the most recent statement folded into the vertex
</div>

??? question "Show Answer"
    The correct answer is **C**. Every summary vertex carries an explicit evidence-count property, letting a report distinguish a mastery score backed by hundreds of events from one backed by just a handful. A is unrelated — district scoping is handled elsewhere. B describes a validation outcome, not an evidence count. D describes `last_seen`, a separate property from the evidence count.

    **Concept Tested:** Statements Compressed

    **See:** [The Six Grains This Deployment Materializes](index.md#the-six-grains-this-deployment-materializes)

---

#### 4. Why does the Statement Compression Ratio keep climbing indefinitely for a given (student, concept) pair, rather than leveling off?

<div class="upper-alpha" markdown>
1. Because the ratio resets to zero at the start of every academic year
2. Because the vertex count for that pair is fixed at one, while the statement count behind it keeps growing as long as the pair keeps generating evidence
3. Because SectionRollup vertices are deleted and regenerated nightly
4. Because Semantic Validation rejects any statement beyond the first hundred for a given pair
</div>

??? question "Show Answer"
    The correct answer is **B**. Because one grain always materializes to exactly one vertex, no matter how many statements feed it, the ratio of statements to vertices only grows as more evidence accumulates for that pair — it never resets on its own. A, C, and D each invent a periodic reset or rejection behavior the chapter does not describe.

    **Concept Tested:** Statement Compression Ratio

    **See:** [How Much Compression Buys You](index.md#how-much-compression-buys-you)

---

#### 5. What happens immediately after the xAPI Statement Resource accepts a POST request carrying a new statement?

<div class="upper-alpha" markdown>
1. The endpoint returns its 200 or 204 response as soon as the statement is durably queued, not after validation or graph projection
2. The statement is validated end to end against every downstream grain before any response is sent
3. The statement is synchronously written to its target summary vertex before the response is returned
4. The endpoint waits for the Reconciliation Worker to confirm the textbook version before responding
</div>

??? question "Show Answer"
    The correct answer is **A**. The endpoint responds as soon as a statement is durably queued, deliberately before semantic validation or graph projection happen, so a slow downstream component never makes a textbook page's request hang. B, C, and D each describe a synchronous wait on downstream work that this design specifically avoids.

    **Concept Tested:** xAPI Statement Resource

    **See:** [How a Statement Actually Arrives](index.md#how-a-statement-actually-arrives)

---

#### 6. What is the key difference between Structural Validation and Semantic Validation in this pipeline?

<div class="upper-alpha" markdown>
1. Structural Validation is optional, while Semantic Validation is mandatory for every statement
2. Both validations happen synchronously at the Ingestion Gateway, one after the other
3. Semantic Validation rejects statements outright, while Structural Validation always accepts and reconciles later
4. Structural Validation happens synchronously at the Ingestion Gateway and rejects malformed statements outright; Semantic Validation happens asynchronously in the Stream Processor and accepts unrecognized verbs or activities under Schema On Read rather than rejecting them
</div>

??? question "Show Answer"
    The correct answer is **D**. Structural Validation is a synchronous, reject-on-failure gate at the Ingestion Gateway, while Semantic Validation runs asynchronously in the Stream Processor and, under Schema On Read, accepts unrecognized content for later reconciliation instead of rejecting it. A misstates both as optional/mandatory when both always run. B wrongly places Semantic Validation at the gateway. C reverses which tier rejects and which tier reconciles.

    **Concept Tested:** Structural Validation / Semantic Validation

    **See:** [How a Statement Actually Arrives](index.md#how-a-statement-actually-arrives)

---

#### 7. An intelligent textbook author invents a brand-new Verb IRI that this LRS has never seen before and includes it in an otherwise well-formed statement. What happens to that statement under Schema On Read?

<div class="upper-alpha" markdown>
1. The entire batch containing it is rejected with a 400 response
2. It is silently dropped without being logged anywhere
3. It is accepted, recorded, and flagged for later reconciliation rather than rejected at the door
4. It is held in a pending queue until a system administrator manually approves the new verb
</div>

??? question "Show Answer"
    The correct answer is **C**. Schema On Read means unknown verbs, activities, or textbook versions are accepted, buffered, and back-filled into the graph rather than rejected — a deliberate design choice distinct from Structural Validation's all-or-nothing rejection. A describes what happens to a structurally malformed batch, a different failure mode. B contradicts the chapter's emphasis on no data loss. D invents a manual-approval gate the chapter does not describe.

    **Concept Tested:** Schema On Read

    **See:** [How a Statement Actually Arrives](index.md#how-a-statement-actually-arrives)

---

#### 8. A Stream Processor crashes and restarts after partially processing a batch, causing the same statement to be redelivered and reprocessed. What specifically prevents this from double-counting evidence in the resulting summary vertex?

<div class="upper-alpha" markdown>
1. At-Least-Once Delivery alone, since it guarantees a statement reaches a processor at least once
2. Idempotent Delivery, keyed on the statement's own statement_id, so reprocessing the same statement leaves the system in the same state as processing it once
3. Backpressure, which throttles the producer whenever a crash is detected
4. Schema On Read, which defers unrecognized statements until reconciliation
</div>

??? question "Show Answer"
    The correct answer is **B**. Idempotent Delivery, achieved by treating each statement's `statement_id` as a uniqueness key, is what makes redelivery safe — a redelivered statement overwrites its own prior copy rather than being double-counted. A names the guarantee that makes redelivery likely, not the mechanism that makes it safe. C and D each describe an unrelated mechanism that plays no role in preventing double-counting.

    **Concept Tested:** Idempotent Delivery / At-Least-Once Delivery

    **See:** [Delivery Guarantees: Redelivered but Never Duplicated](index.md#delivery-guarantees-redelivered-but-never-duplicated)

---

#### 9. Under this project's Backpressure design, what happens when statements arrive faster than processors can consume them, short of the most extreme overload case?

<div class="upper-alpha" markdown>
1. A producer that keeps sending receives a 202 Accepted response with a retry hint, letting it slow down gracefully rather than being rejected outright
2. The Ingestion Gateway immediately returns a 503 and stops accepting any new statements
3. Excess statements are silently dropped from the Durable Event Queue to protect processor health
4. The Reconciliation Worker pauses all promotion of Provisional Nodes until load subsides
</div>

??? question "Show Answer"
    The correct answer is **A**. Under ordinary overload, the producer keeps receiving 202 Accepted responses carrying a retry hint, letting it back off gracefully; only in the extreme case of an unreachable queue does the endpoint return a 503. B overstates the ordinary-overload response. C contradicts the whole point of backpressure, which is to avoid silent drops. D describes an unrelated reconciliation behavior.

    **Concept Tested:** Backpressure

    **See:** [Delivery Guarantees: Redelivered but Never Duplicated](index.md#delivery-guarantees-redelivered-but-never-duplicated)

---

#### 10. A district deploys a brand-new textbook version that has never been registered with this LRS. A student immediately starts using it and generates statements. What happens to those statements under Accept-First Ingestion?

<div class="upper-alpha" markdown>
1. They are rejected until the district manually pre-registers the new textbook version
2. They are queued indefinitely without being written to the Event Store until reconciliation completes
3. They are converted into SubStatements until the textbook is formally approved
4. They are accepted, and the Stream Processor auto-provisions placeholder Provisional Nodes for the referenced structure, later matched and promoted by the Reconciliation Worker without any data loss
</div>

??? question "Show Answer"
    The correct answer is **D**. Accept-First Ingestion accepts statements about a never-before-seen textbook immediately, auto-provisioning Provisional Node stubs that the Reconciliation Worker later matches and promotes, with no data lost in the interim. A contradicts Non-Blocking Ingestion's whole purpose. B is wrong because statements are fully retained in the Event Store throughout. C invents an unrelated Sub-Statement conversion not described in this chapter.

    **Concept Tested:** Accept-First Ingestion / Provisional Node / Reconciliation Worker

    **See:** [Shipping a Textbook Before It Is Registered](index.md#shipping-a-textbook-before-it-is-registered)

---

#### 11. Why does Change-Driven Materialization write only the grains whose rollups have changed since the last sync, rather than recomputing every grain's full history on every cycle?

<div class="upper-alpha" markdown>
1. Because Neo4j cannot process more than one write per second
2. Because unchanged grains are automatically deleted to save storage space
3. Because recomputing every grain regardless of change would waste write capacity on grains with no new evidence, while the actual goal is to keep the graph write rate close to steady-state even during a burst of statement volume
4. Because the Event Store discards incremental rollups after each sync cycle
</div>

??? question "Show Answer"
    The correct answer is **C**. Writing only changed grains keeps the graph write rate close to steady-state even during a statement-volume burst, since a burst mostly means already-active students send more events rather than many new distinct grains appearing. A is a fabricated technical limitation. B and D each invent a deletion or discarding behavior the chapter never describes.

    **Concept Tested:** Change-Driven Materialization

    **See:** [Turning Rollups Into Graph Writes](index.md#turning-rollups-into-graph-writes)

---

#### 12. Why is writing each changed summary-vertex property as an Absolute Value Write, rather than as an increment on the existing value, essential to this pipeline's safety under At-Least-Once Delivery?

<div class="upper-alpha" markdown>
1. Absolute values compress better on disk than incremented counters
2. An incremented counter is not idempotent — replaying the same update twice would inflate it undetectably — while an absolute value write is idempotent by construction, so redelivery or a full replay leaves the graph in the same correct state
3. Absolute Value Writes are required so the Reconciliation Worker can identify Provisional Nodes
4. Incremented counters are forbidden by the Neo4j DDL's uniqueness constraints
</div>

??? question "Show Answer"
    The correct answer is **B**. Because at-least-once delivery means redelivery will eventually happen, an incremented counter would silently inflate on replay, while an absolute value write is a no-op when repeated, keeping the graph correct under redelivery or a full replay. A invents an unrelated storage-efficiency claim. C and D each attach Absolute Value Writes to an unrelated mechanism they play no role in.

    **Concept Tested:** Absolute Value Write

    **See:** [Turning Rollups Into Graph Writes](index.md#turning-rollups-into-graph-writes)

---
