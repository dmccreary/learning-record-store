---
title: Configuration, Migration, Backup, and Rollout
description: How this project validates configuration with Pydantic Settings, sources secrets from AWS Secrets Manager through Kubernetes, migrates schema without downtime, meets its recovery objectives, and rolls out a change safely.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 11:57:08
version: 0.09
---

# Configuration, Migration, Backup, and Rollout

## Summary

This chapter covers operational lifecycle concerns: environment-variable configuration and secrets management, the four schema-migration patterns from additive columns to expand-contract, backup and disaster-recovery objectives, and the rolling-update strategy that keeps a deploy safe.

## Concepts Covered

This chapter covers the following 21 concepts from the learning graph:

1. Pydantic Settings Validation
2. Environment Variable Config
3. AWS Secrets Manager
4. External Secrets Operator
5. Kubernetes Secret
6. Ingest Key Rotation
7. Ingest Key Hashing
8. Additive Column Migration
9. Rebuild And Swap Migration
10. Expand Contract Migration
11. Kafka Partition Increase Caveat
12. Recovery Point Objective
13. Recovery Time Objective
14. Write-Ahead Log Archiving
15. Point-In-Time Recovery
16. Nightly Backup Snapshot
17. Quarterly Restore Drill
18. Rolling Update Strategy
19. Termination Grace Period
20. Gateway-First Deploy Order
21. Expand-Contract Rollback

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 11: Architecture Decision Records and the Capacity Model](../11-adrs-and-capacity-model/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)
- [Chapter 15: Privacy Enforcement and Dashboard Mechanics](../15-privacy-and-dashboard-mechanics/index.md)
- [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md)

---

!!! mascot-welcome "The Image Is Signed. Now What?"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 17 ended with a digest-pinned image, provably built by this project's own pipeline. A signed image is not yet a running system, though — it still needs real configuration and secrets, a way to change its schema without losing data, a way to recover a destroyed store, and a way to roll a new version out without an outage. This chapter follows that image the rest of the way into a running, operable Learning Record Store. Let's follow the record.

## Configuration as Validated Environment Variables

Every role Chapter 16 introduced — `gateway`, `processor`, `summarizer`, `identity` — needs to know where Kafka is, which ClickHouse database to write to, and which Neo4j instance holds the graph. **Environment Variable Config** is the practice of supplying all of that as environment variables rather than files baked into the image or values hard-coded in source. The image itself never changes between a laptop and production; only the environment around it does. Chapter 17's `x-lrs-env` YAML anchor is this idea expressed in Compose: one block of `KEY=value` pairs, injected into every role's container at startup.

Reading environment variables directly in application code is a well-known source of silent failures — a mistyped variable name resolves to `None` instead of raising an error, and the bug surfaces hours later as a confusing timeout. This project avoids that with **Pydantic Settings Validation**: a `Settings` class, built on `pydantic-settings`, declares every configuration value the process needs, its type, and the environment-variable name it reads from, and validates all of it once at startup. The design specification is blunt about failure: a missing or malformed value crashes the process on boot, loudly, rather than surfacing as a `None` three hours into a shift.

The project's actual `src/lrs/config.py` shows the pattern in practice. A representative excerpt:

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    kafka_bootstrap: str = Field(
        default="localhost:9092", validation_alias="KAFKA_BOOTSTRAP"
    )
    neo4j_uri: str = Field(
        default="bolt://localhost:7687", validation_alias="NEO4J_URI"
    )
    neo4j_password: str = Field(
        default="neo4j", validation_alias="NEO4J_PASSWORD"
    )
