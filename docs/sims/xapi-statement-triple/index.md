---
title: xAPI Statement Building Blocks
description: Give the learner a first, plain-language mental model of the five Statement components (Actor, Verb, Object Activity, Result, Context) using one worked example, before Chapter 2 formalizes the JSON structure.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# xAPI Statement Building Blocks



<iframe src="main.html" width="100%" height="382"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md).

```text
Type: infographic
**sim-id:** xapi-statement-triple<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://dmccreary.github.io/xapi-course/sims/xapi-statement-triple/<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: exemplify, classify

Learning objective: Give the learner a first, plain-language mental model of the five Statement components (Actor, Verb, Object Activity, Result, Context) using one worked example, before Chapter 2 formalizes the JSON structure.

Purpose: Show a single example Statement broken into its labeled parts, so the reader can see the vocabulary just introduced in the prose applied to one concrete sentence.

Layout: A horizontal sentence strip reading "Maya | completed | the Photosynthesis Quiz" with the words "Actor", "Verb", "Object Activity" as labels beneath each phrase, plus two additional connected boxes below labeled "Result: scored 9/10" and "Context: Biology 101, Section 2".

Data Visibility Requirements:
Stage 1: Show the plain English sentence "Maya completed the Photosynthesis Quiz, scoring 9 out of 10, in Biology 101."
Stage 2: Highlight and label "Maya" as Actor.
Stage 3: Highlight and label "completed" as Verb.
Stage 4: Highlight and label "the Photosynthesis Quiz" as Object Activity, with its Activity Type ("quiz") shown as a small sub-tag.
Stage 5: Reveal the Result box: "scored 9/10."
Stage 6: Reveal the Context box: "Biology 101, Section 2."

Interactive features: Each of the five labeled parts (Actor, Verb, Object Activity, Result, Context) is clickable. Clicking opens an infobox with that term's one-sentence definition, matching the definition given in this chapter's prose, plus the note "Required" or "Optional."

Instructional Rationale: A step-through, data-visible worked example is appropriate for this Understand-level objective because the learner needs to trace one concrete Statement piece by piece before generalizing. Continuous animation or particle effects would obscure exactly which words map to which component.

Implementation: Mermaid diagram (or equivalent static-layout HTML/CSS) with click handlers wired to an infobox panel, matching the reused template's existing interaction pattern.
```

## Related Resources

- [Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md)
