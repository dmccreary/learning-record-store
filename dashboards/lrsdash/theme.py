"""Shared visual language for all three dashboards — spec §9.1-§9.3.

Colors are the validated reference palette from the dataviz skill (categorical hues in
fixed order, single-hue sequential, blue<->red diverging, reserved status colors), not
picked by eye. Reused across admin/teacher/author apps so a district KPI tile and a
class mastery heatmap read as one system rather than three unrelated tools.

SCOPE CUT: light theme only. Spec §9.3 asks for "light/dark parity", but Plotly figures
set colors in the layout dict, not CSS — a real dark mode means a second template AND a
client-side toggle wired through every callback's returned figure. Half of that (dark
chrome around light-tuned charts, or vice versa) is worse than neither. Deferred rather
than shipped broken; see this module's docstring for the reasoning pattern this repo
already uses in seed.py.
"""

from __future__ import annotations

from dash import dash_table, html

# --- Categorical (fixed order — never cycled, never reassigned when a filter changes
# the series count). Slots 1-4 cover every report in the catalog; 5-8 exist so a report
# with more series (e.g. Version Comparison small multiples) doesn't run out. ---
CATEGORICAL = [
    "#2a78d6",  # 1 blue
    "#1baf7a",  # 2 aqua
    "#eda100",  # 3 yellow
    "#008300",  # 4 green
    "#4a3aa7",  # 5 violet
    "#e34948",  # 6 red
    "#e87ba4",  # 7 magenta
    "#eb6834",  # 8 orange
]

# Sequential — single hue, light -> dark. Heatmaps (R-201), gauges (R-407).
SEQUENTIAL_BLUE = [
    "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec",
    "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab",
    "#184f95", "#104281", "#0d366b",
]

# Diverging — blue <-> red, gray midpoint. Effect-size / delta charts (R-302, R-307).
DIVERGING = ["#0d366b", "#256abf", "#6da7ec", "#cde2fb", "#f0efec",
             "#f5c6c5", "#ec8f8e", "#e34948", "#8a1f1e"]

# Status — fixed meaning, never reused as series color. Alerts (R-107), health (R-405).
STATUS = {
    "good": "#0ca30c",
    "warning": "#fab219",
    "serious": "#ec835a",
    "critical": "#d03b3b",
}

# Chrome / ink — light mode only (see module docstring).
INK = "#0b0b0b"
INK_SECONDARY = "#52514e"
INK_MUTED = "#898781"
GRIDLINE = "#e1e0d9"
BASELINE = "#c3c2b7"
SURFACE = "#fcfcfb"
PAGE = "#f9f9f7"

FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", sans-serif'


def base_layout() -> dict:
    """A Plotly `layout` dict every figure in every app starts from.

    Transparent paper/plot background so figures sit on the card surface rather than
    fighting it with a second white rectangle; muted gridlines so the data ink wins;
    no chart title (the card header above the figure already names it, so a second bold
    title would either repeat that or drift out of sync with it) — reports that need a
    computed title (a book name, a section id) still set one explicitly.
    """
    return dict(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family=FONT_FAMILY, color=INK_SECONDARY, size=13),
        colorway=CATEGORICAL,
        margin=dict(l=48, r=24, t=24, b=40),
        legend=dict(
            orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0,
            font=dict(color=INK_SECONDARY, size=12), bgcolor="rgba(0,0,0,0)",
        ),
        hoverlabel=dict(
            bgcolor=SURFACE, bordercolor=BASELINE,
            font=dict(family=FONT_FAMILY, color=INK, size=12),
        ),
        xaxis=dict(gridcolor=GRIDLINE, zerolinecolor=BASELINE, linecolor=BASELINE,
                    tickfont=dict(color=INK_MUTED)),
        yaxis=dict(gridcolor=GRIDLINE, zerolinecolor=BASELINE, linecolor=BASELINE,
                    tickfont=dict(color=INK_MUTED)),
    )


# ---------------------------------------------------------------------------
# Shared Dash components — the §9.1 anatomy every dashboard follows:
# header (breadcrumb + filters) / left rail (tabs) / main canvas / footer.
# ---------------------------------------------------------------------------


