"""District Overview — school/district administrator dashboard.

Spec §9.4 dashboard catalog: "District Overview | District Admin | R-401-R-404, R-407".
Reports: R-401 District Adoption (KPI tiles + trend), R-402 School Comparison,
R-403 Course Rollup (tree map), R-404 Deployment Inventory, R-407 Seat Utilization.

Run: `python admin_app.py` from dashboards/ (needs its own .venv — see README). Default
port 8051 so all three apps can run side by side without colliding.
"""

from __future__ import annotations

import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, Input, Output, dcc, html

from lrsdash import queries_admin as qa
from lrsdash.db import health
from lrsdash.theme import (
    APP_INDEX_STRING,
    CATEGORICAL,
    SEQUENTIAL_BLUE,
    STATUS,
    base_layout,
    card,
    data_table,
    footer,
    header,
    kpi_tile,
)

app = Dash(__name__, title="LRS — District Overview", assets_folder="assets")
app.index_string = APP_INDEX_STRING
server = app.server

REPORT_TABS = [
    ("overview", "District Adoption (R-401)"),
    ("schools", "School Comparison (R-402)"),
    ("courses", "Course Rollup (R-403)"),
    ("deployments", "Deployment Inventory (R-404)"),
    ("licensing", "Seat Utilization (R-407)"),
]


def _district_options() -> list[dict]:
    df = qa.district_list()
    return [{"label": "All Districts", "value": "__all__"}] + [
        {"label": r["name"], "value": r["district_id"]} for _, r in df.iterrows()
    ]


app.layout = html.Div(
    [
        dcc.Store(id="district-store"),
        header(
            breadcrumb=["District Overview"],
            filters=[
                dcc.Dropdown(
                    id="district-filter",
                    options=_district_options(),
                    value="__all__",
                    clearable=False,
                    style={"width": "260px"},
                ),
            ],
        ),
        html.Div(
            [
                html.Div(
                    dcc.Tabs(
                        id="report-tabs",
                        value=REPORT_TABS[0][0],
                        vertical=True,
                        children=[dcc.Tab(label=label, value=key) for key, label in REPORT_TABS],
                    ),
                    className="lrs-rail",
                ),
                html.Div(id="main-content", className="lrs-main"),
            ],
            className="lrs-body",
        ),
        footer("District Overview dashboard — spec §9.4"),
    ],
    className="lrs-shell",
)


def _scope(district_value: str) -> str | None:
    return None if district_value in (None, "__all__") else district_value


def _banner_if_unhealthy():
    err = health()
    if err:
        return html.Div(err, className="lrs-banner")
    return None


def render_overview(district_id: str | None):
    k = qa.kpi_summary(district_id)
    daily = qa.daily_activity(district_id)

    tiles = html.Div(
        [
            kpi_tile("Active Students", f"{k['students']:,}"),
            kpi_tile("Active Textbooks", f"{k['textbooks']:,}"),
            kpi_tile("Sections", f"{k['sections']:,}"),
            kpi_tile(
                "Mean Concept Mastery", f"{k['mastery']:.0%}",
                delta="of concepts attempted", good=k["mastery"] >= 0.5,
            ),
            kpi_tile("Statements Compressed", f"{k['statements']:,}"),
        ],
        className="lrs-kpi-row",
    )

    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Scatter(
        x=daily["day"], y=daily["statements"], mode="lines", fill="tozeroy",
        line=dict(color=CATEGORICAL[0], width=2), name="Statements/day",
        hovertemplate="%{x}<br>%{y:,} statements<extra></extra>",
    ))
    fig.update_layout(height=340, showlegend=False,
                       yaxis_title="Statements compressed", xaxis_title=None)

    return html.Div([
        tiles,
        card("Ingestion Activity Over the Term", dcc.Graph(figure=fig, config={"displaylogo": False})),
    ])


def render_schools(district_id: str | None):
    df = qa.school_comparison(district_id)
    if df.empty:
        return html.Div("No schools in scope.", className="lrs-empty")

    mastery_fig = go.Figure(layout=base_layout())
    mastery_fig.add_trace(go.Bar(
        x=df["school"], y=df["mean_mastery"], marker_color=CATEGORICAL[0],
        hovertemplate="%{x}<br>Mean mastery: %{y:.0%}<extra></extra>",
    ))
    mastery_fig.update_layout(height=340, yaxis=dict(tickformat=".0%", title="Mean mastery"),
                               showlegend=False)

    engagement_fig = go.Figure(layout=base_layout())
    engagement_fig.add_trace(go.Bar(
        x=df["school"], y=df["statements"], marker_color=CATEGORICAL[1],
        hovertemplate="%{x}<br>%{y:,} statements<extra></extra>",
    ))
    engagement_fig.update_layout(height=340, yaxis_title="Statements compressed", showlegend=False)

    return html.Div(
        [
            card("Mean Concept Mastery by School", dcc.Graph(figure=mastery_fig, config={"displaylogo": False})),
            card("Engagement Volume by School", dcc.Graph(figure=engagement_fig, config={"displaylogo": False})),
        ],
        className="lrs-grid",
    )


