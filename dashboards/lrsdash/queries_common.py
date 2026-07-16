"""Queries shared by all three dashboards: populating filter dropdowns and reading the
tenancy hierarchy (spec §4.1-§4.2). Report-specific queries live in queries_admin.py /
queries_teacher.py / queries_author.py, one module per dashboard in the catalog (§7).
"""

from __future__ import annotations

import pandas as pd

from lrsdash.db import q


def districts() -> pd.DataFrame:
    return q("MATCH (d:District) RETURN d.district_id AS district_id, d.name AS name "
             "ORDER BY d.name")


def schools(district_id: str | None = None) -> pd.DataFrame:
    where = "WHERE d.district_id = $district_id" if district_id else ""
    return q(f"""
        MATCH (d:District)-[:HAS_SCHOOL]->(s:School)
        {where}
        RETURN s.school_id AS school_id, s.name AS name, d.district_id AS district_id
        ORDER BY s.name
    """, district_id=district_id)


def textbooks() -> pd.DataFrame:
    """Only books actually deployed somewhere — an author picking from the full 54-book
    catalogue when 3 are unused would be picking a name with nothing behind it."""
    return q("""
        MATCH (tb:Textbook)<-[:VERSION_OF]-(:TextbookVersion)<-[:DEPLOYS]-(:Section)
        RETURN DISTINCT tb.textbook_id AS textbook_id, tb.title AS title
        ORDER BY tb.title
    """)


def instructors() -> pd.DataFrame:
    """There is no identity/auth service yet (cli.py: 'Roles still to build... identity').
    The teacher dashboard stands in a picker for 'the logged-in teacher' rather than
    inventing a login the rest of the stack doesn't have."""
    return q("""
        MATCH (i:Instructor)-[:TEACHES]->(sec:Section)<-[:HAS_SECTION]-(c:Course)
        WITH i, count(sec) AS n, collect(c.title)[0] AS a_course
        RETURN i.instructor_key AS instructor_key, n AS section_count, a_course AS sample_course
        ORDER BY i.instructor_key
    """)


def sections_for_instructor(instructor_key: str) -> pd.DataFrame:
    return q("""
        MATCH (i:Instructor {instructor_key: $key})-[:TEACHES]->(sec:Section)
        MATCH (sec)<-[:HAS_SECTION]-(c:Course)<-[:OFFERS]-(sch:School)
        MATCH (sec)-[:DEPLOYS]->(v:TextbookVersion)-[:VERSION_OF]->(tb:Textbook)
        RETURN sec.section_id AS section_id, c.title AS course, sch.name AS school,
               tb.title AS textbook, tb.textbook_id AS textbook_id, v.version_id AS version_id,
               sec.period AS period
        ORDER BY c.title, sec.period
    """, key=instructor_key)


def evidence_count(section_id: str | None = None, textbook_id: str | None = None) -> int:
    """Total `statements_compressed` behind a scope, for the evidence-note footer
    (spec §4.3). Sums across mastery + page + question summaries."""
    if section_id:
        df = q("""
            MATCH (:Section {section_id: $sid})<-[:ENROLLED_IN]-(st:Student)
            OPTIONAL MATCH (st)-[:HAS_MASTERY]->(cm:ConceptMastery)
            OPTIONAL MATCH (st)-[:ENGAGED_WITH]->(pe:PageEngagement)
            OPTIONAL MATCH (st)-[:RESPONDED_TO]->(qr:QuestionResponse)
            RETURN coalesce(sum(cm.statements_compressed), 0)
                 + coalesce(sum(pe.statements_compressed), 0)
                 + coalesce(sum(qr.statements_compressed), 0) AS n
        """, sid=section_id)
    elif textbook_id:
        df = q("""
            MATCH (v:TextbookVersion)-[:VERSION_OF]->(:Textbook {textbook_id: $tid})
            OPTIONAL MATCH (cm:ConceptMastery)-[:IN_CONTEXT_OF]->(v)
            OPTIONAL MATCH (pe:PageEngagement)-[:IN_CONTEXT_OF]->(v)
            RETURN coalesce(sum(cm.statements_compressed), 0)
                 + coalesce(sum(pe.statements_compressed), 0) AS n
        """, tid=textbook_id)
    else:
        return 0
    return int(df.iloc[0]["n"]) if not df.empty else 0
