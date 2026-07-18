---
title: Failure Modes and Verification
description: How this project catalogs its twelve failure modes, draws a line between the one that loses data and the eleven that merely degrade, and verifies that behavior through eight layers of testing.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 12:11:18
version: 0.09
---

# Failure Modes and Verification

## Summary

This chapter walks through all twelve named failure modes — from a downed Kafka broker to a poison message — and the behavior each one triggers, then covers the seven testing layers, from unit tests to nightly replay verification, that catch regressions before they reach production.

## Concepts Covered

This chapter covers the following 20 concepts from the learning graph:

1. Kafka Unavailable Failure
2. ClickHouse Unavailable Failure
3. Neo4j Unavailable Failure
4. Summarizer Stopped Failure
5. Summarizer Split Brain
6. Identity Service Unavailable
7. Redis Unavailable Failure
8. Experiment Service Error
9. Reconciliation Backlog Growth
10. Poison Message Handling
11. District Queue Flood
12. Clock Skew Handling
13. Unit Test Layer
14. Compression Test Suite
15. ADL Conformance Test Suite
16. Testcontainers Integration Test
17. Privacy Adversarial Suite
18. Load Test Loadgen
19. Replay Nightly Test
20. Chaos Kill Test

## Prerequisites

This chapter builds on concepts from:

- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md)
- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../17-compose-makefile-supply-chain/index.md)

---

!!! mascot-welcome "Twelve Ways to Fail, One Way to Lose Data"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 18 covered how this project changes itself safely. This chapter asks what matters once it is already running: when a piece breaks, what actually happens? We name every failure this project has planned for, and the tests that prove the plan holds. Let's follow the record.

Every distributed system fails eventually — a broker goes down, a disk fills, a network partition strands one datacenter from another. What separates a resilient system from a fragile one is not whether failures happen, but whether the designers can say, in advance, exactly what happens next. This project names twelve specific failure modes, and for each it commits to three things in writing: how the failure is **detected**, what **behavior** the system exhibits while it lasts, and what **response** an operator owes it.

## The One Rule That Organizes Every Failure Mode

Before working through the twelve failure modes individually, it helps to know the single idea that organizes all of them. Chapter 8 established that this project's Neo4j graph is never a system of record — it is a compressed, rebuildable projection of statements already durable in ClickHouse's event log. That choice has a direct operational consequence: almost every component downstream of ingestion can fail without losing anything permanently, because whatever it produces can be recomputed from the log once it recovers.

Only one failure mode breaks that guarantee. A **Kafka Unavailable Failure** occurs when the ingestion gateway cannot produce a message to Kafka at all — the queue meant to durably hold every incoming statement before anything downstream touches it is unreachable. The gateway buffers statements locally for a short window, and if the outage outlasts that buffer, returns an HTTP `503` with a `Retry-After` header so a well-behaved Learning Record Provider retries later rather than losing the statement silently. If a provider does not retry during this window, the statement is gone — it never reached durable storage, so nothing downstream can reconstruct it. This is why the design specification marks it the system's only true data-loss path, and why its response is **page**, not **ticket**: every other failure in this chapter degrades something that heals on its own.

The remaining eleven failure modes sit on the other side of that line. A statement already in Kafka is durable — losing ClickHouse, Neo4j, the summarizer, Redis, or the identity service afterward degrades a read path or stales a projection, but the record survives and every downstream artifact can be rebuilt from it. That distinction — before or after a statement reached Kafka — explains why the response column varies so sharply from row to row.

The list below sorts the twelve failure modes into those categories, as a quick reference before the walkthrough.

- **Loses data (page immediately):** Kafka Unavailable Failure — the only row in this chapter where a statement can vanish permanently.
- **Degrades a read path, recovers automatically:** ClickHouse Unavailable Failure, Neo4j Unavailable Failure, Summarizer Stopped Failure, Redis Unavailable Failure, Identity Service Unavailable.
- **Degrades nothing — correct by construction:** Summarizer Split Brain, Experiment Service Error.
- **Degrades data quality, not availability:** Reconciliation Backlog Growth, Poison Message Handling, District Queue Flood, Clock Skew Handling.

