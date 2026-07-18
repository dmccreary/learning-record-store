---
title: The Role Dispatcher Command Explorer
description: Given a deployment scenario, select the correct lrs subcommand and identify whether it is a long-running server role or a one-shot operational command.
status: implemented
library: p5.js
bloom_level: Apply (L3)
---

# The Role Dispatcher Command Explorer



<iframe src="main.html" width="100%" height="472"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md).

```text
Type: infographic
**sim-id:** role-dispatcher-command-explorer<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: select, apply

Learning objective: Given a deployment scenario, select the correct lrs subcommand and identify whether it is a long-running server role or a one-shot operational command.

Canvas layout: Left column, a scrollable list of nine role/command tiles (bootstrap, identity, analytics-api, admin-api, dashboards, seed, loadgen, replay, healthcheck) in monospace. Right panel, a detail card populated on click, showing the full example command, its exposed port ("no port -- exits when done" for one-shot commands), and a one-sentence description matching this chapter's prose. Top strip: "Server roles" / "Operational commands" / "Show all" filter buttons.

Visual elements: Server-role tiles show a looping-arrow icon and a teal left border; operational-command tiles show a checkmark icon and an amber left border. The selected tile has a highlighted outline; its detail card slides in from the right.

Interactive controls: Click a tile to populate the detail panel. Filter buttons highlight one category and dim the rest. A scenario search box (e.g. typing "recover the graph") highlights the best-matching tile (replay) via keyword tags stored per tile.

Behavior: The search box performs a keyword match against each tile's tags (e.g. healthcheck tagged "liveness," "is it healthy"; replay tagged "recover," "rebuild," "fix bad data") and highlights the closest match, giving the learner a self-check on scenario-to-command mapping.

Color coding: Teal left border for server roles, amber for operational commands, matching the build-versus-run color logic used earlier in this chapter.

Responsive design: The two-column layout collapses to a single stacked column on narrow viewports, the detail card appearing below the selected tile.
```

## Related Resources

- [Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md)
