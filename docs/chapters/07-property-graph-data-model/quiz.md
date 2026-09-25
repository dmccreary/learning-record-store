---
title: "Quiz: The Property Graph Data Model"
description: Review questions on nodes, relationships, the content tree, the Learning Graph DAG, summary-vertex relationships, the Verb Controlled Vocabulary, Experiment/Variant nodes, and graph constraints.
social:
   cards: false
---
# Quiz: The Property Graph Data Model

Test your understanding of this project's Neo4j property graph — its node labels, relationship types, and the constraints that keep it honest — with these review questions.

---

#### 1. In a labeled property graph, what are the only two kinds of thing that exist?

<div class="upper-alpha" markdown>
1. Tables and columns
2. Documents and collections
3. Nodes and relationships
4. Files and directories
</div>

??? question "Show Answer"
    The correct answer is **C**. A labeled property graph is built from exactly two primitives — nodes, which represent entities, and relationships, which connect exactly two nodes — and nothing else exists in the model. A and B describe relational and document-database concepts, not a property graph. D describes filesystem structure, unrelated to this data model.

    **Concept Tested:** Labeled Property Graph

---

#### 2. According to this project's naming convention, how can a reader immediately tell a Node Label apart from a Relationship Type in a diagram or Cypher query?

<div class="upper-alpha" markdown>
1. Node Labels are written in PascalCase (e.g., `District`); Relationship Types are written in SCREAMING_SNAKE_CASE (e.g., `HAS_SCHOOL`)
2. Node Labels are always plural, while Relationship Types are always singular
3. Node Labels appear in lowercase, while Relationship Types appear in PascalCase
4. There is no consistent convention; each one must be looked up in the DDL individually
</div>

??? question "Show Answer"
    The correct answer is **A**. Node Labels are written in PascalCase, such as `District` or `TextbookVersion`, while Relationship Types are written in capital letters with underscores, such as `HAS_SCHOOL` or `DEPENDS_ON`, letting a reader tell them apart on sight. B invents a plural/singular rule not stated anywhere in the chapter. C reverses the actual casing convention. D is wrong because the chapter explicitly describes a consistent, documented convention.

    **Concept Tested:** Node Label / Relationship Type

---

#### 3. Why does this project's graph store a Textbook and its Textbook Version as two separate node labels rather than overwriting a Textbook's properties in place on every revision?

<div class="upper-alpha" markdown>
1. Because Neo4j does not allow updating existing node properties
2. Because Textbook nodes are read-only once created and can never be modified
3. Because each district requires its own separate Textbook node
4. Because keeping every version as its own node lets the system run two different textbook versions side by side for the same course, which A/B experiments rely on
</div>