!!! mascot-thinking "Read the Response Column First"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Meeting a failure-mode table for the first time, your eye probably goes to "Behavior" — what breaks. Train it instead to jump to "Response." A system with twelve failure modes and only one "page" is telling you exactly where its designers spent their worry budget.

## Failures Inside the Compression Pipeline

Once a statement is durable in Kafka, it passes through the processor into ClickHouse, and from ClickHouse into Neo4j through the summarizer's rollups — the compression pipeline Chapter 8 described. Each stage can fail independently, and each failure has a distinct shape because each stage plays a different role.

A **ClickHouse Unavailable Failure** means the processor cannot write the batches it is consuming from Kafka. It stops committing offsets for those batches, so the messages remain in Kafka rather than being acknowledged and lost. Consumer lag grows while ClickHouse is down, but ingestion itself is unaffected — the gateway keeps producing to Kafka, which has no idea ClickHouse exists. When ClickHouse recovers, the processor resumes from where it left off and drains the lag. Nothing is lost; the response is a ticket, not a page.

A **Neo4j Unavailable Failure** sits one stage further downstream and degrades even less. Statements still land safely in ClickHouse regardless of Neo4j's reachability, because the summarizer reads from ClickHouse on a schedule rather than sitting in the statement's direct write path. Instead, the summarizer's watermark — the marker recording how far into the log it has summarized — simply stops advancing. The graph grows stale, but staleness is different from wrongness: nothing in it becomes incorrect. When Neo4j returns, the scheduled sync catches the watermark back up on its own, with no manual replay required.

A **Summarizer Stopped Failure** describes the summarizer process itself crashing or scaling to zero, rather than its target database being unreachable. The shape looks similar to a Neo4j outage from the outside — freshness lag climbs, ClickHouse reports are untouched — but the fix differs: restarting the process is sufficient, because Chapter 8's summary vertices are absolute values written by `SET`, not incrementing counters. There is no backlog of missed deltas to replay, because there was never a queue of deltas to begin with.

That detail — writing absolutes rather than accumulating deltas — is also what makes the next failure harmless instead of catastrophic. A **Summarizer Split Brain** occurs when two summarizer instances briefly believe they are each the sole leader and both write to the same summary vertices at once, typically during a rolling deploy. Had the summarizer used an increment operation, two simultaneous writers would double-count every value they touched. Because it instead computes an absolute value from the untouched log and writes it with `SET`, both writers converge on the identical number regardless of how many times either runs — the idempotency property Chapter 9 named. Two summarizers racing to write the same vertex wastes a compute cycle, not data integrity, and the response is: none.

The final failure inside this pipeline touches a different resource. A **Redis Unavailable Failure** takes away the cache that normally serves mastery reads quickly. When Redis is unreachable, reads fall back to querying ClickHouse directly — API latency for mastery-dependent dashboards rises, but no request fails and no data is lost. This is the mildest failure mode in the chapter: a ticket for a performance regression, not an outage.

Before the diagram below, hold the pipeline's shape in mind: Kafka is the only stage where a failure can lose a statement outright; ClickHouse, Neo4j, the summarizer, and Redis all sit downstream of that durable boundary, so every failure among them degrades freshness or latency and heals once the component returns.

#### Diagram: The Data-Loss Boundary Across the Compression Pipeline

<iframe src="../../sims/lrs-failure-mode-data-loss-boundary/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Data-Loss Boundary Across the Compression Pipeline</summary>
Type: workflow
**sim-id:** lrs-failure-mode-data-loss-boundary<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, trace

Learning objective: Given any one of six failure modes in the compression pipeline, classify it as occurring before or after the Kafka durability boundary and predict whether it can lose data.

