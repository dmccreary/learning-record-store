"""Queries for the Content Insights + Experiments dashboard — spec §9.4:
'Content Insights | Author / Curriculum | R-301-R-307, T-5' and
'Experiments | Author / Researcher | §8.3 readout, T-6'.

R-308 (Cross-District Benchmark) is in the §7.3 catalog but NOT in the §9.4 Content
Insights row — the catalog itself scopes it elsewhere, so it's out of this dashboard.
T-6 (Experiment Designer) is an authoring form for DEFINING new experiments, which would
mean writing Experiment/Variant nodes back to the graph from the UI — a different kind
of feature from every other report here (all read-only). Out of scope; see README.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

from lrsdash.db import q
from lrsdash.synth import EXPERIMENTS

CONFUSION_MIN_READERS = 5
QUESTION_MIN_ATTEMPTS = 8


def book_versions(textbook_id: str) -> pd.DataFrame:
    return q(
        """
        MATCH (v:TextbookVersion)-[:VERSION_OF]->(:Textbook {textbook_id: $tid})
        RETURN v.version_id AS version_id, v.semver AS semver, v.published_at AS published_at
        ORDER BY v.published_at
        """,
        tid=textbook_id,
    )


def page_effectiveness(textbook_id: str) -> pd.DataFrame:
    """R-301: correlate a page's engagement with mastery of the concepts it covers."""
    return q(
        """
        MATCH (:Textbook {textbook_id: $tid})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(pg:Page)
        MATCH (pe:PageEngagement)-[:SUMMARIZES]->(pg)
        WITH pg, avg(pe.dwell_ms_total) AS dwell, avg(pe.revisit_count) AS revisit, count(pe) AS readers
        MATCH (pg)-[:COVERS]->(c:Concept)<-[:OF_CONCEPT]-(cm:ConceptMastery)
        RETURN pg.title AS page, round(dwell / 1000) AS dwell_s, round(revisit, 1) AS revisit,
               round(avg(cm.mastery_score), 3) AS downstream_mastery, readers
        ORDER BY downstream_mastery DESC
        """,
        tid=textbook_id,
    )


def confusing_content(textbook_id: str) -> pd.DataFrame:
    """R-303: high dwell + high revisit + low downstream mastery, ranked."""
    df = page_effectiveness(textbook_id)
    df = df[df["readers"] >= CONFUSION_MIN_READERS].copy()
    if df.empty:
        return df
    # Each signal z-scored so dwell (seconds) and revisit (count) contribute comparably;
    # confusion rises with dwell and revisit but falls with mastery, hence the minus sign.
    for col in ("dwell_s", "revisit", "downstream_mastery"):
        sd = df[col].std()
        df[f"z_{col}"] = (df[col] - df[col].mean()) / sd if sd else 0.0
    df["confusion_score"] = (df["z_dwell_s"] + df["z_revisit"] - df["z_downstream_mastery"]).round(2)
    return df.sort_values("confusion_score", ascending=False).drop(
        columns=["z_dwell_s", "z_revisit", "z_downstream_mastery"]
    )


def microsim_impact(textbook_id: str) -> pd.DataFrame:
    """R-302: mastery of students who used vs. skipped each MicroSim (observational)."""
    used = q(
        """
        MATCH (:Textbook {textbook_id: $tid})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:EMBEDS]->(m:MicroSim)
        MATCH (m)-[:COVERS]->(c:Concept)
        MATCH (st:Student)-[:ENGAGED_WITH]->(:MicroSimEngagement)-[:SUMMARIZES]->(m)
        MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN m.title AS microsim, avg(cm.mastery_score) AS mastery, count(DISTINCT st) AS n
        """,
        tid=textbook_id,
    ).set_index("microsim")
    skipped = q(
        """
        MATCH (:Textbook {textbook_id: $tid})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(pg:Page)-[:EMBEDS]->(m:MicroSim)
        MATCH (m)-[:COVERS]->(c:Concept)
        MATCH (st:Student)-[:ENGAGED_WITH]->(:PageEngagement)-[:SUMMARIZES]->(pg)
        WHERE NOT EXISTS {
            MATCH (st)-[:ENGAGED_WITH]->(:MicroSimEngagement)-[:SUMMARIZES]->(m)
        }
        MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN m.title AS microsim, avg(cm.mastery_score) AS mastery, count(DISTINCT st) AS n
        """,
        tid=textbook_id,
    ).set_index("microsim")
    merged = used.join(skipped, lsuffix="_used", rsuffix="_skipped", how="inner")
    merged = merged[(merged["n_used"] >= 5) & (merged["n_skipped"] >= 5)]
    if merged.empty:
        return merged.reset_index()
    merged["delta"] = (merged["mastery_used"] - merged["mastery_skipped"]).round(3)
    return merged.reset_index().sort_values("delta", ascending=False)


