---
title: Neo4j's Production Path — Community, Enterprise, AuraDB, or an Alternative
description: Evaluate why Neo4j Community's lack of clustering forces a production choice between Enterprise, AuraDB, and an open-source alternative, and judge each option against cost and high-availability requirements.
status: implemented
library: Mermaid
bloom_level: Evaluate (L5)
---

# Neo4j's Production Path — Community, Enterprise, AuraDB, or an Alternative



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md).

```text
Type: infographic
**sim-id:** neo4j-licensing-decision-tree<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: judge, justify

Learning objective: Evaluate why Neo4j Community's lack of clustering forces a production choice between Enterprise, AuraDB, and an open-source alternative, and judge each option against cost and high-availability requirements.

Purpose: A Mermaid decision-tree flowchart starting from the single fact that forces the whole branch: Community cannot cluster.

Root node: "Does this deployment need a Causal Cluster Topology for High Availability?" -> "No (pilot/single-server tier)" leads to "Neo4j Community — free, unclustered, single point of failure, acceptable at the ~250 upserts/sec pilot scale." -> "Yes (production, multi-AZ)" leads to three sibling branches: "Neo4j Enterprise (self-managed cluster)" — labeled "Real licensing cost, full operational control"; "Neo4j AuraDB (managed cluster)" — labeled "Real licensing cost, provider manages the cluster"; "Open-source alternative engine (e.g. Memgraph)" — labeled "No per-node license, requires validating drop-in compatibility."

Interactive features: Every node has a Mermaid click directive. Clicking the root node opens an infobox on why Causal Cluster Topology requires a licensed edition. Clicking any of the three production branches opens an infobox with that option's stated trade-off, sourced from the design document's own hedge language ("quote-based," "not yet decided"). A small footer note, revealed by clicking a "Status" tag at the bottom, states plainly: "This decision is marked OPEN in the design document — no branch here is the confirmed choice."

Color coding: The unclustered/pilot branch in calm teal; the three production branches in neutral gray rather than a "winner" color, signaling that none is yet selected; the root decision diamond in amber to mark it as the pivotal open question.

Responsive design: Tree reflows to a vertical stack on narrow viewports, root node pinned at top; click targets stay tap-sized.
```

## Related Resources

- [Chapter 23: Production Infrastructure and Cloud Services](../../chapters/23-production-infrastructure-cloud/index.md)
