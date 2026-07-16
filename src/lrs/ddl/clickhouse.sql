-- ClickHouse DDL — the event log (system of record) and the compression rollups.
-- Lifted from lrs-design-v1.md §6.2 (design lines 413-518) with the fixes named
-- in the plan. Applied by `lrs bootstrap --apply-ddl`, which is idempotent.
--
-- ADR-001: this is the system of record. Neo4j holds structure and compressed
-- summaries only. Every statement lands here; none becomes a graph vertex.

CREATE DATABASE IF NOT EXISTS lrs;

-- ---------------------------------------------------------------------------
-- The immutable statement log (F-1, F-2, T-3)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lrs.statements
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

    -- FIX (plan: "raw column PII hole"). The design specified this column as
    -- "the full original JSON, verbatim" and "kept forever" (design lines 433,
    -- 444). But the original JSON contains actor.account.name, so any reader
    -- with SELECT on this table could run
    --     JSONExtractString(raw, 'actor', 'account', 'name')
    -- and re-identify every student without touching the vault — directly
    -- contradicting §5.2's claim (design line 297) that "nothing downstream of
    -- the processor ever sees anything but the derived key", and defeating
    -- §12.2's "join keys are pseudonyms only".
    --
    -- Resolution: the processor rewrites the actor block to the derived key
    -- BEFORE insert. Everything else in the statement is preserved verbatim, so
    -- C-2 replayability holds for every projection. The actor identity lives in
    -- the vault, which is the only place it was ever supposed to live.
    --
    -- This costs the ability to re-derive student_key under a new pseudonym
    -- scheme. That is already accepted: §5.2 says erasure makes the key
    -- "permanently un-derivable" by deleting the salt.
    --
    -- scripts/smoke.sh --tier=ingest asserts this boundary on every run.
    raw             String CODEC(ZSTD(3))     -- original JSON, actor block pseudonymized
)
ENGINE = ReplacingMergeTree(stored_at)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (district_id, student_key, timestamp, statement_id)
SETTINGS index_granularity = 8192;

-- The FINAL-equivalent read view. Design line 442 says "the API reads through a
-- FINAL-equivalent view" and calls it "a real correctness detail, not a
-- formality" — but never defines it. Without it, an at-least-once redelivery
-- double-counts in every read that isn't a merge-time-lucky FINAL.
CREATE VIEW IF NOT EXISTS lrs.statements_deduped AS
SELECT * FROM lrs.statements FINAL;

