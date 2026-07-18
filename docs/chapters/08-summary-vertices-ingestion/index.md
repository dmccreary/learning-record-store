---
title: Summary Vertices and Statement Ingestion Mechanics
description: How this project's Learning Record Store validates, queues, and non-blockingly onboards xAPI statements, and how its compression pipeline turns millions of them into the six summary-vertex grains the graph actually stores.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 08:02:53
version: 0.09
---

# Summary Vertices and Statement Ingestion Mechanics

## Summary

This chapter explains the six summary-vertex grains that compress millions of statements into a small, queryable graph, and then walks through how a statement actually arrives: structural and semantic validation, schema-on-read, and the accept-first mechanism that lets a brand-new textbook start emitting data without a registration step.

## Concepts Covered

This chapter covers the following 23 concepts from the learning graph:

1. Summary Vertex
2. Analytical Grain
3. Concept Mastery Vertex
4. Page Engagement Vertex
5. MicroSim Engagement Vertex
6. Question Response Vertex
7. Learning Session Vertex
8. Section Rollup Vertex
9. Statements Compressed
10. xAPI Statement Resource
11. Structural Validation
12. Semantic Validation
13. Schema On Read
14. Non-Blocking Ingestion
15. Accept-First Ingestion
16. Provisional Node
17. Reconciliation Worker
18. Idempotent Delivery
19. At-Least-Once Delivery
20. Backpressure
21. Statement Compression Ratio
22. Change-Driven Materialization
23. Absolute Value Write

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)
- [Chapter 2: The Anatomy of an xAPI Statement](../02-anatomy-of-xapi-statement/index.md)
- [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../04-standards-governance-ecosystem/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)

---

!!! mascot-welcome "Opening the Compression Pipeline"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 7 left you holding two edges — `HAS_MASTERY` and `TOUCHED` — pointing at vertices you were told to trust without ever seeing how they were built. This chapter builds them, end to end: from the moment a single xAPI statement leaves a textbook page to the moment its evidence lands, compressed, on a `ConceptMastery` vertex. Let's follow the record.

Every chapter so far has treated an xAPI statement as something that simply "arrives" at this project's Learning Record Store. Chapter 1 defined what a Statement contains — Actor, Verb, Object, Result, Context. Chapter 5 named the components a statement passes through — the Ingestion Gateway, the Durable Event Queue, the Stream Processor, the Event Store. Chapter 7 showed where the compressed evidence about a student ends up in the graph. None of those chapters closed the distance between "a statement was sent" and "a graph vertex changed." That distance — millions of statements, arriving continuously from thousands of concurrent intelligent textbooks, becoming a small, stable set of vertices a teacher's dashboard can query in milliseconds — is this chapter's whole subject.

This project's specification states the governing requirement bluntly: the graph database must not store one vertex per xAPI statement. Everything below follows from that one sentence — first the shape it leaves in the graph, then the mechanics that get a statement there safely, and finally the pipeline that does the actual compressing.

## What a Summary Vertex Actually Compresses

A **Summary Vertex** is a single graph node that stands in for every statement relevant to one specific combination of dimensions — one student's evidence for one concept, one student's engagement with one page, one section's mastery distribution for one concept. This project's specification calls that combination of dimensions the vertex's **Analytical Grain**: the key a summary is computed at, such as (student, concept) or (section, concept). A grain is not a rounding choice — it is the exact unit the graph is willing to answer questions about. Ask the graph "what is this student's mastery of Photosynthesis?" and it can answer directly, because (student, concept) is a grain the pipeline materializes. Ask it "what did this student type into the third practice box on page 12 at 2:47 p.m.?" and it cannot — that level of detail was never a grain, and it lives only in the Event Store Chapter 5 introduced, one query away but never duplicated into the graph.

!!! mascot-thinking "One vertex, many statements, forever"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Hold onto one detail before you meet the six grains below: a grain's vertex count is set by how many *distinct* (student, concept) or (student, page) pairs have ever existed — never by how many statements were sent about them. A student's five-hundredth visit to a page updates the same `PageEngagement` vertex the first visit created; it does not create a 500th one. That is why the graph can stop growing in vertex count even while statement ingestion never stops.

## The Six Grains This Deployment Materializes

