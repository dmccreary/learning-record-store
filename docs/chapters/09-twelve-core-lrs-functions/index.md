---
title: The Twelve Core LRS Functions
description: A reference walk-through of this project's specification's twelve core functions, F-1 through F-12, from statement storage and retrieval through mastery computation, experimentation, reconciliation, export, and retention.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 08:14:40
version: 0.09
---

# The Twelve Core LRS Functions

## Summary

This short chapter is a reference walk-through of the specification's twelve core functions, F-1 through F-12 — storage, retrieval, voiding, pseudonymization, activity resolution, mastery computation, and more — each of which the rest of Part 2 explains in depth.

## Concepts Covered

This chapter covers the following 12 concepts from the learning graph:

1. Statement Storage Function
2. Statement Retrieval Function
3. Voiding Function
4. Actor Pseudonymization Function
5. Activity Resolution Function
6. Concept Mapping Function
7. Mastery Computation Function
8. Progress Projection Function
9. Experiment Assignment Function
10. Reconciliation Function
11. Export Function
12. Retention Purge Function

## Prerequisites

This chapter builds on concepts from:

- [Chapter 2: The Anatomy of an xAPI Statement](../02-anatomy-of-xapi-statement/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)

---

!!! mascot-welcome "Cataloging the Machine You Just Watched Run"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 8 closed by promising a catalog: everything this Learning Record Store actually does with the evidence it collects, function by function. This chapter is that catalog. Let's follow the record.

This project's specification lists its complete set of core capabilities in a single table — `lrs-spec-v1.md` §6, "Core LRS Functions." Read that table closely and you will count thirteen rows, not twelve: a row labeled F-7b sits between F-7 and F-8. That row is **Statement compression** — the function that turns millions of raw statements into a small set of summary vertices, one per analytical grain — and Chapter 8 already covered it in full, from the compression ratio to the sync cadence that keeps a graph write rate stable during an ingestion burst. This chapter's title counts the other twelve, because F-7b earned an entire chapter of its own and needs no further explanation here; it is simply function seven-and-a-half, sitting exactly where the pipeline puts it, between the function that scores a student's mastery and the function that projects their broader progress.

The remaining twelve functions fall into four natural groups, and this chapter walks through them in that order rather than in strict numeric order: three functions that keep the raw record honest, three that turn a raw statement into something the graph can use, two that build the summary vertices Chapter 8 introduced, and four that run at the system's edges — occasionally, asynchronously, or only on request. Every one of the twelve rests on a small set of design commitments this book has already met piece by piece.

Before meeting the functions individually, it is worth naming the design principles that shape every one of them, because each principle already has a home earlier in this book:

- **Non-blocking ingestion by default** — a statement is never held up waiting for anything downstream to catch up (Chapter 8).
- **Schema-on-read** — an unfamiliar verb, activity, or textbook version is accepted and reconciled later, never rejected at the door (Chapter 8).
- **Immutability of the event log** — nothing in the Event Store is ever edited or deleted; corrections are new statements (Chapter 5, and this chapter's own Voiding Function).
- **Compress before materializing** — the graph stores summaries, never one vertex per statement (Chapter 8, F-7b).
- **Graph-native analytics** — progress and mastery questions are graph traversals over compressed summaries, not scans over raw events (Chapter 7).
- **Privacy by design** — student identifiers are pseudonymous everywhere outside the PII Vault (Chapter 6).

Keep these six commitments in view. Every function below is really just one of these principles, made concrete as a specific promise about specific data.

## The Record-Keeping Core: Storage, Retrieval, and Voiding

The most basic promise any Learning Record Store makes is to be an honest record. Three functions carry that promise, and all three act on the same Event Store Chapter 5 introduced and Chapter 8 fed. F-1 is the **Statement Storage Function**: a durable, immutable, queryable record of every xAPI event, held in the Event Store rather than the graph. This chapter has almost nothing new to add to it, because Chapters 5 and 8 already described exactly how a statement gets there — through the xAPI Statement Resource, past Structural Validation and Semantic Validation, into the Durable Event Queue, and finally into the Event Store as an append-only row. The specification is direct about what makes this function trustworthy: the Event Store is the system of record, "not the graph," and every other function in this chapter — including the eleven still to come — either reads from it or writes an entry into it. Nothing in this Learning Record Store is true unless it is true in the Event Store first.

F-2 is the **Statement Retrieval Function**: a conformant `GET /xapi/statements` endpoint that filters by actor, verb, activity, time range, and registration. Where the Statement Storage Function is about getting data in, this is the specification's answer to getting it back out in raw form — not through a report or a dashboard figure, but as the original statements themselves. A **registration** is a standard xAPI identifier: a single UUID that groups every statement produced during one continuous attempt at an activity, so a query can ask for "every statement from this one attempt" rather than "every statement about this activity, ever." Filtering by actor answers "what did this specific student do"; filtering by verb answers "show me every *completed* event"; filtering by time range answers "what happened last Tuesday." Retrieval is deliberately narrow — a raw list of statements, not an aggregate — because aggregation is a different function's job entirely, one this book meets properly in its later report catalog.

F-3 is the **Voiding Function**: support for `voided` statements that retract a prior event without ever deleting it. This is the specification's answer to a question every record-keeping system eventually faces: what happens when a Learning Record Provider sends a statement it later discovers was wrong — the wrong score, the wrong learner, a duplicate submitted by a flaky network retry? The Event Store's immutability rule from Chapter 5 forbids editing or removing that original row. Instead, xAPI defines a specific verb, `voided`, and a producer corrects a mistake by sending a brand-new statement whose Object references the `statement_id` of the one being retracted. This project's Learning Record Store marks the original row with the retracting statement's identifier — the design specification calls that property `voided_by` — rather than deleting anything. A voided statement still exists, permanently, as a fact: "this event was recorded, and it was later retracted." What changes is only how the rest of the system treats it going forward.

!!! mascot-thinking "One Log, Three Different Questions"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Notice that all three of these functions act on exactly the same Event Store — there is no separate "voiding database" or "retrieval database" sitting beside it. Storage asks "can I trust that this row exists tomorrow." Retrieval asks "can I get this row back out, filtered the way I need it." Voiding asks "can I correct this row without ever pretending it never happened." Same log, three different questions.

Voiding's effect reaches further than the Event Store alone. Chapter 8's compression rollups read directly from the log, and this project's design specification excludes voided rows from every rollup query automatically — a voided statement simply drops out of whatever `ConceptMastery` or `PageEngagement` vertex it would otherwise have fed, and the next scheduled sync writes the corrected total. Retraction needs no special-case code anywhere in the compression pipeline; it is just another input a rollup query already knows how to handle. The diagram below traces all three record-keeping functions against the one log they share.

#### Diagram: One Statement, Three Ways to Touch the Record

<iframe src="../../sims/statement-storage-retrieval-voiding-flow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>One Statement, Three Ways to Touch the Record</summary>
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
</details>

## Turning Raw Statements into Structure

Three more functions run inside the Stream Processor Chapter 5 introduced, and they run in a fixed order on every single statement between the moment it leaves the Durable Event Queue and the moment it is written to the Event Store. This project's design specification lists that order explicitly, and the three functions covered in this section are the first three steps of it. F-4 is the **Actor Pseudonymization Function**: resolve every incoming actor to a `student_key`, keeping any personally identifiable information behind the PII Vault Chapter 6 described in full. This chapter adds nothing new to the mechanism — the identity service's per-district salt, the HMAC derivation, the reason a compromised analytics reader still cannot re-identify a learner — because Chapter 6 already walked through every piece of it. What matters here is only the function's place in the sequence: pseudonymization runs first, before any other enrichment step touches the statement, so nothing downstream of it ever sees a raw learner identity again.

F-5 is the **Activity Resolution Function**: map an object's IRI to a graph node, auto-provisioning one on first sight if it does not exist yet. Chapter 8 covered this function's full mechanics under a different name — Accept-First Ingestion and the Provisional Node stubs it creates — so this chapter only needs to name it formally as F-5 and place it in the processing sequence: it runs second, immediately after an actor has been pseudonymized, resolving the statement's Object against a cached lookup and falling back to a provisional stub rather than blocking when the lookup misses.

F-6 is the **Concept Mapping Function**: attach a statement to the concepts it addresses through the `COVERS` graph, so mastery can eventually be computed from it. Chapter 7 described `COVERS` as a structural relationship — an edge running from a `Page`, `MicroSim`, or `Question` to the `Concept` it addresses — but stopped short of saying when or how that edge gets consulted at ingestion time. This is that answer: as the third enrichment step, the Stream Processor looks up which concepts the statement's Object already covers in the structural graph and stamps the resulting `concept_ids` directly onto the enriched record. Without this step, a completed quiz question would simply be "an event about question 47" with no path back to any concept at all — Concept Mapping is what turns "question 47" into "evidence about Photosynthesis."

!!! mascot-tip "Order Is Not an Accident"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you ever need to reason about why a mastery figure looks the way it does, remember that these three functions run in a fixed sequence for a reason: pseudonymize, then resolve the activity, then map it to concepts. Concept Mapping depends on Activity Resolution having already found (or provisionally stubbed) the object, and everything downstream — including the Mastery Computation Function two sections from now — depends on Concept Mapping having already run. Skip a step out of order and the ones after it have nothing to work from.

The table below reinforces the three functions now that each has been explained above, alongside the exact Stream Processor step it corresponds to.

| Function | Stream Processor Step | What It Resolves |
|---|---|---|
| Actor Pseudonymization Function (F-4) | 1st: Pseudonymize | Raw actor identity → `student_key` |
| Activity Resolution Function (F-5) | 2nd: Resolve activities | Object IRI → graph node (or a provisional stub) |
| Concept Mapping Function (F-6) | 3rd: Enrich | Resolved object → `concept_ids` via `COVERS` |

## Turning Structure into Insight

Once a statement carries a pseudonymous actor, a resolved activity, and a set of `concept_ids`, two more functions turn that enriched record into the summary vertices Chapter 8 catalogued in detail. F-7 is the **Mastery Computation Function**: maintain a `ConceptMastery` vertex from evidence — quiz results, MicroSim interactions, dwell time — for every (student, concept) pair with any evidence at all. Chapter 8 already described what that vertex holds once it exists: `mastery_score`, `evidence_count`, `attempts`, `successes`, and the rest. What this function names is the ongoing, ordered process that keeps `mastery_score` current as new evidence arrives — a process detailed enough to earn its own later chapter, where the exact scoring model is introduced by name. For now, the important fact is only that Mastery Computation is a distinct function with a distinct grain: one vertex per (student, concept), and nothing coarser.

F-8 is the **Progress Projection Function**: maintain per-student, per-section, and per-textbook progress rollups — everything in Chapter 8's six-grain catalog other than `ConceptMastery` itself. `PageEngagement` and `MicroSimEngagement` project a student's progress through individual pieces of content; `QuestionResponse` projects their progress on individual questions; `LearningSession` projects the shape of one sitting's activity; `SectionRollup` projects an entire class's progress at once. Where Mastery Computation answers "how well does this student know this concept," Progress Projection answers a broader family of questions — "how far has this student gotten," "how engaged were they," "how is the whole section doing" — none of which is really about mastery at all.

!!! mascot-warning "Mastery and Progress Are Not the Same Word"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to use "mastery" and "progress" interchangeably in casual conversation about a student's dashboard, but this project's specification treats them as two separate functions maintaining different vertices. A student can have extensive `PageEngagement` — long dwell times, many revisits — recorded by the Progress Projection Function while still showing a low `mastery_score` on the very same concept, computed by the Mastery Computation Function. Progress is not evidence of mastery by itself; it is evidence that a student showed up.

#### Diagram: Two Summary-Building Functions — Mastery and Progress

<iframe src="../../sims/mastery-vs-progress-rollup/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Two Summary-Building Functions — Mastery and Progress</summary>
Type: infographic
**sim-id:** mastery-vs-progress-rollup<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/intelligent-textbooks/tree/main/docs/sims/question-color-update<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, classify

Learning objective: Let the learner differentiate the Mastery Computation Function's single grain (ConceptMastery) from the Progress Projection Function's five grains (PageEngagement, MicroSimEngagement, QuestionResponse, LearningSession, SectionRollup), classifying each of Chapter 8's six summary-vertex labels under the correct function.

Purpose: Show a two-branch vis-network graph rooted at "Enriched Statement (concept_ids attached)", splitting into a "Mastery Computation Function (F-7)" branch and a "Progress Projection Function (F-8)" branch.

Nodes: Root: "Enriched Statement". Branch F-7: single child node "ConceptMastery — (student, concept)". Branch F-8: five child nodes "PageEngagement — (student, page)", "MicroSimEngagement — (student, microsim)", "QuestionResponse — (student, question)", "LearningSession — (student, session)", "SectionRollup — (section, concept)".

Interactive features: Clicking "Mastery Computation Function" or "Progress Projection Function" opens an infobox with that function's definition from this chapter's prose and its F-number. Clicking any of the six grain nodes opens an infobox recalling that vertex's key properties from Chapter 8's grain table. A toggle labeled "Show statement compression ratio" annotates each leaf node with its approximate compression ratio from Chapter 8 (e.g. ConceptMastery ~100:1, SectionRollup ~3,000:1) when enabled.

Color coding: The F-7 branch in the book's teal accent color; the F-8 branch in a complementary amber, matching the two-function color language established for the "accept immediately / reconciled later" split in Chapter 8's Accept-First diagram.

Responsive design: Graph layout recalculates on window resize using vis-network's physics engine; on narrow viewports the two branches stack vertically rather than side by side.
</details>

## Functions at the System's Edges

The remaining four functions do not run on every statement the way the previous six do. Each one runs on its own trigger — some scheduled, some on demand — separate from the main path a statement takes from arrival to compressed summary. F-9 is the **Experiment Assignment Function**: sticky, deterministic variant assignment for A/B tests. Chapter 7 introduced the `Experiment` and `Variant` nodes this function assigns students to, and this project's specification states the assignment rule plainly: once a student is assigned to a `Variant`, they see that same arm for the entire life of the experiment, and the assignment never blocks the event stream — if the assignment mechanism is ever unavailable, a student simply receives the control arm and their statement is still recorded normally. [Chapter 31](../31-designing-ab-experiments/index.md) returns to exactly how that assignment is computed and how the resulting experiments are read. Immediately next to it in the specification's numbering, F-10 is the **Reconciliation Function**: promote provisional nodes and back-fill structure asynchronously. This chapter has nothing new to add here — it is the same Reconciliation Worker Chapter 8 walked through in full, matching provisional stubs against a textbook's published metadata by `git_sha`, then IRI path, then title similarity, and back-filling `COVERS`, `EMBEDS`, and `DEPENDS_ON` edges on a confident match. Naming it F-10 here only completes the numbered catalog.

F-11 is the **Export Function**: bulk export of statements, per district, for archival and external analysis. Where the Statement Retrieval Function answers narrow, filtered questions about a handful of statements, the Export Function answers a much bigger one — "give me everything this district has ever recorded" — and it does so as an asynchronous job rather than a live query, because a district-scale export can take minutes to assemble. A district administrator or system administrator requests an export through the Export API Chapter 5 named; the job runs in the background, and when it finishes, the requester receives a signed, time-limited download URL rather than the data itself streamed directly back. That design choice keeps a slow, heavyweight export from ever competing with the fast dashboard queries the Analytics API serves on the same infrastructure.

F-12 is the function this book's concept list calls the **Retention Purge Function**, and the specification itself calls "Retention & purge": policy-driven retention with FERPA (the Family Educational Rights and Privacy Act) and COPPA (the Children's Online Privacy Protection Act) compliant purge on request. Every district chooses its own retention window, and this project's design specification stores statements partitioned by month specifically so that enforcing that window is a matter of dropping an entire partition rather than editing individual rows. On top of that scheduled retention, a district can trigger retention on demand — the same erasure mechanism Chapter 6 described for a single learner, extended here to a full compliance purge. A later chapter covers the compliance obligations behind this function in much greater depth; this chapter's job is only to place it correctly as F-12 in the twelve-function catalog.

