---
title: Component Design in Depth
description: A close reading of the design specification's four moving parts — gateway, identity service, processor, and summarizer — covering token caching, salted HMAC pseudonymization, deterministic experiment bucketing, and the cache-invalidation contract behind every dashboard response.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 10:48:25
version: 0.09
---

# Component Design in Depth

## Summary

This chapter goes inside the four moving parts of the pipeline — gateway, identity service, processor, and summarizer — covering token caching, per-district salted HMAC pseudonymization, experiment bucketing, and the cache-invalidation strategy behind every dashboard's response.

## Concepts Covered

This chapter covers the following 25 concepts from the learning graph:

1. AuthN Token Cache
2. UUIDv7 Statement ID
3. Kafka Producer Acks All
4. Gateway Backpressure Queue
5. HMAC-SHA256 Pseudonymization
6. Per-District Salt
7. Mutual TLS Salt Fetch
8. Kafka Consumer Batch Window
9. ReplacingMergeTree Dedup
10. BKT Streaming Update
11. Compacted State Checkpoint
12. Late Arrival Detector
13. Targeted Replay Command
14. xxhash64 Bucketing
15. Bucket To Variant Map
16. Ramping Allocation Rule
17. Report ID Endpoint Pattern
18. Analytics Cache Key
19. Data Version Invalidation
20. Privacy Filter Choke Point
21. P95 Latency Budget
22. Dash Background Callback
23. Redis Celery Queue
24. Multi-Page Dash App
25. Filter State Store

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 12: Bayesian Knowledge Tracing for Mastery](../12-bayesian-knowledge-tracing/index.md)

---

!!! mascot-welcome "Inside the Four Moving Parts"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 10 named the technologies. This chapter opens the boxes they run in. We are going component by component through the design specification's own §5 — gateway, identity service, processor, summarizer, reconciler, experiment service, analytics API, and dashboards — and looking at the specific mechanisms each one relies on to be fast, correct, and safe under failure. Let's follow the record.

Chapter 9 catalogued twelve functions the Learning Record Store must perform, and Chapter 10 named the seventeen products those functions run on. Neither chapter answered a narrower question: inside any one component, what is the actual sequence of steps a statement or a request goes through? This chapter answers that for the four components doing the heaviest lifting — gateway, identity service, processor, summarizer — plus the experiment service and the analytics-and-dashboard layer, whose internal mechanics matter as much as their already-named jobs.

## The Gateway's Request Path

The ingestion gateway, running as the `lrs gateway` role on FastAPI and Uvicorn (Chapter 10), does five things to every incoming request, in a fixed order, and the order is not incidental — each step exists to keep a slow or failing downstream system from ever touching the response the gateway sends back.

The first step is authentication. Every request carries a bearer token scoped to a textbook or a district, and validating that token against a district mapping on every single request would add a network hop the gateway cannot afford at hundreds of requests per second. The design specification solves this with an **AuthN Token Cache** — a Redis-backed cache holding the token-to-`district_id` mapping with a short time-to-live, so the common case never leaves the gateway process's memory neighborhood. If Redis becomes unreachable, the gateway falls back to a local least-recently-used cache and keeps serving; authentication must never become an ingestion dependency.

Once the token resolves, the gateway runs the tier-one structural validation Chapter 8 introduced — well-formed JSON, the required `actor`, `verb`, and `object` fields, a parseable timestamp — and, per xAPI conformance, treats a batch as all-or-nothing: one malformed statement in a batch of fifty rejects the whole request. Statements that still need an identifier get one from the **UUIDv7 Statement ID** scheme. Unlike a random UUIDv4, a UUIDv7 encodes a millisecond timestamp in its leading bits, so IDs minted close together in time sort close together in value — which is exactly the write pattern ClickHouse's storage engine rewards.

The list below reinforces the gateway's fixed step order, now that each step has been introduced in prose.

1. Look up the bearer token in the **AuthN Token Cache**, falling back to a local cache if Redis is unreachable.
2. Run tier-one structural validation, all-or-nothing across the batch.
3. Assign a **UUIDv7 Statement ID** to any statement that arrived without one.
4. Produce the batch to the durable queue with **Kafka Producer Acks All**.
5. Respond — or, under sustained backpressure, return `503`.

