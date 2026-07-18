---
title: Kafka Topics, ClickHouse Schema, and Graph Constraints
description: The exact Kafka topic names and retention policies, the ClickHouse DDL for the event log and its materialized views, and the Neo4j constraints that make per-statement vertices structurally impossible.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 10:58:20
version: 0.09
---

# Kafka Topics, ClickHouse Schema, and Graph Constraints

## Summary

This chapter documents the physical schema in detail: the six named Kafka topics and their retention policies, the ClickHouse tables and materialized views that compress statements, and the Neo4j constraints that make per-statement vertices structurally impossible.

## Concepts Covered

This chapter covers the following 22 concepts from the learning graph:

1. Raw Statements Topic
2. Bulk Statements Topic
3. Dead Letter Topic
4. Reconcile Task Topic
5. Mastery State Topic
6. Audit Feed Topic
7. Lrs Statements Table
8. Lrs Concept Mastery Table
9. Section Concept Daily MV
10. Student Concept Rollup MV
11. Student Page Rollup MV
12. ReplacingMergeTree Engine
13. AggregatingMergeTree Engine
14. LowCardinality Type
15. ZSTD Compression Codec
16. Partition By Month
17. Grain Uniqueness Constraint
18. Statement Label Prohibition
19. Concept DAG Acyclicity Check
20. Vault-Db Instance
21. Meta-Db Instance
22. Network Credential Boundary

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)

---

!!! mascot-welcome "The Spec, Word for Word"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 13 named the mechanisms — token caches, HMAC pseudonymization, deterministic bucketing. This chapter names the exact nouns those mechanisms operate on: the six Kafka topic strings, the ClickHouse `CREATE TABLE` statements, and the Neo4j `CREATE CONSTRAINT` clauses. Every name in this chapter is copied verbatim from the design specification's §6, because this is the layer where a typo is not a style choice — it is a production outage. Let's follow the record.

Every mechanism the last chapter described eventually touches a physical object with a name: a Kafka topic, a ClickHouse table, or a Neo4j constraint. This chapter is a close reading of the design specification's §6, "Data Design," organized around three physical layers in the order a statement passes through them — the durable queue, the columnar event log, and the summary graph.

## The Six Kafka Topics

The design specification names exactly six Kafka topics, and each one exists to solve one specific problem raised in earlier chapters. The **Raw Statements Topic**, named `xapi.statements.raw`, is the one every textbook page actually writes to during live use — it is keyed by `{district_id}:{student_key}`, split across 48 partitions, and retained for 7 days. At ten thousand statements a second spread evenly, that partition count works out to roughly 208 statements per second per partition, comfortably inside what a single consumer thread can process.

Live traffic is not the only traffic this pipeline carries. When a district re-imports a semester of historical statements, or an operator replays a window of the log to fix a bug, those statements flow through the **Bulk Statements Topic**, `xapi.statements.bulk` — the same key format, but only 12 partitions and a separate topic entirely. Chapter 11's ADR-004 explains the separation: a backfill job sharing the raw topic could starve live ingestion exactly when a district is watching a dashboard update in real time.

Not every statement that arrives is well-formed. A statement missing a required `actor` or `verb` field fails Chapter 13's tier-one validation — but rejection still needs a paper trail, so the gateway writes it to the **Dead Letter Topic**, `xapi.statements.dlq`. Keyed only by `{district_id}` (there is no reliable student key for a malformed statement), it spans 12 partitions and is kept for 30 days — long enough for the dead-letter inspector in the specification's §10.5 to surface a misconfigured textbook's malformed batch before the evidence expires.

!!! mascot-thinking "Retention Is a Design Decision, Not a Default"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Look at how differently each topic's retention window is set: 7 days for live and bulk traffic, 30 days for dead letters, 400 days for the audit feed, and one topic — mastery state — retained forever by being compacted rather than time-boxed. None of these numbers are arbitrary defaults. Each one reflects how long a human or a downstream system plausibly needs to look backward before the data has done its job.