This project's specification defines exactly six summary-vertex labels, and Chapter 7 already introduced two of them by name — `ConceptMastery` and `LearningSession` — without describing their properties. This section completes the picture, moving from the simplest grain to the broadest.

The **Question Response Vertex**, written `QuestionResponse` in the graph, compresses every attempt a student has made at one quiz question, at the (student, question) grain. Its properties are `attempts`, `successes`, `mean_score`, `first_success_attempt`, and `last_seen`.

The **Page Engagement Vertex**, `PageEngagement`, compresses a student's reading behavior on one page — views, scroll events, dwell-time pings — at the (student, page) grain, carrying `dwell_ms_total`, `revisit_count`, `scroll_depth_max`, `first_seen`, and `last_seen`.

The **MicroSim Engagement Vertex**, `MicroSimEngagement`, does the same job for one interactive simulation at the (student, microsim) grain: `interaction_count`, `dwell_ms_total`, a `completed` flag, and `last_seen`.

The **Concept Mastery Vertex**, `ConceptMastery`, is the broadest single-student grain: it compresses every piece of evidence one student has produced about one concept — quiz attempts, MicroSim interactions, page engagement that touches the concept — at the (student, concept) grain, carrying `mastery_score`, `evidence_count`, `attempts`, `successes`, `first_seen`, and `last_seen`.

The **Learning Session Vertex**, `LearningSession`, changes shape entirely. Rather than compressing evidence about one piece of content, it compresses one contiguous burst of a student's activity at the (student, session) grain: `started_at`, `ended_at`, `duration_ms`, `event_count`, and `objects_touched`.

The **Section Rollup Vertex**, `SectionRollup`, sits one level above every other grain in this list: it aggregates across an entire class of students rather than within one student's evidence, at the (section, concept) grain, carrying `mastery_distribution`, `mean_score`, `student_count`, and `last_computed`.

Before organizing all six together, one property deserves its own introduction, because it is what makes every number above trustworthy rather than merely plausible. Four of the six grains — `ConceptMastery`, `PageEngagement`, `MicroSimEngagement`, and `QuestionResponse` — carry a property named literally **Statements Compressed** (`statements_compressed` in the graph): the exact count of statements folded into that one vertex. The other two grains carry an equivalent count under a name that fits their shape instead: `LearningSession` already has `event_count`, and `SectionRollup` aggregates already-compressed `ConceptMastery` evidence across a class through `student_count`, so counting raw statements a second time would be redundant. Every summary vertex, in other words, carries some explicit evidence count — the property name just changes to fit the grain — and that count is what lets a report say not just *what* a student's mastery score is, but *how much evidence it rests on*.

The table below organizes all six grains now that each one has been explained in the prose above.

| Vertex Label | Analytical Grain | Evidence-Count Property | What It Compresses |
|---|---|---|---|
| `QuestionResponse` | (student, question) | `statements_compressed` | Every attempt at one quiz question |
| `PageEngagement` | (student, page) | `statements_compressed` | Views, scrolls, and dwell time on one page |
| `MicroSimEngagement` | (student, microsim) | `statements_compressed` | Interactions with one simulation |
| `ConceptMastery` | (student, concept) | `statements_compressed` | Every piece of mastery evidence for one concept |
| `LearningSession` | (student, session) | `event_count` | One contiguous burst of activity |
| `SectionRollup` | (section, concept) | `student_count` | A class's mastery distribution for one concept |

## How Much Compression Buys You

This project's specification requires that the **Statement Compression Ratio** — statements divided by summary vertices — be observable per district and per grain. That ratio is not a single number; it depends entirely on the grain, because some grains see far more redundant evidence per pair than others.

Across the grains, the ratios differ by more than three orders of magnitude. A `QuestionResponse` vertex compresses only about 1 to 5 attempts, because most students only attempt a given question a handful of times — roughly a 3:1 ratio. A `PageEngagement` vertex compresses roughly 20 to 60 views, scrolls, and dwell-time pings — about 40:1. A `MicroSimEngagement` vertex, because a simulation invites more back-and-forth interaction than a static page, compresses roughly 30 to 100 interactions — about 60:1. A `ConceptMastery` vertex, drawing evidence from every quiz, MicroSim, and page that touches a concept, compresses roughly 50 to 200 evidence events — about 100:1. And a `SectionRollup` vertex, because it aggregates thirty students' worth of `ConceptMastery` evidence into one class-level figure, reaches roughly 3,000:1. This ratio is unbounded over time — it keeps climbing as long as a pair keeps generating evidence, because the vertex count is fixed at one per grain while the statement count behind it keeps growing, exactly the property the thinking callout above named.

