---
title: "Quiz: System Context and the Five Architectural Planes"
description: Review questions on the System Context Diagram and the five architectural planes — Ingestion, Processing, Storage, Analytics, and Presentation — and their core components.
social:
   cards: false
---
# Quiz: System Context and the Five Architectural Planes

Test your understanding of this project's system context diagram and the five architectural planes with these review questions.

---

#### 1. What is a System Context Diagram?

<div class="upper-alpha" markdown>
1. The highest-level architectural view showing the system as a single box, its external actors, and the major flows crossing the boundary, without internal detail
2. A detailed sequence diagram of every internal API call within the Processing Plane
3. A database schema diagram showing every table in the Event Store
4. A dashboard mockup showing what an instructor sees when they log in
</div>

??? question "Show Answer"
    The correct answer is **A**. A System Context Diagram draws the whole system as one box, names the external actors and systems that interact with it, and labels the major flows crossing the boundary — deliberately without internal detail. B, C, and D each describe a much more detailed, internal artifact — an API sequence diagram, a schema, or a UI mockup — none of which is what a system context diagram shows.

    **Concept Tested:** System Context Diagram

    **See:** [What a System Context Diagram Shows](index.md#what-a-system-context-diagram-shows)

---

#### 2. Why does the Ingestion Gateway durably queue a statement and respond immediately, rather than waiting for it to be enriched or permanently stored?

<div class="upper-alpha" markdown>
1. Because enrichment and storage are legally required to happen outside the Ingestion Plane
2. Because the xAPI specification forbids an endpoint from performing any validation before responding
3. Because the Durable Event Queue automatically enriches statements before the Stream Processor sees them
4. Because the Ingestion Gateway's only hard dependency is the Durable Event Queue, so a classroom's statements are accepted even if every other component is temporarily unavailable
</div>

??? question "Show Answer"
    The correct answer is **D**. The Ingestion Gateway performs only structural validation and hands off to the Durable Event Queue, its one hard dependency — this is the concrete mechanism behind non-blocking ingestion. A invents a legal requirement not discussed in the chapter. B is false; the gateway does perform structural validation before responding. C misattributes enrichment, which is Processing Plane work performed by the Stream Processor, not the queue itself.

    **Concept Tested:** Ingestion Gateway

    **See:** [The Ingestion Plane: Where a Statement First Lands](index.md#the-ingestion-plane-where-a-statement-first-lands)

---

#### 3. What is the key difference between the Durable Event Queue and the Event Store?

<div class="upper-alpha" markdown>
1. They are two names for the same component, used interchangeably across the specification
2. The Durable Event Queue holds compressed summaries, while the Event Store holds raw, unenriched statements
3. The Durable Event Queue is a temporary holding area in the Ingestion Plane; the Event Store is the permanent, queryable home for every statement in the Storage Plane
4. The Event Store is temporary and gets cleared nightly, while the Durable Event Queue is the permanent archive
</div>

??? question "Show Answer"
    The correct answer is **C**. The Durable Event Queue is a temporary Ingestion Plane holding area that statements pass through on the way to being processed; the Event Store, built by the Processing Plane and living in the Storage Plane, is the permanent, queryable home a report actually reads from. A wrongly conflates two distinct components. B reverses which component holds summaries versus raw statements. D reverses which one is temporary and which is permanent.

    **Concept Tested:** Durable Event Queue / Event Store

    **See:** [The Storage Plane: Where Statements Come to Rest](index.md#the-storage-plane-where-statements-come-to-rest)

---

#### 4. In what order does an xAPI statement travel through the five architectural planes?

<div class="upper-alpha" markdown>
1. Presentation, Analytics, Storage, Processing, Ingestion
2. Ingestion, Processing, Storage, Analytics, Presentation
3. Storage, Ingestion, Processing, Presentation, Analytics
4. Processing, Ingestion, Analytics, Storage, Presentation
</div>

??? question "Show Answer"
    The correct answer is **B**. A statement is accepted by the Ingestion Plane, enriched by the Processing Plane, stored at rest by the Storage Plane, queried by the Analytics Plane, and finally rendered by the Presentation Plane — the same order the chapter reads the planes in. A, C, and D each scramble this pipeline order in a way that would have a plane depending on data that has not been produced yet.

    **Concept Tested:** Architectural Planes (pipeline order)

    **See:** [The Five Architectural Planes](index.md#the-five-architectural-planes)

---

#### 5. Why does it matter that the Stream Processor consumes statements from the Durable Event Queue in order?

<div class="upper-alpha" markdown>
1. It lets the Stream Processor build correct running conclusions about a learner without waiting for every future statement about them
2. It is required so the Ingestion Gateway can validate the JSON structure correctly
3. It allows the Presentation Plane to skip rendering statements that arrive out of sequence
4. It prevents the Roster API from syncing enrollment data more than once per day
</div>

??? question "Show Answer"
    The correct answer is **A**. Because a learner's statements are queued in sequence, the Stream Processor can build correct running conclusions incrementally, one statement at a time, rather than needing the entire future history before acting. B misattributes ordering to the Ingestion Gateway's validation step, which happens earlier and separately. C and D describe unrelated behaviors of other planes that ordering does not govern.

    **Concept Tested:** Stream Processor

    **See:** [The Processing Plane: Turning Raw Statements into Structure](index.md#the-processing-plane-turning-raw-statements-into-structure)

---

#### 6. A report needs to look up the complete, unmodified history of statements a specific student generated last semester. Which component should it read from?

<div class="upper-alpha" markdown>
1. The Durable Event Queue, because it preserves the original order statements arrived in
2. The Ingestion Gateway, because it performs the initial structural validation
3. The Admin API, because it has access to every administrative record
4. The Event Store, because it is the durable, queryable, immutable log of every statement at full fidelity
</div>

??? question "Show Answer"
    The correct answer is **D**. The Event Store is the system's ultimate source of truth for historical statement data — a durable, queryable, immutable log kept at full fidelity. A is wrong because the queue is a temporary holding area, not a place to query history from. B is wrong because the gateway only validates and forwards statements; it stores nothing. C is wrong because the Admin API serves administrative configuration, not statement history.

    **Concept Tested:** Event Store

    **See:** [The Storage Plane: Where Statements Come to Rest](index.md#the-storage-plane-where-statements-come-to-rest)

---

#### 7. A district administrator wants to pull all of the district's raw statement data out of the Learning Record Store for an external, offline analysis project. Which Analytics Plane API is built for this?

<div class="upper-alpha" markdown>
1. The Experiment API
2. The Roster API
3. The Export API
4. The Admin API
</div>

??? question "Show Answer"
    The correct answer is **C**. The Export API produces bulk, asynchronous exports of statements or reports for archival or external analysis, letting a district pull its own data out rather than being locked in. A handles A/B-test assignment and readout, an unrelated function. B is inbound and carries enrollment data, not statement exports. D serves administrative configuration UIs, not bulk data export.

    **Concept Tested:** Export API

    **See:** [The Analytics Plane: Five APIs, One Job Each](index.md#the-analytics-plane-five-apis-one-job-each)

---

#### 8. A district just finished updating its student information system with new section enrollments for the new term. Which API carries that change into the Learning Record Store, and in which direction does data flow through it?

<div class="upper-alpha" markdown>
1. The Roster API, flowing inbound from the district's student information system into the Learning Record Store
2. The Analytics API, flowing outbound to instructor dashboards
3. The Admin API, flowing outbound to administrative user interfaces
4. The Export API, flowing outbound to external analysts
</div>

??? question "Show Answer"
    The correct answer is **A**. The Roster API is the one Analytics Plane API that works in the inbound direction, feeding enrollment data from a district's student information system into the Learning Record Store so it always knows the current roster context. B, C, and D each name a real Analytics Plane API, but all four are outbound, reading what the system already knows rather than supplying new organizational facts.

    **Concept Tested:** Roster API

    **See:** [The Analytics Plane: Five APIs, One Job Each](index.md#the-analytics-plane-five-apis-one-job-each)

---

#### 9. Suppose a system architect proposes making the Ingestion Gateway wait for the Stream Processor to finish enrichment before responding to an intelligent textbook. What design principle would this violate, and why?

<div class="upper-alpha" markdown>
1. Statement Immutability, because enrichment would edit the original statement's fields
2. Non-blocking ingestion, because it would add a second hard dependency to the gateway, meaning a temporarily unavailable Processing Plane could block statement acceptance entirely
3. Data Verifiability, because the `stored` timestamp would no longer be set by the Learning Record Store
4. Vendor Interoperability, because other Learning Record Stores would no longer be xAPI-conformant
</div>

??? question "Show Answer"
    The correct answer is **B**. The Ingestion Gateway's single hard dependency on the Durable Event Queue is exactly what makes non-blocking ingestion possible; adding a wait on the Processing Plane would mean a struggling Stream Processor could stop statements from being accepted at all. A misapplies Statement Immutability, which concerns editing stored statements, not response timing. C and D each name a real property from earlier chapters that this specific design change does not directly threaten.

    **Concept Tested:** Ingestion Gateway (non-blocking ingestion)

    **See:** [The Ingestion Plane: Where a Statement First Lands](index.md#the-ingestion-plane-where-a-statement-first-lands)

---

#### 10. Why does the Presentation Plane sit last in the pipeline and depend on every plane before it, rather than computing or storing anything on its own?

<div class="upper-alpha" markdown>
1. Because it is the only plane that performs structural validation on incoming statements
2. Because it is responsible for pseudonymizing actor identities before they reach the Analytics API
3. Because its entire job is turning an already-computed API response into something a human can read, so it has nothing to render until every upstream plane has done its work
4. Because the Durable Event Queue routes statements directly to the Presentation Plane before processing
</div>

??? question "Show Answer"
    The correct answer is **C**. The Presentation Plane neither stores nor computes anything itself — it renders whatever the Analytics and Admin APIs already produced, which necessarily means every upstream plane must have already done its work. A misattributes structural validation to the Ingestion Gateway, not Presentation. B misattributes pseudonymization to the Processing Plane. D describes a pipeline shortcut that does not exist in this architecture.

    **Concept Tested:** Presentation Plane

    **See:** [The Presentation Plane: Where Evidence Becomes a Picture](index.md#the-presentation-plane-where-evidence-becomes-a-picture)

---
