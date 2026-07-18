---
title: Anatomy of an Extended Statement
description: Let the learner classify each of the four optional Statement pieces (Sub-Statement, Attachment, Extensions, Registration) by clicking on it and seeing what problem it solves, reinforcing the JSON example above with a visual, exploratory layout.
status: implemented
library: p5.js
bloom_level: Understand (L2)
---

# Anatomy of an Extended Statement



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md).

```text
Type: infographic
**sim-id:** extended-statement-anatomy<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/xapi-statement-builder<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: classify, differentiate

Learning objective: Let the learner classify each of the four optional Statement pieces (Sub-Statement, Attachment, Extensions, Registration) by clicking on it and seeing what problem it solves, reinforcing the JSON example above with a visual, exploratory layout.

Layout: A central "core Statement" box (Actor/Verb/Object, dimmed to signal "already learned in Chapter 1") surrounded by four labeled satellite boxes: "Sub-Statement" (attached to the Object), "Attachment" (attached to the Statement as a whole), "Extensions" (attached to Context or Result), and "Registration" (attached to Context).

Data Visibility Requirements:
Stage 1: Show the dimmed core Statement (Actor, Verb, Object) with a caption "You already know this part."
Stage 2: On click of "Sub-Statement," highlight the connection to Object and show the nested Actor-Verb-Object nesting from the worked example (Ms. Alvarez recommended Maya's practice).
Stage 3: On click of "Attachment," show the SHA-2 hash reference and contentType from the worked example, with a note that the actual file bytes travel separately.
Stage 4: On click of "Extensions," show the `hintsUsed` key-value example and emphasize the IRI-as-key pattern that prevents naming collisions.
Stage 5: On click of "Registration," show two example Statements sharing one registration UUID versus two Statements with different UUIDs, to make the grouping concrete.

Interactive features: Each of the four satellite boxes is clickable, revealing its Stage content in a side panel without navigating away from the diagram. A "Reset" button collapses all panels back to Stage 1.

Instructional Rationale: A click-to-reveal exploratory layout is appropriate for this Understand-level, classify/differentiate objective because the four pieces are independent of one another — a linear step-through would falsely imply an order or dependency between them that the specification does not require.

Implementation: p5.js canvas with clickable regions, following the interaction pattern of the referenced template MicroSim.
```

## Related Resources

- [Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md)