The bar chart below makes these five ratios directly comparable at a glance, with the exact evidence range behind each one available on hover.

#### Diagram: Storage Compression Ratio by Summary-Vertex Grain

<iframe src="../../sims/compression-ratio-by-grain/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Storage Compression Ratio by Summary-Vertex Grain</summary>
Type: chart
**sim-id:** compression-ratio-by-grain<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, evaluate

Learning objective: Let the learner compare the storage compression ratio across the five grains that compress within-student evidence (QuestionResponse, PageEngagement, MicroSimEngagement, ConceptMastery, SectionRollup) and evaluate why SectionRollup's ratio is so much larger than the others.

Purpose: Render the five storage-compression ratios from this section's prose as a single interactive bar chart, using a logarithmic y-axis so the ~3:1 and ~3,000:1 bars are both readable on one chart.

Data: Five bars, one per grain, x-axis labeled with the vertex label and y-axis labeled "Statements per summary vertex (log scale)". Values: QuestionResponse ≈ 3, PageEngagement ≈ 40, MicroSimEngagement ≈ 60, ConceptMastery ≈ 100, SectionRollup ≈ 3000.

Interactive features: Hovering any bar shows a tooltip with that grain's exact evidence-range text from this chapter's prose (e.g. "ConceptMastery: ~50-200 evidence events -> 1 vertex, ~100:1") plus its Analytical Grain key. Clicking a bar opens a side panel repeating that grain's evidence-count property name from the table above. A toggle switches the y-axis between logarithmic and linear scale, so the learner can see both how compressed SectionRollup is (log view) and how small QuestionResponse looks by comparison (linear view).

Color scheme: Bars colored on a single-hue gradient from the book's teal accent color (lightest for QuestionResponse, the smallest ratio) to the darkest teal (SectionRollup, the largest ratio), so color intensity visually tracks compression strength.

Responsive design: Chart canvas resizes to the width of its containing element on window resize, using Chart.js's built-in responsive option; bar labels rotate to a vertical orientation below 500px width to remain legible.
</details>

## How a Statement Actually Arrives

Everything so far described what a summary vertex looks like once it exists. The rest of this chapter answers a more basic question: how does a single xAPI statement, sent by one intelligent textbook page, get into this project's Learning Record Store safely enough to eventually be compressed?

Every statement enters through a single, conformant endpoint this project's specification calls the **xAPI Statement Resource**: `POST /xapi/statements`, which accepts either one statement or a batched array of them. The endpoint also accepts `PUT` requests carrying a client-supplied `statementId`, a detail this chapter returns to shortly. Crucially, the endpoint returns its `200` or `204` response immediately after the statement is durably queued — not after it has been validated end to end or projected into the graph. That design choice is what keeps a slow or backed-up graph from ever becoming the reason a textbook page's request hangs.

Chapter 5 already previewed the first checkpoint a statement passes through: the Ingestion Gateway performs "only structural validation" before queuing. This chapter names that checkpoint formally and introduces the second one behind it. **Structural Validation** happens synchronously, right at the Ingestion Gateway: is the body well-formed JSON, does it carry the required `actor`, `verb`, and `object` fields, does it carry a parseable timestamp? A statement that fails this tier is rejected outright with a `400` response and logged to a dead-letter stream — nothing partial is stored. Because xAPI conformance requires an all-or-nothing batch, a single malformed statement inside a batch of twenty rejects the whole batch.

Everything that survives Structural Validation is queued in the Durable Event Queue, and only then does it meet the second tier, inside the Stream Processor. **Semantic Validation** happens asynchronously: is this verb one the LRS already recognizes, is this activity IRI one it has already resolved, is this textbook version one it has already provisioned? Here the specification makes a deliberate choice that Chapter 7's Verb Controlled Vocabulary might make you expect the opposite of: an unrecognized verb, activity, or textbook version is not rejected. It is accepted, recorded, and flagged for later reconciliation. This project's specification names that behavior directly — **Schema On Read**: unknown activities, verbs, and textbook versions are accepted, buffered, and back-filled into the graph rather than rejected at the door.

