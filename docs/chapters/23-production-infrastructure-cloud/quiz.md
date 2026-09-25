---
title: "Quiz: Production Infrastructure and Cloud Services"
description: Review questions on Kubernetes and autoscaling, load balancing and ingress, managed streaming and storage tiers, the relational and cache tier, identity at production scale, and cluster verification.
social:
   cards: false
---
# Quiz: Production Infrastructure and Cloud Services

Test your understanding of this project's production infrastructure and managed cloud services with these review questions.

---

#### 1. What stays identical between a laptop Compose stack and a production Kubernetes cluster, according to the design document?

<div class="upper-alpha" markdown>
1. The container image, the CLI roles, and the data model
2. The number of replicas running for each role
3. Whether backing services are self-hosted or managed
4. The Availability Zone each pod runs in
</div>

??? question "Show Answer"
    The correct answer is **A**. The design document is explicit that the image, CLI roles, and data model stay identical between environments — only the substrate and which backing services are managed versus self-hosted changes. B, C, and D each describe exactly what does change between a laptop and production, not what stays constant.

    **Concept Tested:** Kubernetes / Helm Chart

    **See:** [The Same Image, a Different Substrate](index.md#the-same-image-a-different-substrate)

---

#### 2. Why does the gateway use a Horizontal Pod Autoscaler while the processor uses the KEDA Autoscaler instead?

<div class="upper-alpha" markdown>
1. HPA and KEDA are interchangeable, and the choice between them is arbitrary
2. The processor uses HPA because it is stateful, while the gateway uses KEDA because it is stateless
3. KEDA can only scale gateway-type HTTP services, never Kafka consumers
4. The gateway is stateless and scales on CPU/request-rate, a signal an HPA reads natively; the processor's bottleneck is Kafka consumer lag, a metric an HPA cannot read but KEDA can
</div>

??? question "Show Answer"
    The correct answer is **D**. The gateway's load shows up as CPU and request rate, which an HPA reads natively, while the processor's real bottleneck is Kafka consumer lag, a signal only KEDA can act on. A wrongly treats two purpose-built tools as interchangeable. B reverses which role uses which autoscaler. C misstates KEDA's actual purpose, which is exactly to scale against event-source metrics like Kafka lag.

    **Concept Tested:** Horizontal Pod Autoscaler / KEDA Autoscaler

    **See:** [Autoscaling: Two Different Signals for Two Different Jobs](index.md#autoscaling-two-different-signals-for-two-different-jobs)

---

#### 3. What does the High Availability Requirement demand of a production LRS deployment?

<div class="upper-alpha" markdown>
1. That every component run in exactly one Availability Zone for simplicity
2. That the system achieve 100% uptime with zero possible downtime under any circumstance
3. That the system keeps serving requests through ordinary failures — a host reboot, a zone outage, a rolling deploy — that a single-server pilot cannot survive
4. That only the gateway, and no other component, needs to tolerate a zone outage
</div>

??? question "Show Answer"
    The correct answer is **C**. The requirement is about surviving ordinary operational failures, not an impossible zero-downtime absolute. A contradicts the whole point of multi-zone placement. B overstates the requirement into an unachievable guarantee. D understates the requirement's scope, which applies across the production topology, not just the gateway.

    **Concept Tested:** Availability Zone / High Availability Requirement

    **See:** [Autoscaling: Two Different Signals for Two Different Jobs](index.md#autoscaling-two-different-signals-for-two-different-jobs)

---

#### 4. What is the difference between an Application Load Balancer and an Ingress Controller?

<div class="upper-alpha" markdown>
1. An ALB only works with the KEDA Autoscaler, while an Ingress Controller only works with the HPA
2. An ALB is the cloud-managed component distributing incoming HTTPS connections across healthy pods; an Ingress Controller is the Kubernetes-native counterpart that reads declarative Ingress resources and drives that same load balancer from inside the cluster
3. An Ingress Controller replaces the need for an ALB entirely in every deployment
4. An ALB is used only in development, while an Ingress Controller is used only in production
</div>

??? question "Show Answer"
    The correct answer is **B**. An ALB is the cloud-managed traffic distributor, while an Ingress Controller drives that same load balancer from declarative, version-controlled rules inside the cluster — the two work together, not separately. A invents an unrelated pairing with the autoscalers. C overstates the Ingress Controller's role, since it drives the ALB rather than replacing it. D reverses their actual usage, which is production-focused for both.

    **Concept Tested:** Application Load Balancer / Ingress Controller

    **See:** [Fronting the Cluster: Load Balancers and Ingress](index.md#fronting-the-cluster-load-balancers-and-ingress)

---

#### 5. What does the Dead Letter Queue Concept prevent?

<div class="upper-alpha" markdown>
1. A gateway pod from ever receiving more than one request per second
2. A district's traffic from ever exceeding its Kafka client quota
3. A Neo4j causal cluster from losing quorum during a leader election
4. A single poison message from crashing a processor in an endless restart loop, by routing it to a separate topic after a bounded number of retries while the processor continues consuming the rest of the partition
</div>

??? question "Show Answer"
    The correct answer is **D**. The DLQ isolates a message the processor cannot successfully handle after bounded retries, so the rest of the partition keeps flowing instead of the processor endlessly crashing on the same message. A and B each describe an unrelated rate-limiting mechanism. C confuses the DLQ with an unrelated graph-cluster consensus concern.

    **Concept Tested:** Dead Letter Queue Concept

    **See:** [Fronting the Cluster: Load Balancers and Ingress](index.md#fronting-the-cluster-load-balancers-and-ingress)

---

#### 6. Why does ClickHouse Cloud need to keep pace with the full ingest rate while Neo4j AuraDB does not need the same urgency?

<div class="upper-alpha" markdown>
1. Because Neo4j AuraDB is not actually used in production, only in development
2. Because ClickHouse only stores compressed summaries, while Neo4j stores every raw statement
3. Because ClickHouse is the statement log receiving every statement at full fidelity, while the summarizer's compression pipeline holds Neo4j's graph writes flat at roughly 2,500 upserts per second regardless of ingest volume
4. Because ClickHouse Cloud has no scaling limits of any kind, unlike Neo4j
</div>

??? question "Show Answer"
    The correct answer is **C**. ClickHouse must absorb every statement at full fidelity, while the compression pipeline decouples Neo4j's write rate from ingest volume entirely, holding it flat regardless of how hard the pipeline is pushed. A is false — AuraDB is a real production option this chapter names directly. B reverses which store holds raw statements versus summaries. D makes an unsupported absolute claim about ClickHouse.

    **Concept Tested:** ClickHouse Cloud / Neo4j AuraDB

    **See:** [Managed Streaming and the Two Stores It Feeds](index.md#managed-streaming-and-the-two-stores-it-feeds)

---

#### 7. A production deployment needs a Causal Cluster Topology for its graph tier's high availability. Why can't Neo4j Community edition, the free tier the Compose stack runs, provide this on its own?

<div class="upper-alpha" markdown>
1. Neo4j Community can cluster, but only within a single Availability Zone
2. Neo4j Community cannot cluster at all, so it has no path to high availability — a single Community instance is a single point of failure by construction, requiring Neo4j Enterprise or AuraDB instead
3. Neo4j Community requires a separate license purchase to enable read replicas only
4. Neo4j Community's causal cluster topology only supports up to two nodes
</div>

??? question "Show Answer"
    The correct answer is **B**. Community edition cannot cluster at all, making a single instance a structural single point of failure, so production needs either Neo4j Enterprise or AuraDB to get a Causal Cluster Topology. A wrongly grants Community a limited clustering capability it does not have. C and D each invent a partial-clustering feature that does not exist in Community edition.

    **Concept Tested:** Neo4j Enterprise Edition / Causal Cluster Topology

    **See:** [Managed Streaming and the Two Stores It Feeds](index.md#managed-streaming-and-the-two-stores-it-feeds)

---

#### 8. A district's vault-db and meta-db PostgreSQL instances need to survive a single availability zone failing without any custom application-level failover code being written. Which managed service provides this, and how?

<div class="upper-alpha" markdown>
1. RDS Multi-AZ Postgres, where a synchronously replicated standby in a second availability zone takes over automatically if the primary fails
2. ElastiCache Redis, because it caches database queries and never needs a live database connection
3. ClickHouse Cloud, because it is the system of record for all statement data
4. Managed Streaming Kafka, because it already replicates data across zones
</div>

??? question "Show Answer"
    The correct answer is **A**. RDS Multi-AZ Postgres provides automatic standby failover across zones with no application-level failover logic required, exactly matching this requirement. B, C, and D each name a real managed service from this chapter, but none is a relational database with automatic Multi-AZ failover for vault-db and meta-db.

    **Concept Tested:** RDS Multi-AZ Postgres

    **See:** [The Relational and Cache Tier: Multi-AZ by Default](index.md#the-relational-and-cache-tier-multi-az-by-default)

---

#### 9. A gateway pod needs to resolve a bearer token to a district_id. ElastiCache Redis, which normally serves this lookup, becomes temporarily unreachable. What happens to the gateway's ability to keep accepting statements?

<div class="upper-alpha" markdown>
1. The gateway rejects every incoming request with a 503 until Redis recovers
2. The gateway halts and waits for the Cache TTL Expiry window to pass before retrying
3. The gateway falls back to its own local LRU Fallback Cache, serving from that pod-local cache or re-fetching from the identity service directly, so ingestion never blocks on cache health
4. The gateway routes the request to the Admin API instead, which has its own separate cache
</div>

??? question "Show Answer"
    The correct answer is **C**. Redis must never become a hard dependency for ingestion, so an unreachable cache triggers a fallback to the gateway pod's own local LRU cache, keeping ingestion non-blocking. A and B both wrongly stop the gateway from accepting requests, contradicting the chapter's explicit design goal. D invents an unrelated routing behavior to a different API entirely.

    **Concept Tested:** LRU Fallback Cache / Cache TTL Expiry

    **See:** [The Relational and Cache Tier: Multi-AZ by Default](index.md#the-relational-and-cache-tier-multi-az-by-default)

---

#### 10. A brand-new intelligent-textbook page needs to authenticate to the ingestion gateway with no human present to click through a login screen, while a district administrator needs to view a student's personally identifiable data through the Admin API. Which two mechanisms does this chapter describe for these two distinct situations?

<div class="upper-alpha" markdown>
1. Managed Identity Provider for the textbook page; Client Credentials Grant for the administrator
2. Step-Up Authentication for the textbook page; Managed Identity Provider alone for the administrator, with no additional verification
3. The same Client Credentials Grant is used identically for both the textbook page and the administrator
4. Client Credentials Grant for the textbook page (software authenticating as itself); Step-Up Authentication layered on top of the administrator's existing session for the sensitive PII operation
</div>

??? question "Show Answer"
    The correct answer is **D**. A textbook page authenticates as software with no human present via Client Credentials Grant, while an already-signed-in administrator must re-verify through Step-Up Authentication specifically before a PII-adjacent operation. A swaps the two mechanisms between the wrong actors. B swaps which mechanism applies to which actor and drops the administrator's required re-verification. C wrongly treats a human-facing sensitive operation identically to a software-only ingest client.

    **Concept Tested:** Client Credentials Grant / Step-Up Authentication

    **See:** [Identity at Production Scale](index.md#identity-at-production-scale)

---

#### 11. Why does the design document insist that a Continuous Integration Pipeline test a clustered ClickHouse or Neo4j configuration directly, rather than treating a passing single-node Compose test as sufficient proof?

<div class="upper-alpha" markdown>
1. Because a clustered configuration is a genuinely different runtime from the single-node version Compose runs, and a green checkmark from a single-node test proves nothing about how a three-node cluster behaves under a leader election or rolling upgrade
2. Because single-node tests are always slower to run than clustered tests, making clustered testing the more efficient default
3. Because Compose itself cannot run any tests at all, single-node or otherwise
4. Because clustered configurations are only used in the pilot tier, never in full production
</div>

??? question "Show Answer"
    The correct answer is **A**. A clustered configuration behaves differently under conditions like leader election and rolling upgrade that a single-node test never exercises, so a passing single-node result says nothing about cluster behavior specifically. B invents an unsupported performance claim. C contradicts earlier chapters, which describe Compose-based smoke and integration testing directly. D reverses reality — clustering is a production concern, not a pilot-tier one.

    **Concept Tested:** Continuous Integration Pipeline

    **See:** [Verifying the Cluster Before It Serves a Real Student](index.md#verifying-the-cluster-before-it-serves-a-real-student)

---

#### 12. Why does the chapter treat EM Parameter Fitting's cold-start behavior as an honestly named open question rather than a quietly settled detail?

<div class="upper-alpha" markdown>
1. Because EM Parameter Fitting has never been implemented anywhere in the current design
2. Because assuming an untested cold-start prior is correct without saying so is exactly the kind of "green checkmark, wrong underneath" failure the MVP chapter warned against, so the design names the gap and flags it for revisiting once real accuracy data exists, rather than smoothing it over
3. Because cold-start priors are recalculated fresh every time a new statement arrives, making the question moot
4. Because the design document considers cold-start behavior entirely unrelated to Bayesian Knowledge Tracing
</div>

??? question "Show Answer"
    The correct answer is **B**. Quietly assuming an unvalidated cold-start prior is correct is precisely the kind of misleading confidence the earlier MVP chapter warned against, so the design names the gap explicitly and schedules it for revisiting with real accuracy data. A contradicts the chapter, which describes EM Parameter Fitting as a real, running nightly job. C invents a recalculation behavior the chapter never describes. D is false — cold-start priors are directly part of the BKT parameters this chapter discusses.

    **Concept Tested:** EM Parameter Fitting

    **See:** [Verifying the Cluster Before It Serves a Real Student](index.md#verifying-the-cluster-before-it-serves-a-real-student)

---
