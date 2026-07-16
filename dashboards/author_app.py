"""Content Insights + Experiments — the textbook author's dashboard.

Spec §9.4: 'Content Insights | Author / Curriculum | R-301-R-307, T-5' and
'Experiments | Author / Researcher | §8.3 readout, T-6' (T-6 excluded — see
queries_author.py's docstring).

Same two-mode, static-rail pattern as teacher_app.py: both rails always exist: 'insights-rail'
for the book-scoped reports and 'experiments-rail' for the pooled-cohort experiment readout,
toggled by a style callback rather than swapped children — visibility toggling avoids
writing to Outputs that don't exist yet in a dynamically-built layout.

Run: `python author_app.py` from dashboards/. Port 8053.
"""

from __future__ import annotations

import plotly.graph_objects as go
from dash import Dash, Input, Output, dcc, html
from lrsdash import queries_author as qauth
from lrsdash import queries_common as qc
from lrsdash.db import health
from lrsdash.theme import (
    APP_INDEX_STRING,
    CATEGORICAL,
    STATUS,
    base_layout,
    card,
    data_table,
    evidence_note,
    footer,
    header,
    kpi_tile,
)

app = Dash(__name__, title="LRS — Content Insights", assets_folder="assets",
           suppress_callback_exceptions=True)
app.index_string = APP_INDEX_STRING
server = app.server

INSIGHTS_TABS = [
    ("effectiveness", "Page Effectiveness (R-301)"),
    ("microsim", "MicroSim Impact (R-302)"),
    ("confusing", "Confusing-Content Finder (R-303)"),
    ("dropoff", "Drop-off Map (R-304)"),
    ("coverage", "Concept-Coverage Gaps (R-305)"),
    ("quiz", "Question Health (R-306)"),
    ("version", "Version Comparison (R-307)"),
    ("correlation", "Correlation Explorer (T-5)"),
]

VISIBLE = {"display": "block"}
HIDDEN = {"display": "none"}


def _textbook_options():
    df = qc.textbooks()
    return [{"label": r["title"], "value": r["textbook_id"]} for _, r in df.iterrows()]


def _experiment_options():
    return [{"label": e["experiment_id"], "value": e["experiment_id"]} for e in qauth.experiment_list()]


app.layout = html.Div(
    [
        header(
            breadcrumb=["Content Insights"],
            filters=[
                dcc.Dropdown(id="textbook-filter", options=_textbook_options(),
                             placeholder="Choose textbook…", style={"width": "340px"}),
                dcc.Dropdown(id="engagement-metric", options=[
                    {"label": "Dwell time", "value": "dwell"},
                    {"label": "Revisit count", "value": "revisit"},
                ], value="dwell", clearable=False, style={"width": "160px"}),
            ],
        ),
        dcc.Tabs(
            id="mode-switch", value="insights",
            children=[dcc.Tab(label="Content Insights", value="insights"),
                      dcc.Tab(label="Experiments", value="experiments")],
        ),
        html.Div(
            [
                html.Div(
                    [
                        html.Div(
                            dcc.Tabs(id="insights-tabs", value=INSIGHTS_TABS[0][0], vertical=True,
                                     children=[dcc.Tab(label=lbl, value=k) for k, lbl in INSIGHTS_TABS]),
                            id="insights-rail", style=VISIBLE,
                        ),
                        html.Div(
                            dcc.Dropdown(id="experiment-filter", options=_experiment_options(),
                                        placeholder="Choose experiment…", style={"margin": "8px 12px"}),
                            id="experiments-rail", style=HIDDEN,
                        ),
                    ],
                    className="lrs-rail",
                ),
                html.Div(id="main-content", className="lrs-main"),
            ],
            className="lrs-body",
        ),
        footer("Content Insights / Experiments — spec §9.4"),
    ],
    className="lrs-shell",
)


@app.callback(
    Output("insights-rail", "style"), Output("experiments-rail", "style"),
    Input("mode-switch", "value"),
)
def toggle_rail(mode):
    return (VISIBLE, HIDDEN) if mode == "insights" else (HIDDEN, VISIBLE)


def _banner_if_unhealthy():
    err = health()
    return html.Div(err, className="lrs-banner") if err else None


# --- Renderers: Content Insights ------------------------------------------------------