Purpose: A Mermaid flowchart of the statement's path from a Learning Record Provider through the gateway, Kafka, the processor, ClickHouse, the summarizer, and Neo4j, with a vertical boundary line after Kafka separating "can lose data" from "cannot lose data."

Nodes in path order: "Learning Record Provider" -> "Ingestion Gateway" -> "Kafka (durability boundary)" -> "Processor" -> "ClickHouse (event log)" -> "Summarizer" -> "Neo4j (graph projection)". A separate node "Redis (mastery cache)" branches off ClickHouse/Neo4j reads.

Visual boundary: A dashed red vertical line crosses the diagram immediately after the Kafka node, labeled "Only failures left of this line can lose data."

Interactive features: Every node has a Mermaid click directive opening an infobox naming its associated failure mode (Gateway/Kafka: Kafka Unavailable Failure; Processor/ClickHouse: ClickHouse Unavailable Failure; Summarizer: Summarizer Stopped Failure and Summarizer Split Brain; Neo4j: Neo4j Unavailable Failure; Redis: Redis Unavailable Failure) with that failure's detection, behavior, and response. Clicking the boundary line opens an infobox on the "only the first row loses data" rule.

Color coding: Nodes left of the boundary shaded warning amber; nodes right of the boundary shaded the book's calm teal to signal "recoverable."

Responsive design: The flowchart reflows to a single column on narrow viewports, preserving the boundary line's position and all click handlers.
</details>

## Failures at the System's Edges

Two more failure modes sit outside the core compression pipeline, at services the gateway and the analytics API call out to rather than components in the statement's own path.

An **Identity Service Unavailable** failure means the service supplying the per-district cryptographic salts Chapter 6 described — used to pseudonymize a `student_key` — cannot be reached when a new salt is needed. Because salts are fetched once and cached, the impact is small: cached salts keep serving at roughly a 99.99% hit rate, so most ingestion traffic never notices. Only districts whose salt has not yet been cached — typically one just onboarding — pause until the service returns. The response escalates from ticket to page only if the outage passes five minutes.

An **Experiment Service Error** occurs when the assignment logic Chapter 31 covers in depth — deciding which arm of an A/B experiment a learner falls into — fails to compute an assignment. This mirrors the summarizer's idempotent-writes decision: rather than letting the failure block the underlying learning event, the system falls back to serving the control arm and still records the event that triggered the attempt. A student never sees a broken page because an experiment hiccuped; the statement recording what they actually did is unaffected.

!!! mascot-tip "Page Versus Ticket Is an Escalation Contract, Not a Severity Guess"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    "Page" appears exactly twice across these twelve failure modes — Kafka Unavailable Failure outright, and an Identity Service Unavailable outage past five minutes. Everywhere else the response is a ticket, worked during business hours. If you are ever on call for a system like this one, that split tells you which alerts deserve to wake you up.

## Failures That Are Data-Quality Problems, Not Outages

The last four failure modes differ in kind from everything covered so far: none make a component unreachable. Instead, each describes a way the *data itself* can arrive imperfect, and the system's commitment to handling that gracefully rather than rejecting or losing it.

**Reconciliation Backlog Growth** describes the reconciler — the background worker Chapter 6 introduced that resolves provisional actor and activity nodes into final, roster-matched identities — falling behind the rate at which new provisional nodes are created. Chapter 6's accept-first onboarding means a new textbook's statements are ingested immediately using provisional identifiers, with reconciliation happening asynchronously. If the backlog grows, provisional nodes accumulate longer before resolving, but every statement remains queryable by its own IRI throughout. The response is a ticket to scale the reconciler, not an emergency.

**Poison Message Handling** covers a message the processor cannot successfully consume no matter how many times it retries — a malformed xAPI statement failing schema validation, say. Left unhandled, such a message would crash the processor in an endless loop, since a naive consumer re-reads the same unprocessable message after every restart. This project bounds that risk with a fixed retry limit: after three failed attempts, the message is routed to a **dead-letter queue (DLQ)** — a separate holding topic for messages that could not be processed — and the consumer moves on. Nothing about the rest of the stream is affected; an operator can inspect the DLQ later through the diagnostics surface Chapter 18 introduced.

