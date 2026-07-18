---
title: DAG Viewer
description: DAG Viewer
status: implemented
library: vis-network
bloom_level: TBD
---

# DAG Viewer



<iframe src="main.html" width="100%" height="522"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md).

```text
Type: graph-model
**sim-id:** dag-viewer<br/>
**Library:** vis-network<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/graph-algorithms/sims/dag-viewer/main.html<br/>
**Source Repo:** https://github.com/dmccreary/graph-algorithms/tree/main/docs/sims/dag-viewer

Reused from the MicroSim catalog (WHAT match score 0.7818). Learning objective: Let the learner explore a hierarchical, left-to-right rendering of a concept dependency graph built from `DEPENDS_ON` edges, and see how nodes with no outgoing edges sit at the foundation of the graph while nodes with many outgoing edges depend on several prerequisites at once — directly illustrating the Learning Graph DAG structure this project's Concept nodes form.
```

## Related Resources

- [Chapter 7: The Property Graph Data Model](../../chapters/07-property-graph-data-model/index.md)