!!! mascot-tip "Two gates, two different jobs"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Keep the two validation tiers separate in your head by what each one protects against. Structural Validation exists to protect the Durable Event Queue from garbage — a statement missing an `actor` field cannot be processed by anything downstream, so it never gets that far. Semantic Validation exists to protect the reader's experience from surprise rejections — a brand-new verb a textbook author just invented is exactly the kind of thing this system is built to absorb, not bounce.

The following list summarizes the two tiers now that both have been explained.

- **Structural Validation** — synchronous, at the Ingestion Gateway; checks well-formed JSON and the required `actor`, `verb`, `object` fields, plus a parseable timestamp; failure returns `400` and logs to a dead-letter stream.
- **Semantic Validation** — asynchronous, in the Stream Processor; checks whether the verb, activity, or textbook version is already known; failure never rejects the statement — it is accepted under **Schema On Read** and flagged for reconciliation instead.

## Delivery Guarantees: Redelivered but Never Duplicated

Once a statement is queued, this project's specification makes two promises about how reliably it reaches the Stream Processor, and the two promises only work together. The queue delivers with **At-Least-Once Delivery**: every statement is guaranteed to reach a processor at least once, but the same statement can legitimately be delivered more than once — after a processor crashes and restarts, for example, before it had a chance to confirm it had already handled a batch. At-least-once is a deliberately weaker guarantee than "exactly once," because exactly-once delivery across a distributed queue is expensive to build and easy to get subtly wrong.

What makes at-least-once safe rather than a data-corruption risk is **Idempotent Delivery**: processing the same statement twice must leave the system in exactly the state it would have reached processing it once. This project's specification achieves it through the statement's own identifier — every statement carries a `statement_id`, supplied by the client or minted by the gateway, and the storage layer treats that identifier as a uniqueness key, so a redelivered statement simply overwrites its own prior copy rather than creating a duplicate. Idempotency is also why a Learning Record Provider is allowed to `PUT` a statement with a client-supplied `statementId`: if the same request is retried after a timeout — the client never learning whether the first attempt succeeded — retrying is always safe.

The queue can also fall behind if statements arrive faster than processors can consume them, and this project's specification has a specific answer for what happens then, called **Backpressure**. Backpressure is applied entirely at the queue — never by rejecting the producer outright. Under ordinary overload, a producer that keeps sending receives a `202 Accepted` response carrying a retry hint, so the textbook page's own code can slow down gracefully. Only in the extreme case — the gateway's local queue is full and the Durable Event Queue itself is unreachable — does the endpoint return a `503` with a `Retry-After` header, and that specific condition is treated as significant enough to page an on-call engineer. The design choice underneath both responses is the same one that shaped the endpoint's fast-return behavior: ingestion must never be the layer that decides a classroom's telemetry gets dropped.

!!! mascot-warning "At-least-once without idempotency is where duplicates live"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    If you ever design a new producer that talks to this LRS, do not assume delivery is exactly-once just because failures are rare in testing. At-Least-Once Delivery means redelivery *will* happen eventually, at scale, across enough traffic. The system's entire safety net is Idempotent Delivery — the `statement_id` uniqueness check — so always send a stable, deterministic `statementId` rather than minting a new random one on every retry. A new ID on every retry defeats the very guarantee that makes retries safe.

The table below reinforces the three mechanisms just explained, now that each one's role has been described in the prose above.

| Mechanism | Guarantee | What Breaks Without It |
|---|---|---|
| At-Least-Once Delivery | Every statement reaches a processor at least once | A crash between processing and offset commit could silently drop a statement |
| Idempotent Delivery | Redelivering the same statement is a no-op | Reprocessing a redelivered statement would double-count evidence |
| Backpressure | Overload slows producers instead of dropping or rejecting them | A traffic spike could crash the queue or silently discard statements |

With every stage from the endpoint through delivery guarantees now defined, the diagram below traces one statement's full journey — from the moment a textbook sends it to the moment its evidence is compressed onto a summary vertex.

#### Diagram: Statement Ingestion Pipeline — From Statement to Summary Vertex

