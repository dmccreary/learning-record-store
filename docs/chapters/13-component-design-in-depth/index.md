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

TODO: Generate Chapter Content
