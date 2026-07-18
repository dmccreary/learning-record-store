---
title: The Property Graph Data Model
description: A complete tour of this project's Neo4j property graph — every node label from Textbook and Chapter down to Concept, Verb, and Question, and every relationship type that connects them, grounded in the graph data model and Neo4j DDL specs.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 07:51:49
version: 0.09
---

# The Property Graph Data Model

## Summary

This chapter is a complete tour of the Neo4j property graph: every node label from Textbook and Chapter down to Concept and Question, and every relationship type that connects them, including the DEPENDS_ON edges that form the concept DAG itself. It closes with the graph's controlled verb vocabulary and the Experiment/Variant nodes used for A/B testing.

## Concepts Covered

This chapter covers the following 21 concepts from the learning graph:

1. Labeled Property Graph
2. Node Label
3. Relationship Type
4. Textbook
5. Textbook Version
6. Chapter
7. Page
8. MicroSim
9. MicroSim Version
10. Quiz
11. Question
12. Concept
13. Learning Graph DAG
14. Depends On Relationship
15. Covers Relationship
16. Has Mastery Relationship
17. Of Concept Relationship
18. Touched Relationship
19. Verb Controlled Vocabulary
20. Experiment Node
21. Variant Node

## Prerequisites

This chapter builds on concepts from:

- [Chapter 1: From Learning Management Systems to the Experience API](../01-lms-to-experience-api/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)

---

!!! mascot-welcome "What does District actually look like in the graph?"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 6 gave you District, School, Section, and Student as names in a hierarchy, and told you the graph was where that hierarchy actually lives. This chapter opens the graph itself and shows you exactly what a District, a Concept, or a Student looks like once it is stored — down to the property names. Let's follow the record.

This project's Learning Record Store stores its structural knowledge — districts, textbooks, concepts, and everything that connects them — as a **labeled property graph**. A labeled property graph is a data model built from two kinds of thing only: nodes and relationships. A node represents one entity — one district, one page, one student — and carries a small set of named attributes called properties. A relationship connects exactly two nodes and, just like a node, can carry its own properties. Nothing else exists in this model; every fact you will meet in this chapter is either a node or a relationship between two nodes.

This project's specification, `lrs-spec-v1.md` §4, is explicit about the naming convention that makes the graph readable at a glance: every **Node Label** — the tag that names what kind of entity a node is — is written in PascalCase, such as `District` or `TextbookVersion`, while every property on a node or relationship is written in `snake_case`, such as `district_id` or `mastery_score`. A **Relationship Type** is the analogous tag for a connection between two nodes, also written in capital letters with underscores, such as `HAS_SCHOOL` or `DEPENDS_ON`. Once you know that convention, you can read any diagram in this chapter — or any Cypher query later in the book — and immediately tell nodes apart from relationships just by their capitalization.

Before looking at a diagram, it helps to see the two primitives named side by side, since everything else in this chapter is one or the other.

- **Node Label** — a PascalCase tag naming an entity type, such as `Concept` or `MicroSim`. A single node can carry more than one label, though this project's graph does not currently use that feature.
- **Relationship Type** — a SCREAMING_SNAKE_CASE tag naming a connection between exactly two nodes, such as `COVERS` or `TOUCHED`. Every relationship has a direction — a `from` node and a `to` node — even when the real-world fact it represents feels symmetrical.

!!! mascot-thinking "Two kinds of thing, one whole graph"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    This project's design specification draws one more line worth holding onto before you meet any individual node label: the graph holds exactly two kinds of thing — **structure** (the tenancy hierarchy, the content tree, the concept dependency graph, experiments) and **compressed summaries** of learner activity. It does not hold the statement log itself; every raw event lives in the event store, and only a compressed trace of it ever reaches the graph. Keep that boundary in mind as you read — it explains why several node labels in this chapter feel like *evidence about* a student rather than a record *of* something a student did.

## The Content Tree: Textbook Down to Page

