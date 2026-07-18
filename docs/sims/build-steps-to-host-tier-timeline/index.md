---
title: Build Steps to Development Host Tier
description: Match each of the five MVP build steps to the minimum development host tier that can prove it, and recognize that only the final step — the burst-throughput proof — requires the Recommended tier.
status: implemented
library: vis-timeline
bloom_level: Understand (L2)
---

# Build Steps to Development Host Tier



<iframe src="main.html" width="100%" height="402"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md).

```text
Type: timeline
**sim-id:** build-steps-to-host-tier-timeline<br/>
**Library:** vis-timeline<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: sequence, match

Learning objective: Match each of the five MVP build steps to the minimum development host tier that can prove it, and recognize that only the final step — the burst-throughput proof — requires the Recommended tier.

Time period: Not calendar time — five sequential build steps, rendered as five contiguous blocks in build order.

Orientation: Horizontal, left to right, each block labeled with its step number and headline task.

Events:

- Step 1: Foundation, bootstrap, infrastructure validation — host tier: Minimum; backing services only, no image needed yet
- Step 2: Ingest path (gateway to processor to ClickHouse) — host tier: Minimum; full stack, low volume
- Step 3: Load generator at the contract shape — host tier: Minimum to Recommended; 200 statements/sec baseline
- Step 4: Compression, graph, and mastery correctness — host tier: Minimum; correctness proofs hold at any volume
- Step 5: The burst-throughput proof (200 to 1,000 statements/sec) — host tier: Recommended (16 GB, local NVMe); the measurement this stack exists to produce

Interactive features: Clicking a step block opens an infobox with its full description and required tier. A "Minimum vs. Recommended" toggle recolors all five blocks to show that four of five steps fit on the smallest host and only the last needs the larger one.

Visual style: Blocks 1–4 shaded calm teal ("fits on Minimum"); block 5 shaded amber to flag its stricter requirement.

Responsive design: The timeline resizes to its container's width; on narrow viewports, labels abbreviate to step number and expand on tap.
```

## Related Resources

- [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md)
