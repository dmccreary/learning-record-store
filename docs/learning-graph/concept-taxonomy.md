# Concept Taxonomy

15 categories for the 578-concept learning graph of **Learning Record Store: IEEE Standards, Architecture, and Practice**. The set is larger than the skill's usual ~12-category target because the book itself is unusually broad — a standards survey, a full systems-design spec, and a three-persona practice guide in one graph — so a few extra categories keep each one thematically coherent rather than forcing unrelated concepts together. No category exceeds 12.5% of the graph.

### Standards & Governance (STD)

**IDs 1–60.** The IEEE/xAPI standards ecosystem: SCORM/AICC history, the xAPI data model, IEEE 9274.1.1-2023 and 9274.2.1, cmi5, the Total Learning Architecture, and the IEEE LTSC / I2IDL / ADL Initiative governance story.

### Graph Data Model (GRAPH)

**IDs 61–120.** This project's own architecture: the five system planes and their core components (gateway, queue, event store, processor, APIs), the multi-tenancy hierarchy (District→School→Course→Section→Student), the property-graph node and relationship types, and the six summary-vertex grains.

### Ingestion & Compression Pipeline (INGST)

**IDs 121–146, 195–225.** How an xAPI statement moves through the system: validation, non-blocking/accept-first ingestion, reconciliation, the core LRS functions (F-1–F-12), pseudonymization mechanics, BKT streaming updates, and the six named Kafka topics.

### Technology Stack (TECH)

**IDs 147–163.** The named tools and libraries chosen for each plane: FastAPI, Redpanda/Kafka, ClickHouse, Neo4j, PostgreSQL, Redis, MinIO/S3, Keycloak, and the OpenTelemetry/Jaeger/Prometheus/Grafana observability stack.

### Architecture & Capacity Model (ARCH)

**IDs 164–194.** The seven ADRs, the load-profile derivation (statements/day, disk sizing, request rates), and the Bayesian Knowledge Tracing math behind mastery scoring.

### Storage Engineering (STORE)

**IDs 226–241.** The physical schema: ClickHouse tables and materialized views, the ReplacingMergeTree/AggregatingMergeTree engines, and the Neo4j/PostgreSQL constraint and instance design.

### Privacy & Dashboard Mechanics (DASH)

**IDs 242–264.** Cross-cutting concerns (tenant isolation, threshold/complementary suppression, tracing) and the Dash/Plotly component vocabulary (KPI tiles, heatmaps, funnels, cross-filtering) that every report is built from.

### Deployment & DevOps (DEPL)

**IDs 265–312.** The one-image-many-roles container strategy, the CLI role dispatcher, Docker Compose, the Makefile targets, and the CI/CD image supply chain (SBOM, signing, provenance).

### Operations, Testing & Roadmap (OPS)

**IDs 313–369, 389–403.** Configuration/secrets, schema migration, backup/DR, rollout strategy, the 12 named failure modes, the 7 testing layers, the 3 open deviations, the 6 delivery milestones, the 7 open questions, and the MVP plan's own findings.

### Infrastructure & Cost (INFRA)

**IDs 370–388, 404–427.** Hardware sizing and monthly cost estimates, the single-server pilot tier, the dev-environment setup (Docker Desktop/Engine, remote hosts), and production cloud services (Kubernetes, managed Kafka, AuraDB, RDS).

### Personas & Roles (ROLE)

**IDs 428–433.** The three personas this book is written for — District Administrator, Teacher, Textbook Author — plus the three additional named roles from the spec's role table (System Admin, School Admin, Auditor).

### Admin UIs & Compliance (ADMIN)

**IDs 434–478.** The nine district-administrator UIs, their sub-features, and the FERPA/COPPA/GDPR compliance and RBAC/SSO mechanisms they enforce.

### Reports & Analytics Catalog (RPT)

**IDs 479–530.** Every one of the 35 named reports and the district/teacher/author dashboards and interactive tools that host them, by their exact spec IDs (R-101 through R-408, T-1 through T-8).

### Experimentation Subsystem (EXP)

**IDs 531–552.** The A/B-testing model: hypotheses, variants, sticky assignment, guardrail metrics, and statistical readout (effect size, confidence intervals, sample-ratio mismatch).

### Producer Contract & Cross-Persona (PROD)

**IDs 553–578.** How an intelligent textbook emits conformant statements — canonical IRIs, the three-verb set, the Start/Pause dwell pattern — plus the concepts that tie the three personas back to one shared statement log.