def dropoff_sankey(textbook_id: str) -> pd.DataFrame:
    """R-304: chapter(N) -> chapter(N+1) continuation counts, for a Sankey."""
    reached = q(
        """
        MATCH (tb:Textbook {textbook_id: $tid})-[:CONTAINS]->(ch:Chapter)
        MATCH (v:TextbookVersion)-[:VERSION_OF]->(tb)
        MATCH (st:Student)-[:ENROLLED_IN]->(:Section)-[:DEPLOYS]->(v)
        OPTIONAL MATCH (ch)-[:CONTAINS]->(:Page)-[:COVERS]->(:Concept)<-[:OF_CONCEPT]-(cm:ConceptMastery)<-[:HAS_MASTERY]-(st)
        WITH ch.order AS chapter_order, ch.title AS chapter, st,
             count(cm) > 0 AS touched
        WHERE touched
        RETURN DISTINCT chapter_order, chapter, st.student_key AS student
        """,
        tid=textbook_id,
    )
    if reached.empty:
        return reached
    by_chapter = reached.groupby(["chapter_order", "chapter"])["student"].apply(set).reset_index()
    by_chapter = by_chapter.sort_values("chapter_order").reset_index(drop=True)
    rows = []
    for i in range(len(by_chapter) - 1):
        a, b = by_chapter.iloc[i], by_chapter.iloc[i + 1]
        cont = len(a["student"] & b["student"])
        dropped = len(a["student"] - b["student"])
        rows.append({"from": a["chapter"], "to": b["chapter"], "value": cont, "kind": "continues"})
        if dropped:
            rows.append({"from": a["chapter"], "to": "Stopped here", "value": dropped, "kind": "drop-off"})
    return pd.DataFrame(rows)


def concept_coverage_gaps(textbook_id: str) -> pd.DataFrame:
    """R-305: concepts in the book's DAG with little or no mastery evidence."""
    return q(
        """
        MATCH (:Textbook {textbook_id: $tid})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        OPTIONAL MATCH (c)<-[:OF_CONCEPT]-(cm:ConceptMastery)
        RETURN c.label AS concept, c.taxonomy_category AS category, count(cm) AS evidence_count
        ORDER BY evidence_count ASC
        """,
        tid=textbook_id,
    )


