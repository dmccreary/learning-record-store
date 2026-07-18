---
title: One Statement, Three Ways to Touch the Record
description: Let the learner distinguish the Statement Storage Function, the Statement Retrieval Function, and the Voiding Function as three separate operations against one shared Event Store, and trace how a voided statement is retracted without ever being deleted.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# One Statement, Three Ways to Touch the Record



<iframe src="main.html" width="100%" height="277px"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md).

```text
Type: workflow
**sim-id:** statement-storage-retrieval-voiding-flow<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/ai-strategy-for-education/tree/main/docs/sims/xapi-statement-anatomy<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: distinguish, trace

Learning objective: Let the learner distinguish the Statement Storage Function, the Statement Retrieval Function, and the Voiding Function as three separate operations against one shared Event Store, and trace how a voided statement is retracted without ever being deleted.

Purpose: Show a single Mermaid flowchart with the Event Store as a central node and three labeled operations arranged around it, each drawn as its own path rather than a strict left-to-right chain.

Nodes: "Event Store (immutable log)" as the central node. Path A: "POST /xapi/statements" leads to "Statement Storage Function (F-1): new row appended". Path B: "GET /xapi/statements?actor=...&verb=...&since=..." leads to "Statement Retrieval Function (F-2): matching rows returned, none modified". Path C: "A later statement with Verb: voided, Object: {statementId}" leads to "Voiding Function (F-3): original row's voided_by field set" leads to "Row still exists; excluded from future rollups and default retrieval".

Interactive features: Every node has a Mermaid click directive. Clicking "Event Store" opens an infobox recalling its definition from Chapter 5. Clicking any Storage, Retrieval, or Voiding node opens an infobox with that function's one-sentence definition from this chapter's prose, plus its F-number. Clicking the final "excluded from future rollups" node opens an infobox naming the voided_by property and linking back to Chapter 8's compression rollups.

Color coding: Path A (storage) in the book's teal accent color; Path B (retrieval) in a neutral gray-blue; Path C (voiding) in a contrasting amber to visually flag it as a correction path rather than a normal read/write path.

Responsive design: Flowchart resizes to the width of its containing element; on narrow viewports the three paths stack vertically instead of radiating from the center.
```

## Related Resources

- [Chapter 9: The Twelve Core LRS Functions](../../chapters/09-twelve-core-lrs-functions/index.md)
