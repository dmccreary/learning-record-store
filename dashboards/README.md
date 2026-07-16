# LRS Analytics Dashboards

Three Dash/Plotly dashboards implementing the report catalog and dashboard model from
[`docs/specs/lrs-spec-v1.md`](../docs/specs/lrs-spec-v1.md) §7 (Reports and Analytical
Tools) and §9 (Dashboard Specifications). Each targets one persona from the spec's §9.4
Dashboard Catalog:

| App | Port | Persona | Spec dashboard | Reports |
|---|---|---|---|---|
| `admin_app.py` | 8051 | School/district administrator | District Overview | R-401–R-404, R-407 |
| `teacher_app.py` | 8052 | Instructor | My Classes + Student Detail | R-201, R-203, R-209, R-107, R-101–R-109 |
| `author_app.py` | 8053 | Textbook author | Content Insights + Experiments | R-301–R-307, T-5, §8.3 readout |

All three read the same Neo4j graph the rest of this repo writes to — nothing here
mutates the graph except `lrsdash/synth.py` (see below). Kept as a separate `uv` venv
from the root `lrs` package: the `lrs` image ships ingestion/compression roles (ADR-005),
not a web BI stack, so Dash/Plotly are an optional, separate install.

## Setup

```bash
cd dashboards
make install      # creates .venv, installs requirements.txt
make synth        # one-time: fills two gaps `lrs seed` leaves empty (see below)
make admin        # or teacher / author — each runs standalone on its own port
```

Needs the main repo's Neo4j already seeded (`make seed` or `make showcase-style` load
from the repo root) and reachable at the same `NEO4J_URI`/`NEO4J_PASSWORD` in the root
`.env` — `lrsdash/db.py` reads that file directly, so no separate credentials to manage.

## What `make synth` adds

`lrs seed` never populates `MicroSimEngagement`, `Experiment`/`Variant`, or
`SectionRollup` (see `src/lrs/seed.py`) — none of R-207/R-302 (MicroSim usage) or any of
§8 (Experimentation) has real data to show without them. `lrsdash/synth.py` fills the
first two:

- **MicroSimEngagement** — adoption is correlated with a student's own existing mastery
  on the concepts a MicroSim covers (real self-selection), not a coin flip, so R-302's
  "used vs. skipped" comparison is a genuine (confounded) correlation rather than
  decoration.
- **Experiments** — the real seed never deploys one book at two versions anywhere (every
  book lives in exactly one district at one version), so there is no in-place A/B to
  observe. Three synthetic experiments run a proper randomized assignment instead (spec
  §8.2's own deterministic sticky hash), each telling a different, genuine story: a
  small single-book pilot that turned out significant, a larger pooled test that found
  nothing, and a flat-primary-metric test whose guardrail regressed hard enough that the
  readout recommends not shipping it. See `lrsdash/synth.py`'s docstring for the full
  reasoning and effect sizes.

`SectionRollup` is deliberately **not** materialized: at this dataset's scale (≤75
students/section) the aggregate it exists to precompute runs live off `ConceptMastery`
in well under 100ms (measured) — writing a projection with no latency payoff would be
decoration, not infrastructure. The teacher dashboard's heatmap queries `ConceptMastery`
directly.

Both synth writes are idempotent (`MERGE` on the same keys `lrs seed` uses) and marked
`synth_source: 'dashboards'`, so `make clear-synth` removes exactly what this added
without touching the base seed.

## Known scope cuts

Documented here rather than silently — each is a real gap, not an oversight:

- **Dark mode**: not implemented. Plotly figures set colors in the layout dict, not CSS;
  a real second theme means a client-side toggle wired through every callback's returned
  figure. Half of that (dark chrome around light-tuned charts) is worse than neither, so
  it's deferred rather than shipped broken. See `lrsdash/theme.py`.
- **T-6 (Experiment Designer)**: out of scope. It's an authoring form for *defining* new
  experiments, which means writing `Experiment`/`Variant` nodes back to the graph from
  the UI — every other report here is read-only.
- **R-308 (Cross-District Benchmark)**: in the §7.3 report catalog but not in the §9.4
  Content Insights dashboard row, so it isn't part of `author_app.py`.
- **R-103 (Time-on-Task Timeline)**: approximated from `PageEngagement.first_seen`/
  `last_seen` spans. There's no `LearningSession` data — `lrs seed` never populates it —
  and adding a sixth synthetic vertex type was out of scope here.
- **R-105 (Prerequisite Gap Analysis)**: shown as a ranked bar list of a weak concept's
  prerequisites, not a rendered subgraph. Spec's T-2 (Graph Explorer) is the tool that
  owns real graph-drawing (`dash-cytoscape`); duplicating that dependency for one report
  would be a second, heavier way to do the same job.
- **R-109 (Reading vs. Doing Balance)**: approximated from summary-vertex counts
  (`PageEngagement` = reading, `QuestionResponse` + `MicroSimEngagement` = doing).
  Spec §4.1 is explicit that `Verb` "is not edged to from the graph" — there is no
  per-statement verb to query at all, so this is the closest real signal available.
- **R-307 (Version Comparison)**: will show a single bar for most books. Every book in
  the seed is deployed at exactly one version, so there's rarely a second version's data
  to compare against — the report says so in the UI rather than padding the chart.
- **R-407 (Seat Utilization)**: `licensed_seats` doesn't exist anywhere in the graph
  (spec's identity/billing layer is unbuilt). It's a presentation-layer assumption sized
  a bit above each district's actual enrollment, never written back to Neo4j.
- **R-404 (Deployment Inventory)**: no provisional-vs-reconciled column. That ingest
  state belongs to the event store (spec §5.3), which this graph-backed report has no
  visibility into.

## Performance note

`queries_admin.daily_activity` originally combined mastery and engagement in one Cypher
query with two `OPTIONAL MATCH`es feeding a shared `WITH` — that cross-joins every
`ConceptMastery` a student has with every `PageEngagement` they have before the `WHERE`
filter runs, which turned a sub-second aggregate into 72 seconds at showcase scale (~4K
students). Fixed by running the two aggregations as independent queries and summing in
pandas. Worth knowing if you add a new report that joins two summary-vertex types in one
query — check the actual row count Cypher computes before the `WITH`, not just the
final answer.
