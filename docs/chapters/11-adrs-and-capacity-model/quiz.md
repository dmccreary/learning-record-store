---
title: "Quiz: Architecture Decision Records and the Capacity Model"
description: Review questions on the project's seven ADRs — event store, compression sync, graph hot-path avoidance, partition keys, one image many roles, BKT mastery, and the Python gateway — plus the capacity model's statement volume, disk sizing, and write-rate arithmetic.
social:
   cards: false
---
# Quiz: Architecture Decision Records and the Capacity Model

Test your understanding of this project's seven Architecture Decision Records and the capacity model that justifies them with these review questions.

---

#### 1. What does ADR-001 decide?

<div class="upper-alpha" markdown>
1. ClickHouse is the immutable system of record for every statement at full fidelity; Neo4j holds only structure and compressed summaries
2. Neo4j is the immutable system of record for every statement, with ClickHouse holding only cached aggregates
3. Both ClickHouse and Neo4j independently store a full copy of every statement for redundancy
4. Statements are stored only in the Durable Event Queue, with no permanent database at all
</div>

??? question "Show Answer"
    The correct answer is **A**. ADR-001 makes ClickHouse the immutable system of record for every statement at full fidelity, while Neo4j's schema has no `Statement` label at all, structurally preventing per-statement vertices. B reverses which store holds which data. C invents redundant full copies the design never calls for. D ignores that the queue is a transient buffer, not a system of record.

    **Concept Tested:** ADR Event Store Decision

    **See:** [ADR-001: Where Do Statements Live?](index.md#adr-001-where-do-statements-live)

---

#### 2. Why did ADR-002 reject a windowed aggregator that applies incremental deltas to the graph (`SET n.count = n.count + $delta`)?

<div class="upper-alpha" markdown>
1. Because Cypher does not support arithmetic operations on stored properties
2. Because ClickHouse cannot produce materialized views of any kind
3. Because deltas would require Neo4j Enterprise licensing to apply
4. Because increments are not idempotent under Kafka's at-least-once delivery — a redelivered delta would silently inflate a counter with no way to detect it afterward
</div>

??? question "Show Answer"
    The correct answer is **D**. Under at-least-once delivery, a redelivered delta would silently inflate a counter with no way to detect the error later, so ADR-002 instead syncs recomputed absolute values, which are idempotent by construction. A is factually false about Cypher's capabilities. B contradicts the chapter, which relies on ClickHouse's `AggregatingMergeTree` materialized views directly. C invents an unrelated licensing constraint.

    **Concept Tested:** ADR Compression Sync Decision

    **See:** [ADR-002: Compress in ClickHouse, Sync Absolutes to the Graph](index.md#adr-002-compress-in-clickhouse-sync-absolutes-to-the-graph)

---

#### 3. According to ADR-003, why does keeping per-student mastery math off Neo4j's hot path also reduce the project's exposure to a Neo4j licensing risk?

<div class="upper-alpha" markdown>
1. Because Neo4j Community edition is free regardless of workload, so licensing risk was never a real concern
2. Because Memgraph is required by the xAPI Conformance Suite for all production deployments
3. Because nothing performance-critical runs through Neo4j, so a future swap to an alternative like Memgraph would change a deployment configuration rather than requiring a rewrite of any report's query layer
4. Because ADR-003 eliminates the need for Neo4j entirely, replacing it with ClickHouse for structural data too
</div>

??? question "Show Answer"
    The correct answer is **C**. Because hot per-student math already lives in ClickHouse and Redis rather than the graph, swapping Neo4j for an alternative like Memgraph would only change a deployment configuration, not the shape of any query a report depends on. A dismisses a real, named open question about production high availability. B fabricates a conformance requirement. D overstates the decision — Neo4j still holds structure and summary vertices.

    **Concept Tested:** ADR Graph Not Hot Path / Memgraph Alternative

    **See:** [ADR-003 and the Memgraph Alternative: Keeping the Graph Off the Hot Path](index.md#adr-003-and-the-memgraph-alternative-keeping-the-graph-off-the-hot-path)

---

#### 4. Why does ADR-004 key Kafka messages by `{district_id}:{student_key}` rather than by `district_id` alone?

<div class="upper-alpha" markdown>
1. Because keying by student alone would violate Hard Isolation between districts
2. Because keying by district alone would put an entire large district's traffic onto one partition, creating a hotspot, while the compound key still preserves per-learner ordering and spreads traffic evenly
3. Because Kafka requires every partition key to include exactly two fields
4. Because district_id alone would make Idempotent Delivery impossible
</div>

??? question "Show Answer"
    The correct answer is **B**. Keying by district alone would concentrate an entire district's traffic onto one partition, a guaranteed hotspot, while the compound key spreads traffic across partitions by construction and still keeps one student's statements ordered within a single partition. A misapplies Hard Isolation, an unrelated multi-tenancy guarantee. C is a fabricated Kafka requirement. D confuses partitioning with the separate Idempotent Delivery mechanism.

    **Concept Tested:** ADR Partition Key Decision

    **See:** [ADR-004: Partitioning Without a Hotspot](index.md#adr-004-partitioning-without-a-hotspot)

---

#### 5. What does ADR-005 decide about how this project's LRS processes are packaged and deployed?

<div class="upper-alpha" markdown>
1. Every role (gateway, stream processor, summarizer, dashboards) is built as its own separate container image, developed and versioned independently
2. Only the gateway and stream processor share an image; the summarizer and dashboards each get their own
3. Container images are rebuilt fresh from source for every single deployment, with no image reuse at all
4. Every LRS process is one container image, with the specific role a running container plays chosen by the command passed to it at startup
</div>

??? question "Show Answer"
    The correct answer is **D**. ADR-005 ships one container image for every role, with the startup command choosing which role a given container plays, so every role shares exactly one copy of every dependency. A and B both invent multiple-image schemes that ADR-005 specifically avoids. C mischaracterizes normal build and deploy practice, which is unrelated to the one-image decision itself.

    **Concept Tested:** ADR One Image Many Roles

    **See:** [ADR-005 and ADR-007: One Image, One Language, Two Different Kinds of Discipline](index.md#adr-005-and-adr-007-one-image-one-language-two-different-kinds-of-discipline)

---

#### 6. What numeric trigger does ADR-007 name for reconsidering its decision to write the ingestion gateway in Python?

<div class="upper-alpha" markdown>
1. If real-world batching turns out smaller than assumed, pushing the HTTP request rate back up toward the full statement rate
2. If the number of registered districts exceeds 1,000
3. If Neo4j Community edition is discontinued
4. If the Statement Compression Ratio ever drops below 10:1
</div>

??? question "Show Answer"
    The correct answer is **A**. ADR-007's trigger is explicitly about request rate: if batching turns out smaller than assumed and the gateway's request rate climbs back toward the full statement rate, the gateway alone moves to a compiled language. B, C, and D each invent an unrelated trigger condition the chapter never names.

    **Concept Tested:** ADR Python Gateway Decision

    **See:** [ADR-005 and ADR-007: One Image, One Language, Two Different Kinds of Discipline](index.md#adr-005-and-adr-007-one-image-one-language-two-different-kinds-of-discipline)

---

#### 7. What does ADR-006 select as the algorithm for computing concept mastery, and on what grounds?

<div class="upper-alpha" markdown>
1. Item Response Theory, chosen because it estimates question difficulty and test-taker ability simultaneously
2. An Elo-style rating system, chosen because it is simple to update after each match
3. Bayesian Knowledge Tracing, chosen for its cheap per-update cost, interpretable parameters, and probability-shaped output
4. A weighted moving average, chosen because it requires no stored parameters at all
</div>

??? question "Show Answer"
    The correct answer is **C**. ADR-006 selects Bayesian Knowledge Tracing because its update touches only a single stored float, its parameters are interpretable and literature-backed, and its output is a teacher-legible probability. A and B each name a real alternative the specification weighed and rejected. D invents a parameter-free method that was never one of the considered alternatives.

    **Concept Tested:** ADR BKT Mastery Decision

    **See:** [ADR-006: Bayesian Knowledge Tracing for Mastery](index.md#adr-006-bayesian-knowledge-tracing-for-mastery)

---

#### 8. Using this chapter's capacity model — Peak Sustained Ingest of 10,000 statements/sec, a Duty Cycle of about 40%, and an Active Ingestion Window of about 10 hours (36,000 seconds) per day — which calculation correctly derives Statements Per Day?

<div class="upper-alpha" markdown>
1. 10,000 × 36,000 = 360,000,000 statements/day
2. 10,000 × 0.40 × 36,000 ≈ 144,000,000 statements/day
3. 10,000 × 86,400 = 864,000,000 statements/day
4. 50,000 × 0.40 × 36,000 ≈ 720,000,000 statements/day
</div>

??? question "Show Answer"
    The correct answer is **B**. Multiplying the peak sustained rate by the duty cycle and the active window's seconds gives roughly 144 million statements per day, the figure every other number in the chapter is derived from. A omits the duty cycle entirely. C multiplies by a full 24-hour day, the exact naive mistake the chapter warns against. D substitutes the burst rate for the sustained rate, overstating the daily total.

    **Concept Tested:** Statements Per Day

    **See:** [The Capacity Model: From Peak Ingest to Statements Per Day](index.md#the-capacity-model-from-peak-ingest-to-statements-per-day)

---

#### 9. Why does Kafka Disk Sizing land at roughly 1.1 TB while ClickHouse Disk Sizing reaches roughly 28 TB, even though both stores handle the same ~216 GB of daily raw statement volume?

<div class="upper-alpha" markdown>
1. Because Kafka is a short-term replay buffer retained for only seven days, while ClickHouse is the long-term system of record retained for years under ADR-001
2. Because Kafka does not compress data at all, while ClickHouse compresses at a hundredfold ratio
3. Because ClickHouse stores three replicas of every statement, while Kafka stores only one
4. Because Kafka Disk Sizing includes the property graph's structural nodes, while ClickHouse Disk Sizing does not
</div>

??? question "Show Answer"
    The correct answer is **A**. Kafka only needs to hold seven days of replay buffer, while ClickHouse, as ADR-001's system of record, retains statements for years, so the same daily volume compounds very differently over each store's own retention window. B misstates the compression ratios — both stores compress, just by different factors. C reverses which store uses replication. D confuses statement storage with unrelated graph structure.

    **Concept Tested:** Kafka Disk Sizing / ClickHouse Disk Sizing

    **See:** [Disk Sizing: What 144 Million Statements a Day Cost to Store](index.md#disk-sizing-what-144-million-statements-a-day-cost-to-store)

---

#### 10. A textbook batches 50 statements into each HTTP POST request. At the 10,000 statements/sec peak sustained ingest rate, approximately what HTTP request rate does the gateway actually see?

<div class="upper-alpha" markdown>
1. 10,000 requests/sec, since each statement still requires its own request
2. 500 requests/sec, matching the batch size times the statement rate
3. 200 requests/sec, dividing the statement rate by the batch size
4. 50 requests/sec, matching only the batch size
</div>

??? question "Show Answer"
    The correct answer is **C**. Dividing the statement rate by the batch size gives the request rate — 10,000 ÷ 50 = 200 requests/sec — squarely inside the 100-to-400 range this chapter derives, which is what makes a Python gateway viable. A ignores batching entirely. B multiplies instead of dividing, producing a number far too high. D confuses the batch size itself with the resulting request rate.

    **Concept Tested:** HTTP Request Rate

    **See:** [Requests Versus Statements: Why the Gateway Can Stay in Python](index.md#requests-versus-statements-why-the-gateway-can-stay-in-python)

---

#### 11. Why does the specification treat Graph Write Rate Naive (~50,000/sec) as a number that ADR-001 and ADR-002 exist specifically to prevent, rather than a number the system needs to survive?

<div class="upper-alpha" markdown>
1. Because 50,000 writes/sec is comfortably within Neo4j's normal operating capacity, so no design intervention was needed
2. Because 50,000 graph writes per second is what Neo4j would face only if every statement were materialized as its own vertex and edges — a scenario the graph schema structurally forbids by having no Statement label at all, so the number is never actually reached
3. Because Kafka, not Neo4j, is responsible for absorbing all 50,000 writes per second
4. Because the naive rate only applies during the 5-second sync cadence option, which the specification never uses
</div>

??? question "Show Answer"
    The correct answer is **B**. The naive rate describes a rejected, hypothetical design — one graph write per statement — that the graph schema's structural prohibition on a `Statement` label makes impossible to reach in practice. A wrongly claims the naive rate is survivable, contradicting the chapter's framing. C misattributes responsibility to Kafka, an unrelated component for this figure. D fabricates a connection to the 5-second cadence option.

    **Concept Tested:** Graph Write Rate Naive / Neo4j Structural Node Count

    **See:** [Requests Versus Statements: Why the Gateway Can Stay in Python](index.md#requests-versus-statements-why-the-gateway-can-stay-in-python)

---

#### 12. Why does the graph write rate stay close to ~2,500 upserts/sec even during a five-fold burst to 50,000 statements/sec, according to the Sync Cadence Tradeoff analysis?

<div class="upper-alpha" markdown>
1. Because Backpressure automatically rejects any burst traffic above the sustained rate before it reaches the summarizer
2. Because the summarizer automatically shortens its sync cadence during a burst to compensate
3. Because ClickHouse silently drops excess statements once the burst threshold is exceeded
4. Because a burst mostly means already-active students generate more events each, not that five times as many distinct (student, concept) or (student, page) grains suddenly appear — so Distinct Active Grains, and therefore the write rate, stays nearly flat
</div>

??? question "Show Answer"
    The correct answer is **D**. A burst multiplies events per already-active student rather than multiplying the count of distinct active grains, so the write rate — which depends on distinct grains per sync window, not raw statement volume — stays close to its steady-state value. A misapplies Backpressure, which throttles producers, not this write-rate calculation. B and C each invent a mechanism the chapter does not describe.

    **Concept Tested:** Storage Compression Ratio / Write-Rate Compression / Distinct Active Grains / Sync Cadence Tradeoff

    **See:** [The Compression Math: Two Different Ratios](index.md#the-compression-math-two-different-ratios)

---
