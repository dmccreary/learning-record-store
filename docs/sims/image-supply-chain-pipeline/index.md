---
title: Image Supply Chain Pipeline
description: Trace a single image from a release-tag push through build, cache, provenance/SBOM generation, vulnerability scanning, and signing, and explain why a deployment must reference the resulting digest rather than a mutable tag.
status: scaffold
library: Mermaid
bloom_level: Analyze (L4)
---

# Image Supply Chain Pipeline



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md).

```text
Type: workflow
**sim-id:** image-supply-chain-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/infographics/tree/main/docs/sims/cicd-deployment-pipeline<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Trace a single image from a release-tag push through build, cache, provenance/SBOM generation, vulnerability scanning, and signing, and explain why a deployment must reference the resulting digest rather than a mutable tag.

Purpose: A left-to-right Mermaid flowchart tracing one release through the abridged workflow quoted in this chapter's prose.

Nodes in order: "Push to release tag" -> "Docker Buildx (multi-arch: amd64 + arm64)" -> "GHA Layer Cache" -> "Build image, attach Provenance Attestation + SBOM" -> "Trivy Vulnerability Scan (CRITICAL/HIGH = block)" -> two branches: "Vulnerabilities found" to a red "Release blocked, exit 1" end node; "Clean scan" onward to "Cosign Image Signing" -> "Push ghcr.io/dmccreary/lrs@sha256:... (Immutable Digest Reference)" -> "Deployment pulls by digest, never by tag".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition drawn from this chapter's prose. Clicking the Trivy node explains severity and exit-code gating. Clicking the final two nodes explains the difference between a mutable tag and an immutable digest reference.

Color coding: Build-stage nodes in the book's teal accent color, security-gate nodes (Trivy, Cosign) in amber, the blocked-release branch in red, the final deploy-by-digest node in green.

Responsive design: The flowchart stacks vertically on narrow viewports, preserving left-to-right order as top-to-bottom, with the two branch paths staying visually distinct.
```

## Related Resources

- [Chapter 17: Docker Compose, the Makefile, and the Image Supply Chain](../../chapters/17-compose-makefile-supply-chain/index.md)
