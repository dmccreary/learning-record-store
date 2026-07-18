---
title: Canonical Activity IRI Anatomy
description: Let the learner classify a candidate object.id string as canonical or malformed by clicking through three worked examples and seeing which rule each one satisfies or breaks.
status: implemented
library: p5.js
bloom_level: Understand (L2)
---

# Canonical Activity IRI Anatomy



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md).

```text
Type: infographic
**sim-id:** canonical-activity-iri-anatomy<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/activity-naming-and-occurrence-fields<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, distinguish

Learning objective: Let the learner classify a candidate object.id string as canonical or malformed by clicking through three worked examples and seeing which rule each one satisfies or breaks.

Purpose: Three clickable IRI cards: (1) canonical `https://dmccreary.github.io/learning-record-store/sims/sine-wave/`, (2) missing-slash `…/sims/sine-wave`, (3) wrong-page `…/sims/sine-wave/main.html`.

Layout: A horizontal row of three cards above a shared verdict panel, each showing the raw string with the differing segment highlighted.

Interactive features: Clicking card 1 shows "Canonical — absolute HTTPS, trailing slash present." Card 2 shows "Violates the Trailing Slash Rule — a different ORDER BY string, splitting one page's engagement into two rows." Card 3 shows "Violates the Canonical Activity IRI rule — main.html is the iframe payload, not the page; mints a second identity." A "why it matters" toggle reveals a mock two-row ClickHouse split caused by cards 2 and 3.

Color coding: Card 1 in the book's teal accent color; cards 2 and 3 in amber with the broken segment underlined in red.

Implementation: p5.js canvas adapted from the referenced template's click-to-reveal pattern, narrowed to the three cards above. Responsive: canvas width tracks its container; cards stack vertically below tablet width.
```

## Related Resources

- [Chapter 32: The Producer Contract: Writing Conformant Statements](../../chapters/32-producer-contract-conformant-statements/index.md)
