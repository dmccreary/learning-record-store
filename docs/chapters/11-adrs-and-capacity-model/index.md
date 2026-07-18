---
title: Architecture Decision Records and the Capacity Model
description: A walk through the Learning Record Store design specification's seven Architecture Decision Records and the capacity model — statement volume, disk sizing, and graph write rates — that justifies them.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 08:33:06
version: 0.09
---

# Architecture Decision Records and the Capacity Model

## Summary

This chapter works through all seven of the project's Architecture Decision Records — where statements live, how compression stays idempotent, why the graph isn't on the hot path — and then derives the capacity model that justifies them: statements per day, disk sizing, and request rates at the specification's 10,000 statements/second target.

## Concepts Covered

This chapter covers the following 23 concepts from the learning graph:

1. ADR Event Store Decision
2. ADR Compression Sync Decision
3. ADR Graph Not Hot Path
4. ADR Partition Key Decision
5. ADR One Image Many Roles
6. ADR BKT Mastery Decision
7. ADR Python Gateway Decision
8. Memgraph Alternative
9. Peak Sustained Ingest
10. Burst Ingest Rate
11. Mean Statement Size
12. Active Ingestion Window
13. Duty Cycle
14. Statements Per Day
15. Kafka Disk Sizing
16. ClickHouse Disk Sizing
17. HTTP Request Rate
18. Graph Write Rate Naive
19. Neo4j Structural Node Count
20. Storage Compression Ratio
21. Write-Rate Compression
22. Sync Cadence Tradeoff
23. Distinct Active Grains

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)

---

!!! mascot-welcome "The Arithmetic Behind the Names"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 10 closed with a promise of its own: every technology name traces back to a number, and every number traces back to a written decision. This chapter opens both books at once — the project's Architecture Decision Records and the capacity model that justifies them. Let's follow the record.

Every nontrivial engineering choice has two parts: the decision itself, and the reasoning that made it the right one at the time. Most teams keep only the first part — the code that resulted — and lose the second the day the engineer who made the call leaves the room. This project keeps both, in a short written form called an **Architecture Decision Record**, or **ADR**: a document that states the context a decision responded to, the options considered, the choice made, and the consequences accepted. An ADR is deliberately small — usually a page or less — and it is never rewritten after the fact to look smarter than the moment it was written in. When a later engineer reads `ADR-004` and asks "why did they partition by student instead of by district?", the answer is not buried in a commit message or a Slack thread; it is a document with a name.

The Learning Record Store's design specification, `lrs-design-v1.md`, records seven of these decisions. Two of them — where statements physically live, and how compression keeps that split correct — are the foundation the rest of the design stands on. The other five each resolve one specific tension the design ran into: how to avoid a queue hotspot, how to ship one deployable artifact instead of eight, which algorithm computes a student's mastery, and how long the ingestion gateway can stay written in Python before it has to become something else. This chapter walks through all seven, then derives the capacity model — the actual arithmetic of statement volume, disk growth, and request rate — that gives each decision its numbers.

## ADR-001: Where Do Statements Live?

The first and most consequential decision answers a question that sounds almost too simple to need an ADR: when an xAPI Statement arrives, which database is the one, authoritative copy of it? Chapter 8 already established that the graph must never hold a per-statement vertex — that a `Statement` label in Neo4j is a spec violation, not a stylistic choice. **ADR-001** is the decision that makes that prohibition workable: **ClickHouse is the immutable system of record for every statement, at full fidelity, including the raw JSON**, and Neo4j holds structure — tenancy, content, the concept DAG, deployments, experiments — plus the compressed summary vertices Chapter 8 introduced. Nothing else.

The context behind ADR-001 is a number worth sitting with before this chapter derives it formally: at the specification's peak sustained ingest target, one-to-one materialization of every statement as a graph vertex would mean roughly 4.3 billion vertices for a *thirty-day window alone*, with a peak write rate near 50,000 graph mutations per second. No property-graph engine operates comfortably there, and nothing in the reporting catalog would even use it — every report the analytics plane serves is an aggregate, not a per-statement lookup. ClickHouse's columnar, append-only design is built exactly for ordered scans and group-by aggregates over billions of rows, which is the shape every report actually needs. The boundary ADR-001 draws is not a convention a future engineer could accidentally cross; the graph schema itself has no `Statement` label and no constraint that would admit one, so the prohibition is structural, not procedural.

