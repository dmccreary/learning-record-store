---
title: Choosing the Technology Stack
description: A tour of the concrete technology choices behind the Learning Record Store's five architectural planes — FastAPI and Redpanda for ingestion, ClickHouse and Neo4j for storage, Keycloak for identity, and the OpenTelemetry, Jaeger, Prometheus, and Grafana observability stack — grounded in the design specification's own technology-selection table and rationale.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 08:23:32
version: 0.09
---

# Choosing the Technology Stack

## Summary

This chapter surveys the specific tools chosen for each plane and why: FastAPI and Redpanda for ingestion, ClickHouse for the event log, Neo4j for structure, Redis for hot state, MinIO/S3 for objects, Keycloak for identity, and the OpenTelemetry/Jaeger/Prometheus/Grafana observability stack.

## Concepts Covered

This chapter covers the following 17 concepts from the learning graph:

1. FastAPI
2. Uvicorn
3. Redpanda
4. Apache Kafka
5. Confluent-Kafka Library
6. ClickHouse
7. Neo4j 5 Community
8. PostgreSQL 16
9. Redis 7
10. MinIO
11. Amazon S3
12. GraphQL
13. Keycloak
14. OpenTelemetry
15. Jaeger
16. Prometheus
17. Grafana

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)

---

!!! mascot-welcome "From Twelve Functions to Seventeen Products"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 9 closed with a promise: every one of those twelve functions rests on specific technology choices. This chapter is where the design specification finally names them — the actual databases, queues, frameworks, and dashboards a developer would type into a terminal. Let's follow the record.

Chapter 5 named five architectural planes — ingestion, processing, storage, analytics, and presentation — and Chapters 6 through 9 filled each plane with jobs: pseudonymize an actor, resolve an activity, compress a million statements into one vertex. None of that required naming a single piece of software. A plane is an abstraction; a job is a function. Somewhere underneath both, an actual database has to store the actual bytes, and an actual web framework has to answer the actual HTTP request. This chapter is where the abstractions get names.

This project's design specification, `lrs-design-v1.md`, dedicates its own technology-selection table to exactly this question — plane by plane, component by component, choice by choice — and the choices are not arbitrary. Each one traces back to a requirement this book has already met: the throughput target from Chapter 5, the immutable-log promise from Chapter 8, the pseudonymization boundary from Chapter 6. The design specification also records the reasoning behind each choice in a short written form called an **Architecture Decision Record**, or **ADR** — a practice Chapter 11 opens up in full, with the specific ADRs this project has accepted. For now, treat every technology name below as the answer to a question this book has already asked.

## The Ingestion Plane: One Fast Path In

The ingestion plane's job, from Chapter 5, is simple to state and hard to build: accept an xAPI statement and get out of the way. The design specification builds that gateway in **FastAPI**, a Python web framework chosen specifically because xAPI statements typically arrive batched — a textbook sends fifty statements in one HTTP request rather than fifty separate requests — which drops the request rate roughly a hundredfold below the statement rate. That gap is what makes a Python gateway fast enough at all; a framework written in a compiled language would not strictly need the gap, but Python does, and batching supplies it. FastAPI itself does not listen on a network socket; it defines routes, validates incoming JSON, and shapes responses. **Uvicorn** is the ASGI server that actually accepts a connection and hands each request to FastAPI's routing layer — the two names are almost always mentioned together, because one is not useful in production without the other.

Once the gateway accepts a statement, it has to land somewhere durable before the gateway can answer `200` back to the textbook that sent it — the non-blocking-ingestion promise from Chapter 8 depends on that queue being fast to write to and never the reason a statement is lost. The design specification names two products for that role, not one. **Redpanda** is a single-binary, Kafka-API-compatible message broker that a developer can start on a laptop in about a second, with no separate coordination service to run alongside it. **Apache Kafka** is the durable, partitioned, ordered, replayable log Chapter 5's Durable Event Queue was modeled on in the first place. Redpanda speaks Kafka's wire protocol without being Kafka's codebase, which is what lets the design specification run Redpanda in development and Apache Kafka in production without changing a line of application code. Whichever broker is actually running, the stream processors that pull statements back off the queue and run Chapter 9's pseudonymize–resolve–map sequence read that queue using the **Confluent-Kafka Library**, a Python client built on the same underlying C library the Kafka project itself relies on internally — which is why a plain consumer loop written against it can keep pace with the queue without needing a heavier stream-processing framework layered on top of it.

