---
title: Gateway-First Deploy and Rollback Order
description: Trace the deploy order and the reverse rollback order across the gateway, processors, and stateless roles, and explain why the gateway sits at both ends of the sequence.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# Gateway-First Deploy and Rollback Order



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md).

```text
Type: workflow
**sim-id:** gateway-first-deploy-rollback<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace the deploy order and the reverse rollback order across the gateway, processors, and stateless roles, and explain why the gateway sits at both ends of the sequence.

Purpose: A Mermaid flowchart with two tracks sharing the same role nodes — "Deploy order" and "Rollback order" — visiting roles in opposite sequence, to make the asymmetry visually obvious.

Deploy order track: "Gateway (first)" -> "Processors (Termination Grace Period 60s)" -> "Summarizer" -> "Stateless APIs & Dashboards (last)".

Rollback order track: "Stateless APIs & Dashboards (first)" -> "Summarizer" -> "Processors" -> "Gateway (last)".

A shared side note connects both tracks: "Expand-Contract Rollback: schema never mutated out from under a version, so adjacent versions can run against it at once."

Interactive features: Every node has a Mermaid click directive opening an infobox on that role's rollout behavior (clicking "Processors" explains the Termination Grace Period; clicking "Gateway" explains why it is the only role whose downtime loses data). Clicking the side note explains Expand-Contract Rollback. A toggle highlights one track and dims the other.

Color coding: Deploy track teal, rollback track amber with reversed arrows, both gateway nodes outlined to draw the eye to the asymmetry.

Responsive design: Tracks stack vertically on narrow viewports, preserving reading order and all click handlers.
```

## Related Resources

- [Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md)
