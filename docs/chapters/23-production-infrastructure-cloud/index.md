---
title: Production Infrastructure and Cloud Services
description: How the proven MVP from Chapter 22 grows into a managed, highly available production deployment — Kubernetes and autoscaling, managed Kafka and graph/columnar cloud services, and the identity and caching layers that back them.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 14:03:09
version: 0.09
---

# Production Infrastructure and Cloud Services

## Summary

This chapter closes Part 2 with the managed services production deployment runs on: Kubernetes and KEDA autoscaling, managed Kafka, ClickHouse Cloud, Neo4j AuraDB and Enterprise, load balancers, and the identity and caching services that back them.

## Concepts Covered

This chapter covers the following 24 concepts from the learning graph:

1. Kubernetes
2. Helm Chart
3. KEDA Autoscaler
4. Horizontal Pod Autoscaler
5. Availability Zone
6. Managed Streaming Kafka
7. Continuous Integration Pipeline
8. Total Cost Of Ownership
9. EM Parameter Fitting
10. Application Load Balancer
11. ClickHouse Cloud
12. Neo4j AuraDB
13. Neo4j Enterprise Edition
14. Causal Cluster Topology
15. RDS Multi-AZ Postgres
16. ElastiCache Redis
17. Dead Letter Queue Concept
18. Ingress Controller
19. High Availability Requirement
20. LRU Fallback Cache
21. Cache TTL Expiry
22. Managed Identity Provider
23. Step-Up Authentication
24. Client Credentials Grant

## Prerequisites

This chapter builds on concepts from:

- [Chapter 2: The Anatomy of an xAPI Statement](../02-anatomy-of-xapi-statement/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)
- [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md)
- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../17-compose-makefile-supply-chain/index.md)
- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../20-deviations-roadmap-open-questions/index.md)
- [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../21-hardware-cost-dev-environment/index.md)

---

!!! mascot-welcome "From a Chart to a Cluster"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 22 proved the compression architecture holds on a laptop, running against a cold clone of `docker compose`. That laptop stack was never meant to serve a real school district — it deliberately left out the managed infrastructure that a production deployment needs. This chapter is that missing piece: the substrate, the autoscalers, the managed cloud services, and the identity layer the design document specifies for running the LRS for real. Let's follow the record.

## The Same Image, a Different Substrate

The design document is explicit about what changes between a laptop and a production cluster, and what does not: **the container image, the CLI roles, and the data model stay identical.** What changes is the substrate each role runs on and which backing services are self-hosted containers versus managed cloud offerings. Chapter 17 introduced `docker compose` as the one-command way to run every role on a single host. Production replaces that single host with **Kubernetes**, an open-source system for running many containers across a pool of machines, automatically restarting failed ones, and routing traffic to healthy replicas. A **Helm Chart** is the packaging format Kubernetes deployments use to describe that whole application — one versioned bundle of templates that produces the Deployments, Services, and ConfigMaps a cluster needs, so promoting a new image version is a chart upgrade rather than a hand-edited set of YAML files.

This substitution is deliberately shallow. Each Compose service in Chapter 17 becomes one Kubernetes `Deployment`, still running `ghcr.io/dmccreary/lrs:<digest>` with a different `LRS_ROLE` argument, exactly the "one image, many roles" philosophy from Chapter 16. Nothing about the gateway's logic, the processor's batching, or the summarizer's sync cadence changes when it moves from a laptop to a cluster — only how many copies run, how they are placed, and what they talk to.

| Compose service (Chapter 17) | Production substrate |
|---|---|
| `gateway` container | Kubernetes Deployment behind a load balancer, autoscaled |
| `processor` container, scaled by `--scale` | Kubernetes Deployment, autoscaled on queue depth |
| `redpanda` container | Managed Kafka service |
| `clickhouse` container | Managed columnar cloud service or a self-hosted replicated cluster |
| `neo4j` container | Managed or self-hosted graph database cluster |
| `vault-db` / `meta-db` containers | Managed relational database service, each its own instance |
| `redis` container | Managed in-memory cache service |

