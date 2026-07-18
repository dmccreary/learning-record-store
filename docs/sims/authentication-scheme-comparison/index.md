---
title: Authentication Scheme Comparison
description: Let the learner evaluate which authentication scheme fits a given Learning Record Provider scenario, justifying the choice against criteria introduced in the prose above.
status: implemented
library: p5.js
bloom_level: Evaluate (L5)
---

# Authentication Scheme Comparison



<iframe src="main.html" width="100%" height="462"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md).

```text
Type: infographic
**sim-id:** authentication-scheme-comparison<br/>
**Library:** p5.js<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/xapi-course/tree/main/docs/sims/authentication-scheme-comparison<br/>

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: assess, justify

Learning objective: Let the learner evaluate which authentication scheme fits a given Learning Record Provider scenario, justifying the choice against criteria introduced in the prose above.

Purpose: Adapt the referenced template (which compares three schemes) to compare only the two this chapter covers — Basic Authentication and OAuth Authentication — across the criteria that matter for an intelligent-textbook deployment.

Criteria (columns):

- Credential exposure per request
- Implementation effort
- Revocation (can access be cut off without changing the underlying password?)
- Best-fit Learning Record Provider type

Rows: Basic Authentication, OAuth Authentication

Interactive features: Clicking a cell opens an infobox with a one-sentence justification tied back to the chapter's worked examples (server-side ingestion gateway for Basic; browser-based MicroSim for OAuth). A toggle lets the learner select a scenario ("server-side textbook publisher" or "browser-based MicroSim") and highlights the recommended scheme's row.

Instructional Rationale: An Evaluate-level objective calls for a tool that supports judgment against explicit criteria rather than passive viewing — the scenario toggle asks the learner to apply the criteria themselves before the tool confirms the recommendation.

Implementation: p5.js canvas adapted from the template's three-scheme comparison down to two schemes, with an added scenario-toggle interaction not present in the original.
```

## Related Resources

- [Chapter 2: The Anatomy of an xAPI Statement](../../chapters/02-anatomy-of-xapi-statement/index.md)
