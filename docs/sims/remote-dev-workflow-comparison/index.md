---
title: Three Ways to Develop Against a Remote Host
description: Compare Remote SSH Development, Docker Context Over SSH, and plain git-plus-SSH as three ways of developing against containers running on a rented host, and identify which piece of tooling runs locally versus remotely in each pattern.
status: implemented
library: Mermaid
bloom_level: Analyze (L4)
---

# Three Ways to Develop Against a Remote Host



<iframe src="main.html" width="100%" height="297px"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md).

```text
Type: workflow
**sim-id:** remote-dev-workflow-comparison<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: compare, differentiate

Learning objective: Compare Remote SSH Development, Docker Context Over SSH, and plain git-plus-SSH as three ways of developing against containers running on a rented host, and identify which piece of tooling runs locally versus remotely in each pattern.

Purpose: A Mermaid flowchart with three parallel branches, each starting from a shared "Laptop" node and ending at a shared "Remote Host running Docker Engine" node, so the learner sees what crosses the network in each pattern.

Branch A "Remote SSH Development": "Laptop (editor UI only)" -> "VS Code / Cursor Remote-SSH extension" -> "Files, terminal, `make up` execute on" -> "Remote Host." Tag: "Ports auto-forwarded to localhost; smoothest loop, no manual tunnel."

Branch B "Docker Context Over SSH": "Laptop (Docker CLI + GUI)" -> "`docker context use lrs-remote`" -> "Commands sent over SSH to" -> "Remote Host's Docker engine." Tag: "Containers publish ports remotely — needs a manual SSH Tunnel Port Forward for `localhost` scripts."

Branch C "Plain git + SSH": "Laptop (git commit/push)" -> "GitHub" -> "`git pull` inside an SSH session on" -> "Remote Host." Tag: "No editor integration; simplest fallback, always works."

Interactive features: Every node has a Mermaid click directive. Clicking a tag node opens an infobox with its trade-off text. Clicking the shared "Remote Host" node opens an infobox naming the UFW Firewall Rule that keeps only SSH exposed.

Color coding: Branch A teal (recommended default); Branch B amber; Branch C neutral gray; shared start/end nodes darker neutral.

Responsive design: The three branches stack vertically on narrow viewports, preserving click handlers and tag text.
```

## Related Resources

- [Chapter 21: Hardware Sizing, Cost, and the Development Environment](../../chapters/21-hardware-cost-dev-environment/index.md)