The list below reinforces the role each ingestion-plane technology plays, now that each has been introduced above.

- **FastAPI** — defines the `POST /xapi/statements` route, runs structural validation, and shapes the response.
- **Uvicorn** — the ASGI server that actually accepts the HTTP connection and calls FastAPI's code.
- **Redpanda** — the development-environment message broker: Kafka-API-compatible, single-binary, fast to start.
- **Apache Kafka** — the production message broker Redpanda emulates: partitioned, durable, ordered, replayable.
- **Confluent-Kafka Library** — the Python client the stream processors use to consume statements from either broker.

!!! mascot-thinking "A Pattern Worth Watching For"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that Redpanda and Apache Kafka are not two options the team is still choosing between — they are the same interface running in two different places, one tuned for a laptop and one for production. Watch for that shape again: MinIO and Amazon S3 later in this chapter, and Keycloak and a customer's own identity provider after that, are both the same pattern. A component chosen for local development speaks the same protocol as its production counterpart, so nothing about the application code needs to know which one is actually running underneath it.

#### Diagram: The Ingestion Plane Technology Stack

<iframe src="../../sims/ingestion-plane-technology-stack/main.html" width="100%" height="562px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Ingestion Plane Technology Stack</summary>
Type: workflow
**sim-id:** ingestion-plane-technology-stack<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, trace

Learning objective: Let the learner trace a single xAPI statement's path through the ingestion plane's actual technology stack — FastAPI, Uvicorn, Redpanda/Apache Kafka, and the Confluent-Kafka Library — and explain what each product is responsible for.

Purpose: Show a single Mermaid flowchart tracing one statement from an intelligent textbook through the concrete technology stack, mirroring Chapter 5's ingestion-plane diagram but naming products instead of planes.

Nodes: "Intelligent Textbook" leads to "Uvicorn (ASGI server, accepts the HTTP connection)" leads to "FastAPI (routes the request, runs structural validation)" leads to "Redpanda (dev) / Apache Kafka (prod) — durable partitioned queue" leads to "Confluent-Kafka Library (Python client used by Stream Processors to consume the queue)" leads to "Stream Processor (Chapter 9's pseudonymize/resolve/map sequence)".

Interactive features: Every node has a Mermaid click directive. Clicking "Uvicorn" or "FastAPI" opens an infobox distinguishing the ASGI server from the web framework it runs, matching this chapter's prose. Clicking the Redpanda/Kafka node opens an infobox explaining the dev/prod pairing and linking to Chapter 5's Durable Event Queue and Chapter 8's non-blocking ingestion. Clicking "Confluent-Kafka Library" opens an infobox naming it as the Python client used inside the Stream Processor role. A toggle labeled "Show dev environment" / "Show production environment" swaps the queue node's label and color between Redpanda and Apache Kafka without changing the rest of the diagram, reinforcing that the interface is identical either way.

Color coding: The book's teal accent color for every node that is identical in dev and production; a two-tone split fill (teal/amber) on the Redpanda/Apache Kafka node to visually flag it as the one node that differs by environment.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the chain reflows top-to-bottom instead of left-to-right.
</details>

## The Storage Plane: Different Data, Different Engines

Chapter 5's storage plane split into two systems of record — the event store and the property graph — and Chapters 7 and 8 explained why: an event store built for billions of append-only rows and a graph built for tens of millions of structural nodes are different engineering problems, and no single database is the right answer to both. The design specification's technology-selection table resolves that split with **ClickHouse** for the event store: a columnar database that appends new rows quickly, compresses them roughly tenfold, and answers aggregate queries over billions of rows in well under a second — exactly the shape of the compression rollups Chapter 8 walked through in detail. The structural graph runs on **Neo4j 5 Community**, the same labeled property graph Chapter 7 introduced, sized for tenancy, content, the concept DAG, deployments, and experiments rather than for raw events.