Every intelligent textbook this LRS ingests statements from has a structure of its own, entirely separate from the district-and-classroom structure Chapter 6 covered. This project's specification names that structure the content tree, and it starts with the **Textbook** node label: a `textbook_id`, a `title`, and a `repo_url`, representing one textbook as a *definition* — independent of any district that happens to deploy it. A single Textbook can be assigned to courses in many different districts at once, which is why the specification calls it "district-independent": the definition is shared, even though (as Chapter 6 established) each district's event stream stays isolated.

A Textbook, though, is not a fixed, unchanging thing — it gets revised. That is what the **Textbook Version** node label represents: `version_id`, `semver`, `git_sha`, and `published_at`, one node per published revision of a textbook, connected back to its parent Textbook through the `VERSION_OF` relationship. Keeping every version as its own node, rather than overwriting a Textbook's properties in place, is what lets this system run two different textbook versions side by side for the same course — the mechanism Chapter 31 returns to when it covers A/B experiments in depth.

Below the textbook level, the tree narrows into familiar reading-order structure. A **Chapter** node (`chapter_id`, `order`, `title`) belongs to a Textbook, and a **Page** node (`page_id`, `path`, `title`, `word_count`) belongs to a Chapter. This project's specification connects both levels with the same relationship type, `CONTAINS`, read as "Textbook contains Chapter, Chapter contains Page" — one relationship type doing structural duty at two different levels of the tree, exactly the way `HAS_SCHOOL`, `OFFERS`, and `HAS_SECTION` each did one job at one level of Chapter 6's Tenancy Hierarchy.

A Page is rarely just prose. It can embed an interactive element or a graded check, and this project's graph has a node label for each. A **MicroSim** node (`microsim_id`, `type`, `title`, `status`) represents one interactive simulation embedded on a page — the graph's record that "this page has a p5.js sketch, and here is its build status," not the sketch's actual code or content. The `status` property takes one of three values: scaffold, built, or approved, tracking the interactive element through its own production lifecycle.

!!! mascot-tip "Two different things share the word 'MicroSim'"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    Keep two senses of "MicroSim" apart as you read this book. Every interactive diagram, chart, or simulation you have clicked through in this textbook — including the ones in this very chapter — is a MicroSim in the everyday, authoring sense: an actual p5.js or vis-network file living under `docs/sims/`. The `MicroSim` **node label** described here is different: it is the graph's structural record *about* one of those interactive elements — an ID, a title, a status flag — not the interactive element itself. When this chapter says "a MicroSim node," it always means the graph entity; everything else in this book that says "MicroSim" means the interactive file a student actually clicks on.

Just as a Textbook can have multiple published versions, a MicroSim can have multiple published revisions of its own code, tracked by the **MicroSim Version** node label (`msv_id`, `semver`, `git_sha`), connected to its parent MicroSim through `HAS_VERSION`. This exists for the same reason Textbook Version does: it lets a specific version of an interactive element be assigned to one experimental arm and a different version to another, which Chapter 31 uses directly.

A Page can also embed a **Quiz** node (`quiz_id`, `title`), which in turn contains one or more **Question** nodes (`question_id`, `bloom_level`, `concept_ref`) through the same `CONTAINS` relationship type used higher up the tree. Notice that a Question already carries a `bloom_level` property and a `concept_ref` — a first hint that questions are not just content, they are also evidence, tagged against both a cognitive level and a concept before a single student has ever answered one. The relationship connecting a Page to the MicroSim or Quiz it embeds is `EMBEDS`, distinct from `CONTAINS`: containment is about hierarchy (a Chapter belongs inside a Textbook), while embedding is about one page pulling in an interactive or assessment element that could, in principle, be reused elsewhere.

The table below organizes every content-tree node label just introduced, now that each one has been explained in the prose above.

