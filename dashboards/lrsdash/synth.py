"""Fills the three summary-vertex/experiment gaps `lrs seed --showcase` leaves empty, so
all three dashboards have something to show for every report in the catalog (spec §7).

WHAT'S MISSING AND WHY
-----------------------
`lrs seed` (see ../../src/lrs/seed.py) writes ConceptMastery, PageEngagement and
QuestionResponse, but never MicroSimEngagement, Experiment/Variant, or SectionRollup.
The first two are populated here. SectionRollup is deliberately NOT materialized: at
this dataset's scale (≤75 students/section) the class-mastery aggregate it exists to
precompute runs live off ConceptMastery in well under 100ms (measured), so writing a
projection that just duplicates that data with no latency benefit would be decoration,
not infrastructure. The teacher dashboard's heatmap queries ConceptMastery directly and
says so. This is the same "don't fake a component with no payoff" judgment seed.py
itself makes about grade bands.

MICROSIM ENGAGEMENT (R-207, R-302)
-----------------------------------
Candidate (student, microsim) pairs come from real graph structure: a student has an
existing PageEngagement on a page that EMBEDS a MicroSim. Adoption is NOT a coin flip —
adoption probability is correlated with the student's own EXISTING mastery on the
concepts that MicroSim covers (real learners with more going for them are more likely to
explore optional interactive content). A skipped MicroSim gets no vertex at all: spec
§4.3's grain is "one vertex per (student, microsim) with evidence", so "used vs skipped"
(R-302) is a plain NOT EXISTS query, not a boolean flag.

This makes the resulting correlation GENUINE but CONFOUNDED — exactly what spec R-302
warns about ("observational; confounded — see A/B, §8"). It is not faked to look causal.
The Experiments subsystem below is where a clean causal answer actually lives.

EXPERIMENTS (§8)
----------------
Real seed data gives every book exactly ONE deployed version per district — there is no
in-place A/B to observe (checked: 0 books are deployed at 2 versions anywhere in the
graph). So the three experiments here are a genuine parallel synthetic RCT: eligible
students are assigned to Control/Treatment with the spec's own deterministic sticky
hash (§8.2: `hash(experiment_id, student_key) mod buckets`), and each assigned student
gets an `outcome_value` generated from their OWN existing mastery in the relevant
book(s) as a prior-ability covariate, plus the arm's effect, plus residual noise. This
does not overwrite or contradict any ConceptMastery vertex — it is a new, independent
outcome specific to the experiment, exactly as a real experimentation platform computes
a study-specific metric rather than mutating the production summary it's evaluating.

Three stories, not three wins — a demo where every experiment succeeds teaches nothing:
  exp-biology-worked-examples   single book, N=75  -> a small, likely-marginal pilot
  exp-microsim-vs-static-stem   pooled 3 books, N=225 -> a clear, well-powered win
  exp-sequencing-microsim       pooled 3 books, N=225 -> near-null primary metric, but
                                 a deliberate guardrail (engagement) regression, so the
                                 readout has to recommend NOT shipping despite a flat
                                 primary metric. Segmentation uses prior-mastery band and
                                 district, not grade band — every seeded student is
                                 grade_level 10 (seed.py: "grade placement is not
                                 modelled"), so a grade cut would show a fake signal.

Everything here is idempotent (MERGE on the same keys `lrs seed` uses) and marked
`seeded: true, synth_source: 'dashboards'` — `synth_source` distinguishes this from
`lrs seed`'s own writes so `clear()` below can remove exactly what this module added
without touching the base seed.
"""

from __future__ import annotations

import hashlib
import logging
import random
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from neo4j import GraphDatabase

from lrsdash.db import driver, q

log = logging.getLogger(__name__)

RNG_SEED = 20260716  # same convention as lrs/seed.py: fixed seed -> idempotent content
TERM_START = datetime(2025, 9, 2, tzinfo=UTC)
TERM_END = datetime(2025, 12, 19, tzinfo=UTC)


# ---------------------------------------------------------------------------
# MicroSimEngagement
# ---------------------------------------------------------------------------