def render_effectiveness(textbook_id):
    df = qauth.page_effectiveness(textbook_id)
    if df.empty:
        return html.Div("No page-engagement evidence for this book.", className="lrs-empty")
    cols = ["page", "dwell_s", "revisit", "downstream_mastery", "readers"]
    return card("Page Effectiveness — engagement vs. downstream concept mastery",
                data_table("effectiveness-table", cols, data=df[cols].to_dict("records")))


def render_microsim(textbook_id):
    df = qauth.microsim_impact(textbook_id)
    if df.empty:
        return html.Div("Not enough used/skipped evidence (≥ 5 students each) for any MicroSim in this book.",
                        className="lrs-empty")
    colors = [STATUS["good"] if d > 0 else STATUS["critical"] for d in df["delta"]]
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(
        x=df["delta"], y=df["microsim"], orientation="h", marker_color=colors,
        hovertemplate="%{y}<br>Δ mastery: %{x:+.1%}<extra></extra>",
    ))
    fig.add_vline(x=0, line_color="#898781")
    fig.update_layout(height=max(280, 32 * len(df)), xaxis=dict(tickformat="+.0%", title="Mastery delta (used − skipped)"))
    return html.Div([
        card("MicroSim Impact — mastery delta, used vs. skipped (observational, confounded)",
             dcc.Graph(figure=fig, config={"displaylogo": False}),
             subtitle="Not a controlled comparison — see the Experiments tab for a randomized readout."),
    ])


def render_confusing(textbook_id):
    df = qauth.confusing_content(textbook_id)
    if df.empty:
        return html.Div(f"No pages with ≥ {qauth.CONFUSION_MIN_READERS} readers.", className="lrs-empty")
    cols = ["page", "confusion_score", "dwell_s", "revisit", "downstream_mastery", "readers"]
    return card("Confusing-Content Finder — high dwell + high revisit + low downstream mastery",
                data_table("confusing-table", cols, data=df[cols].head(30).to_dict("records")))


def render_dropoff(textbook_id):
    df = qauth.dropoff_sankey(textbook_id)
    if df.empty:
        return html.Div("No chapter-progression evidence for this book.", className="lrs-empty")
    nodes = list(pd_unique_preserve(list(df["from"]) + list(df["to"])))
    idx = {n: i for i, n in enumerate(nodes)}
    colors = [STATUS["critical"] if n == "Stopped here" else CATEGORICAL[0] for n in nodes]
    link_colors = ["rgba(208,59,59,0.35)" if k == "drop-off" else "rgba(42,120,214,0.35)" for k in df["kind"]]
    fig = go.Figure(go.Sankey(
        node=dict(label=nodes, color=colors, pad=14, thickness=14),
        link=dict(source=[idx[f] for f in df["from"]], target=[idx[t] for t in df["to"]],
                 value=df["value"], color=link_colors),
    ))
    fig.update_layout(**{**base_layout(), "height": 480})
    return card("Drop-off Map — where students stop progressing through the book",
                dcc.Graph(figure=fig, config={"displaylogo": False}))


def pd_unique_preserve(seq):
    seen = set()
    for x in seq:
        if x not in seen:
            seen.add(x)
            yield x


def render_coverage(textbook_id):
    df = qauth.concept_coverage_gaps(textbook_id)
    if df.empty:
        return html.Div("No concepts found.", className="lrs-empty")
    none_n = int((df["evidence_count"] == 0).sum())
    low_n = int(((df["evidence_count"] > 0) & (df["evidence_count"] < 10)).sum())
    tiles = html.Div([
        kpi_tile("Concepts with NO evidence", str(none_n), good=none_n == 0),
        kpi_tile("Concepts with < 10 mastery vertices", str(low_n)),
        kpi_tile("Total concepts", str(len(df))),
    ], className="lrs-kpi-row")
    worst = df.head(25)
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(
        x=worst["evidence_count"], y=worst["concept"], orientation="h",
        marker_color=[STATUS["critical"] if n == 0 else CATEGORICAL[2] for n in worst["evidence_count"]],
        hovertemplate="%{y}<br>%{x} mastery vertices<extra></extra>",
    ))
    fig.update_layout(height=max(320, 24 * len(worst)), xaxis_title="Evidence count (ConceptMastery vertices)",
                       yaxis=dict(autorange="reversed"))
    return html.Div([tiles, card("Concept-Coverage Gaps — least-evidenced concepts",
                                 dcc.Graph(figure=fig, config={"displaylogo": False}))])


