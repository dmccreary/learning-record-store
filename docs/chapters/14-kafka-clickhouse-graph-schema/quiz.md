---
title: "Quiz: Kafka Topics, ClickHouse Schema, and Graph Constraints"
description: Review questions on this project's six Kafka topics, the ClickHouse event log and its materialized views, and the Neo4j constraints that enforce the grain and prohibit per-statement vertices.
social:
   cards: false
---
# Quiz: Kafka Topics, ClickHouse Schema, and Graph Constraints

Test your understanding of this project's Kafka topics, ClickHouse schema, and Neo4j constraints with these review questions.

---

#### 1. Why does this project route backfill and replay traffic through a separate Bulk Statements Topic (`xapi.statements.bulk`) rather than the Raw Statements Topic (`xapi.statements.raw`)?

<div class="upper-alpha" markdown>
1. Because bulk statements use a completely different key format than live statements
2. Because the Bulk Statements Topic is retained for 400 days while the Raw Statements Topic is retained for only 7
3. Because the Raw Statements Topic cannot accept more than 12 partitions
4. Because a backfill job sharing the raw topic could starve live ingestion exactly when a district is watching a dashboard update in real time
</div>

??? question "Show Answer"
    The correct answer is **D**. ADR-004's reasoning extends here: a heavy backfill job sharing the live topic could starve real-time ingestion at the exact moment a district is watching a dashboard update. A is false — both topics use the same key format. B misstates both topics' actual retention, which is 7 days each. C is a fabricated partition-count limitation.

    **Concept Tested:** Raw Statements Topic / Bulk Statements Topic

    **See:** [The Six Kafka Topics](index.md#the-six-kafka-topics)

---

#### 2. What happens to a statement that fails tier-one structural validation, such as one missing a required actor field?

<div class="upper-alpha" markdown>
1. It is silently discarded with no record kept anywhere
2. It is stored in the Lrs Statements Table with a null actor field
3. It is written to the Dead Letter Topic, keyed by district_id and retained for 30 days, so a misconfigured textbook's malformed batch can be surfaced later
4. It is automatically corrected by the Reconciliation Worker and re-queued
</div>

??? question "Show Answer"
    The correct answer is **C**. Structurally invalid statements are written to the Dead Letter Topic, keyed by `district_id` and retained for 30 days, giving the dead-letter inspector time to surface a misconfigured textbook's malformed batch. A contradicts the whole purpose of a dead-letter mechanism. B would violate tier-one validation's whole-batch rejection rule. D misapplies the Reconciliation Worker, which handles unrecognized structure, not malformed statements.

    **Concept Tested:** Dead Letter Topic

    **See:** [The Six Kafka Topics](index.md#the-six-kafka-topics)

---

#### 3. Why is the Mastery State Topic (`lrs.mastery.state`) compacted rather than retained for a fixed number of days like the other topics?

<div class="upper-alpha" markdown>
1. Because BKT mastery is a running probability where only the newest value per key matters, so keeping only the latest message per (student_key, concept_id) is exactly what the processor needs to rebuild its cache after a restart
2. Because compaction is required by the xAPI Conformance Suite for all topics carrying student data
3. Because compacted topics use less network bandwidth than time-retained topics
4. Because this topic is never actually written to during normal operation
</div>

??? question "Show Answer"
    The correct answer is **A**. Because only the newest mastery probability per key is ever needed, a compacted topic stays small forever while still letting the processor rebuild its in-memory cache after a restart — the exact mechanism behind the Compacted State Checkpoint. B invents an unrelated conformance requirement. C is an unsupported bandwidth claim. D is false; the topic is written to constantly as evidence arrives.

    **Concept Tested:** Mastery State Topic

    **See:** [The Six Kafka Topics](index.md#the-six-kafka-topics)

---

#### 4. Why does the Lrs Statements Table use the ReplacingMergeTree Engine, keyed on stored_at?

<div class="upper-alpha" markdown>
1. Because it needs to incrementally aggregate counts and sums across many rows sharing a key
2. Because it needs to encrypt the raw JSON payload before writing it to disk
3. Because it needs to reject any row whose statement_id already exists in the table
4. Because it needs to tolerate Kafka's at-least-once delivery guarantee — if a redelivered batch is re-inserted, ReplacingMergeTree collapses the duplicate rows down to one during a background merge
</div>

??? question "Show Answer"
    The correct answer is **D**. ReplacingMergeTree tolerates redelivery by keeping only the row with the highest `stored_at` value for a shared key, quietly collapsing duplicates during a background merge. A describes AggregatingMergeTree's role instead. B invents an encryption function this engine does not perform. C mischaracterizes the engine as rejecting writes outright rather than merging duplicates after the fact.

    **Concept Tested:** Lrs Statements Table / ReplacingMergeTree Engine

    **See:** [The ClickHouse Event Log](index.md#the-clickhouse-event-log)

---

#### 5. What does declaring a column as `LowCardinality(String)` tell ClickHouse to do?

<div class="upper-alpha" markdown>
1. Encrypt the column's contents with a district-specific key
2. Store a compact dictionary of the column's small, repeating set of distinct values and reference them by a small integer, shrinking storage and query time
3. Reject any value longer than 255 characters
4. Automatically compress the column using the ZSTD algorithm at the highest available level
</div>

??? question "Show Answer"
    The correct answer is **B**. `LowCardinality(String)` tells ClickHouse to store a compact dictionary of a column's small, repeating value set and reference entries by a small integer, shrinking both storage and query time. A invents an encryption behavior this type does not provide. C is a fabricated length restriction. D confuses this column type with the separate ZSTD compression codec.

    **Concept Tested:** LowCardinality Type

    **See:** [The ClickHouse Event Log](index.md#the-clickhouse-event-log)

---

#### 6. What does the `raw` column, compressed with the ZSTD Compression Codec, hold in the Lrs Statements Table?

<div class="upper-alpha" markdown>
1. Only the statement's Verb IRI, for fast filtering
2. A derived summary of the statement's mastery evidence
3. The full original statement JSON, verbatim, never dropped within the retention window
4. A hash of the statement used only for deduplication
</div>

??? question "Show Answer"
    The correct answer is **C**. The `raw` column holds the entire original statement JSON verbatim, which is what makes "every projection is reproducible by replaying the log" a fact rather than a promise. A understates the column to a single field. B confuses it with a derived rollup, which this column is not. D confuses it with deduplication, handled separately by `statement_id` and the table's engine.

    **Concept Tested:** ZSTD Compression Codec

    **See:** [The ClickHouse Event Log](index.md#the-clickhouse-event-log)

---

#### 7. A district's retention policy requires deleting statements older than a certain number of months. Why does `PARTITION BY toYYYYMM(timestamp)` make this efficient compared to a row-by-row DELETE?

<div class="upper-alpha" markdown>
1. Because partitioning automatically encrypts old data instead of deleting it
2. Because dropping an entire month's partition is nearly instantaneous, while ClickHouse's built-in TTL mechanism cannot express the kind of per-district retention windows this system needs
3. Because ClickHouse cannot execute DELETE statements under any circumstances
4. Because partitioning by month reduces the number of Kafka topics needed
</div>

??? question "Show Answer"
    The correct answer is **B**. Dropping an entire month's partition is nearly instantaneous compared to deleting rows individually, and because built-in TTL cannot express per-district retention windows, a separate worker process drives retention against a district-to-policy table instead. A invents an encryption behavior unrelated to partitioning. C overstates a real limitation into an absolute one. D confuses table partitioning with an entirely unrelated Kafka concept.

    **Concept Tested:** Partition By Month

    **See:** [The ClickHouse Event Log](index.md#the-clickhouse-event-log)

---

#### 8. The Student Concept Rollup MV needs to keep a running count of statements compressed into each (student, concept) grain, updating automatically as new source rows arrive rather than requiring a full recomputation. Which ClickHouse engine is built for this, and how does it differ from the engine used by the Lrs Statements Table?

<div class="upper-alpha" markdown>
1. AggregatingMergeTree Engine, which incrementally combines rows per key using aggregate functions, unlike ReplacingMergeTree Engine, which only keeps the newest row per key and discards the rest
2. ReplacingMergeTree Engine, the same engine used by the Lrs Statements Table, with no meaningful difference in behavior
3. LowCardinality Type, which is a column type rather than a table engine
4. ZSTD Compression Codec, which only affects storage size, not aggregation behavior
</div>

??? question "Show Answer"
    The correct answer is **A**. AggregatingMergeTree incrementally combines rows sharing a key using functions like `countState()` and `sumState()`, unlike ReplacingMergeTree, which only discards older duplicates rather than aggregating values. B wrongly claims no difference between two engines that solve distinct problems. C and D each name a column-level feature, not a table engine capable of aggregation.

    **Concept Tested:** AggregatingMergeTree Engine

    **See:** [From Every Statement to One Number Per Grain](index.md#from-every-statement-to-one-number-per-grain)

---

#### 9. A future engineer's buggy code attempts to write a second `ConceptMastery` vertex for a (student_key, concept_id) pair that already has one. What actually happens, given the Grain Uniqueness Constraint declared on that label?

<div class="upper-alpha" markdown>
1. Neo4j silently creates the second vertex, and a nightly job later merges the two
2. The write succeeds, but the Analytics API filters out the duplicate before it reaches a dashboard
3. The Reconciliation Worker deletes both vertices and creates a new provisional one
4. The MERGE clause is physically incapable of creating a second vertex for that grain — it matches the existing node and updates its properties instead, or the write fails loudly if it tries to bypass MERGE
</div>

??? question "Show Answer"
    The correct answer is **D**. Because `(student_key, concept_id)` is declared unique, `MERGE` is structurally incapable of creating a second vertex for that grain — it either matches and updates the existing node, or a write that tries to bypass this fails loudly. A, B, and C each invent a silent-duplication or after-the-fact cleanup process that the constraint specifically prevents from ever being needed.

    **Concept Tested:** Grain Uniqueness Constraint

    **See:** [Neo4j Constraints That Enforce the Grain](index.md#neo4j-constraints-that-enforce-the-grain)

---

#### 10. Why is the Concept DAG Acyclicity Check enforced in application code by the reconciler, rather than as a Neo4j database constraint like the Grain Uniqueness Constraints?

<div class="upper-alpha" markdown>
1. Because acyclicity only matters for Concept nodes created before the Reconciliation Worker existed
2. Because Neo4j has no built-in syntax for expressing "this relationship type must never form a cycle," so the check has to run at the one place new DEPENDS_ON edges are written instead
3. Because the reconciler runs faster than Neo4j's own constraint-checking engine
4. Because DEPENDS_ON edges are stored in ClickHouse, not Neo4j, so no graph constraint could apply to them
</div>

??? question "Show Answer"
    The correct answer is **B**. Neo4j has no native syntax for a "never forms a cycle" constraint, so the check is instead enforced in application code, at the one place new `DEPENDS_ON` edges are ever written. A invents an arbitrary time-based exemption. C fabricates a performance comparison the chapter never makes. D is false — `DEPENDS_ON` edges are Neo4j relationships, not ClickHouse rows.

    **Concept Tested:** Concept DAG Acyclicity Check

    **See:** [Neo4j Constraints That Enforce the Grain](index.md#neo4j-constraints-that-enforce-the-grain)

---

#### 11. Why does the design specification require the Vault-Db Instance and Meta-Db Instance to be two separate running PostgreSQL instances rather than two schemas inside one shared instance?

<div class="upper-alpha" markdown>
1. Because a Network Credential Boundary — isolation enforced by network reachability and database credentials, not application logic — means compromising the vault requires compromising a second, differently credentialed network path, not just one accidental GRANT statement
2. Because two schemas would violate Hard Isolation at the District level specifically
3. Because PostgreSQL limits each instance to a single schema
4. Because the Meta-Db Instance must run a different major version of PostgreSQL than the Vault-Db Instance
</div>

??? question "Show Answer"
    The correct answer is **A**. A Network Credential Boundary makes isolation a fact of network reachability and credentials rather than a permission setting, so compromising the vault requires breaching a second, differently credentialed network path entirely. B misapplies Hard Isolation, an unrelated district-scoped guarantee. C is factually false about PostgreSQL. D invents a version-mismatch requirement not described anywhere in the chapter.

    **Concept Tested:** Vault-Db Instance / Meta-Db Instance / Network Credential Boundary

    **See:** [Two PostgreSQL Instances, One Hard Boundary](index.md#two-postgresql-instances-one-hard-boundary)

---

#### 12. Why does the Section Concept Daily MV compute `uniqState(student_key)` as part of its aggregation, rather than leaving that calculation for a later step?

<div class="upper-alpha" markdown>
1. Because uniqState is required syntax for any AggregatingMergeTree materialized view, regardless of whether the count is needed
2. Because it replaces the need for the countState() column entirely
3. Because it lets the privacy filter check a cell's group size directly from the materialized view, without ever having to fall back to scanning raw statement rows
4. Because it is the only way to compute mean_score in ClickHouse
</div>

??? question "Show Answer"
    The correct answer is **C**. Computing the distinct student count at aggregation time gives the privacy filter exactly the group-size figure it needs to decide whether a cell is safe to display, without ever having to scan raw rows. A invents a syntax requirement that does not exist. B is false — `countState()` and `uniqState()` compute different things and both appear in the view. D confuses this column with the unrelated `avgState(result_score)` computation.

    **Concept Tested:** Section Concept Daily MV

    **See:** [From Every Statement to One Number Per Grain](index.md#from-every-statement-to-one-number-per-grain)

---