_CANDIDATES = """
MATCH (st:Student)-[:ENGAGED_WITH]->(:PageEngagement)-[:SUMMARIZES]->(pg:Page)-[:EMBEDS]->(m:MicroSim)
MATCH (pg)<-[:CONTAINS]-(:Chapter)<-[:CONTAINS]-(tb:Textbook)
MATCH (v:TextbookVersion)-[:VERSION_OF]->(tb)
MATCH (st)-[:ENROLLED_IN]->(:Section)-[:DEPLOYS]->(v)
OPTIONAL MATCH (m)-[:COVERS]->(c:Concept)<-[:OF_CONCEPT]-(cm:ConceptMastery)<-[:HAS_MASTERY]-(st)
WITH st.student_key AS student_key, m.microsim_id AS microsim_id, v.version_id AS version_id,
     avg(cm.mastery_score) AS local_mastery
RETURN student_key, microsim_id, version_id, local_mastery
"""

_WRITE_MICROSIM_ENGAGEMENT = """
UNWIND $rows AS row
MERGE (e:MicroSimEngagement {student_key: row.student_key, microsim_id: row.microsim_id})
SET e += {interaction_count: row.interaction_count, dwell_ms_total: row.dwell_ms_total,
          completed: row.completed, last_seen: row.last_seen,
          statements_compressed: row.statements_compressed,
          seeded: true, synth_source: 'dashboards'}
WITH e, row
MATCH (s:Student {student_key: row.student_key})
MATCH (m:MicroSim {microsim_id: row.microsim_id})
MATCH (v:TextbookVersion {version_id: row.version_id})
MERGE (s)-[:ENGAGED_WITH]->(e)
MERGE (e)-[:SUMMARIZES]->(m)
MERGE (e)-[:IN_CONTEXT_OF]->(v)
"""


def _ts(rng: random.Random) -> datetime:
    span = (TERM_END - TERM_START).total_seconds()
    return TERM_START + timedelta(seconds=rng.uniform(0, span))


def build_microsim_engagement(rng: random.Random) -> list[dict]:
    candidates = q(_CANDIDATES)
    rows: list[dict] = []
    for rec in candidates.to_dict("records"):
        prior = rec["local_mastery"]
        prior = 0.5 if prior is None or prior != prior else float(prior)  # NaN != NaN
        # Self-selection, not random assignment: students already doing reasonably well
        # are likelier to explore an optional interactive sim. This is what makes the
        # eventual "used vs skipped" comparison a real confound, not a coin flip.
        adopt_prob = max(0.15, min(0.92, 0.30 + 0.55 * prior))
        if rng.random() >= adopt_prob:
            continue  # skipped: no vertex at all (see module docstring)
        completed_prob = max(0.10, min(0.95, 0.35 + 0.55 * prior))
        rows.append(
            {
                "student_key": rec["student_key"],
                "microsim_id": rec["microsim_id"],
                "version_id": rec["version_id"],
                "interaction_count": rng.randint(2, 5) + round(rng.random() * 10 * prior),
                "dwell_ms_total": int(rng.randrange(20_000, 180_000) * (0.6 + prior)),
                "completed": rng.random() < completed_prob,
                "last_seen": _ts(rng),
                "statements_compressed": rng.randint(6, 18),
            }
        )
    return rows


def seed_microsim_engagement() -> int:
    rng = random.Random(RNG_SEED)
    rows = build_microsim_engagement(rng)
    with driver().session() as session:
        for i in range(0, len(rows), 5000):
            session.run(_WRITE_MICROSIM_ENGAGEMENT, rows=rows[i : i + 5000])
    log.info("seeded %d MicroSimEngagement vertices", len(rows))
    return len(rows)


# ---------------------------------------------------------------------------
# Experiments
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ExperimentDef:
    experiment_id: str
    hypothesis: str
    primary_outcome_metric: str
    unit_of_randomization: str
    status: str
    book_ids: tuple[str, ...]
    control_label: str
    treatment_label: str
    effect: float  # added to a student's own prior-mastery covariate for the treatment arm
    residual_sd: float
    guardrail_metric: str
    guardrail_effect: float  # additive shift to the guardrail for the TREATMENT arm


