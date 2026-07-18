# MicroSim Generation Log

Autonomous run converting **all 122 TODO diagram specifications** (extracted from
the `#### Diagram:` blocks of every chapter's `index.md`) into working, verified
MicroSims. Every sim was implemented, given a per-diagram iframe height, marked
`status: implemented` in its `index.md` and `completion_status: implemented` in
its `metadata.json`, and verified to render in a real headless browser before
being counted done.

## Final tally — 122 / 122 complete

| Library | Count | Pattern used |
|---|---:|---|
| Mermaid | 56 | 2/3 diagram + 1/3 info panel; shared click-to-infobox `script.js` + `style.css` |
| p5.js | 29 | p5 standard: `updateCanvasSize()` first, `<main>` parenting, built-in controls, default-paused |
| vis-network | 19 | shared `vis-app.js` driver; 2/3 graph + 1/3 info panel; physics or hierarchical layout |
| Chart.js | 10 | self-contained, fixed-height chart box, tooltips + the key toggle/slider per sim |
| vis-timeline | 7 | self-contained, auto-height timeline + click-to-details panel |
| HTML/CSS/JS | 1 | self-contained annotated-statement interactive |

## How it was built

- **Extraction & scaffolding.** `create-microsim-todo-json-files.py` pulled 123
  specs into `docs/sims/TODO/`; `scaffold-microsims-from-todo.py` stubbed 122 sim
  directories. (One spec, `xapi-statement-triple`, already had a directory.)
- **Sequential, per-library batches.** Implemented one library group at a time,
  chapter by chapter, committing a checkpoint after each batch.
- **Verification harness.** `_verify.html` (a dev-only harness, not committed)
  loaded each batch's sims in visible, staggered iframes and polled each until it
  settled (an SVG/canvas/timeline rendered, or a Mermaid parse error appeared).
  Every one of the 122 was confirmed rendering; interaction was spot-checked
  (Mermaid click-to-infobox, vis-network node clicks, the grain-constraint
  MERGE/`:Statement` buttons, the suppression-attack subtraction math, p5 controls).

## Notable fixes made during the run

- **Mermaid v11 node ids.** Elements are `mermaid-<ts>-flowchart-<id>-<n>`; the
  first id-extraction regex only stripped a `flowchart-` prefix, so clicks never
  matched `nodeInfo`. Fixed the shared `script.js` to strip the full prefix.
- **Mermaid reserved words.** `classDef graph`/`note` and a bare `-.-` link caused
  parse errors; switched to safe class names and dotted-arrow `-.->`.
- **Harness reliability.** `display:none` iframes render lazily, causing false
  "failures"; the harness was changed to use visible iframes and poll until each
  frame settles, then extended to recognize vis-timeline output.

## Batch commits

Scaffold → Mermaid (ch 1-6, 7-11, 13-17, 18-23, 24-32) → vis-network (ch 3-9,
10-30) → Chart.js (ch 8-26) → vis-timeline (ch 1-28) → p5.js (ch 1-6, 11-15,
16-25, 4-32). See `git log` for the per-batch messages.