Two more topics carry data that never touched a browser at all. The **Reconcile Task Topic**, `lrs.reconcile`, keyed by `{textbook_id}` across 12 partitions with 7-day retention, carries the auto-provisioning tasks Chapter 8 introduced — a queue of work items produced whenever the processor encounters an activity IRI it does not yet recognize. The **Audit Feed Topic**, `lrs.audit`, keyed by `{district_id}` across 12 partitions, is retained for 400 days and feeds the meta-database's append-only audit log that later chapters on compliance depend on.

The sixth topic behaves differently from all the others. The **Mastery State Topic**, `lrs.mastery.state`, is keyed by `{student_key}:{concept_id}` across 48 partitions, but its retention policy is not a number of days — it is **compacted**, meaning Kafka keeps only the single latest message for each key, forever, discarding every earlier value automatically. This is the exact mechanism behind Chapter 13's Compacted State Checkpoint: because BKT mastery is a running probability that only the newest value matters for, a compacted topic is a perfect fit — small forever, yet always able to rebuild the processor's in-memory mastery cache from scratch after a restart.

The table below reinforces the six topics just introduced, now that each one's purpose and retention policy has been explained in prose.

| Topic | Key | Partitions | Retention | Purpose |
|---|---|---|---|---|
| `xapi.statements.raw` | `{district_id}:{student_key}` | 48 | 7 days | Live ingest |
| `xapi.statements.bulk` | `{district_id}:{student_key}` | 12 | 7 days | Backfill and replay, isolated from live traffic |
| `xapi.statements.dlq` | `{district_id}` | 12 | 30 days | Tier-1 rejects for the dead-letter inspector |
| `lrs.reconcile` | `{textbook_id}` | 12 | 7 days | Auto-provision and reconciliation tasks |
| `lrs.mastery.state` | `{student_key}:{concept_id}` | 48 | compacted | BKT state checkpoint; survives Redis loss |
| `lrs.audit` | `{district_id}` | 12 | 400 days | Append-only audit feed to the meta-db |

#### Diagram: Kafka Topic Map for the LRS Event Backbone

<iframe src="../../sims/kafka-topic-map/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>Kafka Topic Map for the LRS Event Backbone</summary>
Type: infographic
**sim-id:** kafka-topic-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Let the learner classify each of the six Kafka topics by its key format, partition count, and retention policy, and explain why the compacted mastery-state topic differs structurally from the other five.

Purpose: Show all six topics as nodes arranged around a central "Kafka / Redpanda Broker" hub node, so the learner can see the whole topic inventory at a glance before drilling into any one topic.

Nodes: One central hub node "Kafka / Redpanda Broker". Six satellite nodes, one per topic, each labeled with its exact topic string: "xapi.statements.raw", "xapi.statements.bulk", "xapi.statements.dlq", "lrs.reconcile", "lrs.mastery.state", "lrs.audit". Each satellite node's size scales with its partition count (48-partition topics render larger than 12-partition topics) so partition count is visible without clicking.

Interactive features: Clicking any satellite topic node opens an infobox showing that topic's key format, partition count, retention policy, and one-sentence purpose, matching the table already presented in this chapter. A toggle labeled "Group by retention family" re-colors nodes into three clusters — short-lived (7 days), long-lived (30-400 days), and compacted — so the learner can see the retention pattern structurally rather than by reading text.

Color coding: The compacted mastery-state topic in the book's teal accent color to visually flag it as the one structural outlier; the other five topics in a shared neutral blue-gray, differentiated only by node size (partition count).

Responsive design: Network graph resizes to the width of its containing element and re-centers on resize; on narrow viewports satellite nodes arrange in two rows instead of a full circle around the hub.
</details>

## The ClickHouse Event Log

Every statement that clears tier-one validation and reaches a durable topic eventually lands as one row in a single ClickHouse table. Before looking at its full definition, three column types deserve a plain-language introduction, because the table's `CREATE TABLE` statement leans on all three.