!!! mascot-thinking "One Store of Record, One Structural Store"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice the shape of ADR-001: it does not say "ClickHouse is fast and Neo4j is slow." It says each store gets exactly the job it is good at — ClickHouse for full-fidelity, high-volume append, Neo4j for structure and compressed summaries. Watch for that division of labor again in ADR-002 and ADR-003; the whole design is built on giving each engine only the work it was designed to do.

## ADR-002: Compress in ClickHouse, Sync Absolutes to the Graph

ADR-001 decides *where* statements live. **ADR-002** decides *how* the compressed summary vertices Chapter 8 described get built and kept correct — and it exists because the obvious approach to that problem is a trap. The natural design is a windowed aggregator that emits deltas, applying each one to the graph with a Cypher statement shaped like `SET n.count = n.count + $delta`. That design breaks under Kafka's at-least-once delivery guarantee: if a stream processor crashes after emitting a delta but before committing its Kafka offset, the same delta is redelivered — and **increments are not idempotent**, so the counter silently inflates with no way to detect afterward that it happened.

ADR-002's decision avoids the trap by never incrementing anything. ClickHouse `AggregatingMergeTree` materialized views maintain each summary grain incrementally as statements land, at zero application cost — the database does the rollup work the naive design tried to do by hand. A separate `summarizer` role then reads only the rows whose `last_seen` timestamp advanced since its last sync, and writes **absolute values**, never deltas, into the graph on a fixed cadence. Writing the same absolute value twice is a no-op, which means redelivery, retry, and full replay are all safe by construction rather than by careful bookkeeping. The following list connects each spec requirement from Chapter 8 to the specific mechanism in ADR-002 that satisfies it, now that both have been explained above.

- **Reproducibility** — the materialized view is a pure function of the immutable log, so resetting the sync watermark to zero and letting the summarizer run rebuilds the entire graph from scratch.
- **Idempotency** — an absolute `SET` applied twice changes nothing, so Kafka's at-least-once redelivery can never double-count.
- **Correctness under late arrival** — a late statement updates the materialized view, which advances `last_seen`, which the next sync cycle picks up automatically; there is no window that can have already closed.
- **Freshness as a metric** — the gap between "now" and the summarizer's watermark is the graph's staleness, directly observable rather than estimated.

## ADR-003 and the Memgraph Alternative: Keeping the Graph Off the Hot Path

Even after compression, the design specification's numbers show the `ConceptMastery` grain reaching roughly 400 million vertices at full fleet scale — five million students each touching on the order of eighty concepts. That is comfortable to *store* in Neo4j, but storing it is not the same question as computing with it on every request. **ADR-003** answers the second question: the concept dependency graph Chapter 7 introduced is small, on the order of two hundred nodes per textbook, so a prerequisite-gap report does not need a graph database to traverse two hundred nodes — it needs a single student's two-hundred-float mastery vector, which is one ClickHouse point lookup or one Redis hash hit, held alongside the tiny DAG in the API process's own memory.

The decision, then, is a division of labor rather than a demotion of Neo4j: the graph is the **authoring, exploration, and structural-integrity** surface — the tool an instructional designer uses to browse the concept DAG, the surface reconciliation writes to, and the place a summary vertex answers a graph-shaped question like "how is my class doing on this concept?" Hot, per-student mastery math is served from ClickHouse and Redis instead, off the graph entirely. This is the same "each engine does only what it is built for" pattern ADR-001 established, applied one layer deeper.

That division of labor is also why the design specification's own open-questions list flags a related, still-unresolved decision worth naming here: **Neo4j 5 Community**, the edition this project runs in development, cannot cluster, so it has no story for production high availability. Neo4j Enterprise or its managed Aura offering would supply that, but both carry real licensing cost at fleet scale. The specification names a **Memgraph Alternative** — Memgraph, a graph database with an Apache-2 licensed core — as a credible drop-in if that licensing cost lands badly, because ADR-003 already keeps hot per-student math off the graph entirely. Because nothing performance-critical runs through Neo4j, swapping the structural-and-summary store for a different graph engine changes a deployment configuration, not the shape of any query a report depends on. The specification defers a final call on this to before the project's second milestone.

!!! mascot-tip "A Decision That Pays for Itself Twice"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    ADR-003 was written to solve a performance problem — keep per-request math off a database built for structure, not high-frequency reads. Notice it also quietly solved a *vendor* problem: because the graph was never on the hot path, a licensing surprise late in the project is a swap-the-backing-store decision, not a rewrite-the-query-layer decision. When you're the one arguing for an architectural boundary, it's worth asking whether it buys you more than the one problem you set out to solve.

