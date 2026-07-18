---
title: Provisional Reconcile Queue Workflow
description: Operate the Provisional Reconcile Queue as a District Administrator would — reviewing a queued entry, choosing between one-click accept and manual mapping — and connect that screen-level action to the underlying promotion from provisional to reconciled that Chapter 8 already explained.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# Provisional Reconcile Queue Workflow



<iframe src="main.html" width="100%" height="642"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md).

```text
Type: workflow
**sim-id:** provisional-reconcile-queue-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: operate, resolve

Learning objective: Operate the Provisional Reconcile Queue as a District Administrator would — reviewing a queued entry, choosing between one-click accept and manual mapping — and connect that screen-level action to the underlying promotion from provisional to reconciled that Chapter 8 already explained.

Purpose: A Mermaid flowchart showing the queue's decision path for a single provisional stub, starting where Chapter 8's ingestion mechanics leave off.

Flow: "Stub appears in Provisional Reconcile Queue (provisional: true)" -> "Reconciliation Worker suggests a candidate match?" -- branches into two paths.

Path A (confident match found): "Confident candidate shown" -> "Administrator clicks 'Accept Auto-Match'" -> "Stub promoted to provisional: false; COVERS/EMBEDS/DEPENDS_ON back-filled."

Path B (no confident match): "No confident candidate" -> "Administrator opens Manual Mapping" -> "Administrator selects the correct published Textbook/TextbookVersion/MicroSim/Concept" -> "Stub promoted to provisional: false; COVERS/EMBEDS/DEPENDS_ON back-filled."

Both paths converge on: "Entry removed from queue; historical statements about this stub become richly queryable retroactively."

Interactive features: Every node has a Mermaid `click` directive. Clicking the initial stub node opens an infobox linking back to Chapter 8's Accept-First Ingestion and Provisional Node definitions. Clicking either branch condition opens an infobox explaining what "confident" means (a match by git_sha, then IRI path, then title similarity, per Chapter 8). Clicking either promotion node opens an infobox naming the three relationship types being back-filled. Clicking the final convergence node opens an infobox restating the no-data-loss guarantee from Chapter 8's ingestion mechanics.

Color coding: Path A (auto-match) in the book's teal accent color to signal the common, low-effort case; Path B (manual mapping) in amber to signal the less common case that needs administrator judgment; the shared convergence node in a neutral gray.

Responsive design: Flowchart reflows to a single vertical column on narrow viewports, keeping branch labels legible and click targets tap-sized.
```

## Related Resources

- [Chapter 25: District Administrator: Rosters, Deployments, and Registries](../../chapters/25-district-admin-rosters-deployments/index.md)
