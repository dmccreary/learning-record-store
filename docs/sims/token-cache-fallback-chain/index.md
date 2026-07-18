---
title: The Token Cache's Fallback Chain
description: Explain how a gateway's token-to-district lookup degrades from a shared Redis cache to a local LRU fallback as Cache TTL Expiry and Redis availability change, without ever blocking ingestion.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# The Token Cache's Fallback Chain



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md).

```text
Type: workflow
**sim-id:** token-cache-fallback-chain<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Explain how a gateway's token-to-district lookup degrades from a shared Redis cache to a local LRU fallback as Cache TTL Expiry and Redis availability change, without ever blocking ingestion.

Purpose: A Mermaid flowchart tracing one incoming request's token lookup through every possible path.

Flow: "Gateway receives request with bearer token" -> "Check ElastiCache Redis for cached district mapping" -> two branches.

Branch A "Redis reachable, entry present and fresh (within 60s TTL)": -> "Return cached district_id" -> "Proceed to Tier-1 validation."

Branch B "Redis reachable, entry expired (Cache TTL Expiry passed)": -> "Re-fetch mapping from the identity service" -> "Re-populate Redis with a fresh 60s TTL" -> "Proceed to Tier-1 validation."

Branch C "Redis unreachable": -> "Fall back to the gateway pod's local LRU Fallback Cache" -> "Serve from local cache if present, else re-fetch from identity service directly" -> "Proceed to Tier-1 validation" with an annotation "Ingestion never blocks on cache health."

Interactive features: Every node has a Mermaid click directive. Clicking a TTL-related node opens an infobox defining Cache TTL Expiry with the 60-second default. Clicking the LRU node opens an infobox defining LRU Fallback Cache and why it is smaller and pod-local rather than shared. Clicking the final "Proceed to Tier-1 validation" node in any branch opens an infobox noting all three branches converge on the same non-blocking outcome.

Color coding: The healthy Redis path in teal; the fallback path in amber to flag it as the degraded-but-safe branch, not a failure state.

Responsive design: Branches stack vertically on narrow viewports; click targets stay tap-sized.
```

## Related Resources

- [Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md)