## ADR-004: Partitioning Without a Hotspot

The design specification's Kafka topics need a partition key, and the obvious choice — key every message by `district_id` — creates exactly the problem Chapter 6's multi-tenancy discussion warned against. A single Kafka partition takes all of one key's traffic, so keying by district alone would put an entire 200,000-student district's statement volume onto one partition: a guaranteed hotspot, and precisely the single-tenant traffic concentration the specification's scale-and-availability requirements forbid.

**ADR-004** resolves this by keying each message `{district_id}:{student_key}` instead of by district alone. Per-learner ordering — required so the Bayesian Knowledge Tracing update Chapter 8 previewed sees one student's evidence in the order it happened — is still guaranteed, because Kafka preserves order within a single partition, and this key still routes every statement from one student to the same partition every time. Traffic now spreads evenly across all partitions by construction, because the key space is students, not districts. Noisy-neighbor protection — stopping one district's traffic spike from starving another's — layers Kafka client quotas on top: a byte-rate ceiling enforced per district at the broker, stronger than partition isolation because it bounds a district's *throughput* directly rather than merely its placement.

## ADR-005 and ADR-007: One Image, One Language, Two Different Kinds of Discipline

Two more ADRs concern how the system is built and shipped rather than where data lives. **ADR-005** decides that every LRS process — gateway, stream processor, summarizer, dashboards — is **one container image**, with the specific role a running container plays chosen entirely by the command passed to it at startup. One build, one dependency resolution, one vulnerability scan, one artifact promoted from a laptop through to production; the gateway and the dashboards cannot silently drift onto different versions of the xAPI parser, because there is exactly one copy of it in the entire deployment.

**ADR-007** decides the language every one of those roles is written in: Python, across the gateway, the stream processors, the analytics API, and the dashboards, rather than splitting the stack per component. The decision carries an explicit numeric trigger rather than standing unconditionally — the capacity model below shows the gateway handling only a few hundred HTTP requests per second, comfortably within a Python framework's reach, but if real-world batching turns out smaller than assumed, pushing the request rate back toward the full statement rate, the gateway alone moves to a compiled language. Because the gateway is small and mostly logic-free — authenticate, validate, produce to a queue — that rewrite stays cheap to defer.

## ADR-006: Bayesian Knowledge Tracing for Mastery

The sixth decision answers a question Chapter 9's function catalog raised but did not resolve: given a mix of quiz scores, MicroSim interactions, and page-reading signals, how does the system maintain one number representing how well a student has mastered a concept? **ADR-006** selects **Bayesian Knowledge Tracing**, abbreviated **BKT** — a model, standard in intelligent tutoring systems, that tracks a probability of mastery and updates it as new evidence arrives. Weighed against a weighted moving average, an Elo-style rating, and Item Response Theory, BKT wins on three grounds: its update touches only a single stored float per student-concept pair, cheap enough for a stream processor at the rates this chapter derives below; its parameters are interpretable, backed by decades of published literature; and its output is a probability — "78% likely to have mastered this" is a teacher-legible number an unscaled rating score is not. Chapter 12 returns to BKT's update equations and worked examples in full; here it is named only as the accepted decision, placed correctly among the other six.

Now that all seven decisions have been introduced in the order the design specification argues them, the table below collects them for quick reference — a summary of what has already been explained above, not a substitute for the reasoning.

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | ClickHouse is the system of record for the statement log; the graph holds structure and compressed summaries only | Accepted |
| ADR-002 | Compression runs as a ClickHouse `AggregatingMergeTree` rollup plus a change-driven graph sync; absolute writes, never increments | Accepted |
| ADR-003 | Neo4j holds structure, the concept DAG, and summary vertices; the raw log and hot per-student math stay in ClickHouse and Redis | Accepted |
| ADR-004 | Queue partition key is `district_id:student_key`, not `district_id`; noisy-neighbor protection via client quotas | Accepted |
| ADR-005 | One container image, many roles, selected by the startup command | Accepted |
| ADR-006 | Bayesian Knowledge Tracing for concept mastery | Accepted |
| ADR-007 | Python across all planes; revisit the gateway above 100,000 statements/sec | Accepted, with trigger |

#### Diagram: Statement Path Under ADR-001 and ADR-002

<iframe src="../../sims/statement-path-adr-001-002/main.html" width="100%" height="622px" scrolling="no"></iframe>