def render_quiz(textbook_id):
    df = qauth.question_health(textbook_id)
    if df.empty:
        return html.Div(f"No questions with ≥ {qauth.QUESTION_MIN_ATTEMPTS} responses.", className="lrs-empty")
    cols = list(df.columns)
    return card("Question Health — p-value (difficulty) and discrimination, flagged",
                data_table("quiz-health-table", cols, data=df.to_dict("records")))


def render_version(textbook_id):
    df = qauth.version_comparison(textbook_id)
    if df.empty:
        return html.Div("No version data for this book.", className="lrs-empty")
    if len(df) < 2:
        note = html.Div(
            "This book is deployed at only one version in the current seed — no district runs a "
            "second version of it, so there's nothing to compare yet. Real version-vs-version "
            "comparison needs the same book split across ≥ 2 live deployments (see README).",
            className="lrs-evidence-note",
        )
    else:
        note = None
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Bar(x=df["version"], y=df["mean_mastery"], marker_color=CATEGORICAL[0],
                         hovertemplate="v%{x}<br>%{y:.0%}<extra></extra>"))
    fig.update_layout(height=320, yaxis=dict(tickformat=".0%", title="Mean mastery"), showlegend=False)
    return html.Div([card("Version Comparison — mean mastery by published version",
                          dcc.Graph(figure=fig, config={"displaylogo": False})), note])


def render_correlation(textbook_id, metric):
    df = qauth.correlation_explorer(textbook_id, metric)
    if df.empty or len(df) < 3:
        return html.Div("Not enough pages with evidence to plot a trend.", className="lrs-empty")
    slope, intercept = _polyfit(df["x"], df["downstream_mastery"])
    xs = [df["x"].min(), df["x"].max()]
    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Scatter(
        x=df["x"], y=df["downstream_mastery"], mode="markers", marker=dict(color=CATEGORICAL[0], size=8),
        text=df["page"], hovertemplate="%{text}<br>x=%{x}<br>mastery=%{y:.0%}<extra></extra>", name="Pages",
    ))
    fig.add_trace(go.Scatter(x=xs, y=[slope * x + intercept for x in xs], mode="lines",
                             line=dict(color=STATUS["critical"], dash="dash"), name="Trend"))
    label = "Mean dwell (s)" if metric == "dwell" else "Mean revisit count"
    fig.update_layout(height=420, xaxis_title=label, yaxis=dict(tickformat=".0%", title="Downstream mastery"))
    return card(f"Correlation Explorer — {label} vs. downstream mastery",
                dcc.Graph(figure=fig, config={"displaylogo": False}),
                subtitle="Correlational only, at the page level — not a causal claim.")


def _polyfit(xs, ys):
    mean_x, mean_y = xs.mean(), ys.mean()
    cov = ((xs - mean_x) * (ys - mean_y)).sum()
    var = ((xs - mean_x) ** 2).sum()
    slope = cov / var if var else 0.0
    return slope, mean_y - slope * mean_x


INSIGHTS_RENDERERS = {
    "effectiveness": lambda tid, metric: render_effectiveness(tid),
    "microsim": lambda tid, metric: render_microsim(tid),
    "confusing": lambda tid, metric: render_confusing(tid),
    "dropoff": lambda tid, metric: render_dropoff(tid),
    "coverage": lambda tid, metric: render_coverage(tid),
    "quiz": lambda tid, metric: render_quiz(tid),
    "version": lambda tid, metric: render_version(tid),
    "correlation": lambda tid, metric: render_correlation(tid, metric),
}


# --- Renderers: Experiments ------------------------------------------------------------


