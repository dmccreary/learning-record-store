// Scientific Method Diagram Interactivity

// Node information with descriptions and physics examples
const nodeInfo = {
    'Start': {
        title: 'Observe Phenomenon or Ask Question',
        description: 'Science begins with curiosity. Scientists observe the natural world and ask questions about what they see. Good questions are specific and testable.',
        example: 'A student notices that a ball rolls farther on a smooth floor than on carpet and asks: "How does surface texture affect the distance a ball rolls?"'
    },
    'Research': {
        title: 'Background Research',
        description: 'Before designing an experiment, scientists review existing knowledge. This includes reading scientific papers, textbooks, and consulting experts to understand what is already known.',
        example: 'The student researches friction, kinetic energy, and discovers that rougher surfaces create more friction, which converts kinetic energy to heat.'
    },
    'Hypothesis': {
        title: 'Formulate Hypothesis',
        description: 'A hypothesis is a testable prediction based on observations and research. It should be specific and include both the independent and dependent variables.',
        example: '"If the surface is smoother, then the ball will roll farther because there is less friction to slow it down."'
    },
    'Design': {
        title: 'Design Experiment',
        description: 'Plan a controlled experiment that tests only one variable at a time. Identify controls, variables, materials needed, and the procedure to follow.',
        example: 'Design: Roll a steel ball from a 30cm ramp onto 5 different surfaces. Measure distance traveled. Use same ball, same ramp height, 3 trials each surface.'
    },
    'Conduct': {
        title: 'Conduct Experiment & Collect Data',
        description: 'Carefully follow the experimental procedure and record all observations and measurements. Use appropriate tools and units. Repeat trials for reliability.',
        example: 'Results recorded: Glass (2.4m), Tile (1.8m), Wood (1.2m), Carpet (0.5m), Sandpaper (0.3m). Each measurement averaged from 3 trials.'
    },
    'Analyze': {
        title: 'Analyze Data',
        description: 'Organize data into tables and graphs. Look for patterns and relationships. Calculate averages, percentages, or other statistics. Identify any anomalies.',
        example: 'Create a bar graph of distance vs. surface type. Calculate that glass allows 8x more distance than sandpaper. Note the inverse relationship between surface roughness and distance.'
    },
    'Decision1': {
        title: 'Does Data Support Hypothesis?',
        description: 'Compare your results to your prediction. Did the data show what you expected? Consider whether your evidence is strong enough to draw conclusions.',
        example: 'The data shows smoother surfaces (glass, tile) allowed greater distances than rough surfaces (carpet, sandpaper). This supports the hypothesis about friction.'
    },
    'Accept': {
        title: 'Accept Hypothesis',
        description: 'If the data consistently supports the hypothesis across multiple trials, the hypothesis is accepted. This doesn\'t mean it\'s proven—just supported by evidence.',
        example: 'Conclusion: The hypothesis is supported. Smoother surfaces reduce friction, allowing the ball to travel farther while retaining more kinetic energy.'
    },
    'Revise': {
        title: 'Revise or Reject Hypothesis',
        description: 'If the data doesn\'t support the hypothesis, this is not failure—it\'s valuable information! Analyze why and form a new, refined hypothesis.',
        example: 'If results were unexpected (e.g., tile performed worse than wood), revise: "Perhaps surface hardness, not just smoothness, affects rolling distance."'
    },
    'Communicate': {
        title: 'Communicate Results',
        description: 'Share findings through lab reports, presentations, or publications. Include methods, data, analysis, and conclusions so others can evaluate and replicate the work.',
        example: 'Write a lab report with: Introduction, Hypothesis, Materials, Procedure, Data Tables, Graphs, Analysis, Conclusion. Present findings to the class.'
    },
    'Decision2': {
        title: 'New Questions Raised?',
        description: 'Good science leads to more questions. Each experiment reveals new aspects to explore. The scientific method is cyclical and ongoing.',
        example: 'New questions emerge: "Does ball mass affect the results?" "What about inclined surfaces?" "How does humidity affect friction?" The cycle continues!'
    },
    'End': {
        title: 'End (Temporary)',
        description: 'A particular investigation may end, but scientific inquiry never truly stops. Today\'s conclusions become tomorrow\'s starting points for new discoveries.',
        example: 'The friction experiment is complete, but the student is now curious about air resistance and plans a new experiment with different shaped objects.'
    }
};

