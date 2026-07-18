---
title: Vault Network Isolation in the Compose Topology
description: Explain why the vault database is reachable only by the identity service on an isolated network, and identify which services can and cannot see a real learner identity.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Vault Network Isolation in the Compose Topology



<iframe src="main.html" width="100%" height="522"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md).

```text
Type: workflow
**sim-id:** vault-net-isolation-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: explain, justify

Learning objective: Explain why the vault database is reachable only by the identity service on an isolated network, and identify which services can and cannot see a real learner identity.

Purpose: A Mermaid flowchart with two subgraphs on one canvas, showing which services sit on the general application network versus the isolated vault network.

Left/general subgraph "Application Network": nodes "Gateway", "Stream Processor", "Summarizer", "Graph Store (Neo4j)", "Analytics Store (ClickHouse)" — connected only as the real data flow requires (Gateway -> Processor -> Analytics Store; Processor -> Graph Store via structural stub only; Summarizer -> Graph Store).

Right/isolated subgraph "vault-net (no published host port)": nodes "Identity Service" and "Vault Database", connected only to each other.

One crossing edge: "Stream Processor" -> "Identity Service" labeled "resolves salted key only — never the raw mapping."

Interactive features: Every node has a Mermaid click directive. "Vault Database" opens an infobox on why this is the only place the identity-to-key mapping exists. Any Application Network node opens an infobox confirming "sees only the derived student_key." The crossing edge opens an infobox recapping Chapter 6's HMAC derivation in one sentence.

Color coding: Application Network in the book's teal accent color; vault-net outlined in amber with a padlock icon, matching Chapter 21's visual language for compliance boundaries.

Responsive design: Subgraphs stack vertically on narrow viewports with the crossing edge redrawn to remain visible; click targets stay tap-sized.
```

## Related Resources

- [Chapter 22: Proving the Architecture - the MVP Plan](../../chapters/22-proving-the-architecture-mvp/index.md)