Two more relational stores handle data that does not belong in either the event log or the graph. **PostgreSQL 16** runs twice, as two separate, isolated database instances rather than as two schemas on one shared server: one instance holds nothing but the roster-identity-to-pseudonym mapping the identity service reads (Chapter 6's PII vault), reachable from no other component, and a second, entirely separate instance holds admin configuration, role assignments, the audit log, and experiment definitions. Running two instances instead of one shared server with two schemas turns Chapter 6's privacy boundary into a network-and-credential boundary rather than a permission setting a future engineer could loosen by accident.

Two more stores round out the plane. **Redis 7** is the in-memory cache that keeps the gateway's token lookups, the processor's per-district salt cache, and the analytics API's response cache fast enough to stay off the critical path of every request. And bulk exports, archival copies, and the event store's cold tier land in an object store — **MinIO** in development, **Amazon S3** in production — the same Redpanda-and-Apache-Kafka pairing pattern applied to blob storage: identical interface, different place the bytes actually live.

!!! mascot-tip "A Technique Worth Borrowing"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Running two PostgreSQL 16 instances instead of two schemas on one server is a move you can reuse in your own projects any time one dataset needs a harder privacy boundary than the data sitting next to it. A schema boundary is one `GRANT` statement away from disappearing; a separate instance with separate credentials on a separate network policy is not. When the cost of a mistake is a learner's real name leaking into an analytics query, pay for the second instance.

#### Diagram: The Storage Plane, Which Technology Holds What

<iframe src="../../sims/storage-plane-technology-map/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Storage Plane, Which Technology Holds What</summary>
Type: graph-model
**sim-id:** storage-plane-technology-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, differentiate

Learning objective: Let the learner classify each storage-plane technology — ClickHouse, Neo4j 5 Community, PostgreSQL 16 (×2), Redis 7, MinIO, and Amazon S3 — by the specific kind of data it is responsible for, differentiating the event store from the graph from the two isolated PostgreSQL instances.

Purpose: Show a vis-network graph with six technology nodes, each connected to a short label describing what it holds, colored by whether the technology is a system of record, a cache, or an object store.

Nodes: "ClickHouse — system of record for every statement, at full fidelity" (system of record). "Neo4j 5 Community — structure and compressed summary vertices only, never raw events" (system of record). "PostgreSQL 16 — vault-db, PII vault, reachable only from the identity service" (system of record, isolated). "PostgreSQL 16 — meta-db, admin config, RBAC, audit log, experiment definitions" (system of record, isolated). "Redis 7 — token cache, salt cache, analytics response cache, rate limits" (cache). "MinIO (dev) / Amazon S3 (prod) — bulk exports, archival, event-store cold tier" (object store).

Interactive features: Clicking any node opens an infobox with that technology's one-sentence definition from this chapter's prose and the specific data it holds. A toggle labeled "Group by role" clusters the six nodes into three groups — system of record, cache, object store — instead of a flat list, letting the learner see that the two PostgreSQL 16 instances share a role cluster while remaining visually separate nodes, because they are isolated at the network level.

Color coding: System-of-record nodes in the book's teal accent color; the cache node in a lighter tint of the same hue; the object-store node in a neutral gray, consistent with Chapter 7's storage-plane color language.

Responsive design: Graph layout recalculates via vis-network's physics engine on window resize; below tablet width, nodes stack into a scrollable single column grouped by role.
</details>

## Human Identity vs. Learner Identity: Keycloak and OIDC

One more identity system belongs in this chapter, and it is easy to confuse with the one Chapter 6 already covered. Chapter 6's identity service resolves a *learner's* raw actor identity into a pseudonymous `student_key` using a per-district HMAC salt — it runs inside the processing plane, it never issues a login session, and no human ever authenticates against it directly. The system this chapter adds is a different kind of identity altogether: **Keycloak**, an open-source identity and access management server that gives *humans* — district admins, teachers, authors, auditors — a real login. Keycloak runs in the development stack as a stand-in for whatever identity provider a customer district already operates in production, speaking the same OpenID Connect protocol either way — the same dev/prod pairing pattern the ingestion and storage planes already showed with Redpanda and Apache Kafka, and MinIO and Amazon S3.

OpenID Connect, often abbreviated OIDC, is a standard way for one system to prove to another who a logged-in user is, without that second system ever handling the user's password directly. When a district administrator opens one of the administrative UIs Chapter 9's function catalog assumed exists, Keycloak — or the district's own identity provider, in production — is what authenticates them and hands back a token the Admin API trusts. That token carries the role — district admin, instructor, author, auditor — that role-based access control enforces at the API layer, not merely hidden behind a UI button that anyone could still reach directly.

!!! mascot-warning "Two Systems, One Word"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to hear "identity" once and assume the whole system means one thing, but this project deliberately has two identity systems doing unrelated jobs. Chapter 6's identity service pseudonymizes learners so their raw names never reach the analytics stores. Keycloak authenticates the humans — teachers, admins, authors — who log in to look at the results. A compromised Keycloak session could let someone view dashboards they should not; it could never re-identify a student, because Keycloak never touches the pseudonym mapping at all. Keep the two apart.

#### Diagram: Two Kinds of Identity in This Learning Record Store

<iframe src="../../sims/two-kinds-of-identity/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Two Kinds of Identity in This Learning Record Store</summary>
Type: infographic
**sim-id:** two-kinds-of-identity<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: distinguish, contrast

Learning objective: Let the learner distinguish the Chapter 6 pseudonymization identity service from Keycloak's human single-sign-on role, so the two systems that both use the word "identity" are never conflated.

Purpose: Show a two-branch vis-network graph contrasting "Learner Identity (Chapter 6)" against "Human Identity (this chapter)" side by side.

Nodes: Root splits into two branches. Branch 1, "Learner Identity": "Raw actor in an xAPI statement" leads to "identity service — per-district HMAC salt" leads to "student_key (pseudonymous)" leads to "Used by: Stream Processor, analytics stores. Never a login.". Branch 2, "Human Identity": "District admin / teacher / author logs in" leads to "Keycloak (dev) / customer identity provider (prod) — OpenID Connect" leads to "Signed token carrying a role" leads to "Used by: Admin API, Analytics API, Dash dashboards. Enforces RBAC.".

Interactive features: Clicking any node opens an infobox with that node's one-sentence role. Clicking either branch's header opens an infobox contrasting it directly against the other branch, quoting this chapter's "keep the two apart" framing. A toggle labeled "Show what a breach would expose" annotates each branch's leaf node with the consequence of that specific system being compromised, reinforcing why the separation matters for privacy.

Color coding: Learner Identity branch in the book's teal accent color, matching Chapter 6's existing identity-service diagrams; Human Identity branch in a distinct violet, signaling this is a different system entirely.

Responsive design: Branches stack vertically on narrow viewports; vis-network physics layout recalculates on window resize.
</details>

## The Analytics Plane: REST, Not GraphQL

The analytics plane answers every report Chapter 9's Progress Projection and Mastery Computation functions feed — dozens of fixed-shape queries like "this section's mastery heatmap" or "this student's progress overview." The design specification builds that plane's API in **FastAPI** again, the same framework chosen for the ingestion gateway, this time exposing a conventional REST interface rather than xAPI's specialized one. REST — an architectural style built around a fixed set of operations, like retrieving or creating a resource, each with a predictable, cacheable response shape — is the style behind most web APIs. The alternative the design specification explicitly considered and rejected is **GraphQL**, a query language that lets a client ask for exactly the fields it wants across multiple linked resources in a single request, trading a fixed response shape for a flexible one the client controls.

GraphQL's flexibility is a real advantage when a client's data needs vary unpredictably from request to request. The analytics plane's needs do not vary that way: every report in the specification's catalog — the mastery heatmap, the completion funnel, the engagement calendar — already has one fixed shape, decided in advance by the report's own definition, not by whatever a caller happens to ask for that day. A fixed shape is also a cacheable one: the design specification builds a cache key directly from the report identifier, the tenant, and the query parameters, something straightforward with REST's one-shape-per-endpoint model and considerably harder to get right against GraphQL's client-decided response shapes. Choosing REST here is not a rejection of GraphQL as a technology — it is a recognition that GraphQL's flexibility would cost caching and rate-limiting cleanliness this particular plane never needed to spend.

The table below collects this decision alongside three more from the design specification, so the pattern of "an alternative was considered, and here is exactly why it lost" is visible across the stack rather than argued once and forgotten.

| Decision | Alternative(s) Considered | Chosen | Why (from the design specification) |
|---|---|---|---|
| Analytics API query style | GraphQL | REST, via FastAPI | Every report already has a fixed, cacheable shape; REST caches and rate-limits cleanly. |
| Stream-processing framework | Heavier windowing/shuffle frameworks | Plain Python consumer loops, via the Confluent-Kafka Library | The work is per-statement enrichment, not a shuffle — a windowing framework buys nothing here. |
| Compression mechanism | Streaming counter deltas (`SET n.count = n.count + $delta`) | Recomputed absolute values, via ClickHouse materialized views | Increments are not idempotent under Kafka's at-least-once delivery; a redelivered delta silently inflates a counter with no way to detect it afterward. |
| Development identity provider | A stubbed or mocked login | Keycloak | Gives the dev stack a real OpenID Connect provider, so the authentication code path is tested honestly instead of faked. |

## The Observability Stack: Seeing Across the Whole Pipeline

Every technology named so far answers "where does the data live" or "how does a request get served." One plane's job is different: watching the whole pipeline work, end to end, so a slow report or a stuck statement can be diagnosed instead of guessed at. Chapter 9's function catalog already implied the non-functional requirement this answers — the specification requires end-to-end tracing from the moment a statement is received to the moment it is projected into a summary vertex. The design specification meets that requirement with four products working as a chain rather than four independent choices.

**OpenTelemetry** is the instrumentation layer: a vendor-neutral standard for generating traces and metrics, built into the gateway, the stream processor, and every other role, so that a single trace ID, minted the moment a statement reaches the gateway, rides along inside the message's Kafka header and attaches itself to the eventual ClickHouse and Neo4j writes. OpenTelemetry does not store or display anything by itself — it produces the signal and hands it off. **Jaeger** is where the traces go: a distributed-tracing backend that lets an engineer look up one trace ID and see every hop a single statement took, from the gateway through the queue through the processor to its final write, as one connected timeline. **Prometheus** takes the other kind of signal OpenTelemetry produces — metrics, like queue depth or processing lag, rather than the story of one specific statement — and scrapes them at a regular interval from every running role, building a time series a query language can search. **Grafana** is the dashboard layer built on top of Prometheus's stored metrics (and, for some panels, Jaeger's traces): the screen a system administrator actually watches, with panels for the same processing-lag and dead-letter-rate figures the system's Data Quality Monitor report renders for a district administrator, but tuned for a systems audience instead.

!!! mascot-encourage "Four New Names, One Simple Shape"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    OpenTelemetry, Jaeger, Prometheus, and Grafana arriving in one paragraph can feel like a lot, especially this late in a chapter already carrying thirteen other technology names. Hold onto the shape instead of the list: something has to generate the signal (OpenTelemetry), something has to store each of the two kinds of signal it produces (Jaeger for traces, Prometheus for metrics), and something has to put it on a screen a person can read (Grafana). Four names, one pipeline, in that order every time.

#### Diagram: The Observability Pipeline, From Statement to Screen

<iframe src="../../sims/observability-pipeline-trace-flow/main.html" width="100%" height="442px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Observability Pipeline, From Statement to Screen</summary>
Type: workflow
**sim-id:** observability-pipeline-trace-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a single trace ID and a separate metrics stream flow through OpenTelemetry, Jaeger, Prometheus, and Grafana, from statement receipt to a screen a system administrator actually watches.

Purpose: Show a single Mermaid flowchart with two parallel paths sharing a common source, reflecting that traces and metrics are two different signals produced by the same instrumentation.

Nodes: Common source: "Gateway mints a trace ID on statement receipt". Path A (traces): leads to "OpenTelemetry instrumentation attaches the trace ID at every hop (gateway, queue, processor, ClickHouse write, Neo4j write)" leads to "Jaeger stores the full trace as one connected timeline" leads to "Engineer looks up one statement's entire journey". Path B (metrics): "Every role emits metrics (queue depth, processing lag, dead-letter rate) via OpenTelemetry" leads to "Prometheus scrapes and stores the metrics as a time series" leads to "Grafana renders dashboards a system administrator watches" leads to "Same numbers back the Data Quality Monitor report for a district administrator".

Interactive features: Every node has a Mermaid click directive. Clicking "OpenTelemetry" opens an infobox defining it as the vendor-neutral instrumentation standard, distinguishing it from the three products that consume its output. Clicking "Jaeger" or "Prometheus" opens an infobox naming which signal type each stores (traces vs. metrics). Clicking "Grafana" opens an infobox naming its role as the presentation layer for both. Clicking the shared "trace ID" node reinforces the end-to-end-tracing requirement named in this chapter's prose.

Color coding: The trace path in the book's teal accent color; the metrics path in a complementary amber; the shared source node in a neutral color to show it is the common origin of both.

Responsive design: The two paths stack vertically at narrow widths, remaining independently readable; the flowchart resizes to the width of its containing element.
</details>

## Seeing the Full Stack at Once

Seventeen names now sit behind the five planes Chapter 5 introduced with no products attached to them at all. The table below places every one of them the way the design specification's own technology-selection table does — plane by plane, job by job — so the whole stack can be read in a single pass rather than five separate sections' worth of prose.

| Plane | Component | Technology | Dev / Prod |
|---|---|---|---|
| Ingestion | Gateway framework | FastAPI + Uvicorn | Same both |
| Ingestion | Durable queue | Redpanda / Apache Kafka | Redpanda (dev), Apache Kafka (prod) |
| Processing | Stream-processor client | Confluent-Kafka Library | Same both |
| Storage | Event store | ClickHouse | Same both |
| Storage | Structural graph | Neo4j 5 Community | Same both |
| Storage | PII vault | PostgreSQL 16 (vault-db) | Same both |
| Storage | Metadata store | PostgreSQL 16 (meta-db) | Same both |
| Storage | Cache / hot state | Redis 7 | Same both |
| Storage | Object store | MinIO / Amazon S3 | MinIO (dev), Amazon S3 (prod) |
| Analytics | API style | FastAPI, REST (not GraphQL) | Same both |
| Identity | Human single sign-on | Keycloak / customer identity provider | Keycloak (dev), customer IdP (prod) |
| Observability | Instrumentation | OpenTelemetry | Same both |
| Observability | Trace storage | Jaeger | Same both |
| Observability | Metrics storage | Prometheus | Same both |
| Observability | Dashboards | Grafana | Same both |

Every choice in that table has a name in the design specification too — an Architecture Decision Record — and a number behind it, from the capacity model that explains why 100–400 requests per second lets a Python gateway work at all to the compression math that keeps Neo4j's write rate survivable through a five-times ingest burst. This chapter told you what was chosen. Chapter 11 shows the arithmetic and the argument that chose it.

## Key Takeaways

- **FastAPI** and **Uvicorn** together form the ingestion gateway and the analytics API, chosen because batched xAPI delivery keeps the request rate far below the statement rate.
- **Redpanda** (development) and **Apache Kafka** (production) are the same Kafka-API-compatible durable queue, read by stream processors through the **Confluent-Kafka Library**.
- **ClickHouse** is the event store's columnar engine; **Neo4j 5 Community** holds structure and compressed summaries only, never raw events.
- **PostgreSQL 16** runs as two isolated instances — one for the PII vault, one for admin metadata — turning Chapter 6's privacy boundary into a network-and-credential boundary.
- **Redis 7** caches hot state; **MinIO** (development) and **Amazon S3** (production) hold bulk exports and archival objects.
- The analytics API chose REST over **GraphQL** because every report already has a fixed, cacheable shape.
- **Keycloak** authenticates humans via OpenID Connect and must never be confused with Chapter 6's learner-pseudonymization identity service.
- **OpenTelemetry** instruments the whole pipeline; **Jaeger** stores traces, **Prometheus** stores metrics, and **Grafana** renders both for a system administrator.

!!! mascot-celebration "Every Name Now Has a Job"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Seventeen technology names, five planes, and not one of them arbitrary — every choice traced back to a requirement this book already justified. What does the evidence show? Naming a technology is the easy half of an engineering decision; the hard half is writing down why, in a form that survives the person who made the choice leaving the room. In [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md), we open the design specification's own ADRs and the arithmetic behind them.
