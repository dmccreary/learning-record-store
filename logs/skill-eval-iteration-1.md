# `add-xapi-events-to-microsim` skill — eval round 1 (2026-09-26)

Phase 1, P1.8 of the plan in `TODO.md`. The skill is in
`~/Documents/ws/ibook-skills/skills/add-xapi-events-to-microsim/`; the evals are in its
`evals/evals.json`. The run workspace was the session scratchpad
(`add-xapi-events-to-microsim-workspace/`). It is ephemeral, so this log keeps what it
found.

## Setup

- **3 evals × 2 configurations**, one run each. `with_skill` agents were pointed at the
  skill. `without_skill` agents got the same prompt and could read this repo, but not the
  skills repo.
- **Isolation.** Each run worked on its own trimmed **copy** of the book: `mkdocs.yml`,
  `docs/js`, `docs/css`, `docs/learning-graph`, the target sim, and, for this book, the four
  instrumented sims plus `docs/specs`. The real repos were not touched, which was confirmed with
  `git status` afterwards.
- **Grading** was done by a script. It ran `check-xapi.py` with each eval's actions file, plus
  eval-specific Playwright checks:
  - the sim still works with the runtime blocked;
  - clicks still reveal their content;
  - the iframe fits a full log;
  - the concept map in `metadata.json` matches the emitted statements;
  - the runtime is unchanged.

| Eval | Sim | Shape | What it tests |
|---|---|---|---|
| 1 chaos-kill-p5-prediction | `docs/sims/chaos-kill-test-simulator` | p5 DOM controls + canvas-drawn prediction buttons | predict → check as `answered`, production sim, p5-editor guard |
| 2 mermaid-statement-triple-teaching | `docs/sims/xapi-statement-triple` | Mermaid 11 click-to-pin template | teaching sim, panel layout, iframe height, lesson text |
| 3 chartjs-fdm-price-other-book | `3d-printing-course/docs/sims/fdm-price-history` | Chart.js 4, another book, no runtime yet | runtime install + generated `lrs-config.js`, the Chart.js pilot |

## Results

| Eval | with skill | without skill |
|---|---|---|
| 1 chaos-kill | 9/9 | 8/9 (concept map not in the `xapi.objects` convention) |
| 2 statement-triple | 9/9 | 8/9 (same) |
| 3 fdm-price-history | 8/8 | 8/8 |
| **Pass rate** | **100%** | **93%** |
| Time, mean | 893 s | 822 s |
| Tokens, mean | 232k | 234k |

**The assertions barely separate the two configurations.** Each baseline had this repo's
runtime, the four reference sims, the contract and this TODO to read, and Opus rebuilt the
pattern from them. Every baseline also wrote its own 150–300-line check script. The skill's
value showed up as:
- one metadata convention, which the checker can verify against the code;
- one shared checker, instead of a new script per run;
- adapter corrections from every run.

A fairer next round would target books with no reference sims nearby, or measure time to a
passing check.

## What the runs found

**About the sims and the runtime** (logged in `TODO.md` §5):
- **The Full-mode `pageDwell` over-counts.** It times from iframe load to tab-hide, so a sim deep
  in a long chapter gets the whole read. This is a runtime bug.
- **The chaos-kill Identity answer key contradicts chapter 19.** Both chaos runs found it. The
  baseline edited the key; the skill run left it unmapped and reported it.
- **xapi-statement-triple is also embedded in chapter 1** (`index.md:205`, 382 px). Teaching mode
  follows the sim, so that iframe must grow too. Both Mermaid runs flagged it.
- **scientific-method's phone layout.** Found while testing the skill's scripts, before the evals.
  Fixed.

**About the skill** (all applied the same day):
- **Chart.js:** `options.onHover` never fires on mouseout. Hover must use a plugin's
  `afterEvent` plus `tooltip.getActiveElements()`, gated on `element.inRange`. The adapter now
  carries the pilot's code and is marked **piloted**.
- **Mermaid click-to-pin template:** the skeleton worked unchanged. The template's
  fill-the-iframe CSS needs a teaching-only layout scoped with `body:has(> .xapi-panel)`, which
  is now in the adapter.
- **p5 canvas predict → check:**
  - de-duplicate re-checks of the same (question, response);
  - follow the sim's own round logic;
  - a question takes the concept it tests, not the page concept.
- **Concept mapping:** a pairing the book itself states is evidence, not a guess. Also check
  answer keys against the chapter.
- **Step 8** now finds **every** embed of the sim and routes the height through
  `CANVAS_HEIGHT` + `sync-iframe-heights.py`. A hand-edited iframe gets shrunk back by the next
  sync.
- **Script fixes:**
  - `check-xapi.py` no longer flags `point-2018` / `year-2018` as positional;
  - `measure-iframe.py` ignores invisible elements (Mermaid's tooltip div) and lists all embeds
    plus the `CANVAS_HEIGHT` source;
  - `detect-library.py` stops reading prose as quiz logic, ignores hidden legends, and reads
    `technical.framework`;
  - `install-runtime.py` takes the version from `extra.textbook_version`.

## Judgement calls the runs disagreed on (for Dan)

1. ~~**Iframe sizing for a teaching sim.**~~ **Decided (Dan, 2026-09-26): size for the laptop column.**
   790 and 940 were iframe *heights* from two different layouts. The skill's layout fits all
   widths at 790; the baseline's layout needed 940 on phones.
   - Measured on the published site, the content column is 688–757 px on laptops and tablets and
     358 px on phones.
   - About 90% of target students use laptops, and phones are often banned in US schools. The
     ~20% mobile traffic is mostly browsing the text.
   - The skill's step 8 now says so: recommend from the 700 px measurement, and mention phone
     overflow without sizing for it.
2. **Strictness about unmapped objects.** Neither run guessed a concept:
   - The skill run left Gateway and Processor unmapped.
   - The baseline used the chapter's own pairing (Gateway → Kafka Unavailable Failure).
   - The skill now says a book-stated pairing is evidence.
3. **Editing content.** The baseline fixed the Identity answer key itself; the skill run only
   reported it. The skill now says: report it, and leave the content decision to the user.
