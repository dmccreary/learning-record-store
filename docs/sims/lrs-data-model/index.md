---
title: LRS Graph Data Model Explorer
description: Interactive vis-network diagram of the Learning Record Store graph data model. Click any node label or relationship to see its properties and enumerated metadata.
image: /sims/lrs-data-model/lrs-data-model.png
og:image: /sims/lrs-data-model/lrs-data-model.png
twitter:image: /sims/lrs-data-model/lrs-data-model.png
social:
   cards: false
status: built
quality_score: 0
---

# LRS Graph Data Model Explorer

[Run the LRS Graph Data Model Explorer Fullscreen](./main.html){ .md-button .md-button--primary }

!!! tip "Open this one fullscreen"
    The full model is 25 node labels and 42 relationships. The embedded preview
    below is legible enough to get your bearings, but the relationship labels
    only become readable once you open it fullscreen and zoom in.

<iframe src="main.html" height="642px" width="100%" scrolling="no"></iframe>

## About This MicroSim

This MicroSim renders the Learning Record Store (LRS) **graph data model** from
[the specification](../../specs/lrs-spec-v1.md) (&sect;4) as an interactive
[vis-network](https://visjs.github.io/vis-network/docs/network/) diagram.

Every **node label** (District, Section, Student, TextbookVersion, MicroSim,
ConceptMastery, Experiment, ...) and every **relationship** (`HAS_SECTION`,
`ENROLLED_IN`, `DEPLOYS`, `HAS_MASTERY`, `SUMMARIZES`, `DEPENDS_ON`, ...) in the
model appears in the graph. Nodes are colored by category:

- **Tenancy** (blue) — the district → school → course → section → student hierarchy
- **Content** (green) — the textbook, chapter, page, MicroSim, quiz, question, and concept structure
- **Summary** (orange) — the compressed vertices: `ConceptMastery`, `PageEngagement`, `MicroSimEngagement`, `QuestionResponse`, `LearningSession`, `SectionRollup`
- **Vocabulary** (grey) — the controlled `Verb` vocabulary
- **Experiment** (purple) — the A/B testing `Experiment` and `Variant` nodes
- **Event store** (dashed red cylinder) — **not part of the graph**; see below

Solid grey arrows are graph relationships. Dashed **orange** arrows are the
compression pipeline and dashed grey is a property reference — neither is stored
in the graph.

## The Thing Worth Noticing: There Is No `Statement` Vertex

The obvious way to model learning events is one graph vertex per xAPI statement:
`(:Student)-[:PERFORMED]->(:Statement)-[:ABOUT]->(:Page)`. **The LRS does not do
this, and the specification prohibits it** (&sect;5.6, requirement C-1).

The reason is arithmetic. At the specified ingest rate of 10,000 statements/sec,
one vertex per event would add roughly **144 million vertices per day** — about
4.3 billion vertices in a 30-day window — and demand on the order of **50,000
graph writes/sec**. No property-graph engine operates there. And nothing would
read it: every report in the specification is an *aggregate*.

So the statements stay in the **event store** (the dashed red cylinder — drawn on
the canvas to show you where they are, but *not* a graph vertex), and a
**compression pipeline** distills them into the orange **summary vertices**, one
per analytical grain:

| Summary vertex | One vertex per… | Compresses |
|----------------|-----------------|------------|
| `ConceptMastery` | (Student, Concept) | ~100 evidence statements → 1 |
| `PageEngagement` | (Student, Page) | ~40 views, scrolls, dwell pings → 1 |
| `MicroSimEngagement` | (Student, MicroSim) | ~60 interactions → 1 |
| `QuestionResponse` | (Student, Question) | ~3 attempts → 1 |
| `LearningSession` | (Student, Session) | ~60 statements in one sitting → 1 |
| `SectionRollup` | (Section, Concept) | a whole class → 1 (~3,000:1) |

A student who visits a page fifty times still has exactly **one**
`PageEngagement` vertex — the fiftieth visit updates it rather than growing the
graph. Every summary carries a `statements_compressed` property recording how
many statements it stands for, so each figure knows how much evidence is behind
it.

Nothing is lost: the full statements remain queryable in the event store. The
compression decides only what gets *materialized in the graph*.

## How to Use

- **Click a node** to see its stored properties as a numbered list, plus any
  **enumerated metadata** — for example, `MicroSim.status` (scaffold / built /
  approved) or `Question.bloom_level` (Remember ... Create). The panel also lists
  every relationship the node participates in.
- **Click an orange summary vertex** to see its **grain**, its **compression
  ratio**, and exactly what it compresses.
- **Click the red cylinder** to see what the event store holds and why it is
  deliberately outside the graph.
- **Click a relationship** (edge) to see what it connects, a description of its
  meaning, and any **edge properties** — for example, `ENROLLED_IN` carries
  `enrolled_at` and a `status` enumeration, and `TOUCHED` carries `event_count`
  and `dwell_ms`.
- **Drag a node** to pull it away from the cluster and declutter the view.
- Use the **navigation buttons** (lower left) to zoom and pan.

## Iframe Embed Code

You can add this MicroSim to any web page by adding this to your HTML:

```html
<iframe src="https://dmccreary.github.io/learning-record-store/sims/lrs-data-model/main.html"
        height="642px"
        width="100%"
        scrolling="no"></iframe>
```

## Lesson Plan

### Level
Undergraduate / professional — data engineers, learning-analytics designers, and
instructors evaluating an LRS.

### Duration
10–15 minutes

### Learning Objective (Bloom: Analyze / Evaluate)
Given the LRS specification, learners **analyze** how the entities of a
learning-analytics graph relate to one another, and **evaluate** why a
high-volume event stream must be compressed before it is materialized as graph
vertices.

### Prerequisites
- Familiarity with the [xAPI](https://xapi.com/) Actor–Verb–Object statement model
- Basic understanding of a labeled property graph (nodes, edges, properties)

### Activities

1. **Exploration** (4 min): Click through each category of node and read its
   properties. Note which nodes store pseudonymous keys and which store no PII.
2. **Do the arithmetic** (5 min): Click the red **Event Store** cylinder. At
   10,000 statements/sec, compute how many statements arrive in one 6-hour school
   day. (~216 million.) If each became a vertex with three edges, how many graph
   writes per second would that demand? (~40,000.) Decide for yourself whether a
   graph database should be asked to do this.
3. **Follow the compression** (5 min): Click each orange summary vertex and record
   its grain and ratio. Why is `QuestionResponse` only ~3:1 while `SectionRollup`
   is ~3,000:1? What does that tell you about what controls the ratio?
4. **Trace a learner** (4 min): Starting from `Student`, follow `HAS_MASTERY` to
   `ConceptMastery`, then `OF_CONCEPT` to `Concept` and `IN_CONTEXT_OF` to
   `TextbookVersion`. Explain how evidence is attributed to a textbook version
   even though the individual statements are not in the graph.
5. **Enumerations** (2 min): Find every node or edge carrying an enumerated
   property (e.g. `MicroSim.status`, `Question.bloom_level`, `Experiment.status`,
   `ENROLLED_IN.status`) and list the allowed values.

### Assessment
- Why is there no `Statement` vertex in this model? Give the quantitative reason,
  not just "it would be big."
- Where do the raw xAPI statements actually live, and are they lost? (The event
  store; no — they stay queryable at full fidelity. Compression only decides what
  is *materialized in the graph*.)
- A student views one page 50 times. How many `PageEngagement` vertices exist
  afterward, and which property records the 50? (One; `statements_compressed`.)
- `SectionRollup` compresses ~3,000:1 but `QuestionResponse` only ~3:1. Explain
  what determines a grain's compression ratio.
- Which relationship encodes the learning-graph prerequisite DAG? (`DEPENDS_ON`)
- Name the six summary vertices and the grain each is keyed on.

## References

1. [LRS Specification &sect;4 — Graph Data Model](../../specs/lrs-spec-v1.md)
2. [vis-network documentation](https://visjs.github.io/vis-network/docs/network/)
3. [xAPI (Experience API) specification](https://github.com/adlnet/xAPI-Spec)
