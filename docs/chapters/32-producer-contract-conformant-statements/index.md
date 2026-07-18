---
title: The Producer Contract: Writing Conformant Statements
description: What an intelligent textbook must do, field by field, to emit xAPI statements this Learning Record Store ingests correctly, from the canonical activity IRI through the fields a producer must never touch.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 20:11:18
version: 0.09
---

# The Producer Contract: Writing Conformant Statements

## Summary

This closing chapter covers what it takes for an intelligent textbook to emit statements this LRS can ingest correctly: the canonical activity IRI rules, the three-verb set, the Start/Pause dwell pattern, and the fields a producer must never send because the server owns them.

## Concepts Covered

This chapter covers the following 23 concepts from the learning graph:

1. Canonical Activity IRI
2. Trailing Slash Rule
3. Question IRI Fragment
4. Named Sub-Activity Fragment
5. Randomized Order Naming Rule
6. Answered Verb
7. Experienced Verb
8. Interacted Verb
9. Textbook Version Grouping IRI
10. Object Definition Type Map
11. Control Object Type
12. Concept Extension Field
13. Concept Enrichment Path
14. Start Pause Dwell Pattern
15. Visibility Change Flush
16. Producer Excluded Field
17. xAPI Transport Header
18. District ID Server-Assigned
19. Student Key Server-Derived
20. Stored At Gateway Timestamp
21. API Version Header
22. Reference Statement Example
23. Field To Column Map

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)
- [Chapter 4: Standards Governance and the Wider Interoperability Ecosystem](../04-standards-governance-ecosystem/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 9: The Twelve Core LRS Functions](../09-twelve-core-lrs-functions/index.md)
- [Chapter 14: Kafka Topics, ClickHouse Schema, and Graph Constraints](../14-kafka-clickhouse-graph-schema/index.md)

---

!!! mascot-welcome "The Other End of the Log"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 31 closed by pointing at the far end of the shared statement log — the moment before anything is stored, when software must decide exactly what JSON to send. This chapter is that moment, worked all the way through. Let's follow the record.

Every dashboard, heatmap, and experiment readout in this book depends on one thing happening correctly, far upstream of any of it: a Learning Record Provider — the textbook, MicroSim, or quiz page introduced in Chapter 1 — must construct a Statement in a shape this Learning Record Store already knows how to store. Chapter 9 described the twelve functions an LRS performs on statements once they arrive, and Chapter 14 named the exact Kafka topics, ClickHouse tables, and Neo4j constraints those functions write into. Neither chapter said what the *producer* — the code running inside the textbook page itself — must emit for that machinery to work. This chapter is that answer, grounded directly in this project's `xapi-producer-contract-v1.md`, the specification every intelligent textbook here is written against.

Treat the producer contract as a promise made in one direction: the textbook shapes its statements a specific way, and the LRS compresses a correctly-shaped statement into the right summary vertex and dashboard. Break the promise and a statement is rejected outright or, worse, accepted and quietly corrupts a number downstream. This chapter follows the order a producer applies these rules: name the thing a student interacted with, choose the verb, avoid fields it has no right to set, and see how one JSON field becomes one stored column.

## Naming One Activity for a Lifetime

Every Statement's `object.id` is an activity IRI — an Internationalized Resource Identifier, the same kind of absolute web address xAPI uses to name Actors, Verbs, and Activities uniquely. The producer contract's first rule is the **Canonical Activity IRI**: `object.id` for a page is the textbook's published site URL plus the page's navigation path, always ending in a trailing slash. That last clause has its own name, the **Trailing Slash Rule**, and it is not a style preference. A ClickHouse table like `lrs.statements` orders its rows by `(district_id, student_key, object_id)`, and to that ordering `…/sims/sine-wave/` and `…/sims/sine-wave` are different strings. Drop the slash and one page a student visited once splits into two rows that never merge — the compression ratio this book's C-6 constraint measures under-reports, and the graph grows a second `PageEngagement` vertex for one page.

The rule is stricter than it first appears. The IRI must be absolute HTTPS, never a relative path, never a local `mkdocs serve` address. It must never point at `main.html`, the iframe payload a MicroSim's JavaScript runs inside — MkDocs renders a navigable page at `/sims/sine-wave/` and copies `main.html` beside it, and citing the payload mints a second identity for one activity, the same failure a missing slash causes. An activity IRI need not be fetchable at ingest time; it is an identifier, not a link the LRS follows. What it must never do is change when the textbook's hosting moves, because every rollup keyed on `object_id` depends on that string staying constant for the life of the page.