**District Queue Flood** addresses too many well-formed messages from a single source. If one district's Learning Record Providers produce statements far faster than expected — a client-integration bug causing a retry storm, say — Kafka's per-tenant quota mechanism, the noisy-neighbor protection ADR-004 established, throttles only that district's producer. Every other district's statements keep flowing untouched.

**Clock Skew Handling** describes a statement arriving with a timestamp that does not match the LRS's own clock, usually from a client device with a wrong system clock. Because ingestion is schema-on-read rather than schema-on-write, a skewed timestamp is not rejected — it is accepted and flagged for review. Because every downstream projection is event-time-driven, a skewed clock distorts only that one district's own time-series reports.

#### Diagram: Poison Message Retry and Dead-Letter Queue Workflow

<iframe src="../../sims/poison-message-dlq-retry-workflow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Poison Message Retry and Dead-Letter Queue Workflow</summary>
Type: workflow
**sim-id:** poison-message-dlq-retry-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, apply

Learning objective: Trace a single malformed statement through three consumption attempts and its landing in the dead-letter queue, and explain why the consumer keeps processing other messages throughout.

Purpose: A Mermaid flowchart showing one message moving through the processor's retry logic, with a loop-back arrow for retries and a terminal branch to the dead-letter queue.

Nodes: "Message consumed" -> "Processing attempt" -> decision "Succeeded?" -> (yes) "Offset committed, consumer continues"; (no) -> "Attempt count += 1" -> decision "Attempts = 3?" -> (no, loop back to) "Processing attempt"; (yes) -> "Routed to Dead-Letter Queue (DLQ)" -> "Offset committed, consumer continues".

A parallel track shown alongside: "Next message in partition" -> "Processing attempt" -> "Offset committed" — showing the poison message's retries do not block the rest of the stream.

Interactive features: Every node has a Mermaid click directive opening an infobox. "Attempt count += 1" explains the three-attempt limit. "Routed to Dead-Letter Queue (DLQ)" defines a DLQ and links its inspection to Chapter 18's diagnostics UI. The parallel track explains that per-partition processing is sequential, but the DLQ hand-off keeps one bad message from blocking it indefinitely.

Color coding: Retry loop amber ("in progress"); DLQ terminal node muted red ("quarantined, not lost"); successful-commit nodes teal.

Responsive design: The flowchart stacks the retry track above the parallel track on narrow viewports, preserving click handlers and loop direction.
</details>

The table below draws together all twelve failure modes now that each has been explained individually.

| Failure Mode | Detection | Behavior | Response |
|---|---|---|---|
| Kafka Unavailable Failure | Gateway produce errors | Gateway buffers briefly, then returns `503` + `Retry-After` | **Page** — the only data-loss path |
| ClickHouse Unavailable Failure | Processor write errors | Processor stops committing offsets; lag grows; ingestion unaffected | Ticket — lag drains on recovery |
| Neo4j Unavailable Failure | Summarizer/API errors | Graph goes stale; ClickHouse reports unaffected | Ticket — sync catches up automatically |
| Summarizer Stopped Failure | Graph freshness lag climbs | Graph stale; no backlog because rollups are absolutes, not deltas | Page at 5 min lag; restart is sufficient |
| Summarizer Split Brain | Two leaders detected | Both write identical values (idempotent `SET`) | None — correct by construction |
| Identity Service Unavailable | Salt fetch errors | Cached salts keep serving (~99.99% hit); new districts pause | Page if outage exceeds 5 minutes |
| Redis Unavailable Failure | Cache errors | Mastery reads fall back to ClickHouse; latency rises, nothing fails | Ticket |
| Experiment Service Error | Assignment errors | Control arm served; the underlying event is still recorded | Ticket |
| Reconciliation Backlog Growth | Backlog metric rises | Provisional nodes accumulate; still queryable by IRI | Ticket — scale the reconciler |
| Poison Message Handling | Consumer crash loop | After 3 attempts, routed to the dead-letter queue; consumer continues | Ticket — inspect via credentials UI |
| District Queue Flood | Per-tenant quota metrics | Kafka quota throttles only that district's producer | Ticket — working as designed |
| Clock Skew Handling | Future/skewed timestamps | Accepted, flagged; distorts one district's own reports only | Ticket |

