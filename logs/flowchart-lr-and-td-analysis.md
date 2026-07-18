# Converting wide `flowchart LR` mermaid diagrams to narrow `flowchart TD`

**Date:** 2026-07-18
**Status:** **DONE** — 9 of 11 candidate diagrams converted, verified against the live site, no clipping.
**User feedback:** explicitly called the analysis "excellent work" and was "VERY happy" with the
quality of the empirical verification approach — this is the reason the method below is worth
keeping as a reusable pattern (see the TODO item to fold it into the `microsim-generator` skill).

---

## The ask

Several MicroSims under `docs/sims/*/main.html` use Mermaid `flowchart LR` for step-by-step
"workflow" diagrams. Embedded in a chapter, the diagram panel is only **66.67% of the iframe
width** (the other third is the click-to-detail info panel — see each sim's `style.css`), and a
chapter's actual rendered iframe width on this site is **~684px**, so the panel content area is
only **~436px** wide. A `flowchart LR` chain of 5–6 nodes squeezed into 436px renders with
illegibly small text. The user asked: find the long/wide `flowchart LR` diagrams and convert them
to a top-down (`flowchart TD`) layout so they read narrow instead of squeezed.

## Why this needed empirical testing, not just a global find/replace

The naive fix — `sed 's/flowchart LR/flowchart TD/'` on every match — is wrong for some diagrams
and was caught **before** being applied broadly, by testing layout behavior in the browser rather
than assuming how Mermaid's dagre layout engine handles direction changes.

Mermaid's dagre-based layout ranks nodes along the *primary* flow axis (columns in LR, rows in
TD) and arranges anything **not connected by an edge** — separate components, or sibling
subgraphs with no edge between them — along the **perpendicular** axis. That perpendicular
placement flips with the direction:

- In `flowchart LR`, disconnected chains stack **vertically** (as rows) → narrow, tall. Good for a
  narrow column.
- In `flowchart TD`, the same disconnected chains stack **horizontally** (as columns) → wide,
  short. Bad for a narrow column — the opposite of the goal.

This is *not* true for a single **connected** component (a real chain, tree, or diamond DAG where
every node reaches every other node via edges) — there, flipping LR→TD genuinely collapses the
long horizontal run into a tall narrow column, because the rank axis (the "long" dimension) is
what flips.

So the deciding question for each diagram was: **is it one connected graph, or does it secretly
contain multiple disconnected pieces (or sibling subgraphs joined only by proximity, not edges)?**

### How this was verified, not assumed

For each of the trickier shapes, the diagram's `flowchart LR` line was temporarily edited to
`flowchart TD` directly in the sim's `main.html` (with the original backed up to `/tmp`), reloaded
in the Browser pane pointed at the `file://` path, and the rendered SVG was inspected two ways:

1. A screenshot, to see the shape at a glance.
2. `document.querySelector('.mermaid svg').getAttribute('viewBox')` via the JS tool, to get exact
   width/height in Mermaid's own coordinate space — independent of whatever width the browser
   pane happened to be, since the SVG always fills its container at a fixed aspect ratio.

Every file was reverted to its original content immediately after being read, before deciding
anything, so no diagram was left in a half-tested state.

**Two false starts worth recording**, because they explain some of the odd tool-call patterns in
this session:

- The Browser pane's `navigate` tool does not reliably reload a `file://` URL that a tab has
  already visited unless `force: true` is passed — and even then, a *new* path the tab has never
  seen can silently no-op (stayed on the old page, confirmed by reading `window.location.href`
  back). Opening a **fresh tab** via `preview_start` for each new file was the reliable pattern;
  reusing a tab only worked for a same-URL reload with `force: true`.
- Writing test files to the session scratchpad (outside the repo) rendered as an inert "static
  snapshot" — Mermaid's JS never ran. Test files had to live inside the repo (even temporarily) to
  actually execute.

## What was tested, and the result