def question_health(textbook_id: str) -> pd.DataFrame:
    """R-306: per-question difficulty (p-value) and a discrimination proxy (point-
    biserial-style correlation between a respondent's score on this item and their
    overall book mastery)."""
    responses = q(
        """
        MATCH (:Textbook {textbook_id: $tid})-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)
              -[:EMBEDS]->(:Quiz)-[:CONTAINS]->(qn:Question)
        MATCH (st:Student)-[:RESPONDED_TO]->(qr:QuestionResponse)-[:SUMMARIZES]->(qn)
        RETURN qn.question_id AS question_id, qn.bloom_level AS bloom_level,
               st.student_key AS student, qr.mean_score AS item_score
        """,
        tid=textbook_id,
    )
    if responses.empty:
        return responses
    overall = q(
        """
        MATCH (v:TextbookVersion)-[:VERSION_OF]->(:Textbook {textbook_id: $tid})
        MATCH (st:Student)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:IN_CONTEXT_OF]->(v)
        RETURN st.student_key AS student, avg(cm.mastery_score) AS overall_mastery
        """,
        tid=textbook_id,
    )
    merged = responses.merge(overall, on="student", how="inner")
    rows = []
    for qid, grp in merged.groupby("question_id"):
        if len(grp) < QUESTION_MIN_ATTEMPTS:
            continue
        p_value = grp["item_score"].mean()
        discrimination = (
            grp["item_score"].corr(grp["overall_mastery"]) if grp["overall_mastery"].std() else 0.0
        )
        flags = []
        if p_value > 0.90:
            flags.append("too easy")
        if p_value < 0.20:
            flags.append("too hard")
        if pd.notna(discrimination) and abs(discrimination) < 0.10:
            flags.append("non-discriminating")
        rows.append({
            "question_id": qid, "bloom_level": grp["bloom_level"].iloc[0],
            "n": len(grp), "p_value": round(p_value, 3),
            "discrimination": round(discrimination, 3) if pd.notna(discrimination) else None,
            "flags": ", ".join(flags) if flags else "—",
        })
    return pd.DataFrame(rows).sort_values("p_value")


def version_comparison(textbook_id: str) -> pd.DataFrame:
    """R-307."""
    return q(
        """
        MATCH (v:TextbookVersion)-[:VERSION_OF]->(:Textbook {textbook_id: $tid})
        MATCH (cm:ConceptMastery)-[:IN_CONTEXT_OF]->(v)
        RETURN v.semver AS version, round(avg(cm.mastery_score), 3) AS mean_mastery,
               sum(cm.statements_compressed) AS statements, count(DISTINCT cm) AS n
        ORDER BY version
        """,
        tid=textbook_id,
    )


def correlation_explorer(textbook_id: str, engagement_metric: str) -> pd.DataFrame:
    """T-5: page-level scatter of an engagement metric vs. downstream mastery."""
    df = page_effectiveness(textbook_id)
    col = {"dwell": "dwell_s", "revisit": "revisit"}[engagement_metric]
    return df[[col, "downstream_mastery", "page", "readers"]].rename(columns={col: "x"})


# --- Experiments (§8.3) ----------------------------------------------------------------


def experiment_list() -> list[dict]:
    return [{"experiment_id": e.experiment_id, "hypothesis": e.hypothesis,
             "control_label": e.control_label, "treatment_label": e.treatment_label,
             "guardrail_metric": e.guardrail_metric} for e in EXPERIMENTS]


def experiment_assignments(experiment_id: str) -> pd.DataFrame:
    return q(
        """
        MATCH (:Experiment {experiment_id: $eid})-[:HAS_VARIANT]->(v:Variant)<-[a:ASSIGNED_TO]-(st:Student)
        RETURN v.variant_id AS variant_id, v.arm_label AS arm_label, st.student_key AS student,
               a.assigned_at AS assigned_at, a.outcome_value AS outcome_value,
               a.guardrail_value AS guardrail_value, a.prior_mastery AS prior_mastery,
               a.district_id AS district_id,
               CASE WHEN v.variant_id ENDS WITH '-treatment' THEN 'treatment' ELSE 'control' END AS arm
        """,
        eid=experiment_id,
    )


def _ci95(values: pd.Series) -> tuple[float, float, float]:
    mean = values.mean()
    se = values.std(ddof=1) / np.sqrt(len(values))
    return mean, mean - 1.96 * se, mean + 1.96 * se