!!! mascot-warning "A Ticket Is Still a Commitment"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Eleven of twelve rows above end in "ticket," which is tempting to read as "ignore." Read it instead as "real, documented, and owed a fix — just not at 3 a.m." A Reconciliation Backlog left to grow indefinitely eventually becomes an incident. The response column sets urgency, not importance.

## Verifying the Plan Is True

A failure-mode table is only a claim until something proves it. This project backs its twelve rows with a layered testing strategy, each layer exercising a different slice of the system at a different frequency — from an assertion that finishes in milliseconds to a scheduled exercise that takes down a real service in staging.

The narrowest layer runs most often. The **Unit Test Layer** checks individual pieces of logic in isolation, with no database, network call, or container involved: the Bayesian Knowledge Tracing math from Chapter 12 against published reference cases, the privacy filter from Chapter 15 against known complementary-disclosure attacks, the hash bucketer that assigns experiment arms checked for stickiness across an allocation ramp. Needing no external services, unit tests run on every commit in seconds.

One layer up, the **Compression Test Suite** verifies the guarantees Chapter 8's compression pipeline depends on — constraints the design specification labels C-1 through C-6. It asserts no `:Statement` label exists after a full ingestion run, the constraint the compressed model rests on; it runs the summarizer twice over identical rollups and asserts the graph is byte-for-byte identical, proving the idempotency Summarizer Split Brain depends on; it injects a 48-hour-late statement and asserts only its grain changes; and it asserts `statements_compressed`, summed across every summary vertex, equals the raw row count in ClickHouse.

Because this project implements the Experience API, its correctness cannot be graded only by its own tests. The **ADL Conformance Test Suite** is the externally maintained suite published by the Advanced Distributed Learning Initiative — the organization from Chapter 1's history that created SCORM and later sponsored the "Project Tin Can" research behind xAPI — and it runs in continuous integration against every candidate release. An outside authority defines what "correct" means here, not this codebase.

Unit tests and the compression suite both run against isolated, in-memory logic. The **Testcontainers Integration Test** layer goes further, spinning up real Kafka, ClickHouse, and Neo4j instances — the same image tags Chapter 17's Compose stack uses — inside disposable containers for the run's duration, including the clustered configuration Compose does not exercise.

!!! mascot-encourage "Eight Layers Is a Lot of Vocabulary at Once"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If Unit, Compression, ADL Conformance, Testcontainers, Privacy Adversarial, Loadgen, Replay, and Chaos are starting to blur together, that is reasonable — eight names is a lot at once. Notice the pattern instead: each layer answers "does the system behave correctly" at a wider scope and slower cadence than the one before it. You do not need all eight memorized; just that scope keeps widening down the list.

Because this project handles data about students, correctness is not only computing the right number — it is also never revealing a number that should stay hidden. The **Privacy Adversarial Suite** actively attempts re-identification through every report, including differencing attacks: comparing two successive states of the same filtered report to see whether subtracting one from the other leaks a value threshold suppression was supposed to hide, the same class of attack Chapter 15's complementary-suppression fix was built to close.

Correctness and privacy both assume the system can keep up with real traffic. The **Load Test Loadgen** tool — `lrs loadgen --rate 10000` — drives synthetic statement traffic against a production-shaped environment to verify the latency and availability targets from Chapter 11's capacity model, including whether the system absorbs a sudden 50,000-statement burst without falling over.

The **Replay Nightly Test** runs every night against the live system: it rebuilds a projection from scratch, entirely from the ClickHouse event log, into a shadow table, and asserts the result matches the real, currently-serving projection exactly. This is the test the design specification calls out by name as proving immutability is real rather than a slogan.

