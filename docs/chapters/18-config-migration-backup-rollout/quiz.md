---
title: "Quiz: Configuration, Migration, Backup, and Rollout"
description: Review questions on validated environment configuration, secrets management, schema migration patterns, recovery objectives and backup mechanisms, and safe rollout ordering.
social:
   cards: false
---
# Quiz: Configuration, Migration, Backup, and Rollout

Test your understanding of this project's configuration, secrets, migration, backup, and rollout mechanisms with these review questions.

---

#### 1. What does Pydantic Settings Validation do when a required configuration value is missing or malformed at process startup?

<div class="upper-alpha" markdown>
1. It crashes the process loudly at boot, rather than letting the value silently resolve to None and surface as a confusing bug later
2. It silently substitutes a hardcoded default value and logs a warning
3. It pauses the process and waits indefinitely for an operator to supply the value
4. It ignores the invalid value and starts the process with that setting undefined
</div>

??? question "Show Answer"
    The correct answer is **A**. The design specification is blunt that a missing or malformed value crashes the process on boot, loudly, rather than surfacing as a silent `None` hours into a shift. B and D both describe silent failure modes this design specifically avoids. C invents a hanging behavior not described anywhere in the chapter.

    **Concept Tested:** Pydantic Settings Validation

    **See:** [Configuration as Validated Environment Variables](index.md#configuration-as-validated-environment-variables)

---

#### 2. Why does this project's application image never need to change between a laptop and production, even though the two environments use very different infrastructure?

<div class="upper-alpha" markdown>
1. Because the image automatically detects which environment it is running in and recompiles itself
2. Because production and development both run the exact same Kafka, ClickHouse, and Neo4j instances
3. Because Pydantic Settings Validation disables itself automatically outside of development
4. Because Environment Variable Config supplies all environment-specific values — Kafka address, database credentials — from outside the image, so only the environment around an unchanged image differs
</div>

??? question "Show Answer"
    The correct answer is **D**. Environment Variable Config keeps every environment-specific value outside the image itself, so the same built image runs unchanged while only the surrounding environment differs. A invents an implausible recompilation behavior. B is false — dev and production intentionally use different infrastructure. C contradicts the chapter, which describes validation running in every environment.

    **Concept Tested:** Environment Variable Config

    **See:** [Configuration as Validated Environment Variables](index.md#configuration-as-validated-environment-variables)

---

#### 3. In production, what is the correct order of the chain a secret travels through before it reaches a running pod's environment?

<div class="upper-alpha" markdown>
1. Kubernetes Secret -> AWS Secrets Manager -> External Secrets Operator -> pod environment
2. External Secrets Operator -> pod environment -> AWS Secrets Manager -> Kubernetes Secret
3. AWS Secrets Manager -> External Secrets Operator -> Kubernetes Secret -> pod environment
4. Pod environment -> Kubernetes Secret -> External Secrets Operator -> AWS Secrets Manager
</div>

??? question "Show Answer"
    The correct answer is **C**. AWS Secrets Manager holds the value, the External Secrets Operator watches it and syncs changes, a Kubernetes Secret is the cluster-native object it writes to, and the pod spec mounts that Secret as an environment variable. A, B, and D each scramble this chain in a way that would have a component depending on something that has not been populated yet.

    **Concept Tested:** AWS Secrets Manager / External Secrets Operator / Kubernetes Secret

    **See:** [From a Laptop's `.env` File to a Production Secret](index.md#from-a-laptops-env-file-to-a-production-secret)

---

#### 4. Why does the credentials UI show a newly created ingest key to its creator exactly once, with no "reveal" button if it is lost later?

<div class="upper-alpha" markdown>
1. Because the UI has a known bug that will be fixed in a future release
2. Because Ingest Key Hashing stores every key as an HMAC, so the plaintext is unrecoverable by design, including by this project's own operators
3. Because showing a key more than once would exceed the district's rate limit
4. Because ingest keys expire automatically after their first use
</div>

??? question "Show Answer"
    The correct answer is **B**. Because every ingest key is stored as an HMAC rather than recoverable ciphertext, the plaintext is genuinely gone after creation — not merely hidden — so there is no "reveal" path to offer even to this project's own operators. A wrongly frames a deliberate design choice as a defect. C invents an unrelated rate-limiting explanation. D is false; keys remain valid for repeated authentication, not single-use.

    **Concept Tested:** Ingest Key Hashing

    **See:** [Ingest Keys: Hashed, Not Just Rotated](index.md#ingest-keys-hashed-not-just-rotated)

---

#### 5. What is Ingest Key Rotation?

<div class="upper-alpha" markdown>
1. The automatic process that regenerates a district's per-district salt every night
2. The mechanism that resets a student's pseudonymous key after a district transfer
3. The process that swaps a container image for a newer digest
4. The administrative capability to issue a new per-textbook or per-district credential and retire an old one without a redeploy
</div>

??? question "Show Answer"
    The correct answer is **D**. Ingest Key Rotation lets an administrator issue a new credential and retire an old one without any redeploy, used identically for a leaked key or a routine refresh. A confuses it with the unrelated per-district salt from earlier chapters. B misapplies it to student pseudonymization, a separate mechanism entirely. C confuses it with Chapter 17's image supply chain.

    **Concept Tested:** Ingest Key Rotation

    **See:** [Ingest Keys: Hashed, Not Just Rotated](index.md#ingest-keys-hashed-not-just-rotated)

---

#### 6. A new BKT parameterization changes how concept_mastery values are computed from the same underlying statements, making every existing value in the column wrong, even though the column layout itself is unchanged. Which migration pattern fits this situation?

<div class="upper-alpha" markdown>
1. Additive Column Migration, because only a new column needs to be added
2. Rebuild And Swap Migration, recomputing the projection into a fresh target from the untouched event log, verifying it, then switching the read path
3. Expand Contract Migration, because this is a PostgreSQL schema change
4. Kafka Partition Increase Caveat, because the statement key format has changed
</div>

??? question "Show Answer"
    The correct answer is **B**. Because the change is to meaning rather than shape, Rebuild And Swap Migration recomputes the projection from the untouched log into a fresh target, verifies it, and only then switches the read path. A misapplies a pattern meant for a genuinely new column, not a changed computation. C misapplies a PostgreSQL-specific pattern to a ClickHouse projection. D confuses an unrelated Kafka partitioning concern with a computation change.

    **Concept Tested:** Rebuild And Swap Migration

    **See:** [Four Ways a Schema Can Change](index.md#four-ways-a-schema-can-change)

---

#### 7. Why does a breaking schema change to vault-db require an Expand Contract Migration rather than the same Rebuild And Swap approach used for ClickHouse and Neo4j?

<div class="upper-alpha" markdown>
1. Because PostgreSQL does not support any form of ALTER TABLE
2. Because Alembic can only be used with ClickHouse, never with PostgreSQL
3. Because vault-db cannot be rebuilt from the event log — it is the log's only link back to a real learner, so it cannot be reconstructed the way ClickHouse and Neo4j projections can
4. Because vault-db is never backed up, making any migration approach equally risky
</div>

??? question "Show Answer"
    The correct answer is **C**. Unlike ClickHouse and Neo4j, which are projections rebuildable from the immutable log, vault-db is itself the only link back to a real learner, so it must migrate through independently reversible steps rather than a rebuild-and-swap. A is factually false about PostgreSQL. B reverses which database Alembic actually targets. D contradicts the chapter's later coverage of vault-db's own backup protection.

    **Concept Tested:** Expand Contract Migration

    **See:** [Four Ways a Schema Can Change](index.md#four-ways-a-schema-can-change)

---

#### 8. Why does this project over-provision Kafka's `xapi.statements.raw` topic with 48 partitions up front, rather than starting smaller and increasing the partition count later if needed?

<div class="upper-alpha" markdown>
1. Because 48 partitions is required by the xAPI Conformance Suite regardless of actual load
2. Because a partition increase changes the key-to-partition mapping and breaks per-learner ordering for any statements in flight, and unlike the other migration patterns in this chapter, that break is not safely reversible
3. Because Kafka technically cannot increase a topic's partition count under any circumstances
4. Because 48 partitions is the minimum Redpanda requires to start at all
</div>

??? question "Show Answer"
    The correct answer is **B**. Increasing partition count remaps the key-to-partition assignment, breaking BKT's ordering-dependent updates for any learner with statements in flight — and unlike every other migration pattern in this chapter, that break cannot be cleanly undone. A invents a conformance requirement unrelated to this design choice. C overstates a real caution into a technical impossibility. D fabricates an unrelated minimum requirement.

    **Concept Tested:** Kafka Partition Increase Caveat

    **See:** [Four Ways a Schema Can Change](index.md#four-ways-a-schema-can-change)

---

#### 9. What is the difference between a Recovery Point Objective (RPO) and a Recovery Time Objective (RTO)?

<div class="upper-alpha" markdown>
1. RPO is the maximum data a system may lose, measured in time; RTO is the maximum time a system may take to come back online — the two are independent, so fast recovery can still lose more data
2. RPO and RTO are two names for the identical measurement
3. RPO measures downtime, while RTO measures data loss
4. RPO only applies to ClickHouse, while RTO only applies to PostgreSQL
</div>

??? question "Show Answer"
    The correct answer is **A**. RPO bounds how much data a disaster may cost, and RTO bounds how long recovery may take, and the two are independent measures that this project sets differently per store. B wrongly treats two distinct measurements as one. C reverses their actual definitions. D invents a scope restriction neither measurement actually has.

    **Concept Tested:** Recovery Point Objective / Recovery Time Objective

    **See:** [Recovery Objectives: How Much You Can Afford to Lose](index.md#recovery-objectives-how-much-you-can-afford-to-lose)

---

#### 10. The vault-db and meta-db PostgreSQL instances need to be restorable to any specific timestamp, not just the moment of the last nightly snapshot, in order to meet a five-minute Recovery Point Objective. What mechanism makes this possible?

<div class="upper-alpha" markdown>
1. Nightly Backup Snapshot alone, since a nightly snapshot already covers any timestamp within the day
2. Rebuilding the store from ClickHouse, the same way Neo4j's graph can be regenerated
3. The Kafka Partition Increase Caveat's over-provisioning strategy
4. Write-Ahead Log Archiving, which continuously ships the database's write-ahead log to object storage, enabling Point-in-Time Recovery by replaying the archived log forward from a base backup
</div>

??? question "Show Answer"
    The correct answer is **D**. Continuous Write-Ahead Log Archiving is what enables Point-in-Time Recovery to any specific timestamp, which is how these two irreplaceable stores reach a five-minute RPO. A is false — a nightly snapshot alone only covers the moment it was taken, not arbitrary timestamps. B misapplies Neo4j's rebuild-from-log fallback to stores that have no such fallback. C names an unrelated Kafka mechanism.

    **Concept Tested:** Write-Ahead Log Archiving / Point-In-Time Recovery

    **See:** [How Each Store Gets Backed Up](index.md#how-each-store-gets-backed-up)

---

#### 11. A new version of the LRS is being rolled out to production. Which role updates first, and why?

<div class="upper-alpha" markdown>
1. The gateway, because it is the only role whose unavailability actually loses data — if it cannot accept a statement, that statement never reaches Kafka, unlike every other role's downtime, which only delays a projection that recovers on its own
2. The processor, because it holds the most application state and should be validated earliest
3. The dashboards, because they have the lowest risk if something goes wrong
4. The summarizer, because it must run before any other role can safely process statements
</div>

??? question "Show Answer"
    The correct answer is **A**. Gateway-First Deploy Order updates the gateway first specifically because it is the one role whose downtime actually loses data, surfacing a broken version at maximum leverage before downstream roles consume what it produced. B misattributes the ordering rationale to the processor. C and D each invent an unsupported reason for a different role to go first.

    **Concept Tested:** Gateway-First Deploy Order

    **See:** [Rolling Out a Change Safely](index.md#rolling-out-a-change-safely)

---

#### 12. Why does rolling back to the previous image digest, N-1, work safely against the current schema, version N, without a corresponding "roll the schema back" step?

<div class="upper-alpha" markdown>
1. Because Kubernetes automatically reverts schema changes whenever a rollback is triggered
2. Because the previous version's image includes a complete copy of the old schema, bypassing the live database entirely
3. Because Expand Contract Migration's staged steps mean the schema was never mutated out from under the previous version — N-1 always runs correctly against the current schema, so rollback is just a redeploy
4. Because Gateway-First Deploy Order guarantees the schema is never actually applied until the gateway confirms success
</div>

??? question "Show Answer"
    The correct answer is **C**. Because schema changes ship through staged, backward-compatible steps rather than an atomic cutover, the previous application version always runs correctly against the current schema, turning rollback into a routine redeploy rather than a second incident. A invents an automatic Kubernetes capability that does not exist. B fabricates an image-embedded schema copy. D misattributes schema application timing to an unrelated deployment-ordering rule.

    **Concept Tested:** Expand-Contract Rollback

    **See:** [Rolling Out a Change Safely](index.md#rolling-out-a-change-safely)

---
