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

    // Keep the infobox beside the DIAGRAM. .main-content also holds the xAPI panel, so
    // clamping to its full height would let the infobox slide down over the log.
    const diagram = document.getElementById('diagramContainer');
    const limitBottom = diagram ? diagram.getBoundingClientRect().bottom - containerRect.top
                                : containerRect.height;
    const maxAllowedTop = Math.max(0, limitBottom - infoboxHeight - 20);

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
        // Working the xAPI panel's controls must not drag the infobox around.
        if (e.target.closest('.xapi-panel')) return;
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
    // Pressing Simulate Done, switching modes, or clicking a log line keeps the pin.
    if (e.target.closest('.xapi-panel')) return;
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
  if (!window.LRSSim) return;   // the diagram works without the xAPI runtime; it just emits nothing

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

  // Through the shared runtime (docs/js/lrs-sim.js): Full vs. Compact comes from config (this
  // sim's metadata.json `xapi` block, over the book's lrs-config.js), and so does the teaching
  // UI — the statement log with its Full/Compact switch, Simulate Done, and View Formatted JSON.
  var lrs = LRSSim.create({
    name: 'Scientific Method Workflow',
    concept: 'iterative-investigation',
    source: 'the Scientific Method MicroSim',
    // No Start/Pause control, so the dwell interval is simply time on the page: one
    // `experienced` per visit in Full mode, carried by the session summary in Compact.
    pageDwell: true,
    // Inside .main-content, the flex row; style.css gives the panel its own full-width row.
    mount: '.main-content',
    modeText: function (compact) {
      return 'Pause on a step for >0.6s, or click to pin it. ' + (compact
        ? 'COMPACT (LRS-Lite): studies are folded into ONE summary, emitted when the diagram ' +
          'loses focus. Press Simulate Done to see it.'
        : 'FULL (full LRS): one statement per step studied, plus the page dwell when the ' +
          'diagram loses focus.') +
        ' Engagement only: no statement here claims the student understands anything.';
    }
  });

  // One inspection handle per step. The fragment names the node by its stable KEY, not its
  // position (contract §2): reordering the diagram must not re-point an IRI at another step.
  var steps = {};
  Object.keys(NODE_CONCEPT).forEach(function (key) {
    steps[key] = lrs.item(key.toLowerCase(), {
      name: (nodeInfo[key] && nodeInfo[key].title) || key,
      concept: NODE_CONCEPT[key]
    });
  });

  // --- wire up --------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      var nodes = document.querySelectorAll('.mermaid .node');

      nodes.forEach(function (node) {
        var enteredAt = null;

        node.addEventListener('mouseenter', function () { enteredAt = Date.now(); });

        // A mouse crossing a tall top-down diagram passes over many nodes in a few hundred
        // ms. None of that is evidence; only a deliberate pause is (LRSSim.HOVER_MS).
        node.addEventListener('mouseleave', function () {
          if (enteredAt === null) return;
          var dwell = Date.now() - enteredAt;
          enteredAt = null;
          var key = getNodeKey(node);
          if (key && dwell >= LRSSim.HOVER_MS) steps[key].study('hover', dwell);
        });

        // Pinning is deliberate, so it always counts regardless of dwell.
        node.addEventListener('click', function () {
          var key = getNodeKey(node);
          // getNodeKey works off text; lockedNode is set by the sim's own click handler,
          // which was registered first and therefore runs first. If this node just became
          // locked, the student pinned it. (Clicking a pinned node UNLOCKS it — lockedNode
          // is then null, so unpinning correctly emits nothing.)
          if (key && lockedNode === node) {
            steps[key].study('pinned', Date.now() - (enteredAt || Date.now()));
            // Close the hover interval WITHOUT reporting it. A pin and a hover on the same
            // visit are one engagement with one node, not two: pinning is simply the
            // stronger evidence for it. Reporting both double-counts that node in
            // mv_student_concept_rollup's statements_compressed.
            //
            // `null`, not `Date.now()`: restarting the clock only delays the hover, so any
            // linger past the threshold still fired a second statement (clicking all 12
            // nodes once produced 24). mouseleave returns early on null; re-entering the
            // node later starts a fresh, genuinely separate visit.
            enteredAt = null;
          }
        });
      });
    }, 1200); // after Mermaid renders (the sim's own handlers use 1000)
  });
})();