| Node Label | Key Properties | What It Represents |
|---|---|---|
| `Textbook` | `textbook_id`, `title`, `repo_url` | A textbook definition, shared across districts |
| `TextbookVersion` | `version_id`, `semver`, `git_sha`, `published_at` | One published revision of a Textbook |
| `Chapter` | `chapter_id`, `order`, `title` | One chapter within a Textbook |
| `Page` | `page_id`, `path`, `title`, `word_count` | One page within a Chapter |
| `MicroSim` | `microsim_id`, `type`, `title`, `status` | The graph's record of one interactive element |
| `MicroSimVersion` | `msv_id`, `semver`, `git_sha` | One published revision of a MicroSim |
| `Quiz` | `quiz_id`, `title` | A graded check embedded on a Page |
| `Question` | `question_id`, `bloom_level`, `concept_ref` | One item within a Quiz |

With every content-tree node label defined and organized above, the diagram below renders the whole tree as an actual graph, so you can see the labels and relationship types working together rather than as isolated table rows.

#### Diagram: The Content Tree — From Textbook to Concept

<iframe src="../../sims/content-tree-graph-model/main.html" width="100%" height="602px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Content Tree — From Textbook to Concept</summary>
Type: graph-model
**sim-id:** content-tree-graph-model<br/>
**Library:** vis-network<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/concept-to-content-viewer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: identify, describe

Learning objective: Let the learner identify every content-tree node label from Textbook down to Concept, and describe which relationship type connects each pair, exactly as cataloged in this project's specification §4.1–§4.2.

Purpose: Render the full content-tree portion of the graph data model as an interactive vis-network diagram, using this project's actual node labels and relationship types, so the learner can see the tree from the spec as a real graph rather than a table.

Nodes (colored by node label, one color per label): `Textbook`, `TextbookVersion`, `Chapter`, `Page`, `MicroSim`, `MicroSimVersion`, `Quiz`, `Question`, `Concept`. Layout: hierarchical, top to bottom, Textbook at the top.

Edges, each labeled with its relationship type and drawn as a directed arrow: `TextbookVersion` → `Textbook` (`VERSION_OF`); `Textbook` → `Chapter` (`CONTAINS`); `Chapter` → `Page` (`CONTAINS`); `Page` → `MicroSim` (`EMBEDS`); `Page` → `Quiz` (`EMBEDS`); `MicroSim` → `MicroSimVersion` (`HAS_VERSION`); `Quiz` → `Question` (`CONTAINS`); `Page` → `Concept` (`COVERS`); `MicroSim` → `Concept` (`COVERS`); `Question` → `Concept` (`COVERS`).

Interactive features: Clicking any node opens an infobox listing that node label's key properties, matching the table in this chapter's prose exactly. Clicking any edge opens an infobox naming the relationship type, its direction (from → to), and a one-sentence description of what it structurally means. Hovering over a node highlights all of its direct edges and dims the rest of the graph so the learner can trace one node's connections in isolation.

Color scheme: Each node label gets a distinct, consistent color from the book's palette (Textbook and TextbookVersion in one hue-pair, Chapter and Page in a second, MicroSim/MicroSimVersion/Quiz/Question in a third, Concept in the book's teal accent color to visually mark it as the bridge into the learning graph proper).

Responsive design: The network canvas resizes to the width of its containing element on window resize, using vis-network's built-in responsive container option; on narrow (mobile) viewports the hierarchical layout switches from top-to-bottom to left-to-right to make better use of vertical scroll space.
</details>

## The Concept Node and the Learning Graph DAG

Every content-tree node label you just met eventually points toward the same destination: a **Concept** node (`concept_id`, `label`, `taxonomy_category`). This is not a new idea introduced for the graph's sake — it is the literal graph representation of the same learning graph this book's own chapter-by-chapter structure is built from. Every numbered item you have seen in a chapter's "Concepts Covered" list corresponds, in this LRS, to one `Concept` node.