!!! mascot-thinking "Same Roles, Different Muscles"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice what the table above is really saying: every row on the left is a single container on one machine, and every row on the right is a *managed, replicated* version of the same responsibility. The design never asked "what new components does production need?" It asked "which of the components we already built need to stop being single points of failure?" That question is what the rest of this chapter answers, component by component.

## Autoscaling: Two Different Signals for Two Different Jobs

A single-host Compose stack has no autoscaling at all — a developer runs `docker compose up -d --scale processor=3` by hand when they want more processor replicas. Production cannot wait for a human to notice a burst, so it wires two different autoscalers to two different signals, because the gateway and the processor scale for different reasons.

The **Horizontal Pod Autoscaler**, universally abbreviated **HPA**, is Kubernetes' built-in mechanism for adding or removing replicas of a Deployment based on a metric such as CPU utilization or requests per second. The gateway uses an HPA keyed on request rate and CPU, because it is a stateless HTTP service — more incoming requests means more CPU spent on validation and Kafka production, and an HPA reacts to exactly that signal.

The processor is different. Its bottleneck is not CPU load per request; it is **Kafka consumer lag** — how far behind the processor has fallen in reading the partitions it owns. An HPA has no native way to read that metric, so production uses the **KEDA Autoscaler**, short for Kubernetes Event-Driven Autoscaling, an add-on that can scale a Deployment against event-source metrics an HPA cannot see, including Kafka consumer-group lag. This is what actually implements the burst-insensitivity property Chapter 22 measured: when ingest jumps five-fold, consumer lag rises, KEDA adds processor replicas, and the replicas drain the backlog over the following minute — no person, and no gateway-side rejection, is involved.

#### Diagram: HPA vs. KEDA — Two Autoscalers React to a Burst

<iframe src="../../sims/hpa-vs-keda-burst-response/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>HPA vs. KEDA — Two Autoscalers React to a Burst</summary>
Type: workflow
**sim-id:** hpa-vs-keda-burst-response<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, contrast

Learning objective: Differentiate between CPU/RPS-driven autoscaling (HPA on the gateway) and consumer-lag-driven autoscaling (KEDA on the processor), and trace how each responds to the same 5x ingest burst.

Purpose: A single Mermaid flowchart with two parallel tracks sharing one "5x burst begins" starting node, so the learner can compare the two autoscaling paths side by side rather than read them as separate diagrams.

Top track "Gateway — Horizontal Pod Autoscaler": "5x burst begins" -> "Request rate and CPU climb per gateway pod" -> "HPA compares live metric to target" -> "HPA adds gateway replicas" -> "Requests spread across more pods, CPU normalizes."

Bottom track "Processor — KEDA Autoscaler": "5x burst begins" -> "Kafka consumer lag grows on xapi.statements.raw" -> "KEDA scaler polls lag metric" -> "KEDA adds processor replicas, each claiming idle partitions" -> "Replicas drain backlog over the following minute, lag returns to baseline."

Interactive features: Every node has a Mermaid click directive. Clicking a Gateway-track node opens an infobox on RPS/CPU-based scaling; clicking a Processor-track node opens an infobox on consumer-lag scaling and why an HPA cannot read that metric natively. Clicking the shared "5x burst begins" node opens an infobox recapping Chapter 22's burst insensitivity claim and noting this diagram shows the pod-level mechanism behind it.

Color coding: Gateway track in the book's teal accent color; Processor/KEDA track in a contrasting violet, so the two signal types stay visually distinct even when read quickly.

Responsive design: Tracks stack vertically on narrow viewports with the shared starting node repeated at the top of each; click targets stay tap-sized.
</details>

Both autoscalers place their new replicas across multiple **Availability Zones**, or **AZs** — physically separate data centers within one cloud region, each with independent power and networking. The design document's production topology puts a minimum of six gateway pods across three AZs, so a single data-center outage removes at most a third of gateway capacity rather than all of it. This is the first of several places in this chapter where a design choice exists purely to satisfy the **High Availability Requirement**: the expectation that a production system of record for student data keeps serving requests through the ordinary failures — a host reboot, a zone outage, a rolling deploy — that a single-server pilot simply cannot survive.

