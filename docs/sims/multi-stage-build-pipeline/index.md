---
title: The Multi-Stage Build Pipeline
description: Trace which files and tools enter each of the three Dockerfile stages, and see which artifacts the Runtime stage copies forward versus what the Builder stage's tools are discarded along with.
status: scaffold
library: Mermaid
bloom_level: Understand (L2)
---

# The Multi-Stage Build Pipeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md).

```text
Type: workflow
**sim-id:** multi-stage-build-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Trace which files and tools enter each of the three Dockerfile stages, and see which artifacts the Runtime stage copies forward versus what the Builder stage's tools are discarded along with.

Purpose: One Mermaid flowchart with three stage subgraphs left to right, connected by arrows representing COPY --from instructions.

Left subgraph "Base Build Stage": "python:3.12-slim" -> "Create non-root lrs user/group (UID 10001)".

Middle subgraph "Builder Build Stage" (arrow in from Base, labeled "FROM base"): "Copy in uv binary" -> "Copy pyproject.toml + uv.lock" -> "uv sync --frozen (dependency layer)" -> "Copy src/" -> "uv sync --frozen (application layer)" -> "Populated .venv/ and src/ (uv and build cache left behind)".

Right subgraph "Runtime Build Stage" (arrows in from Base, labeled "FROM base", AND from Builder, labeled "COPY --from=builder: .venv/ and src/ ONLY"): "USER lrs" -> "EXPOSE 8080" -> "HEALTHCHECK: lrs healthcheck" -> "ENTRYPOINT [\"lrs\"]" -> "Final shippable image".

Interactive features: Every node has a Mermaid click directive opening a one-sentence infobox matching this chapter's prose. A toggle "Highlight what's left behind" dims every Builder-stage node except the two copied forward.

Color coding: Base in neutral gray, Builder in muted amber (discarded scaffolding), Runtime in the book's teal accent color (what ships).

Responsive design: Subgraphs stack vertically on narrow viewports, preserving left-to-right order as top-to-bottom.
```

## Related Resources

- [Chapter 16: The Container Image and the Role Dispatcher CLI](../../chapters/16-container-image-and-cli/index.md)
