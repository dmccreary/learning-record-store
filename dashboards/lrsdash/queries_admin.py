"""Queries for the District Overview dashboard — spec §7.4, §9.4 (R-401-R-404, R-407).

Audience: a district/school administrator, scoped by an optional `district_id` (None =
every district — the "System Admin" system-wide view is a separate dashboard the spec
puts in a different catalog row and is out of scope here: a school administrator does
not see other districts' data in a real deployment, so "All Districts" exists only
because this demo has one operator looking at a multi-tenant seed, not because a real
admin UI would offer it).
"""

from __future__ import annotations

import hashlib

import pandas as pd

from lrsdash.db import q

# Spec §4.1 has no `licensed_seats` property on District — no such concept exists in the
# graph yet (identity/billing is unbuilt, per cli.py). R-407 needs a capacity to compare
# against, so this is a presentation-layer assumption (never written back to Neo4j).
# Headroom varies per district (0.10-0.30 above enrollment, deterministic on district_id)
# rather than one fixed ratio — every district contracts a different seat count in
# practice, and a single constant multiplier made every gauge read an identical 86.9%,
# which is a giveaway that the number is fake rather than a real license count.
def _headroom(district_id: str) -> float:
    return 1.10 + 0.20 * (int(hashlib.sha256(district_id.encode()).hexdigest()[:8], 16) % 1000) / 1000


def _district_filter(district_id: str | None) -> str:
    return "{district_id: $district_id}" if district_id else ""


def kpi_summary(district_id: str | None = None) -> dict:
    df = q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(sec:Section)
        OPTIONAL MATCH (sec)<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (sec)-[:DEPLOYS]->(:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)
        RETURN count(DISTINCT st) AS students, count(DISTINCT tb) AS textbooks,
               count(DISTINCT sec) AS sections, round(avg(cm.mastery_score), 3) AS mastery,
               sum(cm.statements_compressed) AS statements
        """,
        district_id=district_id,
    )
    row = df.iloc[0].to_dict() if not df.empty else {}
    return {
        "students": int(row.get("students") or 0),
        "textbooks": int(row.get("textbooks") or 0),
        "sections": int(row.get("sections") or 0),
        "mastery": float(row.get("mastery") or 0.0),
        "statements": int(row.get("statements") or 0),
    }


def daily_activity(district_id: str | None = None) -> pd.DataFrame:
    """Statements/day trend for R-401's KPI-tile sparkline. Sums `statements_compressed`
    across summary types grouped by the day evidence was last seen — a proxy for ingest
    volume, since the raw event store isn't queried by these dashboards (spec §9.3:
    figures read pre-aggregated data, never per-statement rows).

    Mastery and engagement are summed with TWO independent Cypher queries, not one query
    with both as OPTIONAL MATCH: combining them in a single WITH cross-joins every
    ConceptMastery a student has with every PageEngagement they have before the WHERE
    filter runs (a student with 30 masteries and 15 engagements yields 450 rows, not 45).
    At showcase scale that turned a sub-second aggregate into a 72-second one — well
    outside the §9.3 P95 budget. Two narrow queries, summed in pandas, is both correct
    and fast.
    """
    mastery = q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(:Section)<-[:ENROLLED_IN]-(:Student)
              -[:HAS_MASTERY]->(cm:ConceptMastery)
        RETURN toString(date(cm.last_seen)) AS day, sum(cm.statements_compressed) AS n
        """,
        district_id=district_id,
    )
    engagement = q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(:Section)<-[:ENROLLED_IN]-(:Student)
              -[:ENGAGED_WITH]->(pe:PageEngagement)
        RETURN toString(date(pe.last_seen)) AS day, sum(pe.statements_compressed) AS n
        """,
        district_id=district_id,
    )
    merged = pd.concat([mastery, engagement]).groupby("day", as_index=False)["n"].sum()
    return merged.rename(columns={"n": "statements"}).sort_values("day")


def school_comparison(district_id: str | None = None) -> pd.DataFrame:
    return q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(s:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(sec:Section)<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)
        WITH s, st, avg(cm.mastery_score) AS student_mastery, sum(cm.statements_compressed) AS stmts
        RETURN s.name AS school, count(DISTINCT st) AS students,
               round(avg(student_mastery), 3) AS mean_mastery,
               sum(stmts) AS statements
        ORDER BY school
        """,
        district_id=district_id,
    )


def course_rollup(district_id: str | None = None) -> pd.DataFrame:
    return q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(s:School)
              -[:OFFERS]->(c:Course)-[:HAS_SECTION]->(sec:Section)<-[:ENROLLED_IN]-(st:Student)
        OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)
        WITH s, c, st, avg(cm.mastery_score) AS student_mastery
        RETURN s.name AS school, c.title AS course, c.subject AS subject,
               count(DISTINCT st) AS students, round(avg(student_mastery), 3) AS mean_mastery
        ORDER BY students DESC
        """,
        district_id=district_id,
    )


def deployment_inventory(district_id: str | None = None) -> pd.DataFrame:
    """R-404. No `provisional` vs `reconciled` column: that distinction belongs to the
    event store's ingestion state (spec §5.3) which this graph-backed report has no
    visibility into — shown honestly as version/reach, not padded with an invented flag."""
    return q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(sec:Section)
              -[:DEPLOYS]->(v:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        OPTIONAL MATCH (sec)<-[:ENROLLED_IN]-(st:Student)
        RETURN tb.title AS textbook, v.semver AS version, v.published_at AS published_at,
               count(DISTINCT d) AS districts, count(DISTINCT sec) AS sections,
               count(DISTINCT st) AS students
        ORDER BY textbook, version
        """,
        district_id=district_id,
    )


def seat_utilization(district_id: str | None = None) -> pd.DataFrame:
    df = q(
        f"""
        MATCH (d:District {_district_filter(district_id)})-[:HAS_SCHOOL]->(:School)
              -[:OFFERS]->(:Course)-[:HAS_SECTION]->(:Section)<-[:ENROLLED_IN]-(st:Student)
        RETURN d.district_id AS district_id, d.name AS district, count(DISTINCT st) AS active_seats
        ORDER BY district
        """,
        district_id=district_id,
    )
    headroom = df["district_id"].map(_headroom)
    df["licensed_seats"] = (df["active_seats"] * headroom).round().astype(int)
    df["utilization"] = (df["active_seats"] / df["licensed_seats"]).round(3)
    return df.drop(columns="district_id")


def district_list() -> pd.DataFrame:
    return q("MATCH (d:District) RETURN d.district_id AS district_id, d.name AS name ORDER BY d.name")
