---
title: From Walking Skeleton to Scaled Production
description: Sequence the design document's delivery milestones from a walking skeleton through scaled production, and identify which milestone introduces each managed service covered in this chapter.
status: scaffold
library: vis-timeline
bloom_level: Understand (L2)
---

# From Walking Skeleton to Scaled Production



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md).

```text
Type: timeline
**sim-id:** production-delivery-roadmap<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the design document's delivery milestones from a walking skeleton through scaled production, and identify which milestone introduces each managed service covered in this chapter.

Time period: Not calendar time — six sequential delivery milestones rendered as contiguous blocks in build order.

Orientation: Horizontal, left to right, each block labeled with its milestone code and headline deliverable.

Events:

- M0 Walking skeleton: Compose stack, image, CLI, bootstrap, gateway through Kafka to ClickHouse, smoke test
- M1 Ingestion complete: pseudonymization, vault, accept-first provisioning, reconciler, Dead Letter Queue, replay
- M2 Compression plus graph plus mastery: Neo4j structure, ClickHouse rollup views, the summarizer, BKT engine — Neo4j licensing decision due here
- M3 Analytics plus first dashboards: Analytics API, privacy filter, first report set
- M4 Admin plus experiments: Admin API and UI, RBAC, audit, experiment service
- M5 Scale plus production: Helm, KEDA, managed stores (Managed Streaming Kafka, ClickHouse Cloud, Neo4j AuraDB/Enterprise, RDS Multi-AZ Postgres, ElastiCache Redis), disaster-recovery drill, full report catalog

Interactive features: Clicking a milestone block opens an infobox with its full deliverable list and exit criteria. A "Highlight this chapter's services" toggle overlays which managed services from Chapter 23 first appear at M5, and marks M2 with a small flag icon noting the Neo4j licensing decision deadline discussed in this chapter.

Visual style: M0 through M4 shaded calm teal as already-covered ground; M5 shaded amber as the milestone this chapter belongs to.

Responsive design: Resizes to its container's width; on narrow viewports labels abbreviate to milestone code and expand on tap.
```

## Related Resources

- [Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md)
