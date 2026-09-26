// xapi.js — xAPI instrumentation for the xAPI Statement Building Blocks diagram.
//
// Conforms to docs/specs/xapi-producer-contract-v1.md through the shared runtime
// (docs/js/lrs-sim.js). Full vs. Compact and the teaching panel come from config (this
// sim's metadata.json `xapi` block, over the book's lrs-config.js), never from this file.
//
// This diagram teaches the five parts of a Statement, so it is a TEACHING sim: clicking a
// part emits a real Statement that has those same five parts, and the log shows it.
//
// script.js is the generic microsim-generator Mermaid click-to-pin template, so it is not
// edited. This file loads after it and wraps its global setupNodeInteractions(), which
// waitForMermaid() looks up by name only once Mermaid has rendered the nodes.
//
// WHAT IS EVIDENCE HERE
//   click a part (Actor, Verb, Object, Result, Context)  -> interacted, Control #<part>,
//        engagement-mode "click". The designed act ("Click a labeled part…"). Clicking the
//        part that is already selected is still a deliberate click, so it counts too.
//   time on the page                                   -> experienced, the page (MicroSim),
//        on focus loss, if >= 1 s (pageDwell; the diagram has no Start/Pause).
//   click empty space (clears the Details box)         -> nothing. Not evidence.
//   hover a part                                       -> nothing. Only a CSS highlight; the
//        sim wires no hover behaviour, so hover is not the designed act here.
//
// WHAT IT CANNOT TELL YOU: whether the student knows what an Actor is. Every statement is
// `interacted` or `experienced`; only `answered` carries result.success, so this diagram
// adds exposure evidence (attempts = 0), never mastery.

(function () {
  'use strict';
  if (!window.LRSSim) return;   // the diagram works without the xAPI runtime; it emits nothing

  // Mermaid node id (from main.html) -> learning-graph ConceptID (docs/learning-graph).
  // All five are Chapter 1 concepts. Object also shows its Activity Type ("quiz", concept
  // 12), but one statement carries one concept (contract §6), and the node is the Object.
  var NODE_CONCEPT = { Actor: 9, Verb: 10, Object: 11, Result: 13, Context: 14 };
  var PAGE_CONCEPT = 15;        // Statement: the whole the five parts make up

  var lrs = LRSSim.create({
    name: 'xAPI Statement Building Blocks',
    concept: LRS.conceptId(PAGE_CONCEPT),
    source: 'the xAPI Statement Building Blocks MicroSim',
    pageDwell: true,            // no Start/Pause: the dwell interval is time on the page
    mount: 'body',              // below the diagram + Details row; style.css places it
    modeText: function (compact) {
      return 'Click a part to emit a statement, then find that part in it. ' + (compact
        ? 'COMPACT (LRS-Lite): your clicks are folded into ONE summary, emitted when the ' +
          'diagram loses focus. Press Simulate Done to see it.'
        : 'FULL (full LRS): one statement per click, plus your time on the page when the ' +
          'diagram loses focus.');
    }
  });

  var parts = {};
  function part(nodeId) {
    if (!parts[nodeId]) {
      var n = NODE_CONCEPT[nodeId];
      if (n === undefined) {
        console.warn('[xapi-statement-triple] no concept mapped for node "' + nodeId +
                     '" — its statements will reach no concept rollup (contract §6)');
      }
      parts[nodeId] = lrs.item(LRS.slug(nodeId), {
        name: (nodeInfo[nodeId] && nodeInfo[nodeId].title) || nodeId,
        concept: n === undefined ? undefined : LRS.conceptId(n)
      });
    }
    return parts[nodeId];
  }

  var wired = false;
  function wire() {
    if (wired) return;
    wired = true;
    document.querySelectorAll('.mermaid .node').forEach(function (node) {
      var id = extractNodeId(node);
      if (typeof nodeInfo === 'undefined' || !nodeInfo[id]) return;   // not a clickable part
      // On the node itself: the template's handler calls stopPropagation(), so a bubbling
      // listener higher up would never see this click. Registered after the sim's, so the
      // Details box has already changed when this runs.
      node.addEventListener('click', function () { part(id).study('click'); });
    });

    // Teaching note, not a statement: clearing the Details box is deliberately not evidence.
    // Capture phase, so the sim's own clear (a bubbling listener) has not run yet.
    var panel = document.querySelector('.diagram-panel');
    if (panel) {
      panel.addEventListener('click', function (e) {
        var hit = e.target.closest && e.target.closest('.node');
        if (hit && typeof nodeInfo !== 'undefined' && nodeInfo[extractNodeId(hit)]) return;  // a part
        if (document.querySelector('.mermaid .node.node-selected')) {
          lrs.note('selection cleared — not evidence, so nothing is emitted');
        }
      }, true);
    }
  }

  var origSetup = window.setupNodeInteractions;
  window.setupNodeInteractions = function () { origSetup(); wire(); };
})();