A column declared **`LowCardinality(String)`** tells ClickHouse that a text column has a small, repeating set of distinct values — a district ID or a verb ID repeats across millions of rows — so ClickHouse can store a compact dictionary of the distinct values once and reference them by a small integer everywhere else, shrinking both storage and query time. A column wrapped in **`CODEC(ZSTD(3))`** applies the **ZSTD Compression Codec**, a general-purpose compression algorithm, at compression level 3 (higher levels compress tighter at the cost of more CPU); ClickHouse applies this per-column rather than to the whole row, so a column that compresses unusually well — like the full raw JSON body of a statement — can use a stronger codec than a column that does not. And **`PARTITION BY toYYYYMM(timestamp)`** — the **Partition By Month** strategy — divides the table into one physical partition per calendar month of event time, which matters for a reason explained just after the DDL below.

The bridging idea to hold before reading the DDL: this table, named `lrs.statements` — the **Lrs Statements Table** — is the system of record. Every other table and materialized view in this chapter is derived from it and could, in principle, be rebuilt by replaying it from scratch.

```sql
CREATE TABLE lrs.statements
(
    district_id     LowCardinality(String),
    statement_id    UUID,
    student_key     String,
    verb_id         LowCardinality(String),
    object_type     LowCardinality(String),   -- Page | MicroSim | Question | Concept
    object_id       String,
    textbook_id     LowCardinality(String),
    version_id      LowCardinality(String),
    section_id      String,
    concept_ids     Array(String),
    result_score    Nullable(Float32),
    result_success  Nullable(UInt8),
    duration_ms     Nullable(UInt32),
    voided_by       Nullable(UUID),           -- spec F-3: retraction, never deletion
    provisional     UInt8 DEFAULT 0,          -- object not yet reconciled (spec §5.4)
    timestamp       DateTime64(3),            -- event time, from the statement
    stored_at       DateTime64(3),            -- arrival time, from the gateway
    raw             String CODEC(ZSTD(3))     -- the full original JSON, verbatim
)
ENGINE = ReplacingMergeTree(stored_at)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (district_id, student_key, timestamp, statement_id)
SETTINGS index_granularity = 8192;
```

Two design choices in that statement are worth pulling apart individually because they each solve a different problem. The **ReplacingMergeTree Engine** is a ClickHouse table engine that, given rows sharing the same `ORDER BY` key, keeps only the row with the highest value of the argument passed to it — here, `stored_at`. This is what makes the table tolerant of Kafka's at-least-once delivery guarantee: if the processor crashes after writing a batch but before committing its Kafka offset, the batch is redelivered and re-inserted, and `ReplacingMergeTree` quietly collapses the duplicate rows down to one during a background merge. That merge is eventual rather than immediate, which is why queries against this table read through a `FINAL`-equivalent view rather than trusting that duplicates have already been removed.

The `ORDER BY` clause itself — `(district_id, student_key, timestamp, statement_id)` — is the table's primary key, and leading with `district_id` is deliberate: every tenant-scoped query prunes to one district's data block before scanning a single row, which is what makes Chapter 6's tenant isolation a property of the storage layer, not just the application layer. Combined with **Partition By Month**, retention becomes a partition `DROP` rather than a row-by-row `DELETE` — dropping an entire month's partition is nearly instantaneous, while ClickHouse's built-in `TTL` mechanism cannot express the kind of per-district retention windows Chapter 8 described, so a separate worker process drives retention against a district-to-policy table instead.

!!! mascot-tip "Why `raw` Is Kept Forever"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Notice the `raw` column holds the entire original statement JSON, compressed with the ZSTD Compression Codec, and it is never dropped within the retention window. That single column is what makes "every projection is reproducible by replaying the log" a fact rather than a promise — if a materialized view's logic ever changes, or a bug corrupts a summary vertex, the fix is to replay `raw`, not to reconstruct lost detail from an already-aggregated row.

#### Diagram: ClickHouse `lrs.statements` Table Anatomy

<iframe src="../../sims/clickhouse-statements-anatomy/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>ClickHouse lrs.statements Table Anatomy</summary>
Type: infographic
**sim-id:** clickhouse-statements-anatomy<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, justify