The widest and least frequent layer is the **Chaos Kill Test**: a scheduled exercise, run in staging, that deliberately kills a broker, a ClickHouse node, or a Neo4j instance mid-operation and asserts the failure-mode table's claimed behavior actually happens. A failure-mode table is a promise; a chaos test is the only layer that keeps it honest by actually breaking something and watching what happens.

#### Diagram: Testing Layers by Scope and Run Frequency

<iframe src="../../sims/testing-layers-scope-frequency-chart/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Testing Layers by Scope and Run Frequency</summary>
Type: chart
**sim-id:** testing-layers-scope-frequency-chart<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, justify

Learning objective: Compare the eight testing layers by how much of the system each exercises and how often each runs, and justify why the widest-scope layer is also the least frequent.

Chart type: Scatter/quadrant chart. X-axis: "Scope," from "Single function" to "Whole live system." Y-axis: "Run frequency," from "Scheduled/quarterly" to "Every commit," on a reversed log-like scale.

Data points: Unit Test Layer (narrow scope, every commit), Compression Test Suite (narrow-medium, every commit), ADL Conformance Test Suite (medium, every CI run), Testcontainers Integration Test (medium-wide, every CI run), Privacy Adversarial Suite (medium, every CI run), Load Test Loadgen (wide, pre-release), Replay Nightly Test (wide, nightly), Chaos Kill Test (widest, scheduled/staging-only).

Interactive features: Hovering a point shows a tooltip with the layer's name and what it checks. Clicking opens an infobox with the full prose description. A toggle switches the y-axis to "blast radius if this layer alone were skipped," re-plotting the same points.

Color scheme: Gradient from teal (narrow, frequent) to amber (wide, infrequent).

Annotation: A dashed diagonal trend line labeled "Wider scope, slower cadence."

Responsive design: Chart resizes to container width; axis labels abbreviate on narrow viewports while tooltips retain full text.
</details>

The table below reinforces the eight layers just described, ordered from narrowest to widest scope.

| Layer | What It Checks | Typical Cadence |
|---|---|---|
| Unit Test Layer | Isolated logic — BKT math, privacy filter, hash bucketer | Every commit |
| Compression Test Suite | C-1 through C-6 guarantees of the compression pipeline | Every commit |
| ADL Conformance Test Suite | xAPI standard conformance, externally defined | Every CI run |
| Testcontainers Integration Test | Real Kafka/ClickHouse/Neo4j, including clustered configuration | Every CI run |
| Privacy Adversarial Suite | Re-identification and differencing attacks against reports | Every CI run |
| Load Test Loadgen | Latency, availability, and burst-absorption targets under real volume | Pre-release |
| Replay Nightly Test | Rebuilt projection matches the live one exactly | Nightly |
| Chaos Kill Test | Failure-mode table's claimed behavior, verified by actually breaking something | Scheduled, staging |

#### Diagram: Chaos Kill Test Simulator

<iframe src="../../sims/chaos-kill-test-simulator/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Chaos Kill Test Simulator</summary>
Type: microsim
**sim-id:** chaos-kill-test-simulator<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: predict, verify

Learning objective: Given a choice of which service to kill in a simulated staging environment, predict the resulting system behavior before revealing it, reinforcing this chapter's failure-mode-to-behavior mapping.

Canvas layout: A simplified system diagram across the top (Gateway, Kafka, Processor, ClickHouse, Summarizer, Neo4j, Redis, Identity Service as clickable icons) and a control/readout panel below.

Visual elements: Each icon shows a green "healthy" indicator by default. A row of status lights tracks "Ingestion," "Graph Freshness," and "Dashboard Latency" as green/amber/red, updating live as the simulated failure plays out.

Interactive controls: A dropdown listing the eight services; a "Predict" step where the learner picks "No data loss" / "Some data loss" / "System fully down" before revealing the result; "Kill Service," "Restore Service," and "Reset" buttons.

