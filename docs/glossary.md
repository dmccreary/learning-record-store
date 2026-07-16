---
title: Glossary
description: Plain-language definitions for the acronyms and technical terms used throughout the LRS specification and design documents.
---

# Glossary of Terms

#### Advanced Distributed Learning (ADL)

The U.S. Department of Defense initiative that publishes and maintains the xAPI specification. ADL is the standards body an implementation must conform to, not a piece of software.

**Example:** The ADL LRS Conformance Test Suite is the official way to verify that a Learning Record Store correctly implements the xAPI standard.

#### Amazon Web Services (AWS)

A commercial cloud computing platform offering on-demand compute, storage, database, and networking services. Several managed AWS services appear as production deployment options in this design.

**Example:** RDS PostgreSQL and S3 are AWS-managed alternatives to running PostgreSQL and object storage yourself.

#### Application Load Balancer (ALB)

A managed network component that distributes incoming requests across multiple server instances, routing traffic away from unhealthy or overloaded ones. See also: [High Availability (HA)](#high-availability-ha).

**Example:** The ingestion gateway runs behind an ALB so no single gateway instance is a single point of failure.

#### Application Programming Interface (API)

A defined set of rules and endpoints that lets separate pieces of software request data or actions from each other, without either side needing to know the other's internal implementation.

**Example:** The Analytics API lets a dashboard request a report's data without knowing whether that data lives in ClickHouse or Neo4j.

#### Architecture Decision Record (ADR)

A short document that records a single significant design decision, the context that motivated it, and its status. An ADR creates a durable trail of *why* a system is built the way it is, not just what was built.

**Example:** ADR-001 records the decision to make ClickHouse the system of record for statements, with the reasoning behind it.

#### Availability Zone (AZ)

An isolated physical data-center location within a cloud region, engineered so a failure in one zone (power, cooling, networking) does not take down another. See also: [Multi-AZ Deployment](#multi-az-deployment), [High Availability (HA)](#high-availability-ha).

**Example:** Running a database Multi-AZ means that if one data center loses power, a standby copy in a different Availability Zone keeps serving requests.

#### Bayesian Knowledge Tracing (BKT)

A statistical model that estimates the probability a student has mastered a concept, updating that probability after each new piece of evidence using Bayesian inference.

**Example:** After a student answers a question correctly, BKT raises the estimated probability that they have mastered the related concept — but not all the way to 100%, since guessing is possible.

#### Central Processing Unit (CPU)

The hardware component that executes a computer's instructions. In cloud deployments, capacity is often measured in "vCPU" (virtual CPU) — a share of a physical processor allocated to one container or virtual machine.

**Example:** A gateway pod sized at "2 vCPU" is allocated the processing power of two virtual processor cores.

#### Children's Online Privacy Protection Act (COPPA)

A U.S. federal law that restricts how online services collect personal information from children under 13, generally requiring verifiable parental consent before that data can be processed.

**Example:** A district's consent-status screen tracks which students have COPPA parental consent on file and excludes the rest from non-essential processing.

#### Cohen's d

A standardized statistic that expresses how large a difference is between two groups, such as a control and treatment arm in an experiment, measured in units of standard deviation rather than the metric's original scale.

**Example:** A Cohen's d of 0.5 means the treatment group's average outcome is half a standard deviation higher than the control group's.

#### Comma-Separated Values (CSV)

A plain-text file format for tabular data, where each line is a row and commas separate the column values. Widely used for importing and exporting spreadsheet-like data between systems.

**Example:** A school district can upload its class roster as a CSV file.

#### Command-Line Interface (CLI)

A way of operating software by typing text commands rather than clicking through a graphical interface.

**Example:** `lrs bootstrap` is a CLI command that sets up the database schema before any other service starts.

#### Confidence Interval (CI)

A range of values, computed from sample data, that is likely to contain the true value of a metric being measured. A narrower interval means a more precise estimate. Contrast with: [Continuous Integration (CI)](#continuous-integration-ci) — an unrelated concept that happens to share the same abbreviation.

**Example:** Reporting "mastery improved by 7% ± 2%" is a plain-language way of expressing a confidence interval.

#### Continuous Integration (CI)

An automated practice where every code change is automatically built and tested before it is merged, catching problems early. Contrast with: [Confidence Interval (CI)](#confidence-interval-ci) — an unrelated statistics term that happens to share the same abbreviation.

**Example:** The official xAPI conformance suite runs automatically in CI on every code change, rather than being checked manually before a release.

#### Create, Read, Update, Delete (CRUD)

The four basic operations any system that manages persistent records needs to support: creating a new record, reading it back, updating it, and deleting it.

**Example:** The School / Course / Section Management UI provides CRUD operations for administrators to manage class rosters.

#### Data Definition Language (DDL)

The subset of database commands used to define or change the structure of data — creating tables, columns, and constraints — as opposed to reading or writing the data itself.

**Example:** Applying DDL creates a table's columns before any data can be stored in it.

#### Dead-Letter Queue (DLQ)

A holding area where messages that could not be processed successfully, such as malformed data, are routed instead of being silently dropped, so they can be inspected and retried later.

**Example:** A malformed xAPI statement that fails validation lands in the dead-letter queue rather than disappearing.

#### Differential Privacy

A mathematical technique for publishing aggregate statistics about a group of people while adding carefully calibrated randomness, so that no individual's data can be confidently inferred from the result.

**Example:** A future cross-district benchmark could use differential privacy instead of simple group-size thresholds to protect individual students' data.

#### Directed Acyclic Graph (DAG)

A set of nodes connected by one-way edges that never loop back on themselves, so the graph always has a valid start-to-finish ordering.

**Example:** A course's learning graph is a DAG: "Variables" must come before "Functions," and nothing ever depends on itself, directly or indirectly.

#### Disaster Recovery (DR)

The set of policies and procedures used to restore a system's data and operation after a major failure, such as a data-center outage or a corruption event.

**Example:** A quarterly DR drill checks that the team can actually restore the vault database from backup within its target recovery time.

#### Elo Rating System

A method, originally developed to rank chess players, for updating a single numeric skill estimate after each match based on whether the outcome was better or worse than expected.

**Example:** Unlike Elo, Bayesian Knowledge Tracing outputs an actual probability of mastery rather than an unscaled skill number.

#### Expectation-Maximization (EM)

An iterative statistical algorithm that estimates the unknown parameters of a model by alternating between estimating hidden values and refining the parameters that best explain the observed data.

**Example:** Per-concept Bayesian Knowledge Tracing parameters, such as slip and guess rates, are fit nightly using EM over the statement log.

#### Family Educational Rights and Privacy Act (FERPA)

A U.S. federal law that protects the privacy of student education records and gives parents, and eligible students, rights over how those records are accessed and shared.

**Example:** A district's retention and export policy must be configured to stay FERPA-compliant.

#### General Data Protection Regulation (GDPR)

A European Union law that governs how organizations collect, process, and store personal data, including rights to access, correct, and request deletion of one's own data.

**Example:** A "right to erasure" data-subject request is a GDPR-derived requirement.

#### GraphQL

A query language for APIs that lets a client request exactly the fields it needs in a single call, instead of the fixed shape a typical REST endpoint returns. Contrast with: [Representational State Transfer (REST)](#representational-state-transfer-rest).

**Example:** The Analytics API chooses REST over GraphQL because every report already has a fixed, cacheable shape.

#### Hash-Based Message Authentication Code (HMAC)

A technique for producing a fixed-length code from a message and a secret key, used to prove a value was derived from that key without exposing the key itself.

**Example:** A student's pseudonymous key is computed with HMAC so it can't be reversed back to the student's real identity without the district's secret salt.

#### High Availability (HA)

A system design goal where a service keeps running correctly even when individual components fail, typically achieved through redundancy across machines or data centers.

**Example:** Neo4j Community edition cannot cluster, so it has no HA story — a production deployment needs the Enterprise or Aura edition instead.

#### Horizontal Pod Autoscaler (HPA)

A Kubernetes feature that automatically adds or removes running copies, called pods, of a service based on a live metric such as CPU usage or request rate.

**Example:** The gateway's HPA adds more pods automatically when request rate climbs during a class-period spike.

#### Hypertext Transfer Protocol (HTTP)

The standard set of rules web browsers, apps, and servers use to request and exchange data over the internet.

**Example:** Every xAPI statement is submitted as an HTTP `POST` request to the ingestion gateway.

#### Idempotent

A property of an operation where performing it multiple times produces the same result as performing it once, with no additional side effects on repeat attempts.

**Example:** Writing an absolute mastery score to the graph is idempotent — replaying the same write twice leaves the graph in the same state as writing it once, so an accidental redelivery causes no harm.

#### Identity Provider (IdP)

A service that verifies a user's identity and issues proof of that identity that other applications can trust, so users can sign in once and access multiple systems.

**Example:** Keycloak acts as the Identity Provider in the development environment; a school district's own IdP would be used in production.

#### Internationalized Resource Identifier (IRI)

A string that uniquely identifies a resource, much like a web address, extended to support characters beyond the basic Latin alphabet used in ordinary URLs.

**Example:** Each xAPI verb and activity is identified by an IRI, such as `http://adlnet.gov/expapi/verbs/completed`.

#### ISO 8601

An international standard for writing dates and times unambiguously, in the format `YYYY-MM-DDTHH:MM:SSZ`.

**Example:** `2026-07-15T14:30:00Z` is a timestamp written in ISO 8601 format.

#### Item Response Theory (IRT)

A family of statistical models used in testing that estimates both how difficult a question is and how capable a test-taker is, from patterns of correct and incorrect answers.

**Example:** IRT was considered as an alternative to Bayesian Knowledge Tracing for computing concept mastery.

#### JavaScript Object Notation (JSON)

A lightweight, human-readable text format for representing structured data as nested key-value pairs, widely used for exchanging data between systems.

**Example:** Every xAPI statement is submitted as a JSON object with `actor`, `verb`, and `object` fields.

#### Key Performance Indicator (KPI)

A specific, measurable value used to track whether a system or process is meeting its goals.

**Example:** Active textbooks, active students, and statements-per-day are the KPI tiles on the District Adoption Dashboard.

#### Kubernetes (k8s)

An open-source system for running, scaling, and managing containerized applications across a cluster of machines. "k8s" is a numeronym: "k," 8 letters, "s."

**Example:** In production, each LRS role — gateway, processor, summarizer — runs as its own Kubernetes Deployment.

#### Kubernetes Event-Driven Autoscaling (KEDA)

A Kubernetes add-on that scales a service based on external event sources, such as how many unprocessed messages are waiting in a queue, rather than just CPU or memory usage.

**Example:** KEDA scales the number of stream-processor pods up when Kafka consumer lag grows.

#### Learning Management System (LMS)

Software that schools and districts use to organize courses, assignments, and student rosters, distinct from the intelligent textbooks and the LRS itself.

**Example:** A district's integration catalog may include connectors to its LMS in addition to its Student Information System.

#### Least Recently Used (LRU)

A cache-eviction rule that, when a cache runs out of room, discards whichever item has gone the longest without being accessed.

**Example:** If the identity service is unreachable, the gateway falls back to a local LRU cache of recent lookups instead of failing the request.

#### Machine Learning (ML)

A set of techniques where a system improves at a task by learning patterns from data, rather than following rules written by hand.

**Example:** A future machine learning model could forecast at-risk students earlier than the simple threshold rules used today, though it would need careful fairness review.

#### Managed Streaming for Apache Kafka (MSK)

An AWS service that runs and operates a Kafka-compatible message queue on a customer's behalf, removing the need to self-host the brokers.

**Example:** MSK is one of the managed alternatives to self-hosting Redpanda for the durable event queue in production.

#### Materialized View (MV)

A database object that stores the precomputed result of a query, kept incrementally up to date as new data arrives, so reading it is much faster than recomputing the query each time.

**Example:** A per-student, per-concept rollup materialized view keeps a running summary updated as new statements land, instead of recalculating it from scratch on every read.

#### Multi-AZ Deployment

Running redundant copies of a service or database across more than one Availability Zone, so the loss of one data center does not take the service down. See also: [Availability Zone (AZ)](#availability-zone-az).

**Example:** The vault database runs Multi-AZ so a data-center outage doesn't cut off access to the pseudonym mappings.

#### Ninety-Fifth Percentile (P95)

A statistic meaning that 95% of measured values fall at or below this number — used to describe typical "worst-case-but-not-extreme" performance rather than a simple average.

**Example:** A dashboard's "≤2 seconds at P95" requirement means at least 95 out of 100 page loads must finish within 2 seconds.

#### Non-Volatile Memory Express (NVMe)

A high-speed interface for solid-state storage drives, offering much faster read and write performance than older storage interfaces.

**Example:** ClickHouse nodes are sized with NVMe storage to sustain fast columnar scans over billions of rows.

#### OAuth 2.0

An industry-standard framework that lets one application access resources on a user's behalf without ever handling that user's password directly, using short-lived, scoped tokens instead.

**Example:** A textbook's ingestion credentials can be issued as OAuth 2.0 client credentials rather than a shared password.

#### OpenID Connect (OIDC)

An identity layer built on top of OAuth 2.0 that lets an application verify who a user is, not just what they're allowed to access. Often paired with an Identity Provider.

**Example:** Keycloak provides OIDC sign-in for the administrative dashboards in the development environment.

#### Personally Identifiable Information (PII)

Any data that could be used, alone or combined with other data, to identify a specific individual, such as a name or a roster ID.

**Example:** A student's real name is PII and is stored only in the isolated vault, never in the analytics graph.

#### Point-in-Time Recovery (PITR)

The ability to restore a database to its exact state at any specific moment in the past, rather than only to the moment of the last full backup.

**Example:** PITR lets the team restore the vault database to exactly the state it was in at 2:17 PM yesterday if a bad write is discovered.

#### Process ID (PID)

A number the operating system assigns to a running program so it can be tracked, signaled, or stopped independently of other running programs.

**Example:** Running the application as PID 1 in its container means it receives shutdown signals directly, instead of a wrapper script swallowing them.

#### Random Access Memory (RAM)

The hardware that a running program uses to store data it needs immediate access to; unlike disk storage, its contents are cleared when the machine restarts.

**Example:** The default deployment profile needs about 8 GB of RAM to run every backing service and application role at once.

#### Recovery Point Objective (RPO)

The maximum amount of data, measured in time, an organization is willing to lose if a failure occurs. See also: [Recovery Time Objective (RTO)](#recovery-time-objective-rto).

**Example:** An RPO of 5 minutes means continuous backup must capture every write within 5 minutes of it happening, so at most 5 minutes of recent writes can be lost.

#### Recovery Time Objective (RTO)

The maximum amount of time an organization allows for restoring a system to working order after a failure. See also: [Recovery Point Objective (RPO)](#recovery-point-objective-rpo).

**Example:** A 1-hour RTO for the vault database means the restore process must complete within an hour of the outage starting.

#### Relational Database Service (RDS)

A managed AWS service that runs a standard relational database, such as PostgreSQL, while handling backups, patching, and failover automatically.

**Example:** RDS PostgreSQL, Multi-AZ, is the production option for the vault and metadata databases.

#### Replication Factor (RF)

The number of copies of the same data a distributed system keeps on different machines, so that losing one machine does not lose the data.

**Example:** A replication factor of 3 means every message written to the queue is stored on three separate brokers before it is safe to lose one.

#### Representational State Transfer (REST)

An architectural style for designing web APIs around a fixed set of operations, like retrieving or creating a resource, each with a predictable, cacheable response shape. Contrast with: [GraphQL](#graphql).

**Example:** `GET /v1/reports/R-201` is a REST endpoint that always returns the same shape of data for the Class Mastery Heatmap report.

#### Requests Per Second (RPS)

A measure of how many incoming requests a system receives or handles each second, used to size and scale services.

**Example:** Batching xAPI statements keeps the gateway's RPS around 400, far below the 10,000 statements per second it actually ingests.

#### Role-Based Access Control (RBAC)

A security model where permissions are assigned to named roles, such as "Instructor" or "District Admin," rather than to individual people, and users gain permissions by being assigned a role.

**Example:** An Instructor's RBAC role lets them view analytics for their own sections but not perform admin configuration.

#### Sample-Ratio Mismatch (SRM)

A data-quality check in an A/B test that flags when the actual split of users between test arms doesn't match the intended allocation, a sign the experiment's results may not be trustworthy.

**Example:** An SRM check catches an experiment where 55% of students landed in the control arm when the design called for an even 50/50 split.

#### Security Assertion Markup Language (SAML)

An older XML-based standard for exchanging identity and sign-in information between an Identity Provider and an application, commonly used in enterprise and school-district single sign-on.

**Example:** A district's existing SAML-based sign-in system can be connected to the LRS's administrative dashboards.

#### SHA-256

A cryptographic hash function that turns any input into a fixed-length, effectively unique 256-bit fingerprint; the same input always produces the same output, but the output cannot be reversed back into the input.

**Example:** HMAC-SHA256 combines this hash function with a secret key to produce a student's pseudonymous key.

#### Simple Storage Service (S3)

An AWS service for storing and retrieving files, called objects, at large scale, commonly used for backups, exports, and archival data.

**Example:** Statement data older than 13 months is tiered from ClickHouse's fast local storage out to S3.

#### Single Sign-On (SSO)

An authentication setup that lets a user log in once and gain access to multiple separate applications without signing in again to each one.

**Example:** SSO lets a district administrator log into the analytics dashboard and the admin UI with one set of credentials.

#### Software Bill of Materials (SBOM)

A complete, machine-readable inventory of every component and dependency packaged inside a piece of software, used to track vulnerabilities and license obligations.

**Example:** Each container image is published with an SBOM so a newly discovered vulnerability in a dependency can be traced to every affected release.

#### Structured Query Language (SQL)

The standard language used to define, query, and modify data stored in a relational or columnar database.

**Example:** The compression rollups that feed the graph are defined as SQL materialized views in ClickHouse.

#### Student Information System (SIS)

The system of record a school or district uses for enrollment, scheduling, grades, and other administrative student records, separate from any learning content platform.

**Example:** Class rosters are synced into the LRS from the district's SIS rather than being entered by hand.

#### Time to Live (TTL)

The length of time a piece of cached or stored data is considered valid before it must be refreshed or discarded.

**Example:** A cached district lookup has a 60-second TTL, after which the gateway re-fetches it.

#### Total Cost of Ownership (TCO)

The full cost of using a system over its lifetime, including infrastructure, licensing, staff time, and maintenance, not just its up-front price.

**Example:** Choosing between a managed cloud database and a self-hosted one requires a TCO comparison, not just a sticker-price comparison.

#### Transport Layer Security (TLS)

A protocol that encrypts data as it travels over a network so it can't be read or tampered with in transit. "Mutual TLS," or mTLS, additionally requires both sides of the connection to prove their identity, not just the server.

**Example:** Processors fetch a district's salt over mTLS, so both the processor and the identity service verify each other before any secret is exchanged.

#### User ID (UID)

A number that identifies which account a running process is operating as, used by the operating system to enforce file and resource permissions.

**Example:** The application container runs as UID 10001, a dedicated non-root account, rather than as the all-powerful root account.

#### User Interface (UI)

The part of a system a person directly sees and interacts with, as opposed to the underlying logic and data it's built on.

**Example:** The District Management UI is where a System Admin creates and configures a new school district.

#### Write-Ahead Log (WAL)

A record of every change to a database, written before the change is applied, so the database can be replayed or restored to any point after the last backup.

**Example:** Continuous WAL archiving is what makes Point-in-Time Recovery possible for the vault database.

#### YAML

A human-readable text format for writing structured configuration data, using indentation and simple key-value pairs instead of heavy punctuation.

**Example:** The `docker-compose.yml` file that starts the whole LRS stack is written in YAML.