Learning objective: Let the learner click through each column group of the lrs.statements table and explain why the ORDER BY key leads with district_id and student_key rather than timestamp alone.

Canvas layout:

- A vertical table diagram listing all eighteen columns in DDL order, grouped visually into four bands: "Identity & Tenancy" (district_id, statement_id, student_key), "Statement Content" (verb_id, object_type, object_id, textbook_id, version_id, section_id, concept_ids, result_score, result_success, duration_ms), "Lifecycle Flags" (voided_by, provisional), and "Timing & Raw Payload" (timestamp, stored_at, raw)
- A highlighted sidebar showing the ORDER BY tuple as four connected boxes: district_id -> student_key -> timestamp -> statement_id, with an arrow showing "prune, then sort" order

Interactive controls:

- Clicking any column name opens an infobox with its type, a one-sentence purpose, and whether it participates in the ORDER BY key
- A button "Highlight ORDER BY key" dims every column not in the primary key and traces the four-box sidebar sequence
- A button "Highlight compression" isolates the LowCardinality and ZSTD-coded columns and shows a small annotation explaining what each does to storage size

Behavior: Default view shows all four bands at equal visual weight; clicking either highlight button re-renders with the relevant columns emphasized and the rest at reduced opacity.

Color coding: The four column bands each get a distinct muted hue; the ORDER BY sidebar and any column inside it render in the book's teal accent color regardless of which band it belongs to, so the primary key reads as one visual thread through the whole table.

Responsive design: Column bands stack in a single vertical scrolling list on narrow viewports; the ORDER BY sidebar collapses to a horizontal strip above the column list rather than sitting beside it.
</details>

## From Every Statement to One Number Per Grain

The event log answers "what happened," but a dashboard needs "what is true right now" — a single mastery score per student and concept, not a scroll of a thousand raw attempts. ClickHouse gets there through a second table and three materialized views, each doing one specific rollup.

The **Lrs Concept Mastery Table**, `lrs.concept_mastery`, holds the derived state a dashboard actually reads: one row per `(district_id, student_key, concept_id)`, carrying the Bayesian Knowledge Tracing probability Chapter 12 introduced as `mastery_score`, alongside an `evidence_count` and timestamps.

```sql
CREATE TABLE lrs.concept_mastery
(
    district_id    LowCardinality(String),
    student_key    String,
    concept_id     String,
    mastery_score  Float32,          -- P(L) from BKT
    evidence_count UInt32,
    last_seen      DateTime64(3),
    updated_at     DateTime64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (district_id, student_key, concept_id);
```

This table uses the same **ReplacingMergeTree Engine** as the raw event log, for the same reason: the processor writes a fresh `mastery_score` every time new evidence arrives for a student and concept, and only the most recently written row per key should survive.

The three materialized views that follow use a different engine, because they are solving a different problem. A materialized view backed by the **AggregatingMergeTree Engine** does not merely discard duplicates the way `ReplacingMergeTree` does — it incrementally combines rows sharing the same `ORDER BY` key using aggregate functions like `countState()`, `sumState()`, and `avgState()`, so that as new source rows arrive, the view's aggregate rows update automatically without a full recomputation. The two engines solve related but distinct problems, which the table below makes explicit now that both have been described in prose.

| Engine | Dedup or aggregate? | Used by |
|---|---|---|
| ReplacingMergeTree Engine | Keeps only the newest row per key; older duplicates are discarded | `lrs.statements`, `lrs.concept_mastery` |
| AggregatingMergeTree Engine | Incrementally combines rows per key using aggregate functions (count, sum, avg, uniq) | `mv_section_concept_daily`, `mv_student_concept_rollup`, `mv_student_page_rollup` |

The first of the three views, the **Section Concept Daily MV** (`lrs.mv_section_concept_daily`), rolls raw statements up to one row per section, concept, and day — the grain a class-level heatmap reads from.

