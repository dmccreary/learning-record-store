---
title: Hardware Requirements & Cost Estimate — 10k Statements/Sec
description: Server and cloud-infrastructure sizing for the LRS at the specification's peak-sustained ingest target, with a component-by-component monthly cost estimate.
image: ../img/cover.png
status: scaffold
---

# Hardware Requirements & Cost Estimate — 10k Statements/Sec

**Companion to:** [LRS Specification v1](./lrs-spec-v1.md) · [LRS Design & Deployment v1](./lrs-design-v1.md)
**Status:** Draft for review · 2026-07-15
**Scope:** What physical/cloud hardware the [§5.5 backpressure-and-scale](./lrs-spec-v1.md#55-backpressure-and-scale) target actually requires, and what it costs per month to run.

---

## 1. The Requirement, Restated

Spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) sets **sustained ingest ≥ 10,000 statements/sec, bursting to 50,000/sec**. Design doc [§4](./lrs-design-v1.md#4-capacity-model) turns that into a load profile:

| Quantity | Value |
|----------|-------|
| Peak sustained ingest | 10,000 stmt/sec |
| Burst | 50,000 stmt/sec |
| Mean statement size | ~1.5 KB |
| Statements/day (diurnal, not flat) | ~144 M |
| Raw JSON/day | ~216 GB |
| HTTP requests/sec at the gateway | ~100–400 (xAPI batches 25–100 statements/request) |
| Graph upserts/sec (compressed) | ~2,500 at the default 60 s sync cadence |

**The one fact that shapes every hardware decision below:** 10,000 statements/sec is not 10,000 anything/sec everywhere in the system. It is ~100–400 HTTP requests/sec at the gateway (batching), ~2,500 writes/sec at the graph (compression, design doc [§4.1](./lrs-design-v1.md#41-the-compression-math)), and 15 MB/sec (120 Mbps) of raw network ingress — a number small enough that no component in this system is network-bound. The hardware problem is disk throughput and steady CPU for the stream, not network capacity.

---

## 2. What Needs to Scale, and What Doesn't

| Plane | Scales with ingest rate? | Why |
|-------|--------------------------|-----|
| Gateway, processor pods | Yes — directly | Stateless; CPU- and request-bound |
| Kafka/Redpanda | Yes — disk and broker throughput | Every statement is written once, replicated ×3 |
| ClickHouse | Yes — disk and ingest throughput | Every statement lands here (system of record) |
| Summarizer → Neo4j | **No** — flat at ~2,500 upserts/sec | Compression math ([§4.1](./lrs-design-v1.md#41-the-compression-math)): a 5× burst adds statements per active student, not new active students |
| Redis, Postgres | **No** — sized by student/district count, not statement rate | Cache and metadata volume tracks population, not event throughput |
| 50k burst | **No new hardware** — absorbed by Kafka's queue depth, drained by autoscaled processors over the following minute | Design doc [§8.11](./lrs-design-v1.md#811-production-sizing-at-10k-statementssec) |

This is the reason the burst target doesn't double the bill: only the queue (cheap, disk-bound) needs headroom for it, and processor pods autoscale on consumer lag ([KEDA](../glossary.md#kubernetes-event-driven-autoscaling-keda)) for the few minutes a burst lasts rather than running oversized around the clock.

---

## 3. Hardware Requirements by Component

Figures for gateway, processor, summarizer, Kafka, ClickHouse, Neo4j, and Redis are carried forward from design doc [§8.11](./lrs-design-v1.md#811-production-sizing-at-10k-statementssec). Identity, analytics/admin APIs, dashboards, and the reconciler are not sized there; the figures for those five rows are new estimates for this document, based on their request volume ([§4](./lrs-design-v1.md#4-capacity-model): ~100–400 req/sec at the gateway, lower still downstream) and are flagged as such.

| Component | Hardware | Basis |
|-----------|----------|-------|
| Gateway | 6 pods × 2 vCPU / 2 GB (18 vCPU / 12 GB w/ 1 spare for rolling deploy) | Design doc §8.11 — ~400 req/sec ÷ 6 pods |
| Stream processor | 5 pods × 4 vCPU / 4 GB | Design doc §8.11 — 48 Kafka partitions ÷ 5, ~2,000 stmt/sec/pod |
| Summarizer | 2 pods × 4 vCPU / 8 GB, sharded by district | Design doc §8.11 — ~2,500 upserts/sec, flat through a 5× burst |
| Reconciler | 1 pod × 2 vCPU / 2 GB, leader-elected (single active) | *New estimate* — low volume: provisional-stub promotion only |
| Identity service | 3 pods × 1 vCPU / 1 GB | *New estimate* — salt lookups, cached in Redis with local LRU fallback |
| Analytics API | 4 pods × 2 vCPU / 2 GB | *New estimate* — cacheable, fixed-shape report queries |
| Admin API | 2 pods × 1 vCPU / 1 GB | *New estimate* — low-traffic, config/RBAC surface |
| Dashboards (Dash/Plotly) | 3 pods × 1 vCPU / 2 GB | *New estimate* — human traffic, not statement-rate-bound |
| Kafka (Redpanda/MSK) | 3 brokers × 4 vCPU / 16 GB / 1 TB NVMe | Design doc §8.11 — 1.1 TB at RF=3, ~65% headroom |
| ClickHouse | 3 nodes × 8 vCPU / 32 GB / 4 TB NVMe + S3 cold tier | Design doc §8.11 — 13-month hot window ≈ 9 TB ÷ 3 nodes |
| Neo4j | 3 nodes × 8 vCPU / 32 GB (causal cluster) | Design doc §8.11 — ~15 M structural nodes fit in page cache |
| Redis | 3 shards × 13 GB (Multi-AZ, 6 nodes incl. replicas) | Design doc §8.11 — ~400 M mastery entries, hot subset only |
| PostgreSQL ×2 | db.r6g.xlarge-class (4 vCPU / 32 GB), Multi-AZ | Design doc §8.11 — vault-db + meta-db, low volume/high sensitivity |

**Why NVMe, specifically, for Kafka and ClickHouse.** Both are on the write-hot-path at the full 10k–50k stmt/sec rate and depend on sustained sequential-write throughput and low fsync latency; network-attached block storage (e.g., standard EBS gp3) adds latency that compounds under burst. This is the one place where "server hardware" in the literal sense — local NVMe, not networked storage — matters for meeting the spec's [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) target, cloud or on-prem.

**Network.** Sustained ingress at the gateway is ~15 MB/sec (120 Mbps); the 50k burst is ~75 MB/sec (600 Mbps). Internal fan-out (Kafka replication ×3, processor reads, ClickHouse writes) multiplies this several-fold but stays in the low-Gbps range — well inside a single 10 GbE NIC, let alone the 25 GbE typical of current cloud instance families. Network is not a binding constraint anywhere in this design.

### 3.1 Compute-plane roll-up

Summing the pod requests above (~55 vCPU / ~68 GB) and adding ~30% headroom for autoscaler burst, system daemonsets, and rolling deploys gives a Kubernetes worker pool of roughly **9 nodes × 8 vCPU / 16 GB, 3 per Availability Zone** — comfortably covers steady state and absorbs the brief processor scale-out during a 50k burst without new nodes in most cases (cluster autoscaler adds 1–2 nodes only if a burst coincides with other scale-out activity).

---

## 4. Monthly Cost Estimate

These are **planning-level estimates**, not a vendor quote: AWS us-east-1 on-demand list pricing, mid-2026 order of magnitude, rounded. Actual pricing varies by region, and this workload — steady, predictable, 24/7 — is a strong candidate for 1–3 year Reserved Instances or Savings Plans, which typically cut 30–50% off the on-demand figures below. Managed-service choices follow design doc [§8.10](./lrs-design-v1.md#810-production-topology).

| Line item | Configuration | Est. $/month |
|-----------|---------------|--------------|
| Kubernetes control plane + worker nodes | EKS + 9 × 8 vCPU/16 GB nodes, 3 AZs | ~$2,300 |
| Kafka (managed — MSK/Confluent/Redpanda Cloud) | 3 brokers, 4 vCPU/16 GB, 1.1 TB storage | ~$1,950 |
| ClickHouse (self-hosted, NVMe nodes) | 3 × 8 vCPU/32 GB/4 TB NVMe | ~$1,980 |
| ClickHouse S3 cold tier | ~19 TB at steady state (7-yr retention, post-13-month tiering) | ~$240 (grows from ~$0 in year 1) |
| Neo4j infrastructure | 3 × 8 vCPU/32 GB (causal cluster) | ~$840 |
| Neo4j Enterprise/Aura license | *Open question — design doc [§13](./lrs-design-v1.md#13-open-questions), item 1* | **Unresolved — see §5 below** |
| Redis (ElastiCache, Multi-AZ) | 3 shards × 13 GB, 6 nodes incl. replicas | ~$990 |
| PostgreSQL ×2 (RDS, Multi-AZ) | db.r6g.xlarge-class × 2, incl. standby | ~$1,520 |
| S3 (exports, audit trail, MinIO-equivalent) | Low volume | ~$100 |
| Load balancing, NAT, cross-AZ data transfer | ALB + 3-AZ NAT + internal traffic | ~$400 |
| **Subtotal, infrastructure only** | | **~$10,300/month** |

Reserved/Savings Plan pricing on the steady-state pieces (compute, Kafka, ClickHouse, Neo4j infra, Redis, Postgres) would bring this toward **~$6,500–7,500/month**; the figures above are the on-demand ceiling, not the number a production deployment would actually pay after committing.

---

## 5. The Open Cost Variable: Neo4j Licensing

Design doc [§13](./lrs-design-v1.md#13-open-questions), item 1, already flags this as undecided, and it's the single largest source of uncertainty in this estimate: **Neo4j Community cannot cluster**, so the 3-node causal cluster in §3 requires either Neo4j **Enterprise** (self-managed) or **AuraDB Enterprise** (managed) — neither publishes list pricing; both are quote-based and commonly land in the low-to-mid five figures **per year** for a cluster this size, i.e. roughly **$3,000–8,000/month** as a rough planning placeholder, not a quote.

Two ways this line item could disappear rather than needing to be budgeted:

- **Memgraph**, the drop-in alternative the design doc names, has an Apache-2.0 core with no per-node licensing cost — it would replace the Neo4j Enterprise/Aura line with just the infrastructure cost already counted above.
- A vendor quote could land anywhere in that range or outside it; this should be resolved before committing to a production budget, per the design doc's own recommendation ("decide before M2, because the answer changes nothing in the code and everything in the budget").

---

## 6. Cost Sensitivity — What Actually Moves the Number

| Driver | Effect |
|--------|--------|
| Statement rate (10k → 50k sustained, not just burst) | Kafka and ClickHouse scale roughly linearly; Neo4j, Redis, Postgres barely move (§2) |
| Retention window (7-year ClickHouse retention) | The S3 cold-tier line grows over the system's life, from ~$0 in year 1 toward ~$240/month once the full 28 TB is in place; hot-tier NVMe cost is flat regardless of retention |
| Sync cadence (design doc [§4.1](./lrs-design-v1.md#41-the-compression-math): 5 s vs. 60 s vs. 300 s) | Only affects Neo4j write load and graph lag, not hardware cost — Neo4j is already sized for the worst case in this table |
| Managed vs. self-hosted ClickHouse/Kafka | Managed (MSK, ClickHouse Cloud) trades ops burden for a usage-based bill that can run higher than the self-hosted NVMe estimate above at sustained high throughput; self-hosted trades money for the on-call burden design doc §8.10 accepts for Kafka/ClickHouse but not for Postgres/Redis |
| Neo4j Enterprise/Aura vs. Memgraph | The single largest swing factor in this whole estimate (§5) |

---

## 7. Caveats

- All dollar figures are order-of-magnitude planning estimates from public on-demand pricing, not a cloud-provider quote or a signed vendor contract.
- Sizing here assumes the design doc's default 60 s summarizer sync cadence and 7-day Kafka retention; both are configurable and don't change hardware, only latency and replay-window trade-offs (design doc [§4.1](./lrs-design-v1.md#41-the-compression-math)).
- The five *new estimate* rows in §3 (reconciler, identity, analytics API, admin API, dashboards) are this document's own sizing, not carried from the design doc, and should be revisited once real request-volume data exists for those services.
- This estimate excludes one-time costs (initial data migration, load testing per design doc [§8.11](./lrs-design-v1.md#811-production-sizing-at-10k-statementssec)'s `lrs loadgen --rate 10000`, security review) and non-infrastructure costs (engineering time, support contracts).