// Default info to show
const defaultInfo = {
    title: 'Scientific Method',
    description: 'Hover over any step in the diagram to learn more about it and see a physics example.',
    example: '<strong>Tip:</strong> Click on any node to keep its information displayed.'
};

let lockedNode = null;

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis'
    }
});

// Update infobox content
function updateInfobox(info) {
    document.getElementById('infoTitle').textContent = info.title;
    document.getElementById('infoDescription').textContent = info.description;

    const exampleBox = document.getElementById('infoExample');
    if (info.example.startsWith('<')) {
        exampleBox.innerHTML = info.example;
    } else {
        exampleBox.innerHTML = `<strong>Physics Example:</strong><p>${info.example}</p>`;
    }
}

// Track current mouse Y position relative to container
let lastMouseY = 0;

// Move infobox to align with node or mouse position
function moveInfoboxToNode(node) {
    const infobox = document.getElementById('infobox');
    const container = document.querySelector('.main-content');
    const containerRect = container.getBoundingClientRect();
    const infoboxHeight = infobox.offsetHeight;

    // Maximum allowed top position to keep infobox visible
    const maxAllowedTop = Math.max(0, containerRect.height - infoboxHeight - 20);

    let offset;

    if (!node) {
        // Use last mouse position when no node is selected
        offset = lastMouseY - 20;
    } else {
        const nodeRect = node.getBoundingClientRect();
        // Calculate offset from top of container
        offset = nodeRect.top - containerRect.top;

        // Check if this is the End node - limit its position
        const nodeText = node.textContent.trim();
        if (nodeText.includes('End')) {
            offset = offset - 100;
        }
    }

    // Keep infobox within reasonable bounds (not below 0, not beyond container)
    let finalOffset = Math.max(0, offset - 20);
    finalOffset = Math.min(finalOffset, maxAllowedTop);

    infobox.style.top = finalOffset + 'px';
}

// Track mouse movement over the diagram and update infobox when no node selected
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.main-content');
    container.addEventListener('mousemove', (e) => {
        const containerRect = container.getBoundingClientRect();
        lastMouseY = e.clientY - containerRect.top;

        // If no node is locked and mouse is not over a node, update infobox position
        if (!lockedNode) {
            // Check if mouse is over a mermaid node
            const hoveredNode = e.target.closest('.mermaid .node');
            if (!hoveredNode) {
                moveInfoboxToNode(null);
            }
        }
    });
});

// Get node key from node element
function getNodeKey(node) {
    const text = node.textContent.trim();

    // Match node text to keys
    if (text.includes('Observe') || text.includes('Ask Question')) return 'Start';
    if (text.includes('Background Research')) return 'Research';
    if (text.includes('Formulate Hypothesis')) return 'Hypothesis';
    if (text.includes('Design Experiment')) return 'Design';
    if (text.includes('Conduct Experiment') || text.includes('Collect Data')) return 'Conduct';
    if (text.includes('Analyze Data')) return 'Analyze';
    if (text.includes('Support') && text.includes('Hypothesis')) return 'Decision1';
    if (text.includes('Accept Hypothesis')) return 'Accept';
    if (text.includes('Revise') || text.includes('Reject')) return 'Revise';
    if (text.includes('Communicate')) return 'Communicate';
    if (text.includes('New Questions')) return 'Decision2';
    if (text.includes('End')) return 'End';

    return null;
}

// Remove highlight from all nodes
function clearHighlights() {
    document.querySelectorAll('.mermaid .node').forEach(n => {
        n.classList.remove('highlighted');
    });
}