```sql
CREATE MATERIALIZED VIEW lrs.mv_section_concept_daily
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(day)
ORDER BY (district_id, section_id, concept_id, day)
AS SELECT
    district_id,
    section_id,
    arrayJoin(concept_ids) AS concept_id,
    toDate(timestamp)      AS day,
    countState()           AS events,
    avgState(result_score) AS mean_score,
    uniqState(student_key) AS students
FROM lrs.statements
WHERE section_id != ''
GROUP BY district_id, section_id, concept_id, day;
```

The `uniqState(student_key)` column deserves a second look, because it is not there for descriptive convenience. It computes the distinct count of students contributing to a given section-concept-day grain at aggregation time, which is exactly the group-size figure Chapter 15's privacy filter needs to decide whether a cell is large enough to display safely — computing it here means the filter never has to fall back to scanning raw rows just to answer "how many students is this number based on?"

The second view, the **Student Concept Rollup MV** (`lrs.mv_student_concept_rollup`), is the one that eventually becomes a single `ConceptMastery` vertex in Neo4j — one row per student and concept, with the same `countState()` pattern from Chapter 8 producing `statements_compressed` at no extra cost.

```sql
CREATE MATERIALIZED VIEW lrs.mv_student_concept_rollup
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, concept_id)
AS SELECT
    district_id,
    student_key,
    arrayJoin(concept_ids)     AS concept_id,
    countState()               AS statements_compressed,
    sumState(toUInt32(ifNull(result_success, 0))) AS successes,
    countIfState(result_success IS NOT NULL)      AS attempts,
    avgStateIf(result_score, result_score IS NOT NULL) AS mean_score,
    minState(timestamp)        AS first_seen,
    maxState(timestamp)        AS last_seen
FROM lrs.statements
WHERE voided_by IS NULL AND notEmpty(concept_ids)
GROUP BY district_id, student_key, concept_id;
```

The third, the **Student Page Rollup MV** (`lrs.mv_student_page_rollup`), follows the identical pattern for reading engagement rather than concept mastery — one row per student and page, feeding what becomes a `PageEngagement` vertex.

```sql
CREATE MATERIALIZED VIEW lrs.mv_student_page_rollup
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, object_id)
AS SELECT
    district_id,
    student_key,
    object_id,
    countState()                        AS statements_compressed,
    sumState(toUInt64(ifNull(duration_ms, 0))) AS dwell_ms_total,
    uniqState(toDate(timestamp))        AS revisit_count,
    minState(timestamp)                 AS first_seen,
    maxState(timestamp)                 AS last_seen
FROM lrs.statements
WHERE object_type = 'Page' AND voided_by IS NULL
GROUP BY district_id, student_key, object_id;
```

Both rollups share a `WHERE voided_by IS NULL` clause worth calling out on its own. A voided statement — a retraction, never a deletion, per Chapter 8's F-3 rule — simply drops out of the aggregate on the next merge, and the summarizer's next sync writes the corrected, lower value. Retraction needs no special-case code path anywhere in this schema; it is just another input to what is, at every layer, a pure function of the immutable log.

The list below reinforces the three materialized views just described, matched to the summary-vertex grain each one ultimately feeds.

- **Section Concept Daily MV** — one row per (section, concept, day); feeds class-level heatmaps and the privacy filter's group-size check.
- **Student Concept Rollup MV** — one row per (student, concept); becomes exactly one `ConceptMastery` vertex.
- **Student Page Rollup MV** — one row per (student, page); becomes exactly one `PageEngagement` vertex.

#### Diagram: Materialized Views to Summary Vertex Mapping

<iframe src="../../sims/mv-to-vertex-mapping/main.html" width="100%" height="482px" scrolling="no"></iframe>

<details markdown="1">
<summary>Materialized Views to Summary Vertex Mapping</summary>
Type: workflow
**sim-id:** mv-to-vertex-mapping<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace raw rows in lrs.statements through each of the three materialized views to the specific Neo4j summary vertex label each view feeds, and differentiate the aggregation grain of each path.

