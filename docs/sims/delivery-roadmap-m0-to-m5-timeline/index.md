---
title: Delivery Roadmap Timeline
description: Sequence the six delivery milestones by duration and cumulative week number, and recall each milestone's headline deliverable and exit criterion.
status: scaffold
library: vis-timeline
bloom_level: Understand (L2)
---

# Delivery Roadmap Timeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md).

```text
Type: timeline
**sim-id:** delivery-roadmap-m0-to-m5-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/computer-science/tree/main/docs/sims/software-development-lifecycle<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, summarize

Learning objective: Sequence the six delivery milestones by duration and cumulative week number, and recall each milestone's headline deliverable and exit criterion.

Time period: Week 0 through week 26, shown as six contiguous, non-overlapping ranges rather than calendar dates.

Orientation: Horizontal, left to right, each milestone rendered as a block whose width is proportional to its duration in weeks.

Events:

- Weeks 0–3: M0 Walking Skeleton — Compose stack, image, CLI, bootstrap, gateway to Kafka to ClickHouse; exit: `make up && make smoke` passes cold
- Weeks 3–7: M1 Ingestion Complete — pseudonymization, vault, accept-first provisioning, reconciler, DLQ, replay; exit: ADL conformance suite passes
- Weeks 7–12: M2 Compression Graph Mastery — Neo4j structure, rollup views, summarizer, BKT engine, roster ingest; exit: replay reproduces mastery bit-for-bit, C-1/C-3/C-4/C-6 pass, graph lag under 90s
- Weeks 12–17: M3 Analytics Dashboards — analytics API, privacy filter, R-101/102/104/201/202/209, My Classes + Student Detail; exit: P95 under 2s for a 40-student section
- Weeks 17–22: M4 Admin Experiments — admin API/UI, RBAC, audit, experiment service and readout; exit: assignment stickiness holds, SRM check green
- Weeks 22–26: M5 Scale Production — Helm, autoscaling, managed stores, DR drill, full report catalog; exit: loadgen sustains 10k/sec, absorbs 50k burst, restore drill passes

Interactive features: Clicking any milestone block opens an infobox with its full deliverable list and exit criterion, worded exactly as in the chapter's prose. A "Cumulative week" readout above the timeline updates as the learner hovers each block, so the learner can see at a glance that M3 (dashboards) does not complete until week 17 of 26.

Visual style: Each block shaded a distinct hue along a single teal-to-amber gradient, running cooler for earlier, more foundational milestones and warmer for later, user-facing ones, so color alone hints at "infrastructure" versus "product."

Responsive design: The timeline resizes to the width of its containing element; on narrow viewports, milestone labels abbreviate to their M-number and expand on tap.
```

## Related Resources

- [Chapter 20: Spec Deviations, the Delivery Roadmap, and Open Questions](../../chapters/20-deviations-roadmap-open-questions/index.md)
