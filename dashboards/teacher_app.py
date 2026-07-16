"""My Classes + Student Detail — the instructor dashboard.

Spec §9.4: 'My Classes | Instructor | R-201, R-203, R-209, R-107' and
'Student Detail | Instructor | R-101-R-109'. R-107 (Idle/Disengagement Alert) is a
per-student metric but the catalog maps it to the CLASS dashboard, not Student Detail —
here it's the roster's idle flag viewed as its own alert list, i.e. a class-wide view of
a per-student signal, which is what "My Classes" means for that report.

Drill-down (spec §9.3: "Section view -> click a student -> student view, carrying filter
context") is real: clicking a row in the At-Risk Roster switches to Student Detail with
that student pre-selected. Both rails are static, always-present components (their
visibility toggles via a style callback) rather than one rail whose children are swapped
per mode — that keeps the drill-down callback's output targets valid from first load
instead of writing into components a prior callback hasn't created yet.

Run: `python teacher_app.py` from dashboards/. Port 8052.
"""

from __future__ import annotations

import plotly.graph_objects as go
from dash import Dash, Input, Output, State, dash_table, dcc, html

from lrsdash import queries_common as qc
from lrsdash import queries_teacher as qt
from lrsdash.db import health
from lrsdash.theme import (
    APP_INDEX_STRING,
    CATEGORICAL,
    SEQUENTIAL_BLUE,
    STATUS,
    base_layout,
    card,
    data_table,
    evidence_note,
    footer,
    header,
    kpi_tile,
)

app = Dash(__name__, title="LRS — My Classes", assets_folder="assets",
           suppress_callback_exceptions=True)  # atrisk-table etc. only exist once
                                                # main-content has rendered that tab at least once
app.index_string = APP_INDEX_STRING
server = app.server

CLASS_TABS = [
    ("heatmap", "Class Mastery Heatmap (R-201)"),
    ("funnel", "Completion Funnel (R-203)"),
    ("atrisk", "At-Risk Roster (R-209)"),
    ("idle", "Idle / Disengagement Alert (R-107)"),
]
STUDENT_TABS = [
    ("progress", "Progress Overview (R-101)"),
    ("radar", "Concept Mastery Radar (R-102)"),
    ("timeline", "Time-on-Task Timeline (R-103)"),
    ("struggles", "Struggle Detector (R-104)"),
    ("prereq", "Prerequisite Gap Analysis (R-105)"),
    ("quiz", "Quiz Item Analysis (R-106)"),
    ("velocity", "Learning Velocity (R-108)"),
    ("balance", "Reading vs. Doing Balance (R-109)"),
]

VISIBLE = {"display": "block"}
HIDDEN = {"display": "none"}


def _instructor_options():
    df = qc.instructors()
    return [
        {"label": f"{r['instructor_key']} ({r['sample_course']}, {r['section_count']} section(s))",
         "value": r["instructor_key"]}
        for _, r in df.iterrows()
    ]


app.layout = html.Div(
    [
        header(
            breadcrumb=["My Classes"],
            filters=[
                dcc.Dropdown(id="instructor-filter", options=_instructor_options(),
                             placeholder="Choose instructor…", style={"width": "260px"}),
                dcc.Dropdown(id="section-filter", placeholder="Choose section…",
                             style={"width": "320px"}),
                dcc.Dropdown(id="student-filter", placeholder="Choose student…",
                             style={"width": "160px"}),
            ],
        ),
        dcc.Tabs(
            id="mode-switch", value="class",
            children=[dcc.Tab(label="My Classes", value="class"),
                      dcc.Tab(label="Student Detail", value="student")],
        ),
        html.Div(
            [
                html.Div(
                    [
                        html.Div(
                            dcc.Tabs(id="class-tabs", value=CLASS_TABS[0][0], vertical=True,
                                     children=[dcc.Tab(label=lbl, value=k) for k, lbl in CLASS_TABS]),
                            id="class-rail", style=VISIBLE,
                        ),
                        html.Div(
                            [
                                dcc.Dropdown(
                                    id="chapter-filter", placeholder="Chapter…",
                                    style={"margin": "8px 12px"},
                                ),
                                dcc.Tabs(id="student-tabs", value=STUDENT_TABS[0][0], vertical=True,
                                         children=[dcc.Tab(label=lbl, value=k) for k, lbl in STUDENT_TABS]),
                            ],
                            id="student-rail", style=HIDDEN,
                        ),
                    ],
                    className="lrs-rail",
                ),
                html.Div(id="main-content", className="lrs-main"),
            ],
            className="lrs-body",
        ),
        footer("My Classes / Student Detail — spec §9.4"),
    ],
    className="lrs-shell",
)