<iframe src="../../sims/statement-ingestion-pipeline/main.html" width="100%" height="622px" scrolling="no"></iframe>

<details markdown="1">
<summary>Statement Ingestion Pipeline — From Statement to Summary Vertex</summary>
Type: workflow
**sim-id:** statement-ingestion-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/context-graph/tree/main/docs/sims/graph-etl-pipeline<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, sequence

Learning objective: Let the learner trace a single xAPI statement's full path from the xAPI Statement Resource through the Ingestion Gateway, the Durable Event Queue, the Stream Processor, the Event Store, and the Compression Pipeline, to a Summary Vertex, and explain what each stage is responsible for.

Purpose: Show a seven-node, left-to-right Mermaid flowchart tracing one statement's complete journey, reusing the component names this book has already established in Chapter 5 and this chapter, so the learner sees the two chapters' vocabulary as one continuous pipeline rather than two separate diagrams.

Nodes, in order: "xAPI Statement Resource (POST /xapi/statements)"; "Ingestion Gateway (Structural Validation)"; "Durable Event Queue (At-Least-Once Delivery)"; "Stream Processor (Semantic Validation, Schema On Read)"; "Event Store (immutable statement log)"; "Compression Pipeline (Change-Driven Materialization)"; "Summary Vertex (Absolute Value Write)". Edges connect each node to the next in a single left-to-right chain.

Interactive features: Every node has a Mermaid `click` directive opening an infobox with that node's definition from this chapter's prose (Structural Validation, At-Least-Once Delivery, Semantic Validation plus Schema On Read, the Event Store recalled from Chapter 5, Change-Driven Materialization, and Absolute Value Write, in node order).

Color coding: Nodes 1-3 (Ingestion Plane and the queue) in the darkest teal from Chapter 5's plane-gradient palette; node 4 (Processing Plane) in a mid-teal; nodes 5-7 (Storage Plane and the compression pipeline) in the lightest teal.

Implementation: Mermaid flowchart, single left-to-right chain, full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the chain reflows top-to-bottom.
</details>

## Shipping a Textbook Before It Is Registered

Semantic Validation's willingness to accept an unknown textbook version raises a practical question Chapter 7 deferred: what actually happens in the graph the first time this LRS ever sees a brand-new textbook? Chapter 5 already previewed the answer in passing — "a brand-new textbook nobody has configured yet is still accepted rather than rejected" — without naming the mechanism. This section names it and walks through it in full.

This project's specification answers with a design principle it calls **Non-Blocking Ingestion**: a newly published textbook, a new version of an existing one, or a brand-new MicroSim must be able to start emitting statements immediately, with no pre-registration step that could block or drop the stream.

The mechanism that delivers on that principle is called **Accept-First Ingestion**, and it runs in four steps. First, the Ingestion Gateway accepts any statement whose context names a `textbook_id`/`version_id` combination it has never seen — accept first, ask questions later. Second, the Stream Processor auto-provisions placeholder nodes for whatever structure the statement references: `Textbook`, `TextbookVersion`, `MicroSim`, and `Concept` nodes are created on first sight. Each of these placeholders is a **Provisional Node** — the specification marks it with the property `provisional: true` to record that it exists only because a statement mentioned it, not because anyone has confirmed it against the textbook's real metadata yet. Third, a background component called the **Reconciliation Worker** later matches each provisional node against the textbook's actual published metadata — its learning graph, its MicroSim registry — by `git_sha`, then by IRI path, then by title similarity, and promotes a confident match to `provisional: false`, back-filling the `COVERS`, `EMBEDS`, and `DEPENDS_ON` edges Chapter 7 catalogued. Fourth, and most important: no data is lost while any of this is in flight. Statements about not-yet-reconciled activities are fully retained in the Event Store, and because events are immutable and re-projectable, they become richly queryable the instant reconciliation completes — retroactively, without anyone having to resend them.

!!! mascot-encourage "You do not need to track every provisional node by hand"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Accept-First Ingestion, Provisional Node stubs, and the Reconciliation Worker can feel like a lot of moving parts stacked on top of each other on a first read. The reassuring part is that none of it is your problem as a Learning Record Provider: you send a statement the moment a student does something, and this project's LRS handles every stage of getting that statement recognized, matched, and backfilled without ever asking you to wait. [Chapter 32](../32-producer-contract-conformant-statements/index.md) returns to exactly what a well-behaved producer looks like from the outside.