!!! mascot-thinking "Why the Queue, Not the Response, Is the Durability Boundary"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice where the gateway's `200` response happens: after the durable queue acknowledges the write, never after a statement is projected into ClickHouse or Neo4j. That ordering is what makes the non-blocking-ingestion promise from Chapter 6 real rather than aspirational — the gateway's only hard dependency is the queue, and everything after the queue can be slow, backed up, or briefly down without a single statement being lost or a single textbook seeing an error.

The write itself uses **Kafka Producer Acks All**, a broker setting that waits for acknowledgment from every in-sync replica before treating the write as durable, not just the partition leader. This is slower than leader-only acknowledgment, and the design specification accepts that cost because a statement the producer believes is durable but a single-replica failure would erase is a data-loss bug wearing a success response. Each message is keyed `{district_id}:{student_key_raw}`, the partitioning choice Chapters 5 and 6 already justified for per-learner ordering and even load spread.

What happens when the broker is briefly unreachable is governed by the **Gateway Backpressure Queue** — a local, in-process buffer inside the gateway's Kafka producer that absorbs a burst without rejecting the caller. Only when that buffer is full *and* the broker stays unreachable does the gateway return a `503` with `Retry-After`, and even then it emits a page-worthy alert rather than failing silently. Backpressure absorbs the burst in the producer's own queue; it never rejects a textbook's statements outright.

#### Diagram: Gateway Request Pipeline

<iframe src="../../sims/gateway-request-pipeline/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Gateway Request Pipeline</summary>
Type: workflow
**sim-id:** gateway-request-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace one xAPI statement batch through the gateway's five-step request path — token cache lookup, structural validation, statement ID assignment, durable-queue produce with acks=all, and response — and explain what each step protects against.

Purpose: Show a single Mermaid flowchart tracing one POST request through the gateway's internal steps in order, ending at two possible outcomes.

Nodes: "Textbook sends POST /xapi/statements (batch)" leads to "AuthN Token Cache lookup (Redis, 60s TTL; falls back to local LRU on Redis failure)" leads to "Tier-1 structural validation (all-or-nothing per batch)" leads to "Assign UUIDv7 Statement ID where missing" leads to "Produce to Kafka: Kafka Producer Acks All, key = district:student" then splits into two outcomes: "Broker acks → 200 with statement IDs" and "Gateway Backpressure Queue full AND broker unreachable → 503 with Retry-After + page alert".

Interactive features: Every node has a Mermaid click directive opening an infobox with that step's one-sentence definition (cache fallback, UUIDv7 sortability, acks=all latency tradeoff, or the outcome condition). A toggle labeled "Show durability boundary" highlights every node before the Kafka produce step in one color and every node after it in another, reinforcing that the response happens only after the queue acknowledges.

Color coding: Steps before the durability boundary (queue ack) in a neutral gray-blue; the Kafka produce node and everything after it in the book's teal accent color; the 503 outcome branch in amber to flag it as the exceptional path.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom.
</details>

## Pseudonymization at the Processing Boundary

Chapter 6 introduced the idea that a learner's raw identity must never reach the analytics stores. This chapter looks at the mechanism that enforces it. The stream processor, on its way to writing a statement to ClickHouse, computes **HMAC-SHA256 Pseudonymization** — a keyed cryptographic hash that turns a raw actor identifier into a fixed-length `student_key` that cannot practically be reversed back into the original name or email address without the key used to compute it.

$$\text{student\_key} = \text{base32}\left(\text{HMAC-SHA256}\left(\text{salt}_{district},\ \texttt{homePage} \,\|\, \texttt{name}\right)[0{:}16]\right)$$

The "key" in that keyed hash is the **Per-District Salt** — a secret value unique to each district, stored in the PII vault Chapter 10 described as an isolated PostgreSQL instance. Because the salt differs per district, the same learner enrolled in two different districts derives two completely unrelated `student_key` values. That is what gives Chapter 6's "hard" district isolation teeth even against a compromised analytics reader: without vault access to the specific salt, there is no way to correlate one district's pseudonym with another's, and no way to work backward to a name.

