---
title: Privacy Enforcement and Dashboard Mechanics
description: The single privacy filter every Analytics API response passes through — tenant scoping, threshold and complementary suppression, and audit logging — plus the replay mechanics and Dash/Plotly component vocabulary that make dashboards fast, safe, and reproducible.
generated_by: claude skill chapter-content-generator
date: 2026-07-17 11:05:53
version: 0.09
---

# Privacy Enforcement and Dashboard Mechanics

## Summary

This chapter covers the privacy choke point every report passes through — threshold and complementary suppression, and audit logging — alongside the Dash/Plotly component vocabulary (KPI tiles, heatmaps, funnels, cross-filtering) that every dashboard in Part 3 is assembled from.

## Concepts Covered

This chapter covers the following 23 concepts from the learning graph:

1. Tenant Context Injection
2. Threshold Suppression
3. Complementary Suppression
4. Privacy Audit Write
5. Trace ID Propagation
6. Paged Metric Threshold
7. Idempotency By Statement ID
8. Replay Command
9. Rebuild Graph Command
10. Shadow Table Swap
11. Common Dashboard Anatomy
12. KPI Tile Component
13. Heatmap Component
14. Funnel Chart Component
15. Radar Chart Component
16. Sankey Chart Component
17. Time Series Component
18. Data Table Component
19. Graph Explorer Component
20. Server-Side Aggregation
21. Cross-Filtering Interaction
22. Drill-Down Interaction
23. Dashboard Export

## Prerequisites

This chapter builds on concepts from:

- [Chapter 2: The Anatomy of an xAPI Statement](../02-anatomy-of-xapi-statement/index.md)
- [Chapter 5: System Context and the Five Architectural Planes](../05-system-context-architectural-planes/index.md)
- [Chapter 6: Multi-Tenancy, Rosters, and Pseudonymous Identity](../06-multi-tenancy-rosters-identity/index.md)
- [Chapter 7: The Property Graph Data Model](../07-property-graph-data-model/index.md)
- [Chapter 8: Summary Vertices and Statement Ingestion Mechanics](../08-summary-vertices-ingestion/index.md)
- [Chapter 10: Choosing the Technology Stack](../10-choosing-technology-stack/index.md)
- [Chapter 13: Component Design in Depth](../13-component-design-in-depth/index.md)

---

!!! mascot-welcome "One Choke Point, By Design"
    ![Rowan waving welcome](../../img/mascot/welcome.png){ class="mascot-admonition-img" }
    Chapter 14 ended with `uniqState(student_key)` — the group-size figure that the **Section Concept Daily MV** computes for free at aggregation time. This chapter is where that number finally gets used. Every dashboard a teacher, author, or district admin opens is, underneath, a call to the Analytics API, and every one of those calls passes through exactly one privacy filter before a pixel gets drawn. Let's follow the record.

The design specification is blunt about why there is only one filter: "Every response passes through **one** privacy filter — a single choke point, so no report can forget." A choke point is a single, unavoidable passage that every request must funnel through, precisely so that no developer can accidentally wire up a new report that skips it. This chapter walks that choke point from the first line of a request to the pixels rendered in a browser, then catalogs the vocabulary of components — KPI tiles, heatmaps, funnels, and the rest — that every dashboard in this book's later chapters is assembled from.

## Tenant Context Injection: The First Gate

Before any privacy math happens, a request has to be scoped to the right tenant. Recall from Chapter 6 that this project's multi-tenancy model nests district, school, course, and section, with the district boundary treated as **hard** — no query may cross it except by explicit system-admin action. The mechanism enforcing this is called **Tenant Context Injection**: every Analytics API query is built through a request-scoped object called a `TenantContext`, and the query builder is structured so a query without one simply does not compile. There is no helper function, shortcut, or forgotten parameter that constructs a query without a tenant predicate already attached.

This is stronger than "the application always remembers to filter by district" — a convention is only as durable as the least careful engineer who next touches the code. Tenant Context Injection turns "remember to scope this query" into "there is no way to write this query unscoped," the same structural move Chapter 14 made with the Grain Uniqueness Constraint.

