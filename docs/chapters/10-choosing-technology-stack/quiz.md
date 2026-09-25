---
title: "Quiz: Choosing the Technology Stack"
description: Review questions on the concrete technology choices behind each architectural plane — FastAPI, Redpanda/Kafka, ClickHouse, Neo4j, PostgreSQL, Keycloak, REST vs. GraphQL, and the observability stack.
social:
   cards: false
---
# Quiz: Choosing the Technology Stack

Test your understanding of this project's concrete technology choices, plane by plane, with these review questions.

---

#### 1. What is the division of labor between FastAPI and Uvicorn in the ingestion gateway?

<div class="upper-alpha" markdown>
1. FastAPI defines routes, validates JSON, and shapes responses; Uvicorn is the ASGI server that actually accepts the HTTP connection and hands requests to FastAPI
2. FastAPI is the ASGI server, while Uvicorn defines routes and validates JSON
3. FastAPI and Uvicorn are two interchangeable names for the same product
4. FastAPI runs only in production, while Uvicorn runs only in development
</div>

??? question "Show Answer"
    The correct answer is **A**. FastAPI defines routes, validates incoming JSON, and shapes responses, while Uvicorn is the ASGI server that actually accepts the network connection and hands each request to FastAPI's routing layer. B reverses their actual roles. C wrongly treats two complementary products as interchangeable. D invents an environment split that does not exist — both run together in every environment.

    **Concept Tested:** FastAPI / Uvicorn

    **See:** [The Ingestion Plane: One Fast Path In](index.md#the-ingestion-plane-one-fast-path-in)

---

#### 2. Why does this project run Redpanda in development and Apache Kafka in production rather than choosing one broker for both environments?

<div class="upper-alpha" markdown>
1. Because Redpanda cannot durably queue statements, so it is unsafe for anything beyond a demo
2. Because Apache Kafka requires a paid license that only production environments can afford
3. Because Redpanda only supports reading statements, never writing them
4. Because Redpanda is Kafka-API-compatible and fast to start on a laptop, while Apache Kafka is the durable, partitioned, ordered log actually used in production — application code does not need to know which one is running
</div>

??? question "Show Answer"
    The correct answer is **D**. Redpanda speaks Kafka's wire protocol without being Kafka's codebase, so it starts in about a second on a laptop, while Apache Kafka is the production-grade log the Durable Event Queue was modeled on — the interface is identical either way. A mischaracterizes Redpanda as unable to durably queue data. B invents a licensing constraint the chapter never mentions. C is false; Redpanda supports both reading and writing.

    **Concept Tested:** Redpanda / Apache Kafka

    **See:** [The Ingestion Plane: One Fast Path In](index.md#the-ingestion-plane-one-fast-path-in)

---

#### 3. Why does this project use ClickHouse for the event store and Neo4j 5 Community for the structural graph, rather than one database for both?

<div class="upper-alpha" markdown>
1. Because Neo4j cannot store any data at all without ClickHouse running alongside it
2. Because an event store built for billions of append-only rows and a graph built for tens of millions of structural nodes are different engineering problems that no single database answers well
3. Because ClickHouse and Neo4j are two names for the same underlying storage engine
4. Because ClickHouse holds structure and Neo4j holds raw statements
</div>

??? question "Show Answer"
    The correct answer is **B**. An append-only log of billions of rows and a structural graph of tens of millions of nodes are fundamentally different engineering problems, so the design specification uses a columnar engine for one and a graph engine for the other. A invents a false dependency between the two databases. C wrongly treats two distinct engines as identical. D reverses which database holds which kind of data.

    **Concept Tested:** ClickHouse / Neo4j 5 Community

    **See:** [The Storage Plane: Different Data, Different Engines](index.md#the-storage-plane-different-data-different-engines)

---

#### 4. Why does this project run PostgreSQL 16 as two separate, isolated instances rather than two schemas on one shared server?

<div class="upper-alpha" markdown>
1. Because PostgreSQL does not support multiple schemas in a single instance
2. Because separate instances cost less to operate than a single shared server
3. Because a separate instance with its own credentials and network policy turns the PII privacy boundary into something a future engineer cannot loosen with one accidental GRANT statement, unlike a shared schema
4. Because the Admin API can only connect to one PostgreSQL instance at a time
</div>

??? question "Show Answer"
    The correct answer is **C**. A separate instance, with its own credentials and network policy, makes the PII privacy boundary a structural fact rather than a permission setting one accidental `GRANT` could loosen. A is factually false about PostgreSQL's capabilities. B invents a cost argument the chapter never makes — the choice is about privacy, not economics. D fabricates a connectivity restriction not described anywhere in the chapter.

    **Concept Tested:** PostgreSQL 16 (vault-db / meta-db)

    **See:** [The Storage Plane: Different Data, Different Engines](index.md#the-storage-plane-different-data-different-engines)

---

#### 5. How does Keycloak's role in this system differ from Chapter 6's identity service?

<div class="upper-alpha" markdown>
1. Keycloak authenticates humans (admins, teachers, authors) via OpenID Connect and issues login sessions; Chapter 6's identity service pseudonymizes learner actor identities and never issues a login
2. Keycloak and Chapter 6's identity service are two names for the exact same component
3. Keycloak pseudonymizes learner identities, while Chapter 6's identity service authenticates human logins
4. Keycloak replaces the need for Chapter 6's per-district salt entirely
</div>

??? question "Show Answer"
    The correct answer is **A**. Keycloak gives humans a real login via OpenID Connect, while Chapter 6's identity service pseudonymizes learner actor identities inside the processing plane and never issues a session to anyone. B wrongly conflates two deliberately separate systems. C reverses their actual jobs. D is false — the per-district salt mechanism is untouched by Keycloak's existence.

    **Concept Tested:** Keycloak

    **See:** [Human Identity vs. Learner Identity: Keycloak and OIDC](index.md#human-identity-vs-learner-identity-keycloak-and-oidc)

---

#### 6. The analytics plane's reports all have a fixed, predetermined shape decided by each report's own definition, and the team wants to build a cache key directly from the report ID, tenant, and query parameters. Given this chapter's stated rationale, why was REST chosen over GraphQL for this plane's API?

<div class="upper-alpha" markdown>
1. GraphQL cannot be implemented using FastAPI
2. GraphQL is objectively obsolete and no longer maintained
3. REST was chosen because the ingestion gateway also uses REST for a completely unrelated reason
4. REST's one-shape-per-endpoint model is straightforward to cache this way, while GraphQL's client-decided response shapes make that caching considerably harder to get right
</div>

??? question "Show Answer"
    The correct answer is **D**. Because every report already has a fixed shape, REST's one-shape-per-endpoint model lets a cache key be built cleanly from report ID, tenant, and parameters — something considerably harder against GraphQL's client-decided shapes. A is a fabricated technical incompatibility. B is an unsupported, sweeping claim the chapter never makes about GraphQL generally. C wrongly implies the ingestion gateway's unrelated use of REST drove this separate decision.

    **Concept Tested:** GraphQL (REST vs. GraphQL decision)

    **See:** [The Analytics Plane: REST, Not GraphQL](index.md#the-analytics-plane-rest-not-graphql)

---

#### 7. An engineer needs to look up one specific statement's entire journey — every hop from gateway to queue to processor to its final ClickHouse and Neo4j writes — as a single connected timeline. Which observability product is built for this?

<div class="upper-alpha" markdown>
1. Prometheus, because it stores time-series metrics
2. Grafana, because it renders dashboards
3. Jaeger, because it is the distributed-tracing backend that stores a trace ID as one connected timeline across every hop
4. OpenTelemetry, because it stores traces permanently
</div>

??? question "Show Answer"
    The correct answer is **C**. Jaeger is the distributed-tracing backend that lets an engineer look up one trace ID and see every hop a statement took as one connected timeline. A describes Prometheus's metrics role, a different signal type entirely. B describes Grafana's presentation role, which reads from Jaeger and Prometheus rather than storing traces itself. D mischaracterizes OpenTelemetry, which generates the signal but does not store or display it.

    **Concept Tested:** Jaeger

    **See:** [The Observability Stack: Seeing Across the Whole Pipeline](index.md#the-observability-stack-seeing-across-the-whole-pipeline)

---

#### 8. A textbook publisher wants to store bulk statement exports and archival copies of the event store's cold tier, and expects the same interface to work whether running locally or in production. Which technology pairing does this chapter describe for that role?

<div class="upper-alpha" markdown>
1. Redis 7 in development, PostgreSQL 16 in production
2. MinIO in development, Amazon S3 in production, with an identical interface in both
3. Neo4j 5 Community in development, ClickHouse in production
4. Keycloak in development, Jaeger in production
</div>

??? question "Show Answer"
    The correct answer is **B**. MinIO in development and Amazon S3 in production hold bulk exports, archival copies, and the event store's cold tier, following the same dev/prod pairing pattern as Redpanda/Apache Kafka — an identical interface, different place the bytes live. A, C, and D each pair two unrelated technologies that serve entirely different roles in this stack, not object storage.

    **Concept Tested:** MinIO / Amazon S3

    **See:** [The Storage Plane: Different Data, Different Engines](index.md#the-storage-plane-different-data-different-engines)

---

#### 9. The design specification rejected streaming counter deltas (`SET n.count = n.count + $delta`) as the compression mechanism, choosing recomputed absolute values via ClickHouse materialized views instead. What specifically justified that choice?

<div class="upper-alpha" markdown>
1. Increments are not idempotent under Kafka's at-least-once delivery — a redelivered delta would silently inflate a counter with no way to detect it afterward, while an absolute value write is safe to repeat
2. Absolute values are always numerically smaller than delta values, saving storage space
3. ClickHouse cannot execute UPDATE statements of any kind
4. Delta-based counters are incompatible with FastAPI's routing layer
</div>

??? question "Show Answer"
    The correct answer is **A**. Under at-least-once delivery, a redelivered delta would silently inflate a counter with no way to detect the error afterward, while an absolute value write is idempotent and safe to repeat — exactly the reasoning behind Chapter 8's Absolute Value Write. B invents an unrelated storage-size claim. C is an unsupported technical claim about ClickHouse. D confuses an unrelated ingestion-layer component with the compression mechanism.

    **Concept Tested:** ClickHouse (compression mechanism decision)

    **See:** [The Analytics Plane: REST, Not GraphQL](index.md#the-analytics-plane-rest-not-graphql)

---

#### 10. The design specification chose plain Python consumer loops via the Confluent-Kafka Library over a heavier stream-processing framework with windowing and shuffle capabilities. What reasoning justified that choice?

<div class="upper-alpha" markdown>
1. Heavier frameworks are always slower than plain consumer loops regardless of workload
2. Windowing frameworks are incompatible with the Confluent-Kafka Library entirely
3. The stream processor's actual work is per-statement enrichment, not the kind of windowed aggregation across many events that a shuffle-based framework exists to optimize
4. Plain consumer loops were chosen only because they run identically in Redpanda and Apache Kafka
</div>

??? question "Show Answer"
    The correct answer is **C**. Because the Stream Processor's job is per-statement enrichment rather than windowed aggregation across many events, a heavier shuffle-based framework buys nothing here — a plain consumer loop keeps pace with the queue on its own. A is an unsupported, overly general performance claim. B is a fabricated incompatibility. D names a true but unrelated fact that is not the chapter's stated justification.

    **Concept Tested:** Confluent-Kafka Library (stream-processing framework decision)

    **See:** [The Analytics Plane: REST, Not GraphQL](index.md#the-analytics-plane-rest-not-graphql)

---