The processor computes the HMAC locally rather than calling the identity service per statement — at ten thousand statements a second, a network round trip each time would add ten thousand requests a second of pure overhead. Instead, it fetches each district's salt once, over a **Mutual TLS Salt Fetch** — a connection where both processor and identity service present certificates and verify each other's identity, not just the one-directional TLS where only the server proves who it is — then caches the salt in memory only, never on disk.

!!! mascot-tip "The Processor Already Sees the Raw Name — So Why the Ceremony?"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    It can feel strange that the processor is trusted with the salt when the whole point of pseudonymization is hiding identity. Here is the reasoning the design specification gives: the processor already sees the raw actor identity, because it is sitting right there in the statement body it just consumed from the queue. Handing it the salt adds no exposure it did not already have. The privacy boundary that matters is downstream of the processor — nothing past this point, no analytics store, no dashboard, no export, ever sees anything but the derived `student_key`.

#### Diagram: Pseudonymization Pipeline

<iframe src="../../sims/pseudonymization-pipeline/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Pseudonymization Pipeline</summary>
Type: workflow
**sim-id:** pseudonymization-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/pseudonymization-pipeline

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a raw actor identifier becomes an irreversible `student_key`, following the hop from the statement body through the Mutual TLS Salt Fetch and the HMAC-SHA256 Pseudonymization computation to the pseudonymous key written to ClickHouse.

Purpose: Show a single Mermaid flowchart tracing one raw actor identifier from the statement body to its final pseudonymous form, adapted from the template's existing LMS-to-LRS identity flow to this chapter's specific mechanism.

Nodes: "Raw actor identifier in statement body (homePage + name)" leads to "Processor fetches Per-District Salt via Mutual TLS Salt Fetch (once per district, cached in memory)" leads to "HMAC-SHA256 Pseudonymization computed locally in the processor" leads to "student_key (base32, first 16 bytes)" leads to "Written to ClickHouse and Neo4j — the only form any downstream store ever sees".

Interactive features: Every node has a Mermaid click directive opening an infobox with that step's definition — mutual TLS and fetch frequency at the salt node, the formula and cross-district unrelatedness at the HMAC node, and the "nothing downstream sees raw identity" guarantee at the final node.

Color coding: The raw-identity node in amber to flag it as sensitive; every node from the salt fetch onward in the book's teal accent color to show the boundary has been crossed.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom.
</details>

The table below reinforces the two caching decisions this section and the previous one have already explained in prose — what each cache holds, where it lives, and what happens if it fails.

| Cache | Holds | Failure behavior |
|---|---|---|
| AuthN Token Cache | Bearer token → `district_id` mapping | Falls back to a local LRU cache; authentication never blocks ingestion |
| Per-district salt cache (processor-local) | HMAC key fetched via Mutual TLS Salt Fetch | Held in memory only; a restart re-fetches from the identity service |

## The Processor's Batch Loop

The stream processor consumes the raw statement topic in batches, and the size of that batch is bounded two ways at once: up to one thousand statements, or two hundred milliseconds of wall-clock time, whichever limit is hit first. That bound is the **Kafka Consumer Batch Window** — a small enough window that a burst of activity is absorbed without the processor falling meaningfully behind, and a large enough one that the processor is not paying per-message overhead on every single statement.

Inside each batch, the processor pseudonymizes, resolves activity references, enriches with section and concept identifiers, and runs the **BKT Streaming Update** — a per-statement Bayesian Knowledge Tracing recalculation that conditions the learner's prior mastery probability on the new evidence and applies the learning-transition step, producing an updated probability in constant time. Because Kafka delivery is at-least-once, a processor can crash after writing a batch but before committing its offset, redelivering the batch. A `ReplacingMergeTree Dedup` — the same engine, keyed on `statement_id`, that Chapter 8 introduced — silently absorbs the redelivered rows, so a retried batch never double-counts evidence.