Purpose: Show a Mermaid flowchart with one source node fanning out into three parallel aggregation paths that reconverge conceptually at "Summarizer" before terminating in three distinct vertex labels.

Nodes: "lrs.statements (one row per statement)" fans out to three parallel nodes: "mv_section_concept_daily (AggregatingMergeTree, grain: section+concept+day)", "mv_student_concept_rollup (AggregatingMergeTree, grain: student+concept)", "mv_student_page_rollup (AggregatingMergeTree, grain: student+page)". Each feeds into "Summarizer reads changed rows via last_seen watermark" which fans back out to three terminal nodes: "SectionRollup vertex", "ConceptMastery vertex", "PageEngagement vertex".

Interactive features: Every node has a Mermaid click directive opening an infobox with that view's ORDER BY key and the specific aggregate columns it computes. A toggle labeled "Show grain size" annotates each of the three paths with an approximate compression ratio (for example, "~600K statements to ~150K grains") drawn from the chapter's own worked numbers.

Color coding: The three parallel paths render in three distinguishable tints of the book's teal accent color so the learner can visually keep each path separate from source to terminal vertex; the shared "lrs.statements" source and "Summarizer" nodes render in neutral gray to mark them as convergence points.

Responsive design: The three parallel paths stack vertically rather than side-by-side on narrow viewports, each still reading left-to-right from source to vertex.
</details>

## Neo4j Constraints That Enforce the Grain

Chapter 13 explained that summary vertices are upserted rather than inserted. This section shows the exact mechanism that makes that guarantee unbreakable rather than merely intended. A **Grain Uniqueness Constraint** is a Neo4j composite uniqueness constraint declared over the property pair that defines a summary vertex's grain — for `ConceptMastery`, that pair is `(student_key, concept_id)`.

```cypher
CREATE CONSTRAINT mastery_grain IF NOT EXISTS
  FOR (m:ConceptMastery)      REQUIRE (m.student_key, m.concept_id)  IS UNIQUE;
CREATE CONSTRAINT page_engagement_grain IF NOT EXISTS
  FOR (p:PageEngagement)      REQUIRE (p.student_key, p.page_id)     IS UNIQUE;
CREATE CONSTRAINT microsim_engagement_grain IF NOT EXISTS
  FOR (m:MicroSimEngagement)  REQUIRE (m.student_key, m.microsim_id) IS UNIQUE;
CREATE CONSTRAINT question_response_grain IF NOT EXISTS
  FOR (q:QuestionResponse)    REQUIRE (q.student_key, q.question_id) IS UNIQUE;
CREATE CONSTRAINT section_rollup_grain IF NOT EXISTS
  FOR (r:SectionRollup)       REQUIRE (r.section_id, r.concept_id)   IS UNIQUE;
```

Because `(student_key, concept_id)` is declared unique, the summarizer's `MERGE` clause — the Cypher operation that creates a node if no match exists or matches an existing one if it does — is physically incapable of creating a second `ConceptMastery` vertex for a student and concept it has already seen. A bug that somehow tried to write per-statement vertices would not silently grow the graph forever; it would violate the constraint and fail loudly on the very first offending write.

That last sentence is not a hypothetical safeguard — it is the direct enforcement mechanism for the **Statement Label Prohibition**, the design rule stated plainly in the specification: there is deliberately no `:Statement` label and no `:Statement` constraint anywhere in the graph. The specification's C-1 requirement forbids per-statement vertices outright, and `lrs bootstrap --verify` — the deployment-time check Chapter 8 introduced — additionally scans for any node carrying a `:Statement` label and fails the deployment if it finds one. The grain constraints make the violation structurally impossible during normal writes; the bootstrap check catches anything that somehow got through anyway.

!!! mascot-warning "A Constraint Is Not the Same as a Convention"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It would be easy to read Chapter 8's "the graph never holds per-statement vertices" as a coding convention that a careful engineer simply follows. It is not. The Grain Uniqueness Constraint and the Statement Label Prohibition turn that promise into something Neo4j itself refuses to violate, regardless of what any future engineer's code tries to do. When a rule matters enough to protect against a mistake nobody has made yet, push it into the schema — don't leave it in a comment.