```

Each field declares its own `validation_alias` because the real environment-variable names this project committed to — `KAFKA_BOOTSTRAP` with no prefix, `LRS_LOG_LEVEL` with one — are inconsistent, and `Settings` has to match reality. The `extra="ignore"` setting matters because Chapter 17's compose file gives every role the same environment block, so a `gateway` process's `Settings` sees variables like `NEO4J_PASSWORD` that only `identity` uses — ignoring rather than rejecting them keeps one shared file from becoming five near-duplicates.

## From a Laptop's `.env` File to a Production Secret

Not every environment variable is equally sensitive. A log level is harmless to leak; a database password is not. This project's `.env.example` — the template copied to a git-ignored `.env` before running `make up` — makes the distinction visible in its structure: placeholder passwords like `change-me-neo4j` sit next to a comment warning that "production secrets NEVER come from a file." That comment names a different mechanism used once the system leaves a laptop.

In development, a secret is a line in `.env`, read by `Settings` like any other variable. In production, the same value follows a longer, auditable chain through three new pieces of infrastructure. **AWS Secrets Manager** is a managed vault where production secrets — database passwords, API keys — are stored, versioned, and rotated, never as plaintext in a repository or image. The **External Secrets Operator**, or **ESO**, is a Kubernetes controller that watches a store like AWS Secrets Manager for a change and continuously syncs its value into the cluster. A **Kubernetes Secret** is the object ESO writes to — a cluster-native store a pod can expose as an environment variable, exactly the shape `Settings` already expects.

Notice what stays constant across both environments: the application code never knows or cares which path supplied a value. `Settings` reads `NEO4J_PASSWORD` from the process environment either way — only the machinery that populates that environment changes.

| Environment | Source | How the value reaches the process |
|---|---|---|
| Dev | `.env` (git-ignored, dev-only values) | Compose reads `.env` directly and injects it via `x-lrs-env` |
| Production | AWS Secrets Manager / Vault → External Secrets Operator → Kubernetes Secret | ESO syncs the vault value into a k8s Secret; the pod spec mounts it as an env var |

Rotating a production secret this way costs nothing at the application layer: ESO polls the vault and rewrites the Kubernetes Secret automatically, so a rotated password reaches every running pod without a rebuild — the same guarantee Chapter 17's immutable digest gives the image's *code*, extended to the *configuration* around it.

#### Diagram: Config and Secrets Flow

<iframe src="../../sims/config-secrets-flow/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>Config and Secrets Flow</summary>
Type: workflow
**sim-id:** config-secrets-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace a configuration value from its source (a dev .env file, or AWS Secrets Manager in production) to the running process's Settings object, and explain why the application code never needs to know which path supplied it.

Purpose: A Mermaid flowchart with two parallel paths converging on one shared node, contrasting dev-time and production-time configuration sourcing.

Left path ("Dev"): ".env file (git-ignored)" -> "docker compose (x-lrs-env anchor)" -> "Container environment".

Right path ("Production"): "AWS Secrets Manager / Vault" -> "External Secrets Operator (polls and syncs)" -> "Kubernetes Secret" -> "Pod environment".

Both converge on: "Settings (Pydantic) reads and validates on boot" branching to "Process starts" or, in red, "Process crashes loudly".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition from this chapter's prose. A toggle isolates the Dev or Production path for focused reading.

Color coding: Dev path gray-blue, production path teal, the validation node amber, the crash branch red.

Responsive design: Paths stack vertically on narrow viewports; all click handlers and the convergence point are preserved.
</details>

!!! mascot-thinking "A Secret's Path Is a Chain of Custody, Not a Box"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    It is tempting to think of "secrets management" as one component you either have or don't. Notice instead that the production path above is a *chain*: a vault, a controller that watches it, a cluster object it writes, and a process that reads that object. Each link can be reasoned about, audited, and rotated independently — a single box hiding all of that would be simpler to draw and much harder to trust.

## Ingest Keys: Hashed, Not Just Rotated

The credentials a Learning Record Provider uses to authenticate against the ingestion gateway deserve the same care as database passwords, with one wrinkle: an ingest key is handed to a third party — a textbook author's deployment, a district's SIS integration — outside this project's infrastructure, so it can leak in places a database password never travels. **Ingest Key Rotation** is the administrative capability, exposed through the xAPI Endpoint & Credentials UI the design specification describes in §10.5, to issue a new per-textbook or per-district credential and retire an old one without a redeploy. A leaked key gets rotated the same way a routine annual refresh does — the mechanism does not distinguish emergency from maintenance, which is what makes it safe to use often.

Rotation alone does not protect a key stored carelessly on this project's own side. **Ingest Key Hashing** is the decision to store every ingest key as an HMAC rather than as recoverable ciphertext, so the plaintext is unrecoverable by design — including by this project's own operators. An incoming request is validated by hashing the presented key and comparing HMACs, the same technique Chapter 6 introduced for actor pseudonymization, applied here to credentials instead of learner identities. Because the plaintext is never stored, a database breach that exposes the ingest-key table exposes nothing an attacker can directly use to authenticate.

That storage choice has a visible consequence in the credentials UI: a key is shown to its creator exactly once, at creation, and never again. If a textbook author loses their copy, the only recovery path is rotation — there is no "reveal" button, because the plaintext was never retained at all.

!!! mascot-tip "Treat 'I Lost My Ingest Key' as a Rotation Request, Not a Support Ticket"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you are ever advising a textbook author or district integrator who has misplaced their ingest key, the answer is always the same and always fast: rotate it. Because Ingest Key Hashing means the old value cannot be looked up, there is no slower "let me find that for you" path — a feature, not a gap, since nobody's plaintext key ever sits in a support ticket either.

## Four Ways a Schema Can Change

Configuration and credentials answer "how does a process learn who it is and what it can talk to." Schema migration answers a harder question: how does a system that never stops accepting statements change the shape of data it already holds? Chapter 14 described this project's ClickHouse, Neo4j, and PostgreSQL schemas; this section covers how each is allowed to change.

The simplest case barely deserves the name "migration." An **Additive Column Migration** adds a new column to an existing ClickHouse table with `ALTER TABLE ... ADD COLUMN`, applied online with no table rewrite and no downtime — nothing about the existing rows or read path has to change to make room for a column nothing yet queries.

```sql
-- Additive Column Migration: safe at any time, no downtime
ALTER TABLE lrs.statements
    ADD COLUMN device_type LowCardinality(String) DEFAULT 'unknown';