# --- Cascading filter population --------------------------------------------------


@app.callback(
    Output("section-filter", "options"), Output("section-filter", "value"),
    Input("instructor-filter", "value"),
)
def populate_sections(instructor_key):
    if not instructor_key:
        return [], None
    df = qc.sections_for_instructor(instructor_key)
    options = [
        {"label": f"{r['course']} — period {r['period']} ({r['school']})", "value": r["section_id"]}
        for _, r in df.iterrows()
    ]
    return options, (options[0]["value"] if options else None)


@app.callback(
    Output("chapter-filter", "options"), Output("chapter-filter", "value"),
    Output("student-filter", "options"), Output("student-filter", "value"),
    Input("section-filter", "value"),
)
def populate_section_scoped(section_id):
    if not section_id:
        return [], None, [], None
    chapters = qt.chapters_for_section(section_id)
    ch_opts = [{"label": f"Ch {r['order']}: {r['title']}", "value": r["chapter_id"]}
               for _, r in chapters.iterrows()]
    students = qt.students_in_section(section_id)
    st_opts = [{"label": s, "value": s} for s in students["student_key"]]
    return (ch_opts, ch_opts[0]["value"] if ch_opts else None,
            st_opts, st_opts[0]["value"] if st_opts else None)


@app.callback(
    Output("class-rail", "style"), Output("student-rail", "style"),
    Input("mode-switch", "value"),
)
def toggle_rail(mode):
    return (VISIBLE, HIDDEN) if mode == "class" else (HIDDEN, VISIBLE)


# --- Drill-down: click an at-risk roster row -> Student Detail ---------------------


@app.callback(
    Output("mode-switch", "value"),
    Output("student-filter", "value", allow_duplicate=True),  # also written by populate_section_scoped
    Output("student-tabs", "value"),
    Input("atrisk-table", "active_cell"), State("atrisk-table", "data"),
    prevent_initial_call=True,
)
def drill_into_student(active_cell, rows):
    if not active_cell:
        return "class", None, STUDENT_TABS[0][0]
    student_key = rows[active_cell["row"]]["student"]
    return "student", student_key, "progress"


# --- Renderers: class mode ----------------------------------------------------------


def _banner_if_unhealthy():
    err = health()
    return html.Div(err, className="lrs-banner") if err else None


