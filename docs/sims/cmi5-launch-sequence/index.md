---
title: cmi5 Launch Sequence
description: Let the learner apply their understanding of the cmi5 Launch Method by tracing a full launch sequence from LMS assignment through the Assignable Unit's xAPI Statements, predicting which Launch Method parameter enables each step.
status: implemented
library: Mermaid
bloom_level: Apply (L3)
---

# cmi5 Launch Sequence



<iframe src="main.html" width="100%" height="662"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md).

```text
Type: workflow
**sim-id:** cmi5-launch-sequence<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: demonstrate, trace

Learning objective: Let the learner apply their understanding of the cmi5 Launch Method by tracing a full launch sequence from LMS assignment through the Assignable Unit's xAPI Statements, predicting which Launch Method parameter enables each step.

Purpose: Show an eight-step, top-to-bottom Mermaid flowchart tracing one learner's complete cmi5 session.

Steps:

1. "LMS assigns the AU to a learner" — the LMS knows which Assignable Unit and which learner
2. "LMS launches the AU URL" — query parameters attached: `endpoint`, `fetch`, `actor`, `registration`
3. "AU calls the fetch URL" — exchanges the short-lived reference for an authorization token
4. "AU sends an 'initialized' Statement" — first Statement of the session, tagged with the launch's Registration
5. "Learner interacts with the AU" — a stream of Statements using domain Verbs (for example, "experienced," "answered")
6. "AU sends a 'completed' or 'passed'/'failed' Statement" — the outcome of this attempt
7. "AU sends a 'terminated' Statement" — signals the session has ended
8. "LMS queries the LRS" — using the `agent` and `registration` Statement Query Parameters from Chapter 2 to display the learner's current status

Interactive features: Every node has a Mermaid `click` directive. Clicking steps 1-2 opens an infobox listing each Launch Method query parameter and what it supplies. Clicking steps 4, 6, and 7 opens an infobox showing that Statement's Actor/Verb/Object in miniature, reusing the visual pattern from Chapter 1's statement-anatomy diagram. Clicking step 8 opens an infobox explaining how the Registration groups every Statement from one launch into a single queryable attempt.

Color coding: Launch and authorization steps (1-3) in amber; the session's own Statements (4-7) in the book's teal accent color; the LMS's read-back (step 8) in green.

Implementation: Mermaid flowchart, top-to-bottom orientation, full click-to-infobox coverage on every node. Responsive width tracking the containing element.
```

## Related Resources

- [Chapter 3: IEEE Standardization of xAPI and cmi5](../../chapters/03-ieee-standardization-xapi-cmi5/index.md)
