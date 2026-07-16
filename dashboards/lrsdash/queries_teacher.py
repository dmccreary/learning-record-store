"""Queries for the two teacher dashboards — spec §9.4:
'My Classes' (R-201, R-203, R-209, R-107) and 'Student Detail' (R-101-R-109).

Audience: one instructor. There is no identity/auth service yet (see queries_common.py),
so every query here is scoped by an explicit `section_id` the app gets from a picker
standing in for "the sections I teach."

SCOPE NOTES (each is a real gap, not an oversight — see the function it affects):
  - R-201 heatmap is scoped to ONE chapter, not the whole book: sections span 109-561
    concepts (measured), and a 500-column heatmap is not a report a teacher can read.
  - R-103 (Time-on-Task Timeline) has no `LearningSession` data to draw from — `lrs seed`
    never populates it (see synth.py's docstring) and adding a 6th synthetic vertex type
    was out of scope here. It is approximated from PageEngagement's first_seen/last_seen
    span per page, which is real data, just coarser than a true session-by-session Gantt.
  - R-105 (Prerequisite Gap Analysis) is shown as a ranked bar list of a weak concept's
    prerequisites, not a rendered subgraph — spec's own T-2 (Graph Explorer) is the tool
    that owns a real graph-drawing widget (dash-cytoscape); duplicating that dependency
    for one report here would be a second, heavier way to do the same job.
  - R-109 (Reading vs. Doing) can't use verb-level statement counts: spec §4.1 says Verb
    is "not edged to from the graph" — the graph has no per-statement verb at all. It's
    approximated from summary-vertex counts (PageEngagement = reading, QuestionResponse +
    MicroSimEngagement = doing), which is the closest real signal the graph carries.
"""

from __future__ import annotations

import pandas as pd

from lrsdash.db import q

MASTERY_PASS = 0.6  # spec doesn't fix a mastery threshold; this is the demo's cut line,
                     # used consistently across R-101/104/105 rather than each picking its own.
STRUGGLE_MIN_ATTEMPTS = 4
IDLE_DAYS = 10


def chapters_for_section(section_id: str) -> pd.DataFrame:
    return q(
        """
        MATCH (:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(ch:Chapter)
        RETURN ch.chapter_id AS chapter_id, ch.title AS title, ch.order AS order
        ORDER BY ch.order
        """,
        sid=section_id,
    )


def class_mastery_heatmap(section_id: str, chapter_id: str) -> pd.DataFrame:
    """R-201: (student x concept) mastery, scoped to one chapter's concepts."""
    return q(
        """
        MATCH (:Chapter {chapter_id: $cid})-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN st.student_key AS student, c.label AS concept,
               cm.mastery_score AS mastery, coalesce(cm.evidence_count, 0) AS evidence
        ORDER BY student, concept
        """,
        sid=section_id, cid=chapter_id,
    )


def concept_difficulty(section_id: str, chapter_id: str) -> pd.DataFrame:
    """R-202: mean class score per concept, ascending (hardest first)."""
    return q(
        """
        MATCH (:Chapter {chapter_id: $cid})-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(:Student)-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN c.label AS concept, round(avg(cm.mastery_score), 3) AS mean_mastery, count(cm) AS n
        ORDER BY mean_mastery ASC
        """,
        sid=section_id, cid=chapter_id,
    )


def completion_funnel(section_id: str) -> pd.DataFrame:
    """R-203: how many enrolled students have ANY evidence in each chapter, in book order.
    A monotonically-declining count IS the funnel — no separate 'stage reached' flag
    exists, so 'reached chapter N' is read as 'has touched something in chapter N.'"""
    return q(
        """
        MATCH (sec:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(ch:Chapter)
        MATCH (sec)<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (ch)-[:CONTAINS]->(:Page)-[:COVERS]->(:Concept)<-[:OF_CONCEPT]-(cm:ConceptMastery)<-[:HAS_MASTERY]-(st)
        WITH ch, count(DISTINCT st) AS total, count(DISTINCT CASE WHEN cm IS NOT NULL THEN st END) AS reached
        RETURN ch.title AS chapter, ch.order AS order, reached, total
        ORDER BY order
        """,
        sid=section_id,
    )


