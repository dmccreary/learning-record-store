---
title: xAPI Statement Building Blocks
description: Give the learner a first, plain-language mental model of the five Statement components (Actor, Verb, Object Activity, Result, Context) using one worked example, before Chapter 2 formalizes the JSON structure.
status: implemented
library: Mermaid
bloom_level: Understand (L2)
---

# xAPI Statement Building Blocks



<iframe src="main.html" width="100%" height="790"></iframe>

[Run MicroSim in Fullscreen](main.html){ .md-button .md-button--primary }

## This Diagram Emits the Thing It Describes

The diagram breaks one example Statement into its five parts. Clicking a part emits a
**real** xAPI Statement, and that Statement has the same five parts. The panel under the
diagram shows it. Nothing is sent to a server. Click **Verb**, then click the new line in
the log (or press **View Formatted JSON ↗**) and match each part:

| Part | In the diagram's example | In the Statement your click just emitted |
|---|---|---|
| **Actor** | Maya | `actor`: the demo account `demo-student` |
| **Verb** | completed | `verb`: `interacted` |
| **Object** | the Photosynthesis Quiz, Activity Type *quiz* | `object`: `…/sims/xapi-statement-triple/#verb`, typed `Control` |
| **Result** | scored 9/10 | `result`: `engagement-mode: click` |
| **Context** | Biology 101, Section 2 | `context`: the textbook version (`grouping`), this page (`parent`), and the concept you studied (`concept_id`) |

Why `interacted` and not `completed`? This book's
[producer contract](../../specs/xapi-producer-contract-v1.md#3-verbs-resolved) allows
exactly three verbs: `answered`, `experienced`, and `interacted`. Clicking a part to read
its definition is an interaction. It is not a completion, and it is not an answer.

### What each action emits

| You do this | It emits | Why |
|---|---|---|
| Click a part | one `interacted` statement, `engagement-mode: click`, carrying that part's concept | Clicking is the act the diagram was designed for ("Click a labeled part…"). Clicking the part that is already selected counts again: it is still a deliberate click. |
| Click empty space | nothing (the log shows a note) | Clearing the Details box is not evidence of studying anything. |
| Hover over a part | nothing | The diagram only brightens the box; hovering is not how it is meant to be used. |
| Leave the page, hide the tab, or press **Simulate Done** | one `experienced` statement for your time on the page | The diagram has no Start/Pause, so the interval is time on the page. Under one second is a glance and emits nothing. |

### Full vs. Compact

The **xAPI events** radio buttons switch between the two statement streams this book
describes. The diagram starts on **Full**.

| Mode | Built for | What the log shows |
|---|---|---|
| **Full** | A full LRS on a good network | One `interacted` statement per click, **as you click**, plus the page-dwell `experienced` statement when the diagram loses focus. |
| **Compact** | [LRS-Lite](../../lrs-lite/index.md#6-producer-side-summarization), a small store in the browser | **Nothing while you click.** Your clicks are folded into **one** `experienced` summary, emitted when the diagram loses focus. Its `controls` extension lists each part you clicked, how many times, and its concept. `statements_represented` counts the Full statements it stands for. |

**Try it:**

1. On **Full**, click all five parts once. Count the statements.
2. Switch to **Compact** and click all five again. The log stays silent, except for notes
   saying each click was folded.
3. Press **Simulate Done**. One summary appears. Open it with **View Formatted JSON ↗**
   and find `statements_represented`.
4. Press **Simulate Done** again. No statement appears: the session already ended, and a
   new one starts only when you click a part again.

Switching modes closes whatever the mode being left has open, so nothing is lost or
counted twice. Full → Compact emits the page interval so far (`run-ended-by:
"mode-switch"`); Compact → Full emits the folded summary (`end_reason: "mode-switch"`).

### Which concepts it records

Every statement carries one `concept_id` from this book's
[learning graph](../../learning-graph/learning-graph.csv). All six are Chapter 1 concepts.

| Object | Fragment | Concept |
|---|---|---|
| Actor | `#actor` | `learning-record-store-9` Actor |
| Verb | `#verb` | `learning-record-store-10` Verb |
| Object (Activity) | `#object` | `learning-record-store-11` Object Activity |
| Result | `#result` | `learning-record-store-13` Result |
| Context | `#context` | `learning-record-store-14` Context |
| The page (dwell, the Compact summary) | none | `learning-record-store-15` Statement |

The Object box also shows its Activity Type (*quiz*), but a statement carries only one
concept, and the box is the Object.

### What it cannot tell you

Every statement here is `interacted` or `experienced`. Only `answered` carries
`result.success`, and only that reaches a mastery estimate. So this diagram records
**which parts a student opened, how often, and in what order**. It cannot record whether
the student knows what an Actor is. That would take a question, such as "which part of
this Statement is the Context?", emitted as `answered`.

### Where the mode comes from

The book's [`docs/js/lrs-config.js`](../../js/lrs-config.js) sets every MicroSim to
`compact: true, teaching: false`: compact, and silent. This sim's
[`metadata.json`](metadata.json) overrides that, because the diagram exists to teach what
a Statement is:

```json
"xapi": { "compact": false, "teaching": true, "concept": "learning-record-store-15", "objects": { "actor": "learning-record-store-9", "…": "…" } }
```

`teaching: true` shows the log, the Full/Compact switch, Simulate Done, and View
Formatted JSON. `concept` and `objects` record the concept map above; they do not change
the mode.

A reader can override both layers for one visit from the URL. Add `?xapi=teaching` to any
page that embeds an instrumented MicroSim, and every such sim on that page shows its
statement log, even production sims such as the
[Chaos Kill Test Simulator](../chaos-kill-test-simulator/index.md?xapi=teaching). Add
`?xapi=production` to this page to see what the diagram looks like with the log hidden.

### Things worth asking

1. Click **Verb**, then open the statement it emitted. Which of its fields is the Actor,
   the Verb, the Object, the Result, and the Context? Which of them did the diagram call
   *Optional*?
2. The diagram's example uses the verb *completed*, but clicking a part emits
   `interacted`. Why does this book allow only `answered`, `experienced`, and
   `interacted`?
3. Click all five parts in Full mode, then do the same in Compact mode and press
   Simulate Done. How many statements does each mode produce, and what does
   `statements_represented` count?
4. Clicking empty space clears the Details box but emits nothing. Why is that not
   evidence?
5. Can this diagram tell a teacher that a student knows what an Actor is? What would it
   need to add?

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