BKT's update is sequential in a way a duplicate-row filter cannot fix by itself: the same evidence, conditioned in a different order, yields a different posterior. That is why mastery state — the running probability per (student, concept) pair — is checkpointed independently, to a **Compacted State Checkpoint**: a log-compacted Kafka topic that keeps only the latest value per key, staying small forever while surviving a Redis cache loss. If the in-memory mastery cache disappears, the processor rebuilds it by replaying the compacted topic from the start.

!!! mascot-warning "Order Matters More Here Than Anywhere Else in the Pipeline"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Most of this pipeline treats out-of-order arrival as a non-event, because ClickHouse projections are timestamp-driven rather than arrival-driven. BKT is the exception. Its update does not commute — the same two pieces of evidence, applied in a different sequence, yield a different mastery estimate. That is precisely why the partition key is `district_id:student_key`, not just `district_id`: it guarantees one learner's statements land on one partition and are consumed in the order they were produced. Do not assume every component in this system is indifferent to ordering just because most of them are.

Even a well-ordered partition cannot guarantee every statement arrives promptly — a mobile app might sync three hours after a lesson ended. The **Late Arrival Detector** watches for statements whose event timestamp falls meaningfully behind the processor's current watermark, and rather than patching the running estimate in place, it enqueues a **Targeted Replay Command**: an `lrs replay --student X --concept Y` invocation scoped narrowly to the affected learner and concept, recomputing the mastery trajectory in order directly from the immutable ClickHouse log. This is Chapter 8's replay mechanism, aimed at one (student, concept) pair rather than a whole district — cheap enough to run automatically every time a late arrival is detected.

#### Diagram: Processor Batch Loop — Dedup, Score, and Replay

<iframe src="../../sims/processor-batch-dedup-replay/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Processor Batch Loop — Dedup, Score, and Replay</summary>
Type: workflow
**sim-id:** processor-batch-dedup-replay<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace a batch of statements through the processor's Kafka Consumer Batch Window, ReplacingMergeTree Dedup, and BKT Streaming Update, then differentiate the ordinary redelivery path from the late-arrival path that triggers a Targeted Replay Command.

Purpose: Show a Mermaid flowchart with a main loop and one branch for the late-arrival exception.

Nodes: "Consume batch: up to 1,000 statements or 200ms (Kafka Consumer Batch Window)" leads to "Pseudonymize + resolve + enrich" leads to "BKT Streaming Update per (student, concept), in partition order" leads to "Write batch to ClickHouse; ReplacingMergeTree Dedup absorbs any redelivered rows" leads to "Checkpoint mastery state to Compacted State Checkpoint topic" leads to "Commit Kafka offset". A separate branch from "Consume batch": "Late Arrival Detector flags a statement far behind the watermark" leads to "Enqueue Targeted Replay Command scoped to (student, concept)" leads to "Recompute mastery trajectory in order, directly from the ClickHouse log" leads back into "Checkpoint mastery state".

Interactive features: Every node has a Mermaid click directive opening a definition infobox, with the dedup and BKT nodes' infoboxes explicitly contrasting idempotent-by-construction against order-sensitive. A toggle labeled "Show why order matters" highlights the BKT node and the late-arrival branch in a shared color, dimming the rest of the diagram.

Color coding: The main loop in the book's teal accent color; the late-arrival branch in amber to flag it as the exception path; the Compacted State Checkpoint node in a distinct violet since it is a durability mechanism rather than a processing step.

Responsive design: Flowchart resizes to the width of its containing element; the late-arrival branch collapses beneath the main loop on narrow viewports rather than sitting beside it.
</details>

## Deterministic Bucketing for Experiments

The experiment service does not run as its own standing process; it is served in-process by the analytics and admin APIs, and its core mechanism is a single deterministic calculation rather than a database lookup. Assigning a student to a control or treatment group uses **xxhash64 Bucketing**: a fast, non-cryptographic hash function applied to the experiment's identifier concatenated with the student's identifier, reduced to a number between 0 and 9,999.

$$\text{bucket} = \text{xxhash64}\left(\texttt{experiment\_id} \,\|\, \text{':'} \,\|\, \texttt{unit\_id}\right) \bmod 10{,}000$$