// Node interaction
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const nodes = document.querySelectorAll('.mermaid .node');

        nodes.forEach((node) => {
            node.style.cursor = 'pointer';

            // Hover events
            node.addEventListener('mouseenter', () => {
                if (lockedNode) return; // Don't update if a node is locked

                const key = getNodeKey(node);
                if (key && nodeInfo[key]) {
                    updateInfobox(nodeInfo[key]);
                    moveInfoboxToNode(node);
                }
            });

            node.addEventListener('mouseleave', () => {
                if (lockedNode) return; // Don't reset if a node is locked
                updateInfobox(defaultInfo);
                moveInfoboxToNode(null);
            });

            // Click to lock/unlock
            node.addEventListener('click', () => {
                const key = getNodeKey(node);

                if (lockedNode === node) {
                    // Unlock if clicking the same node
                    lockedNode = null;
                    clearHighlights();
                    updateInfobox(defaultInfo);
                    moveInfoboxToNode(null);
                } else {
                    // Lock to this node
                    lockedNode = node;
                    clearHighlights();
                    node.classList.add('highlighted');

                    if (key && nodeInfo[key]) {
                        updateInfobox(nodeInfo[key]);
                        moveInfoboxToNode(node);
                    }
                }
            });
        });
    }, 1000); // Wait for Mermaid to render
});

// Click outside to unlock
document.addEventListener('click', (e) => {
    if (lockedNode && !e.target.closest('.mermaid .node')) {
        lockedNode = null;
        clearHighlights();
        updateInfobox(defaultInfo);
        moveInfoboxToNode(null);
    }
});

// ===========================================================================
// xAPI instrumentation — conforms to docs/specs/xapi-producer-contract-v1.md
// ===========================================================================
//
// WHAT THIS CAN AND CANNOT TELL YOU
// ---------------------------------
// It CANNOT tell you whether a student understands the scientific method.
// Hovering is not knowing. Only `answered` carries `result.success`, which is the
// sole input to attempts/successes and therefore to BKT (contract §3). Every
// statement below is `interacted` or `experienced`, so this sim contributes
// `statements_compressed` at **attempts = 0**, forever, by design.
//
// What it DOES give is engagement evidence: which steps a student studied, for how
// long, in what order, and which they never opened. To measure understanding, this
// diagram needs questions (metadata.json has no `pedagogical.keyQuestions` yet).
//
// PRIOR EXPOSURE (physics / chemistry)
// ------------------------------------
// This sim is embedded by more than one textbook. Its `object.id` is its canonical
// published URL (contract §1), so it is the SAME IRI in every book — only
// `grouping[0]`, the textbook version IRI (§4), differs. Consequence, verified
// against the DDL: every rollup is keyed
// `(district_id, student_key, {concept_id|object_id})` with **no textbook_id**, so a
// physics exposure and a chemistry exposure MERGE into one vertex. The rollup cannot
// distinguish them. `lrs.statements` keeps `textbook_id`/`version_id` per statement,
// so the question "had they already seen this?" is answerable from the log — never
// from ConceptMastery. That is the two-store split working as designed (§6.2 of the
// spec: the log is the system of record; the graph is a compressed projection).
//
// This matters for interpretation: a student who blitzes through because they met the
// scientific method in physics looks IDENTICAL to a student who did not care. Low
// engagement here is not evidence of low mastery. Do not read it as such without
// checking the log for prior statements under a different textbook_id.
//
// Like the other sims, this never POSTs — statements render in the panel below.

