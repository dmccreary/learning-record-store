"""The xAPI producer contract, as executable tests.

Named after the contract SECTIONS they enforce, following the plan's convention that "test
names cite spec requirement IDs so a spec change that breaks a constraint fails CI by name."
If a rule here is deliberately changed, the failing test name says which section to amend.

These are pure — no broker, no ClickHouse — because every rule they cover is decidable from
the statement alone. The gateway's transport behaviour (auth, all-or-nothing produce, 503) is
verified against a live Redpanda separately; that is an integration concern.

Each case targets a defect that has ALREADY HAPPENED in this repo, or that the DDL cannot
survive. None of them is hypothetical.
"""

from __future__ import annotations

import copy
from typing import Any

import pytest

from lrs.gateway.validation import (
    parse_version_iri,
    raw_actor_identity,
    validate_batch,
    validate_statement,
)

SITE = "https://dmccreary.github.io/learning-record-store/"
VERSION_IRI = SITE + "textbook/lrs/v1.0.0"
SIM = SITE + "sims/animal-cell/"


def valid() -> dict[str, Any]:
    return {
        "actor": {
            "objectType": "Agent",
            "account": {"homePage": "https://demo.example.edu", "name": "demo-student"},
        },
        "verb": {
            "id": "http://adlnet.gov/expapi/verbs/experienced",
            "display": {"en-US": "experienced"},
        },
        "object": {
            "objectType": "Activity",
            "id": SIM,
            "definition": {
                "type": "http://adlnet.gov/expapi/activities/simulation",
                "name": {"en-US": "Animal Cell"},
            },
        },
        "result": {"duration": "PT30S"},
        "context": {"contextActivities": {"grouping": [{"id": VERSION_IRI}]}},
        "timestamp": "2026-07-16T18:00:00Z",
    }


def fields(statement: dict[str, Any]) -> set[str]:
    return {v.field for v in validate_statement(0, statement)}


def test_the_baseline_is_actually_valid() -> None:
    """If this ever fails, every negative test below is passing for the wrong reason."""
    assert validate_statement(0, valid()) == []


# --- §1 the canonical activity IRI -------------------------------------------------


def test_s1_rejects_main_html_iri() -> None:
    """sine-wave's real bug: main.html is the iframe payload, not the activity.

    Citing it mints a second IRI for one activity, and student_page_rollup is
    ORDER BY object_id — so one student's engagement lands in two rows that never merge.
    """
    s = valid()
    s["object"]["id"] = SIM + "main.html"
    assert "object.id" in fields(s)


def test_s1_rejects_local_origin() -> None:
    """"A statement emitted from a local mkdocs serve must carry the published IRI."""
    s = valid()
    s["object"]["id"] = "http://127.0.0.1:8000/sims/animal-cell/"
    assert "object.id" in fields(s)


def test_s1_rejects_page_iri_without_trailing_slash() -> None:
    """`…/sims/x/` and `…/sims/x` are different strings to ORDER BY object_id."""
    s = valid()
    s["object"]["id"] = SITE + "sims/animal-cell"
    assert "object.id" in fields(s)


# --- §3 verbs -----------------------------------------------------------------------


@pytest.mark.parametrize("verb", ["answered", "experienced", "interacted"])
def test_s3_accepts_exactly_the_three_v1_verbs(verb: str) -> None:
    s = valid()
    s["verb"] = {"id": f"http://adlnet.gov/expapi/verbs/{verb}", "display": {"en-US": verb}}
    if verb == "answered":
        s["result"] = {"success": True, "score": {"scaled": 1.0}}
        s["object"]["id"] = SIM + "#q-nucleus"
        s["object"]["definition"]["type"] = "http://adlnet.gov/expapi/activities/cmi.interaction"
    assert validate_statement(0, s) == []


def test_s3_rejects_completed() -> None:
    """`completed` is the one verb in the design and it is not in v1.

    It carries no success, so a rollup fed by it reports attempts = 0 for every student.
    """
    s = valid()
    s["verb"]["id"] = "http://adlnet.gov/expapi/verbs/completed"
    assert "verb.id" in fields(s)


def test_s3_answered_requires_success() -> None:
    """Without result.success, countIf(result_success IS NOT NULL) counts zero forever.

    A concept with real attempts would be indistinguishable from one never attempted.
    """
    s = valid()
    s["verb"]["id"] = "http://adlnet.gov/expapi/verbs/answered"
    s["object"]["id"] = SIM + "#q-nucleus"
    s["object"]["definition"]["type"] = "http://adlnet.gov/expapi/activities/cmi.interaction"
    s["result"] = {"score": {"scaled": 1.0}}
    assert "result.success" in fields(s)


def test_s3_answered_success_false_is_valid() -> None:
    """A failed attempt is evidence. Truthiness checks drop it; this guards that.

    animal-cell's quiz emits false,false,true — the repo's first BKT sequence. If
    success:false were rejected or dropped, brute-forcing would look like instant mastery.
    """
    s = valid()
    s["verb"]["id"] = "http://adlnet.gov/expapi/verbs/answered"
    s["object"]["id"] = SIM + "#q-nucleus"
    s["object"]["definition"]["type"] = "http://adlnet.gov/expapi/activities/cmi.interaction"
    s["result"] = {"success": False, "score": {"scaled": 0.0}}
    assert validate_statement(0, s) == []