A Page, a MicroSim, or a Question does not exist in isolation from the concepts it teaches or tests. This project's specification connects each of them to the concepts they address through the **Covers Relationship** — written `COVERS` in the graph, running from `{Page, MicroSim, Question}` to `Concept`. Reading a `COVERS` edge answers a concrete question: "which concepts does this page, this simulation, or this quiz question actually address?" That mapping is what eventually lets a dashboard say "this student has seen material covering Photosynthesis three times" instead of just "this student visited three pages."

Concepts do not stand alone from each other, either. This project's specification defines the **Learning Graph DAG** — a directed acyclic graph built entirely from Concept nodes and one relationship type connecting them, the **Depends On Relationship**, written `DEPENDS_ON` in the graph. A `DEPENDS_ON` edge runs from a concept to the concept it depends on — the same dependency direction used throughout this book's own learning graphs — so a `DEPENDS_ON` edge from Photosynthesis to Cellular Respiration means "Photosynthesis depends on Cellular Respiration," not the other way around. "Acyclic" is not a decorative adjective here: this project's design specification requires the concept graph to stay free of cycles, because a cycle would make it impossible to answer "what should a student learn first" — the reconciliation worker checks every newly added `DEPENDS_ON` edge for cycles before promoting it, and rejects the whole batch if one would be introduced.

!!! mascot-warning "DEPENDS_ON points toward the prerequisite, not away from it"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is tempting to read a `DEPENDS_ON` arrow the way you might read a syllabus — as pointing forward, from an easier concept toward a harder one it unlocks. This project's graph does the opposite: the arrow starts at the *dependent* concept and points at its *prerequisite*. If you ever write a query and get every student's mastery gaps backwards, check whether you followed the arrow in the direction it is actually drawn rather than the direction that feels intuitive.

#### Diagram: DAG Viewer

<iframe src="../../sims/dag-viewer/main.html" width="100%" height="522px" scrolling="no"></iframe>

<details markdown="1">
<summary>DAG Viewer (reused MicroSim)</summary>
Type: graph-model
**sim-id:** dag-viewer<br/>
**Library:** vis-network<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/graph-algorithms/sims/dag-viewer/main.html<br/>
**Source Repo:** https://github.com/dmccreary/graph-algorithms/tree/main/docs/sims/dag-viewer

Reused from the MicroSim catalog (WHAT match score 0.7818). Learning objective: Let the learner explore a hierarchical, left-to-right rendering of a concept dependency graph built from `DEPENDS_ON` edges, and see how nodes with no outgoing edges sit at the foundation of the graph while nodes with many outgoing edges depend on several prerequisites at once — directly illustrating the Learning Graph DAG structure this project's Concept nodes form.
</details>

## From Evidence to Summary Vertices

The content tree and the Learning Graph DAG are both **structure** — they describe what a textbook contains and how its concepts relate, and neither one changes when a student clicks a page. The rest of this chapter's relationship types are different: they connect a Student to *evidence about that student*, and every one of them points at a node label this project's specification calls a **materialized summary vertex** — a compressed record built from many raw statements, never from one. Chapter 8 covers exactly how that compression happens; this chapter only needs the shape it leaves behind in the graph.

The clearest example is mastery. This project's specification connects a Student to a `ConceptMastery` vertex through the **Has Mastery Relationship**, written `HAS_MASTERY` in the graph — one edge per concept a student has any evidence for at all. That `ConceptMastery` vertex is, in turn, tied back into the Learning Graph DAG through the **Of Concept Relationship**, written `OF_CONCEPT`, which points from the `ConceptMastery` vertex to the specific `Concept` it summarizes evidence for. Read the two edges together and you get a complete sentence: "this Student has mastery evidence, of this Concept." Neither edge, by itself, tells you *how* that mastery evidence was computed — that mechanism belongs to Chapter 8.

A parallel pattern covers engagement rather than mastery. Every burst of activity a student produces in one sitting is compressed into a `LearningSession` vertex, and this project's specification connects that session to whatever content the student actually interacted with through the **Touched Relationship**, written `TOUCHED` in the graph, running from `LearningSession` to `{Page, MicroSim, Question}`. A `TOUCHED` edge carries its own properties directly — `event_count` and `dwell_ms` — so the edge itself answers "how many events, and how much time" without requiring a separate lookup.