## Fronting the Cluster: Load Balancers and Ingress

A pool of gateway pods spread across three zones needs one stable address for a textbook's Learning Record Provider to send statements to. An **Application Load Balancer**, or **ALB**, is the cloud-managed component that accepts incoming HTTPS connections and distributes them across healthy backend pods, removing any pod that fails its health check from rotation automatically. Inside the cluster, an **Ingress Controller** is the Kubernetes-native counterpart: it reads `Ingress` resources — declarative rules mapping a hostname and path to a backend Service — and drives that same cloud load balancer from inside the cluster, rather than requiring a human to click through a console.

Together, an ALB and an Ingress Controller mean the gateway's public address never changes even as pod count rises and falls with the HPA. Chapter 1 named the Learning Record Provider as any software that constructs and sends xAPI statements — a mobile app, a simulator, an intelligent-textbook page — and none of those clients should ever need to know how many gateway replicas are currently running or in which zone.

Not every statement that reaches the gateway is well-formed. Chapter 9 established that a batch failing Tier-1 structural validation is rejected outright, all-or-nothing. Production adds one more safety net further downstream: the **Dead Letter Queue Concept**, universally abbreviated **DLQ**, is a separate topic that receives messages a consumer could not process after a bounded number of retries, so a single poison message — one statement whose enrichment step throws an unexpected error — cannot crash a processor in an endless restart loop. The processor keeps consuming the rest of the partition, and the dead-lettered statement waits in the DLQ topic for an administrator to inspect, exactly the mechanism the design document's failure-mode table names as the response to a poison message.

* The **Dead Letter Queue Concept** isolates one bad message from the healthy stream around it, rather than blocking the whole partition.
* An **Ingress Controller** keeps routing rules declarative and version-controlled, rather than a manual load-balancer configuration.
* An **Application Load Balancer** removes an unhealthy pod from rotation automatically, based on its health check.
* A **Horizontal Pod Autoscaler** and the **KEDA Autoscaler** both add replicas behind that same load balancer, without changing where clients send traffic.

!!! mascot-tip "Look for What Doesn't Change"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    A useful reading strategy for this chapter: every managed service introduced here replaces a single container from Chapter 17 with a *replicated* version of the same role. The gateway's code, the processor's batching logic, and the ALB/Ingress address in front of them are the constants. If you can name what a piece of production infrastructure is standing in for from the Compose file, you already understand why it exists.

## Managed Streaming and the Two Stores It Feeds

Chapter 14 built the Kafka topic layout — `xapi.statements.raw`, partitioned and keyed by district and student — against Redpanda, the single-binary, ZooKeeper-free stand-in the design document uses for local development. Production replaces that one container with **Managed Streaming Kafka**: a cloud provider's hosted Kafka-API-compatible service (Amazon MSK, Confluent Cloud, and Redpanda Cloud are the options the design document names) that runs the broker cluster, handles replication across zones, and exposes the same client protocol the processor already speaks. Nothing in the processor's code changes; only the operational burden of patching and replicating brokers moves to the managed provider.

The two stores downstream scale very differently, a distinction Chapter 11's capacity model already set up. **ClickHouse Cloud** is the managed offering for the statement log — the system of record receiving every statement at full fidelity — and must keep pace with the full ingest rate. **Neo4j AuraDB** is the managed offering for the graph tier, and because the summarizer's compression pipeline holds graph writes flat at roughly 2,500 upserts per second regardless of ingest volume, the graph side never needs to scale with that same urgency. The design document leaves the ClickHouse choice between this managed service and a self-hosted, replicated cluster an explicit open question, to be settled with a **Total Cost of Ownership**, or **TCO**, comparison — a full-lifecycle cost model weighing usage-based billing against the engineering time a self-hosted cluster demands, rather than comparing sticker prices alone. That is realistically a six-figure decision at the multi-year retention volumes Chapter 21 estimated, which is why the design document defers it to a dedicated cost study rather than guessing.

