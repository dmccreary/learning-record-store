"""L-6: MicroSims emit compact xAPI — one summary when the sim loses focus — when their
metadata.json says so, and their full per-interaction stream when it does not.

Spec: docs/lrs-lite/index.md §6 (L-6 is requirement 6 of §1.2). Library:
docs/js/lrs-lite-sim.js. Sims: bouncing-ball, sine-wave, scientific-method.

Each test drives a real sim in headless Chromium, embedded in an iframe the way the book
embeds it, and rewrites that sim's metadata.json in flight (page.route). So compact ON,
compact OFF, and "no xapi block" are all tested against the committed sim code without
editing the committed files. docs/ is served by a throwaway static server.

Needs Playwright plus network access to cdn.jsdelivr.net (p5.js, Mermaid). The backend's
own environment does not carry Playwright, so plain `uv run pytest` skips this module.
Run it with:

    make test-sims
"""

from __future__ import annotations

import functools
import http.server
import json
import threading
from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Any

import pytest

sync_api = pytest.importorskip("playwright.sync_api")

DOCS = Path(__file__).resolve().parent.parent / "docs"
SITE = "https://dmccreary.github.io/learning-record-store/"
VERSION_IRI = SITE + "textbook/lrs/v1.0.0"
EXT = "https://w3id.org/lrs/ext/"

# Short timers so focus loss happens within a test's patience, not a student's.
FAST = {"idleMs": 60000, "offscreenMs": 300, "blurMs": 60000}

HIDE_TAB = """() => {
  Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'});
  document.dispatchEvent(new Event('visibilitychange'));
}"""
SHOW_TAB = HIDE_TAB.replace("'hidden'", "'visible'")

MOVE_SLIDER = """([index, values]) => {
  const el = document.querySelectorAll('input[type=range]')[index];
  for (const v of values) {
    el.value = String(v);
    el.dispatchEvent(new Event('input', {bubbles: true}));
  }
}"""


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        pass


@pytest.fixture(scope="module")
def docs_url() -> Iterator[str]:
    handler = functools.partial(_QuietHandler, directory=str(DOCS))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{server.server_address[1]}"
    server.shutdown()


@pytest.fixture(scope="module")
def browser() -> Iterator[Any]:
    with sync_api.sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture
def page(browser: Any) -> Iterator[Any]:
    context = browser.new_context(viewport={"width": 1000, "height": 800})
    yield context.new_page()
    context.close()


@pytest.fixture
def open_sim(page: Any, docs_url: str) -> Callable[[str, dict[str, Any] | None], Any]:
    """Embed a sim in a host page with its metadata.json `xapi` block replaced.

    `xapi=None` removes the block entirely. Returns the sim's Frame once LRSLite has
    loaded the policy.
    """

    def _open(sim: str, xapi: dict[str, Any] | None) -> Any:
        def rewrite_metadata(route: Any) -> None:
            response = route.fetch()
            meta = response.json()
            if xapi is None:
                meta.pop("xapi", None)
            else:
                meta["xapi"] = xapi
            route.fulfill(response=response, body=json.dumps(meta))

        def host_page(route: Any) -> None:
            route.fulfill(
                content_type="text/html",
                body=(
                    '<!doctype html><body style="margin:0">'
                    f'<iframe id="sim" src="/sims/{sim}/main.html" '
                    'style="width:900px;height:700px;border:0"></iframe>'
                    '<div style="height:6000px"></div></body>'
                ),
            )

        page.route(f"**/sims/{sim}/metadata.json", rewrite_metadata)
        page.route("**/__host__.html", host_page)
        page.goto(f"{docs_url}/__host__.html")
        frame = page.locator("iframe#sim").element_handle().content_frame()
        frame.wait_for_function(
            "window.LRSLite && document.documentElement.dataset.xapiMode", timeout=20000
        )
        return frame

    return _open


def statements(frame: Any) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = frame.evaluate("LRSLite.statements")
    return result


def verbs(sts: list[dict[str, Any]]) -> list[str]:
    return [s["verb"]["display"]["en-US"] for s in sts]


def mode(frame: Any) -> str:
    result: str = frame.evaluate("document.documentElement.dataset.xapiMode")
    return result


def assert_contract_summary(st: dict[str, Any], page_iri: str, concept: str) -> None:
    """A compact summary is still an ordinary contract-v1 `experienced` statement."""
    assert st["verb"]["id"] == "http://adlnet.gov/expapi/verbs/experienced"
    assert st["object"]["id"] == page_iri
    assert st["object"]["definition"]["type"] == "http://adlnet.gov/expapi/activities/simulation"
    assert st["result"]["duration"].startswith("PT")
    assert st["context"]["contextActivities"]["grouping"] == [{"id": VERSION_IRI}]
    assert st["context"]["extensions"][EXT + "concept_id"] == concept
    assert st["result"]["extensions"][EXT + "xapi_mode"] == "compact"