def render_heatmap(section_id, chapter_id):
    if not chapter_id:
        return html.Div("Choose a chapter.", className="lrs-empty")
    df = qt.class_mastery_heatmap(section_id, chapter_id)
    diff = qt.concept_difficulty(section_id, chapter_id)
    if df.empty:
        return html.Div("No mastery evidence for this chapter yet.", className="lrs-empty")

    pivot = df.pivot(index="student", columns="concept", values="mastery")
    concept_order = diff.sort_values("mean_mastery")["concept"].tolist()
    pivot = pivot.reindex(columns=[c for c in concept_order if c in pivot.columns])

    heat = go.Figure(layout=base_layout())
    heat.add_trace(go.Heatmap(
        z=pivot.values, x=pivot.columns, y=pivot.index,
        colorscale=[[i / (len(SEQUENTIAL_BLUE) - 1), c] for i, c in enumerate(SEQUENTIAL_BLUE)],
        zmin=0, zmax=1, colorbar=dict(title="Mastery", tickformat=".0%"),
        hovertemplate="%{y} · %{x}<br>Mastery: %{z:.0%}<extra></extra>",
    ))
    heat.update_layout(height=max(320, 24 * len(pivot.index)), xaxis=dict(tickangle=-35))

    bar = go.Figure(layout=base_layout())
    bar.add_trace(go.Bar(
        x=diff["mean_mastery"], y=diff["concept"], orientation="h", marker_color=CATEGORICAL[5],
        hovertemplate="%{y}<br>Class mean: %{x:.0%}<extra></extra>",
    ))
    bar.update_layout(height=max(220, 28 * len(diff)), xaxis=dict(tickformat=".0%", title="Class mean mastery"),
                       yaxis=dict(autorange="reversed"))

    total_evidence = int(df["evidence"].sum())
    return html.Div([
        card("Class Mastery Heatmap — students × concepts (hardest concepts on the left)",
             dcc.Graph(figure=heat, config={"displaylogo": False})),
        card("Concept Difficulty Ranking (R-202) — same chapter", dcc.Graph(figure=bar, config={"displaylogo": False})),
        evidence_note(total_evidence),
    ])


def render_funnel(section_id):
    df = qt.completion_funnel(section_id)
    if df.empty:
        return html.Div("No chapters found.", className="lrs-empty")
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Funnel(
        y=df["chapter"], x=df["reached"], marker=dict(color=CATEGORICAL[0]),
        textposition="inside", textinfo="value+percent initial",
        hovertemplate="%{y}<br>%{x} of %{customdata} students<extra></extra>",
        customdata=df["total"],
    ))
    fig.update_layout(height=max(380, 34 * len(df)))
    return card("Completion Funnel — students with any evidence per chapter",
                dcc.Graph(figure=fig, config={"displaylogo": False}))


def render_atrisk(section_id):
    roster = qt.roster(section_id)
    gaps = qt.prereq_gap_counts(section_id)
    if roster.empty:
        return html.Div("No students enrolled.", className="lrs-empty")
    merged = roster.merge(gaps, on="student", how="left").fillna({"gap_count": 0})
    merged["gap_count"] = merged["gap_count"].astype(int)
    merged["gap_ratio"] = (merged["gap_count"] / merged["concepts_attempted"].clip(lower=1)).round(2)
    # Composite risk (spec R-209: "disengagement + low mastery + prerequisite gaps").
    # All three terms are already 0-1 scaled, so the weights alone set each one's voice.
    merged["risk_score"] = (
        0.45 * (1 - merged["mastery"].fillna(0))
        + 0.30 * (merged["days_idle"] / merged["days_idle"].clip(lower=1).max()).clip(0, 1)
        + 0.25 * merged["gap_ratio"]
    ).round(3)
    merged = merged.sort_values("risk_score", ascending=False)
    cols = ["student", "risk_score", "mastery", "days_idle", "gap_ratio", "concepts_attempted"]
    return html.Div([
        card("At-Risk Roster — click a row to open Student Detail",
             data_table("atrisk-table", cols, data=merged[cols].to_dict("records"))),
    ])


def render_idle(section_id):
    roster = qt.roster(section_id)
    idle = roster[roster["idle"]].sort_values("days_idle", ascending=False)
    if idle.empty:
        return html.Div(f"No students idle ≥ {qt.IDLE_DAYS} days. Nice.", className="lrs-empty")
    chips = [
        html.Div(
            [html.Span(r["student"], style={"fontWeight": 600, "marginRight": "10px"}),
             html.Span(f"{r['days_idle']} days idle", className="lrs-chip critical")],
            style={"padding": "8px 4px", "borderBottom": "1px solid #e1e0d9"},
        )
        for _, r in idle.iterrows()
    ]
    return card(f"Idle Alert — no new evidence in ≥ {qt.IDLE_DAYS} days", html.Div(chips))


CLASS_RENDERERS = {
    "heatmap": lambda sid, cid: render_heatmap(sid, cid),
    "funnel": lambda sid, cid: render_funnel(sid),
    "atrisk": lambda sid, cid: render_atrisk(sid),
    "idle": lambda sid, cid: render_idle(sid),
}