!!! mascot-tip "One Page, One Address, Forever"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    If you are ever unsure whether an IRI is canonical, ask one question: does this string identify the page a student visited, or the file that happened to render it? `main.html` answers the second question. The Canonical Activity IRI always answers the first.

The diagram below turns three real IRIs — one canonical, two malformed — into a clickable comparison, so the rule can be checked against concrete strings rather than held only in the abstract.

#### Diagram: Canonical Activity IRI Anatomy

<iframe src="../../sims/canonical-activity-iri-anatomy/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Canonical Activity IRI Anatomy</summary>
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
</details>

## Fragments: Questions, Controls, and the Shuffle Problem

A page-level Canonical Activity IRI names an entire page, but a producer often needs to identify something smaller — one question, or one slider a student dragged. Both cases use a fragment, the part of an IRI after a `#`, and the contract gives fragments one rule with two applications rather than two unrelated rules.

For a quiz question, the rule is the **Question IRI Fragment**: `object.id` is the page IRI plus `#q{N}`, where `N` is the question's one-based ordinal as the student sees it — `#q1` first, `#q3` third. One-based matters because the fragment should mean what a student and a debugger both see; a chapter that numbers its questions "1." through "10." must not emit IRIs that quietly disagree with its own headings.

For anything that is not a question — a slider, a button, a labeled diagram node — the rule is the **Named Sub-Activity Fragment**: the fragment is the sub-activity's stable local name, slugified, such as `#speed-slider`, never its position. A diagram node's identity is what it *is*, not where it sits; reordering a diagram should never silently repoint an IRI at a different concept.

Both rules answer one test: would an edit that does not change what the thing *is* change its IRI? A question's identity is its position in a fixed list, so ordinal is stable. A control's identity is its label, so the name is stable. That same test produces the **Randomized Order Naming Rule**: when a quiz shuffles its question order on every load, the ordinal stops being a stable identity — a reload, not even an edit, changes which question sits at position 3. A shuffled quiz must name its questions instead, using a prefixed form like `#q-nucleus`, so the question rollup's grouping by `object_id` does not merge six different questions into six position-keyed rows. The `q-` prefix also keeps a question distinct from a hotspot of the same name: an explore-and-quiz diagram can emit both `#nucleus` (inspecting it) and `#q-nucleus` (being asked to find it) — two activities sharing a pixel, kept apart by name.

The list below distills the fragment-naming decision into one question a producer's code can ask at runtime.

- If the question's presentation order never changes between loads, use the ordinal form: `#q{N}`, one-based.
- If the question's order is shuffled on every load, use the named form: `#q-{stable-name}`, never the ordinal.
- If the sub-activity is not a question at all — a slider, a button, a diagram node — always use the named form, slugified from its stable local label.
- Never let a fragment's meaning depend on the reader already knowing which kind of page produced it; the fragment scheme must be self-explanatory from the IRI alone.

## Exactly Three Verbs

Chapter 2 introduced Verb as one of a Statement's three required parts without pinning down which verbs this project's LRS accepts. The producer contract closes that gap: exactly three verbs are valid, and a statement using any other verb is rejected at the gateway before it reaches Kafka.

The **Answered Verb**, `http://adlnet.gov/expapi/verbs/answered`, is emitted for a question attempt and must carry a `result.success` boolean, plus `result.score.scaled` when scored. The **Experienced Verb**, `http://adlnet.gov/expapi/verbs/experienced`, is emitted for page or MicroSim engagement and must carry a `result.duration` — the format this chapter returns to under the dwell pattern. The **Interacted Verb**, `http://adlnet.gov/expapi/verbs/interacted`, is emitted when a student manipulates a control such as a slider; it requires no specific `result` field, since the value manipulated travels instead as a Context Extension.

Notice what is absent: `completed`, the verb the original design's worked example used before this contract existed. It carries no `success` field, so it cannot feed the mastery rollup's attempt count — worse than nothing, since a rollup fed only by `completed` reports zero attempts while looking like a real number. `answered` and `interacted` can look interchangeable, but are not alternatives: `answered` is for a scored attempt, `interacted` for engagement carrying no correctness judgment.

