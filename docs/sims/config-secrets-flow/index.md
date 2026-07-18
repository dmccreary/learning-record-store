---
title: Config and Secrets Flow
description: Trace a configuration value from its source (a dev .env file, or AWS Secrets Manager in production) to the running process's Settings object, and explain why the application code never needs to know which path supplied it.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Config and Secrets Flow



<iframe src="main.html" width="100%" height="602"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md).

```text
Type: workflow
**sim-id:** config-secrets-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace a configuration value from its source (a dev .env file, or AWS Secrets Manager in production) to the running process's Settings object, and explain why the application code never needs to know which path supplied it.

Purpose: A Mermaid flowchart with two parallel paths converging on one shared node, contrasting dev-time and production-time configuration sourcing.

Left path ("Dev"): ".env file (git-ignored)" -> "docker compose (x-lrs-env anchor)" -> "Container environment".

Right path ("Production"): "AWS Secrets Manager / Vault" -> "External Secrets Operator (polls and syncs)" -> "Kubernetes Secret" -> "Pod environment".

Both converge on: "Settings (Pydantic) reads and validates on boot" branching to "Process starts" or, in red, "Process crashes loudly".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition from this chapter's prose. A toggle isolates the Dev or Production path for focused reading.

Color coding: Dev path gray-blue, production path teal, the validation node amber, the crash branch red.

Responsive design: Paths stack vertically on narrow viewports; all click handlers and the convergence point are preserved.
```

## Related Resources

- [Chapter 18: Configuration, Migration, Backup, and Rollout](../../chapters/18-config-migration-backup-rollout/index.md)