-- ---------------------------------------------------------------------------
-- BKT state (F-7, ADR-006)
-- ---------------------------------------------------------------------------
--
-- FIX (plan: "mastery join"). In the design this table exists (lines 449-460)
-- but has no defined writer and no defined reader: §5.3 step 5 says
-- lrs.statements is "the processor's only durable write", step 4 puts BKT state
-- in Redis + a compacted Kafka topic, and §9 says Redis is not backed up. Yet
-- the summarizer's Cypher (line 349) writes `SET m.mastery_score =
-- row.mastery_score` — a column its SELECT (lines 332-340) never produces, and
-- which mv_student_concept_rollup (lines 485-500) never computes. So P(L), the
-- product's central number, would be written to the graph as null forever.
--
-- Resolution: the processor writes here alongside lrs.statements, and the
-- summarizer JOINs this with the rollup. This is clearly the intent — it is why
-- `lrs replay --into concept_mastery` exists (design line 1138).
CREATE TABLE IF NOT EXISTS lrs.concept_mastery
(
    district_id    LowCardinality(String),
    student_key    String,
    concept_id     String,
    mastery_score  Float32,          -- P(L) from BKT (design §3.5)
    evidence_count UInt32,
    last_seen      DateTime64(3),
    updated_at     DateTime64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (district_id, student_key, concept_id);

-- ---------------------------------------------------------------------------
-- The compression rollups — the compressor of ADR-002
-- ---------------------------------------------------------------------------
--
-- Two structural changes from the design, both load-bearing:
--
-- 1. EXPLICIT TARGET TABLES (`TO`), not inline-ENGINE views. The design's MVs
--    are bare insert triggers over an implicit .inner_id.<uuid> table, which
--    cannot be given a skip index and cannot be backfilled without recreating
--    the view. §8.14's "rebuild-and-swap" needs both.
--
-- 2. SimpleAggregateFunction, not AggregateFunction, for last_seen/first_seen.
--    The design wrote `maxState(timestamp) AS last_seen` (line 497) and then
--    filtered `WHERE last_seen >= {watermark:DateTime64}` (line 338). WHERE runs
--    before aggregation, against a raw AggregateFunction(max, DateTime64(3))
--    column — a type error, so the summarizer's incremental read does not
--    compile. Moving it to HAVING maxMerge(...) compiles but full-scans the
--    rollup every 60s, which destroys the "read changed rows only" claim (line
--    330) at 400M rows. SimpleAggregateFunction stores a plain, filterable,
--    indexable value and merges with max() at merge time. Harmless at MVP
--    scale; fatal at the 10k tier.
--
-- Sums rather than avg/count states throughout: mean_score is score_sum /
-- score_count at read time, which keeps every column a plain mergeable scalar
-- and removes an entire class of state-type mismatch.

-- One row per (student, concept). This is what becomes one ConceptMastery vertex.
CREATE TABLE IF NOT EXISTS lrs.student_concept_rollup
(
    district_id           LowCardinality(String),
    student_key           String,
    concept_id            String,
    statements_compressed SimpleAggregateFunction(sum, UInt64),  -- spec C-6
    successes             SimpleAggregateFunction(sum, UInt64),
    attempts              SimpleAggregateFunction(sum, UInt64),
    score_sum             SimpleAggregateFunction(sum, Float64),
    score_count           SimpleAggregateFunction(sum, UInt64),
    first_seen            SimpleAggregateFunction(min, DateTime64(3)),
    last_seen             SimpleAggregateFunction(max, DateTime64(3)),
    -- What actually makes the summarizer's "changed rows only" read cheap:
    -- last_seen is not in the ORDER BY, so without this the watermark filter
    -- scans the whole district partition.
    INDEX idx_last_seen last_seen TYPE minmax GRANULARITY 4
)
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, concept_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS lrs.mv_student_concept_rollup
TO lrs.student_concept_rollup AS
SELECT
    district_id,
    student_key,
    arrayJoin(concept_ids)                        AS concept_id,
    toUInt64(count())                             AS statements_compressed,
    toUInt64(sum(ifNull(result_success, 0)))      AS successes,
    toUInt64(countIf(result_success IS NOT NULL)) AS attempts,
    sum(ifNull(result_score, 0))                  AS score_sum,
    toUInt64(countIf(result_score IS NOT NULL))   AS score_count,
    min(timestamp)                                AS first_seen,
    max(timestamp)                                AS last_seen
FROM lrs.statements
-- A voided statement (F-3) drops out of the rollup automatically and the next
-- sync writes the corrected absolute. Retraction needs no special path — it is
-- just another input to a pure function.
WHERE voided_by IS NULL AND notEmpty(concept_ids)
GROUP BY district_id, student_key, concept_id;

-- One row per (student, page) → one PageEngagement vertex.
CREATE TABLE IF NOT EXISTS lrs.student_page_rollup
(
    district_id           LowCardinality(String),
    student_key           String,
    object_id             String,
    statements_compressed SimpleAggregateFunction(sum, UInt64),
    dwell_ms_total        SimpleAggregateFunction(sum, UInt64),
    revisit_count         AggregateFunction(uniq, Date),
    first_seen            SimpleAggregateFunction(min, DateTime64(3)),
    last_seen             SimpleAggregateFunction(max, DateTime64(3)),
    INDEX idx_last_seen last_seen TYPE minmax GRANULARITY 4
)
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, object_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS lrs.mv_student_page_rollup
TO lrs.student_page_rollup AS
SELECT
    district_id,
    student_key,
    object_id,
    toUInt64(count())                          AS statements_compressed,
    toUInt64(sum(ifNull(duration_ms, 0)))      AS dwell_ms_total,
    uniqState(toDate(timestamp))               AS revisit_count,
    min(timestamp)                             AS first_seen,
    max(timestamp)                             AS last_seen
FROM lrs.statements
WHERE object_type = 'Page' AND voided_by IS NULL
GROUP BY district_id, student_key, object_id;

-- One row per (student, question) → one QuestionResponse vertex.
CREATE TABLE IF NOT EXISTS lrs.student_question_rollup
(
    district_id           LowCardinality(String),
    student_key           String,
    object_id             String,
    statements_compressed SimpleAggregateFunction(sum, UInt64),
    attempts              SimpleAggregateFunction(sum, UInt64),
    successes             SimpleAggregateFunction(sum, UInt64),
    score_sum             SimpleAggregateFunction(sum, Float64),
    score_count           SimpleAggregateFunction(sum, UInt64),
    first_seen            SimpleAggregateFunction(min, DateTime64(3)),
    last_seen             SimpleAggregateFunction(max, DateTime64(3)),
    INDEX idx_last_seen last_seen TYPE minmax GRANULARITY 4
)
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, object_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS lrs.mv_student_question_rollup
TO lrs.student_question_rollup AS
SELECT
    district_id,
    student_key,
    object_id,
    toUInt64(count())                             AS statements_compressed,
    toUInt64(countIf(result_success IS NOT NULL)) AS attempts,
    toUInt64(sum(ifNull(result_success, 0)))      AS successes,
    sum(ifNull(result_score, 0))                  AS score_sum,
    toUInt64(countIf(result_score IS NOT NULL))   AS score_count,
    min(timestamp)                                AS first_seen,
    max(timestamp)                                AS last_seen
FROM lrs.statements
WHERE object_type = 'Question' AND voided_by IS NULL
GROUP BY district_id, student_key, object_id;

-- ---------------------------------------------------------------------------
-- OPEN — needs a decision before step 4 (see the plan / report)
-- ---------------------------------------------------------------------------
--
-- Materialized views fire on the INSERT stream, not on the deduplicated table.
-- ReplacingMergeTree dedup is eventual, at merge time. So a statement
-- redelivered by Kafka (processor crashes after the ClickHouse ack but before
-- the offset commit) is counted TWICE in every rollup above, and the resulting
-- absolute is silently wrong — exactly the failure mode ADR-002 says the
-- absolute-write design exists to prevent.
--
-- lrs.statements_deduped fixes reads. It does not fix the MVs, because they
-- never read the table.
--
-- C-3 does not catch this: re-running the summarizer over an already-inflated
-- rollup is perfectly idempotent. It just materializes the wrong number twice.
--
-- Candidate resolutions:
--   a) Gateway-side dedup on statement_id via Redis SETNX before produce.
--      Cheap, but Redis is "not backed up" (design §9) and a miss reopens it.
--   b) insert_deduplication_token = statement_id on the processor's INSERT.
--      Native, but block-level dedup applies to Replicated* engines only —
--      would force ReplicatedReplacingMergeTree even single-node.
--   c) Accept it and reconcile nightly from lrs.statements_deduped.
--      Cheapest now; means the graph is provably-wrong-but-eventually-right,
--      which contradicts §9's "the graph goes stale but is never wrong".
--
-- Not resolved here because it changes the ingest contract, not just the DDL.