The table below reinforces which verb pairs with which required result field, now that all three are defined above.

| Verb | Emitted for | Required `result` field |
|---|---|---|
| **Answered Verb** | A question attempt | `success` (boolean); `score.scaled` when scored |
| **Experienced Verb** | Page or MicroSim dwell | `duration` (ISO-8601) |
| **Interacted Verb** | A control being manipulated | None required; the value travels as a Context Extension |

## Tying a Statement to a Textbook Version

A single MicroSim, like the scientific-method simulation this book has referenced before, is often embedded by more than one textbook — physics and chemistry might both embed it. Because the Canonical Activity IRI names the activity itself, not which book is using it, a Statement needs a separate field to say *which textbook, and which version*, the student was reading. That field is the **Textbook Version Grouping IRI**: `context.contextActivities.grouping[0].id`, formed as the site URL plus `textbook/{textbook_id}/{version_id}` — for example, `https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0`, parsed back into `textbook_id: "lrs"` and `version_id: "v1.0.0"`.

This field is required on every Statement, with no sensible default, because a Statement that cannot be attributed to a textbook version cannot later be replayed against the content it described — the same replayability guarantee Chapter 8 introduced. A related field, `context.contextActivities.parent[0]`, names the page a question belongs to; required for the Answered Verb, meaningless for the Experienced Verb, since a page is never its own parent.

!!! mascot-thinking "Same Sim, Two Books, One Vertex"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Because every rollup groups by `object_id`, not by textbook, a MicroSim shared across two books compresses into *one* summary vertex, with the Grouping IRI the only place the books are still distinguishable. A student who mastered a concept in physics and skims it in chemistry looks identical, in that vertex, to a student meeting it for the first time. Low engagement is not automatically low mastery — "which book taught them" lives only in the raw log, never in the compressed graph alone.

## What Kind of Object Is This?

A Statement's `object.definition.type` classifies what kind of thing an activity is, and Chapter 14 already named the four values `lrs.statements.object_type` accepts: `Page`, `MicroSim`, `Question`, and `Concept`. What Chapter 14 did not say is how a raw xAPI `definition.type` IRI becomes one of those values — that translation is the **Object Definition Type Map**, and it matters because two ClickHouse materialized views filter directly on this column; without a fixed mapping both would stay empty.

A prose page maps `.../activities/lesson` to `Page`. An interactive sim's own page maps `.../activities/simulation` to `MicroSim` — always the page IRI, no fragment. A quiz question maps `.../activities/cmi.interaction` to `Question`. Anything not in this map is rejected at the gateway rather than stored under a guessed category.

The fourth mapped value is its own concept: `.../activities/interaction` maps to the **Control Object Type** — a slider or button *within* a page, distinct from `MicroSim` by four characters in its source IRI (`cmi.interaction` versus `interaction`) but meaning something entirely different. Control exists as its own type because a control's IRI is fragment-qualified; typing a slider `MicroSim` would mint its own `PageEngagement` vertex per control — the same failure the Trailing Slash Rule guards against. Controls are excluded from the page rollup by type and land in the concept rollup instead.

The table below organizes the mapping as a single reference, reinforcing the categories above.

| `object.definition.type` IRI | Maps to `object_type` | What it is |
|---|---|---|
| `.../activities/lesson` | `Page` | A prose or textbook page |
| `.../activities/simulation` | `MicroSim` | An interactive sim's own page, no fragment |
| `.../activities/cmi.interaction` | `Question` | A quiz question |
| `.../activities/interaction` | `Control` | A slider or button within a page |
| *(anything else)* | — | Rejected at the gateway |

A single artifact can legitimately produce two different objects out of the same visible pixels. An interactive diagram with an explore mode and a quiz mode over the same labeled part emits `#nucleus` typed `Control` when inspected, and `#q-nucleus` typed `Question` when the student is asked to find it — two objects, not one whose type depends on the mode. The test: if two acts need different `result` fields to be honest — inspecting has no `success`, answering must have one — they are different objects. Splitting the IRI costs nothing at the concept level, since both carry the same `concept_id` and re-converge in one `ConceptMastery` vertex; it costs something only if a report groups by `object_id` without filtering by type.

## Attaching a Concept Without a Concept Graph