<details markdown="1">
<summary>Statement Path Under ADR-001 and ADR-002</summary>
Type: workflow
**sim-id:** statement-path-adr-001-002<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Let the learner trace one xAPI statement's storage path and explain, node by node, which decision (ADR-001 or ADR-002) governs each hop, reinforcing that the graph never receives a per-statement write.

Purpose: A single Mermaid flowchart showing one statement's journey from arrival to its two eventual resting places — full-fidelity storage and, much later, a compressed summary.

Nodes: "Statement arrives at the gateway" leads to "Written to ClickHouse, full JSON, full fidelity (ADR-001)" leads to "AggregatingMergeTree materialized view rolls the statement into its grain, incrementally, at zero app cost (ADR-002)". A second branch from the materialized-view node leads to "Every 60s: summarizer reads only grains whose last_seen advanced" leads to "Summarizer writes an absolute value to Neo4j via MERGE + SET, never += (ADR-002)" leads to "One compressed summary vertex in Neo4j, per grain, never per statement (ADR-001)". A dead-end node off the ClickHouse node reads "No arrow from here ever reaches Neo4j directly — nothing per-statement is ever written to the graph."

Interactive features: Every node has a Mermaid click directive. Clicking the ClickHouse node opens an infobox explaining ADR-001 in one paragraph, quoting "ClickHouse is the immutable system of record for every statement, at full fidelity." Clicking the materialized-view node or the summarizer node opens an infobox explaining ADR-002's absolute-write mechanism and why streaming deltas were rejected. Clicking the final Neo4j summary-vertex node opens an infobox reminding the learner that the graph schema has no Statement label at all. Clicking the dead-end node opens an infobox stating the C-1 constraint from Chapter 8 in one sentence.

Color coding: The ClickHouse path in the book's teal accent color; the summarizer/graph path in a complementary amber to visually separate "every statement, immediately" from "one absolute value, every 60 seconds."

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom instead of left-to-right.
</details>

## The Capacity Model: From Peak Ingest to Statements Per Day

Every ADR above answers a "how" question. The capacity model answers the "how much" question each ADR was actually responding to — and the specification is explicit that a naive calculation overstates the real number by roughly sixfold, because school telemetry is diurnal and bursty rather than flat across a full day. Multiplying a peak rate by the number of seconds in a day assumes that peak rate holds for twenty-four hours straight, which no classroom ever does.

The specification's capacity model starts from two rates. **Peak Sustained Ingest** is the rate the system must sustain continuously during the busiest normal periods: **10,000 statements per second**. **Burst Ingest Rate** is higher and shorter-lived — **50,000 statements per second** — the spike that happens at period boundaries, when a school's bell rings and every student in every section submits a batch of statements within the same few seconds. Sustained and burst are deliberately different numbers: a system sized only for the sustained rate would fail exactly when it matters most, at the instant hundreds of classrooms change activities at once.

Three more figures convert that peak rate into a daily volume. **Mean Statement Size** — the average size of one xAPI statement once it carries a realistic `context.contextActivities` block — is about **1.5 KB**. **Active Ingestion Window** is the portion of a day when U.S. classrooms, spread across four time zones, are actually in session and generating traffic: roughly **10 hours per day**. **Duty Cycle** is the fraction of that active window spent at or near peak rate rather than in the lulls between activities — about **40% of peak**, because statement traffic spikes at period boundaries and falls off between them, exactly the pattern that makes the naive full-day calculation wrong.

Multiplying these together gives **Statements Per Day**:

\[
10{,}000 \ \text{stmt/sec} \times 0.40 \times 36{,}000 \ \text{sec} \approx 144{,}000{,}000 \ \text{statements/day}
\]

**~144 million statements per day** is the number every other figure in this chapter is derived from. At 1.5 KB each, that is roughly 216 GB of raw JSON generated across the fleet every single day — before any compression, replication, or retention policy touches it.

!!! mascot-warning "Don't Multiply Peak by a Full Day"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to size a system by taking the peak rate and multiplying by 86,400 seconds — "10,000 statements/sec times a full day equals 864 million statements." That single mistake overstates the real daily volume by roughly six times, because it assumes every classroom, in every time zone, sustains peak load for twenty-four straight hours. Always ask what fraction of the day is actually active, and what fraction of that active window runs near peak, before you multiply a rate by anything.

The following list retraces that derivation chain as a self-check, useful before moving on to what those 144 million statements cost to store.