def roster(section_id: str) -> pd.DataFrame:
    """Backs R-209 (At-Risk Roster) and R-107 (Idle Alert). `as_of` is the latest
    evidence timestamp anywhere in the section, not wall-clock time — the seeded term
    ended in the past relative to today, so comparing against real 'now' would flag
    every student as idle. See this module's docstring."""
    df = q(
        """
        MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)
        WITH st, avg(cm.mastery_score) AS mastery, max(cm.last_seen) AS last_active,
             count(cm) AS concepts_attempted
        RETURN st.student_key AS student, round(mastery, 3) AS mastery,
               last_active, concepts_attempted
        ORDER BY student
        """,
        sid=section_id,
    )
    if df.empty:
        return df
    as_of = df["last_active"].max()
    df["days_idle"] = (as_of - df["last_active"]).dt.days
    df["idle"] = df["days_idle"] >= IDLE_DAYS
    return df


def prereq_gap_counts(section_id: str) -> pd.DataFrame:
    """Per student: count of concepts they attempted where a DEPENDS_ON prerequisite is
    unmastered (< MASTERY_PASS). Feeds the At-Risk composite alongside raw mastery."""
    return q(
        """
        MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(st:Student)-[:HAS_MASTERY]->(cm:ConceptMastery)
              -[:OF_CONCEPT]->(c:Concept)-[:DEPENDS_ON]->(pre:Concept)
        MATCH (st)-[:HAS_MASTERY]->(pcm:ConceptMastery)-[:OF_CONCEPT]->(pre)
        WITH st, c, min(pcm.mastery_score) AS weakest_prereq
        WHERE weakest_prereq < $threshold
        RETURN st.student_key AS student, count(DISTINCT c) AS gap_count
        """,
        sid=section_id, threshold=MASTERY_PASS,
    )


def students_in_section(section_id: str) -> pd.DataFrame:
    return q(
        "MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(st:Student) "
        "RETURN st.student_key AS student_key ORDER BY student_key",
        sid=section_id,
    )


# --- Student Detail (R-101 - R-109) ----------------------------------------------------


def student_progress(student_key: str, section_id: str) -> dict:
    """R-101: concepts with mastery evidence vs. the book's total concept count."""
    df = q(
        """
        MATCH (:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        OPTIONAL MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN count(c) AS total_concepts, count(cm) AS attempted,
               count(CASE WHEN cm.mastery_score >= $mastery_pass THEN 1 END) AS mastered
        """,
        sid=section_id, student=student_key, mastery_pass=MASTERY_PASS,
    )
    row = df.iloc[0].to_dict()
    return {k: int(v) for k, v in row.items()}


def student_concept_checklist(student_key: str, section_id: str) -> pd.DataFrame:
    return q(
        """
        MATCH (:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        OPTIONAL MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN c.label AS concept, c.taxonomy_category AS category,
               coalesce(cm.mastery_score, 0.0) AS mastery, cm IS NOT NULL AS attempted
        ORDER BY category, concept
        """,
        sid=section_id, student=student_key,
    )


def student_mastery_radar(student_key: str, section_id: str) -> pd.DataFrame:
    """R-102: mean mastery by taxonomy category."""
    return q(
        """
        MATCH (:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(:Chapter)-[:CONTAINS]->(:Page)-[:COVERS]->(c:Concept)
        WITH DISTINCT c
        MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c)
        RETURN c.taxonomy_category AS category, round(avg(cm.mastery_score), 3) AS mastery
        ORDER BY category
        """,
        sid=section_id, student=student_key,
    )