The four steps above are easier to hold in mind as a sequence than as a paragraph. The diagram below traces one provisional node from creation to promotion.

#### Diagram: Accept-First Ingestion and Reconciliation Flow

<iframe src="../../sims/accept-first-reconciliation-flow/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>Accept-First Ingestion and Reconciliation Flow</summary>
Type: workflow
**sim-id:** accept-first-reconciliation-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Let the learner explain how a newly published textbook can emit statements before its metadata is registered, and sequence the four steps of Accept-First Ingestion from a statement's arrival to a Provisional Node's promotion.

Purpose: Show a six-node, left-to-right Mermaid flowchart tracing one never-before-seen textbook's first statement from arrival through reconciliation, matching the four numbered steps described in this chapter's prose.

Nodes, in order: "Statement arrives naming an unknown textbook_id/version_id"; "Ingestion Gateway accepts it (Accept-First Ingestion)"; "Stream Processor auto-provisions a stub (Provisional Node, provisional: true)"; "Event Store retains the statement immutably"; "Reconciliation Worker matches the stub against published metadata (git_sha, then IRI path, then title similarity)"; "Node promoted (provisional: false), COVERS/EMBEDS/DEPENDS_ON back-filled — earlier statements become richly queryable retroactively". Edges connect each node to the next in sequence.

Interactive features: Every node has a Mermaid `click` directive opening an infobox with that node's definition from this chapter's prose — Schema On Read, Accept-First Ingestion, Provisional Node and its `provisional: true` property, the no-data-loss guarantee, the Reconciliation Worker's three-tier matching order, and retroactive queryability with a link back to Chapter 7's `COVERS`, `EMBEDS`, and `DEPENDS_ON` relationship types, in node order.

Color coding: The three "accept immediately" nodes in the book's teal accent color; the three "reconciled later" nodes in a complementary amber — visually separating what happens instantly from what happens eventually.

Implementation: Mermaid flowchart, single left-to-right chain, full click-to-infobox coverage on every node. Responsive width tracking the containing element; on narrow viewports the chain reflows top-to-bottom.
</details>

## Turning Rollups Into Graph Writes

Every mechanism described so far explains how a statement gets recorded safely. None of it yet explains how the six summary vertices from earlier in this chapter actually get their values. That is the job of the Compression Pipeline itself, and it rests on two more principles.

The Compression Pipeline does not recompute a grain's whole history every time a new statement lands for it. Instead it practices **Change-Driven Materialization**: on a fixed, configurable cadence, the Event Store maintains incremental rollups for every grain as statements land, and the pipeline reads only the rollups whose values have changed since the last sync — the grains with new evidence — and writes just those to the graph. A `ConceptMastery` vertex that has not received a new statement since the previous sync is left untouched; only the grains that changed generate a graph write at all.

When a changed rollup is written, it is written as an **Absolute Value Write**: the pipeline sets each property to its freshly recomputed total, never as an increment on top of whatever value was already there. This single rule is what makes the whole pipeline safe under the At-Least-Once Delivery guarantee from earlier in this chapter. An incremented counter is not idempotent — replaying the same update twice would silently inflate it, and there would be no way to detect that afterward. An absolute value is idempotent by construction: writing the same total a second time is a no-op, so redelivery, retry, and even a full replay of the statement log all leave the graph in the same correct state — the same property, in a different form, that made Idempotent Delivery safe two sections ago.

The sync cadence is configurable, and choosing it trades two things against each other: how quickly a change becomes visible in the graph, and how many writes per second the graph absorbs. A shorter cadence syncs more often but touches more distinct grains per cycle, which raises the write rate; a longer cadence batches more statements into fewer, larger writes but leaves the graph more stale. This project's design specification derives concrete numbers for a fleet at peak load — roughly 100,000 concurrently active students, each touching about 1.5 distinct objects per minute — and the chart below plots the resulting graph-write rate and graph lag against three candidate cadences, with the 60-second default marked.

#### Diagram: Graph Write Rate vs. Compression Sync Cadence