1. Peak Sustained Ingest (10,000 stmt/sec) sets the ceiling the ingestion plane must hold continuously.
2. Burst Ingest Rate (50,000 stmt/sec) sets the ceiling it must survive briefly, at period boundaries.
3. Active Ingestion Window (~10 h/day) restricts that ceiling to the hours classrooms are actually in session.
4. Duty Cycle (~40% of peak) restricts it further, to the fraction of the active window spent near peak rather than in the lulls.
5. Statements Per Day (~144M) is the product of all four — the number every disk-sizing and request-rate figure below is built on.

## Disk Sizing: What 144 Million Statements a Day Cost to Store

Raw daily volume feeds two separate disk-sizing calculations, because a statement passes through two very different stores on its way to being durable, each with its own retention policy. **Kafka Disk Sizing** covers the durable queue's own storage: 216 GB of raw JSON per day compresses roughly fourfold under zstd, and every partition is replicated three times for durability, giving 216 GB ÷ 4 × 3 ≈ **162 GB per day**. Because the queue is a replay buffer, not the system of record ADR-001 establishes, it only holds seven days of traffic — **Kafka Disk Sizing of roughly 1.1 TB**, a figure that stays flat no matter how long the LRS has been running.

**ClickHouse Disk Sizing** is different, because ClickHouse *is* the long-term system of record, with a retention window measured in years. Columnar compression brings the same 216 GB down to roughly **22 GB per day** — about a tenfold reduction, matching the figure Chapter 10 named for ClickHouse. Over a 180-day school year that is roughly 4 TB, and at the specification's seven-year retention requirement, cumulative storage reaches **roughly 28 TB**, after data older than thirteen months tiers off to the object store (MinIO in development, Amazon S3 in production) rather than staying on primary disk indefinitely.

#### Diagram: ClickHouse Storage Growth Over the Retention Window

<iframe src="../../sims/clickhouse-storage-growth/main.html" width="100%" height="482px" scrolling="no"></iframe>

<details markdown="1">
<summary>ClickHouse Storage Growth Over the Retention Window</summary>
Type: chart
**sim-id:** clickhouse-storage-growth<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: calculate, estimate

Learning objective: Let the learner apply the ~22 GB/day ClickHouse ingest figure to project cumulative storage across a seven-year retention window, and observe where the tiering policy changes the growth curve's slope.

Chart type: Line chart with one primary series and one annotated reference line

Purpose: Show cumulative ClickHouse storage climbing from day zero to the seven-year retention ceiling, so the reader sees the ~28 TB figure as the endpoint of a calculable curve rather than an isolated fact.

X-axis: Months since launch, 0 to 84 (seven years)
Y-axis: Cumulative storage, terabytes, 0 to 30

Data series:

1. "ClickHouse primary-disk storage" (teal line): rises at approximately 0.66 TB/month (22 GB/day × 30) up to month 13, then the slope visibly flattens as data older than 13 months tiers to the object store, leveling toward the ~28 TB figure by month 84.
2. Reference line (amber, dashed, horizontal): "Kafka disk, 7-day retention — always ~1.1 TB" — flat across the entire chart, to make the contrast explicit between a bounded replay buffer and a growing system of record.

Annotations:

- A marker at month 13 labeled "Tiering to S3/MinIO begins — data older than 13 months moves off primary disk"
- A marker at month 84 labeled "~28 TB at 7-year retention"

Interactive features: Hovering any point on either line reveals a tooltip with the exact month and cumulative GB/TB value. A toggle control lets the learner switch the X-axis between "Months" and "School years" (assuming a 180-day school year), recomputing the tick labels without changing the underlying data. Clicking the month-13 marker opens an infobox explaining the tiering policy in one sentence, matching this chapter's prose.

Color scheme: ClickHouse growth line in the book's teal accent color; the flat Kafka reference line in amber, consistent with this chapter's other diagrams' color language for "bounded buffer" versus "growing store."

Responsive design: Chart resizes to the width of its containing element and remains readable at tablet width, with the legend moving below the plot area on narrow viewports.
</details>

## Requests Versus Statements: Why the Gateway Can Stay in Python

Chapter 10 mentioned in passing that batched xAPI delivery drops the request rate roughly a hundredfold below the statement rate; this chapter can now show the arithmetic. A textbook does not send one HTTP request per statement — it accumulates statements locally and sends them in batches, typically 25 to 100 per `POST`. Dividing the 10,000 statements/sec peak by a batch size in that range gives the **HTTP Request Rate**: roughly **100 to 400 requests per second** at peak, the figure ADR-007 leans on directly when arguing that a Python gateway is viable without an immediate rewrite.