Because this is a pure function — the same two inputs always produce the same bucket number, and nothing about the calculation is stored anywhere — a student's bucket assignment is permanent without a database row ever having to say so. What varies over the life of an experiment is not the bucket number itself but which variant that bucket number currently maps to, tracked by the **Bucket To Variant Map**: a versioned table that says, for example, "buckets 0 through 1,999 are treatment, the rest are control" at one point in the experiment and a different split later as the experiment ramps up.

That ramping is governed by one hard rule, the **Ramping Allocation Rule**: an experiment's treatment range may only ever extend, never contract. A student whose bucket falls inside the treatment range at 10% allocation stays in treatment forever after, even once the experiment ramps to 50% and later students start being assigned differently. What a naive implementation gets wrong is letting a later re-balancing move a bucket from treatment back to control — which silently corrupts the analysis, because a student's early behavior belongs to one condition and their later behavior would appear to belong to the other.

!!! mascot-encourage "One Formula Carrying a Lot of Weight"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    A single modulo operation determining a student's entire experimental condition can feel almost too simple to trust. That simplicity is the point — the moment assignment depends on anything stored, mutable, or computed differently at different times, sample-ratio checks and stickiness guarantees both become fragile. Trust the math: xxhash64 Bucketing is deterministic by construction, and the Ramping Allocation Rule's one-directional constraint is what keeps a student's assigned condition stable for the life of the study.

The list below reinforces the three rules this section has already explained in prose, as a quick self-check before moving to the analytics layer that reads their output.

- A student's **xxhash64 Bucketing** result never changes — it is a pure function of the experiment ID and the student's key, recomputed on demand rather than stored.
- The **Bucket To Variant Map** — not the bucket number — is what changes as an experiment ramps, and it is versioned so past assignments remain reconstructable.
- The **Ramping Allocation Rule** allows a treatment range to grow but never shrink, so a student can move control → treatment but never treatment → control.
- If the experiment service errors for any reason, the caller serves control and records the event anyway — assignment logic never gates whether a statement gets processed.

#### Diagram: Deterministic Bucketing and the Ramping Rule

<iframe src="../../sims/experiment-bucketing-ramp/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Deterministic Bucketing and the Ramping Rule</summary>
Type: infographic
**sim-id:** experiment-bucketing-ramp<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: demonstrate, predict

Learning objective: Let the learner manipulate an experiment's allocation percentage and observe that xxhash64 Bucketing keeps every student's bucket number fixed while only the Bucket To Variant Map's boundary moves, and that the Ramping Allocation Rule prevents the boundary from ever moving backward.

Canvas layout:

- A horizontal strip of 10,000 small tick marks representing bucket numbers 0-9,999, compressed to roughly 200 visible segments
- A vertical boundary line separating "treatment" (left, teal) from "control" (right, neutral gray)
- A slider labeled "Treatment allocation %" ranging from 0 to 100
- A row of five labeled student dots at fixed bucket positions, each showing its current variant

Interactive controls:

- Slider: "Treatment allocation %" — moving it right attempts to move the boundary right (more treatment)
- Checkbox: "Enforce Ramping Allocation Rule" — checked blocks any leftward boundary move with a red flash; unchecked lets the boundary move freely and flags in red any student dot that flips from treatment back to control, labeled "This is the bug the rule prevents"
- Button: "Reset"

Behavior: Each student dot's bucket position is fixed for the session, computed once from a seeded hash so the layout is reproducible; only the boundary moves in response to the slider.

Color coding: Treatment region and its student dots in the book's teal accent color; control region and its dots in neutral gray; the "bug" highlight in red, shown only when the rule checkbox is unchecked.

Responsive design: Canvas width tracks its containing element; the tick strip and slider stack vertically below the student-dot row on narrow viewports.
</details>

## The Analytics API's Cache Contract

The analytics API exposes one REST endpoint per report, following the **Report ID Endpoint Pattern**: `GET /v1/reports/R-201?section_id=…&from=…&to=…`, where the report's identifier is part of the URL path rather than a query parameter buried among others. That choice is what makes every response a fixed, predictable shape, and a fixed shape is what makes caching tractable at all.

