---
title: Recovery Point and Recovery Time by Data Store
description: Compare Recovery Point Objective and Recovery Time Objective across ClickHouse, Neo4j, vault-db, and meta-db, and judge which store's backup strategy the whole system depends on most.
status: scaffold
library: Chart.js
bloom_level: Evaluate (L5)
---

# Recovery Point and Recovery Time by Data Store



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md).

```text
Type: chart
**sim-id:** rpo-rto-by-data-store<br/>
**Library:** Chart.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: compare, justify

Learning objective: Compare Recovery Point Objective and Recovery Time Objective across ClickHouse, Neo4j, vault-db, and meta-db, and judge which store's backup strategy the whole system depends on most.

Chart type: Grouped horizontal bar chart, logarithmic x-axis in minutes.

Purpose: Show that vault-db and meta-db have the tightest RPO despite Neo4j having the loosest, connecting that gap to which stores are rebuildable versus irreplaceable.

Y-axis (categories): ClickHouse, Neo4j, vault-db, meta-db.

Data series:
1. RPO (minutes), teal bars: ClickHouse 60, Neo4j 1440, vault-db 5, meta-db 5.
2. RTO (minutes), amber bars: ClickHouse 240, Neo4j 60, vault-db 60, meta-db 60.

Interactive features: Hovering a bar shows an exact tooltip ("vault-db RPO: 5 minutes — continuous WAL archiving"). Clicking a store's label opens an infobox explaining why its numbers look that way (e.g., Neo4j's loose RPO because it is rebuildable from the log). A checkbox filters to irreplaceable stores only (vault-db, meta-db).

Color scheme: Teal for RPO bars, amber for RTO bars; vault-db and meta-db rows get a red left-border flagging them as unrecoverable-if-lost.

Annotations: A callout near vault-db reading "The one true worst case."

Responsive design: Chart resizes to container width; series stack per category and the legend moves below the chart on narrow viewports.
```

## Related Resources

- [Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md)