Every summary vertex this book has described — `ConceptMastery` most of all — depends on knowing which concept a Statement is evidence for. The original design imagined the processor deriving that mapping from a cached structural graph of which concepts each page covers. That graph is not seeded yet, which leaves producers with one practical option: the **Concept Extension Field**, `context.extensions["https://w3id.org/lrs/ext/concept_id"]`, a single concept-ID string attached directly to a Statement's context.

The contract makes this extension authoritative for now: when present, it decides which concept a Statement counts toward; when absent, `concept_ids` comes back empty and the Statement is excluded from the concept-mastery rollup by that view's own `WHERE notEmpty(concept_ids)` filter. One detail is easy to trip over — the extension key is singular, `concept_id`, while the destination column `concept_ids` is an array; the processor wraps the value into a one-element array, so a page covering three concepts at once cannot yet say so.

The server-side alternative — reading concept coverage from a structural graph instead of trusting the extension — is the **Concept Enrichment Path**. It is deferred, not rejected: once a structural graph is seeded, it will fill in `concept_ids` for Statements that omit the extension, while a Statement that supplies the extension still wins. Until then, a producer that never sends `concept_id` is not violating the contract — it is simply opting its Statements out of concept-level mastery tracking.

## One Interval, One Statement: the Dwell Pattern

Nearly every MicroSim in this ecosystem exposes a Start/Pause control, and until this section of the contract existed, the three-verb set had no honest way to describe what it measures: a run of time, not a single instant. The **Start Pause Dwell Pattern** answers this: a Start/Pause pair is one run interval, and one run interval is exactly one Experienced Verb statement, emitted at Pause, carrying the elapsed time as `result.duration`.

Notice what does *not* happen at Start: nothing is emitted. A student who starts a simulation and walks away has produced no evidence worth a row, and a `started` statement with no matching `paused` would be an unclosed interval nothing downstream can score. The interval, once closed, is the evidence — one statement carries the elapsed time as well as a pair would, without requiring a report to reconstruct duration by joining two rows, unreliable under at-least-once delivery.

Two more cases round out the pattern. If a student switches away from the browser tab while a simulation runs, the contract calls for a **Visibility Change Flush** — the same Experienced Verb statement is emitted immediately, using `visibilitychange` rather than `beforeunload`, the one event reliable on mobile Safari. Starting a sim and closing the tab without pausing is the *common* case for a distracted student, not an edge case. And if a run lasts under 250 milliseconds, nothing is emitted — a run that short is a mis-click, not engagement, and would pollute the dwell total with noise. One structural detail matters as much as emission rules: every MicroSim must load paused by default, both to avoid a distracting auto-running animation and to avoid silently recording dwell the student never chose to spend.

The workflow below traces all four cases — Start, Pause, tab-hidden, and too-short-to-count — end to end.

#### Diagram: The Start/Pause Dwell Pattern

<iframe src="../../sims/start-pause-dwell-pattern-workflow/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Start/Pause Dwell Pattern</summary>
Type: workflow
**sim-id:** start-pause-dwell-pattern-workflow<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Apply (L3)
Bloom Taxonomy Verb: trace, predict

Learning objective: Let the learner trace a MicroSim's Start/Pause lifecycle through four branches — normal Pause, tab hidden while running, sub-250ms run, walk-away-with-no-pause — and predict which emits an Experienced Verb statement.

Purpose: A Mermaid flowchart from "Student clicks Start (loaded paused)" branching into four paths: (1) "Pause after a normal run" → "Emit ONE Experienced statement, duration = elapsed"; (2) "Switches tabs while running" → "visibilitychange fires → Visibility Change Flush: emit immediately"; (3) "Pause under 250ms" → "Emit nothing — mis-click"; (4) "Walks away, Pause never clicked" → "Emit nothing — unclosed interval."