One more constraint-like check operates on a relationship type rather than a node label. The `DEPENDS_ON` edges between `Concept` vertices form the learning-graph DAG this entire book has referenced since Chapter 1, and a DAG, by definition, must contain no cycles — a concept cannot depend on itself, even transitively, without breaking every prerequisite computation downstream. The **Concept DAG Acyclicity Check** is the reconciler's responsibility: before it promotes any back-filled `DEPENDS_ON` edge into the graph, it checks whether adding that edge would introduce a cycle, and rejects the batch if it would. Unlike the grain constraints, Neo4j has no built-in syntax for "this relationship type must never form a cycle," so this check is enforced in application code at the one place new `DEPENDS_ON` edges are ever written, rather than at the database layer.

#### Diagram: Grain Constraints and the Statement Label Prohibition

<iframe src="../../sims/grain-constraint-enforcement/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>Grain Constraints and the Statement Label Prohibition</summary>
Type: graph-model
**sim-id:** grain-constraint-enforcement<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: justify, critique

Learning objective: Let the learner simulate a summarizer write attempt against a Grain Uniqueness Constraint and observe why a second write for the same grain upserts rather than duplicates, then contrast that outcome with a hypothetical write carrying a forbidden :Statement label.

Canvas layout:

- A central graph view showing one ConceptMastery node for a sample (student_key, concept_id) pair
- A control panel with two buttons: "Simulate MERGE write (same grain)" and "Simulate write with :Statement label"
- An event log panel below the graph showing the outcome of each simulated write attempt

Interactive controls:

- Button "Simulate MERGE write (same grain)" — animates a second write attempt for the identical (student_key, concept_id) pair; the graph shows the existing node's properties updating in place (mastery_score, evidence_count) rather than a new node appearing, and the event log records "MERGE matched existing grain — properties updated, no new vertex created"
- Button "Simulate write with :Statement label" — animates an attempted write of a per-statement node; the graph flashes the attempted node in red and it fails to attach, and the event log records "REJECTED — :Statement label is prohibited; lrs bootstrap --verify would fail this deployment"
- Button "Reset" — clears the event log and returns the graph to its single starting vertex

Behavior: Each simulated write appends a timestamped line to the event log panel so the learner can review the sequence of attempts and outcomes after several clicks.

Color coding: The legitimate ConceptMastery vertex in the book's teal accent color; the rejected hypothetical :Statement node flashes red before disappearing; the event log's successful entries in teal text and rejected entries in red text.

Responsive design: Control panel and event log stack below the graph view on narrow viewports instead of beside it; the graph canvas resizes to the width of its containing element.
</details>

## Two PostgreSQL Instances, One Hard Boundary

Not every piece of data in this system belongs in ClickHouse or Neo4j. Two small PostgreSQL databases round out the schema, and the design specification is explicit that they must be two separate running instances, not two schemas inside one shared instance.

The **Vault-Db Instance** holds exactly the data that must never leak into an analytics query: the mapping from a roster-provided student identity to that student's pseudonymous `student_key`, the **Per-District Salt** Chapter 13 described, and consent records. It is reachable from exactly one place in the whole architecture — the identity service — and nothing else. The **Meta-Db Instance** holds everything administrative: RBAC grants, the audit log the Audit Feed Topic populates, experiment definitions, export jobs, and retention policy, and it is reachable from the admin API and the analytics API.

Keeping these genuinely separate, rather than two schemas an operator must remember to permission correctly, is what the specification calls a **Network Credential Boundary** — isolation enforced by network reachability and database credentials, not application logic. A shared instance would put the vault one `GRANT` statement away from being readable by the analytics API; two instances require compromising a second, differently credentialed network path entirely.

The table below reinforces the two instances just described, organized by what each one holds and who may reach it.