# --- Renderers: student mode ---------------------------------------------------------


def render_progress(student_key, section_id):
    p = qt.student_progress(student_key, section_id)
    checklist = qt.student_concept_checklist(student_key, section_id)
    pct = p["mastered"] / p["total_concepts"] if p["total_concepts"] else 0
    tiles = html.Div([
        kpi_tile("Concepts Mastered", f"{p['mastered']} / {p['total_concepts']}", delta=f"{pct:.0%}", good=pct >= 0.4),
        kpi_tile("Concepts Attempted", f"{p['attempted']} / {p['total_concepts']}"),
    ], className="lrs-kpi-row")
    cols = ["concept", "category", "mastery", "attempted"]
    return html.Div([tiles, card("Concept Checklist", data_table("progress-table", cols,
                                                                   data=checklist[cols].to_dict("records")))])


def render_radar(student_key, section_id):
    df = qt.student_mastery_radar(student_key, section_id)
    if df.empty:
        return html.Div("No mastery evidence yet.", className="lrs-empty")
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Scatterpolar(
        r=list(df["mastery"]) + [df["mastery"].iloc[0]],
        theta=list(df["category"]) + [df["category"].iloc[0]],
        fill="toself", line=dict(color=CATEGORICAL[0]),
        hovertemplate="%{theta}<br>%{r:.0%}<extra></extra>",
    ))
    fig.update_layout(height=420, polar=dict(radialaxis=dict(range=[0, 1], tickformat=".0%",
                                                              gridcolor="#e1e0d9")),
                       showlegend=False)
    return card("Concept Mastery Radar by Taxonomy Category", dcc.Graph(figure=fig, config={"displaylogo": False}))


def render_timeline(student_key, section_id):
    df = qt.student_page_timeline(student_key, section_id)
    if df.empty:
        return html.Div("No page-engagement evidence yet.", className="lrs-empty")
    df = df.sort_values("chapter_order")
    fig = go.Figure(layout=base_layout())
    for i, row in enumerate(df.itertuples()):
        fig.add_trace(go.Scatter(
            x=[row.start, row.end], y=[row.page, row.page], mode="lines",
            line=dict(color=CATEGORICAL[0], width=8), showlegend=False,
            hovertemplate=f"{row.page}<br>%{{x}}<br>dwell: {row.dwell_ms/1000:.0f}s<extra></extra>",
        ))
    fig.update_layout(height=max(320, 22 * len(df)), showlegend=False,
                       xaxis_title="Approximate engagement span (from PageEngagement first/last seen)")
    return html.Div([
        card("Time-on-Task Timeline (approximated — see README)", dcc.Graph(figure=fig, config={"displaylogo": False})),
    ])


def render_struggles(student_key, section_id):
    df = qt.student_struggles(student_key)
    if df.empty:
        return html.Div("No concepts meet the struggle threshold.", className="lrs-empty")
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(
        x=df["mastery"], y=df["concept"], orientation="h", marker_color=STATUS["critical"],
        hovertemplate="%{y}<br>Mastery: %{x:.0%}<extra></extra>",
    ))
    fig.update_layout(height=max(260, 30 * len(df)), xaxis=dict(tickformat=".0%", title="Mastery"),
                       yaxis=dict(autorange="reversed"))
    return card(f"Struggle Detector — concepts with ≥ {qt.STRUGGLE_MIN_ATTEMPTS} attempts, lowest score first",
                dcc.Graph(figure=fig, config={"displaylogo": False}))