Neo4j's production path branches further than ClickHouse's. Because Neo4j **Community** — the free edition the Compose stack runs — cannot cluster, it has no path to high availability at all: a single Community instance is a single point of failure by construction. Production needs either **Neo4j Enterprise Edition**, the licensed, self-managed edition supporting clustering, or Neo4j AuraDB, the fully managed cloud service built on that same clustered engine. Both give the same underlying shape: a **Causal Cluster Topology**, Neo4j's replicated architecture in which core servers agree on writes through a consensus protocol while read replicas serve queries without competing for the same resources. The design document is candid that this is genuinely unresolved: Neo4j's licensing cost for a cluster this size is quote-based, and the hardware-requirements companion document places it anywhere from roughly three to eight thousand dollars a month as a planning placeholder, not a quote. An open-source alternative engine with a compatible query interface is named as the way this cost line could disappear entirely, if a vendor quote lands badly.

!!! mascot-warning "This Is Where the Spec Says 'Undecided,' Not 'Decided'"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It would be easy to write this section as if Neo4j Enterprise versus AuraDB versus an open-source alternative were already settled. It is not. The design document lists Neo4j's production licensing as an open question with an explicit owner and a decision deadline before the milestone that adds clustering, precisely because the answer changes the monthly bill by thousands of dollars without touching a single line of application code. When a spec says a decision is open, the honest move is to say so — not to invent a number that sounds authoritative.

#### Diagram: Neo4j's Production Path — Community, Enterprise, AuraDB, or an Alternative

<iframe src="../../sims/neo4j-licensing-decision-tree/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>Neo4j's Production Path — Community, Enterprise, AuraDB, or an Alternative</summary>
Type: infographic
**sim-id:** neo4j-licensing-decision-tree<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Evaluate why Neo4j Community's lack of clustering forces a production choice between Enterprise, AuraDB, and an open-source alternative, and judge each option against cost and high-availability requirements.

Purpose: A Mermaid decision-tree flowchart starting from the single fact that forces the whole branch: Community cannot cluster.

Root node: "Does this deployment need a Causal Cluster Topology for High Availability?" -> "No (pilot/single-server tier)" leads to "Neo4j Community — free, unclustered, single point of failure, acceptable at the ~250 upserts/sec pilot scale." -> "Yes (production, multi-AZ)" leads to three sibling branches: "Neo4j Enterprise (self-managed cluster)" — labeled "Real licensing cost, full operational control"; "Neo4j AuraDB (managed cluster)" — labeled "Real licensing cost, provider manages the cluster"; "Open-source alternative engine (e.g. Memgraph)" — labeled "No per-node license, requires validating drop-in compatibility."

Interactive features: Every node has a Mermaid click directive. Clicking the root node opens an infobox on why Causal Cluster Topology requires a licensed edition. Clicking any of the three production branches opens an infobox with that option's stated trade-off, sourced from the design document's own hedge language ("quote-based," "not yet decided"). A small footer note, revealed by clicking a "Status" tag at the bottom, states plainly: "This decision is marked OPEN in the design document — no branch here is the confirmed choice."

Color coding: The unclustered/pilot branch in calm teal; the three production branches in neutral gray rather than a "winner" color, signaling that none is yet selected; the root decision diamond in amber to mark it as the pivotal open question.

Responsive design: Tree reflows to a vertical stack on narrow viewports, root node pinned at top; click targets stay tap-sized.
</details>

## The Relational and Cache Tier: Multi-AZ by Default

Chapter 6 introduced the two PostgreSQL instances — the identity vault and the metadata store — as physically separate databases enforcing a compliance boundary, not a scaling one. In production, each becomes **RDS Multi-AZ Postgres**: Amazon's managed relational database service running in a Multi-AZ configuration, where a synchronously replicated standby in a second availability zone takes over automatically if the primary fails, with no application-level failover logic to write or maintain. The vault and metadata store keep their separate credentials and separate network policies exactly as Chapter 6 specified; only the underlying single-instance container becomes a managed, replicated pair.