def analyze_experiment(df: pd.DataFrame) -> dict:
    """§8.3: per-arm means with CI, Welch's t-test, Cohen's d, guardrail check, SRM."""
    control = df[df["arm"] == "control"]
    treatment = df[df["arm"] == "treatment"]

    c_mean, c_lo, c_hi = _ci95(control["outcome_value"])
    t_mean, t_lo, t_hi = _ci95(treatment["outcome_value"])
    t_stat, p_value = stats.ttest_ind(treatment["outcome_value"], control["outcome_value"], equal_var=False)
    pooled_sd = np.sqrt((control["outcome_value"].var() + treatment["outcome_value"].var()) / 2)
    cohens_d = (t_mean - c_mean) / pooled_sd if pooled_sd else 0.0
    lift_pct = (t_mean - c_mean) / c_mean * 100 if c_mean else 0.0

    g_c_mean, g_c_lo, g_c_hi = _ci95(control["guardrail_value"])
    g_t_mean, g_t_lo, g_t_hi = _ci95(treatment["guardrail_value"])
    g_stat, g_p = stats.ttest_ind(treatment["guardrail_value"], control["guardrail_value"], equal_var=False)
    guardrail_delta = g_t_mean - g_c_mean
    # Tolerance: a guardrail may regress up to 3% of its control mean before it's flagged —
    # small negative noise is expected; the flag is for a regression large AND credible.
    guardrail_regressed = bool(guardrail_delta < -0.03 * g_c_mean and g_p < 0.10)

    n_c, n_t = len(control), len(treatment)
    srm_chi2, srm_p = stats.chisquare([n_c, n_t], f_exp=[(n_c + n_t) / 2, (n_c + n_t) / 2])

    significant = p_value < 0.05
    if significant and lift_pct > 0:
        verdict = (f"Variant '{treatment['arm_label'].iloc[0]}' improved the primary metric by "
                   f"{lift_pct:+.1f}% (p={p_value:.3f}, Cohen's d={cohens_d:.2f}). Statistically significant.")
    elif significant:
        verdict = (f"Variant '{treatment['arm_label'].iloc[0]}' was {abs(lift_pct):.1f}% WORSE on the "
                   f"primary metric (p={p_value:.3f}). Statistically significant regression.")
    else:
        verdict = (f"No statistically significant difference on the primary metric "
                   f"({lift_pct:+.1f}%, p={p_value:.3f}). Treat as inconclusive at this sample size "
                   f"(n={n_t} treatment / {n_c} control), not as a null result.")
    if guardrail_regressed:
        verdict += (f" Guardrail '{df.attrs.get('guardrail_metric', 'engagement')}' regressed "
                    f"{guardrail_delta / g_c_mean * 100:.1f}% — recommend NOT shipping despite the above.")

    return {
        "n_control": n_c, "n_treatment": n_t,
        "control_mean": c_mean, "control_ci": (c_lo, c_hi),
        "treatment_mean": t_mean, "treatment_ci": (t_lo, t_hi),
        "p_value": p_value, "cohens_d": cohens_d, "lift_pct": lift_pct, "significant": significant,
        "guardrail_control_mean": g_c_mean, "guardrail_control_ci": (g_c_lo, g_c_hi),
        "guardrail_treatment_mean": g_t_mean, "guardrail_treatment_ci": (g_t_lo, g_t_hi),
        "guardrail_p": g_p, "guardrail_regressed": guardrail_regressed,
        "srm_p": srm_p, "srm_flag": srm_p < 0.01,
        "verdict": verdict,
    }


def experiment_segments(df: pd.DataFrame) -> pd.DataFrame:
    """§8.3 segmentation: by district and by prior-mastery band. Not by grade band —
    every seeded student is grade_level 10 (see synth.py's docstring)."""
    df = df.copy()
    df["prior_band"] = pd.cut(df["prior_mastery"], bins=[0, 0.4, 0.7, 1.0],
                               labels=["low prior (<0.4)", "mid prior (0.4-0.7)", "high prior (>0.7)"])
    rows = []
    for dim, col in [("district", "district_id"), ("prior mastery band", "prior_band")]:
        for value, grp in df.groupby(col, observed=True):
            c = grp[grp["arm"] == "control"]["outcome_value"]
            t = grp[grp["arm"] == "treatment"]["outcome_value"]
            if len(c) < 5 or len(t) < 5:
                continue
            rows.append({
                "dimension": dim, "segment": str(value),
                "control_mean": round(c.mean(), 3), "treatment_mean": round(t.mean(), 3),
                "lift_pct": round((t.mean() - c.mean()) / c.mean() * 100, 1) if c.mean() else 0.0,
                "n": len(grp),
            })
    return pd.DataFrame(rows)