def student_page_timeline(student_key: str, section_id: str) -> pd.DataFrame:
    """R-103 (approximated — see module docstring)."""
    return q(
        """
        MATCH (:Section {section_id: $sid})-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        MATCH (tb)-[:CONTAINS]->(ch:Chapter)-[:CONTAINS]->(pg:Page)
        MATCH (:Student {student_key: $student})-[:ENGAGED_WITH]->(pe:PageEngagement)-[:SUMMARIZES]->(pg)
        RETURN pg.title AS page, ch.order AS chapter_order, pe.first_seen AS start,
               pe.last_seen AS end, pe.dwell_ms_total AS dwell_ms
        ORDER BY start
        """,
        sid=section_id, student=student_key,
    )


def student_struggles(student_key: str) -> pd.DataFrame:
    """R-104: concepts with enough attempts to be meaningful, ranked by lowest score."""
    return q(
        """
        MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(c:Concept)
        WHERE cm.attempts >= $min_attempts
        RETURN c.concept_id AS concept_id, c.label AS concept, cm.mastery_score AS mastery,
               cm.attempts AS attempts, cm.successes AS successes
        ORDER BY mastery ASC
        LIMIT 10
        """,
        student=student_key, min_attempts=STRUGGLE_MIN_ATTEMPTS,
    )


def prerequisite_gap(student_key: str, concept_id: str) -> pd.DataFrame:
    """R-105 (shown as a ranked bar list — see module docstring)."""
    return q(
        """
        MATCH (:Concept {concept_id: $cid})-[:DEPENDS_ON]->(pre:Concept)
        OPTIONAL MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)-[:OF_CONCEPT]->(pre)
        RETURN pre.label AS prerequisite, coalesce(cm.mastery_score, 0.0) AS mastery,
               cm IS NOT NULL AS attempted
        ORDER BY mastery ASC
        """,
        cid=concept_id, student=student_key,
    )


def student_quiz_items(student_key: str) -> pd.DataFrame:
    """R-106."""
    return q(
        """
        MATCH (:Student {student_key: $student})-[:RESPONDED_TO]->(qr:QuestionResponse)-[:SUMMARIZES]->(qn:Question)
        RETURN qn.question_id AS question_id, qn.bloom_level AS bloom_level,
               qr.attempts AS attempts, qr.successes AS successes, qr.mean_score AS mean_score
        ORDER BY mean_score ASC
        """,
        student=student_key,
    )


def student_velocity(student_key: str) -> pd.DataFrame:
    """R-108: cumulative distinct concepts mastered, by week of first evidence."""
    df = q(
        """
        MATCH (:Student {student_key: $student})-[:HAS_MASTERY]->(cm:ConceptMastery)
        RETURN cm.first_seen AS first_seen
        ORDER BY first_seen
        """,
        student=student_key,
    )
    if df.empty:
        return df
    # tz_localize(None): every timestamp in this dataset is UTC (config.py never mixes
    # zones), so dropping tz here just silences to_period's tz-unaware warning.
    df["week"] = df["first_seen"].dt.tz_localize(None).dt.to_period("W").apply(lambda p: p.start_time)
    weekly = df.groupby("week").size().reset_index(name="new_concepts")
    weekly["cumulative"] = weekly["new_concepts"].cumsum()
    return weekly


def student_reading_vs_doing(student_key: str) -> dict:
    """R-109 (approximated from summary-vertex counts — see module docstring)."""
    df = q(
        """
        MATCH (s:Student {student_key: $student})
        OPTIONAL MATCH (s)-[:ENGAGED_WITH]->(pe:PageEngagement)
        OPTIONAL MATCH (s)-[:RESPONDED_TO]->(qr:QuestionResponse)
        OPTIONAL MATCH (s)-[:ENGAGED_WITH]->(mse:MicroSimEngagement)
        RETURN count(DISTINCT pe) AS reading, count(DISTINCT qr) + count(DISTINCT mse) AS doing
        """,
        student=student_key,
    )
    row = df.iloc[0].to_dict()
    return {"reading": int(row["reading"] or 0), "doing": int(row["doing"] or 0)}