That gap is the single most load-bearing number in this chapter's second half. A few hundred requests per second across a handful of pods is unremarkable for FastAPI and Uvicorn; 10,000 individual requests per second — the number the gateway would face if every textbook fired one statement per request instead of batching — is a different engineering problem, and that is precisely the trigger condition ADR-007 names for moving the gateway to a compiled language.

The same model also explains, in numbers, why ADR-001 and ADR-003 exist. **Graph Write Rate Naive** is what Neo4j would face if every statement were materialized as its own vertex and edges: roughly 10,000 statements/sec times about four edges each, or **~50,000 graph writes per second** — the number spec §5.6 exists specifically to prevent. **Neo4j Structural Node Count**, by contrast — counting only what the graph actually holds under ADR-001 and ADR-003: districts, schools, sections, students, content, and concepts — comes to roughly **10 to 15 million nodes**, comfortably inside what a single Neo4j Community instance handles. The gap between "50,000 writes/sec if compression didn't exist" and "10–15 million total structural nodes" is exactly the gap ADR-001 and ADR-002 were written to close.

#### Diagram: Naive vs. Compressed Graph Write Rate

<iframe src="../../sims/naive-vs-compressed-graph-write-rate/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Naive vs. Compressed Graph Write Rate</summary>
Type: graph-model
**sim-id:** naive-vs-compressed-graph-write-rate<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Let the learner compare the naive per-statement graph write rate against the compressed summarizer write rate side by side, and attribute the ~20x reduction to the specific mechanism (ADR-001/ADR-002) that produces it.

Purpose: Two clusters of nodes in one vis-network canvas, contrasting a rejected design against the accepted one, both grounded in this chapter's own figures.

Nodes, left cluster "Naive (rejected)": "10,000 statements/sec" connects to "~4 edges per statement" connects to "~50,000 graph writes/sec" connects to a red-flagged node "Prohibited — spec §5.6 C-1, no property graph operates here."

Nodes, right cluster "Compressed (ADR-001 + ADR-002, accepted)": "10,000 statements/sec" connects to "ClickHouse AggregatingMergeTree rollup (no app-level state)" connects to "~150,000 distinct active grains per 60s window" connects to "~2,500 batched graph upserts/sec via summarizer" connects to a green-flagged node "Comfortable for Neo4j via UNWIND."

Interactive features: Clicking any node opens an infobox with that node's number and a one-sentence source (this chapter's capacity model or the ADR that produced it). Hovering an edge shows the multiplier or reduction it represents (e.g., hovering the edge into "~50,000 graph writes/sec" shows "10,000 × ~4"). A toggle labeled "Show burst scenario" re-labels the "10,000 statements/sec" nodes to "50,000 statements/sec (burst)" and updates the naive cluster's math to ~250,000 writes/sec while the compressed cluster's downstream numbers stay visibly unchanged — reinforcing that compression absorbs a 5x burst almost entirely.

Color coding: The naive cluster in a muted red-gray to signal "rejected"; the compressed cluster in the book's teal accent color to signal "accepted design."

Responsive design: vis-network's physics layout recalculates on window resize; clusters stack vertically below tablet width.
</details>

## The Compression Math: Two Different Ratios

The capacity model's last piece is the one Chapter 8 gestured at without deriving: exactly how much compression happens, and at what rate. The design specification is careful to separate two ratios that are easy to conflate. **Storage Compression Ratio** measures how many statements collapse into a single summary vertex over that vertex's entire lifetime — an unbounded ratio, because a student's five-hundredth visit to the same page still updates the same `PageEngagement` vertex rather than creating a new one.

Before the table below, it helps to name the five grains it covers, each already familiar from Chapter 8: `PageEngagement` tracks one student's activity on one page; `ConceptMastery` tracks one student's evidence for one concept; `MicroSimEngagement` tracks one student's interactions with one simulation; `QuestionResponse` tracks one student's attempts at one question; and `SectionRollup` aggregates an entire section's activity against one concept. The table below reinforces the ratios already described in this paragraph, now attached to real numbers.

| Grain | Statements per vertex | Storage Compression Ratio |
|---|---|---|
| `PageEngagement` (student, page) | ~20–60 views, scrolls, dwell pings | ~40:1 |
| `ConceptMastery` (student, concept) | ~50–200 evidence events | ~100:1 |
| `MicroSimEngagement` (student, microsim) | ~30–100 interactions | ~60:1 |
| `QuestionResponse` (student, question) | ~1–5 attempts | ~3:1 |
| `SectionRollup` (section, concept) | 30 students × ~100 events | ~3,000:1 |

