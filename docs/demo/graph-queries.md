---
title: Live Graph Demo — Questions a Spreadsheet Cannot Answer
description: A seven-query walkthrough of the seeded LRS graph in Neo4j Browser — 54 real intelligent textbooks, 15,362 concepts, 4,050 synthetic learners — from the learning graph to root-cause prerequisite analysis.
image: ../img/cover.png
status: draft
---

# Live Graph Demo

**Companion to:** [LRS Specification §4](../specs/lrs-spec-v1.md#4-graph-data-model) · [Design §8.7](../specs/lrs-design-v1.md)
**Audience:** teachers, curriculum staff, and anyone who has been shown a MicroSim and asked "so what?"
**Runs on:** a laptop, on free software, in under three minutes.

A MicroSim shows that a page can be interactive. This shows what happens when thousands
of learners *use* those pages across a whole catalogue of textbooks and the evidence
lands in a graph — which is where the interesting questions start.

The learning graphs here are **real**: every concept, prerequisite edge, and chapter is
imported from the `docs/learning-graph/` committed to each textbook repo. Nothing about
the course content was invented for this demo.

---

## Setup

```bash
docker compose -f deploy/docker-compose.yml up -d neo4j
docker exec -i lrs-neo4j-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" < src/lrs/ddl/neo4j.cypher
uv run lrs seed --showcase          # reads ../ for textbook repos; LRS_TEXTBOOK_ROOT overrides
```

Then open **[http://localhost:7474](http://localhost:7474)**, connect as `neo4j` with the
`NEO4J_PASSWORD` from your `.env`, and paste the queries below into the command bar.

Seeding takes about **2m24s** and produces **1,049,861 nodes and 3,074,472 relationships**:

| | |
|---|---|
| Textbooks | **54** — every repo with a committed learning graph |
| Concepts | **15,362** real, with **24,991** real prerequisite edges |
| Chapters | **726** — the real taxonomy categories from each book |
| MicroSims | **1,363** real, by title |
| Districts / schools / sections | 8 / 40 / 162 |
| Learners | **4,050** pseudonymous, ~75 per textbook |
| Summary vertices | **1,012,101**, representing **22,265,132 xAPI statements** |

!!! warning "What is real and what is synthetic"
    **Real:** concepts, prerequisite edges, taxonomy categories, chapter names, textbook
    titles, MicroSim titles — all imported from the textbook repos.

    **Synthetic:** every learner, district, school, section, page, quiz, and mastery
    score. No real student, teacher, or district appears here, and spec §4.1 keeps
    `Student` pseudonymous by design — there is no PII anywhere in the graph.

    Every node carries `seeded: true`. `uv run lrs seed --clear` removes all of it.

---

## 1. What's in here?

```cypher
MATCH (n) UNWIND labels(n) AS label
RETURN label, count(*) AS count ORDER BY count DESC
```

The three biggest labels — `ConceptMastery` (647,676), `PageEngagement` (332,025), and
`QuestionResponse` (32,400) — are *summaries*, not events. That distinction is the whole
architecture, and query 7 returns to it.

```cypher
// the catalogue itself
MATCH (t:Textbook) RETURN t.title ORDER BY t.title
```

---

## 2. Textbooks have structure

The moment that reframes what a textbook is.

```cypher
MATCH (:Textbook {textbook_id: 'tb-biology'})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
MATCH p = (c)-[:DEPENDS_ON]->(:Concept)
RETURN p LIMIT 150
```

Not a list of chapters — a **dependency graph**, and one your own learning-graph
generator produced. Click any node to see its `taxonomy_category` ("Cellular
Energetics", "Heredity and Genetics").

---

## 3. "What is my class struggling with?"

The question every teacher actually asks.

```cypher
MATCH (i:Instructor {instructor_key: 'inst-0001'})-[:TEACHES]->(:Section)<-[:ENROLLED_IN]-(s:Student)
MATCH (s)-[:HAS_MASTERY]->(m:ConceptMastery)-[:OF_CONCEPT]->(c:Concept)
RETURN c.label AS concept, round(avg(m.mastery_score), 2) AS class_mean, count(s) AS learners
ORDER BY class_mean ASC LIMIT 8
```

A gradebook can do this much. The next query is the one it can't.

---

## 4. Where did it actually break?

A low class average is a *symptom*. The graph finds the **cause**: a concept the learner
failed *whose own prerequisites were fine*. That's the frontier — the first thing that
broke. Everything downstream is collateral damage.

```cypher
MATCH (:Textbook {textbook_id: 'tb-biology'})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(root:Concept)
MATCH (s:Student)-[:HAS_MASTERY]->(m:ConceptMastery)-[:OF_CONCEPT]->(root)
WHERE m.mastery_score < 0.35
  AND NOT EXISTS {
    MATCH (root)-[:DEPENDS_ON]->(pre:Concept)<-[:OF_CONCEPT]-(pm:ConceptMastery)<-[:HAS_MASTERY]-(s)
    WHERE pm.mastery_score < 0.35
  }
RETURN root.label AS root_cause, count(DISTINCT s) AS learners_blocked
ORDER BY learners_blocked DESC LIMIT 8
```

| root_cause | learners_blocked |
|---|---|
| Eukaryotic Cells | 13 |
| Exergonic Reactions | 13 |
| Elements of Life | 10 |
| Second Law of Thermodynamics | 10 |
| Prokaryotic Cells | 10 |

Thirteen of the 75 biology learners — about **one in six** — are stuck at *Eukaryotic
Cells*, and their later scores are downstream of that, not of the chapter where the low
marks appear. Reteaching the last chapter would help them not at all.

!!! tip "Scope to one textbook"
    Every query here filters by `textbook_id`. Unscoped across all 54 books this takes
    ~19 seconds; scoped it returns in under 2. Worth knowing before you run it live.

---

## 5. Prerequisites are load-bearing

The claim behind query 4, checked against all 629,047 mastery records that have a
prerequisite to compare against:

```cypher
MATCH (s:Student)-[:HAS_MASTERY]->(m:ConceptMastery)-[:OF_CONCEPT]->(c:Concept)-[:DEPENDS_ON]->(pre:Concept)
MATCH (s)-[:HAS_MASTERY]->(pm:ConceptMastery)-[:OF_CONCEPT]->(pre)
WITH m, avg(pm.mastery_score) AS prereq_mastery
WITH round(prereq_mastery * 5) / 5.0 AS prereq_bucket,
     avg(m.mastery_score) AS dependent, count(*) AS records
RETURN prereq_bucket, round(dependent, 3) AS mean_dependent_mastery, records
ORDER BY prereq_bucket
```

| prereq_bucket | mean_dependent_mastery | records |
|---|---|---|
| 0.0 | 0.141 | 8,903 |
| 0.2 | 0.232 | 99,889 |
| 0.4 | 0.387 | 193,654 |
| 0.6 | 0.559 | 175,234 |
| 0.8 | 0.752 | 124,502 |
| 1.0 | 0.899 | 26,865 |

Monotonic. Master the prerequisites, master what builds on them.

!!! note "This relationship is built in, not discovered"
    The seeder generates `mastery_score` by propagating each learner's ability *down*
    the real `DEPENDS_ON` edges, so this correlation is there by construction. It is
    shown to prove the query **finds** the structure — which is what you would run
    against real learners. Against real data this table is a hypothesis to test, not a
    result to quote.

---

## 6. Which MicroSim should I build next?

Concepts that are hard, widely taken, have things depending on them, and have **no
MicroSim covering them**:

```cypher
MATCH (:Textbook {textbook_id: 'tb-biology'})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
WHERE NOT EXISTS { MATCH (:MicroSim)-[:COVERS]->(c) }
MATCH (c)<-[:OF_CONCEPT]-(m:ConceptMastery)
WITH DISTINCT c, avg(m.mastery_score) AS mean_mastery, count(m) AS learners
MATCH (down:Concept)-[:DEPENDS_ON]->(c)
RETURN c.label AS uncovered_concept, round(mean_mastery, 2) AS mean_mastery, learners,
       count(DISTINCT down) AS depends_on_it
ORDER BY depends_on_it DESC, mean_mastery ASC LIMIT 8
```

| uncovered_concept | mean_mastery | learners | depends_on_it |
|---|---|---|---|
| Eukaryotic Cells | 0.60 | 75 | 23 |
| Enzymes | 0.48 | 75 | 16 |
| Proteins | 0.46 | 75 | 11 |
| Plasma Membrane | 0.48 | 75 | 11 |

A build queue ranked by blast radius, derived from evidence rather than opinion.

!!! danger "Read this before trusting the list"
    **"Uncovered" here means "no MicroSim whose title matched a concept label" — not
    "no MicroSim exists."** The sim `metadata.json` files carry no concept ids (only 3
    of 76 biology sims have a `concepts` field), so the importer infers `COVERS` by
    matching sim titles against concept labels, conservatively. **1,056 of 2,419 sims
    matched nothing and were dropped rather than guessed at.**

    That is why *Eukaryotic Cells* appears above even though biology ships an **Animal
    Cell** sim — the titles do not share a word. The query is sound; the coverage data
    feeding it is approximate.

    **The fix is upstream:** add a `concepts: [ids]` field to each sim's
    `metadata.json`, and this query becomes exact.

---

## 7. Why this is affordable

```cypher
MATCH (n) WHERE n.statements_compressed IS NOT NULL
RETURN count(n) AS summary_vertices,
       sum(n.statements_compressed) AS statements_represented,
       round(1.0 * sum(n.statements_compressed) / count(n), 1) AS compression_ratio
```

| summary_vertices | statements_represented | compression_ratio |
|---|---|---|
| 1,012,101 | 22,265,132 | 22.0 |

**22.3 million xAPI statements, represented by a million vertices, on a laptop.** The
graph never stores a statement: spec §5.6 C-1 forbids per-statement vertices, and the
composite uniqueness constraints in `neo4j.cypher` enforce it physically — a write that
tried to create a second vertex for the same (learner, concept) grain fails at the first
attempt rather than growing the graph by a billion nodes a month.

Raw events belong in the event store. The graph holds structure and summaries. That
split is why the hardware bill is a laptop and not a cluster.

---

## What this dataset does *not* show

- **No A/B result.** Districts alternate between textbook v1.4.0 and v2.0.0 and
  `IN_CONTEXT_OF` attributes every summary to a version, so the query runs — but it
  returns no difference, because the seeder does not model a version effect. The
  capability is real; the finding is null by construction.

- **No live pipeline.** These summaries are written straight to Neo4j by the seeder. The
  designed path — xAPI in, Kafka, ClickHouse, summarizer, graph — is not built
  (`processor` and `summarizer` are unimplemented). Nothing here proves ingestion works
  at rate; it demonstrates the graph model and the questions it answers.

- **No grade placement.** Every school is a high school and books are dealt round-robin,
  because the source learning graphs carry no book-level grade metadata. A district
  teaching both *Reading for Kindergarten* and *Semiconductor Physics* is an artefact of
  that, not a claim.

- **Thin cohorts.** 4,050 learners across 54 books is ~75 each, so counts are small —
  read them as shares ("1 in 6"), not as populations.

- **No `MicroSimEngagement`, `SectionRollup`, or `LearningSession`.** Spec C-7 permits
  materialising fewer grains than §4.3 defines, and this deployment deliberately does.
  Their constraints exist; the vertices do not.