??? question "Show Answer"
    The correct answer is **D**. Keeping each revision as its own `TextbookVersion` node, connected back through `VERSION_OF`, is what lets two versions of the same textbook run side by side for the same course — directly supporting the A/B experiment mechanism Chapter 31 covers. A is factually false about Neo4j's capabilities. B mischaracterizes Textbook nodes, which can gain new versions over time. C is wrong because a Textbook definition is explicitly shared across districts, not duplicated per district.

    **Concept Tested:** Textbook / Textbook Version

    **See:** [The Content Tree: Textbook Down to Page](index.md#the-content-tree-textbook-down-to-page)

---

#### 4. What is the structural difference between the `CONTAINS` and `EMBEDS` relationship types in the content tree?

<div class="upper-alpha" markdown>
1. `CONTAINS` and `EMBEDS` are interchangeable names for the same relationship
2. `CONTAINS` expresses hierarchy, such as a Chapter belonging inside a Textbook; `EMBEDS` expresses a Page pulling in an interactive or assessment element that could, in principle, be reused elsewhere
3. `EMBEDS` only connects Concept nodes to other Concept nodes, while `CONTAINS` connects everything else
4. `CONTAINS` is used only for MicroSim nodes, while `EMBEDS` is used only for Quiz nodes
</div>

??? question "Show Answer"
    The correct answer is **B**. `CONTAINS` expresses structural hierarchy in the content tree, while `EMBEDS` expresses a page pulling in an interactive or assessment element that is conceptually reusable rather than strictly nested. A wrongly treats the two as synonyms. C misattributes `EMBEDS` to Concept nodes, which it never touches. D wrongly restricts each relationship type to only one node label.

    **Concept Tested:** CONTAINS / EMBEDS

    **See:** [The Content Tree: Textbook Down to Page](index.md#the-content-tree-textbook-down-to-page)

---

#### 5. What does the `COVERS` relationship connect?

<div class="upper-alpha" markdown>
1. A Page, MicroSim, or Question to the Concept or Concepts it addresses
2. A Student to a ConceptMastery vertex
3. A Textbook to its published Textbook Version
4. An Experiment to its Variant arms
</div>

??? question "Show Answer"
    The correct answer is **A**. `COVERS` runs from `{Page, MicroSim, Question}` to `Concept`, answering which concepts a given piece of content or a question actually addresses. B describes `HAS_MASTERY`, a different relationship entirely. C describes `VERSION_OF`. D describes `HAS_VARIANT`, unrelated to concept coverage.

    **Concept Tested:** Covers Relationship

    **See:** [The Concept Node and the Learning Graph DAG](index.md#the-concept-node-and-the-learning-graph-dag)

---

#### 6. A graph query finds a `DEPENDS_ON` edge running from the Concept node "Cellular Respiration" to the Concept node "Photosynthesis." What does this edge mean?

<div class="upper-alpha" markdown>
1. Photosynthesis depends on Cellular Respiration, so Cellular Respiration should be learned first
2. The two concepts are mutually dependent and can be learned in either order
3. Cellular Respiration depends on Photosynthesis, so Photosynthesis should be learned first
4. Photosynthesis and Cellular Respiration belong to the same Chapter node
</div>

??? question "Show Answer"
    The correct answer is **C**. A `DEPENDS_ON` edge runs from the dependent concept to its prerequisite, so an edge from Cellular Respiration to Photosynthesis means Cellular Respiration depends on Photosynthesis, which should be learned first. A reverses the direction of dependency. B contradicts the DAG's acyclic requirement, which forbids mutual dependency. D confuses concept dependency with unrelated content-tree containment.

    **Concept Tested:** Learning Graph DAG / Depends On Relationship

    **See:** [The Concept Node and the Learning Graph DAG](index.md#the-concept-node-and-the-learning-graph-dag)

---

#### 7. What distinguishes a "materialized summary vertex" like `ConceptMastery` from the rest of the graph's structural node labels?

<div class="upper-alpha" markdown>
1. It is stored in the event store rather than the property graph
2. It has no uniqueness constraint applied to it, unlike structural nodes
3. It is created directly by the Ingestion Gateway before any processing occurs
4. It is compressed from many raw statements rather than describing fixed content structure, and it changes as new evidence about a student arrives
</div>

??? question "Show Answer"
    The correct answer is **D**. A materialized summary vertex is built from many raw statements rather than describing fixed content structure like a Textbook or Chapter, and it updates as new evidence arrives. A is wrong because summary vertices live in the property graph, not the event store. B is wrong because summary vertices get a composite uniqueness constraint. C is wrong because the Ingestion Gateway performs only structural validation, not summary creation.

    **Concept Tested:** Summary Vertex (materialized)

    **See:** [From Evidence to Summary Vertices](index.md#from-evidence-to-summary-vertices)

---

#### 8. A dashboard needs to answer the question "which Concept does this ConceptMastery vertex summarize evidence for?" Which relationship should the query follow, and in which direction?

<div class="upper-alpha" markdown>
1. `HAS_MASTERY`, from Student to ConceptMastery
2. `OF_CONCEPT`, from ConceptMastery to Concept
3. `COVERS`, from Concept to ConceptMastery
4. `TOUCHED`, from ConceptMastery to Concept
</div>

??? question "Show Answer"
    The correct answer is **B**. `OF_CONCEPT` ties a `ConceptMastery` vertex back into the Learning Graph DAG, running from the vertex to the specific Concept it summarizes evidence for. A describes a different edge that links a Student to their mastery evidence, not the evidence to its concept. C reverses `COVERS`'s actual direction and endpoints. D misapplies `TOUCHED`, which connects sessions to content, not mastery vertices to concepts.

    **Concept Tested:** Has Mastery Relationship / Of Concept Relationship

    **See:** [From Evidence to Summary Vertices](index.md#from-evidence-to-summary-vertices)

---

#### 9. What does a `TOUCHED` relationship's own properties, `event_count` and `dwell_ms`, let a query answer without a separate lookup?

<div class="upper-alpha" markdown>
1. How many events occurred and how much time was spent, directly from the edge itself
2. Which district the LearningSession belongs to
3. Which Verb was used in each underlying xAPI statement
4. Whether the session's ConceptMastery vertex has been recomputed yet
</div>

??? question "Show Answer"
    The correct answer is **A**. Because `event_count` and `dwell_ms` live directly on the `TOUCHED` edge, a query can answer "how many events, and how much time" without a separate lookup elsewhere in the graph. B, C, and D each name information the edge does not carry — district, verb, or mastery-recomputation status are tracked elsewhere, not on this edge.

    **Concept Tested:** Touched Relationship

    **See:** [From Evidence to Summary Vertices](index.md#from-evidence-to-summary-vertices)

---

#### 10. An administrator wants to build a vocabulary browser listing every recognized xAPI verb and its display text. Given what this chapter says about the Verb node, what should the browser's query expect?

<div class="upper-alpha" markdown>
1. A `DEPENDS_ON` traversal from each Verb to related Concepts
2. A `COVERS` edge connecting each Verb to the Questions that use it
3. A `HAS_VARIANT` edge connecting each Verb to its Experiment
4. To read Verb nodes directly as a lookup table, since no relationship type connects them to any other node in the graph
</div>

??? question "Show Answer"
    The correct answer is **D**. The Verb node is unusual precisely because it participates in no relationship type at all — statements reference a verb by `verb_id` from the event store, but the Verb node itself exists purely as a lookup table for tools like the vocabulary browser. A, B, and C each invent a relationship type connecting Verb to something else, which the chapter explicitly says does not exist.

    **Concept Tested:** Verb Controlled Vocabulary

    **See:** [The Verb Controlled Vocabulary](index.md#the-verb-controlled-vocabulary)

---

#### 11. This project's DDL gives `ConceptMastery` a composite uniqueness constraint on `(student_key, concept_id)` rather than a single-property constraint. What does this specifically guarantee, and why does it matter?

<div class="upper-alpha" markdown>
1. It guarantees that no two students can ever share the same concept_id
2. It guarantees that ConceptMastery vertices are automatically deleted after one academic year
3. It guarantees the compression pipeline can only ever have one ConceptMastery vertex per student-concept pair, preventing it from accidentally creating duplicate summary vertices for the same grain
4. It guarantees that a student's mastery score can never decrease once written
</div>

??? question "Show Answer"
    The correct answer is **C**. The composite key `(student_key, concept_id)` is the vertex's grain — the exact combination the summary represents — so the constraint ensures the compression pipeline can only ever update one vertex per student-concept pair, never create a duplicate. A misreads the constraint as restricting concept_id sharing across all students, which is not what a composite key does. B and D each invent an unrelated behavior — automatic deletion or a one-way score — that the constraint does not enforce.

    **Concept Tested:** Concept Mastery Vertex (grain / composite constraint)

    **See:** [Constraints: What Keeps the Graph Honest](index.md#constraints-what-keeps-the-graph-honest)

---

#### 12. Why does this project's graph DDL deliberately include no `:Statement` label or constraint at all?

<div class="upper-alpha" markdown>
1. Because Statements are considered temporary data not worth protecting with a constraint
2. Because the graph is never supposed to hold one node per raw event — only structure and compressed summaries built from many events at once, with raw statements living in the event store instead
3. Because Statement data is stored exclusively in the PII Vault
4. Because Neo4j cannot enforce uniqueness constraints on event-like data
</div>

??? question "Show Answer"
    The correct answer is **B**. The design specification is direct that the graph holds only structure and compressed summaries — never one node per raw event — so there is deliberately no `:Statement` label, with every raw statement instead living in the event store from the Storage Plane. A mischaracterizes statements as unimportant, when they are in fact the system's permanent source of truth, just stored elsewhere. C misplaces statement data in the PII Vault, which holds only identity mappings. D is a false general claim about Neo4j's capabilities.

    **Concept Tested:** Labeled Property Graph (structure vs. raw events)

    **See:** [Constraints: What Keeps the Graph Honest](index.md#constraints-what-keeps-the-graph-honest)

---