(function () {
  'use strict';

  // Canonical published page IRI — contract §1: site_url + nav path + trailing slash.
  var ACTIVITY_BASE_ID = 'https://dmccreary.github.io/learning-record-store/sims/scientific-method/';
  // The textbook version IRI (§4) — NOT this page's URL. Physics/chemistry would send
  // their own here while `object.id` above stays identical. That difference is the only
  // thing distinguishing the exposures, and only in the log.
  var VERSION_IRI = 'https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0';

  // A mouse crossing a tall top-down diagram passes over many nodes in a few hundred ms.
  // None of that is evidence. Only a deliberate pause is. Same instinct as the bouncing
  // ball's sub-250ms mis-click filter and sine-wave's slider deadband: not all
  // interaction is evidence.
  var HOVER_EVIDENCE_MS = 600;

  // 12 nodes -> 9 concepts (metadata.json `concepts`). Several nodes share a concept:
  // the concept rollup's grain is (student, concept), so Decision1/Accept/Revise all
  // compress into one `hypothesis-testing` vertex. That is the grain doing its job.
  var NODE_CONCEPT = {
    Start:       'scientific-observation',
    Research:    'background-research',
    Hypothesis:  'hypothesis-formation',
    Design:      'experimental-design',
    Conduct:     'data-collection',
    Analyze:     'data-analysis',
    Decision1:   'hypothesis-testing',
    Accept:      'hypothesis-testing',
    Revise:      'hypothesis-testing',
    Communicate: 'scientific-communication',
    Decision2:   'iterative-investigation',
    End:         'iterative-investigation'
  };

  var statementCount = 0;
  var pageShownAt = Date.now();
  var pageClosed = false;

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.floor(Math.random() * 16);
      return (c === 'x' ? r : (r % 4) + 8).toString(16);
    });
  }

  function isoDuration(ms) {
    var t = ms / 1000, h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
    var s = Math.round((t % 60) * 100) / 100, out = 'PT';
    if (h) out += h + 'H';
    if (m) out += m + 'M';
    return out + s + 'S';
  }

  function base(verbId, verbDisplay) {
    return {
      id: uuid(),
      actor: {
        objectType: 'Agent',
        name: 'demo-student',
        account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
      },
      verb: { id: 'http://adlnet.gov/expapi/verbs/' + verbId, display: { 'en-US': verbDisplay } },
      timestamp: new Date().toISOString()
    };
  }

  // --- page-level dwell -----------------------------------------------------------
  // The degenerate case for a mostly-static diagram: no Start/Pause control exists, so
  // the interval is simply time-on-page. Flushed on tab-hide, exactly as contract §7
  // requires — start-it-and-close-the-tab is the common case, not the edge case.
  function closePageInterval(reason) {
    if (pageClosed) return;
    pageClosed = true;
    var elapsed = Date.now() - pageShownAt;
    if (elapsed < 1000) return; // a glance is not engagement

    var st = base('experienced', 'experienced');
    st.object = {
      objectType: 'Activity',
      id: ACTIVITY_BASE_ID,                      // page IRI, no fragment -> one PageEngagement row
      definition: {
        name: { 'en-US': 'Scientific Method Workflow' },
        type: 'http://adlnet.gov/expapi/activities/simulation'   // -> object_type MicroSim (§5)
      }
    };
    st.result = {
      duration: isoDuration(elapsed),            // the only field feeding dwell_ms_total
      extensions: { 'https://w3id.org/lrs/ext/run-ended-by': reason }
    };
    st.context = {
      contextActivities: { grouping: [{ id: VERSION_IRI }] },
      extensions: { 'https://w3id.org/lrs/ext/concept_id': 'iterative-investigation' }
    };
    publish(st, 'experienced  page  ' + st.result.duration + '  (' + reason + ')');
  }

  // --- per-node study -------------------------------------------------------------
  function emitNodeStudy(key, dwellMs, mode) {
    var concept = NODE_CONCEPT[key];
    if (!concept) return;

    var st = base('interacted', 'interacted');   // not `answered`: no success, no knowledge claim
    st.object = {
      objectType: 'Activity',
      // Fragment names the node by its stable KEY, not its position. Reordering the
      // diagram must not re-point the IRI at a different step. (Contract §2 defines
      // `#q{N}` for numbered questions only; a named sub-activity uses its name.)
      id: ACTIVITY_BASE_ID + '#' + key.toLowerCase(),
      definition: {
        name: { 'en-US': (nodeInfo[key] && nodeInfo[key].title) || key },
        // -> object_type 'Control' (§5). Deliberately NOT MicroSim: this IRI carries a
        // fragment and mv_student_page_rollup GROUPs BY object_id, so a MicroSim-typed
        // node would become its own PageEngagement vertex — 12 of them for one page.
        type: 'http://adlnet.gov/expapi/activities/interaction'
      }
    };
    st.result = {
      // NOTE: duration on a Control reaches no rollup. mv_student_page_rollup sums
      // duration_ms but excludes Control; mv_student_concept_rollup ignores duration
      // entirely. Per-node dwell lives in lrs.statements only. Kept because it is the
      // signal a teacher would actually want ("which step did they labour over?") and
      // because the log is the system of record — a rollup can be added later without
      // re-collecting it.
      duration: isoDuration(dwellMs),
      extensions: {
        // 'hover' = transient attention (>600ms, so not a mouse crossing the diagram).
        // 'pinned' = the student clicked to lock the infobox — unambiguous intent.
        // Same object, materially different strength of evidence.
        'https://w3id.org/lrs/ext/engagement-mode': mode
      }
    };
    st.context = {
      contextActivities: {
        grouping: [{ id: VERSION_IRI }],
        parent: [{ id: ACTIVITY_BASE_ID }]
      },
      // Without this the statement is skipped entirely by mv_student_concept_rollup's
      // own WHERE notEmpty(concept_ids) — it would reach nothing.
      extensions: { 'https://w3id.org/lrs/ext/concept_id': concept }
    };
    publish(st, 'interacted   ' + key.toLowerCase() + '  ' + isoDuration(dwellMs) +
                '  [' + mode + ']  -> ' + concept);
  }

  // --- output panel ---------------------------------------------------------------
  function panel() {
    var el = document.getElementById('xapi-log');
    if (el) return el;
    var wrap = document.createElement('div');
    wrap.className = 'xapi-panel';
    wrap.innerHTML =
      '<div class="xapi-panel-header"><strong>xAPI statements emitted:</strong> ' +
      '<span id="stmt-count">0</span><span class="xapi-header-note"> &mdash; pause on a step ' +
      'for &gt;0.6s, or click to pin it. Engagement only: no statement here claims the ' +
      'student understands anything. Nothing is sent to a server.</span></div>' +
      '<div id="xapi-log" class="xapi-log"></div>';
    // Append INSIDE .main-content (the flex row) and let CSS wrap it onto its own full
    // row via `flex: 1 0 100%`. Two placements that do NOT work:
    //   - a plain third flex column: it becomes a narrow column clipped at the edge;
    //   - a sibling after .main-content: `.container` has no width rule, so a block
    //     child collapses to its padding (~26px). Only .main-content's flex children
    //     get a usable width here.
    var mc = document.querySelector('.main-content');
    (mc || document.body).appendChild(wrap);
    return document.getElementById('xapi-log');
  }

  function publish(st, summary) {
    statementCount++;
    var log = panel();
    var a = document.createElement('div');
    a.className = 'xapi-log-line';
    a.textContent = '▸ ' + summary;
    log.appendChild(a);
    var b = document.createElement('div');
    b.className = 'xapi-log-line xapi-log-raw';
    b.textContent = JSON.stringify(st);
    log.appendChild(b);
    while (log.childElementCount > 80) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
    var c = document.getElementById('stmt-count');
    if (c) c.textContent = String(statementCount);
  }

  // --- wire up --------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      var nodes = document.querySelectorAll('.mermaid .node');
      if (!nodes.length) return;
      panel();

      nodes.forEach(function (node) {
        var enteredAt = null;

        node.addEventListener('mouseenter', function () { enteredAt = Date.now(); });

        node.addEventListener('mouseleave', function () {
          if (enteredAt === null) return;
          var dwell = Date.now() - enteredAt;
          enteredAt = null;
          var key = getNodeKey(node);
          if (key && dwell >= HOVER_EVIDENCE_MS) emitNodeStudy(key, dwell, 'hover');
        });

        // Pinning is deliberate, so it always counts regardless of dwell.
        node.addEventListener('click', function () {
          var key = getNodeKey(node);
          // getNodeKey works off text; lockedNode is set by the sim's own click handler,
          // which was registered first and therefore runs first. If this node just became
          // locked, the student pinned it. (Clicking a pinned node UNLOCKS it — lockedNode
          // is then null, so unpinning correctly emits nothing.)
          if (key && lockedNode === node) {
            emitNodeStudy(key, Date.now() - (enteredAt || Date.now()), 'pinned');
            // Close the hover interval WITHOUT emitting. A pin and a hover on the same
            // visit are one engagement with one node, not two: pinning is simply the
            // stronger evidence for it. Emitting both double-counts that node in
            // mv_student_concept_rollup's statements_compressed and inflates C-6 with
            // duplicates of a single act.
            //
            // An earlier version set `enteredAt = Date.now()` here and claimed it
            // prevented the double-count. It did not — restarting the clock only delays
            // the hover, so any linger past HOVER_EVIDENCE_MS still fired a second
            // statement. Clicking all 12 nodes produced 24 statements. `null` is what
            // actually suppresses it: mouseleave returns early when enteredAt is null.
            // Re-entering the node later starts a fresh interval, which is correct — that
            // is a genuinely separate visit.
            enteredAt = null;
          }
        });
      });
    }, 1200); // after Mermaid renders (the sim's own handlers use 1000)

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') closePageInterval('tab-hidden');
    });
  });
})();