def render_courses(district_id: str | None):
    df = qa.course_rollup(district_id)
    if df.empty:
        return html.Div("No courses in scope.", className="lrs-empty")

    # Two-level treemap: schools as roots, courses as leaves. Plotly's ids/parents form
    # needs every node — including the roots — declared once, so school subtotals are
    # computed here rather than left for Plotly to infer.
    school_totals = df.groupby("school", as_index=False)["students"].sum()
    labels = list(school_totals["school"]) + list(df["course"])
    parents = [""] * len(school_totals) + list(df["school"])
    values = list(school_totals["students"]) + list(df["students"])
    mastery_by_school = df.groupby("school")["mean_mastery"].mean()
    colors = list(mastery_by_school.reindex(school_totals["school"])) + list(df["mean_mastery"])

    fig = go.Figure(layout=base_layout())
    fig.add_trace(go.Treemap(
        labels=labels, parents=parents, values=values,
        marker=dict(
            colors=colors,
            colorscale=[[i / (len(SEQUENTIAL_BLUE) - 1), c] for i, c in enumerate(SEQUENTIAL_BLUE)],
            colorbar=dict(title="Mastery", tickformat=".0%"),
        ),
        customdata=colors,
        hovertemplate="%{label}<br>%{value} students<br>Mean mastery: %{customdata:.0%}<extra></extra>",
        textinfo="label+value",
    ))
    fig.update_layout(height=460)

    return card("Students and Mastery by Course", dcc.Graph(figure=fig, config={"displaylogo": False}),
                subtitle="Box size = enrolled students · color = mean concept mastery")


def render_deployments(district_id: str | None):
    df = qa.deployment_inventory(district_id)
    df = df.copy()
    df["published_at"] = df["published_at"].astype(str).str.slice(0, 10)
    return card(
        "Deployment Inventory",
        data_table("deployment-table", list(df.columns), data=df.to_dict("records")),
        subtitle="Which version is live where. Provisional-vs-reconciled ingest state lives "
                 "in the event store (§5.3), not the graph, so it isn't shown here.",
    )


def render_licensing(district_id: str | None):
    df = qa.seat_utilization(district_id)
    if df.empty:
        return html.Div("No districts in scope.", className="lrs-empty")

    figs = []
    for _, row in df.iterrows():
        util = row["utilization"]
        color = STATUS["good"] if util < 0.85 else (STATUS["warning"] if util < 0.95 else STATUS["critical"])
        g = go.Figure(go.Indicator(
            mode="gauge+number", value=util * 100,
            number={"suffix": "%", "font": {"color": color}},
            gauge={
                "axis": {"range": [0, 100], "tickcolor": "#898781"},
                "bar": {"color": color},
                "bgcolor": "rgba(0,0,0,0)",
                "borderwidth": 0,
                "steps": [{"range": [0, 85], "color": "#e1e0d9"},
                          {"range": [85, 95], "color": "#f0ded6"},
                          {"range": [95, 100], "color": "#f6d6d6"}],
            },
        ))
        # No `title` on the Indicator itself — the card() below already carries the
        # district name as its HTML title, and Plotly renders its own title inside the
        # SVG at a fixed offset that overlapped the card header rather than sitting below it.
        g.update_layout(**{**base_layout(), "height": 200, "margin": dict(l=20, r=20, t=10, b=10)})
        figs.append(dcc.Graph(figure=g, config={"displaylogo": False}))

    return html.Div(
        [
            card(row["district"], fig, subtitle=f"{row['active_seats']:,} / {row['licensed_seats']:,} seats")
            for row, fig in zip(df.to_dict("records"), figs)
        ],
        className="lrs-grid",
    )


RENDERERS = {
    "overview": render_overview,
    "schools": render_schools,
    "courses": render_courses,
    "deployments": render_deployments,
    "licensing": render_licensing,
}


@app.callback(
    Output("main-content", "children"),
    Input("report-tabs", "value"),
    Input("district-filter", "value"),
)
def update_main(tab: str, district_value: str):
    banner = _banner_if_unhealthy()
    if banner:
        return banner
    district_id = _scope(district_value)
    return RENDERERS[tab](district_id)


if __name__ == "__main__":
    app.run(debug=True, port=8051)