def render_prereq(student_key, section_id):
    struggles = qt.student_struggles(student_key)
    if struggles.empty:
        return html.Div("No struggling concept to trace prerequisites from.", className="lrs-empty")
    weakest = struggles.iloc[0]
    gaps = qt.prerequisite_gap(student_key, weakest["concept_id"])
    if gaps.empty:
        return html.Div(f"'{weakest['concept']}' has no prerequisites in the learning graph.",
                        className="lrs-empty")
    colors = [STATUS["critical"] if m < qt.MASTERY_PASS else STATUS["good"] for m in gaps["mastery"]]
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(
        x=gaps["mastery"], y=gaps["prerequisite"], orientation="h", marker_color=colors,
        hovertemplate="%{y}<br>Mastery: %{x:.0%}<extra></extra>",
    ))
    fig.add_vline(x=qt.MASTERY_PASS, line_dash="dash", line_color="#898781")
    fig.update_layout(height=max(220, 30 * len(gaps)), xaxis=dict(tickformat=".0%", title="Mastery"),
                       yaxis=dict(autorange="reversed"))
    return card(f"Prerequisite Gap Analysis — prerequisites of the weakest concept, '{weakest['concept']}'",
                dcc.Graph(figure=fig, config={"displaylogo": False}),
                subtitle="Shown as a ranked list, not a rendered subgraph — see README.")


def render_quiz(student_key, section_id):
    df = qt.student_quiz_items(student_key)
    if df.empty:
        return html.Div("No quiz responses yet.", className="lrs-empty")
    cols = list(df.columns)
    return card("Quiz Item Analysis", data_table("quiz-table", cols, data=df.to_dict("records")))


def render_velocity(student_key, section_id):
    df = qt.student_velocity(student_key)
    if df.empty:
        return html.Div("No mastery evidence yet.", className="lrs-empty")
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Scatter(x=df["week"], y=df["cumulative"], mode="lines+markers",
                              line=dict(color=CATEGORICAL[0], width=2),
                              hovertemplate="Week of %{x}<br>%{y} concepts<extra></extra>"))
    fig.update_layout(height=340, yaxis_title="Cumulative concepts with mastery evidence", showlegend=False)
    return card("Learning Velocity", dcc.Graph(figure=fig, config={"displaylogo": False}))


def render_balance(student_key, section_id):
    rvd = qt.student_reading_vs_doing(student_key)
    total = max(1, rvd["reading"] + rvd["doing"])
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(y=["Engagement"], x=[rvd["reading"]], name="Reading (pages)",
                         orientation="h", marker_color=CATEGORICAL[0],
                         hovertemplate="Reading: %{x} pages<extra></extra>"))
    fig.add_trace(go.Bar(y=["Engagement"], x=[rvd["doing"]], name="Doing (quiz + MicroSim)",
                         orientation="h", marker_color=CATEGORICAL[2],
                         hovertemplate="Doing: %{x} items<extra></extra>"))
    fig.update_layout(height=180, barmode="stack", xaxis_title="Count of engagement summaries")
    return html.Div([
        card("Reading vs. Doing Balance (approximated — see README)",
             dcc.Graph(figure=fig, config={"displaylogo": False})),
        html.Div(f"{rvd['reading']}/{total:.0f} reading · {rvd['doing']}/{total:.0f} doing",
                className="lrs-evidence-note"),
    ])


STUDENT_RENDERERS = {
    "progress": render_progress, "radar": render_radar, "timeline": render_timeline,
    "struggles": render_struggles, "prereq": render_prereq, "quiz": render_quiz,
    "velocity": render_velocity, "balance": render_balance,
}


@app.callback(
    Output("main-content", "children"),
    Input("mode-switch", "value"),
    Input("class-tabs", "value"), Input("student-tabs", "value"),
    Input("section-filter", "value"), Input("chapter-filter", "value"),
    Input("student-filter", "value"),
)
def update_main(mode, class_tab, student_tab, section_id, chapter_id, student_key):
    banner = _banner_if_unhealthy()
    if banner:
        return banner
    if not section_id:
        return html.Div("Choose an instructor and section above.", className="lrs-empty")
    if mode == "class":
        return CLASS_RENDERERS[class_tab](section_id, chapter_id)
    if not student_key:
        return html.Div("Choose a student above.", className="lrs-empty")
    return STUDENT_RENDERERS[student_tab](student_key, section_id)


if __name__ == "__main__":
    app.run(debug=True, port=8052)