| Instance | Holds | Reachable from |
|---|---|---|
| `vault-db` | Roster ID ↔ `student_key` mapping, Per-District Salt, consent state | `lrs identity` only |
| `meta-db` | Admin config, RBAC grants, audit log, experiment definitions, export jobs, retention policy | admin-api, analytics-api |

!!! mascot-encourage "Twenty-Two Names, One Structural Idea"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If this chapter's density of exact names feels heavier than most, that is by design — this is the layer where an approximate answer is a wrong answer. But underneath all twenty-two names sits one repeated idea you already know from earlier chapters: raw evidence stays raw and complete in one place, gets compressed exactly once on the way to a second place, and every step in between is guarded by a name, a type, or a constraint that makes the wrong outcome impossible rather than merely unlikely.

## Bringing the Schema Together

Follow one statement through everything this chapter named. A textbook's POST request lands on the **Raw Statements Topic**, or the **Dead Letter Topic** if malformed. A well-formed statement is consumed, pseudonymized, and inserted into the **Lrs Statements Table**, where the **ReplacingMergeTree Engine** absorbs any redelivery, **LowCardinality Type** columns keep repeated strings cheap, the **ZSTD Compression Codec** keeps the raw JSON affordable to retain, and **Partition By Month** makes retention a partition drop. Three views built on the **AggregatingMergeTree Engine** — the **Section Concept Daily MV**, **Student Concept Rollup MV**, and **Student Page Rollup MV** — continuously roll that row into durable grains alongside the **Lrs Concept Mastery Table** a dashboard actually queries. The summarizer writes exactly one summary vertex per grain into Neo4j, and a **Grain Uniqueness Constraint** — backed by the **Statement Label Prohibition** and the **Concept DAG Acyclicity Check** — makes that write structurally incapable of becoming a second vertex, a duplicate, or a cycle. Off to one side, the **Vault-Db Instance** and **Meta-Db Instance**, separated by a real **Network Credential Boundary**, hold the identity mapping and administrative record this pipeline never touches directly. Chapter 8's promise — every projection reproducible by replaying the log — is now a specific set of topic names, table definitions, and constraints, not an abstraction.

## Key Takeaways

- The **Raw Statements Topic**, **Bulk Statements Topic**, **Dead Letter Topic**, **Reconcile Task Topic**, **Mastery State Topic**, and **Audit Feed Topic** are the six Kafka topics named in the design specification, each with its own key format, partition count, and retention policy.
- The **Lrs Statements Table** is the system of record: a **ReplacingMergeTree Engine** table using **LowCardinality Type** columns, the **ZSTD Compression Codec** on its raw payload, and **Partition By Month** for cheap, drop-based retention.
- The **Lrs Concept Mastery Table** holds the derived BKT score a dashboard reads; the **Section Concept Daily MV**, **Student Concept Rollup MV**, and **Student Page Rollup MV** — all built on the **AggregatingMergeTree Engine** — continuously roll raw statements up to their respective grains.
- A **Grain Uniqueness Constraint** on each summary-vertex label makes the summarizer's upsert structurally correct; the **Statement Label Prohibition** and `lrs bootstrap --verify` enforce that no per-statement vertex can ever exist.
- The **Concept DAG Acyclicity Check** is a reconciler-side check, not a database constraint, that rejects any `DEPENDS_ON` back-fill that would introduce a cycle.
- The **Vault-Db Instance** and **Meta-Db Instance** are two separate PostgreSQL instances, not two schemas, connected by a real **Network Credential Boundary** rather than an application-level convention.

!!! mascot-celebration "Every Name Now Has a Row"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Six topics, five tables and views, three engines, and a set of constraints that turn a promise into a physical fact — that is the whole physical schema, and you have now read every piece of it straight from the specification. What does the evidence show? A well-designed schema is the quietest part of a system precisely because it makes entire categories of bugs impossible before a single line of application code runs. In [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md), we pick up the `uniqState(student_key)` column from this chapter's Section Concept Daily MV and follow it into the privacy filter that decides whether a dashboard cell is safe to show.