!!! mascot-encourage "You do not need Chapter 8's mechanics yet"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    `HAS_MASTERY`, `OF_CONCEPT`, and `TOUCHED` can feel like they are hinting at something bigger just out of view — and they are. This chapter deliberately stops at "here is the shape these edges take in the graph" and leaves "here is exactly how thousands of raw statements become one `ConceptMastery` vertex" for Chapter 8. You have everything you need from this chapter alone to read a graph query and know what each edge means; the compression pipeline behind it is the next chapter's whole subject.

#### Diagram: From Compressed Evidence to Graph Edges

<iframe src="../../sims/compressed-evidence-graph-edges/main.html" width="100%" height="422px" scrolling="no"></iframe>

<details markdown="1">
<summary>From Compressed Evidence to Graph Edges</summary>
Type: infographic
**sim-id:** compressed-evidence-graph-edges<br/>
**Library:** Mermaid<br/>
**Status:** Specified<br/>
**Template:** https://github.com/dmccreary/learning-graphs/tree/main/docs/sims/graph-viewer<br/>

Bloom Taxonomy: Understand (L2)
Bloom Taxonomy Verb: trace, explain

Learning objective: Let the learner trace how a Student node connects to compressed summary vertices through the Has Mastery, Of Concept, and Touched relationships, and explain what question each edge answers, without needing the compression mechanics Chapter 8 covers.

Purpose: Show two short, parallel Mermaid flowchart branches, both starting from a single "Student" node, so the learner can see the mastery path and the engagement path as structurally similar patterns.

Branch A (mastery path): "Student" —`HAS_MASTERY`→ "ConceptMastery (summary vertex)" —`OF_CONCEPT`→ "Concept".

Branch B (engagement path): "Student" —`HAD_SESSION`→ "LearningSession (summary vertex)" —`TOUCHED`→ "Page / MicroSim / Question", with a small annotation box off the `TOUCHED` edge reading "carries event_count, dwell_ms".

Interactive features: Every node has a Mermaid `click` directive. Clicking "Student" opens an infobox recalling the pseudonymous Student node from Chapter 6. Clicking "ConceptMastery" or "LearningSession" opens an infobox stating that both are materialized summary vertices — compressed from many statements into one — with a note "full compression mechanics: Chapter 8." Clicking "Concept" opens an infobox tying back to the Learning Graph DAG. Clicking the `HAS_MASTERY`, `OF_CONCEPT`, or `TOUCHED` edge label opens an infobox naming the relationship type and its from → to direction, matching this chapter's prose.

Color coding: The mastery branch in the book's teal accent color; the engagement branch in a complementary amber, so the two parallel paths stay visually distinguishable at a glance.

Implementation: Mermaid flowchart with two branches sharing a root node, full click-to-infobox coverage on every node and edge label. Responsive width tracking the containing element.
</details>

## The Verb Controlled Vocabulary

One node label in this catalog behaves differently from every other one you have met so far. This project's specification defines a **Verb** node (`verb_id`, `iri`, `display`) representing the controlled set of action words — *completed*, *attempted*, *answered*, *practiced*, *read*, and the rest — that Chapter 1 introduced as the Verb component of an xAPI Statement. Together, these Verb nodes form this project's **Verb Controlled Vocabulary**: a governed, non-arbitrary list of the actions this LRS recognizes, each with a stable IRI so that "completed" means the exact same thing no matter which Learning Record Provider sent the statement.

What makes the Verb node unusual is what it is *not* connected to. Every other node label in this chapter participates in at least one relationship type — a Textbook contains Chapters, a Student has mastery of Concepts. A Verb node does not. This project's specification states the exception directly: statements reference a verb by its `verb_id` from the event store, but the Verb node itself is not edged to from the graph at all. It exists purely as a lookup table — maintained so that an administrative vocabulary browser can list every recognized verb and its display text, without ever needing a relationship type to connect it to anything else.