!!! mascot-encourage "These Four Can Feel Like a Grab Bag — They Are Not"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Experiment assignment, reconciliation, export, and retention do not obviously belong together the way the record-keeping trio or the enrichment trio do, and it is fine if they still feel like four separate topics rather than one unit. What actually unites them is simpler than it looks: none of the four sits on the path a statement takes to get durably stored. Every one of them runs on its own schedule, off to the side, precisely so that none of them can ever become the reason a statement is slow to arrive.

#### Diagram: Four Functions at the System's Edges

<iframe src="../../sims/functions-at-the-edges/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Four Functions at the System's Edges</summary>
Type: workflow
**sim-id:** functions-at-the-edges<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: explain, classify

Learning objective: Let the learner explain what triggers each of the four functions that run off the main statement pipeline — Experiment Assignment, Reconciliation, Export, and Retention Purge — and classify each by whether its trigger is per-statement, scheduled, or on-demand.

Purpose: Show four independent Mermaid flowchart branches, each rooted at a distinct trigger rather than a shared starting node, visually reinforcing that these functions do not share one pipeline.

Nodes, one branch per function: Branch 1: "A student reaches an experiment's eligibility check" leads to "Experiment Assignment Function (F-9): deterministic, sticky variant assignment" leads to "Chapter 31: full assignment and readout mechanics". Branch 2: "Scheduled scan of provisional nodes" leads to "Reconciliation Function (F-10): match + promote + back-fill" leads to "Chapter 8: full reconciliation mechanics". Branch 3: "District or system admin requests a bulk export" leads to "Export Function (F-11): async job, signed download URL". Branch 4: "Scheduled partition drop, or an on-demand erasure request" leads to "Retention Purge Function (F-12): policy-driven retention, FERPA/COPPA-compliant purge" leads to "A later chapter: full compliance treatment".

