---
title: xAPI Vocabulary Matching Pairs
description: Reinforce recall of the six terms introduced in this chapter's statement-anatomy section (Actor, Verb, Object Activity, Activity Type, Result, Context) by matching each term to its one-sentence definition.
status: scaffold
library: p5.js
bloom_level: Remember (L1)
---

# xAPI Vocabulary Matching Pairs



<iframe src="main.html" width="100%" height="600"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## Specification

The full specification below is extracted from
[Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md).

```text
Type: microsim
**sim-id:** xapi-vocabulary-matching-pairs<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Remember (L1)
Bloom Taxonomy Verb: recall, identify, match

Learning objective: Reinforce recall of the six terms introduced in this chapter's statement-anatomy section (Actor, Verb, Object Activity, Activity Type, Result, Context) by matching each term to its one-sentence definition.

Canvas layout:

- Left column (six draggable term tiles): Actor, Verb, Object Activity, Activity Type, Result, Context
- Right column (six definition tiles in scrambled order)
- Bottom strip: score readout ("Matched: 0 / 6") and a "Shuffle" button

Visual elements:

- Term tiles in the book's teal accent color
- Definition tiles in a neutral cream color
- A correct match locks both tiles together with a green outline and a brief checkmark animation
- An incorrect match flashes red for half a second and the tiles bounce back to their original position

Interactive controls:

- Drag-and-drop: drag a term tile onto a definition tile to attempt a match
- Button: "Shuffle" — re-randomizes definition tile order and clears progress
- Button: "Reveal All" — shows all correct pairings for review, disabled until at least one attempt has been made

Default parameters:

- All six terms unmatched at start
- Definitions shown in random order (re-randomized via a seeded index, not JavaScript's raw Math.random, so the layout is reproducible for a given session)

Behavior:

- On correct match, increment the "Matched" counter and lock the pair
- When all six are matched, display "All matched! You know the vocabulary." and enable a small "Try Again" reset button
- Track each drag-and-drop attempt (success or failure) as an interaction event

Implementation notes:

- Use p5.js mouse-press and mouse-release events to implement drag-and-drop
- Store term/definition pairs as a simple array of objects so the same MicroSim shell can be reused for future chapters' vocabulary sets
- Responsive design: canvas width tracks the containing element's width; tile size and column layout adjust at narrow (mobile) widths by stacking columns vertically instead of side-by-side
```

## Related Resources

- [Chapter 1: From Learning Management Systems to the Experience API](../../chapters/01-lms-to-experience-api/index.md)
