---
title: Compose Startup Dependency Graph
description: Trace which services gate which other services at startup, and explain why the gateway's dependency list is deliberately narrower than every other application role's.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Compose Startup Dependency Graph



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md).

```text
Type: workflow
**sim-id:** compose-startup-dependency-graph<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace which services gate which other services at startup, and explain why the gateway's dependency list is deliberately narrower than every other application role's.

Purpose: A Mermaid flowchart of five backing services, the bootstrap container, and four application roles, with edges representing depends_on conditions.

Nodes and edges: redpanda, clickhouse, neo4j, redis, vault-db each feed into "bootstrap" labeled "service_healthy". "bootstrap" feeds into "identity", "processor", "summarizer" labeled "service_completed_successfully". redpanda, clickhouse, neo4j, redis also feed into those three roles labeled "service_healthy" (the lrs-depends anchor). redpanda ALONE feeds into "gateway", in a distinct color, with a callout reading "Deliberately narrow -- spec section 5.4".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition drawn from this chapter's prose. A toggle button "Highlight the narrow dependency" dims every edge except the single redpanda-to-gateway edge.

Color coding: Backing services gray-blue, bootstrap amber (gate), application roles the book's teal accent, the gateway's single redpanda edge in a distinct highlight color.

Responsive design: The graph reflows vertically (backing services top, bootstrap middle, roles bottom) on narrow viewports, preserving all click handlers.
```

## Related Resources

- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md)