# ---------------------------------------------------------------------- bouncing-ball ----


def test_l6_bouncing_ball_off_streams_one_statement_per_interaction(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": False, **FAST})
    assert mode(frame) == "full"

    frame.evaluate(MOVE_SLIDER, [0, [5, 7, 9, 11, 13]])  # each step clears the deadband of 1
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)
    frame.get_by_role("button", name="Pause").click()

    sts = statements(frame)
    # 5 slider interacteds, then the Start press, then the Pause press, then the dwell.
    assert verbs(sts) == ["interacted"] * 7 + ["experienced"]
    assert all(EXT + "statements_represented" not in s["context"]["extensions"] for s in sts)
    assert sts[5]["object"]["id"] == SITE + "sims/bouncing-ball/#start-pause-control"
    assert sts[5]["result"]["extensions"][EXT + "action"] == "start"
    assert sts[6]["result"]["extensions"][EXT + "action"] == "pause"

    frame.evaluate(HIDE_TAB)  # nothing running, nothing folded: tab-hide adds nothing
    assert len(statements(frame)) == 8


def test_l6_bouncing_ball_on_folds_each_session_into_one_summary(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": True, **FAST})
    assert mode(frame) == "compact"

    frame.evaluate(MOVE_SLIDER, [0, [5, 7, 9, 11, 13]])
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)
    frame.get_by_role("button", name="Pause").click()
    assert statements(frame) == [], "compact mode must emit nothing before focus loss"

    frame.evaluate(HIDE_TAB)
    sts = statements(frame)
    assert len(sts) == 1
    summary = sts[0]
    assert_contract_summary(summary, SITE + "sims/bouncing-ball/", "motion")
    ext = summary["result"]["extensions"]
    assert ext[EXT + "end_reason"] == "tab-hidden"
    assert ext[EXT + "controls"]["speed-slider"] == {
        "n": 5, "min": 5, "max": 13, "last": 13, "concept": "adjustable-speed"
    }
    assert ext[EXT + "controls"]["start-pause-control"] == {
        "n": 2, "modes": {"start": 1, "pause": 1}, "concept": "motion"
    }
    assert ext[EXT + "runs"]["count"] == 1
    assert ext[EXT + "runs"]["ms"] >= 300
    # 5 slider touches + the start touch + the pause touch + the run itself.
    assert summary["context"]["extensions"][EXT + "statements_represented"] == 8

    # Coming back starts a NEW session: its summary covers only what happened after.
    frame.evaluate(SHOW_TAB)
    frame.evaluate(MOVE_SLIDER, [0, [15, 17]])
    frame.evaluate(HIDE_TAB)
    sts = statements(frame)
    assert len(sts) == 2
    second = sts[1]
    assert second["result"]["extensions"][EXT + "controls"]["speed-slider"]["n"] == 2
    assert second["context"]["extensions"][EXT + "statements_represented"] == 2


def test_l6_bouncing_ball_on_closes_a_running_interval_into_the_summary(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": True, **FAST})
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)

    frame.evaluate(HIDE_TAB)  # the student never pressed Pause
    sts = statements(frame)
    assert len(sts) == 1
    runs = sts[0]["result"]["extensions"][EXT + "runs"]
    assert runs["count"] == 1 and runs["ms"] >= 300
    # The Start press still counts as a touch even though the flush isn't a Pause click.
    assert sts[0]["result"]["extensions"][EXT + "controls"]["start-pause-control"] == {
        "n": 1, "modes": {"start": 1}, "concept": "motion"
    }
    assert frame.get_by_role("button", name="Start").is_visible()  # the sim was paused


