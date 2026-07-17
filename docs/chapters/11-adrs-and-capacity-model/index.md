# Architecture Decision Records and the Capacity Model

## Summary

This chapter works through all seven of the project's Architecture Decision Records — where statements live, how compression stays idempotent, why the graph isn't on the hot path — and then derives the capacity model that justifies them: statements per day, disk sizing, and request rates at the specification's 10,000 statements/second target.

## Concepts Covered

This chapter covers the following 23 concepts from the learning graph:

1. ADR Event Store Decision
2. ADR Compression Sync Decision
3. ADR Graph Not Hot Path
4. ADR Partition Key Decision
5. ADR One Image Many Roles
6. ADR BKT Mastery Decision
7. ADR Python Gateway Decision
8. Memgraph Alternative
9. Peak Sustained Ingest
10. Burst Ingest Rate
11. Mean Statement Size
12. Active Ingestion Window
13. Duty Cycle
14. Statements Per Day
15. Kafka Disk Sizing
16. ClickHouse Disk Sizing
17. HTTP Request Rate
18. Graph Write Rate Naive
19. Neo4j Structural Node Count
20. Storage Compression Ratio
21. Write-Rate Compression
22. Sync Cadence Tradeoff
23. Distinct Active Grains

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)

---

TODO: Generate Chapter Content
