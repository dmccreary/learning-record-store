# Kafka Topics, ClickHouse Schema, and Graph Constraints

## Summary

This chapter documents the physical schema in detail: the six named Kafka topics and their retention policies, the ClickHouse tables and materialized views that compress statements, and the Neo4j constraints that make per-statement vertices structurally impossible.

## Concepts Covered

This chapter covers the following 22 concepts from the learning graph:

1. Raw Statements Topic
2. Bulk Statements Topic
3. Dead Letter Topic
4. Reconcile Task Topic
5. Mastery State Topic
6. Audit Feed Topic
7. Lrs Statements Table
8. Lrs Concept Mastery Table
9. Section Concept Daily MV
10. Student Concept Rollup MV
11. Student Page Rollup MV
12. ReplacingMergeTree Engine
13. AggregatingMergeTree Engine
14. LowCardinality Type
15. ZSTD Compression Codec
16. Partition By Month
17. Grain Uniqueness Constraint
18. Statement Label Prohibition
19. Concept DAG Acyclicity Check
20. Vault-Db Instance
21. Meta-Db Instance
22. Network Credential Boundary

## Prerequisites

This chapter builds on concepts from:

- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)

---

TODO: Generate Chapter Content
