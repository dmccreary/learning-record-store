// xapi.js — xAPI instrumentation for the Animal Cell interactive diagram.
//
// Conforms to docs/specs/xapi-producer-contract-v1.md, through the shared runtime
// (docs/js/lrs-sim.js). Full vs. Compact and the teaching UI come from config — this sim's
// metadata.json `xapi` block, over the book's lrs-config.js — never from this file.
//
// IT DOES NOT FORK diagram.js.
// ---------------------------
// docs/sims/shared-libs/diagram.js is vendored verbatim from ../biology and is shared by
// many sims in that repo. Editing it to add telemetry would fork a shared library and
// guarantee a painful re-sync. Instead this file wraps three of the sim's methods and
// adds its own DOM listeners alongside the sim's. That works because diagram.js assigns
// handlers as PROPERTIES (`btn.onclick = ...`), so addEventListener listeners coexist
// with them rather than replacing them.
//
// It loads after diagram.js, so `sim` already exists at parse time — the wrappers are
// installed synchronously, strictly before DOMContentLoaded fires sim.init(). There is
// no race to lose.
//
// WHAT IS NEW HERE, RELATIVE TO EVERY OTHER EMITTER IN THIS REPO
// --------------------------------------------------------------
// 1. TWO EVIDENCE CLASSES FROM ONE ARTIFACT. Explore mode inspects hotspots (`interacted`,
//    Control); quiz mode answers questions (`answered`, Question).
// 2. A BKT SEQUENCE. The quiz lets a student retry until correct, so one question yields
//    fail, fail, …, success against ONE IRI. See the quiz section.
// 3. BOTH COMPACT BEHAVIOURS ON ONE PAGE. In Compact mode the explore inspections fold into
//    the session summary, but the quiz answers pass through as they happen — answers are
//    never folded (Dan, 2026-09-26).
//
// WHAT IT STILL CANNOT DO: explore mode cannot measure understanding. Only `answered`
// carries result.success. Quiz mode is where this diagram earns a mastery signal.