def render_experiment(experiment_id):
    exp = next(e for e in qauth.experiment_list() if e["experiment_id"] == experiment_id)
    df = qauth.experiment_assignments(experiment_id)
    df.attrs["guardrail_metric"] = exp["guardrail_metric"]
    result = qauth.analyze_experiment(df)

    verdict_color = STATUS["critical"] if result["guardrail_regressed"] or (
        result["significant"] and result["lift_pct"] < 0
    ) else (STATUS["good"] if result["significant"] else STATUS["warning"])

    tiles = html.Div([
        kpi_tile("Control", f"{result['control_mean']:.1%}", delta=exp["control_label"]),
        kpi_tile("Treatment", f"{result['treatment_mean']:.1%}", delta=exp["treatment_label"]),
        kpi_tile("Lift", f"{result['lift_pct']:+.1f}%",
                good=result["significant"] and result["lift_pct"] > 0),
        kpi_tile("p-value", f"{result['p_value']:.3f}",
                good=result["significant"]),
        kpi_tile("Cohen's d", f"{result['cohens_d']:.2f}"),
        kpi_tile("Sample-ratio mismatch", "flagged" if result["srm_flag"] else "OK",
                good=not result["srm_flag"]),
    ], className="lrs-kpi-row")

    verdict = html.Div(result["verdict"], style={
        "padding": "14px 18px", "borderRadius": "8px", "fontWeight": 600,
        "background": f"{verdict_color}1a", "color": verdict_color, "marginBottom": "16px",
    })

    primary_fig = _ci_bar(result["control_mean"], result["control_ci"], result["treatment_mean"],
                          result["treatment_ci"], "Primary metric (concept mastery)")
    guardrail_fig = _ci_bar(result["guardrail_control_mean"], result["guardrail_control_ci"],
                            result["guardrail_treatment_mean"], result["guardrail_treatment_ci"],
                            f"Guardrail ({exp['guardrail_metric']})")

    enrollment = df.sort_values("assigned_at").copy()
    enrollment["n"] = 1
    enrollment_fig = go.Figure(layout=base_layout())
    for arm, color in [("control", CATEGORICAL[0]), ("treatment", CATEGORICAL[2])]:
        sub = enrollment[enrollment["arm"] == arm]
        enrollment_fig.add_trace(go.Scatter(
            x=sub["assigned_at"], y=sub["n"].cumsum(), mode="lines", name=arm.title(),
            line=dict(color=color, width=2),
        ))
    enrollment_fig.update_layout(height=280, yaxis_title="Cumulative students assigned")

    segments = qauth.experiment_segments(df)
    seg_cols = ["dimension", "segment", "control_mean", "treatment_mean", "lift_pct", "n"]

    return html.Div([
        html.Div(exp["hypothesis"], style={"fontStyle": "italic", "color": "#52514e", "marginBottom": "14px"}),
        tiles,
        verdict,
        html.Div([
            card("Primary Metric — 95% CI by arm", dcc.Graph(figure=primary_fig, config={"displaylogo": False})),
            card("Guardrail — 95% CI by arm", dcc.Graph(figure=guardrail_fig, config={"displaylogo": False})),
        ], className="lrs-grid"),
        card("Enrollment Over Time", dcc.Graph(figure=enrollment_fig, config={"displaylogo": False})),
        card("Segmentation — district and prior-mastery band",
             data_table("segments-table", seg_cols, data=segments[seg_cols].to_dict("records"))
             if not segments.empty else html.Div("No segment has ≥ 5 students per arm.", className="lrs-empty")),
        evidence_note(result["n_control"] + result["n_treatment"], "experiment assignments"),
    ])


def _ci_bar(c_mean, c_ci, t_mean, t_ci, title):
    fig = go.Figure(layout=base_layout())
    for label, mean, ci, color in [("Control", c_mean, c_ci, CATEGORICAL[0]),
                                    ("Treatment", t_mean, t_ci, CATEGORICAL[2])]:
        fig.add_trace(go.Bar(
            x=[label], y=[mean], marker_color=color, width=0.5,
            error_y=dict(type="data", symmetric=False, array=[ci[1] - mean], arrayminus=[mean - ci[0]]),
            hovertemplate=f"{label}<br>%{{y:.1%}} (95% CI {ci[0]:.1%}–{ci[1]:.1%})<extra></extra>",
        ))
    fig.update_layout(height=320, yaxis=dict(tickformat=".0%", title=title), showlegend=False)
    return fig


@app.callback(
    Output("main-content", "children"),
    Input("mode-switch", "value"),
    Input("insights-tabs", "value"), Input("textbook-filter", "value"), Input("engagement-metric", "value"),
    Input("experiment-filter", "value"),
)
def update_main(mode, insights_tab, textbook_id, metric, experiment_id):
    banner = _banner_if_unhealthy()
    if banner:
        return banner
    if mode == "insights":
        if not textbook_id:
            return html.Div("Choose a textbook above.", className="lrs-empty")
        return INSIGHTS_RENDERERS[insights_tab](textbook_id, metric)
    if not experiment_id:
        return html.Div("Choose an experiment in the left rail.", className="lrs-empty")
    return render_experiment(experiment_id)


if __name__ == "__main__":
    app.run(debug=True, port=8053)
