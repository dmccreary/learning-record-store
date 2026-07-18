---
title: ClickHouse `lrs.statements` Table Anatomy
description: Let the learner click through each column group of the lrs.statements table and explain why the ORDER BY key leads with district_id and student_key rather than timestamp alone.
status: implemented
library: p5.js
bloom_level: Analyze (L4)
---

# ClickHouse `lrs.statements` Table Anatomy



<iframe src="main.html" width="100%" height="562"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md).

```text
Type: infographic
**sim-id:** clickhouse-statements-anatomy<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, justify

Learning objective: Let the learner click through each column group of the lrs.statements table and explain why the ORDER BY key leads with district_id and student_key rather than timestamp alone.

Canvas layout:

- A vertical table diagram listing all eighteen columns in DDL order, grouped visually into four bands: "Identity & Tenancy" (district_id, statement_id, student_key), "Statement Content" (verb_id, object_type, object_id, textbook_id, version_id, section_id, concept_ids, result_score, result_success, duration_ms), "Lifecycle Flags" (voided_by, provisional), and "Timing & Raw Payload" (timestamp, stored_at, raw)
- A highlighted sidebar showing the ORDER BY tuple as four connected boxes: district_id -> student_key -> timestamp -> statement_id, with an arrow showing "prune, then sort" order

Interactive controls:

- Clicking any column name opens an infobox with its type, a one-sentence purpose, and whether it participates in the ORDER BY key
- A button "Highlight ORDER BY key" dims every column not in the primary key and traces the four-box sidebar sequence
- A button "Highlight compression" isolates the LowCardinality and ZSTD-coded columns and shows a small annotation explaining what each does to storage size

Behavior: Default view shows all four bands at equal visual weight; clicking either highlight button re-renders with the relevant columns emphasized and the rest at reduced opacity.

Color coding: The four column bands each get a distinct muted hue; the ORDER BY sidebar and any column inside it render in the book's teal accent color regardless of which band it belongs to, so the primary key reads as one visual thread through the whole table.

Responsive design: Column bands stack in a single vertical scrolling list on narrow viewports; the ORDER BY sidebar collapses to a horizontal strip above the column list rather than sitting beside it.
```

## Related Resources

- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../../chapters/14-kafka-clickhouse-graph-schema/index.md)