Every response is cached under an **Analytics Cache Key**, built from four parts: the report identifier, the tenant, the query parameters, and a `data_version` value. The first three are what you would expect of any cache key; the fourth is the interesting one. Rather than expiring entries after a fixed time-to-live and hoping that window matches actual freshness, the design specification uses **Data Version Invalidation** — `data_version` is bumped by the processor's own watermark, the same freshness marker Chapter 8's compression pipeline advances as statements land. A cache entry invalidates exactly when its underlying data changes, not on an arbitrary clock.

The list below reinforces the four parts of the cache key just introduced, in the order they are concatenated.

- **Report ID** — which fixed-shape report this is, from the **Report ID Endpoint Pattern**'s URL path.
- **Tenant** — the district or section scope the caller is authorized to see.
- **Query parameters** — the specific filters (date range, section, comparison group) applied.
- **`data_version`** — the processor's watermark; this is what makes **Data Version Invalidation** work.

Before a cached figure reaches a caller, it passes through the **Privacy Filter Choke Point** — the single place every analytics response is required to flow through on its way out. Chapter 7's suppression rules for small groups live here, enforced once rather than re-implemented inside every report's code. By construction, there is no path that can accidentally skip the filter, because there is only one path out of the API at all.

All of this exists in service of the **P95 Latency Budget** — a requirement that ninety-five percent of dashboard requests return within two seconds. That budget holds because a dashboard's read path never touches raw statement rows; every figure reads a pre-aggregated ClickHouse materialized view or a Redis-cached mastery vector. Raw statement access is reserved for the Query Console and the export path, both explicitly asynchronous.

#### Diagram: Analytics Cache Key and the Privacy Filter Choke Point

<iframe src="../../sims/dashboard-request-cache-flow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Analytics Cache Key and the Privacy Filter Choke Point</summary>
Type: workflow
**sim-id:** dashboard-request-cache-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/it-management-graph/tree/main/docs/sims/performance-monitoring-dashboard-workflow

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, justify

Learning objective: Let the learner trace a dashboard request from its Report ID Endpoint Pattern URL through an Analytics Cache Key lookup, a Data Version Invalidation check, and the single Privacy Filter Choke Point, to a response that meets the P95 Latency Budget.

Purpose: Show a Mermaid flowchart tracing one dashboard request, adapted from the template's existing performance-dashboard workflow to this chapter's cache and privacy mechanisms.

Nodes: "Dash callback calls GET /v1/reports/R-201?... (Report ID Endpoint Pattern)" leads to "Build Analytics Cache Key: report_id + tenant + params + data_version" then splits: "Cache hit" leads to "Skip straight to Privacy Filter Choke Point"; "Cache miss or Data Version Invalidation triggered" leads to "Query pre-aggregated ClickHouse view / Redis mastery vector" leads to "Privacy Filter Choke Point". Both paths converge at "Privacy Filter Choke Point (threshold + complementary suppression, always applied)" leads to "Response returned within P95 Latency Budget".

Interactive features: Every node has a Mermaid click directive opening a definition infobox — the cache-key node lists all four key parts, the Data Version Invalidation node explains watermark-driven versus fixed-TTL invalidation, and the choke-point node stresses that both paths converge there so no response can bypass it.

Color coding: The cache-hit path in the book's teal accent color; the cache-miss path in a lighter tint of the same hue; the shared Privacy Filter Choke Point node in amber to flag it as the mandatory convergence point.

Responsive design: Flowchart resizes to the width of its containing element; the two branches stack vertically above their shared convergence node on narrow viewports.
</details>

## The Dashboard Layer

Everything the analytics API guarantees would be wasted if the presentation layer bypassed it, so the dashboards are built as a **Multi-Page Dash App** — several distinct pages (a district overview, a section heatmap, a student detail view) sharing one running process, so a filter selected on one page carries into the next without a reload losing it. That persistence is handled by a **Filter State Store**, a `dcc.Store` component holding the selected section, date range, and comparison group in the browser session itself, surviving a tab switch.

