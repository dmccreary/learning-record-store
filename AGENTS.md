# learning-record-store

An LRS for intelligent textbooks: xAPI ingestion → ClickHouse event store → compressed
summaries in Neo4j. Specs in `docs/specs/` are authoritative — `lrs-spec-v1.md` (§4 is
the graph data model) and `lrs-design-v1.md` (§6.3 is the Neo4j DDL). Python is managed
with `uv`; `ruff` and strict `mypy` both gate.

## Codex skills

Two separate workflows live in this repo — reach for the skill set that matches what's
being touched.

**Textbook authoring** (`docs/` — course description, learning graph, chapters,
glossary, sims under `docs/sims/`):

- `ibook` — the ordered runbook across all of the skills below
- `course-description-analyzer` → `learning-graph-generator` → `book-chapter-generator`
  → `chapter-content-generator`
- `glossary-generator`, `quiz-generator`, `faq-generator`, `reference-generator`
- `microsim-generator` / `microsim-utils` for `docs/sims/*` (p5.js, vis-network, …)
- `book-media-generator`, `book-publisher`, `book-installer` for slides/images/audio,
  publishing, and site features (GA4, mascot, kanban, …)

**LRS backend** (`src/lrs/`, `tests/`, `dashboards/`, specs in `docs/specs/`):

- `engineering:code-review`, `engineering:testing-strategy`, `engineering:debug`,
  `engineering:tech-debt` for the Python source
- `verify` before committing nontrivial changes; `run` to launch/screenshot the app
- `dataviz` for anything under `dashboards/`
- `engineering:deploy-checklist`, `engineering:documentation` for specs and runbooks
- `security-review` before merging changes that touch ingestion or auth

## Learning mascot

### Mascot File Index

The canonical files for the textbook mascot. When editing any of these, update
the related files in the same turn so Rowan stays consistent.

| File | Purpose |
|---|---|
| `docs/img/mascot/character-sheet.md` | Canonical identity, appearance, and voice. |
| `docs/img/mascot/image-prompts.md` | Full self-contained prompt pack for regenerating the mascot poses as PNGs. |
| `docs/img/mascot/neutral.png` | Default general-purpose pose and active site logo. |
| `docs/img/mascot/welcome.png` | Chapter-opening pose. |
| `docs/img/mascot/thinking.png` | Key-concept pose. |
| `docs/img/mascot/tip.png` | Helpful-guidance pose. |
| `docs/img/mascot/warning.png` | Common-pitfall pose. |
| `docs/img/mascot/encouraging.png` | Difficult-content pose. |
| `docs/img/mascot/celebration.png` | End-of-section celebration pose. |
| `docs/css/mascot.css` | Custom admonition styles for mascot callouts. |
| `docs/learning-graph/mascot-test.md` | Rendering test page for all mascot variants. |

### Character Overview

- **Name:** Rowan
- **Species:** Red panda
- **Personality:** curious, patient, encouraging, precise
- **Catchphrase:** "Let's follow the record."
- **Visual:** cinnamon-and-cream red panda with teal glasses and neckerchief, plus a compact learning-record satchel

### Voice Characteristics

- Explains the plain-language story before the system detail
- Talks about records, evidence, connections, and flows rather than generic "data"
- Keeps the tone warm and steady, especially during debugging or architecture-heavy sections
- Signature phrases: "Let's follow the record.", "What does the evidence show?", "One event at a time."

### Mascot Admonition Format

Always place mascot images in the admonition body, not the title bar:

```md
!!! mascot-welcome "Title Here"
    ![Rowan welcome pose](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Admonition text goes here after the image.
```

### Placement Rules

| Context | Admonition Type | Frequency |
|---|---|---|
| General note / sidebar | `mascot-neutral` | As needed |
| Chapter opening | `mascot-welcome` | Every chapter |
| Key concept | `mascot-thinking` | 2-3 per chapter |
| Helpful tip | `mascot-tip` | As needed |
| Common mistake | `mascot-warning` | As needed |
| Difficult content | `mascot-encourage` | Where students may struggle |
| Section completion | `mascot-celebration` | End of major sections |

### Do and Don't

- Do keep Rowan's dialogue brief and purposeful.
- Do match the pose to the instructional moment.
- Do use Rowan to lower anxiety around technical material.
- Don't stack mascot admonitions back-to-back.
- Don't use Rowan as decoration without instructional value.
- Don't change Rowan's name, palette, or voice without updating the character sheet and prompt pack.

## External data resources

The demo seeder (`lrs seed`) does **not** ship invented course content. It imports the
real learning graphs from the intelligent-textbook repos, which live as siblings of this
one. `LRS_TEXTBOOK_ROOT` points at them (default `..`).

### Textbook learning graphs — `<repo>/docs/learning-graph/`

54 sibling repos carry one as of 2026-07-16, totalling ~15,400 concepts. Key files:

