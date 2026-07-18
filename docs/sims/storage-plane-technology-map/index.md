---
title: The Storage Plane, Which Technology Holds What
description: Let the learner classify each storage-plane technology — ClickHouse, Neo4j 5 Community, PostgreSQL 16 (×2), Redis 7, MinIO, and Amazon S3 — by the specific kind of data it is responsible for, differentiating the event store from the graph from the two isolated PostgreSQL instances.
status: scaffold
library: vis-network
bloom_level: Analyze (L4)
---

# The Storage Plane, Which Technology Holds What



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md).

```text
Type: graph-model
**sim-id:** storage-plane-technology-map<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, differentiate

Learning objective: Let the learner classify each storage-plane technology — ClickHouse, Neo4j 5 Community, PostgreSQL 16 (×2), Redis 7, MinIO, and Amazon S3 — by the specific kind of data it is responsible for, differentiating the event store from the graph from the two isolated PostgreSQL instances.

Purpose: Show a vis-network graph with six technology nodes, each connected to a short label describing what it holds, colored by whether the technology is a system of record, a cache, or an object store.

Nodes: "ClickHouse — system of record for every statement, at full fidelity" (system of record). "Neo4j 5 Community — structure and compressed summary vertices only, never raw events" (system of record). "PostgreSQL 16 — vault-db, PII vault, reachable only from the identity service" (system of record, isolated). "PostgreSQL 16 — meta-db, admin config, RBAC, audit log, experiment definitions" (system of record, isolated). "Redis 7 — token cache, salt cache, analytics response cache, rate limits" (cache). "MinIO (dev) / Amazon S3 (prod) — bulk exports, archival, event-store cold tier" (object store).

Interactive features: Clicking any node opens an infobox with that technology's one-sentence definition from this chapter's prose and the specific data it holds. A toggle labeled "Group by role" clusters the six nodes into three groups — system of record, cache, object store — instead of a flat list, letting the learner see that the two PostgreSQL 16 instances share a role cluster while remaining visually separate nodes, because they are isolated at the network level.

Color coding: System-of-record nodes in the book's teal accent color; the cache node in a lighter tint of the same hue; the object-store node in a neutral gray, consistent with Chapter 7's storage-plane color language.

Responsive design: Graph layout recalculates via vis-network's physics engine on window resize; below tablet width, nodes stack into a scrollable single column grouped by role.
```

## Related Resources

- [Chapter 10: Choosing the Technology Stack](../../chapters/10-choosing-technology-stack/index.md)