Default parameters: All services healthy; none pre-selected; prediction required before the kill button activates.

Behavior: On "Kill Service," the icon turns red and the status lights animate to that failure's actual behavior from this chapter's table (killing Kafka turns "Ingestion" red immediately; killing Neo4j turns "Graph Freshness" amber and climbing; killing Redis turns only "Dashboard Latency" amber). An infobox then reveals the failure's detection, behavior, and response, comparing it against the learner's prediction. "Restore Service" recovers the icon and lights at the pace described for that failure (immediate for Redis, gradual for Neo4j and the summarizer).

Implementation notes: p5.js with a simple per-service state machine (healthy/failing/recovering) driven by a lookup table keyed to the twelve failure modes. Responsive design: diagram and panel stack vertically on narrow viewports; click targets stay at least 44 pixels for touch use.
</details>

## Bringing the Two Halves Together

The failure-mode table and the testing-layer table are two views of the same commitment. The table says, in advance, exactly what should happen when something breaks — a downed Kafka broker pages someone because data can be lost, a downed Neo4j instance merely files a ticket because the graph heals itself. The testing layers keep that table from becoming a document nobody trusts: the Compression Test Suite proves the idempotency claim that makes Summarizer Split Brain harmless, the Replay Nightly Test proves "rebuildable from the log" is true every night rather than assumed, and the Chaos Kill Test is the one layer willing to actually kill a service in staging and check the promised behavior is what happens.

That relationship generalizes past this project's twelve rows and eight layers: any claim about how a system behaves under failure is only as trustworthy as the narrowest test that has ever exercised it. A failure mode with no corresponding test is a hope; one backed by a scheduled chaos test is closer to a fact.

## Key Takeaways

- **Kafka Unavailable Failure** is this project's only data-loss path — everything downstream of Kafka can be rebuilt from the log, which is why it is the sole failure mode that pages immediately.
- **ClickHouse Unavailable Failure**, **Neo4j Unavailable Failure**, **Summarizer Stopped Failure**, and **Redis Unavailable Failure** all degrade a read path or stale a projection without losing any statement, and each recovers automatically once the failed component returns.
- **Summarizer Split Brain** is harmless by construction because rollups are written as idempotent absolutes (`SET`), not accumulating deltas.
- **Identity Service Unavailable** and **Experiment Service Error** both degrade gracefully at the system's edges — cached salts keep serving, and a failed experiment assignment falls back to the control arm while still recording the underlying event.
- **Reconciliation Backlog Growth**, **Poison Message Handling**, **District Queue Flood**, and **Clock Skew Handling** are data-quality failures rather than outages: provisional nodes stay queryable, poison messages are quarantined in a dead-letter queue after three attempts, a flooding district is throttled by its own quota, and skewed timestamps are accepted and flagged rather than rejected.
- The **Unit Test Layer** and **Compression Test Suite** run on every commit and check the narrowest, cheapest-to-verify claims, including the C-1 through C-6 guarantees the compression pipeline depends on.
- The **ADL Conformance Test Suite** and **Testcontainers Integration Test** verify standards conformance and real multi-service behavior in continuous integration, while the **Privacy Adversarial Suite** actively attempts re-identification against every report.
- The **Load Test Loadgen**, **Replay Nightly Test**, and **Chaos Kill Test** are the widest and least frequent layers, proving the system survives real volume, that immutability holds every night, and that the failure-mode table's promises are true under an actual, deliberately triggered failure.

!!! mascot-celebration "You Can Now Read a Failure-Mode Table Like an Engineer"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now classify any of the twelve failure modes as data-loss or degradation, explain why eleven of them only file a ticket, and name which testing layer would catch a regression in each. What does the evidence show? A system that names its failures this precisely, and tests them this deliberately, is one whose remaining open questions are worth taking seriously too. In [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../20-deviations-roadmap-open-questions/index.md), we look at what this project's own design specification admits it has not yet resolved.