**Write-Rate Compression** is the second, distinct ratio, and it is the one that actually protects Neo4j from write overload — not how many statements a vertex ever absorbs, but how many graph upserts happen *per second*. That number depends on **Distinct Active Grains**: the count of unique (student, concept) or (student, page) pairs that receive at least one new statement within a single sync window. At the specification's peak, roughly 100,000 students are concurrently active, each touching about 1.5 distinct objects per minute, which is what produces the specific grain counts in the table below.

**Sync Cadence Tradeoff** is the design lever that turns distinct active grains into an actual write rate: the summarizer's sync interval controls how many statements get coalesced into each batch before it writes absolute values to the graph. A shorter cadence means fresher data and a higher write rate; a longer cadence means a lower write rate and more staleness.

| Sync cadence | Statements coalesced | Distinct Active Grains | Graph upserts/sec | Graph lag |
|---|---|---|---|---|
| 5 s | 50 K | ~50 K | ~10,000 | 5 s |
| 60 s (default) | 600 K | ~150 K | ~2,500 | 60 s |
| 300 s | 3 M | ~300 K | ~1,000 | 5 min |

The design specification settles on the 60-second default because ~2,500 batched upserts per second, delivered via a single `UNWIND` statement per sync cycle, is comfortable for Neo4j, and a minute of graph staleness is invisible on a dashboard nobody is refreshing every few seconds. The property that matters most here is not any one ratio — it is that the write rate barely moves under a burst. A spike to 50,000 statements/sec means each already-active student generates more events per second; it does not conjure five times as many distinct students. Distinct active grains stay close to flat, so **the graph write rate holds near 2,500/sec through a full five-times ingestion burst**, which is exactly why spec §5.6's burst target is survivable rather than merely aspirational.

!!! mascot-encourage "Two Ratios, Two Different Jobs"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If Storage Compression Ratio and Write-Rate Compression are blurring together in your head, that is a completely normal place to be after one pass through this section. Hold onto the difference by what each one answers: storage compression answers "how much smaller is the graph than the raw log, over its whole life?" Write-rate compression answers "how fast does the graph actually have to write, right now, this second?" One is about size; the other is about speed. Re-reading the two tables side by side usually makes the split click.

#### Diagram: Sync Cadence Tradeoff Explorer

<iframe src="../../sims/sync-cadence-tradeoff-explorer/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Sync Cadence Tradeoff Explorer</summary>
Type: microsim
**sim-id:** sync-cadence-tradeoff-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: calculate, experiment, apply

Learning objective: Let the learner manipulate the summarizer's sync cadence and observe, with real computed numbers, how distinct active grains, graph upserts per second, and graph lag all move together — building intuition for why the design specification chose 60 seconds as the default.

Canvas layout:

- Top area (400px): a horizontal slider labeled "Sync cadence (seconds)" ranging from 5 to 300, with tick marks at 5, 60, and 300 matching the three rows of this chapter's table
- Middle area: four large numeric readouts that update live as the slider moves — "Statements coalesced," "Distinct active grains," "Graph upserts/sec," and "Graph lag"
- Bottom area: a horizontal bar showing "Graph upserts/sec" scaled against a fixed reference line at "10,000/sec (naive, prohibited)" so the learner can see how far below the naive rate every cadence setting stays

Visual elements:

- Slider track in the book's teal accent color, with a draggable handle
- The four numeric readouts in large, high-contrast text, each with a small icon (clock for cadence-dependent, database for grain count)
- The bottom comparison bar shrinks and grows in real time as the slider moves, always dwarfed by the fixed 10,000/sec reference line

Interactive controls:

- Slider: "Sync cadence (seconds)," 5 to 300, default 60
- Toggle button: "Show burst scenario (50,000 stmt/sec)" — recomputes all four readouts using the burst ingest rate instead of the peak sustained rate, so the learner can see directly that upserts/sec barely changes even though ingest quintuples
- Button: "Reset to default (60s)"

Default parameters:

- Cadence: 60 seconds
- Ingest scenario: peak sustained (10,000 stmt/sec)

Behavior:

- Moving the slider recomputes all four readouts using this chapter's derivation: statements coalesced = ingest rate × cadence; distinct active grains scales sub-linearly toward a ceiling around 300K as cadence grows; graph upserts/sec = distinct active grains ÷ cadence; graph lag = cadence itself
- At the three tick marks (5s, 60s, 300s) the readouts snap to and display the exact figures from this chapter's Sync Cadence Tradeoff table, so the learner can verify the simulation against the printed numbers
- Toggling "Show burst scenario" visibly changes "Statements coalesced" a great deal while "Graph upserts/sec" changes only modestly, making the burst-insensitivity property directly observable rather than merely asserted in prose