def test_l6_bouncing_ball_radio_starts_from_metadata(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": True, **FAST})
    assert frame.get_by_label("Compact").is_checked()
    assert not frame.get_by_label("Full").is_checked()


def test_l6_bouncing_ball_simulate_done_emits_the_compact_summary(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": False, **FAST})
    frame.get_by_label("Compact").check()
    assert mode(frame) == "compact"

    frame.evaluate(MOVE_SLIDER, [0, [5, 7, 9]])
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)
    frame.get_by_role("button", name="Pause").click()
    assert statements(frame) == []

    frame.get_by_role("button", name="Simulate Done").click()
    sts = statements(frame)
    assert len(sts) == 1
    assert_contract_summary(sts[0], SITE + "sims/bouncing-ball/", "motion")
    assert sts[0]["result"]["extensions"][EXT + "end_reason"] == "simulated-done"
    # 3 slider touches + start + pause + the run
    assert sts[0]["context"]["extensions"][EXT + "statements_represented"] == 6

    frame.get_by_role("button", name="Simulate Done").click()  # session already ended
    assert len(statements(frame)) == 1


def test_l6_bouncing_ball_leaving_compact_flushes_a_mode_switch_summary(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": True, **FAST})
    frame.evaluate(MOVE_SLIDER, [0, [5, 7]])
    frame.get_by_label("Full").check()

    sts = statements(frame)
    assert len(sts) == 1
    assert sts[0]["result"]["extensions"][EXT + "end_reason"] == "mode-switch"
    assert mode(frame) == "full"

    frame.evaluate(MOVE_SLIDER, [0, [9]])  # now streams directly
    assert verbs(statements(frame)) == ["experienced", "interacted"]


def test_l6_bouncing_ball_simulate_done_in_full_mode_closes_the_run(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", {"compact": False, **FAST})
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)
    frame.get_by_role("button", name="Simulate Done").click()

    sts = statements(frame)
    # the Start press, then the run closed by the flush — and no synthetic "pause" press
    assert verbs(sts) == ["interacted", "experienced"]
    assert sts[1]["result"]["extensions"][EXT + "run-ended-by"] == "simulated-done"
    assert frame.get_by_role("button", name="Start").is_visible()


def test_l6_bouncing_ball_view_formatted_json_opens_the_summary(
    open_sim: Any, page: Any
) -> None:
    frame = open_sim("bouncing-ball", {"compact": True, **FAST})
    view = frame.get_by_role("button", name="View Formatted JSON")
    assert view.is_disabled()  # nothing to show yet

    frame.evaluate(MOVE_SLIDER, [0, [5, 7]])
    frame.get_by_role("button", name="Start").click()
    frame.wait_for_timeout(400)
    frame.get_by_role("button", name="Pause").click()
    frame.get_by_role("button", name="Simulate Done").click()
    assert view.is_enabled()

    with page.context.expect_page() as opened:
        view.click()
    tab = opened.value
    tab.wait_for_load_state()

    assert statements(frame)[-1]["id"] in tab.locator(".sub").first.inner_text()
    assert "stands for 5 full-mode statements" in tab.locator(".banner").inner_text()
    highlighted = " ".join(tab.locator(".ln.hl").all_inner_texts())
    assert "statements_represented" in highlighted and "runs" in highlighted
    assert "…/ext/runs" in tab.locator("table").inner_text()


def test_l6_bouncing_ball_clicking_a_log_line_opens_that_statement(
    open_sim: Any, page: Any
) -> None:
    frame = open_sim("bouncing-ball", {"compact": False, **FAST})
    frame.get_by_role("button", name="Start").click()  # one interacted(start) statement
    started = statements(frame)[0]

    with page.context.expect_page() as opened:
        frame.locator(".xapi-log-clickable").first.click()
    tab = opened.value
    tab.wait_for_load_state()
    assert started["id"] in tab.locator(".sub").first.inner_text()
    assert "…/ext/action" in tab.locator("table").inner_text()


def test_l6_missing_xapi_block_defaults_to_compact(open_sim: Any) -> None:
    frame = open_sim("bouncing-ball", None)
    assert mode(frame) == "compact"
    frame.evaluate(MOVE_SLIDER, [0, [5, 7, 9]])
    assert statements(frame) == []


# -------------------------------------------------------------------------- sine-wave ----


@pytest.mark.parametrize("compact", [False, True], ids=["off", "on"])
def test_l6_sine_wave(open_sim: Any, page: Any, compact: bool) -> None:
    frame = open_sim("sine-wave", {"compact": compact, **FAST})
    assert mode(frame) == ("compact" if compact else "full")

    # Amplitude slider (0-1 in y-axis units); deadband is range/60 ≈ 0.017, so steps of 0.1 count.
    frame.evaluate(MOVE_SLIDER, [0, [0.6, 0.7, 0.8, 0.9]])

    if not compact:
        sts = statements(frame)
        assert verbs(sts) == ["interacted"] * 4
        assert {s["object"]["id"] for s in sts} == {SITE + "sims/sine-wave/#amplitude-slider"}
        return

    assert statements(frame) == []
    page.evaluate("window.scrollTo(0, 5000)")  # the PARENT page scrolls the sim out of view
    frame.wait_for_function("LRSLite.statements.length === 1", timeout=5000)
    summary = statements(frame)[0]
    assert_contract_summary(summary, SITE + "sims/sine-wave/", "sine-wave")
    ext = summary["result"]["extensions"]
    assert ext[EXT + "end_reason"] == "scrolled-away"
    assert ext[EXT + "controls"]["amplitude-slider"] == {
        "n": 4, "min": 0.6, "max": 0.9, "last": 0.9, "concept": "amplitude"
    }
    assert summary["context"]["extensions"][EXT + "statements_represented"] == 4


def test_l6_sine_wave_three_concepts_in_the_full_stream(open_sim: Any) -> None:
    frame = open_sim("sine-wave", {"compact": False, **FAST})
    frame.evaluate(MOVE_SLIDER, [0, [0.75]])  # amplitude
    frame.evaluate(MOVE_SLIDER, [1, [5]])    # frequency
    frame.evaluate(MOVE_SLIDER, [2, [1.57]])  # phase, in radians
    sts = statements(frame)
    concepts = [s["context"]["extensions"][EXT + "concept_id"] for s in sts]
    assert concepts == ["amplitude", "frequency", "phase"]
    # The control is named for its concept: one word for what the student drags and
    # what the stream says it was evidence for.
    assert sts[1]["object"]["id"] == SITE + "sims/sine-wave/#frequency-slider"
    assert sts[1]["result"]["extensions"][EXT + "value"] == 5
    assert sts[2]["result"]["extensions"][EXT + "value"] == 1.57  # an angle, not pixels


def test_l6_sine_wave_simulate_done_emits_the_compact_summary(open_sim: Any) -> None:
    frame = open_sim("sine-wave", {"compact": False, **FAST})
    frame.get_by_label("Compact").check()
    assert mode(frame) == "compact"

    frame.evaluate(MOVE_SLIDER, [0, [0.75, 0.9, 0.6]])  # up, up, down: one reversal
    frame.evaluate(MOVE_SLIDER, [1, [5]])
    assert statements(frame) == []

    frame.get_by_role("button", name="Simulate Done").click()
    sts = statements(frame)
    assert len(sts) == 1
    assert_contract_summary(sts[0], SITE + "sims/sine-wave/", "sine-wave")
    ext = sts[0]["result"]["extensions"]
    assert ext[EXT + "end_reason"] == "simulated-done"
    # The ordering is gone from a summary, so the reversal has to be carried explicitly.
    assert ext[EXT + "controls"]["amplitude-slider"] == {
        "n": 3, "min": 0.6, "max": 0.9, "last": 0.6, "concept": "amplitude", "reversals": 1
    }
    assert ext[EXT + "controls"]["frequency-slider"]["concept"] == "frequency"
    assert sts[0]["context"]["extensions"][EXT + "statements_represented"] == 4

    frame.get_by_role("button", name="Simulate Done").click()  # session already ended
    assert len(statements(frame)) == 1


def test_l6_sine_wave_view_formatted_json_opens_the_summary(open_sim: Any, page: Any) -> None:
    frame = open_sim("sine-wave", {"compact": True, **FAST})
    # The raw panel starts hidden, so find the button by class rather than by role.
    assert frame.locator("button.xapi-view-btn").is_disabled()  # nothing to show yet

    frame.evaluate(MOVE_SLIDER, [0, [0.75, 0.9, 0.6]])
    frame.get_by_role("button", name="Simulate Done").click()  # also reveals the raw panel
    view = frame.get_by_role("button", name="View Formatted JSON")
    assert view.is_enabled()

    with page.context.expect_page() as opened:
        view.click()
    tab = opened.value
    tab.wait_for_load_state()
    summary = statements(frame)[-1]

    # Pretty-printed, one field per line, with the compact-only fields highlighted.
    code = tab.locator("pre").inner_text()
    assert '"verb": {' in code
    assert code.count("\n") > 40
    highlighted = tab.locator(".ln.hl").all_inner_texts()
    assert any("statements_represented" in h for h in highlighted)
    assert any("end_reason" in h for h in highlighted)
    assert "stands for 3 full-mode statements" in tab.locator(".banner").inner_text()

    # It shows the exact statement that was emitted, not a copy that could drift.
    assert summary["id"] in tab.locator(".sub").first.inner_text()


def test_l6_sine_wave_simulate_done_in_full_mode_emits_nothing(open_sim: Any) -> None:
    frame = open_sim("sine-wave", {"compact": False, **FAST})
    frame.evaluate(MOVE_SLIDER, [0, [0.75]])
    frame.get_by_role("button", name="Simulate Done").click()
    # No Start/Pause, so no open interval: every movement was already a statement.
    assert verbs(statements(frame)) == ["interacted"]


# ------------------------------------------------------------------ scientific-method ----


@pytest.mark.parametrize("compact", [False, True], ids=["off", "on"])
def test_l6_scientific_method(open_sim: Any, compact: bool) -> None:
    frame = open_sim("scientific-method", {"compact": compact, **FAST, "idleMs": 800})
    frame.wait_for_selector(".mermaid .node", timeout=20000)
    frame.wait_for_timeout(1500)  # the sim wires its node handlers 1.2 s after load

    nodes = frame.locator(".mermaid .node")
    nodes.nth(1).click()  # pin one step...
    nodes.nth(3).click()  # ...then another

    if not compact:
        sts = statements(frame)
        assert verbs(sts) == ["interacted", "interacted"]
        modes = {s["result"]["extensions"][EXT + "engagement-mode"] for s in sts}
        assert modes == {"pinned"}
        return

    assert statements(frame) == []
    frame.wait_for_function("LRSLite.statements.length === 1", timeout=6000)  # idle ends it
    summary = statements(frame)[0]
    assert_contract_summary(summary, SITE + "sims/scientific-method/", "iterative-investigation")
    ext = summary["result"]["extensions"]
    assert ext[EXT + "end_reason"] == "idle"
    controls = ext[EXT + "controls"]
    assert len(controls) == 2
    assert all(c["n"] == 1 and c["modes"] == {"pinned": 1} and c["concept"] for c in
               controls.values())
    assert summary["context"]["extensions"][EXT + "statements_represented"] == 2


def _pin_two_steps(frame: Any) -> None:
    frame.wait_for_selector(".mermaid .node", timeout=20000)
    frame.wait_for_timeout(1500)  # the sim wires its node handlers 1.2 s after load
    nodes = frame.locator(".mermaid .node")
    nodes.nth(1).click()
    nodes.nth(3).click()


def test_l6_scientific_method_simulate_done_emits_the_compact_summary(
    open_sim: Any, page: Any
) -> None:
    frame = open_sim("scientific-method", {"compact": False, **FAST})
    assert frame.get_by_label("Full").is_checked()
    frame.get_by_label("Compact").check()
    assert mode(frame) == "compact"

    _pin_two_steps(frame)
    assert statements(frame) == []
    frame.get_by_role("button", name="Simulate Done").click()

    sts = statements(frame)
    assert len(sts) == 1
    assert_contract_summary(sts[0], SITE + "sims/scientific-method/", "iterative-investigation")
    assert sts[0]["result"]["extensions"][EXT + "end_reason"] == "simulated-done"
    assert sts[0]["context"]["extensions"][EXT + "statements_represented"] == 2

    with page.context.expect_page() as opened:
        frame.get_by_role("button", name="View Formatted JSON").click()
    tab = opened.value
    tab.wait_for_load_state()
    assert sts[0]["id"] in tab.locator(".sub").first.inner_text()
    assert "stands for 2 full-mode statements" in tab.locator(".banner").inner_text()


def test_l6_scientific_method_simulate_done_in_full_mode_emits_page_dwell(
    open_sim: Any,
) -> None:
    frame = open_sim("scientific-method", {"compact": False, **FAST})
    _pin_two_steps(frame)  # also puts > 1 s on the page
    frame.get_by_role("button", name="Simulate Done").click()

    sts = statements(frame)
    assert verbs(sts) == ["interacted", "interacted", "experienced"]
    assert sts[2]["object"]["id"] == SITE + "sims/scientific-method/"
    assert sts[2]["result"]["extensions"][EXT + "run-ended-by"] == "simulated-done"
    # Pressing a control in the xAPI panel must not un-pin the step being studied.
    assert frame.locator(".mermaid .node.highlighted").count() == 1


def test_l6_scientific_method_switching_modes_never_loses_or_doubles_dwell(
    open_sim: Any,
) -> None:
    frame = open_sim("scientific-method", {"compact": False, **FAST})
    _pin_two_steps(frame)
    frame.get_by_label("Compact").check()  # full → compact closes full mode's page interval
    sts = statements(frame)
    assert verbs(sts) == ["interacted", "interacted", "experienced"]
    assert sts[2]["result"]["extensions"][EXT + "run-ended-by"] == "mode-switch"

    frame.locator(".mermaid .node").nth(5).click()  # folded, not emitted
    assert len(statements(frame)) == 3
    frame.get_by_label("Full").check()  # compact → full flushes the folded session
    sts = statements(frame)
    assert len(sts) == 4
    assert sts[3]["result"]["extensions"][EXT + "end_reason"] == "mode-switch"
    assert sts[3]["context"]["extensions"][EXT + "statements_represented"] == 1