Redis, the cache Chapter 13 used for token-to-district lookups and per-district salts, becomes **ElastiCache Redis** in production — a managed, Multi-AZ cache service with automatic failover to a replica if the primary node is lost. The gateway's authentication path leans on this cache directly: a bearer token's district mapping is cached with a **Cache TTL Expiry** of sixty seconds, meaning the cached entry is automatically discarded and re-fetched after that window, bounding how long a revoked token could still resolve to a district. But the design is explicit that Redis must never become a hard dependency for ingestion, so if the cache itself is unreachable, the gateway falls back to an **LRU Fallback Cache** — a small least-recently-used cache held in the gateway process's own memory — and keeps serving requests rather than blocking on a downstream failure. The fallback is deliberately worse than Redis (smaller, and not shared across gateway pods) but it exists precisely so that a cache outage degrades performance rather than availability.

#### Diagram: The Token Cache's Fallback Chain

<iframe src="../../sims/token-cache-fallback-chain/main.html" width="100%" height="642px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Token Cache's Fallback Chain</summary>
Type: workflow
**sim-id:** token-cache-fallback-chain<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Explain how a gateway's token-to-district lookup degrades from a shared Redis cache to a local LRU fallback as Cache TTL Expiry and Redis availability change, without ever blocking ingestion.

Purpose: A Mermaid flowchart tracing one incoming request's token lookup through every possible path.

Flow: "Gateway receives request with bearer token" -> "Check ElastiCache Redis for cached district mapping" -> two branches.

Branch A "Redis reachable, entry present and fresh (within 60s TTL)": -> "Return cached district_id" -> "Proceed to Tier-1 validation."

Branch B "Redis reachable, entry expired (Cache TTL Expiry passed)": -> "Re-fetch mapping from the identity service" -> "Re-populate Redis with a fresh 60s TTL" -> "Proceed to Tier-1 validation."

Branch C "Redis unreachable": -> "Fall back to the gateway pod's local LRU Fallback Cache" -> "Serve from local cache if present, else re-fetch from identity service directly" -> "Proceed to Tier-1 validation" with an annotation "Ingestion never blocks on cache health."

Interactive features: Every node has a Mermaid click directive. Clicking a TTL-related node opens an infobox defining Cache TTL Expiry with the 60-second default. Clicking the LRU node opens an infobox defining LRU Fallback Cache and why it is smaller and pod-local rather than shared. Clicking the final "Proceed to Tier-1 validation" node in any branch opens an infobox noting all three branches converge on the same non-blocking outcome.

Color coding: The healthy Redis path in teal; the fallback path in amber to flag it as the degraded-but-safe branch, not a failure state.

Responsive design: Branches stack vertically on narrow viewports; click targets stay tap-sized.
</details>

!!! mascot-encourage "Three New Cache Terms, One Familiar Shape"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Cache TTL Expiry, LRU Fallback Cache, ElastiCache Redis — that is a lot of new vocabulary for one caching layer. But you already met this exact shape in Chapter 9: non-blocking ingestion. Every one of these terms exists to answer the same question Chapter 9 asked about Neo4j and ClickHouse — "what happens to the gateway if this dependency is slow or down?" — just applied to the token cache instead. The pattern, not the vocabulary, is the thing to hold onto.

## Identity at Production Scale

The design document's dev stack runs Keycloak, an open-source identity provider, so that a developer has a real OpenID Connect provider to test against without depending on external infrastructure. Production instead points the analytics and admin surfaces at the customer's own **Managed Identity Provider** — the district's existing single sign-on system, run and operated by the district or a cloud identity vendor rather than by the LRS itself. This matters for a system serving schools specifically: districts already have an identity system staff and students log into every day, and asking them to maintain a second, separate set of credentials for the LRS would be both a security liability and an adoption barrier.

Two authentication mechanisms sit on top of that managed identity layer, serving different callers. The **Client Credentials Grant** is an OAuth 2.0 flow in which a piece of *software* — not a human — authenticates directly with a client ID and secret to obtain an access token, with no user ever present to click through a login screen. This is exactly the shape of an xAPI Learning Record Provider: an intelligent-textbook page or a MicroSim has no human sitting at a login prompt, so it authenticates as itself, scoped to one district or textbook, and the token it receives is what the gateway validates on every ingest request.