# See this module's docstring for why these three effect sizes and pools were chosen:
# one single-book pilot, one well-powered pooled win, one near-null-primary-but-
# guardrail-regression case. Spec §8.4 names these three example shapes verbatim.
EXPERIMENTS = [
    ExperimentDef(
        experiment_id="exp-biology-worked-examples",
        hypothesis="Adding worked examples to the Osmosis/Diffusion pages improves "
        "downstream concept mastery in the affected chapter.",
        primary_outcome_metric="concept_mastery",
        unit_of_randomization="student",
        status="completed",
        book_ids=("tb-biology",),
        control_label="v2.3 (no worked examples)",
        treatment_label="v2.4 (adds worked examples)",
        effect=0.05,
        residual_sd=0.05,
        guardrail_metric="engagement_index",
        guardrail_effect=0.0,
    ),
    ExperimentDef(
        experiment_id="exp-microsim-vs-static-stem",
        hypothesis="An interactive MicroSim improves quiz success vs. a static diagram "
        "for the same concept, across physics/chemistry/circuits.",
        primary_outcome_metric="concept_mastery",
        unit_of_randomization="student",
        status="completed",
        book_ids=("tb-circuits", "tb-intro-to-physics-course", "tb-chemistry"),
        control_label="static diagram",
        treatment_label="interactive MicroSim",
        effect=0.08,
        residual_sd=0.05,
        guardrail_metric="engagement_index",
        guardrail_effect=0.02,
    ),
    ExperimentDef(
        experiment_id="exp-sequencing-microsim",
        hypothesis="MicroSim-before-reading reaches time-to-mastery at least as fast as "
        "reading-before-MicroSim.",
        primary_outcome_metric="concept_mastery",
        unit_of_randomization="student",
        status="completed",
        book_ids=("tb-xapi-course", "tb-information-systems", "tb-data-science-course"),
        control_label="reading before MicroSim",
        treatment_label="MicroSim before reading",
        effect=0.015,
        residual_sd=0.05,
        # The cautionary case: primary metric is flat, but treatment costs engagement —
        # jumping to an interactive sim before any framing reads as confusing to some
        # learners. A real readout has to flag this even though "mastery" looks fine.
        guardrail_metric="engagement_index",
        guardrail_effect=-0.12,
    ),
]

BUCKETS = 10_000


def _assign(experiment_id: str, student_key: str) -> str:
    """Spec §8.2: deterministic + sticky. `hash()` is not used because it is randomized
    per-process in Python; a stable digest is required so a re-run assigns identically."""
    digest = hashlib.sha256(f"{experiment_id}:{student_key}".encode()).hexdigest()
    bucket = int(digest[:8], 16) % BUCKETS
    return "treatment" if bucket < BUCKETS // 2 else "control"


def _eligible_students(book_ids: tuple[str, ...]) -> list[tuple[str, float, str]]:
    """(student_key, prior_mastery, district_id) for every student enrolled in any of
    book_ids. Prior mastery is the covariate; district is a segmentation dimension."""
    df = q(
        """
        MATCH (v:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        WHERE tb.textbook_id IN $book_ids
        MATCH (st:Student)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:IN_CONTEXT_OF]->(v)
        MATCH (st)-[:ENROLLED_IN]->(:Section)<-[:HAS_SECTION]-(:Course)<-[:OFFERS]-(:School)
              <-[:HAS_SCHOOL]-(d:District)
        WITH st.student_key AS student_key, d.district_id AS district_id, avg(cm.mastery_score) AS prior
        RETURN student_key, prior, district_id
        """,
        book_ids=list(book_ids),
    )
    return list(df.itertuples(index=False, name=None))


_WRITE_EXPERIMENT = """
MERGE (e:Experiment {experiment_id: $experiment_id})
SET e += {hypothesis: $hypothesis, status: $status,
          primary_outcome_metric: $primary_outcome_metric,
          unit_of_randomization: $unit_of_randomization, seeded: true, synth_source: 'dashboards'}
WITH e
UNWIND $variants AS var
MERGE (v:Variant {variant_id: var.variant_id})
SET v += {arm_label: var.arm_label, allocation: var.allocation, seeded: true, synth_source: 'dashboards'}
MERGE (e)-[:HAS_VARIANT]->(v)
"""

