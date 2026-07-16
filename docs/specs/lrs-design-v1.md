---
title: Learning Record Store — Design & Deployment (v1)
description: The technical design and Docker-based deployment plan that realizes the LRS v1 specification — technology selection, capacity model, component and data design, a single multi-role container image, a one-command docker compose stack, and the production topology.
image: ../img/cover.png
status: scaffold
---

# Learning Record Store — Design & Deployment (v1)

**Companion to:** [LRS Specification v1](./lrs-spec-v1.md)
**Status:** Draft for review · 2026-07-15
**Scope:** How the specified system is actually built, run, and shipped.

---

## 1. Introduction

### 1.1 Relationship to the Specification

The [specification](./lrs-spec-v1.md) says *what* the LRS does: ingest xAPI at scale, model learning as a graph, produce instructor and administrator analytics, and run controlled experiments. This document says *how* — the technology choices, the data structures, the failure behavior, and above all **how it gets deployed**.

Where the two disagree, this document does not quietly diverge. Every deviation is recorded in [§11](#11-deviations-from-the-specification) with its rationale and a proposed amendment to the spec. **Three remain open; two have been closed** by the specification adopting the statement-compression model in its [§5.6](./lrs-spec-v1.md#56-statement-compression) — the spec now states the constraint, and this document states the mechanism.

### 1.2 Design Goals, Derived

The spec's [§1.2](./lrs-spec-v1.md#12-design-principles) design principles translate into these engineering commitments:

| Spec principle | Engineering commitment |
|----------------|------------------------|
| Non-blocking ingestion | The gateway's only hard dependency is the durable queue. Neo4j, ClickHouse, the identity service, and the experiment service may all be down and ingestion still returns `200`. |
| Schema-on-read | Unknown verbs, activities, and versions are written to the log verbatim and provisioned as stubs. Nothing is ever rejected for being unrecognized. |
| Immutable event log | The log is append-only in ClickHouse. Every other store is a **projection** — droppable and rebuildable. This is what makes schema migration tractable ([§8.14](#814-schema-migration-and-projection-rebuild)). |
| Compress before materializing | A ClickHouse rollup compresses ~100 statements into one summary vertex; a `summarizer` role syncs absolutes to the graph ([§5.4](#54-compression-pipeline-summarizer)). No component may write a per-statement vertex, and the graph schema physically prevents it ([§6.3](#63-neo4j-structure)). |
| Graph-native analytics | The concept [Directed Acyclic Graph](../glossary.md#directed-acyclic-graph-dag) (DAG) lives in Neo4j and is the authoring and exploration surface. It is *not* on the hot path for per-student math ([§3.3](#33-adr-003-the-graph-is-not-on-the-hot-path)). |
| Privacy by design | Pseudonymization happens once, at the processing boundary, before anything durable is written to the analytics stores. |

### 1.3 What This Document Decides, and What It Defers

**Decided:** storage split, queue, mastery algorithm, container strategy, deployment topology, schema, privacy enforcement point.

**Deferred, with owners:** graph database licensing for production [High Availability](../glossary.md#high-availability-ha) (HA) ([§13](#13-open-questions)), the columnar store's managed-vs-self-hosted split ([§13](#13-open-questions)), and whether the gateway stays in Python past 100k statements/sec ([§5.1](#51-ingestion-gateway)).

---

## 2. Architecture Overview

### 2.1 Technology Selection

| Plane | Component | Choice | Why |
|-------|-----------|--------|-----|
| Ingestion | Gateway | **Python 3.12 / FastAPI / uvicorn** | Batched xAPI makes the request rate ~100× lower than the statement rate ([§4](#4-capacity-model)). Python is fast enough and keeps one language across the stack. |
| Ingestion | Durable queue | **Redpanda** (dev) / **Kafka** (prod) | The spec's [§5.3](./lrs-spec-v1.md#53-durability-and-ordering) — partitioned, durable, ordered, replayable — *is* the Kafka model. Redpanda is Kafka-API-compatible, single-binary, no ZooKeeper, and starts in a second on a laptop. |
| Processing | Stream workers | **Python + `confluent-kafka`** | Plain consumer loops with batched writes. No Faust, no Spark — the work is per-statement enrichment, not a shuffle. |
| Storage | Event log (system of record) | **ClickHouse** | Append-only, columnar, ~10× compression, sub-second aggregates over billions of rows. This is the statement store. See [Architecture Decision Record](../glossary.md#architecture-decision-record-adr) ADR-001. |
| Storage | Structural graph | **Neo4j 5 Community** (dev) | Tenancy, content, the concept DAG, deployments, experiments. Tens of millions of nodes, not billions. See ADR-002. |
| Storage | [Personally Identifiable Information](../glossary.md#personally-identifiable-information-pii) (PII) vault | **PostgreSQL 16** (isolated instance) | Roster identity ↔ pseudonym mapping. Separate instance, separate credentials, separate network policy — spec [§12.2](./lrs-spec-v1.md#122-security). |
| Storage | Metadata | **PostgreSQL 16** (separate instance) | Admin config, [Role-Based Access Control](../glossary.md#role-based-access-control-rbac) (RBAC), audit log, experiment definitions, job state. |
| Storage | Cache / hot state | **Redis 7** | Mastery vectors, analytics response cache, per-district salt cache, rate limits. |
| Storage | Object store | **MinIO** (dev) / **[Simple Storage Service](../glossary.md#simple-storage-service-s3) (S3)** (prod) | Bulk exports, archival, ClickHouse cold tier. |
| Analytics | [Application Programming Interface](../glossary.md#application-programming-interface-api) (API) | **FastAPI, [Representational State Transfer](../glossary.md#representational-state-transfer-rest) (REST)** | Every report is a fixed shape with a fixed cache key. REST caches and rate-limits cleanly; [GraphQL](../glossary.md#graphql) would not buy anything here. |
| Presentation | Dashboards | **Dash / Plotly** | Mandated by spec [§9](./lrs-spec-v1.md#9-dashboard-specifications-dash-plotly-model). |
| Identity | [Single Sign-On](../glossary.md#single-sign-on-sso) (SSO) | **Keycloak** (dev) / customer [Identity Provider](../glossary.md#identity-provider-idp) (IdP) (prod) | Spec [§10.7](./lrs-spec-v1.md#107-user-access-management-ui) wants [Security Assertion Markup Language](../glossary.md#security-assertion-markup-language-saml) (SAML)/[OpenID Connect](../glossary.md#openid-connect-oidc) (OIDC). Keycloak gives a real OIDC provider in the dev stack. |
| Observability | Traces / metrics | **OpenTelemetry → Jaeger + Prometheus + Grafana** | Spec [§12.4](./lrs-spec-v1.md#124-observability-data-quality) requires end-to-end tracing from receipt to projection. |

### 2.2 Container Topology

```mermaid
graph TB
  subgraph compose["docker compose up — the whole LRS on a laptop"]
    subgraph app["The lrs image — one build, many roles"]
      GW["lrs gateway<br/>:8080"]
      ID["lrs identity<br/>:8086"]
      PR["lrs processor ×3"]
      SM["lrs summarizer<br/>compression §5.6"]
      RC["lrs reconciler"]
      AA["lrs analytics-api<br/>:8081"]
      AD["lrs admin-api<br/>:8083"]
      DA["lrs dashboards<br/>:8050"]
      BS["lrs bootstrap<br/>(run-once)"]
    end

    subgraph stores["Backing services — upstream images"]
      RP[("redpanda<br/>Kafka API :9092")]
      CH[("clickhouse<br/>:8123")]
      N4[("neo4j<br/>:7687")]
      VA[("vault-db<br/>postgres :5433")]
      ME[("meta-db<br/>postgres :5432")]
      RD[("redis :6379")]
      MI[("minio :9002")]
    end
  end

  TB["Intelligent Textbooks"] -->|xAPI| GW
  GW --> RP
  RP --> PR
  ID -.salt.-> PR
  PR -->|every statement| CH
  PR --> RD
  PR -->|provisional structure| N4
  PR -->|reconcile tasks| RC
  RC -->|promote + back-fill| N4
  CH -->|rollups| SM
  SM -->|summary vertices only| N4
  ID --> VA
  AA --> CH
  AA --> N4
  AA --> RD
  AD --> ME
  DA --> AA
  AA --> MI
```

Two shapes matter here.

**The gateway touches only Redpanda.** Everything downstream can fail without dropping a lesson's telemetry — the entire point of spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks).

**No arrow carries events into Neo4j.** Every statement goes to ClickHouse. The only learner data reaching the graph arrives via `CH → SM → N4` — compressed summaries, at ~100:1 (spec [§5.6](./lrs-spec-v1.md#56-statement-compression)). The two other arrows into Neo4j carry *structure*: provisional stubs for never-before-seen content and the reconciler's later promotion of them (spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks)). Nothing on any path writes a per-statement vertex.

---

## 3. Key Design Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | ClickHouse is the system of record for the statement log; the graph holds structure and compressed summaries only | **Accepted** — implements spec [§5.6](./lrs-spec-v1.md#56-statement-compression) |
| ADR-002 | Compression runs as a ClickHouse `AggregatingMergeTree` rollup plus a change-driven graph sync; absolute writes, never increments | **Accepted** — implements spec [§5.6](./lrs-spec-v1.md#56-statement-compression) |
| ADR-003 | Neo4j holds structure, the concept DAG, and summary vertices; the raw log and hot per-student math stay in ClickHouse + Redis | **Accepted** |
| ADR-004 | Queue partition key is `district_id:student_key`, not `district_id`; noisy-neighbor protection via client quotas | **Accepted** — deviates from spec [§5.3](./lrs-spec-v1.md#53-durability-and-ordering) |
| ADR-005 | One container image, many roles, selected by command | **Accepted** — argued in [§8.1](#81-philosophy-one-image-many-roles) |
| ADR-006 | [Bayesian Knowledge Tracing](../glossary.md#bayesian-knowledge-tracing-bkt) (BKT) for concept mastery | **Accepted** |
| ADR-007 | Python across all planes; revisit the gateway above 100k statements/sec | **Accepted, with trigger** — argued in [§5.1](#51-ingestion-gateway) |

ADR-001 and ADR-002 together implement spec [§5.6](./lrs-spec-v1.md#56-statement-compression): **ADR-001 decides where statements live, ADR-002 decides how they are compressed into the graph.** They are the two decisions the rest of the design hangs off. ADR-005 and ADR-007 are argued where they bite rather than here.

### 3.1 ADR-001 — ClickHouse Is the Event Store; the Graph Holds Summaries

**Context.** Spec [§5.6](./lrs-spec-v1.md#56-statement-compression) prohibits per-statement vertices and requires a pipeline that compresses many statements into a single summary vertex per analytical grain. This ADR records where the statements themselves live.

**The numbers behind the prohibition.** At the [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) target — roughly 144 million statements/day ([§4](#4-capacity-model)) — one-to-one materialization would mean ~4.3 billion vertices for a *30-day window alone*, ~13 billion relationships, and a peak write rate of ~50,000 graph mutations/sec. No property-graph engine operates there. And nothing would use it: every report in spec [§7](./lrs-spec-v1.md#7-reports-and-analytical-tools) is an aggregate. R-103 (Time-on-Task) and R-106 (Quiz Item Analysis) look like traversals but are ordered scans and group-bys — the natural shape of a columnar store, not a graph.

**Decision.**

- **ClickHouse is the immutable system of record** for every statement, at full fidelity, including the raw [JavaScript Object Notation](../glossary.md#javascript-object-notation-json) (JSON). It is what F-1, F-2, and T-3 read.
- **Neo4j holds structure** (tenancy, content, the concept DAG, deployments, experiments, reconciliation state) **and the [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) summary vertices** — nothing else.
- The boundary is enforced, not conventional: the graph schema ([§6.3](#63-neo4j-structure)) has no `Statement` label and no constraint that would admit one.

**Consequences.** Statement detail is always one query away — compression discards nothing, it only chooses what to *materialize in the graph*. The Analytics API joins the two stores so a report can show a compressed mastery figure and drill to the individual attempts behind it without the caller knowing there are two stores.

### 3.2 ADR-002 — Compress in ClickHouse, Sync Absolutes to the Graph

**Context.** Spec [§5.6](./lrs-spec-v1.md#56-statement-compression) requires the compression to be incremental (C-2), [idempotent](../glossary.md#idempotent) (C-3), and correct under late arrival (C-4). There are two obvious ways to build it, and one of them is a trap.

**The trap: streaming counter deltas.** The natural design is a windowed aggregator in the processor that emits deltas, applied to the graph as `SET n.count = n.count + $delta`. This breaks C-3. Kafka is at-least-once, so a processor that crashes after emitting a delta but before committing its offset redelivers it — and **increments are not idempotent**, so the counter silently inflates. There is no way to tell afterward that it happened. Every fix (dedup stores, per-vertex watermarks, exactly-once transactions) adds a distributed-state problem to what should be a rollup.

**Decision — recompute absolutes, never increment.**

1. **ClickHouse `AggregatingMergeTree` [materialized views](../glossary.md#materialized-view-mv) (MV) are the compressor.** They maintain each [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) grain incrementally as statements land, fed by the deduplicated insert stream. This is exactly what the engine is built for, and it costs no application state.
2. **A `summarizer` role syncs changed rollups to the graph** on a fixed cadence, reading only rows whose `last_seen` advanced since the last watermark, and writing **absolute values** via batched `UNWIND ... MERGE ... SET`.

**Why this satisfies every [§5.6](./lrs-spec-v1.md#56-statement-compression) requirement, mostly for free:**

| Requirement | How |
|---|---|
| C-2 reproducible | The MV is a pure function of the log. Reset the watermark to zero and the entire graph rebuilds — that *is* the replay path ([§7.4](#74-idempotency-and-replay)). |
| C-3 idempotent | Writing an absolute value twice is a no-op. Redelivery, retry, and replay are all safe by construction, not by bookkeeping. |
| C-4 late arrival | A late statement updates the MV, which bumps `last_seen`, which the next sync picks up. **Out-of-order is solved for free** — there is no window to have closed. |
| C-5 lag metric | `now() - watermark` is the freshness lag, directly. |
| C-6 ratio observable | `statements_compressed` is a `countMerge()` on the rollup, carried onto the vertex. |

**Consequences.** Graph freshness is bounded by the sync cadence (default 60s) rather than being real-time — acceptable, because spec [§9](./lrs-spec-v1.md#9-dashboard-specifications-dash-plotly-model)'s budget is about *query* latency, not freshness, and [§13](#13-open-questions)'s real-time nudges would read ClickHouse and Redis directly rather than the graph. In exchange, the hardest correctness problems in the pipeline stop existing.

### 3.3 ADR-003 — The Graph Is Not on the Hot Path

Even compressed, `ConceptMastery` at (student, concept) grain is ~400 million vertices at fleet scale (5M students × ~80 touched concepts). That is affordable to *store* but not somewhere to do per-request math.

The insight: **the concept DAG is tiny — about 200 nodes per textbook.** Prerequisite gap analysis (R-105) does not need a graph database to traverse 200 nodes. It needs the student's 200-float mastery vector (one ClickHouse point lookup or a Redis hash hit) plus the DAG, which fits in the API process's memory and changes only when a textbook is published.

**Decision.** The graph is the **authoring, exploration, and structural-integrity** surface — T-2's Learning-Graph Explorer, reconciliation, deployment binding, and the compressed summaries that make a concept node answer "how is my class doing on this?". Hot per-student math is served from ClickHouse and Redis. The summary vertices exist so the graph can answer *graph-shaped* questions; they are not the read path for a 40-student heatmap.

### 3.4 ADR-004 — Partition by `district_id:student_key`

Spec [§5.3](./lrs-spec-v1.md#53-durability-and-ordering) says partition by `district_id`, sub-keyed by `student_key`. A single Kafka partition takes all of one key's traffic, so keying by `district_id` puts a 200,000-student district onto one partition — a guaranteed hotspot, and precisely the "single-tenant hotspot" [§12.1](./lrs-spec-v1.md#121-scale-availability) forbids.

What the spec actually *requires* is **per-learner ordering** ([§5.3](./lrs-spec-v1.md#53-durability-and-ordering)) and **no cross-tenant interference** ([§12.1](./lrs-spec-v1.md#121-scale-availability)). Both are obtainable without district-level partitioning:

- **Key = `{district_id}:{student_key}`** → per-learner ordering is guaranteed by Kafka's per-partition ordering, and traffic spreads evenly across all partitions by construction.
- **Noisy-neighbor protection via Kafka client quotas** per district principal — a byte-rate ceiling enforced at the broker. This is stronger than partition isolation, because it bounds a district's *throughput*, not just its *placement*.
- **A separate `xapi.statements.bulk` topic** for backfill and replay, so a district's re-import never competes with live classroom traffic.

### 3.5 ADR-006 — Bayesian Knowledge Tracing for Mastery

Spec F-7 requires maintaining `ConceptMastery` from mixed evidence without saying how. Candidates: weighted moving average, [Elo](../glossary.md#elo-rating-system), [Item Response Theory](../glossary.md#item-response-theory-irt) (IRT), BKT.

**BKT wins on three counts that matter here:** its update is O(1) with a single float of state per (student, concept), which is exactly what a stream processor can afford at 10k events/sec; it is the standard model in intelligent tutoring systems, so its parameters are interpretable and its literature is deep; and its output is a probability, which is honest to show a teacher ("78% likely to have mastered this") in a way an unscaled Elo number is not.

Given prior mastery probability \(P(L_n)\) and per-concept parameters \(p_{slip}\), \(p_{guess}\), \(p_{transit}\):

**Step 1 — condition on the evidence.**

$$P(L_n \mid \text{correct}) = \frac{P(L_n)(1 - p_{slip})}{P(L_n)(1 - p_{slip}) + (1 - P(L_n)) \, p_{guess}}$$

$$P(L_n \mid \text{incorrect}) = \frac{P(L_n) \, p_{slip}}{P(L_n) \, p_{slip} + (1 - P(L_n))(1 - p_{guess})}$$

**Step 2 — apply the learning transition.**

$$P(L_{n+1}) = P(L_n \mid \text{evidence}) + \left(1 - P(L_n \mid \text{evidence})\right) p_{transit}$$

Non-binary evidence (dwell time, MicroSim interaction depth) is mapped to a soft correctness in \([0,1]\) and blended, with a lower evidence weight than a graded response — reading a page is weak evidence of mastery and the model should say so. Parameters are fit per concept nightly by an offline job over the ClickHouse log; until a concept has enough data, it inherits its taxonomy category's priors.

**Open:** this section names the soft-correctness mapping but does not yet assign it an owner or a location — see Open Question 7 ([§13](#13-open-questions)).

---

## 4. Capacity Model

Everything downstream — partition counts, disk, instance sizing, and ADR-001 itself — falls out of this table. School telemetry is diurnal and bursty, not flat, so a naive "10,000 × 86,400" overstates daily volume by ~6×.

| Quantity | Value | Derivation |
|----------|-------|------------|
| Peak sustained ingest | 10,000 stmt/sec | Spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) |
| Burst | 50,000 stmt/sec | Spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) — period-boundary spikes |
| Mean statement size | ~1.5 KB | xAPI JSON with `context.contextActivities` |
| Active window | ~10 h/day | US class hours across four time zones |
| Duty cycle within window | ~40% of peak | Spikes at period boundaries, dead time between |
| **Statements/day** | **~144 M** | 10,000 × 0.40 × 36,000 s |
| Raw JSON/day | ~216 GB | 144M × 1.5 KB |
| Kafka disk/day (zstd ≈4×, [Replication Factor](../glossary.md#replication-factor-rf) (RF)=3) | ~162 GB | 216 GB ÷ 4 × 3 |
| Kafka disk @ 7-day retention | **~1.1 TB** | The log is *not* the SoR; 7 days is a replay buffer |
| ClickHouse/day (columnar ≈10×) | ~22 GB | 216 GB ÷ 10 |
| ClickHouse/180-day school year | ~4 TB | ×180 |
| ClickHouse @ 7-year retention | **~28 TB** | Tiered to S3 after 13 months |
| [Hypertext Transfer Protocol](../glossary.md#hypertext-transfer-protocol-http) (HTTP) requests/sec at peak | **~100–400** | 10k ÷ batch size of 25–100 |
| Graph writes/sec **if statements were materialized** | ~50,000 | 10k × ~4 edges — what spec [§5.6](./lrs-spec-v1.md#56-statement-compression) prohibits |
| Neo4j structural nodes | ~10–15 M | Districts, schools, sections, students, content, concepts |
| ClickHouse `concept_mastery` rows | ~400 M | 5M students × ~80 touched concepts — trivial for ClickHouse |

Two numbers do the most work here. **Requests/sec ≈ 100–400, not 10,000** — because xAPI batches — is what makes a Python gateway viable (ADR-007). And **50,000 graph writes/sec** is what spec [§5.6](./lrs-spec-v1.md#56-statement-compression) exists to prevent.

### 4.1 The Compression Math

Compression has two distinct ratios, and conflating them is how people get this wrong.

**Storage compression** — how many statements collapse into one vertex, over its lifetime:

| Grain | Statements per vertex | Ratio |
|-------|----------------------|-------|
| `PageEngagement` (student, page) | ~20–60 views, scrolls, dwell pings | **~40:1** |
| `ConceptMastery` (student, concept) | ~50–200 evidence events | **~100:1** |
| `MicroSimEngagement` (student, microsim) | ~30–100 interactions | **~60:1** |
| `QuestionResponse` (student, question) | ~1–5 attempts | **~3:1** |
| `SectionRollup` (section, concept) | 30 students × ~100 events | **~3,000:1** |

This ratio is **unbounded over time** — a student's 500th visit to a page updates the same vertex. The vertex count is set by *distinct pairs that ever existed*, not by statement volume, so the graph stops growing while ingest continues.

**Write-rate compression** — how many graph upserts per second, which is what actually protects Neo4j. This is set by *distinct active grains per sync window*, so it is a function of the sync cadence:

| Sync cadence | Statements coalesced | Distinct active grains | Graph upserts/sec | Graph lag |
|--------------|---------------------|------------------------|-------------------|-----------|
| 5 s | 50 K | ~50 K | ~10,000 | 5 s |
| **60 s (default)** | **600 K** | **~150 K** | **~2,500** | **60 s** |
| 300 s | 3 M | ~300 K | ~1,000 | 5 min |

Derived from ~100,000 concurrent active students at peak (10,000 stmt/sec ÷ ~0.1 stmt/sec/student), each touching ~1.5 distinct objects per minute. **60 s is the default**: ~2,500 batched upserts/sec is comfortable for Neo4j via `UNWIND`, and a minute of graph lag is invisible on a dashboard.

**The property that matters most is not the ratio — it's the insensitivity.** A burst to 50,000 statements/sec ([§5.5](./lrs-spec-v1.md#55-backpressure-and-scale)) means each active student emits *more* events; it does not create five times as many students. Distinct active grains barely move, so **the graph write rate stays ~2,500/sec through a 5× ingest burst.** The compressor absorbs it entirely. That is why spec [§5.6](./lrs-spec-v1.md#56-statement-compression) makes the burst target survivable rather than merely aspirational.

---

## 5. Component Design

### 5.1 Ingestion Gateway

*Role:* `lrs gateway` · *Scales on:* [Central Processing Unit](../glossary.md#central-processing-unit-cpu) (CPU) and request rate · *Hard dependencies:* Kafka only

Per request:

1. **AuthN** — validate the per-textbook or per-district bearer token (spec [§10.5](./lrs-spec-v1.md#105-xapi-endpoint-credentials-ui)). Token → `district_id` mapping is cached in Redis with a 60s [Time to Live](../glossary.md#time-to-live-ttl) (TTL); **on Redis failure, fall back to a local [Least Recently Used](../glossary.md#least-recently-used-lru) (LRU) cache and keep serving.** Auth must not become an ingestion dependency.
2. **Tier-1 structural validation** (spec [§5.2](./lrs-spec-v1.md#52-statement-validation)) — well-formed JSON, required `actor` / `verb` / `object`, parseable [ISO 8601](../glossary.md#iso-8601) timestamp. Per xAPI conformance, a batch is **all-or-nothing**: one malformed statement rejects the whole `POST` with `400` and stores none of it.
3. **Assign identifiers** — mint `statement_id` (UUIDv7, so it sorts by time) if the client did not supply one; stamp `stored_at`.
4. **Produce to Kafka** with `acks=all`, keyed `{district_id}:{student_key_raw}`.
5. **Respond** — `200` with the array of statement IDs (`POST`), `204` (`PUT`). Spec [§5.1](./lrs-spec-v1.md#51-endpoint): this happens after the *durable queue* ack, never after projection.

Backpressure (spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale)) is applied by the producer's local queue, never by rejecting a producer. Only when the local queue is full *and* the broker is unreachable does the gateway return `503` with `Retry-After` — and it emits a page-worthy alert when it does.

> **The Python trigger (ADR-007).** At ~400 req/sec across ~6 gateway pods this is comfortable. If real-world batch sizes turn out to be 1 (a textbook that fires each event immediately), the request rate becomes 10,000/sec and the gateway — and only the gateway — moves to Go. It is ~400 lines with no business logic, which is why we can afford to defer this.

### 5.2 Identity Service & Pseudonymization

*Role:* `lrs identity` · *Hard dependencies:* vault-db

$$\text{student\_key} = \text{base32}\left(\text{HMAC-SHA256}\left(\text{salt}_{district},\ \texttt{homePage} \,\|\, \texttt{name}\right)[0{:}16]\right)$$

A **per-district salt** means the same learner in two districts derives two unrelated keys, so cross-district correlation is impossible without vault access. That is what makes spec [§3.2](./lrs-spec-v1.md#32-isolation-requirements)'s "hard" district isolation hold even against a compromised analytics reader.

**Where the [Hash-Based Message Authentication Code](../glossary.md#hash-based-message-authentication-code-hmac) (HMAC) runs.** Processors fetch per-district salts over [Mutual TLS](../glossary.md#transport-layer-security-tls) (mTLS) and compute the HMAC locally, caching salts in memory only, never on disk. The alternative — a `resolve()` network hop per statement — costs 10,000 [Requests Per Second](../glossary.md#requests-per-second-rps) (RPS) of pure overhead.

The security reasoning that permits this: **the processor already sees the raw actor identity**, because it is in the statement body. Giving it the salt adds no exposure it does not already have. The vault boundary exists to stop *analytics and dashboard readers* from re-identifying, and that boundary is untouched — nothing downstream of the processor ever sees anything but the derived key.

Erasure (spec F-12, [§12.3](./lrs-spec-v1.md#123-privacy-compliance)) deletes the vault mapping row and purges matching ClickHouse rows. Because the salt is per-district and the mapping is gone, the key becomes permanently un-derivable — the de-identified aggregates that survive are genuinely de-identified.

### 5.3 Stream Processor

*Role:* `lrs processor` · *Scales on:* Kafka consumer lag ([Kubernetes Event-Driven Autoscaling](../glossary.md#kubernetes-event-driven-autoscaling-keda) (KEDA) in prod)

Consumes `xapi.statements.raw` in batches of up to 1,000 or 200 ms, whichever comes first:

1. **Pseudonymize** — resolve actor → `student_key` ([§5.2](#52-identity-service-pseudonymization)).
2. **Resolve activities** (F-5) — map object [Internationalized Resource Identifiers](../glossary.md#internationalized-resource-identifier-iri) (IRIs) to graph nodes via a Redis-cached lookup. **On a miss, do not block:** emit an auto-provision task to `lrs.reconcile` and carry on with the IRI as the identifier. This is spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks)'s accept-first mechanism, and it is the reason a textbook can ship an hour before its metadata.
3. **Enrich** — attach `section_id`, `version_id`, and the `concept_ids` the object covers, from the cached structural graph.
4. **Score mastery** (F-7) — BKT update per (student, concept); state read/written through Redis, checkpointed to the compacted `lrs.mastery.state` topic.
5. **Write** — batched `INSERT` to ClickHouse (async inserts on, one round trip per batch). **This is the processor's only durable write.** It does not touch the graph for events; compression and graph materialization are the summarizer's job ([§5.4](#54-compression-pipeline-summarizer)).
6. **Commit** the Kafka offset only after the ClickHouse write acks.

At-least-once delivery plus a `ReplacingMergeTree` keyed on `statement_id` gives effective idempotency (spec [§5.3](./lrs-spec-v1.md#53-durability-and-ordering)). Ordering is per-partition, and projections are **timestamp-driven, not arrival-driven**, so out-of-order arrival is a non-event.

The one exception to "no graph writes": auto-provisioning a **structural** stub for a never-before-seen textbook or activity (spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks)) does `MERGE` into Neo4j. That is structure, not an event, and it happens once per new object rather than once per statement.

> **Why BKT still sees events in order.** Sequential Bayesian updates do not commute — the same evidence in a different order yields a different posterior. ADR-004's `district_id:student_key` partition key is what makes this correct: all of one learner's statements land on one partition and are consumed in order, so BKT sees them in order in the common case. For arrivals late enough to fall outside that guarantee, a late-arrival detector enqueues a targeted `lrs replay --student X --concept Y`, which recomputes exactly from the ordered log. The partition key is load-bearing for mastery correctness, not just for throughput.

### 5.4 Compression Pipeline (Summarizer)

*Role:* `lrs summarizer` · Implements spec [§5.6](./lrs-spec-v1.md#56-statement-compression) and F-7b · *Cadence:* 60 s (configurable)

This is the component that keeps the graph small. It has two halves, and neither of them holds application state.

**Half one — the compressor, in ClickHouse.** An `AggregatingMergeTree` materialized view per [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) grain ([§6.2](#62-clickhouse-the-event-log)). ClickHouse maintains these incrementally as statements land, off the deduplicated insert stream. There is no windowing code, no state store, and no watermark bookkeeping in the application, because the database already does this correctly.

**Half two — the graph sync, in the summarizer.** Every 60 s, per grain:

1. Read the **changed rows only** — those whose `last_seen` advanced past the stored watermark:
   ```sql
   SELECT student_key, concept_id,
          countMerge(statements_compressed) AS statements_compressed,
          avgMerge(mean_score)              AS mean_score,
          maxMerge(last_seen)               AS last_seen
   FROM lrs.mv_student_concept_rollup
   WHERE district_id = {district:String}
     AND last_seen  >= {watermark:DateTime64}
   GROUP BY student_key, concept_id
   ```
2. Write **absolute values** into the graph, batched:
   ```cypher
   UNWIND $rows AS row
   MERGE (s:Student {student_key: row.student_key})
   MERGE (c:Concept {concept_id: row.concept_id})
   MERGE (s)-[:HAS_MASTERY]->(m:ConceptMastery {student_key: row.student_key,
                                                concept_id:  row.concept_id})
   MERGE (m)-[:OF_CONCEPT]->(c)
   SET m.mastery_score         = row.mastery_score,
       m.statements_compressed = row.statements_compressed,   // absolute, never +=
       m.last_seen             = row.last_seen,
       m.updated_at            = $sync_time
   ```
3. Advance the watermark **only after** the batch commits. A crash mid-batch re-syncs the same rows next cycle, which is harmless — that is what C-3 buys.

**`SET`, never `+=`.** Every counter on a summary vertex is an absolute recomputed from the log. This single constraint is what makes the pipeline idempotent, replayable, and correct under redelivery, and it is why the trap in ADR-002 is worth naming explicitly: the increment version of this code looks identical and is silently wrong.

**Replay is not a special path.** `lrs replay --rebuild-graph` resets the watermark to zero and lets the normal sync loop run. The graph rebuilds itself from the log using the same code that maintains it — so the recovery path is exercised every 60 seconds in production, rather than being a script nobody has run since the last incident.

**Backpressure.** If graph writes fall behind, the watermark simply advances more slowly and lag rises (C-5, alerted at 5 min). It never applies backpressure to ingestion — the summarizer is a reader of ClickHouse, and there is no path from a slow graph to a dropped statement.

### 5.5 Reconciliation Worker

*Role:* `lrs reconciler` · Implements spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks) and F-10.

Consumes `lrs.reconcile`, and on a schedule re-scans provisional nodes. For each, it attempts to match the provisional stub against published textbook metadata (the learning graph, the MicroSim registry) by `git_sha`, then by IRI path, then by title similarity. A confident match promotes the node to `provisional: false` and back-fills `COVERS`, `EMBEDS`, and `DEPENDS_ON`. An ambiguous match lands in the admin queue (spec [§10.4](./lrs-spec-v1.md#104-textbook-deployment-management-ui)).

The property that makes this safe: **statements that arrived before reconciliation become fully queryable the moment it completes** — retroactively, with no reprocessing, because enrichment resolves `concept_ids` at *query* time through the graph for provisional objects, and the back-fill is what populates that mapping. Nothing was lost; it was only ever unlabeled.

### 5.6 Experiment Service

*Role:* served in-process by the analytics and admin APIs · Implements spec [§8](./lrs-spec-v1.md#8-experimentation-ab-testing-subsystem).

$$\text{bucket} = \text{xxhash64}\left(\texttt{experiment\_id} \,\|\, \text{':'} \,\|\, \texttt{unit\_id}\right) \bmod 10{,}000$$

The bucket is **deterministic and permanent** — it is a pure function, stored nowhere, and never recomputed differently. The *bucket → variant* map is versioned, and **ramping may only extend treatment ranges upward**, so a student can move control → treatment but never treatment → control. That is what makes stickiness (spec [§8.2](./lrs-spec-v1.md#82-assignment)) survive an allocation change. `ASSIGNED_TO` is `MERGE`d once for analysis and sample-ratio-mismatch checks, never updated.

Two spec [§8.2](./lrs-spec-v1.md#82-assignment) rules are enforced here rather than trusted to callers: a district with the experimentation opt-out flag always resolves to control, and **if the service errors, the caller serves control and records the event anyway.** Assignment never gates the stream.

### 5.7 Analytics API

*Role:* `lrs analytics-api` · Serves spec [§7](./lrs-spec-v1.md#7-reports-and-analytical-tools) and [§11](./lrs-spec-v1.md#11-apis).

One REST endpoint per report ID (`GET /v1/reports/R-201?section_id=…&from=…&to=…`), which makes every response a fixed shape with a computable cache key: `(report_id, tenant, params, data_version)` in Redis. `data_version` is bumped by the processor's watermark, so cache invalidation is a consequence of ingestion rather than a TTL guess.

Every response passes through **one** privacy filter ([§7.2](#72-privacy-enforcement)) — a single choke point, so no report can forget.

The spec [§9.3](./lrs-spec-v1.md#93-interaction-requirements) budget of ≤2s at the [Ninety-Fifth Percentile](../glossary.md#ninety-fifth-percentile-p95) (P95) is met by never touching raw statements on a dashboard path: figures read pre-aggregated ClickHouse materialized views and Redis-cached mastery vectors. Raw statement access is confined to T-3 (the Query Console) and the Export API, both of which are explicitly async.

### 5.8 Dash Dashboards

*Role:* `lrs dashboards` · Implements spec [§9](./lrs-spec-v1.md#9-dashboard-specifications-dash-plotly-model).

A multi-page Dash app; filter state in `dcc.Store` (survives tab switches, per spec [§9.2](./lrs-spec-v1.md#92-component-mapping)); every callback calls the Analytics API rather than any database directly, so the privacy filter cannot be bypassed by a figure. Long-running exports use Dash background callbacks on a Redis/Celery queue. Cross-filtering ([§9.3](./lrs-spec-v1.md#93-interaction-requirements)) is `clickData` → callback → re-query.

---

## 6. Data Design

### 6.1 Kafka Topics

| Topic | Key | Partitions | Retention | Purpose |
|-------|-----|-----------|-----------|---------|
| `xapi.statements.raw` | `{district_id}:{student_key}` | 48 | 7 days | Live ingest. 10k ÷ 48 ≈ 208 stmt/sec/partition. |
| `xapi.statements.bulk` | same | 12 | 7 days | Backfill and replay — isolated from live traffic (ADR-004). |
| `xapi.statements.dlq` | `{district_id}` | 12 | 30 days | Tier-1 rejects, for the dead-letter inspector (spec [§10.5](./lrs-spec-v1.md#105-xapi-endpoint-credentials-ui)). |
| `lrs.reconcile` | `{textbook_id}` | 12 | 7 days | Auto-provision and reconciliation tasks (spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks)). |
| `lrs.mastery.state` | `{student_key}:{concept_id}` | 48 | **compacted** | BKT state checkpoint; survives Redis loss. |
| `lrs.audit` | `{district_id}` | 12 | 400 days | Append-only audit feed → meta-db (spec [§10.9](./lrs-spec-v1.md#109-audit-monitoring-ui)). |

### 6.2 ClickHouse — The Event Log

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

- **`ORDER BY` leads with `district_id`** — every tenant-scoped query prunes on the primary key, and no query can accidentally scan another district's data.
- **`ReplacingMergeTree` keyed on the sort key** dedupes replayed statements. Deduplication is *eventual*, at merge time, so the API reads through a `FINAL`-equivalent view. This is a real correctness detail, not a formality: without it, an at-least-once redelivery double-counts.
- **`PARTITION BY toYYYYMM`** makes retention (spec F-12) a partition `DROP` rather than a mutation. Per-district retention windows are driven by a worker against a district→policy table, because ClickHouse `TTL` cannot express per-tenant windows.
- **`raw` is kept forever** (within retention). It is what makes [§12.4](./lrs-spec-v1.md#124-observability-data-quality)'s "every projection is reproducible by replaying the log" true rather than aspirational.

Derived state and the hot aggregates:

```sql
CREATE TABLE lrs.concept_mastery
(
    district_id    LowCardinality(String),
    student_key    String,
    concept_id     String,
    mastery_score  Float32,          -- P(L) from BKT (§3.5)
    evidence_count UInt32,
    last_seen      DateTime64(3),
    updated_at     DateTime64(3)
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (district_id, student_key, concept_id);

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
    uniqState(student_key) AS students   -- feeds the §7.2 threshold check
FROM lrs.statements
WHERE section_id != ''
GROUP BY district_id, section_id, concept_id, day;
```

`uniqState(student_key)` is not incidental — it is the group size the privacy filter needs ([§7.2](#72-privacy-enforcement)), computed at aggregation time so the filter never has to go back to raw rows to find out whether it may show a cell.

**The compression rollups.** These are the compressor of ADR-002 — one materialized view per [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) grain. ClickHouse maintains them incrementally; the summarizer only reads them.

```sql
-- One row per (student, concept). This is what becomes one ConceptMastery vertex.
CREATE MATERIALIZED VIEW lrs.mv_student_concept_rollup
ENGINE = AggregatingMergeTree()
ORDER BY (district_id, student_key, concept_id)
AS SELECT
    district_id,
    student_key,
    arrayJoin(concept_ids)     AS concept_id,
    countState()               AS statements_compressed,  -- spec C-6, verbatim
    sumState(toUInt32(ifNull(result_success, 0))) AS successes,
    countIfState(result_success IS NOT NULL)      AS attempts,
    avgStateIf(result_score, result_score IS NOT NULL) AS mean_score,
    minState(timestamp)        AS first_seen,
    maxState(timestamp)        AS last_seen        -- the summarizer's watermark column
FROM lrs.statements
WHERE voided_by IS NULL AND notEmpty(concept_ids)
GROUP BY district_id, student_key, concept_id;

-- One row per (student, page) → one PageEngagement vertex.
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

Three things to notice:

- **`countState()` *is* `statements_compressed`.** Spec C-6 asks for the compression ratio to be observable per grain; it falls out of the rollup at zero cost and rides onto the vertex, so every mastery figure in the product carries its own evidence count.
- **`maxState(timestamp) AS last_seen` is the sync watermark.** It is the only column the summarizer needs to find changed rows, which is what makes the graph sync incremental rather than a full scan.
- **`WHERE voided_by IS NULL`** means a voided statement (F-3) drops out of the rollup automatically, and the next sync writes the corrected absolute. Retraction needs no special path — it is just another input to a pure function.

### 6.3 Neo4j — Structure

```cypher
// Tenancy and identity
CREATE CONSTRAINT district_id  IF NOT EXISTS FOR (d:District)  REQUIRE d.district_id  IS UNIQUE;
CREATE CONSTRAINT school_id    IF NOT EXISTS FOR (s:School)    REQUIRE s.school_id    IS UNIQUE;
CREATE CONSTRAINT section_id   IF NOT EXISTS FOR (s:Section)   REQUIRE s.section_id   IS UNIQUE;
CREATE CONSTRAINT student_key  IF NOT EXISTS FOR (s:Student)   REQUIRE s.student_key  IS UNIQUE;

// Content
CREATE CONSTRAINT textbook_id  IF NOT EXISTS FOR (t:Textbook)        REQUIRE t.textbook_id IS UNIQUE;
CREATE CONSTRAINT version_id   IF NOT EXISTS FOR (v:TextbookVersion) REQUIRE v.version_id  IS UNIQUE;
CREATE CONSTRAINT page_id      IF NOT EXISTS FOR (p:Page)            REQUIRE p.page_id     IS UNIQUE;
CREATE CONSTRAINT microsim_id  IF NOT EXISTS FOR (m:MicroSim)        REQUIRE m.microsim_id IS UNIQUE;
CREATE CONSTRAINT concept_id   IF NOT EXISTS FOR (c:Concept)         REQUIRE c.concept_id  IS UNIQUE;

// Experiments
CREATE CONSTRAINT experiment_id IF NOT EXISTS FOR (e:Experiment) REQUIRE e.experiment_id IS UNIQUE;
CREATE CONSTRAINT variant_id    IF NOT EXISTS FOR (v:Variant)    REQUIRE v.variant_id    IS UNIQUE;

// The reconciliation work queue (spec §5.4, §10.4) is an index, not a scan
CREATE INDEX provisional_nodes IF NOT EXISTS FOR (n:Textbook) ON (n.provisional);

// ---- Summary vertices (spec §4.3) — one per analytical grain, never per statement ----
// The composite key IS the grain. The constraint is what makes the summarizer's
// MERGE an upsert rather than an insert, and it is what physically prevents a
// second vertex from ever existing for the same grain.
CREATE CONSTRAINT mastery_grain IF NOT EXISTS
  FOR (m:ConceptMastery)      REQUIRE (m.student_key, m.concept_id)  IS UNIQUE;
CREATE CONSTRAINT page_engagement_grain IF NOT EXISTS
  FOR (p:PageEngagement)      REQUIRE (p.student_key, p.page_id)     IS UNIQUE;
CREATE CONSTRAINT microsim_engagement_grain IF NOT EXISTS
  FOR (m:MicroSimEngagement)  REQUIRE (m.student_key, m.microsim_id) IS UNIQUE;
CREATE CONSTRAINT question_response_grain IF NOT EXISTS
  FOR (q:QuestionResponse)    REQUIRE (q.student_key, q.question_id) IS UNIQUE;
CREATE CONSTRAINT session_id IF NOT EXISTS
  FOR (s:LearningSession)     REQUIRE s.session_id IS UNIQUE;
CREATE CONSTRAINT section_rollup_grain IF NOT EXISTS
  FOR (r:SectionRollup)       REQUIRE (r.section_id, r.concept_id)   IS UNIQUE;

// There is deliberately NO :Statement constraint and no :Statement label.
// Spec §5.6 C-1 prohibits per-statement vertices; `lrs bootstrap --verify`
// fails the deployment if any :Statement node is found in the graph.
```

**The grain uniqueness constraints are the enforcement mechanism for spec C-1.** They are not a performance hint. Because `(student_key, concept_id)` is unique, the summarizer's `MERGE` can only ever upsert one vertex per grain — a bug that tried to write per-statement vertices would violate the constraint and fail loudly at the first write, rather than quietly growing the graph by a billion nodes a month. `lrs bootstrap --verify` additionally asserts the `:Statement` label is absent, so the prohibition is checked on every deploy.

The concept DAG must stay acyclic — a cycle in `DEPENDS_ON` would make prerequisite analysis (R-105) diverge. The reconciler checks for cycles before promoting any back-filled `DEPENDS_ON` edge and rejects the batch if one appears.

### 6.4 PostgreSQL

Two **separate instances**, not two schemas — spec [§12.2](./lrs-spec-v1.md#122-security)'s isolation is a network and credential boundary, and a shared instance would make it one `GRANT` mistake deep.

| Instance | Holds | Reachable from |
|----------|-------|----------------|
| `vault-db` | `student_identity` (roster ID ↔ `student_key`), `district_salt`, consent state | **`lrs identity` only** |
| `meta-db` | Admin config, RBAC grants, audit log, experiment definitions, export jobs, retention policy | admin-api, analytics-api |

### 6.5 Statement Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant TB as Textbook
    participant GW as Gateway
    participant K as Redpanda
    participant PR as Processor
    participant ID as Identity
    participant CH as ClickHouse
    participant SM as Summarizer
    participant N4 as Neo4j
    participant RC as Reconciler

    TB->>GW: POST /xapi/statements (batch of 50)
    GW->>GW: authN + tier-1 validation (all-or-nothing)
    GW->>K: produce (acks=all), key = district:student
    K-->>GW: ack
    GW-->>TB: 200 [statement ids]
    Note over GW,TB: Producer is now free. Everything below is async.

    K->>PR: consume batch
    PR->>ID: salt(district) [cached, ~99.99% hit]
    PR->>PR: student_key = HMAC(salt, actor)
    PR->>PR: resolve activity IRI
    alt activity unknown (spec §5.4)
        PR->>K: emit reconcile task
        PR->>N4: MERGE provisional stub (structure, not an event)
        Note over PR: Accept-first — never blocks
    end
    PR->>PR: BKT mastery update
    PR->>CH: batched INSERT (system of record)
    CH-->>PR: ack
    PR->>K: commit offset
    Note over PR,N4: The processor never writes event vertices. Spec §5.6 C-1.

    CH->>CH: AggregatingMergeTree MV rolls up<br/>~600K statements → ~150K grains
    loop every 60s — spec §5.6
        SM->>CH: SELECT changed grains WHERE last_seen >= watermark
        CH-->>SM: ~150K rollup rows (absolute values)
        SM->>N4: UNWIND batched MERGE + SET (absolute, never +=)
        SM->>SM: advance watermark only after commit
    end
    Note over CH,N4: ~100 statements → 1 vertex. Write rate tracks<br/>active grains, not ingest — so bursts never reach the graph.

    RC->>N4: match + promote stub, back-fill COVERS/DEPENDS_ON
    Note over RC,N4: Prior statements become richly queryable — retroactively
```

---

## 7. Cross-Cutting Concerns

### 7.1 Authentication and Authorization

| Surface | AuthN | AuthZ |
|---------|-------|-------|
| xAPI ingest | Bearer token or [OAuth 2.0](../glossary.md#oauth-20) client credentials, scoped to a district or textbook (spec [§10.5](./lrs-spec-v1.md#105-xapi-endpoint-credentials-ui)) | Token's district scope is authoritative; a statement claiming another district is rewritten to the token's district and flagged |
| Analytics API / Dash | OIDC via the customer IdP (Keycloak in dev) | RBAC per spec [§10.1](./lrs-spec-v1.md#101-roles-and-permissions), enforced **at the API layer** |
| Admin API | OIDC + step-up auth for PII access | RBAC + every mutation to `lrs.audit` |

RBAC is a request-scoped `TenantContext` injected into every query builder. A query without a `TenantContext` **does not compile** — the tenant predicate is not something a developer can forget to add, because there is no code path that constructs a query without it. Spec [§10.1](./lrs-spec-v1.md#101-roles-and-permissions)'s "enforced at the API layer, not merely hidden in the [User Interface](../glossary.md#user-interface-ui) (UI)" is a structural property here, not a review checklist item.

### 7.2 Privacy Enforcement

Every Analytics API response passes through one filter. It does three things:

1. **Threshold suppression** — suppress any cell whose group size is below the district's threshold (default 10, spec [§12.3](./lrs-spec-v1.md#123-privacy-compliance)).
2. **Complementary suppression** — if suppressing one cell in a row still leaves it derivable from the row total and the surviving cells, suppress the next-smallest cell too. A single suppressed cell in a row that publishes its total is not suppressed at all; it is arithmetic. This is the difference between a threshold that works and one that looks like it works.
3. **Audit** — every PII-adjacent read writes to `lrs.audit` (spec [§10.9](./lrs-spec-v1.md#109-audit-monitoring-ui), R-408).

> **A tension in spec [§12.3](./lrs-spec-v1.md#123-privacy-compliance) that needs resolving.** Read literally — "no report may reveal a disaggregated result for a group smaller than the threshold" — the default threshold of 10 breaks R-101 (Student Progress Overview) for *every* section, since a single student is a group of one. It would also blank out any class under 10 students.
>
> The design distinguishes two cases: a teacher viewing **their own roster** already knows those students by name, and showing them their own students' progress discloses nothing they do not have. The threshold's actual purpose is to prevent **re-identification by parties without that legitimate relationship** — cross-district benchmarks (R-308), school comparisons (R-402), and segment breakdowns ([§8.3](./lrs-spec-v1.md#83-analysis)).
>
> So the filter applies the threshold to **cross-group, de-identified, and benchmark views**, and exempts a role's directly-rostered scope. This needs explicit spec language; see [§11](#11-deviations-from-the-specification).

### 7.3 Observability

OpenTelemetry throughout. The trace ID is minted at the gateway, rides the statement through the Kafka header, and is attached to the ClickHouse and Neo4j writes — so spec [§12.4](./lrs-spec-v1.md#124-observability-data-quality)'s "end-to-end tracing from statement receipt to projection" is a single Jaeger query.

The metrics that get paged on (spec [§10.9](./lrs-spec-v1.md#109-audit-monitoring-ui)): processing lag > 5 min, dead-letter rate > 1%, gateway `503` rate > 0, reconciliation backlog growth. These are the same numbers R-405 and R-406 render for admins — one source, two audiences.

### 7.4 Idempotency and Replay

Replay is the backstop for every data-quality problem in the system. `lrs replay --district D --from T1 --to T2 --into <table>` re-reads the immutable log and rebuilds any projection into a shadow table, which is then atomically swapped. Because `statement_id` is the dedup key and projections are timestamp-driven, replay is safe to run against live traffic.

**Rebuilding the graph is not a replay at all.** `lrs replay --rebuild-graph` resets the summarizer's watermark to zero; the ordinary 60-second sync loop then rewrites every summary vertex from the rollups. There is no separate rebuild path to maintain, and no script that has gone untested since the last incident — the recovery code is the code that runs every minute in production. This is the practical payoff of ADR-002's insistence on absolute writes.

---

## 8. Deployment

### 8.1 Philosophy: One Image, Many Roles

**Every LRS process is the same container image.** The role is chosen by the command:

```
docker run ghcr.io/dmccreary/lrs:1.0.0 gateway
docker run ghcr.io/dmccreary/lrs:1.0.0 processor
docker run ghcr.io/dmccreary/lrs:1.0.0 dashboards
```

One build, one dependency resolution, one vulnerability scan, one artifact to promote from dev to prod. The gateway and the dashboard cannot drift onto different versions of the xAPI parser, because there is exactly one of it. And `docker compose up` gives a developer the entire LRS — every plane in spec [§2](./lrs-spec-v1.md#2-system-context) — on a laptop, from a cold clone, in about ninety seconds.

The backing stores (Redpanda, Neo4j, ClickHouse, Postgres, Redis, MinIO) are upstream images, unmodified. We do not build those.

### 8.2 The Application Image

```dockerfile
# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.12

# ---------- base: shared runtime, non-root user ----------
FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
RUN groupadd --system --gid 10001 lrs \
 && useradd  --system --uid 10001 --gid lrs --create-home lrs

# ---------- builder: resolve and install deps ----------
FROM base AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

# Dependency layer — cached until the lockfile changes
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Application layer — the only layer most builds rebuild
COPY src/ ./src/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---------- runtime: no build tooling, no uv, no source of truth for secrets ----------
FROM base AS runtime
WORKDIR /app
COPY --from=builder --chown=lrs:lrs /app/.venv /app/.venv
COPY --from=builder --chown=lrs:lrs /app/src   /app/src
ENV PATH="/app/.venv/bin:$PATH"

USER lrs
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
    CMD ["lrs", "healthcheck"]

ENTRYPOINT ["lrs"]
CMD ["--help"]
```

Notes that matter:

- **Non-root ([User ID](../glossary.md#user-id-uid) (UID) 10001) and no shell-form `ENTRYPOINT`** — the process is [Process ID](../glossary.md#process-id-pid) (PID) 1 and receives `SIGTERM` directly, so a rolling restart drains Kafka offsets cleanly instead of being `SIGKILL`ed nine seconds later.
- **The dependency layer is separate from the source layer.** Editing a Python file rebuilds one layer, not the whole environment.
- **Cache mounts** keep `uv sync` off the network on rebuild; **`--frozen`** guarantees the lockfile is authoritative, so the image is reproducible.
- **The runtime stage carries no compiler and no `uv`** — smaller attack surface, and a smaller [Software Bill of Materials](../glossary.md#software-bill-of-materials-sbom) (SBOM) to triage.
- **`HEALTHCHECK` is role-aware:** `lrs healthcheck` inspects `LRS_ROLE` and probes the right thing — HTTP `/healthz` for a server, consumer-group liveness for a processor.

### 8.3 The Role Dispatcher

The `lrs` entrypoint is a small Typer [Command-Line Interface](../glossary.md#command-line-interface-cli) (CLI). Every role is a subcommand:

| Command | Role | Notes |
|---------|------|-------|
| `lrs gateway` | xAPI ingest | uvicorn, `:8080` |
| `lrs identity` | Pseudonym resolution | `:8086`, vault-db only |
| `lrs processor` | Stream → event store | Kafka consumer group |
| `lrs summarizer` | **Compression → graph** | Spec [§5.6](./lrs-spec-v1.md#56-statement-compression); `--cadence 60` |
| `lrs reconciler` | Provisional promotion | Spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks) |
| `lrs analytics-api` | Reports | `:8081` |
| `lrs admin-api` | Admin operations | `:8083` |
| `lrs dashboards` | Dash/Plotly | `:8050` |
| `lrs bootstrap` | Topics + [Data Definition Language](../glossary.md#data-definition-language-ddl) (DDL) + constraints | Run-once, idempotent |
| `lrs seed --demo` | Demo district, textbook, synthetic statements | Makes the stack explorable immediately |
| `lrs loadgen --rate 10000` | Synthetic xAPI firehose | Validates [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) against real infrastructure |
| `lrs replay` | Rebuild a projection from the log | [§7.4](#74-idempotency-and-replay) |
| `lrs healthcheck` | Role-aware probe | Used by `HEALTHCHECK` and [Kubernetes](../glossary.md#kubernetes-k8s) (k8s) |

### 8.4 `docker-compose.yml`

```yaml
name: lrs

x-lrs-image: &lrs-image
  image: ${LRS_IMAGE:-lrs:dev}
  build:
    context: .
    target: runtime
    args:
      PYTHON_VERSION: "3.12"

x-lrs-env: &lrs-env
  LRS_ENV: dev
  LRS_LOG_LEVEL: ${LRS_LOG_LEVEL:-INFO}
  KAFKA_BOOTSTRAP: redpanda:29092
  CLICKHOUSE_URL: http://lrs:${CLICKHOUSE_PASSWORD}@clickhouse:8123/lrs
  NEO4J_URI: bolt://neo4j:7687
  NEO4J_USER: neo4j
  NEO4J_PASSWORD: ${NEO4J_PASSWORD}
  VAULT_DB_DSN: postgresql://lrs:${VAULT_DB_PASSWORD}@vault-db:5432/vault
  META_DB_DSN: postgresql://lrs:${META_DB_PASSWORD}@meta-db:5432/meta
  REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
  S3_ENDPOINT: http://minio:9000
  S3_ACCESS_KEY: ${MINIO_ROOT_USER}
  S3_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
  OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
  # Spec §5.6 — compression cadence. Lower = fresher graph, more upserts (§4.1).
  SUMMARIZER_CADENCE_SECONDS: "60"
  # Spec §5.6 C-7 — which §4.3 grains this deployment materializes.
  SUMMARIZER_GRAINS: "concept_mastery,page_engagement,microsim_engagement,question_response,section_rollup"

x-lrs-depends: &lrs-depends
  redpanda:   {condition: service_healthy}
  clickhouse: {condition: service_healthy}
  neo4j:      {condition: service_healthy}
  redis:      {condition: service_healthy}

services:

  # ============ Backing services ============

  redpanda:
    image: redpandadata/redpanda:v24.3.6
    command:
      - redpanda
      - start
      - --smp=1
      - --memory=1G
      - --reserve-memory=0M
      - --overprovisioned
      - --node-id=0
      - --check=false
      - --kafka-addr=INTERNAL://0.0.0.0:29092,EXTERNAL://0.0.0.0:9092
      - --advertise-kafka-addr=INTERNAL://redpanda:29092,EXTERNAL://localhost:9092
      - --rpc-addr=0.0.0.0:33145
      - --advertise-rpc-addr=redpanda:33145
    ports: ["9092:9092"]
    volumes: ["redpanda-data:/var/lib/redpanda/data"]
    healthcheck:
      test: ["CMD-SHELL", "rpk cluster health | grep -q 'Healthy:.*true'"]
      interval: 10s
      timeout: 5s
      retries: 10

  clickhouse:
    image: clickhouse/clickhouse-server:24.8
    environment:
      CLICKHOUSE_DB: lrs
      CLICKHOUSE_USER: lrs
      CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD}
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: "1"
    ports: ["8123:8123", "9000:9000"]
    volumes: ["clickhouse-data:/var/lib/clickhouse"]
    ulimits:
      nofile: {soft: 262144, hard: 262144}
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8123/ping || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10

  neo4j:
    image: neo4j:5.26-community
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_server_memory_heap_max__size: 2G
      NEO4J_server_memory_pagecache_size: 1G
    ports: ["7474:7474", "7687:7687"]
    volumes: ["neo4j-data:/data", "neo4j-logs:/logs"]
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:7474 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 15

  # Isolated per spec §12.2 — separate instance, separate credentials.
  vault-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vault
      POSTGRES_USER: lrs
      POSTGRES_PASSWORD: ${VAULT_DB_PASSWORD}
    ports: ["5433:5432"]
    volumes: ["vault-db-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lrs -d vault"]
      interval: 10s
      timeout: 5s
      retries: 10

  meta-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: meta
      POSTGRES_USER: lrs
      POSTGRES_PASSWORD: ${META_DB_PASSWORD}
    ports: ["5432:5432"]
    volumes: ["meta-db-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lrs -d meta"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    ports: ["6379:6379"]
    volumes: ["redis-data:/data"]
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a $$REDIS_PASSWORD ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 10
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}

  minio:
    image: minio/minio:latest
    command: ["server", "/data", "--console-address", ":9001"]
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports: ["9002:9000", "9003:9001"]
    volumes: ["minio-data:/data"]
    healthcheck:
      test: ["CMD-SHELL", "mc ready local || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10

  # ============ Bootstrap (run-once, idempotent) ============

  bootstrap:
    <<: *lrs-image
    command: ["bootstrap", "--create-topics", "--apply-ddl", "--apply-constraints"]
    environment: {<<: *lrs-env, LRS_ROLE: bootstrap}
    depends_on: *lrs-depends
    restart: "no"

  # ============ Application roles — all the same image ============

  identity:
    <<: *lrs-image
    command: ["identity", "--host", "0.0.0.0", "--port", "8086"]
    environment: {<<: *lrs-env, LRS_ROLE: identity}
    ports: ["8086:8086"]
    depends_on:
      vault-db: {condition: service_healthy}
      bootstrap: {condition: service_completed_successfully}

  gateway:
    <<: *lrs-image
    command: ["gateway", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
    environment: {<<: *lrs-env, LRS_ROLE: gateway}
    ports: ["8080:8080"]
    # Deliberately depends ONLY on the queue — spec §5.4, §12.1.
    depends_on:
      redpanda: {condition: service_healthy}
      bootstrap: {condition: service_completed_successfully}

  processor:
    <<: *lrs-image
    command: ["processor", "--batch-size", "1000", "--batch-ms", "200"]
    environment: {<<: *lrs-env, LRS_ROLE: processor}
    depends_on:
      <<: *lrs-depends
      identity: {condition: service_started}
      bootstrap: {condition: service_completed_successfully}
    # Scale with:  docker compose up -d --scale processor=3

  # Spec §5.6 — the compression pipeline. Reads ClickHouse rollups, writes
  # summary vertices to Neo4j. Single replica: it holds the sync watermark,
  # and two of them would duplicate work (harmlessly — the writes are
  # idempotent — but pointlessly). Leader-elected in production (§8.10).
  summarizer:
    <<: *lrs-image
    command: ["summarizer", "--cadence", "60"]
    environment: {<<: *lrs-env, LRS_ROLE: summarizer}
    depends_on:
      <<: *lrs-depends
      bootstrap: {condition: service_completed_successfully}

  reconciler:
    <<: *lrs-image
    command: ["reconciler", "--interval", "60"]
    environment: {<<: *lrs-env, LRS_ROLE: reconciler}
    depends_on:
      <<: *lrs-depends
      bootstrap: {condition: service_completed_successfully}

  analytics-api:
    <<: *lrs-image
    command: ["analytics-api", "--host", "0.0.0.0", "--port", "8081"]
    environment: {<<: *lrs-env, LRS_ROLE: analytics-api}
    ports: ["8081:8081"]
    depends_on:
      <<: *lrs-depends
      bootstrap: {condition: service_completed_successfully}

  admin-api:
    <<: *lrs-image
    command: ["admin-api", "--host", "0.0.0.0", "--port", "8083"]
    environment: {<<: *lrs-env, LRS_ROLE: admin-api}
    ports: ["8083:8083"]
    depends_on:
      meta-db: {condition: service_healthy}
      neo4j: {condition: service_healthy}
      bootstrap: {condition: service_completed_successfully}

  dashboards:
    <<: *lrs-image
    command: ["dashboards", "--host", "0.0.0.0", "--port", "8050"]
    environment:
      <<: *lrs-env
      LRS_ROLE: dashboards
      ANALYTICS_API_URL: http://analytics-api:8081
    ports: ["8050:8050"]
    depends_on:
      analytics-api: {condition: service_started}

  # ============ Optional profiles ============

  loadgen:
    <<: *lrs-image
    profiles: ["perf"]
    command: ["loadgen", "--target", "http://gateway:8080", "--rate", "5000", "--batch", "50"]
    environment: {<<: *lrs-env, LRS_ROLE: loadgen}
    depends_on:
      gateway: {condition: service_started}

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    profiles: ["full"]
    command: ["start-dev", "--import-realm"]
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_PASSWORD}
    ports: ["8088:8080"]
    volumes: ["./deploy/keycloak/realm-lrs.json:/opt/keycloak/data/import/realm-lrs.json:ro"]

  redpanda-console:
    image: redpandadata/console:v2.7.2
    profiles: ["obs"]
    environment:
      KAFKA_BROKERS: redpanda:29092
    ports: ["8085:8080"]
    depends_on:
      redpanda: {condition: service_healthy}

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.115.1
    profiles: ["obs"]
    command: ["--config=/etc/otel/config.yaml"]
    volumes: ["./deploy/otel/config.yaml:/etc/otel/config.yaml:ro"]
    ports: ["4317:4317"]

  jaeger:
    image: jaegertracing/all-in-one:1.64
    profiles: ["obs"]
    ports: ["16686:16686"]

  prometheus:
    image: prom/prometheus:v3.0.1
    profiles: ["obs"]
    volumes: ["./deploy/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro"]
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:11.4.0
    profiles: ["obs"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    ports: ["3000:3000"]
    volumes: ["grafana-data:/var/lib/grafana"]

volumes:
  redpanda-data:
  clickhouse-data:
  neo4j-data:
  neo4j-logs:
  vault-db-data:
  meta-db-data:
  redis-data:
  minio-data:
  grafana-data:
```

Three details are load-bearing:

- **`gateway` depends only on `redpanda`.** If you add `clickhouse` to its `depends_on` "for consistency," you have quietly made the analytics store an ingestion dependency and broken spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks). This is the single most important line in the file.
- **`depends_on: {condition: service_healthy}`** everywhere else, with `bootstrap` gated on `service_completed_successfully`. No sleep loops, no "connection refused" on first run.
- **[YAML](../glossary.md#yaml) anchors** (`*lrs-image`, `*lrs-env`) mean the seven application services genuinely cannot drift apart in configuration — the sameness is enforced by the file, not by discipline.

### 8.5 `.env.example`

```bash
# Copy to .env and change every value before anything leaves your laptop.
# .env is git-ignored. Production secrets NEVER come from a file — see §8.13.

LRS_IMAGE=lrs:dev
LRS_LOG_LEVEL=INFO

NEO4J_PASSWORD=change-me-neo4j
CLICKHOUSE_PASSWORD=change-me-clickhouse
VAULT_DB_PASSWORD=change-me-vault
META_DB_PASSWORD=change-me-meta
REDIS_PASSWORD=change-me-redis
MINIO_ROOT_USER=lrsadmin
MINIO_ROOT_PASSWORD=change-me-minio
KEYCLOAK_PASSWORD=change-me-keycloak
GRAFANA_PASSWORD=change-me-grafana

# Dev-only ingest token. In production these are issued per district
# via the admin UI (spec §10.5) and shown exactly once.
LRS_DEV_INGEST_TOKEN=dev-token-not-for-production
```

### 8.6 `Makefile`

```makefile
.PHONY: up down logs seed smoke perf obs rebuild test clean

up:            ## Start the core stack
	docker compose up -d --build
	docker compose up -d --scale processor=3

down:          ## Stop, keep volumes
	docker compose down

clean:         ## Stop and destroy all data
	docker compose down -v

logs:
	docker compose logs -f gateway processor analytics-api

seed:          ## Load a demo district, textbook, and synthetic statements
	docker compose run --rm bootstrap seed --demo

smoke:         ## Post one statement and assert it lands (§8.8)
	./scripts/smoke.sh

perf:          ## Run the synthetic firehose
	docker compose --profile perf up -d loadgen

obs:           ## Add Jaeger, Prometheus, Grafana, Redpanda Console
	docker compose --profile obs up -d

rebuild:       ## Rebuild a projection from the immutable log (§7.4)
	docker compose run --rm bootstrap replay --district demo-district --into concept_mastery

test:          ## Integration tests against the same images as compose
	uv run pytest tests/ -v
```

### 8.7 Bootstrap and Seed

`lrs bootstrap` is idempotent and runs to completion before any other role starts:

1. Create Kafka topics with the [§6.1](#61-kafka-topics) partition counts and retention.
2. Apply ClickHouse DDL ([§6.2](#62-clickhouse-the-event-log)) — tables, materialized views, dictionaries.
3. Apply Neo4j constraints and indexes ([§6.3](#63-neo4j-structure)).
4. Run Alembic migrations against `vault-db` and `meta-db`.
5. Create the MinIO buckets.
6. Write a schema-version row so a mismatched image refuses to start rather than corrupting a projection.

`lrs seed --demo` then loads one district, two schools, four sections, a 200-concept learning graph, a textbook with MicroSims, and ~50,000 synthetic statements spread over a simulated term — enough that every dashboard in spec [§9.4](./lrs-spec-v1.md#94-dashboard-catalog) renders with plausible data on first launch. **A stack you have to hand-populate before you can see anything is a stack nobody explores.**

### 8.8 First Run

```bash
git clone https://github.com/dmccreary/lrs && cd lrs
cp .env.example .env          # edit the passwords
make up                       # ~90s cold, ~15s warm
make seed
make smoke
```

The smoke test proves the whole path in one command:

```bash
#!/usr/bin/env bash
# scripts/smoke.sh — post one statement, assert it reaches every store.
set -euo pipefail
source .env

STATEMENT_ID=$(uuidgen | tr 'A-Z' 'a-z')

curl -sf -X POST http://localhost:8080/xapi/statements \
  -H 'Content-Type: application/json' \
  -H 'X-Experience-API-Version: 1.0.3' \
  -H "Authorization: Bearer ${LRS_DEV_INGEST_TOKEN}" \
  -d @- <<JSON
[{
  "id": "${STATEMENT_ID}",
  "actor":  {"objectType": "Agent",
             "account": {"homePage": "https://demo.example.edu",
                         "name": "student-0042"}},
  "verb":   {"id": "http://adlnet.gov/expapi/verbs/completed",
             "display": {"en-US": "completed"}},
  "object": {"objectType": "Activity",
             "id": "https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/",
             "definition": {"name": {"en-US": "LRS Graph Data Model Explorer"}}},
  "result": {"score": {"scaled": 0.9}, "success": true, "duration": "PT4M12S"},
  "context": {"contextActivities": {
               "grouping": [{"id": "https://example.edu/textbook/lrs/v1.0.0"}]}},
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}]
JSON

echo "✓ gateway accepted ${STATEMENT_ID}"
sleep 3   # allow one processor batch window

# Landed in the event log (system of record)?
docker compose exec -T clickhouse clickhouse-client \
  --user lrs --password "${CLICKHOUSE_PASSWORD}" \
  --query "SELECT count() FROM lrs.statements WHERE statement_id = '${STATEMENT_ID}'" \
  | grep -q '^1$' && echo "✓ clickhouse stored it"

# Auto-provisioned a stub for the never-before-seen textbook version? (spec §5.4)
docker compose exec -T neo4j cypher-shell \
  -u neo4j -p "${NEO4J_PASSWORD}" --format plain \
  "MATCH (v:TextbookVersion {version_id: 'https://example.edu/textbook/lrs/v1.0.0'})
   RETURN v.provisional" | grep -q 'true' && echo "✓ neo4j auto-provisioned a provisional stub"

# ---- spec §5.6 C-1: the graph must contain NO per-statement vertices, ever ----
COUNT=$(docker compose exec -T neo4j cypher-shell \
  -u neo4j -p "${NEO4J_PASSWORD}" --format plain \
  "MATCH (s:Statement) RETURN count(s)" | tail -1)
[ "${COUNT}" = "0" ] || { echo "✗ FAIL: ${COUNT} :Statement vertices — spec §5.6 C-1 violated"; exit 1; }
echo "✓ no per-statement vertices in the graph (C-1)"

# ---- spec §5.6 C-6: compression is observable, and the graph is smaller ----
sleep 65   # one summarizer cadence
docker compose exec -T neo4j cypher-shell \
  -u neo4j -p "${NEO4J_PASSWORD}" --format plain \
  "MATCH (m:ConceptMastery)
   RETURN sum(m.statements_compressed) AS statements,
          count(m)                     AS vertices,
          round(1.0 * sum(m.statements_compressed) / count(m), 1) AS ratio"

echo "✓ smoke passed — accept-first ingestion and statement compression both working"
```

Two of these assertions are the interesting ones.

The **provisional stub** proves spec [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks): the textbook version in the payload was never registered, and the statement was accepted, stored, and stubbed anyway.

The **`:Statement` count** proves spec [§5.6](./lrs-spec-v1.md#56-statement-compression) C-1, and it is deliberately a *hard failure* rather than a warning. The compression model's whole value rests on that count being zero, and a well-meaning change — mirroring events "just for debugging," or a MicroSim demo that wants per-event vertices — would erode it silently and only show up as a graph that stopped fitting in memory six months later. Asserting it on every developer's laptop on every run is what keeps the constraint real. `make seed` then makes the ratio meaningful: ~50,000 seeded statements collapse to a few thousand summary vertices, and the final query prints the ratio you actually achieved.

### 8.9 Profiles and Laptop Sizing

| Profile | Command | Services | [Random Access Memory](../glossary.md#random-access-memory-ram) (RAM) |
|---------|---------|----------|-----|
| Core (default) | `make up` | Redpanda, ClickHouse, Neo4j, 2× Postgres, Redis, MinIO + 7 app roles | **~8 GB** |
| Lean | `docker compose up gateway processor redpanda clickhouse redis` | Ingest path only — enough for processor work | ~3 GB |
| `obs` | `make obs` | + Jaeger, Prometheus, Grafana, Redpanda Console | +2 GB |
| `perf` | `make perf` | + loadgen | +0.5 GB |
| `full` | `--profile full` | + Keycloak (real OIDC) | +1 GB |

Core fits a 16 GB laptop with room to work. Neo4j's heap (2 GB) and ClickHouse are the two that will fight you if you run everything at once on 8 GB — use Lean there.

### 8.10 Production Topology

The same image, the same roles, different substrate. Kubernetes via Helm; one `Deployment` per role, all pointing at one `image:` tag.

| Compose service | Production |
|-----------------|------------|
| `gateway` | Deployment behind an [Application Load Balancer](../glossary.md#application-load-balancer-alb) (ALB)/Ingress, [Horizontal Pod Autoscaler](../glossary.md#horizontal-pod-autoscaler-hpa) (HPA) on RPS + CPU, min 6 pods across 3 [Availability Zones](../glossary.md#availability-zone-az) (AZs) |
| `processor` | Deployment, **KEDA scaler on Kafka consumer lag** — this *is* spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale)'s "autoscale on queue depth" |
| `identity` | Deployment, NetworkPolicy allowing egress to `vault-db` only |
| `analytics-api`, `admin-api`, `dashboards` | Deployments, HPA on CPU |
| `summarizer` | Deployment, leader-elected via a lease; one active per grain. Shardable by `district_id` if a single worker cannot hold the ~2,500 upserts/sec ([§4.1](#41-the-compression-math)) |
| `reconciler` | Deployment, single replica with a leader lease |
| `bootstrap` | Helm pre-install/pre-upgrade `Job` |
| `redpanda` | **[Managed Streaming for Apache Kafka](../glossary.md#managed-streaming-for-apache-kafka-msk) (MSK) / Confluent Cloud / Redpanda Cloud** — RF=3, 48 partitions, client quotas per district (ADR-004) |
| `clickhouse` | **ClickHouse Cloud** or self-hosted with `ReplicatedReplacingMergeTree` + Keeper, S3 cold tier after 13 months |
| `neo4j` | **Neo4j AuraDB or Enterprise causal cluster** — see the licensing note below |
| `vault-db`, `meta-db` | [Relational Database Service](../glossary.md#relational-database-service-rds) (RDS) PostgreSQL, [Multi-AZ Deployment](../glossary.md#multi-az-deployment), separate instances, separate security groups |
| `redis` | ElastiCache, cluster mode, Multi-AZ |
| `minio` | S3 with versioning + Object Lock for the audit trail |
| `keycloak` | The customer's IdP |
| `otel-collector` et al. | Managed OTel backend |

> **A dev/prod difference to be explicit about.** The compose stack runs Neo4j **Community** and plain `ReplacingMergeTree`; production needs Neo4j **Enterprise/Aura** (Community cannot cluster, so it has no HA story) and `ReplicatedReplacingMergeTree` (which needs Keeper). Both are gated by config, not by code — but they are genuinely different runtime characteristics, and "it worked in compose" does not prove the clustered path. Integration tests run against the clustered configuration in [Continuous Integration](../glossary.md#continuous-integration-ci) (CI) ([§10](#10-testing-and-verification)). Neo4j's production licensing is an open question ([§13](#13-open-questions)); Memgraph is the drop-in alternative if the license lands badly.

### 8.11 Production Sizing at 10k statements/sec

Derived from [§4](#4-capacity-model):

| Component | Sizing | Rationale |
|-----------|--------|-----------|
| Gateway | 6 pods × 2 vCPU / 2 GB | ~400 req/sec ÷ 6 ≈ 67 req/sec/pod, well inside headroom |
| Processor | 5 pods × 4 vCPU / 4 GB | 48 partitions ÷ 5 ≈ 10 partitions/pod, ~2,000 stmt/sec/pod |
| Summarizer | 2 pods × 4 vCPU / 8 GB, sharded by district | ~2,500 upserts/sec at 60 s cadence ([§4.1](#41-the-compression-math)), ~1,250/pod — **flat under a 5× ingest burst** |
| Kafka | 3 brokers × 4 vCPU / 16 GB / 1 TB [Non-Volatile Memory Express](../glossary.md#non-volatile-memory-express-nvme) (NVMe) | 1.1 TB at RF=3 across 3 brokers, ~65% headroom |
| ClickHouse | 3 nodes × 8 vCPU / 32 GB / 4 TB NVMe + S3 tier | 13 months hot ≈ 9 TB ÷ 3 nodes, S3 beyond |
| Neo4j | 3 nodes × 8 vCPU / 32 GB | ~15M structural nodes fits page cache entirely |
| Redis | 3 shards × 13 GB | ~400M mastery entries, hot subset only |
| Postgres ×2 | db.r6g.xlarge Multi-AZ | Low volume, high sensitivity |

Burst to 50k/sec is absorbed by **Kafka, not by pods.** A 5× spike at a period boundary lasts seconds; the queue takes it and processors drain the lag over the following minute. Autoscaling the processors on lag is what makes that self-correcting, and it is why the spec is right that backpressure belongs at the queue and never at the producer.

### 8.12 Image Supply Chain

```yaml
# .github/workflows/release.yml (abridged)
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64   # arm64 for Apple Silicon dev parity
    push: true
    tags: |
      ghcr.io/dmccreary/lrs:${{ github.sha }}
      ghcr.io/dmccreary/lrs:${{ github.ref_name }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    provenance: true
    sbom: true
- uses: aquasecurity/trivy-action@0.28.0
  with: {image-ref: 'ghcr.io/dmccreary/lrs:${{ github.sha }}', severity: 'CRITICAL,HIGH', exit-code: '1'}
- run: cosign sign --yes ghcr.io/dmccreary/lrs@${DIGEST}
```

- **Deployments reference the immutable digest**, never a mutable tag. `:latest` does not exist in any manifest.
- **Multi-arch** so the image a developer runs on an M-series Mac is the image CI built.
- **SBOM + provenance + cosign signature** on every image; the cluster's admission policy rejects unsigned images. This matters more than usual for a system holding student records.

### 8.13 Configuration and Secrets

Config is environment variables, validated by a Pydantic `Settings` model at startup. **A missing or malformed variable crashes the process on boot**, loudly, rather than surfacing as a `None` three hours into a shift.

Secrets never live in the image and never live in a file in production:

| Environment | Source |
|-------------|--------|
| Dev | `.env` (git-ignored, dev-only values) |
| Production | [Amazon Web Services](../glossary.md#amazon-web-services-aws) (AWS) Secrets Manager / Vault → External Secrets Operator → k8s `Secret` → env, rotated without a rebuild |

Spec [§10.5](./lrs-spec-v1.md#105-xapi-endpoint-credentials-ui) and [§12.2](./lrs-spec-v1.md#122-security) require that ingest keys and [Student Information System](../glossary.md#student-information-system-sis) (SIS) credentials are shown exactly once and never rendered again. They are stored as HMACs, not ciphertext — the plaintext is unrecoverable by design, including by us. "Reveal key" is not a feature that can be added later, which is the point.

### 8.14 Schema Migration and Projection Rebuild

The immutable log turns the hardest class of migration into a routine one:

| Change | Procedure |
|--------|-----------|
| Additive ClickHouse column | `ALTER TABLE ... ADD COLUMN` — online, no rewrite |
| Changed projection semantics (e.g. a new BKT parameterization) | **Rebuild-and-swap:** `lrs replay --into concept_mastery_v2`, verify, swap the read path via config, drop v1. No downtime, no in-place mutation, fully reversible. |
| Neo4j constraint or index | Applied by `bootstrap`; additive only |
| Breaking graph model change | Rebuild the graph from the log into a new database, swap, drop |
| Postgres | Alembic, **expand–contract**: add nullable → backfill → dual-write → switch reads → drop old, each step independently deployable and reversible |
| Kafka partition increase | Adding partitions changes key→partition mapping and breaks per-learner ordering for in-flight keys. Do it only during a maintenance window with consumers stopped — or over-provision partitions up front, which is why [§6.1](#61-kafka-topics) specifies 48 for a 10k/sec target that needs ~24. |

That last row is the one that bites teams. Partition counts are effectively permanent; we chose 2× headroom deliberately.

### 8.15 Backup and Disaster Recovery

| Store | Backup | [Recovery Point Objective](../glossary.md#recovery-point-objective-rpo) (RPO) | [Recovery Time Objective](../glossary.md#recovery-time-objective-rto) (RTO) |
|-------|--------|-----|-----|
| ClickHouse (**SoR**) | `BACKUP TABLE ... TO S3`, nightly full + hourly incremental | 1 h | 4 h |
| Neo4j | Nightly dump to S3 — **and** rebuildable from the log | 24 h | 1 h (rebuild is faster than restore) |
| `vault-db` | Continuous [Write-Ahead Log](../glossary.md#write-ahead-log-wal) (WAL) archiving, [Point-in-Time Recovery](../glossary.md#point-in-time-recovery-pitr) (PITR) | 5 min | 1 h |
| `meta-db` | Continuous WAL archiving, PITR | 5 min | 1 h |
| Kafka | Not backed up | — | — |
| Redis | Not backed up | — | — |

The asymmetry is the design. **ClickHouse and the vault are the only two stores whose loss is unrecoverable** — everything else is a projection or a cache, and is cheaper to rebuild than to restore. Kafka is a 7-day replay buffer, not a record. Redis is a cache; losing it costs a warm-up, and BKT state re-checkpoints from the compacted `lrs.mastery.state` topic.

Losing the **vault** is the true worst case: without the salts and mappings, every `student_key` in ClickHouse becomes permanently un-linkable to a real learner. The analytics survive; the ability to answer a parent's data-subject request does not. Hence PITR, Multi-AZ, and a quarterly restore drill.

### 8.16 Rollout and Rollback

- **Stateless roles** (gateway, APIs, dashboards): rolling update, `maxSurge=1 maxUnavailable=0`, readiness-gated.
- **Processors**: rolling, with `terminationGracePeriodSeconds: 60` so an in-flight batch commits its offsets rather than being redelivered. At-least-once makes redelivery *safe*, not *free* — it costs a duplicate insert that the `ReplacingMergeTree` then has to merge away.
- **Gateway is deployed first and rolled back last.** It is the only role whose unavailability loses data.
- **Rollback** is redeploying the previous digest. Migrations are expand–contract, so version N-1 always runs against version N's schema — which is the property that makes rollback a non-event rather than a second incident.

---

## 9. Failure Modes

| Failure | Detection | Behavior | Response |
|---------|-----------|----------|----------|
| Kafka unavailable | Gateway produce errors | Gateway buffers locally, then `503` + `Retry-After` | **Page.** This is the only data-loss path in the system. |
| ClickHouse unavailable | Processor write errors | Processor stops committing offsets; lag grows; **ingestion unaffected** | Page. Drain lag on recovery — nothing is lost. |
| Neo4j unavailable | Summarizer / API errors | Statements still land in ClickHouse; the summarizer's watermark stops advancing; graph goes stale but is never wrong | Ticket. Ingestion is fine. On recovery the sync catches up on its own — no manual replay. |
| Summarizer stopped | Graph freshness lag (C-5) climbs | Graph is stale; ClickHouse-backed reports unaffected. **No data is lost** — the rollups keep accumulating and the next sync writes the correct absolutes | Page at 5 min lag. Restart is sufficient; there is no catch-up backlog to drain, because absolutes are not a queue. |
| Summarizer double-runs (split brain) | Two leaders | Both write identical absolute values | None — idempotent by construction (C-3). This is why the writes are `SET`, not `+=` (ADR-002). |
| Identity service unavailable | Salt fetch errors | Cached salts keep serving (~99.99% hit); uncached districts pause | Page if > 5 min. |
| Redis unavailable | Cache errors | Mastery reads fall back to ClickHouse; API latency rises; **nothing breaks** | Ticket. |
| Experiment service errors | Assignment errors | **Control arm served, event still recorded** (spec [§8.2](./lrs-spec-v1.md#82-assignment)) | Ticket. |
| Reconciliation backlog grows | R-405 | Provisional nodes accumulate; statements still queryable by IRI | Ticket. Scale the reconciler. |
| Poison message | Consumer crash loop | After 3 attempts → [Dead-Letter Queue](../glossary.md#dead-letter-queue-dlq) (DLQ), consumer continues | Ticket. Inspect via spec [§10.5](./lrs-spec-v1.md#105-xapi-endpoint-credentials-ui). |
| One district floods the queue | Quota metrics | Kafka quota throttles *that district's* producer only | Ticket — ADR-004 working as designed. |
| Clock skew on a textbook | Statements with future timestamps | Accepted (schema-on-read), flagged in R-405 | Ticket. Projections are event-time-driven, so skew distorts one district's reports, not the system. |

The pattern worth noticing: **only the first row loses data.** Every other failure degrades a projection, and every projection is rebuildable from the log. That is spec [§12.4](./lrs-spec-v1.md#124-observability-data-quality)'s "ultimate data-quality backstop" cashed out as an operational property.

---

## 10. Testing and Verification

| Layer | Approach |
|-------|----------|
| Unit | BKT math against published reference cases; the privacy filter against known complementary-disclosure attacks; the hash bucketer for stickiness across allocation ramps |
| Compression | **C-1:** assert no `:Statement` label exists after a full ingest run — the constraint the whole model rests on. **C-3:** run the summarizer twice over the same rollups and assert the graph is byte-identical. **C-4:** inject a statement 48 h late and assert only its grain changes. **C-6:** assert `statements_compressed` summed over vertices equals the ClickHouse row count. |
| Contract | The **[ADL LRS Conformance Test Suite](https://github.com/adlnet/lrs-conformance-test-suite)** ([Advanced Distributed Learning](../glossary.md#advanced-distributed-learning-adl), ADL) in CI. xAPI conformance is externally defined; we do not get to grade our own homework. |
| Integration | Testcontainers using **the same image tags as compose** — real Redpanda, real ClickHouse, real Neo4j. Includes the clustered ClickHouse/Neo4j configuration that compose does not exercise ([§8.10](#810-production-topology)). |
| Privacy | An adversarial suite that attempts re-identification through every report, including differencing attacks across successive filter states |
| Load | `lrs loadgen --rate 10000` against a production-shaped environment; verify the [§12.1](./lrs-spec-v1.md#121-scale-availability) latency and availability targets and the 50k burst absorption |
| Replay | Nightly: rebuild a projection from the log into a shadow table and assert it matches the live one. **This is the test that proves immutability is real** rather than a slogan. |
| Chaos | Scheduled broker, ClickHouse, and Neo4j kills in staging; assert the [§9](#9-failure-modes) table's claimed behavior actually happens |

---

## 11. Deviations from the Specification

### 11.1 Resolved

| # | Spec | Was | Resolution |
|---|------|-----|-----------|
| ~~D-1~~ | [§4.1](./lrs-spec-v1.md#41-node-labels) | `Statement` was a graph node with `PERFORMED` / `ABOUT` / `IN_CONTEXT_OF` edges — implying one vertex per event | **Closed.** [§4.1](./lrs-spec-v1.md#41-node-labels) no longer defines a `Statement` vertex; [§1.2](./lrs-spec-v1.md#12-design-principles) adds *compress before materializing*; [§5.6](./lrs-spec-v1.md#56-statement-compression) prohibits per-statement vertices outright (C-1) and specifies the compression pipeline. The design now implements the spec rather than departing from it. |
| ~~D-2~~ | [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) | Three summary vertices, described as an optimization | **Closed.** [§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices) is now the primary event-derived model — six labels, each with an explicit grain and a `statements_compressed` count. |

### 11.2 Open

| # | Spec | Says | Design does | Why | Proposed amendment |
|---|------|------|-------------|-----|--------------------|
| D-3 | [§5.3](./lrs-spec-v1.md#53-durability-and-ordering) | Queue partitioned by `district_id`, sub-keyed by `student_key` | Key = `{district_id}:{student_key}`; noisy-neighbor protection via Kafka client quotas | Keying by `district_id` puts a large district on one partition — the exact hotspot [§12.1](./lrs-spec-v1.md#121-scale-availability) forbids. Quotas bound throughput, which is strictly stronger than bounding placement. This key is also what keeps BKT correct ([§5.3](./lrs-spec-v1.md#53-durability-and-ordering)). | Amend [§5.3](./lrs-spec-v1.md#53-durability-and-ordering) to require per-learner ordering and tenant quotas, not district-level partitioning. |
| D-4 | [§12.3](./lrs-spec-v1.md#123-privacy-compliance) | "No report may reveal a disaggregated result for a group smaller than the threshold" (default 10) | Threshold applies to cross-group, de-identified, and benchmark views; a role's **directly-rostered scope is exempt** | Read literally, R-101 breaks for every student (n=1) and R-201 for any class under 10. A teacher already knows their own roster; the threshold exists to stop re-identification by parties **without** that relationship. | Amend [§12.3](./lrs-spec-v1.md#123-privacy-compliance) to scope the threshold to non-rostered views, and to add **complementary suppression** explicitly. |
| D-5 | [§12.3](./lrs-spec-v1.md#123-privacy-compliance) | Threshold suppression | Adds complementary suppression | Suppressing one cell in a row that publishes its total suppresses nothing — the value is recoverable by subtraction. | Fold into the D-4 amendment. |

D-1 and D-2 closed when the specification adopted the compression model: the spec now states the constraint ([§5.6](./lrs-spec-v1.md#56-statement-compression) C-1 through C-7) and this document states the mechanism, which is the right division. **D-4 remains the one worth acting on before M3** — it is a usability bug that would render the instructor dashboards blank on day one.

---

## 12. Delivery Roadmap

| Milestone | Duration | Delivers | Exit criteria |
|-----------|----------|----------|---------------|
| **M0 — Walking skeleton** | 3 wks | Compose stack, image, CLI, bootstrap, gateway → Kafka → ClickHouse, smoke test | `make up && make smoke` passes from a cold clone |
| **M1 — Ingestion complete** | 4 wks | Pseudonymization, vault, accept-first provisioning, reconciler, DLQ, replay | ADL conformance suite passes; [§5.4](./lrs-spec-v1.md#54-non-blocking-onboarding-of-new-textbooks) verified by the smoke test |
| **M2 — Compression + graph + mastery** | 5 wks | Neo4j structure, ClickHouse rollup MVs, the `summarizer`, BKT engine, roster/OneRoster ingest | Replay reproduces mastery bit-for-bit; the C-1/C-3/C-4/C-6 compression suite ([§10](#10-testing-and-verification)) passes; graph lag < 90 s under `loadgen` |
| **M3 — Analytics + first dashboards** | 5 wks | Analytics API, privacy filter, R-101/102/104/201/202/209, My Classes + Student Detail | [§9.3](./lrs-spec-v1.md#93-interaction-requirements) budget met: ≤2s P95 for a 40-student section |
| **M4 — Admin + experiments** | 5 wks | Admin API/UI ([§10](./lrs-spec-v1.md#10-administrative-user-interfaces)), RBAC, audit, experiment service + readout | Assignment stickiness holds across an allocation ramp; [Sample-Ratio Mismatch](../glossary.md#sample-ratio-mismatch-srm) (SRM) check green |
| **M5 — Scale + production** | 4 wks | Helm, KEDA, managed stores, DR drill, full report catalog | `loadgen` sustains 10k/sec and absorbs a 50k burst; restore drill passes |

M0 exists to make the deployment story real on week three rather than week twenty. Everything after it is added to a stack that already runs.

---

## 13. Open Questions

1. **Neo4j production licensing.** Community cannot cluster, so it has no HA story; Enterprise and Aura both carry real cost at this scale. Memgraph is a credible drop-in with an Apache-2 core. Decide before M2, because the answer changes nothing in the code and everything in the budget. *Owner: architecture.*
2. **ClickHouse Cloud vs. self-hosted.** ~28 TB at 7-year retention makes this a six-figure decision either way. Needs a [Total Cost of Ownership](../glossary.md#total-cost-of-ownership-tco) (TCO) model against the S3 tiering plan. *Owner: infrastructure. Decide before M5.*
3. **Gateway language.** Stays Python unless real batch sizes approach 1 ([§5.1](#51-ingestion-gateway)). Instrument batch-size distribution in M1 so the M5 decision has data rather than opinion.
4. **BKT parameter fitting.** Per-concept [Expectation-Maximization](../glossary.md#expectation-maximization-em) (EM) over the log, nightly. Cold-start priors by taxonomy category are a guess until there is real data — revisit after M3 with an accuracy evaluation against held-out quiz outcomes.
5. **Retention vs. research value.** Spec [§12.3](./lrs-spec-v1.md#123-privacy-compliance) wants [Family Educational Rights and Privacy Act](../glossary.md#family-educational-rights-and-privacy-act-ferpa) (FERPA)-aligned purge; spec [§13](./lrs-spec-v1.md#13-open-questions-future-work) wants longitudinal predictive models. These conflict directly. Needs a de-identification policy that survives purge — likely irreversible aggregation at the 13-month tier boundary. *Owner: privacy + research.*
6. **Multi-region.** Out of scope for v1, but district data residency ([§10.2](./lrs-spec-v1.md#102-district-management-ui)) will force it. The district-keyed partitioning makes regional sharding tractable later; nothing here forecloses it.
7. **MicroSim evidence → BKT mapping.** ADR-006 ([§3.5](#35-adr-006-bayesian-knowledge-tracing-for-mastery)) requires non-binary MicroSim interaction evidence (dwell time, interaction depth) to be mapped to a soft-correctness value in \([0,1]\) before it can blend into a concept's BKT update, but no component owns that mapping yet. The schema's `result_score` / `result_success` columns ([§6.2](#62-clickhouse-the-event-log)) assume the *emitting client* already computed a per-statement score, which fits a graded question but not a continuous, exploratory control like a slider or drag target — no single `interacted` statement has a "correct" value; the signal lives in the whole session's interaction pattern (range covered, direction reversals, dwell time), which is exactly what the `MicroSimEngagement` grain ([§4.3](./lrs-spec-v1.md#43-materialized-summary-vertices)) already captures, but nothing today feeds that grain into `ConceptMastery`. Needs a decision: does a stream-side component compute soft correctness from raw interaction facts using a per-MicroSim-registered mapping (keeps scoring logic server-side, but needs a registry — see below); or does authoring tooling compute the proxy client-side and embed it in `result.score` on each emitted statement (simpler pipeline, but reopens a two-codebases problem — the same scoring logic then has to be authored and kept in sync in both the MicroSim's client code and wherever it's reviewed/versioned for the LRS). *Owner: architecture + MicroSim tooling. Tracked as an open retrofit-specification task in the project's root `TODO.md`.*

---

## References

1. [LRS Specification v1](./lrs-spec-v1.md) — the functional requirements this document realizes
2. [LRS Graph Data Model Explorer](../sims/lrs-data-model/index.md) — the [§4](./lrs-spec-v1.md#4-graph-data-model) model, interactively
3. [xAPI (Experience API) Specification](https://github.com/adlnet/xAPI-Spec) — ADL
4. [ADL LRS Conformance Test Suite](https://github.com/adlnet/lrs-conformance-test-suite)
5. Corbett, A. T. & Anderson, J. R. (1994). *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge.* User Modeling and User-Adapted Interaction, 4(4), 253–278. — the BKT model of [§3.5](#35-adr-006-bayesian-knowledge-tracing-for-mastery)
6. [ClickHouse documentation](https://clickhouse.com/docs) · [Neo4j documentation](https://neo4j.com/docs/) · [Redpanda documentation](https://docs.redpanda.com/)
7. [Dash documentation](https://dash.plotly.com/) — the [§9](./lrs-spec-v1.md#9-dashboard-specifications-dash-plotly-model) presentation model
8. [OneRoster specification](https://www.1edtech.org/standards/oneroster) — 1EdTech

---

*Design v1 — draft for review. Companion to [LRS Specification v1](./lrs-spec-v1.md). The three open deviations in [§11.2](#112-open) need a specification decision before M3; D-4 is the one that would otherwise ship blank instructor dashboards.*