def test_s3_experienced_requires_duration() -> None:
    """duration is the only field feeding dwell_ms_total."""
    s = valid()
    del s["result"]
    assert "result.duration" in fields(s)


# --- §4 the textbook version IRI ----------------------------------------------------


def test_s4_parses_the_version_iri() -> None:
    assert parse_version_iri(VERSION_IRI) == ("lrs", "v1.0.0")


@pytest.mark.parametrize(
    "iri",
    [
        SITE + "sims/sine-wave/",  # sine-wave's real bug: a PAGE URL where the version goes
        "https://example.edu/textbook/lrs",  # missing version
        SITE + "textbook/lrs/v1.0.0/extra",  # too many segments
        SITE + "textbook//v1.0.0",  # empty textbook_id
    ],
)
def test_s4_rejects_a_grouping_that_is_not_a_version_iri(iri: str) -> None:
    assert parse_version_iri(iri) is None
    s = valid()
    s["context"]["contextActivities"]["grouping"] = [{"id": iri}]
    assert "context.contextActivities.grouping[0].id" in fields(s)


def test_s4_grouping_is_required_on_every_statement() -> None:
    """textbook_id and version_id are NOT NULL and have no sensible default."""
    s = valid()
    s["context"] = {}
    assert "context.contextActivities.grouping[0].id" in fields(s)


# --- §5 object type mapping ---------------------------------------------------------


def test_s5_rejects_unmapped_activity_type() -> None:
    s = valid()
    s["object"]["definition"]["type"] = "http://adlnet.gov/expapi/activities/course"
    assert "object.definition.type" in fields(s)


def test_s5_fragment_iri_must_not_be_page_grain() -> None:
    """mv_student_page_rollup is GROUP BY object_id.

    A fragment IRI typed MicroSim mints one PageEngagement vertex per control, for a page
    the student visited once. This is why `Control` exists.
    """
    s = valid()
    s["object"]["id"] = SIM + "#nucleus"  # still typed simulation -> MicroSim
    assert "object.id" in fields(s)


def test_s5_fragment_iri_is_fine_as_a_control() -> None:
    s = valid()
    s["object"]["id"] = SIM + "#nucleus"
    s["object"]["definition"]["type"] = "http://adlnet.gov/expapi/activities/interaction"
    s["verb"] = {
        "id": "http://adlnet.gov/expapi/verbs/interacted",
        "display": {"en-US": "interacted"},
    }
    assert validate_statement(0, s) == []


def test_s5_question_and_control_types_are_not_confused() -> None:
    """cmi.interaction and interaction differ by four characters and drive different MVs."""
    from lrs.gateway.validation import ACTIVITY_TYPES

    assert ACTIVITY_TYPES["http://adlnet.gov/expapi/activities/cmi.interaction"] == "Question"
    assert ACTIVITY_TYPES["http://adlnet.gov/expapi/activities/interaction"] == "Control"


# --- §5.2 / §8 actor ----------------------------------------------------------------


def test_s52_actor_identity_is_the_hmac_input() -> None:
    assert (
        raw_actor_identity(valid()["actor"]) == "https://demo.example.edu|demo-student"
    )


def test_s52_rejects_actor_without_account() -> None:
    """Without account.homePage+name there is no HMAC input and no partition key."""
    s = valid()
    s["actor"] = {"objectType": "Agent", "mbox": "mailto:x@example.edu"}
    assert "actor.account" in fields(s)


# --- §9 transport -------------------------------------------------------------------


def test_s9_body_must_be_an_array() -> None:
    assert validate_batch(valid()) != []
    assert validate_batch([valid()]) == []


def test_s9_empty_batch_is_rejected() -> None:
    assert validate_batch([]) != []


def test_s9_batch_reports_every_violation_not_just_the_first() -> None:
    """All-or-nothing means one 400 fixes the whole batch, not one bug per round trip."""
    bad_verb = copy.deepcopy(valid())
    bad_verb["verb"]["id"] = "http://adlnet.gov/expapi/verbs/completed"
    bad_group = copy.deepcopy(valid())
    bad_group["context"]["contextActivities"]["grouping"] = [{"id": SITE + "sims/x/"}]

    violations = validate_batch([valid(), bad_verb, bad_group])
    assert {v.index for v in violations} == {1, 2}
    assert len(violations) == 2


def test_s9_id_when_supplied_must_be_a_uuid() -> None:
    """smoke.sh queries WHERE statement_id = the id it sent, so it round-trips verbatim."""
    s = valid()
    s["id"] = "not-a-uuid"
    assert "id" in fields(s)


def test_s9_timestamp_must_parse() -> None:
    s = valid()
    s["timestamp"] = "last tuesday"
    assert "timestamp" in fields(s)