_WRITE_ASSIGNMENTS = """
UNWIND $rows AS row
MATCH (s:Student {student_key: row.student_key})
MATCH (v:Variant {variant_id: row.variant_id})
MERGE (s)-[a:ASSIGNED_TO]->(v)
SET a += {assigned_at: row.assigned_at, outcome_value: row.outcome_value,
          outcome_metric: row.outcome_metric, guardrail_metric: row.guardrail_metric,
          guardrail_value: row.guardrail_value, prior_mastery: row.prior_mastery,
          district_id: row.district_id}
"""


def seed_experiments() -> dict[str, int]:
    rng = random.Random(RNG_SEED)
    counts: dict[str, int] = {}
    with driver().session() as session:
        for exp in EXPERIMENTS:
            variants = [
                {"variant_id": f"{exp.experiment_id}-control", "arm_label": exp.control_label,
                 "allocation": 0.5},
                {"variant_id": f"{exp.experiment_id}-treatment", "arm_label": exp.treatment_label,
                 "allocation": 0.5},
            ]
            session.run(
                _WRITE_EXPERIMENT,
                experiment_id=exp.experiment_id, hypothesis=exp.hypothesis, status=exp.status,
                primary_outcome_metric=exp.primary_outcome_metric,
                unit_of_randomization=exp.unit_of_randomization, variants=variants,
            )

            rows = []
            for student_key, prior, district_id in _eligible_students(exp.book_ids):
                arm = _assign(exp.experiment_id, student_key)
                variant_id = f"{exp.experiment_id}-{arm}"
                effect = exp.effect if arm == "treatment" else 0.0
                outcome = max(0.02, min(0.99, prior + effect + rng.gauss(0, exp.residual_sd)))
                g_effect = exp.guardrail_effect if arm == "treatment" else 0.0
                # engagement_index baseline centered independent of mastery — a guardrail
                # is meant to catch harm a primary-metric-only view would miss, so it must
                # not be a rescaled copy of the same signal.
                guardrail = max(0.02, min(0.99, rng.gauss(0.60, 0.12) + g_effect))
                rows.append(
                    {
                        "student_key": student_key,
                        "variant_id": variant_id,
                        "assigned_at": TERM_START + timedelta(days=rng.randint(0, 14)),
                        "outcome_value": round(outcome, 4),
                        "outcome_metric": exp.primary_outcome_metric,
                        "guardrail_metric": exp.guardrail_metric,
                        "guardrail_value": round(guardrail, 4),
                        "prior_mastery": round(float(prior), 4),
                        "district_id": district_id,
                    }
                )
            for i in range(0, len(rows), 5000):
                session.run(_WRITE_ASSIGNMENTS, rows=rows[i : i + 5000])
            counts[exp.experiment_id] = len(rows)
            log.info("seeded experiment %-32s %5d assignments", exp.experiment_id, len(rows))
    return counts


def clear() -> int:
    """Remove everything this module wrote (both functions), and nothing `lrs seed` wrote.
    `synth_source: 'dashboards'` is the marker — same pattern as seed.py's own `seeded`."""
    deleted = 0
    with driver().session() as session:
        deleted += session.run(
            "MATCH ()-[a:ASSIGNED_TO]->() DETACH DELETE a RETURN count(*) AS n"
        ).single()["n"]
        while True:
            n = session.run(
                "MATCH (n {synth_source: 'dashboards'}) WITH n LIMIT 10000 DETACH DELETE n "
                "RETURN count(n) AS n"
            ).single()["n"]
            deleted += n
            if not n:
                break
    return deleted


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    n_mse = seed_microsim_engagement()
    exp_counts = seed_experiments()
    log.info("done: %d MicroSimEngagement, experiments=%s", n_mse, exp_counts)
    driver().close()


if __name__ == "__main__":
    main()
