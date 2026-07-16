---
title: Hardware Requirements & Cost Estimate — 10k Statements/Sec
description: Server and cloud-infrastructure sizing for the LRS at the specification's peak-sustained ingest target and at a lower-cost single-server tier, with component-by-component monthly cost estimates.
image: ../img/cover.png
status: scaffold
---

# Hardware Requirements & Cost Estimate — 10k Statements/Sec

**Companion to:** [LRS Specification v1](./lrs-spec-v1.md) · [LRS Design & Deployment v1](./lrs-design-v1.md)
**Status:** Draft for review · 2026-07-15
**Scope:** What physical/cloud hardware the [§5.5 backpressure-and-scale](./lrs-spec-v1.md#55-backpressure-and-scale) target actually requires, and what it costs per month to run. [§8](#8-lower-cost-alternative-single-server-at-1000-statementssec) covers a lower-cost, single-server tier at 1,000 statements/sec for smaller deployments.

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

---

## 8. Lower-Cost Alternative: Single Server at 1,000 Statements/Sec

At 1/10th the ingest rate — 1,000 statements/sec sustained — the whole system fits on one physical server. This section derives that tier's capacity model the same way design doc [§4](./lrs-design-v1.md#4-capacity-model) derives the 10k tier, then sizes a single-host deployment against it.

**Why this tier matters beyond cost.** A single-server deployment isn't just a cheaper placeholder for the eventual production system — it's a legitimate pilot vehicle. It runs the same image and the same data model as the 10k tier (design doc [§8.1](./lrs-design-v1.md#81-philosophy-one-image-many-roles), "one image, many roles"), so it validates the capacity-model assumptions this whole document rests on — duty cycle, statement size, compression ratios (design doc [§4](./lrs-design-v1.md#4-capacity-model)) — against real school telemetry rather than the estimates used here. Just as importantly, it puts the actual reports and dashboards (spec [§7](./lrs-spec-v1.md#7-reports-and-analytical-tools), [§9](./lrs-spec-v1.md#9-dashboard-specifications-dash-plotly-model)) in front of real teachers and administrators early, so their feedback can shape what gets built out before infrastructure spend scales to match.

**Population assumption.** 1,000 stmt/sec ÷ ~0.1 stmt/sec/student implies ~10,000 concurrent active students at peak (design doc [§4.1](./lrs-design-v1.md#41-the-compression-math)'s ratio) — roughly one large district or a handful of mid-size ones, not the multi-district fleet the 10k tier is sized for. The figures below assume total registered population, content catalog, and Neo4j structural-node count scale down with it; this is a smaller deployment, not the same fleet with less traffic, and should be revisited if that assumption doesn't hold for the actual customer.

### 8.1 Capacity model at 1,000 stmt/sec

| Quantity | Value | Derivation |
|----------|-------|------------|
| Peak sustained ingest | 1,000 stmt/sec | 1/10 of spec [§5.5](./lrs-spec-v1.md#55-backpressure-and-scale) |
| Burst (same 5× ratio) | 5,000 stmt/sec | |
| Statements/day | ~14.4 M | 1,000 × 0.40 × 36,000 s |
| Raw JSON/day | ~21.6 GB | 14.4 M × 1.5 KB |
| Kafka disk @ 7-day retention | ~113 GB | Same zstd/RF=3 math as design doc §4, ÷10 |
| ClickHouse @ 13-month hot window | ~1 TB | ~22 GB/day ÷10, ×395 days |
| ClickHouse @ 7-year retention | ~2.8 TB | |
| HTTP requests/sec at peak | ~10–40 | 1,000 ÷ batch size 25–100 |
| Graph upserts/sec (60 s cadence) | ~250 | Design doc [§4.1](./lrs-design-v1.md#41-the-compression-math) ratio, ÷10 |
| Network ingress, sustained / burst | 12 Mbps / 60 Mbps | 1,000×1.5 KB and 5,000×1.5 KB |

Every number that mattered for hardware selection at the 10k tier is comfortably inside single-node territory here: sub-2 TB of hot storage, low hundreds of Mbps of network, and a graph write rate (~250/sec) an order of magnitude below what a single unclustered Neo4j instance handles without strain.

### 8.2 Yes — this runs as VMs on one server

Design doc [§8.9](./lrs-design-v1.md#89-profiles-and-laptop-sizing) already runs the *entire* stack — every store plus all seven app roles — in ~8 GB of RAM via `docker compose up` on a laptop, just at negligible dev-scale load. The 1,000 stmt/sec tier is that same shape, resourced for real production traffic instead of a laptop, split across a small number of VMs on one physical host rather than one VM per microservice.

**Why VMs at all, if it's one box:** spec [§12.2](./lrs-spec-v1.md#122-security) requires the PII vault (`vault-db`) to be a separate instance with its own network policy — that's a compliance boundary, not a scale-driven one, and it holds regardless of deployment size. A hypervisor (Proxmox, KVM, ESXi) gives that isolation on a single machine without needing Kubernetes.

| VM | Contents | vCPU / RAM | Notes |
|----|----------|------------|-------|
| `app` | gateway, processor, summarizer, reconciler, identity, analytics-api, admin-api, dashboards — same image, `docker compose`, design doc [§8.1–8.3](./lrs-design-v1.md#81-philosophy-one-image-many-roles) | 16 vCPU / 20 GB | 2 gateway + 2 processor replicas for rolling deploys; rest single-replica |
| `streaming-analytics` | Redpanda (single broker), ClickHouse (single node) | 8 vCPU / 28 GB | NVMe-backed; ClickHouse needs the ~1 TB hot window + headroom |
| `graph-cache` | Neo4j **Community**, single instance; Redis | 6 vCPU / 20 GB | ~250 upserts/sec doesn't need a causal cluster — Community suffices, no Enterprise/Aura license needed at this tier |
| `vault` | `vault-db` (PostgreSQL) only, minimal egress | 2 vCPU / 4 GB | The spec §12.2 isolation boundary — kept as its own VM even here |
| `meta-objects` | `meta-db` (PostgreSQL), MinIO/object store | 3 vCPU / 6 GB | |
| **Total** | | **~35 vCPU / ~78 GB** | |

**Single-server hardware spec:** a dual-socket server with 32–48 physical cores (64–96 threads), 128 GB RAM, and 2–4 TB NVMe in a RAID1/10 mirror (no cluster replication factor here, so disk-level redundancy replaces it) covers this with real headroom. This is a standard mid-range rack server (Dell/HPE/Supermicro) or an equivalent single large cloud/bare-metal instance — not exotic hardware.

### 8.3 The trade-off: no high availability

This deliberately gives up the multi-AZ, 3-node-quorum topology in design doc [§8.10](./lrs-design-v1.md#810-production-topology):

- **Single point of failure.** Every store (Kafka, ClickHouse, Neo4j) is unclustered — a host fault, OS patch reboot, or VM crash takes the whole system down until it restarts. There is no replica to fail over to.
- **Kafka RF=1 in practice**, not RF=3 — durability rests on the RAID array, not on cross-broker replication. ClickHouse remains the true system of record; Kafka's 7-day retention is still just a replay buffer (design doc §4), so this mainly affects how much lag is survivable during a restart.
- **Mitigations, if some availability matters:** nightly/hourly backups to off-box object storage, RAID for disk-level redundancy (already assumed above), and — far cheaper than a second full 3-AZ cluster — a warm standby second server built from backups/async replication for a manual failover path.

### 8.4 Cost estimate

| Option | Configuration | Est. cost |
|--------|---------------|-----------|
| Rent — large cloud VM/bare-metal instance | ~64 vCPU / 128–256 GB / local NVMe (e.g., AWS `i3en`/`m6i` class) | ~$1,000–2,500/month on-demand |
| Rent — dedicated/bare-metal hosting (flat monthly fee, not hourly cloud billing) | Comparable dual-socket spec | ~$300–800/month, approximate — get a current quote |
| Buy — owned hardware, 3-year amortization | Dual-socket server, 32–48 cores, 128 GB RAM, NVMe RAID | ~$8,000–15,000 upfront ≈ $220–420/month amortized, **+** ~$150–400/month colocation/power/bandwidth if not run in-house |

All three options land **roughly 10–20× cheaper** than the [§4 cost estimate](#4-monthly-cost-estimate) for the 10k tier (~$10,300/month on-demand), for two compounding reasons: the infrastructure itself is 1/10th the size, and there's no multi-AZ/multi-node redundancy tax. It also **removes the Neo4j licensing open question from [§5](#5-the-open-cost-variable-neo4j-licensing) entirely** — Community edition is sufficient without clustering, so that line item drops to $0 rather than needing a vendor quote.

**When this tier stops fitting:** if sustained ingest approaches ~3,000–5,000 stmt/sec, or the no-HA trade-off in §8.3 becomes unacceptable (this is a production system of record for student data), it's time to move toward the distributed topology in [§3](#3-hardware-requirements-by-component) rather than scaling the single box further.