Human administrators accessing sensitive data need a stronger guarantee than a textbook's software client does. **Step-Up Authentication** is the practice of requiring an additional authentication factor at the moment a user attempts a higher-risk action — reading personally identifiable information, for instance — even if they are already signed in with a valid session. The design document applies this specifically to the Admin API's PII-adjacent operations: an administrator who is already authenticated via OIDC for ordinary dashboard use must re-verify before an operation that could expose a real learner identity, which is a materially different guarantee than the always-on token a Learning Record Provider carries.

| Surface | Authentication | What it proves |
|---|---|---|
| xAPI ingest (Learning Record Provider) | Client Credentials Grant, scoped to a district or textbook | This request comes from an authorized piece of software, no human present |
| Analytics API / Dashboards | Managed Identity Provider via OIDC | This request comes from a signed-in district or school staff member |
| Admin API, PII-adjacent operations | Managed Identity Provider via OIDC, plus Step-Up Authentication | This specific sensitive action was just re-confirmed by that same person |

## Verifying the Cluster Before It Serves a Real Student

None of the managed services above are trustworthy in production just because they worked in Chapter 22's Compose stack. The design document is explicit that a clustered ClickHouse or Neo4j configuration is a genuinely different runtime from the single-node version Compose runs, so a **Continuous Integration Pipeline** — the automated system that builds, tests, and validates every code change before it ships — must exercise the *clustered* configuration directly, using the same image tags Compose uses, rather than assuming a passing laptop test implies a passing cluster. This is the same "trust but verify" instinct Chapter 22 applied to the MVP's own smoke harness, now aimed at the substrate itself: a green checkmark from a single-node test proves nothing about a three-node causal cluster's behavior under a leader election or a rolling upgrade.

One more piece of production math is still a genuine work in progress rather than a settled procedure: **EM Parameter Fitting**. Chapter 12 introduced Bayesian Knowledge Tracing's per-concept parameters — the probabilities of a slip, a guess, and a learning transition — and the design document specifies that these are fit nightly using Expectation-Maximization, an iterative statistical method that estimates a model's hidden parameters from observed evidence, run as an offline batch job over the ClickHouse log. What the design document does not yet resolve is how a brand-new concept, with no evidence history at all, should get its starting parameters before that nightly job has anything to fit — it currently inherits priors from its taxonomy category as a placeholder, flagged for revisiting once real accuracy data exists. Naming this honestly matters more than smoothing it over: a production system that quietly assumes untested cold-start priors are correct is exactly the kind of "green checkmark, wrong underneath" failure Chapter 22 spent an entire chapter warning about.

The table below gathers the open questions this chapter has surfaced, so they read as a punch list rather than scattered asides.

| Open question | What decides it |
|---|---|
| ClickHouse Cloud vs. self-hosted cluster | A Total Cost of Ownership study weighing usage-based billing against operational burden |
| Neo4j Enterprise vs. AuraDB vs. an open-source alternative | A vendor licensing quote, decided before the milestone that adds clustering |
| Cold-start priors for EM Parameter Fitting | An accuracy evaluation against held-out quiz outcomes, once enough real data exists |
| Gateway language (Python vs. a faster runtime) | Real batch-size distribution data instrumented during early production traffic |

#### Diagram: From Walking Skeleton to Scaled Production

<iframe src="../../sims/production-delivery-roadmap/main.html" width="100%" height="422px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Walking Skeleton to Scaled Production</summary>
Type: timeline
**sim-id:** production-delivery-roadmap<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the design document's delivery milestones from a walking skeleton through scaled production, and identify which milestone introduces each managed service covered in this chapter.

Time period: Not calendar time — six sequential delivery milestones rendered as contiguous blocks in build order.

Orientation: Horizontal, left to right, each block labeled with its milestone code and headline deliverable.

Events:

