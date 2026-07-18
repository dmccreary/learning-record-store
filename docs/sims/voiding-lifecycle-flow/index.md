---
title: Voiding Lifecycle Flow
description: Let the learner trace the full lifecycle of a mistaken Statement from emission through correction, and see concretely why immutability and voiding are two halves of one mechanism rather than opposing rules.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# Voiding Lifecycle Flow



<iframe src="main.html" width="100%" height="662"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md).

```text
Type: workflow
**sim-id:** voiding-lifecycle-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/voiding-lifecycle-flow<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, sequence

Learning objective: Let the learner trace the full lifecycle of a mistaken Statement from emission through correction, and see concretely why immutability and voiding are two halves of one mechanism rather than opposing rules.

Purpose: Show an eight-step Mermaid flowchart tracing a Statement's lifecycle when an error is discovered after the fact.

Steps:

1. "Learning Record Provider emits Statement A" — Maya's quiz Statement, score 9/10, Statement ID abc-123
2. "Learning Record Store stores Statement A" — accepted, immutable from this point forward
3. "Error discovered" — grading script bug found, correct score is 6/10
4. "Provider emits Statement B: voided" — Verb is `voided`, Object is a StatementRef pointing to abc-123
5. "LRS stores Statement B" — Statement A is never deleted or edited; both now exist
6. "LRS flags Statement A as voided" — internal bookkeeping, not a mutation of A's fields
7. "Provider emits Statement C" — a new, independent Statement with the corrected score of 6/10 and a new Statement ID
8. "Default queries now return only Statement C" — Statement A remains in the log for audit purposes but is excluded from normal result sets

Interactive features: Every node in the Mermaid flowchart has a `click` directive. Clicking any node opens an infobox with a one-sentence explanation of that step, and clicking nodes 1, 4, and 7 additionally shows the relevant Statement's Actor/Verb/Object in miniature.

Color coding: Steps 1-2 (original Statement) in the book's teal accent color; steps 3-6 (the voiding action) in amber to signal "correction in progress"; steps 7-8 (the new, correct record) in green to signal "resolved."

Implementation: Mermaid flowchart, top-to-bottom orientation, with full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md)
