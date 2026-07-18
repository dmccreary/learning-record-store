---
title: Single-Server Pilot Tier VM Layout
description: Explain how five virtual machines on one physical server separate workload roles and compliance boundaries, and identify which VM exists for a scale reason versus a compliance reason.
status: implemented
library: p5.js
bloom_level: Understand (L2)
---

# Single-Server Pilot Tier VM Layout



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md).

```text
Type: infographic
**sim-id:** single-server-pilot-vm-layout<br/>
**Library:** p5.js<br/>
**Template:** https://github.com/dmccreary/data-science-course/tree/main/docs/sims/virtual-environment-isolation-microsim<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Explain how five virtual machines on one physical server separate workload roles and compliance boundaries, and identify which VM exists for a scale reason versus a compliance reason.

Canvas layout: One outer rectangle labeled "Physical Server (32–48 cores, 128 GB RAM, 2–4 TB NVMe RAID)" containing five inner boxes sized proportional to vCPU allocation: "app" (16 vCPU/20 GB), "streaming-analytics" (8 vCPU/28 GB), "graph-cache" (6 vCPU/20 GB), "vault" (2 vCPU/4 GB), "meta-objects" (3 vCPU/6 GB).

Visual elements: Each VM box in the book's teal accent color except "vault," outlined in amber to flag it as a compliance boundary rather than a workload split. A label band along the bottom reads "Hypervisor (Proxmox / KVM / ESXi)."

Interactive controls: Clicking a VM box opens an infobox with its exact contents (e.g., "graph-cache: Neo4j Community single instance + Redis") and vCPU/RAM allocation. A "Why is vault separate?" button opens an infobox with the compliance rationale.

Default parameters: All five VMs shown at once, sized to scale against each other.

Behavior: Hovering enlarges a box and dims the others; clicking pins the infobox open until another box or "Close" is clicked.

Implementation notes: p5.js rectangles with widths proportional to vCPU count; VM metadata stored as an array of objects (name, vCPU, RAM, contents, rationale). Responsive design: canvas width tracks its container; boxes stack into two rows on narrow viewports.
```

## Related Resources

- [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md)
