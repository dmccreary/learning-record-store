---
title: District-Keyed versus Composite-Keyed Partitioning
description: Compare a Kafka queue partitioned by `district_id` alone against one keyed by `{district_id}:{student_key}`, and explain why the composite key avoids a write hotspot while still preserving the per-learner ordering that Bayesian Knowledge Tracing requires.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# District-Keyed versus Composite-Keyed Partitioning



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md).

```text
Type: workflow
**sim-id:** district-vs-composite-partition-key<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Compare a Kafka queue partitioned by `district_id` alone against one keyed by `{district_id}:{student_key}`, and explain why the composite key avoids a write hotspot while still preserving the per-learner ordering that Bayesian Knowledge Tracing requires.

Purpose: Show two side-by-side Mermaid subgraphs, mirroring the "Before/After" pattern from Chapter 1's LMS-versus-LRS diagram, so the learner can directly compare partition placement under each keying scheme.

Left subgraph "district_id only (spec as written)": one box "Large District (40,000 students)" with arrows from five sample students all converging on a single box "Partition 0"; a second, smaller box "Small District (200 students)" with an arrow to "Partition 1." Annotate Partition 0 with a warning tag "Hotspot."

Right subgraph "{district_id}:{student_key} (design as built)": the same ten sample students, now fanned out across four partition boxes ("Partition 0" through "Partition 3") by a hash of the composite key, with the large district's students spread evenly across all four and the small district's students spread across two. Annotate with a tag "Load balanced; quota still caps the large district's total rate."

Interactive features: Every node has a Mermaid click directive. Clicking a partition box opens an infobox naming which failure this arrangement would trigger if unmitigated (referencing District Queue Flood from Chapter 19). Clicking a student node opens an infobox stating that all of that student's own statements always land on the same partition in both schemes, which is what preserves BKT's required per-learner ordering. Clicking the "Hotspot" tag explains that this is the exact condition the specification's scale-and-availability targets forbid.

Color coding: The hotspot partition shaded warning amber; the load-balanced partitions shaded the book's calm teal.

Responsive design: Both subgraphs stack vertically on narrow viewports, preserving all click handlers and the hotspot annotation.
```

## Related Resources

- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md)
