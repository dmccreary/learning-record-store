---
title: "Quiz: Component Design in Depth"
description: Review questions on the gateway's request path, pseudonymization mechanics, the processor's batch loop, deterministic experiment bucketing, the analytics API's cache contract, and the dashboard layer.
social:
   cards: false
---
# Quiz: Component Design in Depth

Test your understanding of this project's gateway, identity service, processor, experiment bucketing, analytics API, and dashboard internals with these review questions.

---

#### 1. What does the AuthN Token Cache hold, and what happens if Redis becomes unreachable?

<div class="upper-alpha" markdown>
1. It holds the bearer token-to-district_id mapping; the gateway falls back to a local LRU cache and keeps serving requests
2. It holds every district's per-district salt; the gateway rejects all requests until Redis recovers
3. It holds the full statement body of every request; the gateway queues requests until Redis recovers
4. It holds the Bucket To Variant Map for active experiments; the gateway serves stale bucket assignments
</div>

??? question "Show Answer"
    The correct answer is **A**. The AuthN Token Cache holds the bearer token-to-`district_id` mapping, and if Redis becomes unreachable the gateway falls back to a local LRU cache, since authentication must never become an ingestion dependency. B confuses this cache with the processor's separate per-district salt cache. C misdescribes what the cache holds. D confuses it with an unrelated experiment-bucketing structure.

    **Concept Tested:** AuthN Token Cache

    **See:** [The Gateway's Request Path](index.md#the-gateways-request-path)

---

#### 2. Why does the gateway assign a UUIDv7 rather than a random UUIDv4 to a statement that arrives without its own ID?

<div class="upper-alpha" markdown>
1. UUIDv7 is shorter and uses less storage per statement than UUIDv4
2. UUIDv7 is required by the xAPI Conformance Suite, while UUIDv4 is not
3. UUIDv7 is reversible back to the original actor identity, while UUIDv4 is not
4. UUIDv7 encodes a millisecond timestamp in its leading bits, so IDs minted close together in time sort close together in value, which rewards ClickHouse's storage engine
</div>

??? question "Show Answer"
    The correct answer is **D**. UUIDv7's leading timestamp bits mean IDs minted close together in time sort close together in value, matching the write pattern ClickHouse's storage engine rewards. A is false — both UUID versions are the same length. B invents a conformance requirement not described in this chapter. C is false; neither UUID version carries any reversible identity information at all.

    **Concept Tested:** UUIDv7 Statement ID

    **See:** [The Gateway's Request Path](index.md#the-gateways-request-path)

---

#### 3. What does Kafka Producer Acks All require before the gateway treats a statement's write as durable?

<div class="upper-alpha" markdown>
1. Acknowledgment from the partition leader only, for the fastest possible response
2. Acknowledgment from the Reconciliation Worker that the statement has been matched
3. Acknowledgment from every in-sync replica, not just the partition leader
4. Acknowledgment from the Analytics API that the statement has been indexed
</div>

??? question "Show Answer"
    The correct answer is **C**. Acks All waits for every in-sync replica to acknowledge the write, not just the leader, so a single-replica failure can never erase a statement the producer already believes is durable. A describes the faster but less safe leader-only alternative the design specification rejected. B and D each name a component with no role in Kafka's own acknowledgment mechanism.

    **Concept Tested:** Kafka Producer Acks All

    **See:** [The Gateway's Request Path](index.md#the-gateways-request-path)

---

#### 4. What secret does HMAC-SHA256 Pseudonymization use as its keyed input, and where is it stored?

<div class="upper-alpha" markdown>
1. The Per-District Salt, a secret value unique to each district, stored in the isolated PII vault PostgreSQL instance
2. A single shared salt used across all districts, stored in Redis
3. The student's own account password, stored in Keycloak
4. A rotating key generated fresh for every statement, stored nowhere
</div>

??? question "Show Answer"
    The correct answer is **A**. The keyed hash uses the Per-District Salt, unique to each district and stored in the isolated PII vault, which is exactly what makes the same learner's pseudonym unrelated across two different districts. B contradicts the per-district design, which specifically avoids one shared secret. C confuses pseudonymization with Keycloak's unrelated human-authentication role. D invents a per-statement key rotation the specification does not describe.

    **Concept Tested:** HMAC-SHA256 Pseudonymization / Per-District Salt

    **See:** [Pseudonymization at the Processing Boundary](index.md#pseudonymization-at-the-processing-boundary)

---

#### 5. Why does the stream processor compute HMAC-SHA256 Pseudonymization locally, using a salt it fetched once over a Mutual TLS Salt Fetch, rather than calling the identity service for every single statement?

<div class="upper-alpha" markdown>
1. Because the identity service does not support HTTPS
2. Because Mutual TLS is required by xAPI's core standard for all data in transit
3. Because the salt changes on every statement, making a one-time fetch impossible
4. Because a network round trip per statement, at ten thousand statements a second, would add ten thousand requests a second of pure overhead — and the processor already sees the raw identity in the statement body, so caching the salt adds no new exposure
</div>

??? question "Show Answer"
    The correct answer is **D**. A per-statement network call at ten thousand statements a second would add prohibitive overhead, and since the processor already sees the raw actor identity in the statement it just consumed, caching the salt locally adds no new exposure. A is a fabricated technical limitation. B misattributes Mutual TLS to the xAPI core standard rather than this project's own design choice. C is false — the salt is fetched once and cached in memory precisely because it does not change per statement.

    **Concept Tested:** Mutual TLS Salt Fetch

    **See:** [Pseudonymization at the Processing Boundary](index.md#pseudonymization-at-the-processing-boundary)

---

#### 6. A stream processor crashes after writing a batch of statements to ClickHouse but before committing its Kafka offset, causing the batch to be redelivered and reprocessed. The batch includes a BKT mastery update for one (student, concept) pair. What keeps this redelivery from corrupting the results?

<div class="upper-alpha" markdown>
1. The Ramping Allocation Rule prevents any bucket reassignment during a crash
2. ReplacingMergeTree Dedup, keyed on statement_id, silently absorbs the redelivered rows in ClickHouse, so the retried batch never double-counts evidence
3. The AuthN Token Cache automatically discards any request received twice within one second
4. The Gateway Backpressure Queue rejects the redelivered batch with a 503
</div>

??? question "Show Answer"
    The correct answer is **B**. ReplacingMergeTree Dedup, keyed on `statement_id`, silently absorbs redelivered rows in ClickHouse, so a retried batch never double-counts evidence. A misapplies an unrelated experiment-bucketing rule. C confuses this scenario with the gateway's authentication cache, an unrelated mechanism. D is wrong because backpressure only governs the initial produce path, not batch redelivery inside the processor.

    **Concept Tested:** ReplacingMergeTree Dedup / BKT Streaming Update

    **See:** [The Processor's Batch Loop](index.md#the-processors-batch-loop)

---

#### 7. A mobile app syncs a batch of statements three hours after the lesson ended, arriving well behind the processor's current watermark. What does the system do in response, according to this chapter's design?

<div class="upper-alpha" markdown>
1. It discards the late statements, since BKT cannot process evidence that arrives out of order
2. It silently patches the current mastery estimate in place without recomputing anything
3. The Late Arrival Detector flags the statements and enqueues a Targeted Replay Command scoped to the affected student and concept, recomputing the mastery trajectory in order from the ClickHouse log
4. It reassigns the student to a different experiment bucket to account for the delay
</div>

??? question "Show Answer"
    The correct answer is **C**. The Late Arrival Detector flags statements that fall meaningfully behind the watermark and enqueues a Targeted Replay Command scoped narrowly to that student and concept, recomputing the trajectory in order directly from the immutable log. A contradicts the system's explicit handling of late arrivals. B would produce an incorrect result, since BKT's update is order-sensitive. D confuses mastery replay with an unrelated experiment-bucketing mechanism.

    **Concept Tested:** Late Arrival Detector / Targeted Replay Command

    **See:** [The Processor's Batch Loop](index.md#the-processors-batch-loop)

---

#### 8. Why can a student's xxhash64 Bucketing result be described as "permanent without a database row ever having to say so"?

<div class="upper-alpha" markdown>
1. Because the bucket assignment is written to an immutable Neo4j node the moment a student is assigned
2. Because it is a pure function of the experiment ID and the student's key — the same two inputs always produce the same bucket number, with nothing about the calculation stored anywhere
3. Because the PII Vault stores a permanent record of every student's bucket assignment
4. Because bucket assignments are cached in Redis with no expiration
</div>

??? question "Show Answer"
    The correct answer is **B**. Because the bucket number is a pure function of the experiment ID and student key, the same two inputs always reproduce the same result, so nothing needs to be stored for the assignment to be permanent. A, C, and D each invent a storage mechanism the chapter explicitly says is unnecessary.

    **Concept Tested:** xxhash64 Bucketing

    **See:** [Deterministic Bucketing for Experiments](index.md#deterministic-bucketing-for-experiments)

---

#### 9. An experiment currently allocates 10% of students to treatment. The team wants to ramp it to 50% next month. According to the Ramping Allocation Rule, what is and is not allowed?

<div class="upper-alpha" markdown>
1. The treatment range may extend to include more buckets, but any student already inside the original treatment range must never be moved back to control
2. The treatment range may shrink back to 5% first, then grow to 50%, as long as the final state is correct
3. Every student's bucket must be recomputed from scratch each time the allocation changes
4. Only new students enrolled after the ramp may be assigned to treatment; existing students are frozen in their original variant forever
</div>

??? question "Show Answer"
    The correct answer is **A**. The Ramping Allocation Rule allows the treatment range to extend but never contract, so a student's bucket can move control to treatment but never treatment back to control. B violates the one-directional constraint the rule exists to enforce. C contradicts the whole point of xxhash64 Bucketing, which never needs recomputation. D wrongly freezes existing students who could still move from control into treatment as the range grows.

    **Concept Tested:** Ramping Allocation Rule

    **See:** [Deterministic Bucketing for Experiments](index.md#deterministic-bucketing-for-experiments)

---

#### 10. What specifically triggers a cache entry to be invalidated under this system's Data Version Invalidation approach?

<div class="upper-alpha" markdown>
1. A fixed time-to-live window that expires regardless of whether the underlying data has changed
2. A manual cache-clear command issued by a district administrator
3. The processor's own watermark advancing, the same freshness marker that drives Chapter 8's compression pipeline — not an arbitrary clock
4. The Privacy Filter Choke Point flagging a suppressed value
</div>

??? question "Show Answer"
    The correct answer is **C**. `data_version` is bumped by the processor's own watermark, so a cache entry invalidates exactly when its underlying data changes, rather than on a fixed clock. A describes the fixed-TTL approach this design specifically avoids. B invents a manual trigger not described in the chapter. D confuses cache invalidation with an unrelated privacy-filtering step.

    **Concept Tested:** Analytics Cache Key / Data Version Invalidation

    **See:** [The Analytics API's Cache Contract](index.md#the-analytics-apis-cache-contract)

---

#### 11. Why does routing every analytics response through a single Privacy Filter Choke Point, rather than re-implementing suppression logic inside each report, matter for the system's actual privacy guarantee?

<div class="upper-alpha" markdown>
1. Because it reduces the number of lines of code in each report's implementation
2. Because there is only one path out of the API at all, so no code path can accidentally skip the filter — the guarantee holds by construction rather than by every report author remembering to apply it correctly
3. Because it lets each report define its own custom suppression threshold independently
4. Because it moves the suppression check from the Analytics API to the Admin API
</div>

??? question "Show Answer"
    The correct answer is **B**. Because every response must flow through the one choke point, no code path can accidentally skip suppression — the guarantee is structural rather than dependent on every report author remembering to apply it correctly. A understates the actual safety benefit as a mere code-size reduction. C contradicts the point of a single, uniformly enforced rule. D misplaces the mechanism in an unrelated API.

    **Concept Tested:** Privacy Filter Choke Point

    **See:** [The Analytics API's Cache Contract](index.md#the-analytics-apis-cache-contract)

---

#### 12. Why does a bulk CSV export run as a Dash Background Callback on a Redis Celery Queue instead of as an ordinary synchronous callback like a chart render?

<div class="upper-alpha" markdown>
1. Because Celery is required by the xAPI Conformance Suite for any bulk data operation
2. Because the Privacy Filter Choke Point cannot process CSV output, only JSON
3. Because Redis cannot store cached chart data alongside task queue messages
4. Because exports are explicitly outside the P95 Latency Budget's two-second target, and handing the work to a separate worker process keeps a slow, legitimately long-running task from blocking the interactive request thread other users depend on
</div>

??? question "Show Answer"
    The correct answer is **D**. A bulk export can legitimately take much longer than the two-second P95 budget, so it runs as a background callback on a separate worker process, keeping the interactive request thread free for other users. A invents an unrelated conformance requirement. B is false — the choke point applies to any analytics output regardless of format. C is a fabricated technical limitation of Redis.

    **Concept Tested:** Dash Background Callback / Redis Celery Queue

    **See:** [The Dashboard Layer](index.md#the-dashboard-layer)

---