Instructional Rationale: An Apply-level objective calls for parameter exploration rather than a passive animation — the learner should be able to drag the cadence slider themselves and watch the tradeoff numbers respond, which builds the intuition that a longer cadence trades freshness for a gentler write rate, matching exactly the design decision ADR-002 and this chapter's prose describe.

Implementation notes: Use p5.js `slider()` for the cadence control and redraw the four readouts and the comparison bar every frame based on the current slider value; interpolate distinct-active-grains between the three anchor points (50K at 5s, 150K at 60s, 300K at 300s) using a smooth curve rather than linear interpolation, since the underlying relationship saturates. Responsive design: canvas width tracks the containing element's width, with the readout panel reflowing beneath the slider on narrow viewports instead of beside it.
</details>

## Bringing the Two Halves Together

The seven ADRs and the capacity model are really one argument told twice, in two different vocabularies. ADR-001 and ADR-002 say, in words, that statements live in ClickHouse and only compressed absolutes ever reach the graph; the capacity model says the same thing in numbers — 144 million statements a day would mean 50,000 naive graph writes per second, and the compression pipeline brings that down to roughly 2,500. ADR-003 says the graph is not on the hot path; the capacity model shows why, with a ~400-million-vertex `ConceptMastery` grain that is trivial to store but never meant to be traversed per request. ADR-004's partition key and ADR-007's Python gateway both trace back to the same request-rate arithmetic this chapter just derived. None of the seven decisions is arbitrary, and none of the six numbers in the capacity model exists without a decision it justifies.

That is the whole point of writing an ADR down in the first place: not to record that a choice was made, but to leave behind the arithmetic that makes the choice checkable, years later, by someone who was not in the room when it happened.

## Key Takeaways

- **ADR-001** makes ClickHouse the immutable system of record for every statement; Neo4j holds only structure and compressed summaries, enforced by the graph schema itself.
- **ADR-002** compresses in ClickHouse `AggregatingMergeTree` rollups and syncs absolute values — never increments — to the graph, which is what makes the pipeline idempotent under Kafka's at-least-once delivery.
- **ADR-003** keeps the roughly 200-node concept DAG and per-student mastery math off the graph's hot path, and opens the door to the **Memgraph Alternative** if Neo4j's production licensing proves too costly.
- **ADR-004** partitions Kafka by `district_id:student_key`, not district alone, to avoid a single-tenant hotspot while preserving per-learner ordering.
- **ADR-005** and **ADR-007** ship one container image across every role and keep the whole stack in Python, with an explicit, numeric trigger for revisiting the gateway.
- **ADR-006** selects Bayesian Knowledge Tracing for concept mastery, chosen for its O(1) update cost, its interpretability, and its probability-shaped output.
- **Peak Sustained Ingest** (10,000 stmt/sec), **Burst Ingest Rate** (50,000 stmt/sec), **Mean Statement Size** (~1.5 KB), **Active Ingestion Window** (~10 h/day), and **Duty Cycle** (~40%) combine to produce **Statements Per Day** (~144M) — the single number every disk and rate figure in this chapter derives from.
- **Kafka Disk Sizing** (~1.1 TB at 7-day retention) and **ClickHouse Disk Sizing** (~28 TB at 7-year retention) size two very differently-scoped stores from the same daily volume.
- **HTTP Request Rate** (~100–400/sec) is roughly a hundredfold below the statement rate because of batching — the arithmetic behind ADR-007's Python decision.
- **Graph Write Rate Naive** (~50,000/sec) is what compression prevents; **Neo4j Structural Node Count** (~10–15M) is what the graph actually holds instead.
- **Storage Compression Ratio** (how much a vertex absorbs over its lifetime) and **Write-Rate Compression** (how fast the graph writes right now) are two different ratios, tied together by **Distinct Active Grains** and the **Sync Cadence Tradeoff** the summarizer's 60-second default resolves.

!!! mascot-celebration "Seven Decisions, One Set of Numbers"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You just read every Architecture Decision Record this project has accepted, and derived the capacity model that justifies every one of them from first principles. What does the evidence show? A design that can show its arithmetic is a design that can be checked, questioned, and trusted — which is a higher bar than merely "working." In [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md), we open up ADR-006's algorithm in full, with the update equations and worked examples this chapter deliberately left for later.