| File | What it is |
|---|---|
| `learning-graph.csv` | `ConceptID,ConceptLabel,Dependencies,TaxonomyID`. Dependencies are **pipe-separated** ConceptIDs, numbered 1..N **per book** (so they collide across books — namespace them). |
| `learning-graph.json` | Same graph, JSON form, against a published schema. |
| `taxonomy-names.json` | `{"CELL": "Cell Biology", ...}` — real, human-authored category names. |
| `metadata.json` | Real title, creator, date, license. |
| `quality-metrics.md` | DAG validation, foundational concepts, longest path, orphans, connected components, in/outdegree. **See the caveat below.** |
| `book-metrics.md`, `chapter-metrics.md` | Per-book and per-chapter stats. |
| `concept-list.md`, `concept-taxonomy.md`, `taxonomy-distribution.md` | Human-readable views. |
| `course-description-assessment.md` | Scoring of the source course description. |
| `validate-learning-graph.py`, `analyze-graph.py` | The repo's own validators. |

**Two gotchas, both measured on the local catalogue (2026-07-16):**

1. **`quality-metrics.md`'s "Valid DAG Structure" field is unreliable.** 25 of 51 reports
   say `❌ No` while the same report says `Cycles Detected: 0` and `Self-Dependencies:
   None` — which describes a valid DAG. An independent cycle check over all 54 graphs
   found **zero cycles**. Trust a direct check, not that field. The other metrics in the
   file (orphans, longest path, degree) look sound.
2. **CSV row order is not topological.** 46 of 53 books contain forward references — a
   concept depending on one declared later in the file. The graphs are acyclic so an
   order exists, but you must compute it (`catalog.py::_topological`, Kahn's). Anything
   walking prerequisites in file order will read a concept before its prerequisite.

Clean otherwise: no dangling dependency refs, no duplicate ConceptIDs, no blank
TaxonomyIDs.

### MicroSim metadata — `../search-microsims/`

Better than scanning each book's `docs/sims/`, which has inconsistent metadata.

- **`docs/search/microsims-data.json`** — the catalogue: **3,764 sims** across all books.
  Per entry: `title`, `description`, `subject`, `library` (p5.js, vis-network, …),
  `bloomLevel`, `bloomVerb`, `completion_status` (scaffold/…), `chapter_number`,
  `chapter_title`, `url`, `identifier`. `library` and `completion_status` map directly
  onto spec §4.1's `MicroSim.type` and `.status`.
- **`data/microsims-embeddings.json`** — 63 MB, **3,746 sims**, `all-MiniLM-L6-v2`,
  `dual-v1` schema: each sim has a 384-dim `what` vector and a 384-dim `how` vector.
  Load it by path with a streaming/`json.load` peek — never paste it into context.

**Known weakness worth fixing upstream:** sim metadata carries **no concept ids** (only
3 of 76 biology sims have a `concepts` field). `catalog.py` therefore infers
`MicroSim -[:COVERS]-> Concept` by matching sim titles against concept labels, which is
conservative and misses a lot — 1,056 of 2,419 sims matched nothing, and biology's
*Animal Cell* sim does not match the *Eukaryotic Cells* concept because the titles share
no word. Two ways out: embed concept labels with the same model and match by cosine
similarity against these vectors, or add `concepts: [ids]` to each sim's `metadata.json`
and make it exact.

### Textbooks not in this workspace

The local catalogue is a subset. `gh` is authenticated as `dmccreary` (293 repos, not all
textbooks). To find a book that isn't a sibling here:

```bash
gh repo list dmccreary --limit 500 --json name,description
gh search repos --owner dmccreary <topic>
```

Browse: <https://github.com/dmccreary?tab=repositories>

## Seeding the demo graph

```bash
docker exec -i lrs-neo4j-1 cypher-shell -u neo4j -p "$NEO4J_PASSWORD" < src/lrs/ddl/neo4j.cypher
uv run lrs seed --showcase    # whole catalogue: ~1.05M nodes, ~2m24s
uv run lrs seed --demo        # §8.7's shape: 1 district, 2 schools, 4 sections
uv run lrs seed --clear       # removes every `seeded: true` node
```

`bootstrap --apply-constraints` and `--apply-ddl` are **stubs that exit 2** — the DDL is
applied by hand, as above. Composite `REQUIRE (a,b) IS UNIQUE` **does** work on
neo4j:5.26-community (verified 2026-07-16), so C-1 is enforceable on the pilot tier; the
"UNVERIFIED ASSUMPTION" header in `neo4j.cypher` predates that check.

Everything the seeder writes carries `seeded: true`. The summary vertices are written
**directly**, not compressed from a statement log — `processor` and `summarizer` do not
exist yet — so they are not §4.3 projections and cannot be replayed. Keep that marker
and keep saying so.

### Neo4j write constraints

`dbms.memory.transaction.total.max` is **1.4 GiB** (derived from the 2G heap §6.3 sets).
On the full catalogue this bites:

- Bulk deletes must use `CALL (n) { DETACH DELETE n } IN TRANSACTIONS OF 1000 ROWS` in an
  **autocommit session** (`session.run`, not `execute_query` — `IN TRANSACTIONS` is
  illegal inside a managed transaction). A client-side `LIMIT 10000 DETACH DELETE` loop
  overruns the pool.
- Write batches are 1000 rows (`seed.py::WRITE_BATCH`). 5000 overruns the pool past
  ~500k summary vertices.