## Experiments: Comparing Two Versions in the Wild

The final pair of node labels in this project's graph model supports a capability Chapter 31 covers in full: running a controlled comparison between two versions of the same content. This project's specification defines an **Experiment Node** (`experiment_id`, `hypothesis`, `status`) representing one A/B test definition — for example, "does MicroSim Version 2 improve mastery faster than Version 1?" — and a **Variant Node** (`variant_id`, `arm_label`, `allocation`) representing one arm of that test, such as "Version 1 (control)" or "Version 2 (treatment)."

An Experiment connects to each of its arms through the `HAS_VARIANT` relationship, and — though it falls outside this chapter's concept list — it is worth knowing that a Student later connects to whichever Variant they were assigned through a separate relationship, keeping that assignment sticky for the life of the experiment. Chapter 31 examines exactly how that assignment is made and how results are analyzed; this chapter's job is only to place Experiment and Variant correctly on the map as two more node labels the graph tracks structure for.

The list below reinforces the three node labels just introduced in this section, now that each one's properties have been explained above.

- **Verb** — `verb_id`, `iri`, `display`; the only node label with no relationship type connecting it to the rest of the graph, existing purely as a lookup table for the vocabulary browser.
- **Experiment** — `experiment_id`, `hypothesis`, `status`; one A/B test definition, connected to its arms through `HAS_VARIANT`.
- **Variant** — `variant_id`, `arm_label`, `allocation`; one arm of an experiment, such as a control or treatment group.

## Constraints: What Keeps the Graph Honest

A data model is only as trustworthy as its enforcement. This project's design specification, `lrs-design-v1.md` §6.3, defines the Neo4j Data Definition Language (DDL) that makes every identifier property you have met in this chapter genuinely unique — not by convention, but by a constraint the database itself refuses to violate. A short excerpt shows the pattern:

```cypher
CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.concept_id IS UNIQUE;
CREATE CONSTRAINT microsim_id IF NOT EXISTS FOR (m:MicroSim) REQUIRE m.microsim_id IS UNIQUE;
```

Every entity node label this chapter introduced — District, School, Section, and Student from Chapter 6, plus Textbook, TextbookVersion, Page, MicroSim, and Concept from this chapter — has exactly this kind of single-property uniqueness constraint in the DDL. Attempting to create a second `Concept` node with a `concept_id` that already exists does not silently succeed; Neo4j rejects the write.

The summary vertices this chapter introduced — `ConceptMastery` and `LearningSession` among them — get a stricter kind of constraint: a **composite** uniqueness constraint spanning two properties at once, such as `(student_key, concept_id)` for `ConceptMastery`. That composite key is what this project's specification calls the vertex's *grain* — the exact combination of dimensions one summary vertex represents. Because the grain itself is the unique key, the compression pipeline Chapter 8 describes can only ever update one `ConceptMastery` vertex per student-concept pair; it can never accidentally create a second one. The design specification is direct about what this guards against: there is deliberately no `:Statement` constraint and no `:Statement` label at all, because this graph is never supposed to hold one node per raw event — only structure, and compressed summaries built from many events at once.

With every relationship type from this chapter now explained in prose, the table below organizes all of them together as a single reference, mirroring the structure of this project's own specification §4.2.