!!! mascot-thinking "Where AuthN Ends and AuthZ Begins"
    ![Rowan thinking with a magnifying glass](../../img/mascot/thinking.png){ class="mascot-admonition-img" }
    Two questions a `TenantContext` answers together: authentication ("who is this?" — OIDC against the district's identity provider) and authorization ("what is this person allowed to see?" — role-based access control, enforced at the API layer rather than hidden behind a UI button a determined user could route around). A UI-only restriction only stops the mouse, not a hand-written HTTP request.

## The Privacy Filter's Three Jobs

With a request correctly scoped to its tenant, the Analytics API's single privacy filter does exactly three things to every response before it leaves the server. The first is **Threshold Suppression**: any cell in a report whose underlying group size falls below the district's configured threshold — 10 students by default — is suppressed rather than shown. A "cell" here means one number in a report: the average score for one section on one concept, one bar in a chart. If only seven students contributed to that number, showing it risks identifying one of those seven by elimination, so the filter blanks it out.

Threshold Suppression alone is not enough, and the second job closes a gap the first leaves open. **Complementary Suppression** asks a follow-up question: even after one small cell is hidden, can a reader still recover its value through arithmetic? If a table shows a row total and every cell except the suppressed one, a reader subtracts the visible cells from the total and gets the hidden number back for free. Complementary Suppression prevents this by suppressing a second cell — typically the next-smallest one in the same row — whenever leaving it visible would let the first suppression be reverse-engineered. The design specification states the stakes plainly: "A single suppressed cell in a row that publishes its total is not suppressed at all; it is arithmetic. This is the difference between a threshold that works and one that looks like it works."

The third job is **Privacy Audit Write**: every read touching personally identifiable or PII-adjacent data writes an entry to the append-only `lrs.audit` topic Chapter 14 introduced, recording who queried what, when. This is the mechanism behind report R-408, "Privacy & Access Audit," the audit-log table a System Admin or Auditor role browses to answer "who looked at this student's data, and why."

The table below reinforces the three jobs just described, now that each has been explained in prose.

| Filter step | Question it answers | What it does |
|---|---|---|
| Threshold Suppression | Is this group big enough to show safely? | Hides any cell built from fewer than the district's threshold (default 10) |
| Complementary Suppression | Can a hidden cell be recovered by subtraction? | Hides one more cell in the same row/column if the first suppression is otherwise derivable |
| Privacy Audit Write | Who is looking, and should that be on record? | Writes an audit entry to `lrs.audit` for every PII-adjacent read |

#### Diagram: The Privacy Filter Pipeline

<iframe src="../../sims/privacy-filter-pipeline/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>The Privacy Filter Pipeline</summary>
Type: workflow
**sim-id:** privacy-filter-pipeline<br/>
**Library:** Mermaid<br/>
**Status:** Specified
**Template:** https://github.com/dmccreary/information-systems/tree/main/docs/sims/privacy-regulatory-landscape<br/>

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: trace, differentiate

Learning objective: Let the learner trace an Analytics API request from Tenant Context Injection through Threshold Suppression, Complementary Suppression, and Privacy Audit Write, and identify at which stage a rostered-teacher exemption applies versus a cross-group view.

Purpose: Show a single Mermaid flowchart tracing one request end to end through the privacy filter's structural stages.

Nodes in order: "Dash callback issues request" -> "TenantContext injection (query cannot compile without it)" -> "Query builder reads pre-aggregated ClickHouse view" -> "Is this the caller's own rostered scope?" (decision diamond) -> two branches: "Yes: exempt from Threshold Suppression" and "No: apply Threshold Suppression" -> both branches rejoin at "Complementary Suppression check" -> "Privacy Audit Write to lrs.audit" -> "Response returned to Dash callback, cached by (report_id, tenant, params, data_version)".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence definition matching this chapter's prose. Clicking the decision diamond opens an infobox explaining the rostered-scope exemption: a teacher viewing their own students already knows those students by name, so showing their own roster's progress discloses nothing new, while cross-district, cross-school, and segment-breakdown views always pass through full suppression.

Color coding: The two AuthN/AuthZ nodes (Dash callback, TenantContext injection) in neutral gray; the three privacy-filter stages (threshold, complementary, audit) in the book's teal accent color to visually group them as "the one choke point."

Responsive design: The flowchart resizes to the width of its containing element; on narrow viewports the decision branches stack vertically instead of side by side.
</details>

## A Necessary Exemption, Not a Loophole

Read the threshold rule literally — "no report may reveal a disaggregated result for a group smaller than the threshold" — and it breaks the most basic report in the system: a single student is a group of one, so Threshold Suppression would blank out every individual progress report a teacher opens. The design resolves this with a distinction worth stating precisely: a teacher viewing their **own rostered section** already knows those students by name from the classroom, so showing that teacher their own students' progress discloses nothing new. The threshold's real purpose is preventing re-identification by parties **without** that legitimate, already-established relationship — a district comparing itself to other districts, a curriculum author viewing a segment breakdown, anyone looking at a group they did not already personally know.

So the filter applies full suppression to cross-group, de-identified, and benchmark views, and exempts a role's own directly-rostered scope. This chapter treats that distinction as a mechanism, not a legal argument — the FERPA- and COPPA-driven policy language behind *why* districts choose particular thresholds belongs to a later chapter on compliance. What matters here is the code path: the same `TenantContext` that scoped the query also carries whether the caller's role qualifies for the exemption, so the decision is made once, structurally, rather than re-implemented per report.

!!! mascot-tip "Test the Filter With the Boring Case First"
    ![Rowan pointing helpfully](../../img/mascot/tip.png){ class="mascot-admonition-img" }
    When you are reasoning about whether a report is safe, don't start with the exotic attack. Start with the boring one: does the row's total, plus every visible cell, let a reader do subtraction? Most real suppression bugs are exactly that arithmetic slip, not some clever statistical attack — which is exactly why Complementary Suppression exists as its own explicit step rather than being folded into Threshold Suppression as an afterthought.

The MicroSim below lets you play both suppression rules against a small worked table, so the arithmetic argument above becomes something you can watch happen rather than take on faith.

#### Diagram: Threshold and Complementary Suppression Simulator

<iframe src="../../sims/threshold-complementary-suppression-simulator/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Threshold and Complementary Suppression Simulator</summary>
Type: microsim
**sim-id:** threshold-complementary-suppression-simulator<br/>
**Library:** p5.js<br/>
**Status:** Specified

Bloom Taxonomy: Evaluate (L5)
Bloom Taxonomy Verb: determine, justify

Learning objective: Given a small table of per-mastery-band student counts and a row total, let the learner determine which cells Threshold Suppression hides and which additional cell Complementary Suppression must hide to prevent the first suppression from being recovered by subtraction.

Canvas layout:

- A 5-row by 4-column data table: rows are mastery bands ("Beginning", "Developing", "Proficient", "Advanced"), columns are student counts per band plus a "Row Total" column
- A control strip above the table: a "Threshold" slider (range 5-20, default 10), a "Load Scenario" dropdown with three presets ("Safe — all cells above threshold", "Single suppression needed", "Complementary suppression needed"), and a "Reset" button

Visual elements:

- Cells with a count at or above the threshold render with a normal white background and black text
- Cells below the threshold render with a red background and a lock icon, replacing the number with "—"
- When Complementary Suppression triggers, the second suppressed cell renders with an amber background and a lock icon, visually distinct from the primary (red) suppression
- A status line below the table states in plain language why each suppression happened, e.g. "Beginning (6) is below the threshold of 10 — suppressed. Developing (14) is now also suppressed: the row total and the two remaining visible cells would let a reader recover Beginning's value by subtraction."

Interactive controls:

- Slider: "Threshold" — recomputes suppression live as it moves
- Dropdown: "Load Scenario" — loads one of three preset row configurations to demonstrate no-suppression, single-suppression, and complementary-suppression cases
- Button: "Reset" — restores the default scenario and threshold

Behavior: On any threshold change or scenario load, the simulator recomputes which cells fall below threshold, then checks whether the remaining visible cells plus the row total would allow the suppressed cell's value to be derived by subtraction; if so, it suppresses the next-smallest visible cell and updates the status line to explain the chain of reasoning.

Interactive features: Clicking any cell (suppressed or not) opens an infobox stating its raw count (for instructor/demo mode only — a real dashboard would never expose this), whether it was suppressed, and which rule caused the suppression.

Color coding: Red background for primary Threshold Suppression, amber for secondary Complementary Suppression, matching the color logic used consistently across this chapter's other suppression discussion.

Responsive design: Table and control strip stack vertically on narrow viewports; the table itself scrolls horizontally within its container rather than shrinking column text below a readable size.
</details>

## Watching the Choke Point Do Its Job

Two more concepts round out the observability side of this filter, and both matter for the same reason: a system that quietly does the right thing is only trustworthy if someone can verify, after the fact, that it actually did. **Trace ID Propagation** is the mechanism the design specification uses for this: a trace ID is minted the moment a statement first reaches the ingestion gateway, rides along inside the statement's Kafka message headers, and gets attached to the resulting ClickHouse and Neo4j writes — so "end-to-end tracing from statement receipt to projection" becomes a single query against the tracing system, not a manual correlation exercise across five logs.

The second concept is about alerting rather than tracing. A **Paged Metric Threshold** is a numeric trigger point that, once crossed, pages a System Admin automatically rather than waiting for someone to notice a problem in a dashboard. The specification names four such triggers: processing lag greater than 5 minutes, dead-letter rate above 1%, any nonzero gateway `503` error rate, and reconciliation backlog growth — each one the figure that would hold true right before a district's dashboards start showing stale or wrong data. The same four numbers also render on the System Health dashboard for human review: "one source, two audiences."

- **Trace ID Propagation** answers "can I follow one specific statement through every system it touched?"
- **Paged Metric Threshold** answers "does this system tell a human the moment something crosses a line worth caring about?"

!!! mascot-warning "Audit Logging Is Not the Same as Tracing"
    ![Rowan waving a caution flag](../../img/mascot/warning.png){ class="mascot-admonition-img" }
    It is easy to conflate Privacy Audit Write with Trace ID Propagation because both leave a trail. They answer different questions. A Privacy Audit Write records *who read what PII-adjacent data, and when* — a compliance record aimed at humans reviewing access after the fact. Trace ID Propagation records *how one statement moved through the pipeline's plumbing* — an operational record aimed at engineers debugging a specific event. Confusing the two leads to under-logging one or over-logging the other; keep them as separate mechanisms serving separate audiences.

## Making Every Rebuild Safe: Idempotency and Replay

Everything this chapter has covered so far assumes the underlying data is correct. The next four concepts make it possible to *fix* the data — safely, repeatedly, without fear — when it is not. The foundation underneath all of them is **Idempotency By Statement ID**: because `statement_id` is the deduplication key everywhere a statement lands, from the `ReplacingMergeTree` engine in Chapter 14's `lrs.statements` table to every downstream projection, re-processing the same statement twice produces the same final state as processing it once. An operation with this property — running it multiple times has the same effect as running it once — is called idempotent, and it turns "rerun this pipeline against a range of history" from a dangerous operation into a routine one.

That property is what makes the **Replay Command** safe to run against live traffic. Its shape is `lrs replay --district D --from T1 --to T2 --into <table>`: it re-reads the immutable Kafka log for a district and time window, recomputes a projection from scratch, and writes the result into a fresh table rather than mutating the live one in place. Because the target is a separate table and every write is keyed by `statement_id`, running the same replay twice — by accident or to double-check a fix — produces byte-for-byte the same result both times.

Writing into a separate table only solves half the problem; the other half is how that rebuilt table becomes the one queries actually read. That is the **Shadow Table Swap**: the replay command builds its output entirely inside a new, temporary "shadow" table, invisible to any live query while populated, and only once the rebuild finishes does an atomic rename make the shadow table the new live table. A reader querying mid-replay sees either the old, complete data or the new, complete data — never a half-rebuilt mix.

One replay command is structurally different, and deserves its own name. The **Rebuild Graph Command**, `lrs replay --rebuild-graph`, does not replay statements at all — it resets the summarizer's watermark, the bookmark tracking how far it has already synced, back to zero. The ordinary 60-second sync loop Chapter 8 introduced then runs as it always does, rewriting every summary vertex because it correctly believes all of it is now unsynced. The specification explains why this matters: "There is no separate rebuild path to maintain, and no script that has gone untested since the last incident — the recovery code is the code that runs every minute in production."

Both commands rely on the same underlying idea — Idempotency By Statement ID — to be safe to run more than once, and both produce a correct result from the immutable log rather than from cached state. Where they differ is *what* gets rebuilt and *how*.

| Command | What it rebuilds | Mechanism | Safety guarantee |
|---|---|---|---|
| Replay Command | A ClickHouse table or materialized view for a specific district and time range | Recompute into a shadow table, then atomically swap it live | Idempotency By Statement ID makes repeated runs produce identical output |
| Rebuild Graph Command | Every Neo4j summary vertex | Reset the summarizer's watermark to zero; let the ordinary sync loop rewrite everything | Grain Uniqueness Constraint (Chapter 14) makes the sync loop's writes upserts, not duplicates |

#### Diagram: Replay Command and Rebuild Graph Command Compared

<iframe src="../../sims/replay-shadow-table-swap/main.html" width="100%" height="500px" scrolling="no"></iframe>

<details markdown="1">
<summary>Replay Command and Rebuild Graph Command Compared</summary>
Type: workflow
**sim-id:** replay-shadow-table-swap<br/>
**Library:** Mermaid<br/>
**Status:** Specified

Bloom Taxonomy: Analyze (L4)
Bloom Taxonomy Verb: differentiate, trace

Learning objective: Let the learner trace the Replay Command's shadow-table-and-swap path side by side with the Rebuild Graph Command's watermark-reset path, and explain why the second needs no separate rebuild logic of its own.

Purpose: Show two parallel Mermaid flowchart lanes under one heading, so the learner reads across both paths and sees them diverge from a shared starting point.

Left lane "Replay Command: lrs replay --from T1 --to T2 --into <table>": "Read immutable log for district + time window" -> "Recompute projection, keyed by statement_id" -> "Write into new shadow table (invisible to live queries)" -> "Rebuild complete: atomic swap" -> "Shadow table becomes the live table".

Right lane "Rebuild Graph Command: lrs replay --rebuild-graph": "Reset summarizer watermark to zero" -> "Ordinary 60-second sync loop runs as normal" -> "Summarizer reads 'unsynced' rollups (which is now all of them)" -> "MERGE upserts every summary vertex, guarded by the Grain Uniqueness Constraint" -> "Graph fully rebuilt with no dedicated rebuild code path".

Interactive features: Every node has a Mermaid click directive opening an infobox with a one-sentence explanation. A toggle labeled "Highlight shared safety guarantee" highlights the "keyed by statement_id" node in the left lane and the "Grain Uniqueness Constraint" node in the right lane simultaneously, with a connecting annotation: "Both paths are safe to re-run because each relies on a different structural guarantee against duplication."

Color coding: Left lane in one tint of the book's teal accent color, right lane in a second tint, so the two paths stay visually distinct while clearly belonging to the same diagram; the shared safety-guarantee toggle highlight in amber.

Responsive design: The two lanes stack vertically on narrow viewports instead of side by side, each still reading top to bottom.
</details>

## From Privacy-Safe Data to a Dashboard

Everything above this line describes what happens *before* a number is safe to draw. Everything from here on describes how that safe number becomes a dashboard a teacher, author, or administrator actually looks at. The specification names a shape every dashboard in this project follows, called the **Common Dashboard Anatomy**: a header carrying a breadcrumb (district, school, course, section) plus global filters for date range, textbook version, and cohort; a left rail holding a tabbed report menu; a main canvas arranging KPI tiles above a primary figure above supporting detail; and a footer offering export, scheduling, a "last refreshed" timestamp, and a visible privacy notice. Every dashboard cataloged later in this book — My Classes, Student Detail, Content Insights, District Overview — is this same skeleton with a different filter set and a different arrangement of figures inside the canvas.

That consistency is deliberate. A teacher who has learned where the filters live on one dashboard does not have to relearn dashboard navigation on the next one; only the content inside the canvas changes.

- Header: breadcrumb (District ▸ School ▸ Course ▸ Section) plus date-range, textbook-version, and cohort filters
- Left rail: a tabbed report menu for navigating between the dashboards available to the current role
- Main canvas: KPI tiles, then a primary figure, then supporting detail, arranged as a grid
- Footer: export controls, a scheduling option, a "last refreshed" timestamp, and a privacy notice

## The Component Vocabulary

Inside that canvas, every figure is drawn from a small, fixed vocabulary of component types, each specified against the open-source Dash/Plotly framework as this project's reference implementation model. Naming these components precisely matters because later chapters, when they describe a specific dashboard like My Classes or District Overview, assume you already recognize each one on sight.

A **KPI Tile Component** is a single big number with a delta indicator showing change against a prior period — "Average mastery: 78% (+4 pts)" — a Plotly `Indicator` trace. A **Heatmap Component** (`go.Heatmap`) colors a grid of cells by intensity, most often students against concepts, so a teacher scans a whole class's mastery pattern at a glance. A **Funnel Chart Component** (`go.Funnel`) shows stages narrowing as learners drop off — started a module, attempted the assessment, passed it — making attrition visible as a shrinking shape rather than a column of percentages.

Three more types round out the vocabulary. A **Radar Chart Component** (`go.Scatterpolar`) plots several concept-mastery scores as spokes around a center point, comparing a student's strengths and weaknesses simultaneously. A **Sankey Chart Component** (`go.Sankey`) draws flows of varying width between stages, useful wherever the width itself should encode how many learners took that path. A **Time Series Component** (`go.Scatter`) plots a metric like engagement or ingestion health against time.

Two final components handle data that resists compression into a chart. A **Data Table Component** (Dash's `dash_table.DataTable`) renders sortable, filterable, paginated rows for inspecting individual records. A **Graph Explorer Component** (the `dash-cytoscape` library) renders the learning-graph DAG itself as an explorable node-and-edge diagram, letting an author or administrator navigate concept dependencies directly.

The table below reinforces the eight components just introduced, matched to the Plotly/Dash element that implements each one and a representative report it serves.

| Component | Dash/Plotly element | Typical use |
|---|---|---|
| KPI Tile Component | `Indicator` trace | Big-number summary with a delta vs. prior period |
| Heatmap Component | `go.Heatmap` | Class-level concept mastery grid |
| Funnel Chart Component | `go.Funnel` | Completion funnels, module drop-off |
| Radar Chart Component | `go.Scatterpolar` | Per-student concept-mastery comparison |
| Sankey Chart Component | `go.Sankey` | Multi-stage drop-off flow maps |
| Time Series Component | `go.Scatter` | Engagement and ingestion-health trends over time |
| Data Table Component | `dash_table.DataTable` | Sortable, filterable, paginated row-level detail |
| Graph Explorer Component | `dash-cytoscape` | Interactive learning-graph DAG navigation |

!!! mascot-encourage "Eight Names, One Shared Skeleton"
    ![Rowan offering encouragement](../../img/mascot/encouraging.png){ class="mascot-admonition-img" }
    If eight new component names feels like a lot to hold onto at once, notice that you don't need to memorize which Plotly trace backs which chart — you need to recognize each shape when a later chapter shows it to you inside a real dashboard. A heatmap always means "many things scanned at once for pattern." A funnel or Sankey always means "where did people drop off." A KPI tile always means "one number, one trend." The names are labels for shapes you already understand.

## How a Click Becomes a New Query

A dashboard is not a static picture; every component above is wired to respond to what a reader does with it. **Server-Side Aggregation** is the rule that keeps this responsive without becoming slow or unsafe: figures request already-aggregated data from the Analytics API rather than pulling raw statements into the browser, so a chart summarizing forty students' activity never transmits forty students' worth of rows. This is what keeps every view inside the performance budget — no more than 2 seconds at the 95th percentile for a 40-student section, 5 seconds for a district rollup.

**Cross-Filtering Interaction** is what happens when clicking one figure changes what another figure shows, in the same view, without navigating anywhere — clicking a concept cell in a heatmap filters the student table below it, using Plotly's `clickData` event to trigger a Dash callback that re-queries the Analytics API. **Drill-Down Interaction** is a related but distinct move: rather than filtering figures on the same page, clicking an element navigates to an entirely different, more detailed view while carrying the current filter context forward — clicking a section in a district overview opens that section's own dashboard, already scoped.

Finally, **Dashboard Export** closes the loop: every figure and table exports to PNG or CSV, and every dashboard exports as a shareable PDF snapshot. Because export runs through the same Analytics API and the same privacy filter as the live view, an exported PDF carries the identical suppression rules as the screen it was generated from — there is no separate, less-guarded export path that could leak a cell the live dashboard would have hidden.

Before looking at the interactive explorer below, hold these four ideas together as one story: a click generates a new, still-tenant-scoped, still-privacy-filtered query (cross-filtering or drill-down), the browser only ever receives the aggregated answer (server-side aggregation), and whatever the reader ultimately wants to keep leaves through the same filter it arrived through (export).

#### Diagram: Dashboard Layout Builder

<iframe src="https://dmccreary.github.io/search-microsims/sims/dashboard-patterns/main.html" width="100%" height="500px" scrolling="no"></iframe>

[Run the Dashboard Layout Builder MicroSim fullscreen](https://dmccreary.github.io/search-microsims/sims/dashboard-patterns/main.html){ .md-button }

<details markdown="1">
<summary>Dashboard Layout Builder (reused MicroSim)</summary>
Type: infographic
**sim-id:** dashboard-patterns<br/>
**Library:** p5.js<br/>
**Status:** Reused<br/>
**Source:** https://dmccreary.github.io/search-microsims/sims/dashboard-patterns/<br/>
**Source Repo:** https://github.com/dmccreary/search-microsims/tree/main/docs/sims/dashboard-patterns<br/>

Reused from the MicroSim catalog (WHAT match score 0.76). Learning objective: let the learner construct a dashboard by selecting and arranging KPI tiles, a heatmap, and supporting detail components onto the Common Dashboard Anatomy's header/rail/canvas/footer skeleton, reinforcing which component types belong in which region and why a consistent skeleton lets a reader navigate any dashboard in this book without relearning the layout.
</details>

## Bringing the Choke Point and the Canvas Together

Follow one dashboard view through everything this chapter named. A teacher opens My Classes; the request carries a `TenantContext` built through Tenant Context Injection, scoping the query to that teacher's own sections before it can execute at all. The Analytics API reads pre-aggregated ClickHouse views and passes the result through the privacy filter: Threshold and Complementary Suppression apply in full to any cross-section comparison, but the teacher's own rostered students are exempt. A Privacy Audit Write records the read, and a Trace ID travels with the underlying data back to its source statement. If a number ever looks wrong, an operator reaches for the Replay Command or the Rebuild Graph Command — both safe to run repeatedly because Idempotency By Statement ID guarantees identical output, and a Shadow Table Swap guarantees no reader ever sees a half-finished rebuild.

The response lands inside the Common Dashboard Anatomy's canvas as a KPI Tile Component and a Heatmap Component, both fed by Server-Side Aggregation so the browser never sees a raw row. Clicking a cell triggers Cross-Filtering Interaction, narrowing a Data Table Component below it; clicking a student's name triggers Drill-Down Interaction into Student Detail. When the teacher prints it for a conference, Dashboard Export produces a PDF built from data that already passed through the same privacy filter as the screen — every mechanism in this chapter exists so that last clause can be true without exception.

## Key Takeaways

- **Tenant Context Injection** makes every Analytics API query structurally incapable of running without a tenant scope, the same "push the rule into the schema" move Chapter 14 used for grain uniqueness.
- **Threshold Suppression** hides any report cell built from fewer students than the district's configured minimum group size; **Complementary Suppression** closes the arithmetic loophole a single suppressed cell would otherwise leave open; a rostered role's own students are exempt from both because that relationship already exists.
- **Privacy Audit Write** logs every PII-adjacent read to the append-only audit feed, distinct from **Trace ID Propagation**, which follows one statement's technical path through the pipeline, and from a **Paged Metric Threshold**, which pages an admin the moment an operational metric crosses a line worth acting on.
- **Idempotency By Statement ID** is what makes the **Replay Command** and the **Rebuild Graph Command** safe to run repeatedly against live traffic; a **Shadow Table Swap** ensures a reader never sees a half-rebuilt projection mid-replay.
- The **Common Dashboard Anatomy** — header, rail, canvas, footer — is the one skeleton every dashboard in this book shares, populated from a fixed component vocabulary: the **KPI Tile**, **Heatmap**, **Funnel Chart**, **Radar Chart**, **Sankey Chart**, **Time Series**, **Data Table**, and **Graph Explorer** components.
- **Server-Side Aggregation** keeps the browser from ever receiving raw statement rows; **Cross-Filtering Interaction** and **Drill-Down Interaction** turn a click into a new, still-privacy-filtered query; **Dashboard Export** carries the same suppression rules into every PNG, CSV, and PDF a reader takes with them.

!!! mascot-celebration "The Choke Point Holds"
    ![Rowan celebrating with confetti](../../img/mascot/celebration.png){ class="mascot-admonition-img" }
    One filter, three jobs, and not a single dashboard in this book gets to skip it — that is what "structural" privacy enforcement actually looks like in practice, not just in a policy document. What does the evidence show? A system earns trust by making the safe path the only path. In [Chapter 16: The Container Image and the Role Dispatcher CLI](../16-container-image-and-cli/index.md), we leave the data layer behind and look at how every one of these roles — gateway, processor, summarizer, analytics API, dashboards — actually starts up and runs from a single image.