Interactive features: Every node has a Mermaid `click` directive opening an infobox explaining that outcome using the reasoning above (unclosed intervals, mis-click noise, mobile Safari's visibilitychange requirement).

Color coding: The two "emit nothing" outcomes in muted gray-blue; the two statement-emitting outcomes in the book's teal accent color.

Implementation: Mermaid flowchart, top-to-bottom, full click-to-infobox coverage. Responsive: stacks branches vertically on narrow viewports.
</details>

## What a Producer Must Never Send

Every rule so far describes what a producer *should* construct. An equally important part of the contract is the shorter list of fields a producer must never set, because the Learning Record Store, not the textbook, is the sole authority over them. The umbrella term is a **Producer Excluded Field** — a value the client cannot be trusted to supply honestly, or one deriving it requires server-only information.

`district_id` is the clearest case: assigned by the gateway from the caller's authentication token, never read from the Statement body, so a producer cannot claim another district's tenancy. This rule has its own name, **District ID Server-Assigned**. A second field, **Student Key Server-Derived**, follows related logic: the producer sends the real identity in `actor.account.name`, and the processor computes the pseudonymous `student_key` by applying an HMAC with a per-district salt kept in a vault, never in producer code — a producer pre-hashing the identifier itself would be guessing at a salt it cannot access.

A third excluded field addresses *when* a Statement was received: **Stored At Gateway Timestamp**. The Statement's own `timestamp` is producer-supplied event time; `stored_at` is a separate, gateway-assigned arrival time, useful for ingestion lag and meaningless if a producer set it. Two more fields round out the set: `section_id`, left for enrichment, and `voided_by`, set only by the void mechanism from Chapter 2.

The table below organizes the full boundary — what a producer excludes, and what the contract requires it to supply — now that every field has been explained above.

| Category | Field | Who owns it |
|---|---|---|
| Producer-excluded | `district_id` | Gateway, from the auth token |
| Producer-excluded | `student_key` | Processor, HMAC of the actor identity |
| Producer-excluded | `stored_at` | Gateway, at receipt |
| Producer-excluded | `section_id` | Processor, via the Concept Enrichment Path |
| Producer-excluded | `voided_by` | The void API only |
| Producer-required | `actor.account.name` | Producer — the real identity, never pre-hashed |
| Producer-required | `verb.id` | Producer — one of exactly three values |
| Producer-required | `object.id` | Producer — the Canonical Activity IRI |
| Producer-required | `context.contextActivities.grouping[0].id` | Producer — the Textbook Version Grouping IRI |
| Producer-required | `timestamp` | Producer — event time, ISO-8601 |

!!! mascot-warning "Do Not Reach for the Server's Fields"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    A tempting shortcut is computing `student_key` client-side "to save a step," or hardcoding a `district_id` during testing and forgetting to remove it. Both are real violations: a client-computed pseudonym cannot use the district's vault-held salt, and a hardcoded `district_id` is exactly the tenancy claim Chapter 6's isolation model exists to prevent. If a field is excluded, leave it out entirely — do not approximate it.

## Speaking HTTP to the Endpoint

Every rule above describes the *content* of a Statement. Getting that content to the Learning Record Store is a separate, smaller set of rules governing the HTTP request itself, and Chapter 2 already covered the general mechanics — RESTful verbs, the xAPI Endpoint, authentication. What this contract pins down is the exact request shape this project's gateway expects.

Every write goes to `POST /xapi/statements`, carrying two required headers: an **xAPI Transport Header**, `Content-Type: application/json` plus `Authorization: Bearer <token>`, and an **API Version Header**, `X-Experience-API-Version: 1.0.3` — a version negotiation signal a gateway serving multiple producer versions needs.

- The request body is always a JSON array, never a bare object, even for one Statement.
- Batches are all-or-nothing: one invalid Statement rejects every Statement alongside it.
- Supplying `id` lets a producer round-trip its own Statement by that exact identifier later; omitting it lets the gateway assign one instead.
- `timestamp` is always producer-supplied event time, in ISO-8601 UTC — never confused with the server's own `stored_at`.

!!! mascot-encourage "This Chapter Has Been Dense on Purpose"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    Trailing slashes, ordinal fragments, four object types, an HMAC boundary — that is a lot of precision for one chapter, and it should feel dense. You do not need to memorize every rule. Recognize the *shape*: each rule exists because a specific downstream rollup would silently break without it. The reference example next pulls every rule together into one working Statement.

## The Reference Statement, Assembled

Every rule in this chapter can now be seen at once, because the producer contract's own **Reference Statement Example** puts all of them into one working Statement — the shape `scripts/smoke.sh` sends and any new Learning Record Provider here should match. Read it against the rules just covered: `object.id` is a Canonical Activity IRI with a Question IRI Fragment; the verb is the Answered Verb; `grouping[0]` is the Textbook Version Grouping IRI; the Concept Extension Field appears in `context.extensions`; and nothing claims `district_id`, `student_key`, or `stored_at` for itself.

```json
[{
  "id": "0190f8a1-...-7b3c",
  "actor": {
    "objectType": "Agent",
    "account": {"homePage": "https://demo.example.edu", "name": "student-0042"}
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/answered",
    "display": {"en-US": "answered"}
  },
  "object": {
    "objectType": "Activity",
    "id": "https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/#q2",
    "definition": {
      "type": "http://adlnet.gov/expapi/activities/cmi.interaction",
      "name": {"en-US": "How many PageEngagement vertices exist?"}
    }
  },
  "result": {"score": {"scaled": 0.9}, "success": true, "duration": "PT4M12S"},
  "context": {
    "contextActivities": {
      "grouping": [{"id": "https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0"}],
      "parent":   [{"id": "https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/"}]
    },
    "extensions": {"https://w3id.org/lrs/ext/concept_id": "compression-ratio"}
  },
  "timestamp": "2026-07-16T14:22:03Z"
}]
```

Two details are easy to misread. `actor.account.homePage` here is `https://demo.example.edu` — a real demonstration tenant this project uses for testing, not a placeholder to strip out. And `#q2` is deliberately the *second* question, because the fragment counts the way a student reading the page counts, one-based, exactly as the Question IRI Fragment rule requires.

## From JSON Field to Stored Column

The reference Statement above is the last stop before storage. Chapter 7 introduced the property graph's summary vertices, and Chapter 14 named the ClickHouse tables and materialized views those vertices are built from; neither chapter traced the path a single JSON field takes to get there. That path is the **Field To Column Map** — a direct line from a Statement's JSON to the ClickHouse column that stores it, and from there to the Neo4j property that eventually aggregates it.

Read the table below as a literal trace: pick any row and follow one field from the page's JSON, through the gateway, into a ClickHouse column, and on to the graph property a dashboard reads.

| Statement path | ClickHouse column | Eventually feeds |
|---|---|---|
| `id` | `statement_id` | Row identity; deduplication if the producer supplied it |
| `actor.account.name` | `student_key` (HMAC'd) | `Student` node identity in the graph |
| `verb.id` | `verb_id` | Which rollup a statement is eligible for |
| `object.definition.type` | `object_type` | The `Page`/`MicroSim`/`Question`/`Control` filter on each materialized view |
| `object.id` | `object_id` | `PageEngagement.object_id` and `QuestionResponse.object_id` |
| `grouping[0].id` | `textbook_id`, `version_id` | `IN_CONTEXT_OF` edge to `TextbookVersion` |
| `result.score.scaled` | `result_score` | `ConceptMastery.mastery_score` inputs |
| `result.success` | `result_success` | `ConceptMastery.attempts` / `.successes` |
| `result.duration` | `duration_ms` | `PageEngagement.dwell_ms_total` |
| `ext/concept_id` | `concept_ids` | The `HAS_MASTERY` → `ConceptMastery` edge |
| `timestamp` | `timestamp` | Partitioning, and every rollup's `first_seen`/`last_seen` |

Tracing one row end to end makes the whole architecture concrete in a way earlier chapters, describing one stage at a time, could not. The diagram below completes that trace visually: one Statement's JSON, arriving at the gateway, splitting into a ClickHouse row and, after compression, a handful of Neo4j vertex properties.

#### Diagram: Statement Journey — Producer to Graph

<iframe src="../../sims/statement-journey-producer-to-graph/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Statement Journey — Producer to Graph</summary>
Type: workflow
**sim-id:** statement-journey-producer-to-graph<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, decompose

Learning objective: Let the learner decompose a single xAPI Statement into its storage destinations, tracing one JSON field from the producer through the gateway to a ClickHouse column and on to a Neo4j summary-vertex property.

Purpose: A Mermaid flowchart with four stages left to right: "Producer emits Statement JSON" → "Gateway validates" → "ClickHouse lrs.statements row" → "Compression pipeline" → "Neo4j summary vertex property." The ClickHouse stage fans out into five field boxes (object_id, object_type, result_success, duration_ms, concept_ids), each fanning into its Neo4j counterpart.

Interactive features: Every node and field box has a Mermaid `click` directive. Clicking "Gateway validates" lists the three rejection triggers from this chapter: an invalid verb, an unmapped object type, a missing grouping[0]. Clicking a field box shows that row from the Field To Column Map table. Clicking the Neo4j stage restates that summary vertices are projections, reproducible by replaying the log — tying back to Chapter 7.

Color coding: Producer and gateway stages in teal; ClickHouse and Neo4j in deeper blue; the compression arrow in amber.

Implementation: Mermaid flowchart, left-to-right, full click-to-infobox coverage. Responsive: stacks top-to-bottom below tablet width.
</details>

## Key Takeaways

- The **Canonical Activity IRI** names a page or MicroSim exactly once, for life, as the site's published URL plus navigation path.
- The **Trailing Slash Rule** makes the trailing slash significant, since ClickHouse's ordering treats a slash and no-slash as different strings.
- A **Question IRI Fragment** identifies a question by its one-based ordinal, `#q{N}`.
- A **Named Sub-Activity Fragment** identifies a slider, button, or diagram node by its stable slugified name, not its position.
- The **Randomized Order Naming Rule** requires a shuffled quiz to name questions rather than number them.
- The **Answered Verb** carries `result.success` and, when scored, `result.score.scaled`.
- The **Experienced Verb** records page or MicroSim dwell as `result.duration`.
- The **Interacted Verb** records manipulating a control, its value carried in a Context Extension.
- The **Textbook Version Grouping IRI** ties a Statement to the exact textbook and version a student was reading.
- The **Object Definition Type Map** translates a raw `object.definition.type` IRI into one of four ClickHouse `object_type` values.
- The **Control Object Type** keeps a slider or button out of page-engagement rollups and inside the concept rollup instead.
- The **Concept Extension Field** lets a producer attach one authoritative `concept_id` to a Statement's context.
- The **Concept Enrichment Path** is the deferred, server-side alternative for Statements that omit the extension.
- The **Start Pause Dwell Pattern** compresses a run interval into one Experienced Verb statement, emitted at Pause.
- The **Visibility Change Flush** emits that same statement immediately if a student switches tabs mid-run.
- A **Producer Excluded Field** is any value only the server is authoritative over.
- **District ID Server-Assigned** and **Student Key Server-Derived** mean tenancy and identity are never left to the client to claim.
- The **Stored At Gateway Timestamp** records arrival time, distinct from the producer-supplied `timestamp`.
- Every write carries an **xAPI Transport Header** and an **API Version Header**, in a body that is always a JSON array.
- The **Reference Statement Example** is one working Statement that satisfies every rule at once.
- The **Field To Column Map** traces each JSON field to its ClickHouse column and eventual Neo4j property.

## Closing the Loop

Go back to the capstone this course was building toward from its first page: designing a persona-facing report or dashboard that traces from a raw xAPI statement to the decision it informs. Every rule in this chapter exists to make that trace possible. Chapter 1 introduced the vocabulary — Actor, Verb, Object, Result, Context — a Statement is built from. Part 2 described everything that happens to a conformant Statement after it arrives: validation, pseudonymization, compression into summary vertices, storage in a property graph. Part 3 showed what those vertices become in the hands of three different people — a district administrator's adoption dashboard, a teacher's mastery heatmap, a textbook author's experiment readout.

None of that works without this chapter. A single xAPI Statement, shaped the way the producer contract requires — a Canonical Activity IRI, one of three verbs, a Textbook Version Grouping IRI, no field a producer has no right to claim — is the one artifact that flows through every architecture chapter in Part 2 and lands in every persona's dashboard in Part 3. One standards-based record, produced correctly at the edge of the system, becomes three different decisions at the other end: whether to expand a rollout, whether to check in with a struggling student, whether to ship a new version of a chapter. That is the arc this book has traced, from a Learning Management System's narrow completion flag in Chapter 1 to a single, well-formed Statement carrying enough evidence to answer all three questions at once.

!!! mascot-celebration "The Record, Followed All the Way"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    We started this book with a satchel full of learning records and a simple question: how do we know what a learner actually did? Thirty-two chapters later, you have followed one answer from a Statement's first JSON character to a district administrator's dashboard, a teacher's roster, and a textbook author's experiment readout. You know the standards, the architecture, and now exactly what it takes to write a Statement worth trusting in the first place. What does the evidence show? A book's worth of learning, recorded the way it happened. Let's follow the record.