def header(breadcrumb: list[str], filters: list) -> html.Div:
    """Breadcrumb + a filter row. `filters` is a list of Dash components (dropdowns,
    a DatePickerRange) already built by the calling app, since each dashboard's filters
    are different — this just gives them a consistent frame."""
    return html.Div(
        [
            html.Div(
                " ▸ ".join(breadcrumb),  # ▸
                className="lrs-breadcrumb",
            ),
            html.Div(filters, className="lrs-filters"),
        ],
        className="lrs-header",
    )


def kpi_tile(label: str, value: str, delta: str | None = None, good: bool | None = None) -> html.Div:
    """A Plotly `Indicator`-style big-number tile, spec §9.2. Built as HTML/CSS rather
    than a `go.Indicator` figure: a dozen of these render instantly with no Plotly
    figure-init cost, and delta color needs the STATUS palette, not a gauge needle."""
    delta_children = []
    if delta is not None:
        color = INK_MUTED
        if good is True:
            color = STATUS["good"]
        elif good is False:
            color = STATUS["critical"]
        delta_children = [html.Span(delta, className="lrs-kpi-delta", style={"color": color})]
    return html.Div(
        [
            html.Div(label, className="lrs-kpi-label"),
            html.Div(value, className="lrs-kpi-value"),
            *delta_children,
        ],
        className="lrs-kpi-tile",
    )


def card(title: str, children, subtitle: str | None = None) -> html.Div:
    """A titled panel around one figure/table — the unit the §9.1 main canvas grid is
    made of. `title` here is the ONE place a report's name is set (see base_layout)."""
    head = [html.Div(title, className="lrs-card-title")]
    if subtitle:
        head.append(html.Div(subtitle, className="lrs-card-subtitle"))
    return html.Div([html.Div(head, className="lrs-card-head"), children], className="lrs-card")


def evidence_note(n: int, noun: str = "statements") -> html.Div:
    """Every mastery/engagement figure traces to an explicit evidence count (spec §4.3:
    'a report can always say how much evidence a number rests on'). One line, not a
    tooltip, so it can't be missed."""
    return html.Div(f"Based on {n:,} {noun} compressed into these summaries.",
                     className="lrs-evidence-note")


def footer(extra: str = "") -> html.Div:
    return html.Div(
        [
            html.Span("Export via each table's ⭳ menu or a figure's camera icon.",
                      className="lrs-footer-item"),
            html.Span("Synthetic demo data — see README.", className="lrs-footer-item"),
            html.Span(extra, className="lrs-footer-item") if extra else None,
        ],
        className="lrs-footer",
    )


def data_table(id: str, df_columns: list[str], **kwargs) -> dash_table.DataTable:
    """Spec §9.2: 'Sortable, filterable, paginated, CSV-exportable.' DataTable does all
    four natively — no custom export code needed, which is also why table export is
    real (a working ⭳ button) while figure export is Plotly's stock camera icon rather
    than a second bespoke path."""
    return dash_table.DataTable(
        id=id,
        columns=[{"name": c.replace("_", " ").title(), "id": c} for c in df_columns],
        sort_action="native",
        filter_action="native",
        page_size=12,
        export_format="csv",
        style_table={"overflowX": "auto"},
        style_cell={
            "fontFamily": FONT_FAMILY, "fontSize": 13, "padding": "8px 12px",
            "textAlign": "left", "border": "none", "borderBottom": f"1px solid {GRIDLINE}",
        },
        style_header={
            "backgroundColor": PAGE, "color": INK_MUTED, "fontWeight": 600,
            "border": "none", "borderBottom": f"1px solid {BASELINE}", "textTransform": "uppercase",
            "fontSize": 11,
        },
        style_data={"backgroundColor": SURFACE, "color": INK},
        **kwargs,
    )


APP_INDEX_STRING = """<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
    </head>
    <body>
        {%app_entry%}
        <footer>{%config%}{%scripts%}{%renderer%}</footer>
    </body>
</html>"""