| Relationship Type | From → To | What It Connects |
|---|---|---|
| `CONTAINS` | Textbook → Chapter → Page; Quiz → Question | Structural containment in the content tree |
| `EMBEDS` | Page → {MicroSim, Quiz} | A page pulling in an interactive element or a graded check |
| `HAS_VERSION` | MicroSim → MicroSimVersion | One MicroSim's published revisions |
| `VERSION_OF` | TextbookVersion → Textbook | One textbook's published revisions |
| `COVERS` | {Page, MicroSim, Question} → Concept | Concept coverage mapping |
| `DEPENDS_ON` | Concept → Concept | The Learning Graph DAG's prerequisite edges |
| `HAS_MASTERY` | Student → ConceptMastery | A student's mastery evidence for one concept |
| `OF_CONCEPT` | ConceptMastery → Concept | Ties a mastery summary back to the Learning Graph DAG |
| `TOUCHED` | LearningSession → {Page, MicroSim, Question} | What content one session of activity touched |
| `HAS_VARIANT` | Experiment → Variant | One arm of an A/B test |

## Tracing the Whole Model in One Pass

Having met every node label and relationship type this chapter covers, it helps to trace the model end to end once, the same way Chapters 1 and 6 both closed with a cause-and-effect walkthrough.

1. This project's LRS represents structure and compressed evidence as a **labeled property graph**, where every fact is either a **Node Label** or a **Relationship Type** — nothing else.
2. The content tree nests `Textbook → TextbookVersion → Chapter → Page → {MicroSim, MicroSimVersion, Quiz, Question}`, connected by `CONTAINS`, `EMBEDS`, `HAS_VERSION`, and `VERSION_OF`.
3. Every Page, MicroSim, and Question that teaches or tests something connects to a `Concept` through `COVERS`; every Concept connects to its prerequisites through `DEPENDS_ON`, together forming the **Learning Graph DAG**.
4. A Student's compressed evidence reaches the graph through two parallel paths — `HAS_MASTERY` and `OF_CONCEPT` for concept mastery, `TOUCHED` for session-level engagement — both pointing at materialized summary vertices, never at raw statements.
5. The **Verb** node catalogs this project's controlled vocabulary of xAPI verbs but connects to nothing else in the graph; **Experiment** and **Variant** nodes track A/B tests through `HAS_VARIANT`.
6. Every identifier property is protected by a uniqueness constraint from `lrs-design-v1.md` §6.3, and every summary vertex's grain is protected by a composite constraint that makes per-statement nodes structurally impossible.

## Key Takeaways

- A **Labeled Property Graph** represents every fact in this LRS as either a node with a **Node Label** or a connection between two nodes carrying a **Relationship Type**.
- The content tree nests **Textbook**, **Textbook Version**, **Chapter**, and **Page**, with a **MicroSim** and its **MicroSim Version** — the graph's structural record, distinct from the interactive files this book calls MicroSims — embedded alongside a **Quiz** and its **Question** nodes.
- Every **Concept** node connects to the content that teaches it through the **Covers Relationship**, and to its prerequisites through the **Depends On Relationship**, together forming the **Learning Graph DAG**, which must stay acyclic.
- Mastery evidence reaches the graph through the **Has Mastery Relationship** and the **Of Concept Relationship**, connecting a Student to a compressed `ConceptMastery` vertex and back to the Concept it summarizes — full compression mechanics arrive in Chapter 8.
- Session-level engagement reaches the graph through the **Touched Relationship**, connecting a compressed `LearningSession` vertex to whatever content it touched.
- The **Verb Controlled Vocabulary** catalogs recognized xAPI verbs as Verb nodes that connect to nothing else in the graph.
- The **Experiment Node** and **Variant Node** track A/B test definitions and their arms, which Chapter 31 builds on directly.
- Every identifier is protected by a uniqueness constraint, and every summary vertex's grain by a composite constraint, both defined in `lrs-design-v1.md` §6.3 and enforced by Neo4j itself.

!!! mascot-celebration "You just read the whole graph model"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    Every node label and every relationship type this LRS defines has now crossed your desk — the tenancy hierarchy from Chapter 6, and the content tree, the Learning Graph DAG, and the evidence edges from this chapter. What does the evidence show? The shape of every answer this book gives from here forward. Next, in [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md), we open the compression pipeline itself and see exactly how a flood of raw statements becomes the tidy `ConceptMastery` and `LearningSession` vertices you met in this chapter.