| Sim | Shape | LR viewBox (w×h) | TD viewBox (w×h) | Verdict |
|---|---|---|---|---|
| `functions-at-the-edges` | 4 fully **disconnected** 3-node chains | narrow, stacked rows | 4 columns side-by-side (confirmed via live test) | **Keep LR** — TD makes it wider |
| `lms-vs-lrs-architecture` | 2 subgraphs, **no edge** between them | 1 col × 2 stacked rows (~520px wide) | 2 subgraphs side-by-side (confirmed via live test) | **Keep LR** — TD makes it wider |
| `ingestion-processing-storage-pipeline` | linear chain (6) + 1 branch, connected | wide | 568×839 | **Convert** |
| `roster-ingestion-workflow` | linear chain (5) + 1 branch, connected | wide | 586×738 | **Convert** |
| `xapi-governance-handoff` | linear chain (4) + 3-way fan-out tail, connected | wide | 781×663 | **Convert** |
| `observability-pipeline-trace-flow` | shared-root tree, 2 branches, connected | 5 ranks wide | 555×561 (2 cols) | **Convert** |
| `mv-to-vertex-mapping` | fan-out/fan-in diamond, connected | 4 ranks wide | 755×442 (3 cols) | **Convert** |
| `statement-journey-producer-to-graph` | fan-out/fan-in diamond, connected | 6 ranks wide | 813×607 (5-wide field row) | **Convert** |
| `statement-storage-retrieval-voiding-flow` | 3 sub-chains sharing one node, connected | ~4 ranks wide | 820×462 | **Convert** |
| `remote-dev-workflow-comparison` | shared start/end, 3 parallel branches, connected | 5 ranks wide (896×546 original) | 896×546 (3 cols) | **Convert** |
| `multi-stage-build-pipeline` | 3 **connected** subgraphs (edges between them) | 1318×955 | 437×1885 | **Convert** — biggest win, but now very tall |

The `lms-vs-lrs-architecture` and `multi-stage-build-pipeline` pair is the sharpest illustration of
the rule: both have multiple subgraphs, but one pair is connected by edges and one isn't —
and that single fact flips the correct direction to convert. Getting this wrong on
`lms-vs-lrs-architecture` would have made the diagram measurably worse while looking like a
reasonable, defensible edit.

**Net: 9 of 11 converted, 2 deliberately left as `flowchart LR`.**

## Recomputing iframe heights

Every converted diagram is now tall/narrow instead of short/wide, so the old `CANVAS_HEIGHT`
values (stored in each sim's `metadata.json`, since these are no-`.js` Mermaid sims — see the
microsim-utils `canvas-height-strategy.md`) were stale.

New heights were computed from measured SVG `viewBox` dimensions, not guessed:

```
target panel content width ≈ 436px   (684px live iframe width × 0.6667 − 20px panel padding)
rendered height = viewBox_height × (436 / viewBox_width)
new CANVAS_HEIGHT ≈ rendered height + ~20px padding, rounded
```

The 684px live iframe width was read directly from the running `mkdocs serve` site
(`http://127.0.0.1:8000`, already running in the user's own terminal — never started or stopped by
this session, per project convention) rather than assumed, by measuring
`iframe.clientWidth` on an actual chapter page at both a narrow and a 1280px-wide viewport (mkdocs-
material caps content width regardless of window size, so this value is stable).

`metadata.json`'s `canvasHeight` was updated for all 9 sims, then
`microsim-utils/scripts/sync-iframe-heights.py --sim <id>` was run **once per sim** (not the
bulk/no-filter mode) specifically to avoid touching unrelated sims' heights that the bulk dry-run
showed would also change (e.g. `animal-cell`, `bouncing-ball`, `sine-wave` — stale for unrelated
reasons, out of scope for this task).

## Verification against the live site

For a spread of three sims (`roster-ingestion-workflow`, `multi-stage-build-pipeline`,
`mv-to-vertex-mapping`, spanning the smallest and the most extreme height change), the actual
served chapter pages were loaded at a 1280×900 viewport and checked via JS:

```js
panel.scrollHeight > panel.clientHeight + 2   // → false for all three: no clipping, no wasted scroll
```

All three came back `clipped: false` with `scrollHeight` within 2–4px of `clientHeight` — i.e. the
new heights are a tight fit, not just "big enough."

## Known trade-off left for the user to weigh

`multi-stage-build-pipeline` went from a compact 1318×955 (LR, 3 subgraphs side-by-side) to
437×1885 (TD, 3 subgraphs stacked in one column) — a ~2x width win but the iframe is now nearly
1900px tall. This is the correct mechanical answer to "narrow column," but is a large vertical
footprint for one diagram in a chapter. Flagged to the user rather than silently accepted; no
change made without asking, since a large layout trade-off like this is a judgment call, not a bug.

## Files touched

- `docs/sims/{9 sim ids}/main.html` — `flowchart LR` → `flowchart TD` (top-level direction only;
  no node/edge content changed)
- `docs/sims/{9 sim ids}/metadata.json` — `canvasHeight` recomputed
- `docs/sims/{9 sim ids}/index.md` — iframe height synced
- 8 chapter `index.md` files — iframe height synced (one sim, `xapi-governance-handoff`, happened
  to already have the same height by coincidence, so its chapter embed had no diff)
- **Not touched:** `docs/sims/functions-at-the-edges/main.html`,
  `docs/sims/lms-vs-lrs-architecture/main.html` — deliberately left as `flowchart LR`
