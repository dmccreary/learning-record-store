---
title: Materialized Views to Summary Vertex Mapping
description: Let the learner trace raw rows in lrs.statements through each of the three materialized views to the specific Neo4j summary vertex label each view feeds, and differentiate the aggregation grain of each path.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Materialized Views to Summary Vertex Mapping



<iframe src="main.html" width="100%" height="482"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md).

```text
Type: workflow
**sim-id:** mv-to-vertex-mapping<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace raw rows in lrs.statements through each of the three materialized views to the specific Neo4j summary vertex label each view feeds, and differentiate the aggregation grain of each path.

Purpose: Show a Mermaid flowchart with one source node fanning out into three parallel aggregation paths that reconverge conceptually at "Summarizer" before terminating in three distinct vertex labels.

Nodes: "lrs.statements (one row per statement)" fans out to three parallel nodes: "mv_section_concept_daily (AggregatingMergeTree, grain: section+concept+day)", "mv_student_concept_rollup (AggregatingMergeTree, grain: student+concept)", "mv_student_page_rollup (AggregatingMergeTree, grain: student+page)". Each feeds into "Summarizer reads changed rows via last_seen watermark" which fans back out to three terminal nodes: "SectionRollup vertex", "ConceptMastery vertex", "PageEngagement vertex".

Interactive features: Every node has a Mermaid click directive opening an infobox with that view's ORDER BY key and the specific aggregate columns it computes. A toggle labeled "Show grain size" annotates each of the three paths with an approximate compression ratio (for example, "~600K statements to ~150K grains") drawn from the chapter's own worked numbers.

Color coding: The three parallel paths render in three distinguishable tints of the book's teal accent color so the learner can visually keep each path separate from source to terminal vertex; the shared "lrs.statements" source and "Summarizer" nodes render in neutral gray to mark them as convergence points.

Responsive design: The three parallel paths stack vertically rather than side-by-side on narrow viewports, each still reading left-to-right from source to vertex.
```

## Related Resources

- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md)