Interactive features: Every node has a Mermaid click directive. Clicking a trigger node opens an infobox stating whether the trigger is per-statement, scheduled, or on-demand. Clicking a function node opens an infobox with that function's one-sentence definition and F-number from this chapter's prose. Clicking a "full mechanics" reference node opens an infobox naming which earlier or later chapter covers that function in depth.

Color coding: Scheduled-trigger branches (Reconciliation, the retention half of F-12) in a muted slate color; on-demand/per-statement branches (Experiment Assignment, Export, the erasure half of F-12) in the book's teal accent color, distinguishing "runs on a timer" from "runs because someone asked."

Responsive design: The four branches stack vertically and remain independently readable at any viewport width; each branch's internal flow remains left-to-right down to tablet width, then reflows top-to-bottom below it.
</details>

## Seeing All Twelve at Once

With every function now defined, it helps to step back and see the full catalog at once — not grouped into the four sections this chapter used to teach them, but organized the way the specification itself organizes the system: by which architectural plane and which component actually implements each one. Chapter 5 named five planes and their components; Chapters 6 through 8 added the identity service, the Reconciliation Worker, and the Compression Pipeline to that map. The explorer below places all twelve functions onto that same map at once.

#### Diagram: The Twelve Core Functions Explorer

<iframe src="../../sims/twelve-core-functions-explorer/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Twelve Core Functions Explorer</summary>
Type: infographic
**sim-id:** twelve-core-functions-explorer<br/>
**Library:** vis-network<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: classify, organize