(function () {
  'use strict';
  if (!window.LRSSim) return;   // the diagram works without the xAPI runtime; it just emits nothing

  // Six callouts -> six concepts, plus a page-level concept for dwell.
  //
  // WHY THIS MAP IS HERE AND NOT IN data.json — the co-location argument loses to the
  // silent-failure one. data.json is vendored byte-identical from ../biology, which owns
  // this sim. A concept field added there would be destroyed by the next re-sync, and the
  // failure would be SILENT: no concept_id means mv_student_concept_rollup's own
  // `WHERE notEmpty(concept_ids)` drops the statement entirely, so the sim would keep
  // emitting, keep logging, and quietly stop producing concept evidence. Keeping the map
  // in a file upstream does not have means a re-sync cannot break it, and the warning
  // below makes the remaining failure mode (a callout added upstream) loud instead.
  var CONCEPT = {
    'Nucleus':               'cell-nucleus',
    'Cell membrane':         'cell-membrane',
    'Mitochondria':          'mitochondria',
    'Endoplasmic reticulum': 'endoplasmic-reticulum',
    'Ribosomes':             'ribosomes',
    'Cytoplasm':             'cytoplasm'
  };
  var PAGE_CONCEPT = 'animal-cell-structure';

  var lrs = LRSSim.create({
    name: 'Animal Cell',
    concept: PAGE_CONCEPT,
    source: 'the Animal Cell MicroSim',
    // No Start/Pause control, so the dwell interval is simply time on the page (contract §7).
    pageDwell: true,
    mount: 'body',
    modeText: function (compact) {
      return 'Explore a structure (hover >0.6s or click) to emit interacted; answer in Quiz ' +
        'mode to emit answered. ' + (compact
          ? 'COMPACT (LRS-Lite): inspections fold into ONE summary, emitted when the sim ' +
            'loses focus — but every quiz answer is still sent as it happens.'
          : 'FULL (full LRS): every inspection and every answer is its own statement.');
    }
  });

  function conceptFor(callout) {
    var c = CONCEPT[callout.label];
    if (!c) {
      // Loud, because the alternative is silent. An unmapped callout still renders and
      // still emits — it just reaches no concept rollup, forever, with no symptom.
      console.warn('[animal-cell] no concept mapped for callout "' + callout.label +
                   '" — its statements will reach no concept rollup (contract §6)');
    }
    return c;
  }

  // ── Object identity ───────────────────────────────────────────────────────
  //
  // Does a hotspot's object_type depend on the mode it is clicked in? NO (contract §5, "one
  // object, one type"): they are two objects, because they ARE two things.
  //
  //   explore  .../sims/animal-cell/#nucleus     Control   the hotspot — "show me this"
  //   quiz     .../sims/animal-cell/#q-nucleus   Question  the question — "where is this?"
  //
  // They re-converge at the concept rollup: both carry concept_id `cell-nucleus`.
  //
  // WHY `#q-nucleus` AND NOT `#q{N}`: diagram.js reshuffles the quiz on every load, so `#q1`
  // is the nucleus for one student and the cytoplasm for the next. An ordinal is only an
  // identity when the order is stable (contract §2); here the question's identity is what it
  // asks about, so it is named.
  var hotspots = {}, questions = {};

  function hotspot(callout) {
    var key = LRS.slug(callout.label);
    return hotspots[key] ||
      (hotspots[key] = lrs.item(key, { name: callout.label, concept: conceptFor(callout) }));
  }

  function question(callout) {
    var key = 'q-' + LRS.slug(callout.label);
    return questions[key] || (questions[key] =
      lrs.question(key, { name: 'Identify the ' + callout.label, concept: conceptFor(callout) }));
  }

  // ── Explore mode ──────────────────────────────────────────────────────────
  //
  // HOVER AND CLICK ARE THE SAME ACT HERE. diagram.js wires both to showInfobox(); there is
  // no pin. Click does not mean "I am more interested" — it means "I am on a touchscreen",
  // where hover does not exist and a tap is the ONLY way to read the infobox. Demoting hover
  // would count tablet users and discard laptop users for the identical act — and in schools
  // device correlates with funding, so that would be systematic bias, not noise.
  //
  // So: ONE inspection, either input path. `engagement-mode` still records which path, but
  // it is an INPUT-DEVICE fact, not an evidence-strength fact. The general rule: weight
  // hover against click only where clicking is a SEPARATE DESIGNED ACT (scientific-method's
  // pin). Where click is merely the touch fallback for hover, they are one act.
  function inspect(callout, dwellMs, mode) {
    if (!conceptFor(callout)) return;
    hotspot(callout).study(mode, dwellMs);
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────
  //
  // EVERY ATTEMPT IS EMITTED, and in both modes it is emitted as it happens. diagram.js's
  // handleAnswer() locks only on a CORRECT answer, so one question naturally yields fail,
  // fail, success against ONE IRI.
  //
  // Emitting the failures is the honest choice, not the noisy one. With six hotspots a
  // student can brute-force: click every marker and the last one is necessarily right. If
  // only the success were emitted, that student would look identical to one who knew it
  // instantly. The full sequence yields attempts = 6, successes = 1, which BKT's guess
  // parameter exists to read. For a click-to-identify quiz the sequence IS the signal —
  // which is exactly why answers are never folded into a compact summary.
  var questionShownAt = null;
  var lastAttemptAt   = null;
  var attemptNo       = 0;

  function answer(clicked, target, correct) {
    if (!conceptFor(target)) return;
    attemptNo++;
    var now = Date.now();
    // Per-ATTEMPT time, not time-since-question: for attempt 1 they are the same, and for
    // later attempts this answers "how long did this attempt take" and still sums to the
    // total. Informational either way — Question duration reaches no rollup (§12 item 9).
    var since = now - (lastAttemptAt || questionShownAt || now);
    lastAttemptAt = now;

    question(target).answer({
      success: correct,
      // What they actually clicked. On a wrong answer this is the useful part: clicking the
      // cytoplasm when asked for the cell membrane is a different error from clicking the
      // nucleus, and only `response` preserves which.
      response: LRS.slug(clicked.label),
      durationMs: since,
      extensions: { 'attempt-number': attemptNo }
    });
  }

  // ── Wrap the sim ──────────────────────────────────────────────────────────
  // `sim` is diagram.js's top-level `const`, so it is already bound here. Wrapping is
  // what keeps diagram.js unforked.

  var origSetMode          = sim.setMode.bind(sim);
  var origInitExplore      = sim.initExplore.bind(sim);
  var origShowNextQuestion = sim.showNextQuestion.bind(sim);
  var origHandleAnswer     = sim.handleAnswer.bind(sim);

  sim.setMode = function (newMode) {
    origSetMode(newMode);
    // Mode switches abandon whatever question was pending. Reset so a stale clock cannot
    // attach itself to the next one.
    questionShownAt = null;
    lastAttemptAt   = null;
    attemptNo       = 0;
    lrs.note('mode: ' + newMode + (newMode === 'quiz'
      ? ' — every attempt is emitted as it happens, wrong ones included (that sequence is the signal)'
      : ' — inspecting a structure emits `interacted`, which claims no knowledge'));
  };

  sim.showNextQuestion = function () {
    origShowNextQuestion();
    // showNextQuestion() calls showQuizComplete() when the queue is exhausted; there is no
    // question on screen then, so do not start a clock for one.
    if (sim.quizIndex < sim.quizQueue.length) {
      questionShownAt = Date.now();
      lastAttemptAt   = null;
      attemptNo       = 0;
    }
  };

  sim.handleAnswer = function (clicked, target) {
    // Replicate diagram.js's own guard BEFORE calling through. After a correct answer it
    // sets quizLocked and waits 1800ms before advancing; clicks in that window are ignored
    // by the sim and must be ignored here too, or they would answer a finished question.
    if (sim.quizLocked) return origHandleAnswer(clicked, target);

    var correct = clicked.id === target.id;
    origHandleAnswer(clicked, target);
    answer(clicked, target, correct);
  };

  // Explore listeners are attached once, on the first initExplore(), and then persist —
  // setMode() nulls the sim's `on*` PROPERTIES but cannot remove addEventListener
  // listeners. So they must branch on sim.mode themselves rather than assume explore.
  var wired = false;

  sim.initExplore = function () {
    origInitExplore();
    if (wired) return;
    wired = true;

    sim.data.callouts.forEach(function (callout) {
      // Marker and label row are two ways to inspect ONE structure, so the interval is
      // tracked per callout, not per element. Moving from the marker to its label is one
      // continuous inspection and must not emit twice.
      var enteredAt = null;

      var enter = function () {
        if (sim.mode !== 'explore') return;
        if (enteredAt === null) enteredAt = Date.now();
      };

      // A mouse crossing the label list passes over all six rows in a few hundred ms. None
      // of that is evidence; only a deliberate pause is (LRSSim.HOVER_MS).
      var leave = function () {
        if (sim.mode !== 'explore' || enteredAt === null) return;
        var dwell = Date.now() - enteredAt;
        enteredAt = null;
        if (dwell >= LRSSim.HOVER_MS) inspect(callout, dwell, 'hover');
      };

      var click = function () {
        if (sim.mode !== 'explore') return;   // in quiz mode the marker is an answer
        var dwell = enteredAt ? Date.now() - enteredAt : 0;
        // Suppress the in-flight hover rather than letting it fire on leave: a hover and a
        // click on ONE visit are one engagement. `null` is what suppresses it, because
        // leave() returns early; re-entering later starts a genuinely separate visit.
        enteredAt = null;
        inspect(callout, dwell, 'click');
      };

      [sim.markers.get(callout.id), sim.labelRows.get(callout.id)].forEach(function (el) {
        if (!el) return;
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointerleave', leave);
        el.addEventListener('click', click);
      });
    });
  };
})();