Every chart and table is driven by a callback that calls the analytics API — never a database directly — which keeps the Privacy Filter Choke Point unbypassable: no Dash callback can reach ClickHouse or Neo4j except through the one filtered endpoint. Some requests are not the kind a two-second budget was built for — a bulk CSV export can legitimately take thirty seconds. Those run as a **Dash Background Callback**, handing the work off to a task queue instead of blocking the request thread, backed by a **Redis Celery Queue** — Celery being a Python task-queue library using Redis as its message broker, so an export runs on a worker process entirely separate from interactive page loads.

The table below reinforces the four dashboard-layer components this section has explained, by the specific job each one does.

| Component | Job |
|---|---|
| Multi-Page Dash App | Hosts every report page in one running process, sharing state across pages |
| Filter State Store | Holds the active section, date range, and comparison group across page navigation |
| Dash Background Callback | Runs a long export or slow computation off the interactive request thread |
| Redis Celery Queue | The message broker a background callback's worker process reads from |

## Bringing the Components Together

Every mechanism this chapter walked through answers a question Chapter 9 raised without answering: not *what* each component does, but *how* it stays fast and correct while doing it. The gateway's caching and backpressure keep a slow downstream from becoming the caller's problem. HMAC-SHA256 Pseudonymization with a per-district salt makes Chapter 6's privacy boundary a cryptographic fact, not a policy. The processor's batching, dedup, and checkpointing make mastery scoring correct under redelivery, crash, and late arrival at once. Deterministic bucketing gives experimentation a stability guarantee with no database row required. And the analytics API's cache key, invalidation rule, and choke point are what let a dashboard meet its latency budget without ever showing stale or unfiltered data.

None of these are independent tricks. Each exists because an earlier chapter's promise — non-blocking ingestion, hard district isolation, correct mastery, a stable experimental condition, a fast and private dashboard — needed a specific mechanism to hold. Chapter 14 goes one layer deeper, into the exact Kafka topic names, partition counts, and ClickHouse table definitions these components read and write.

## Key Takeaways

- The **AuthN Token Cache** and **Gateway Backpressure Queue** keep authentication and downstream slowness from ever blocking the gateway's response.
- The **UUIDv7 Statement ID** sorts by time and is minted whenever a client omits its own; **Kafka Producer Acks All** waits for every in-sync replica before the gateway treats a write as durable.
- **HMAC-SHA256 Pseudonymization** with a **Per-District Salt**, fetched by the processor over a **Mutual TLS Salt Fetch**, turns a raw actor identity into an irreversible `student_key`.
- The processor's **Kafka Consumer Batch Window** bounds batches by count and time; **ReplacingMergeTree Dedup** absorbs redelivery, while the **BKT Streaming Update** stays correct only because per-learner partitioning preserves order.
- A **Compacted State Checkpoint** lets mastery state survive a cache loss; a **Late Arrival Detector** triggers a **Targeted Replay Command** scoped to one student and concept.
- **xxhash64 Bucketing** assigns a permanent, storage-free bucket; the **Bucket To Variant Map** and the one-directional **Ramping Allocation Rule** are what let an experiment ramp without ever flipping a student's condition.
- The **Report ID Endpoint Pattern**, **Analytics Cache Key**, and **Data Version Invalidation** make dashboard responses fast and correctly fresh; the **Privacy Filter Choke Point** makes every response safe.
- A **Multi-Page Dash App** with a **Filter State Store** keeps navigation state; a **Dash Background Callback** on a **Redis Celery Queue** handles the requests too slow for the **P95 Latency Budget**.

!!! mascot-celebration "Every Component Now Has Its Mechanism"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Twenty-five mechanisms, eight components, and every one of them traced back to a promise an earlier chapter made and this chapter kept. What does the evidence show? Naming a component's job is the easy half; the mechanism that makes the job survive a crash, a redelivery, or a burst is the hard half — and you have now seen every one of them. In [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md), we go one layer deeper still, into the exact topic names, table definitions, and constraints these mechanisms are built on.