Learning objective: Let the learner classify all twelve core LRS functions by the architectural plane and specific component that implements each one, using a single explorable network rather than twelve separate diagrams.

Purpose: Show a clustered vis-network graph with four plane-cluster hubs — "Ingestion Plane", "Processing Plane", "Storage Plane", "Analytics Plane" (reusing Chapter 5's plane names and color language) — and twelve function nodes attached to whichever plane cluster implements them.

Nodes and cluster assignment: Storage Plane cluster: "Statement Storage Function (F-1)", "Statement Retrieval Function (F-2)", "Voiding Function (F-3)". Processing Plane cluster: "Actor Pseudonymization Function (F-4)", "Activity Resolution Function (F-5)", "Concept Mapping Function (F-6)", "Mastery Computation Function (F-7)", "Progress Projection Function (F-8)", "Reconciliation Function (F-10)". Analytics Plane cluster: "Experiment Assignment Function (F-9)", "Export Function (F-11)". A fifth, unclustered node off to the side: "Retention Purge Function (F-12)", connected by a dashed edge to both the Storage Plane and Analytics Plane clusters, reflecting that it acts on stored data but is administered through the Analytics Plane's Admin API.

Interactive features: Clicking a plane-cluster hub opens an infobox recalling that plane's definition from Chapter 5. Clicking any function node opens an infobox with its full specification-language description (from `lrs-spec-v1.md` §6), its F-number, and the specific component that implements it (e.g. "F-7, Mastery Computation Function — implemented in the Stream Processor's mastery-scoring step"). A search box above the canvas lets the learner type an F-number or function name to highlight and center that node. A "Group by component" toggle re-clusters the same twelve nodes by implementing component (Ingestion Gateway, identity service, Stream Processor, Compression Pipeline, Reconciliation Worker, Experiment Service, Analytics API, Export API) instead of by plane, so the learner can explore the same catalog two different ways.

Color coding: Cluster hubs colored using Chapter 5's existing plane gradient (darkest teal for Ingestion Plane through lightest for Presentation-adjacent planes); function nodes colored to match their parent cluster; the unclustered Retention Purge Function node in the contrasting amber used for cross-cutting, compliance-adjacent elements throughout this book.

Responsive design: Network layout recalculates via vis-network's physics engine on window resize; below tablet width, cluster hubs collapse to a simple accordion list with function nodes as expandable children, preserving full interactivity without requiring precise clicking on a small canvas.
</details>

Now that all twelve functions have been placed on the map, the table below gives the same catalog in a scannable, sequential form — the rows of `lrs-spec-v1.md` §6 this whole chapter has been walking through, F-7b included for completeness even though it belongs to Chapter 8.

| # | Function | Implementing Component |
|---|---|---|
| F-1 | Statement Storage Function | Event Store |
| F-2 | Statement Retrieval Function | Event Store, via the xAPI Statement Resource |
| F-3 | Voiding Function | Event Store (`voided_by`) |
| F-4 | Actor Pseudonymization Function | identity service, inside the Stream Processor |
| F-5 | Activity Resolution Function | Stream Processor |
| F-6 | Concept Mapping Function | Stream Processor, via `COVERS` |
| F-7 | Mastery Computation Function | Stream Processor |
| F-7b | Statement compression (Chapter 8) | Compression Pipeline |
| F-8 | Progress Projection Function | Compression Pipeline |
| F-9 | Experiment Assignment Function | Experiment Service |
| F-10 | Reconciliation Function | Reconciliation Worker |
| F-11 | Export Function | Export API |
| F-12 | Retention Purge Function | Event Store partitions, identity service (erasure) |

## Key Takeaways

- The **Statement Storage Function (F-1)** keeps a durable, immutable, queryable record of every xAPI event in the Event Store, never in the graph.
- The **Statement Retrieval Function (F-2)** answers narrow, filtered questions — by actor, verb, activity, time range, or registration — against that same store.
- The **Voiding Function (F-3)** retracts a prior statement with a new `voided` statement rather than ever deleting or editing the original.
- The **Actor Pseudonymization Function (F-4)** resolves every incoming actor to a `student_key` before any other enrichment step runs.
- The **Activity Resolution Function (F-5)** maps an object's IRI to a graph node, falling back to a provisional stub rather than blocking on a miss.
- The **Concept Mapping Function (F-6)** attaches a statement to the concepts it addresses through `COVERS`, making mastery computation possible.
- The **Mastery Computation Function (F-7)** maintains one `ConceptMastery` vertex per (student, concept) from quiz, MicroSim, and engagement evidence.
- The **Progress Projection Function (F-8)** maintains the remaining five summary grains — engagement, response, session, and section-level rollups.
- The **Experiment Assignment Function (F-9)** gives every student a sticky, deterministic variant that never blocks the event stream.
- The **Reconciliation Function (F-10)** promotes provisional nodes and back-fills structure once a textbook's real metadata is matched.
- The **Export Function (F-11)** produces asynchronous, per-district bulk exports delivered through a signed download URL.
- The **Retention Purge Function (F-12)** enforces policy-driven, FERPA/COPPA-compliant retention windows and purge-on-request.

!!! mascot-celebration "Twelve Functions, One Coherent System"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    You now have every function this Learning Record Store performs, named, numbered, and placed on the architecture you already knew. What does the evidence show? A system this capable did not happen by accident — every one of those twelve functions rests on specific technology choices. In [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md), we open the design specification's own reasoning for why this system is built the way it is.