```

A change to *meaning* rather than *shape* needs more care. Suppose a new Bayesian Knowledge Tracing parameterization, of the kind Chapter 12 described, changes how `concept_mastery` values are computed from the same statements — the column layout is identical, but every existing value is now wrong. A **Rebuild And Swap Migration** handles this by never mutating the old projection in place: `lrs replay --into concept_mastery_v2` recomputes it from the untouched event log into a fresh target, using the Replay CLI Command Chapter 16 introduced. Once verified against the old one, the read path switches via configuration, and only then is the old projection dropped. A breaking graph model change uses the identical pattern — rebuild from the log into a new database, verify, swap, drop.

PostgreSQL's `vault-db` holds the pseudonym mappings Chapter 6 described, and a breaking change there is riskier still, because unlike ClickHouse and Neo4j it cannot be rebuilt from the event log — the vault *is* the log's only link back to a real learner. An **Expand Contract Migration**, applied through Alembic, splits a schema change into independently deployable steps rather than one atomic cutover: add a nullable column, backfill it from the old one, dual-write to both during a transition window, switch reads, then drop the old column. Each step can ship, and be reversed, on its own.

One more caveat does not fit the "just add a column" pattern the others share. A **Kafka Partition Increase Caveat** describes why growing a topic's partition count is not routine: Chapter 14 explained that a statement's Kafka key — `district_id:student_key` — determines its partition, and consistent assignment keeps one learner's statements in order, which BKT's sequential updates depend on. Adding partitions changes that mapping and breaks ordering for any learner with statements in flight. The only safe options are a maintenance window with consumers stopped, or — the choice this project made — over-provisioning up front: `xapi.statements.raw` ships with 48 partitions against a 10k-statement-per-second target needing only about 24, headroom bought once rather than an increase attempted later.

The table below reinforces the four patterns just described, now that each has been explained in prose.

| Pattern | Applies to | Downtime | Reversible? |
|---|---|---|---|
| Additive Column Migration | ClickHouse table columns | None | Trivially (drop the column) |
| Rebuild And Swap Migration | ClickHouse projections, Neo4j graph model | None (old projection serves until swap) | Yes — old version untouched until dropped |
| Expand Contract Migration | PostgreSQL (`vault-db`) via Alembic | None per step | Yes — each step independently reversible |
| Kafka Partition Increase Caveat | Kafka topic partition count | Requires a maintenance window, or avoid via over-provisioning | No — breaks in-flight key-to-partition ordering |

#### Diagram: Expand-Contract Step Sequencer

<iframe src="../../sims/expand-contract-step-sequencer/main.html" width="100%" height="472px" scrolling="no"></iframe>

<details markdown="1">
<summary>Expand-Contract Step Sequencer</summary>
Type: microsim
**sim-id:** expand-contract-step-sequencer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: apply, sequence

Learning objective: Given the five steps of an Expand Contract Migration in scrambled order, arrange them into the correct sequence and identify which steps can ship independently.

Canvas layout: A vertical drop-zone column of five numbered slots on the left; a scrambled shelf of five draggable tiles on the right — "Add new column (nullable)", "Backfill from old column", "Dual-write to both columns", "Switch reads to new column", "Drop old column". A bottom strip reads "Correctly placed: 0 / 5" with a "Check Order" button.

Visual elements: Teal rounded-rectangle tiles; a correctly placed tile turns green with a checkmark, an incorrect one flashes red and returns to the shelf.

Interactive controls: Drag-and-drop tiles into slots; "Check Order" validates and updates the score; "Reset" clears the board.

Default parameters: All five tiles start on the shelf in seeded (reproducible) random order; no slot pre-filled.

Behavior: On a fully correct order, display "Expand, contract, done — every step above could have shipped on its own." Clicking a placed tile reopens an infobox explaining why that step must precede the next.

Implementation notes: p5.js mouse-press/release drag-and-drop, matching Chapter 1's vocabulary-matching MicroSim. Responsive: canvas tracks container width; columns stack vertically on narrow viewports.
</details>

!!! mascot-warning "Partition Count Is a One-Way Door"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    Every other migration pattern in this section is comfortably reversible. The Kafka Partition Increase Caveat is not: once partitions are added and traffic flows against the new mapping, there is no clean way back to the old ordering guarantee for statements caught in between. That asymmetry is why this project over-provisioned 48 partitions once rather than planning to grow the number later — the design specification calls this "the row that bites teams," worth remembering as a category, not just a fact about one topic.

## Recovery Objectives: How Much You Can Afford to Lose

Configuration and migrations both assume the underlying stores stay intact. Backup planning is what happens when that assumption fails — a disk fails, an operator runs a destructive query, an availability zone goes dark. Two measurements frame every backup decision, and both are promises about a *worst case*, not normal operation.

A **Recovery Point Objective**, or **RPO**, is the maximum data — measured in time — a system may lose in a disaster: an RPO of one hour means at most the last hour of writes is gone after recovery. A **Recovery Time Objective**, or **RTO**, is the maximum time a system may take to come back online: an RTO of four hours means the store must be usable again within four hours, however stale its data. The two are independent — fast recovery can still lose more data — and this project sets both differently per store, based on one question: how expensive is it to reconstruct what was lost?

## How Each Store Gets Backed Up

That question splits this project's stores into two categories. ClickHouse is the event log — this book's system of record — so a **Nightly Backup Snapshot** (`BACKUP TABLE ... TO S3`, full nightly) pairs with hourly incrementals to bound a restore's loss. Neo4j's graph, by contrast, is a projection Chapter 8 described as rebuildable from the log by construction, so its nightly dump to S3 is a *convenience* — it can also be regenerated by replaying ClickHouse, which the design specification notes is actually faster than restoring the dump.

PostgreSQL's two stores — `vault-db`, holding the pseudonym mappings, and `meta-db`, holding RBAC and audit data — cannot lean on a rebuild-from-the-log fallback, because neither is a projection of anything else. Their protection is **Write-Ahead Log Archiving**: continuously shipping the database's write-ahead log — the durable, append-only record every relational database keeps internally before applying a change — to object storage as it is generated, instead of waiting for a scheduled snapshot. That continuous archiving is what makes **Point-In-Time Recovery**, or **PITR**, possible: restoring to any specific timestamp, not just the last snapshot, by replaying the archived log forward from a base backup — how `vault-db` and `meta-db` reach a five-minute RPO while ClickHouse, backed only by hourly incrementals, settles for one hour.

Worth being explicit about which failure is actually catastrophic here. Losing Kafka costs nothing structurally — Chapter 14 already described it as a seven-day replay buffer, not a system of record, so it is not backed up at all. Losing Redis costs only a cache warm-up, since BKT state re-checkpoints from the compacted `lrs.mastery.state` topic. Losing the **vault**, by contrast, is the one truly unrecoverable case: without its salts and mappings, every `student_key` already in ClickHouse becomes permanently un-linkable to a real learner. The statistics survive; the ability to answer one parent's data-subject request does not.

| Store | Backup mechanism | RPO | RTO |
|---|---|---|---|
| ClickHouse (system of record) | Nightly Backup Snapshot + hourly incremental | 1 hour | 4 hours |
| Neo4j | Nightly dump to S3, and rebuildable from the log | 24 hours | 1 hour (rebuild is faster than restore) |
| `vault-db` | Write-Ahead Log Archiving, Point-in-Time Recovery | 5 minutes | 1 hour |
| `meta-db` | Write-Ahead Log Archiving, Point-in-Time Recovery | 5 minutes | 1 hour |
| Kafka | Not backed up (7-day replay buffer) | — | — |
| Redis | Not backed up (cache only) | — | — |

Knowing an RPO and RTO on paper is not the same as knowing a restore works under pressure. A **Quarterly Restore Drill** is a scheduled, non-hypothetical exercise: every three months, the team actually restores `vault-db` from its archived write-ahead log to a point in time, on infrastructure separate from production, and confirms the result is usable and the numbers hold. Because losing the vault is this project's one truly unrecoverable failure, it is the one store whose recovery procedure must never go untested between real disasters.

#### Diagram: Recovery Point and Recovery Time by Data Store

<iframe src="../../sims/rpo-rto-by-data-store/main.html" width="100%" height="452px" scrolling="no"></iframe>

<details markdown="1">
<summary>Recovery Point and Recovery Time by Data Store</summary>
Type: chart
**sim-id:** rpo-rto-by-data-store<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, justify

Learning objective: Compare Recovery Point Objective and Recovery Time Objective across ClickHouse, Neo4j, vault-db, and meta-db, and judge which store's backup strategy the whole system depends on most.

Chart type: Grouped horizontal bar chart, logarithmic x-axis in minutes.

Purpose: Show that vault-db and meta-db have the tightest RPO despite Neo4j having the loosest, connecting that gap to which stores are rebuildable versus irreplaceable.

Y-axis (categories): ClickHouse, Neo4j, vault-db, meta-db.

Data series:
1. RPO (minutes), teal bars: ClickHouse 60, Neo4j 1440, vault-db 5, meta-db 5.
2. RTO (minutes), amber bars: ClickHouse 240, Neo4j 60, vault-db 60, meta-db 60.

Interactive features: Hovering a bar shows an exact tooltip ("vault-db RPO: 5 minutes — continuous WAL archiving"). Clicking a store's label opens an infobox explaining why its numbers look that way (e.g., Neo4j's loose RPO because it is rebuildable from the log). A checkbox filters to irreplaceable stores only (vault-db, meta-db).

Color scheme: Teal for RPO bars, amber for RTO bars; vault-db and meta-db rows get a red left-border flagging them as unrecoverable-if-lost.

Annotations: A callout near vault-db reading "The one true worst case."

Responsive design: Chart resizes to container width; series stack per category and the legend moves below the chart on narrow viewports.
</details>

!!! mascot-encourage "Two Numbers, One Question"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    RPO, RTO, WAL archiving, PITR, snapshots, restore drills — a lot of backup vocabulary landing at once. Underneath it sits one plain question asked in different clothes: "if this store vanished right now, how much would we lose, and how long would getting it back take?" Answer that for any store here and you already understand backup planning — the acronyms are just shorthand.

## Rolling Out a Change Safely

A validated configuration, a completed migration, and a tested backup all matter only if a new version can actually reach production without an outage. This project deploys every role to Kubernetes, and different roles need different care during rollout, because they fail differently when disrupted mid-update.

Stateless roles — the gateway, the analytics and admin APIs, the dashboards — use an ordinary **Rolling Update Strategy**: Kubernetes replaces old pods with new ones a few at a time, `maxSurge=1` (one extra pod may briefly exist above target) and `maxUnavailable=0` (the running count may never dip below it), and each new pod must pass its readiness check before receiving traffic. Because these roles hold no state a mid-request restart would corrupt, a request landing on a pod being replaced is simply served by one that has not yet rotated.

```yaml
# Stateless role rollout (gateway, APIs, dashboards)
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
readinessProbe: {...}   # new pod must pass before receiving traffic
```

The processor role needs one more safeguard, because Chapter 13 described it consuming Kafka in batches and committing offsets only after a ClickHouse write acknowledges. A **Termination Grace Period** is the time Kubernetes waits after asking a pod to stop before forcibly killing it, giving in-flight work a chance to finish. The processor's rollout sets `terminationGracePeriodSeconds: 60`, long enough for a batch to commit its offsets rather than being killed mid-batch and redelivered on restart. At-least-once delivery, backed by the `ReplacingMergeTree` table Chapter 14 introduced, makes that redelivery *safe* — duplicates merge away — but safe is not free; every avoided redelivery is one fewer insert to reconcile.

One role is treated differently from every other. **Gateway-First Deploy Order** means the gateway is always the first role updated when rolling a new version out, and the last rolled back if that version must be reverted. The gateway is the only role whose unavailability actually loses data — if it cannot accept a statement, that statement never reaches Kafka, while every other role's downtime only staleness-affects a projection that recovers on its own once the role returns. Updating the gateway first surfaces a broken version at maximum leverage, before downstream roles consume what it produced; rolling it back last keeps a district's live ingestion path the very last thing touched during a recovery.

That leverage only holds because of how this project structures migrations. An **Expand-Contract Rollback** is what makes reverting to a previous image safe: because every schema change follows the Expand Contract Migration pattern — nullable columns, backfills, dual-writes, staged cutovers — the previous application version, N-1, always runs correctly against the *current* schema, version N left behind. Rollback becomes nothing more than redeploying the previous digest, with no matching "roll the schema back" step, because the schema was never mutated out from under the old version — what keeps a rollback a routine redeploy instead of a second incident.

The list below draws those ideas into one operational sequence, useful as a self-check before the diagram.

1. A change ships as one immutable, digest-pinned image (Chapter 17).
2. Any schema change already shipped separately, via Expand Contract or Rebuild And Swap Migration — never atomically with the code.
3. The gateway rolls out first, under an ordinary Rolling Update Strategy.
4. Processors roll out next, protected by a 60-second Termination Grace Period.
5. If anything looks wrong, rollback is redeploying the previous digest — gateway last, schema untouched, both versions served correctly.

#### Diagram: Gateway-First Deploy and Rollback Order

<iframe src="../../sims/gateway-first-deploy-rollback/main.html" width="100%" height="542px" scrolling="no"></iframe>

<details markdown="1">
<summary>Gateway-First Deploy and Rollback Order</summary>
Type: workflow
**sim-id:** gateway-first-deploy-rollback<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace the deploy order and the reverse rollback order across the gateway, processors, and stateless roles, and explain why the gateway sits at both ends of the sequence.

Purpose: A Mermaid flowchart with two tracks sharing the same role nodes — "Deploy order" and "Rollback order" — visiting roles in opposite sequence, to make the asymmetry visually obvious.

Deploy order track: "Gateway (first)" -> "Processors (Termination Grace Period 60s)" -> "Summarizer" -> "Stateless APIs & Dashboards (last)".

Rollback order track: "Stateless APIs & Dashboards (first)" -> "Summarizer" -> "Processors" -> "Gateway (last)".

A shared side note connects both tracks: "Expand-Contract Rollback: schema never mutated out from under a version, so adjacent versions can run against it at once."

Interactive features: Every node has a Mermaid click directive opening an infobox on that role's rollout behavior (clicking "Processors" explains the Termination Grace Period; clicking "Gateway" explains why it is the only role whose downtime loses data). Clicking the side note explains Expand-Contract Rollback. A toggle highlights one track and dims the other.

Color coding: Deploy track teal, rollback track amber with reversed arrows, both gateway nodes outlined to draw the eye to the asymmetry.

Responsive design: Tracks stack vertically on narrow viewports, preserving reading order and all click handlers.
</details>

## Bringing It Together

Follow one change through everything named in this chapter. A developer's fix needs a new environment variable — `Settings` declares it, validated on boot, sourced from `.env` in dev and from AWS Secrets Manager through the External Secrets Operator into a Kubernetes Secret in production. If the fix needs a schema change, it ships separately and first, as an Additive Column or staged Expand Contract Migration, never bundled atomically with the code depending on it. The image builds, gets scanned and signed as Chapter 17 described, and rolls out gateway-first, processors protected by their termination grace period. Every store behind this already has a tested backup path sized to how expensive it would be to lose — from Kafka's disposable replay buffer to the vault's five-minute recovery point, proven quarterly rather than assumed. If the rollout looks wrong, rollback is one redeploy of the previous digest, safe because the schema was never mutated out from under the restored version.

## Key Takeaways

- **Environment Variable Config**, validated at startup by **Pydantic Settings Validation**, means a missing or malformed value crashes the process loudly on boot rather than surfacing as a silent bug hours later.
- Production secrets travel from **AWS Secrets Manager** through the **External Secrets Operator** into a **Kubernetes Secret**, so a rotated value reaches every running pod without a rebuild or redeploy.
- **Ingest Key Hashing** stores every credential as an HMAC, unrecoverable by design, which is why **Ingest Key Rotation** — not a "reveal key" feature — is the only answer to a lost credential.
- **Additive Column Migration** and **Rebuild And Swap Migration** change ClickHouse and Neo4j without downtime; **Expand Contract Migration** does the same for PostgreSQL through independently reversible steps; the **Kafka Partition Increase Caveat** is the one migration in this chapter that is not safely reversible.
- **Recovery Point Objective** and **Recovery Time Objective** quantify how much a store may lose and how long recovery may take, and this project sets both differently depending on whether a store is rebuildable or irreplaceable.
- **Write-Ahead Log Archiving** enables **Point-in-Time Recovery** for the two irreplaceable PostgreSQL stores; **Nightly Backup Snapshot**s protect ClickHouse; a **Quarterly Restore Drill** proves the vault's recovery path actually works.
- A **Rolling Update Strategy** with a **Termination Grace Period** protects stateful processors; **Gateway-First Deploy Order** and **Expand-Contract Rollback** make the gateway the safest role in the system to update and the last one touched if anything must be undone.

!!! mascot-celebration "From Signed Image to Operable System"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You can now trace a configuration value from a laptop's `.env` file to a production Kubernetes Secret, explain why an ingest key can only be rotated and never revealed, name which migration pattern fits which store, and defend why the gateway deploys first and rolls back last. What does the evidence show? A system this careful about its own operations is one built to be trusted with student records. In [Chapter 19: Failure Modes and Verification](../19-failure-modes-and-verification/index.md), we turn from "how do we change this system safely" to "how do we know, moment to moment, whether it is healthy."
