---
title: "Quiz: Failure Modes and Verification"
description: Review questions on this project's twelve named failure modes, the data-loss boundary at Kafka, and the eight-layer testing strategy that verifies the failure-mode table is true.
social:
   cards: false
---
# Quiz: Failure Modes and Verification

Test your understanding of this project's failure modes and verification layers with these review questions.

---

#### 1. Why is Kafka Unavailable Failure the only failure mode in this chapter marked as a genuine data-loss path?

<div class="upper-alpha" markdown>
1. Because it is the only failure that occurs before a statement reaches durable storage — if the gateway's local buffer is exhausted during the outage, an unretried statement never reaches Kafka and nothing downstream can reconstruct it
2. Because Kafka is the most expensive component in the stack to replace
3. Because Kafka is the only component without a healthcheck
4. Because Kafka holds the PII Vault's pseudonym mappings
</div>

??? question "Show Answer"
    The correct answer is **A**. Kafka is the durability boundary — everything downstream of it can be rebuilt from the log, but a statement that never reaches Kafka in the first place has nothing to rebuild from. B invents an unrelated cost-based justification. C is false — every role in this system has a healthcheck. D confuses Kafka with the PII Vault, an entirely separate PostgreSQL instance.

    **Concept Tested:** Kafka Unavailable Failure

    **See:** [The One Rule That Organizes Every Failure Mode](index.md#the-one-rule-that-organizes-every-failure-mode)

---

#### 2. What do a ClickHouse Unavailable Failure and a Neo4j Unavailable Failure have in common?

<div class="upper-alpha" markdown>
1. Both cause the Ingestion Gateway to stop accepting new statements immediately
2. Both are marked "page" in the response column, requiring an immediate on-call response
3. Both cause data to be permanently lost once the outage exceeds five minutes
4. Both degrade a downstream read path or projection while the failure lasts, but recover automatically once the component returns, without losing any statement
</div>

??? question "Show Answer"
    The correct answer is **D**. Both sit downstream of Kafka's durability boundary, so both degrade a read path or projection during the outage and recover on their own without losing anything once the component returns. A is false — the gateway's only hard dependency is Kafka, not ClickHouse or Neo4j. B is wrong; both are ticket-level responses. C misapplies the five-minute escalation rule, which belongs to the Identity Service Unavailable failure instead.

    **Concept Tested:** ClickHouse Unavailable Failure / Neo4j Unavailable Failure

    **See:** [Failures Inside the Compression Pipeline](index.md#failures-inside-the-compression-pipeline)

---

#### 3. Why is a Summarizer Split Brain harmless, while an equivalent double-write scenario would be catastrophic if the summarizer used incrementing counters instead?

<div class="upper-alpha" markdown>
1. Because Kubernetes automatically prevents two summarizer instances from ever running at the same time
2. Because Summarizer Split Brain only occurs when Neo4j itself is unreachable
3. Because the summarizer writes absolute values computed from the untouched log via SET, so two simultaneous writers converge on the identical number regardless of how many times either runs
4. Because the summarizer retries writes exactly once before giving up
</div>

??? question "Show Answer"
    The correct answer is **C**. Writing absolute values rather than accumulating deltas means two racing writers converge on the identical number by construction, so a split brain wastes a compute cycle rather than corrupting data. A is false — split brain is exactly the scenario where two instances do briefly run at once. B misattributes the cause to an unrelated Neo4j outage. D invents a retry limit unrelated to why split brain is harmless.

    **Concept Tested:** Summarizer Stopped Failure / Summarizer Split Brain

    **See:** [Failures Inside the Compression Pipeline](index.md#failures-inside-the-compression-pipeline)

---

#### 4. What happens to mastery-dependent dashboard reads during a Redis Unavailable Failure?

<div class="upper-alpha" markdown>
1. Requests fail outright with a 503 error until Redis recovers
2. Reads fall back to querying ClickHouse directly; latency rises but no request fails and no data is lost
3. The Analytics API stops responding to any request, regardless of whether it needs mastery data
4. Cached mastery scores are permanently lost and must be recomputed from a full replay
</div>

??? question "Show Answer"
    The correct answer is **B**. When Redis is unreachable, reads simply fall back to querying ClickHouse directly, so latency rises but no request fails and no data is lost — the mildest failure mode in the chapter. A and C both overstate the impact into an outage this failure does not cause. D confuses a cache miss with a permanent data-loss scenario that this failure does not create.

    **Concept Tested:** Redis Unavailable Failure

    **See:** [Failures Inside the Compression Pipeline](index.md#failures-inside-the-compression-pipeline)

---

#### 5. A district's per-district salt has not yet been cached because the district just onboarded, and the Identity Service becomes unreachable for six minutes. What happens, according to this chapter's escalation rule?

<div class="upper-alpha" markdown>
1. Nothing changes, since cached salts always serve regardless of which district is affected
2. The new district's statements are silently dropped without any retry
3. Every district's ingestion pauses simultaneously, since salts are shared across all districts
4. The new district's ingestion pauses until the service returns, and because the outage passed the five-minute mark, the response escalates from ticket to page
</div>

??? question "Show Answer"
    The correct answer is **D**. Because this district's salt was never cached, its ingestion pauses during the outage, and because the outage crossed the five-minute threshold, the response escalates from ticket to page. A ignores that an uncached district is exactly the exception to normal cached-salt resilience. B contradicts the chapter's description of pausing rather than dropping. C overstates the impact to every district, when only uncached ones are affected.

    **Concept Tested:** Identity Service Unavailable

    **See:** [Failures at the System's Edges](index.md#failures-at-the-systems-edges)

---

#### 6. What happens when the Experiment Service Error prevents an A/B-test variant assignment from being computed?

<div class="upper-alpha" markdown>
1. The student's request fails with an error page until the experiment service recovers
2. The statement recording the student's action is discarded along with the failed assignment
3. The system falls back to serving the control arm and still records the underlying event that triggered the attempt
4. The experiment is automatically canceled and every assigned student is reverted to a prior variant
</div>

??? question "Show Answer"
    The correct answer is **C**. The system falls back to the control arm and still records the underlying learning event, so a student never sees a broken page because an experiment hiccuped. A contradicts the chapter's non-blocking design. B is wrong — the statement itself is unaffected by an assignment failure. D invents an automatic experiment-cancellation behavior not described anywhere in the chapter.

    **Concept Tested:** Experiment Service Error

    **See:** [Failures at the System's Edges](index.md#failures-at-the-systems-edges)

---

#### 7. A malformed xAPI statement repeatedly fails processing, and a naive consumer would re-read the same unprocessable message after every restart, risking an endless crash loop. How does this project's Poison Message Handling actually prevent that?

<div class="upper-alpha" markdown>
1. It permanently blocks the district that sent the malformed statement from submitting any further statements
2. After a fixed retry limit of three failed attempts, the message is routed to a dead-letter queue and the consumer moves on, leaving the rest of the stream unaffected
3. It automatically rewrites the malformed statement to make it valid before reprocessing
4. It pauses the entire Kafka topic until an operator manually intervenes
</div>

??? question "Show Answer"
    The correct answer is **B**. After three failed attempts the poison message is routed to a dead-letter queue and the consumer moves on, so the rest of the stream is unaffected by one bad message. A overstates the consequence into a full district block. C invents an auto-correction feature the chapter never describes. D contradicts the whole point of the mechanism, which is to avoid blocking the topic.

    **Concept Tested:** Poison Message Handling

    **See:** [Failures That Are Data-Quality Problems, Not Outages](index.md#failures-that-are-data-quality-problems-not-outages)

---

#### 8. How does District Queue Flood protection keep one district's traffic spike from affecting other districts?

<div class="upper-alpha" markdown>
1. It shuts down ingestion for all districts simultaneously until the flood subsides
2. It reroutes the flooding district's statements to a different Kafka cluster entirely
3. It automatically increases the partition count for the affected topic
4. Kafka's per-tenant quota mechanism throttles only the flooding district's producer, leaving every other district's statements flowing untouched
</div>

??? question "Show Answer"
    The correct answer is **D**. The same per-tenant quota mechanism ADR-004 established for noisy-neighbor protection throttles only the flooding district, leaving every other district unaffected. A wrongly extends the impact to every district. B invents a rerouting mechanism not described anywhere. C directly contradicts an earlier chapter's warning that partition count is a one-way door not casually adjusted.

    **Concept Tested:** District Queue Flood

    **See:** [Failures That Are Data-Quality Problems, Not Outages](index.md#failures-that-are-data-quality-problems-not-outages)

---

#### 9. Why does this project accept and flag a statement with a skewed timestamp rather than rejecting it outright?

<div class="upper-alpha" markdown>
1. Because ingestion is schema-on-read rather than schema-on-write, and because downstream projections are event-time-driven, a skewed clock distorts only that one district's own time-series reports rather than corrupting the whole system
2. Because timestamps are never actually used anywhere in the compression pipeline
3. Because rejecting a statement would violate the xAPI Conformance Suite's requirements outright
4. Because Clock Skew Handling automatically corrects the timestamp to match the LRS's own clock before storage
</div>

??? question "Show Answer"
    The correct answer is **A**. Consistent with schema-on-read, a skewed timestamp is accepted and flagged rather than rejected, and because downstream projections are event-time-driven, the distortion stays scoped to that one district's own reports. B is false — event timestamps drive every downstream projection. C invents a conformance requirement the chapter never states. D contradicts the chapter, which flags rather than silently corrects the value.

    **Concept Tested:** Clock Skew Handling

    **See:** [Failures That Are Data-Quality Problems, Not Outages](index.md#failures-that-are-data-quality-problems-not-outages)

---

#### 10. The Compression Test Suite needs to verify that running the summarizer twice over identical rollups produces a byte-for-byte identical graph. Which specific property of the compression pipeline does this test directly prove?

<div class="upper-alpha" markdown>
1. The ADL Conformance Test Suite's external xAPI standard requirements
2. The idempotency that Summarizer Split Brain's harmlessness depends on
3. The Load Test Loadgen's burst-absorption target
4. The Kafka Partition Increase Caveat's ordering guarantee
</div>

??? question "Show Answer"
    The correct answer is **B**. Running the summarizer twice and asserting a byte-for-byte identical result is a direct test of the idempotent-write property that makes Summarizer Split Brain harmless rather than catastrophic. A, C, and D each name a real testing or design concept from this chapter, but none is what this specific test asserts.

    **Concept Tested:** Compression Test Suite

    **See:** [Verifying the Plan Is True](index.md#verifying-the-plan-is-true)

---

#### 11. Why does the testing strategy include both a Replay Nightly Test and a Chaos Kill Test, rather than treating the nightly replay as sufficient proof the system tolerates failure?

<div class="upper-alpha" markdown>
1. Because the Replay Nightly Test only checks ClickHouse, while the Chaos Kill Test only checks Neo4j, so together they cover the whole storage plane
2. Because the Chaos Kill Test is a cheaper, faster substitute for the Replay Nightly Test that runs on every commit instead
3. Because the Replay Nightly Test proves a rebuilt projection matches the live one under normal conditions, while the Chaos Kill Test is the only layer that actually breaks a real service and checks whether the failure-mode table's claimed behavior happens under an actual failure, not just a scheduled rebuild
4. Because the two tests check identical claims, and running both is purely redundant for confidence
</div>

??? question "Show Answer"
    The correct answer is **C**. The Replay Nightly Test proves rebuildability under normal operation, while the Chaos Kill Test is the only layer that actually kills a service and verifies the failure-mode table's promises hold under a real, deliberately triggered failure — two distinct kinds of evidence. A wrongly splits their scope by database rather than by condition tested. B misstates the Chaos Kill Test's actual cadence, which is scheduled and infrequent, not per-commit. D wrongly claims redundancy between two tests that check different things.

    **Concept Tested:** Replay Nightly Test / Chaos Kill Test

    **See:** [Verifying the Plan Is True](index.md#verifying-the-plan-is-true)

---

#### 12. Why does the response column split so sharply between exactly one "page" (Kafka Unavailable Failure) and eleven "tickets," rather than distributing urgency more evenly across all twelve failure modes?

<div class="upper-alpha" markdown>
1. Because every failure mode other than Kafka Unavailable Failure occurs after a statement is already durable in Kafka, so it degrades a read path or projection that can always be recovered or rebuilt from the log, while only a Kafka outage can make a statement vanish permanently
2. Because the design specification arbitrarily assigned severity levels without a consistent underlying principle
3. Because only Kafka has a service-level agreement with an external vendor
4. Because eleven of the twelve failure modes are considered too rare to ever occur in practice
</div>

??? question "Show Answer"
    The correct answer is **A**. The one organizing rule behind the whole table is the Kafka durability boundary: everything after it is rebuildable from the log, so only a failure before that boundary can lose data outright, which is exactly why the response column concentrates urgency on that single row. B contradicts the chapter's explicit organizing principle. C invents an unrelated vendor-contract justification. D is false — several of the eleven, like ClickHouse or Redis outages, are common operational events, not rare ones.

    **Concept Tested:** Kafka Unavailable Failure (data-loss boundary synthesis)

    **See:** [The One Rule That Organizes Every Failure Mode](index.md#the-one-rule-that-organizes-every-failure-mode)

---
