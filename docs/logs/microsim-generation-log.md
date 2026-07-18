# MicroSim Generation Log

Autonomous run converting all TODO diagram specifications extracted from the
chapter content into working MicroSims, one library group at a time.

- **Source specs:** `docs/sims/TODO/*.json` (extracted from `#### Diagram:` blocks
  in every chapter's `index.md`).
- **Total to implement:** 122 MicroSims.
- **Library mix:** 56 Mermaid, 29 p5.js, 19 vis-network, 10 Chart.js,
  7 vis-timeline, 1 custom HTML.

Each implemented sim replaces its scaffold `main.html` with a real
implementation, gets a per-diagram iframe height, `status: implemented` in
`index.md`, and `canvasHeight` + `completion_status: implemented` in
`metadata.json`. Mermaid sims share a click-to-infobox `script.js` + `style.css`
(2/3 diagram + 1/3 info panel). Each diagram is verified to parse/render before
being marked done.

## Progress by batch

### Batch 1 — Mermaid, chapters 1–6 (12 sims) — DONE

lms-vs-lrs-architecture, xapi-statement-triple, voiding-lifecycle-flow,
xapi-endpoint-http-verbs, cmi5-launch-sequence, xapi-governance-handoff,
xapi-profile-anatomy, statement-timestamp-verifiability-chain,
ingestion-processing-storage-pipeline, lrs-system-context-diagram,
roster-ingestion-workflow, tenancy-hierarchy-tree.

Notes: adapted the shared Mermaid template from hover to **click**-to-reveal per
the specs. Fixed the node-id extractor for Mermaid v11's
`mermaid-<ts>-flowchart-<id>-<n>` element ids (the original `^flowchart-` regex
left the diagram prefix, so clicks never matched `nodeInfo`). All 12 verified
rendering without syntax errors; click interaction confirmed in-browser.

<!-- Subsequent batches appended below as they complete. -->