<iframe src="../../sims/write-rate-vs-sync-cadence/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Graph Write Rate vs. Compression Sync Cadence</summary>
Type: chart
**sim-id:** write-rate-vs-sync-cadence<br/>
**Library:** Chart.js<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/it-management-graph/tree/main/docs/sims/native-graph-storage-vs-graph-layer-performance-comparison<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: evaluate, predict

Learning objective: Let the learner evaluate the tradeoff between sync cadence, graph write rate, and graph lag in Change-Driven Materialization, and predict how each candidate cadence would behave during an ingestion burst.

Purpose: Render the three sync-cadence scenarios from this section's prose as a grouped bar-and-line chart so the tradeoff is visible at a glance rather than read out of a table.

Data: Three x-axis categories — "5 s", "60 s (default)", "300 s". Bar series "Graph upserts/sec" (left y-axis, linear): 10000, 2500, 1000. Dashed line series "Graph lag" (right y-axis, labeled in seconds, log scale): 5, 60, 300.

Interactive features: Hovering any bar or line point shows a tooltip with that cadence's exact statements-coalesced and distinct-active-grain figures (e.g. "60 s: ~600K statements coalesced into ~150K distinct active grains -> ~2,500 upserts/sec"). A toggle labeled "Simulate 5x ingest burst" recomputes the statement-count figures upward five-fold in the tooltip while holding the "Graph upserts/sec" bars nearly constant, demonstrating the insensitivity property described below the chart. The "60 s (default)" bar carries a highlight border.

Color scheme: Bars in the book's teal accent color, with the default-cadence bar in the darkest shade; the graph-lag line in a contrasting amber dashed stroke so the two series stay visually distinct on shared axes.

Responsive design: Chart canvas resizes to the width of its containing element on window resize, using Chart.js's built-in responsive option; the legend moves below the chart on narrow viewports.
</details>

The property worth remembering is not any single number in that chart — it is that the write rate barely moves during an ingestion burst. A five-fold spike in statements per second means each already-active student sends more events, not that five times as many students suddenly appear; the count of distinct active grains barely changes, so the Compression Pipeline absorbs the burst and the graph write rate stays close to its steady-state value throughout. That insensitivity, not the raw ratio, is what actually protects the graph.

## Key Takeaways

- A **Summary Vertex** compresses every statement relevant to one **Analytical Grain** into a single graph node, never one vertex per statement.
- This deployment materializes six grains: the **Question Response Vertex**, **Page Engagement Vertex**, **MicroSim Engagement Vertex**, and **Concept Mastery Vertex** compress evidence within one student's relationship to one piece of content; the **Learning Session Vertex** compresses one burst of activity; the **Section Rollup Vertex** aggregates across a whole class.
- Four of the six grains carry an explicit **Statements Compressed** count; the other two carry an equivalent count under a name that fits their grain (`event_count`, `student_count`).
- The **Statement Compression Ratio** — statements divided by summary vertices — ranges from about 3:1 at the `QuestionResponse` grain to about 3,000:1 at the `SectionRollup` grain, and only grows as evidence accumulates.
- Every statement enters through the **xAPI Statement Resource** and passes two gates: synchronous **Structural Validation** at the Ingestion Gateway, then asynchronous **Semantic Validation** in the Stream Processor, governed by **Schema On Read** rather than outright rejection.
- **At-Least-Once Delivery** guarantees a statement is never silently dropped; **Idempotent Delivery** makes redelivery safe; **Backpressure** slows producers under overload instead of rejecting them.
- **Non-Blocking Ingestion**, delivered by **Accept-First Ingestion**, lets a brand-new textbook emit statements immediately behind **Provisional Node** stubs that a **Reconciliation Worker** later promotes and back-fills.
- The Compression Pipeline itself runs on **Change-Driven Materialization** — syncing only changed grains — writing each one as an **Absolute Value Write**, which is what keeps the whole system idempotent and safely replayable.

!!! mascot-celebration "You just watched a statement become evidence"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    From `POST /xapi/statements` all the way to an absolute value sitting on a `ConceptMastery` vertex — you have now traced the entire distance this book kept promising to close. What does the evidence show? Every number a teacher's dashboard will ever display rests on the pipeline you just read. Next, in [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md), we catalog everything this LRS actually does with that evidence, function by function.