- M0 Walking skeleton: Compose stack, image, CLI, bootstrap, gateway through Kafka to ClickHouse, smoke test
- M1 Ingestion complete: pseudonymization, vault, accept-first provisioning, reconciler, Dead Letter Queue, replay
- M2 Compression plus graph plus mastery: Neo4j structure, ClickHouse rollup views, the summarizer, BKT engine — Neo4j licensing decision due here
- M3 Analytics plus first dashboards: Analytics API, privacy filter, first report set
- M4 Admin plus experiments: Admin API and UI, RBAC, audit, experiment service
- M5 Scale plus production: Helm, KEDA, managed stores (Managed Streaming Kafka, ClickHouse Cloud, Neo4j AuraDB/Enterprise, RDS Multi-AZ Postgres, ElastiCache Redis), disaster-recovery drill, full report catalog

Interactive features: Clicking a milestone block opens an infobox with its full deliverable list and exit criteria. A "Highlight this chapter's services" toggle overlays which managed services from Chapter 23 first appear at M5, and marks M2 with a small flag icon noting the Neo4j licensing decision deadline discussed in this chapter.

Visual style: M0 through M4 shaded calm teal as already-covered ground; M5 shaded amber as the milestone this chapter belongs to.

Responsive design: Resizes to its container's width; on narrow viewports labels abbreviate to milestone code and expand on tap.
</details>

## Closing Part 2

That roadmap closes the architecture half of this book. Part 2 began with the system context and the five architectural planes in Chapter 5, worked through the graph model, the compression pipeline, and the twelve core functions, chose a technology stack and justified it with architecture decision records, and finished by proving the resulting design on real code before dressing it in the managed, highly available infrastructure this chapter describes. Every one of those chapters answered a question about the system itself: what it stores, how it scales, how it survives failure.

Part 3 asks a different kind of question. A Kubernetes cluster with autoscaled processors and a causal Neo4j cluster behind an ALB is not, by itself, useful to anyone — it becomes useful only through the dashboards, reports, and administrative surfaces that a district administrator, a teacher, and a textbook author actually sit down in front of. The next chapter introduces those three personas by name and maps out the admin UI surface each of them uses, shifting this book's attention from how the LRS is built to who it is built for.

## Key Takeaways

- **Kubernetes** and a **Helm Chart** replace the single-host Compose stack with a cluster running the same image and roles, packaged as one versioned, upgradable unit.
- The **Horizontal Pod Autoscaler** scales the gateway on CPU and request rate, while the **KEDA Autoscaler** scales the processor on Kafka consumer lag — two different signals for two different bottlenecks.
- An **Application Load Balancer** and an **Ingress Controller** give the cluster one stable address regardless of how many pods are running or which **Availability Zone** they sit in, which is what the **High Availability Requirement** demands.
- **Managed Streaming Kafka** replaces the single Redpanda container without changing the processor's client code; a **Dead Letter Queue** isolates one poison message from the rest of a partition.
- **ClickHouse Cloud**, **Neo4j AuraDB**, and **Neo4j Enterprise Edition** are the managed and licensed options for the two storage tiers, with the graph tier's **Causal Cluster Topology** needed only because Community edition cannot cluster at all — and the choice between them remains an explicitly open, cost-driven question resolved by a **Total Cost of Ownership** study.
- **RDS Multi-AZ Postgres** and **ElastiCache Redis** give the relational and cache tiers automatic zone failover, while a **Cache TTL Expiry** and an **LRU Fallback Cache** keep the gateway's token lookups fast and non-blocking even when the shared cache is unreachable.
- A **Managed Identity Provider** replaces the dev stack's Keycloak with the district's real single sign-on system; a **Client Credentials Grant** authenticates software clients like Learning Record Providers, while **Step-Up Authentication** adds a re-verification step for sensitive Admin API operations.
- A **Continuous Integration Pipeline** must test the clustered configuration directly rather than trusting a single-node laptop result, and **EM Parameter Fitting**'s cold-start behavior remains a named, unresolved detail rather than a quietly assumed one.

!!! mascot-celebration "The Architecture Now Has a Home"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    From a proven compression claim to a fully managed, multi-zone cluster — that's Part 2, done. What does the evidence show? An architecture that survives a 5x burst on a laptop and a design that names its own open questions honestly is one worth building for real students. In [Chapter 24: Meet the Three Personas and the Admin UI Surface](../24-three-personas-and-admin-uis/index.md), we turn from how this system is built to who it's built for.
