// xapi.js — xAPI instrumentation for the Animal Cell interactive diagram.
//
// Conforms to docs/specs/xapi-producer-contract-v1.md. Consumes docs/js/lrs-xapi.js
// rather than re-implementing it — this is the first emitter to do so, and the reason
// that module exists (four prior copies had already drifted apart; see its header).
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
// 1. TWO VERB FAMILIES FROM ONE ARTIFACT. Explore mode emits `interacted`/Control;
//    quiz mode emits `answered`/Question. Nothing else in the repo does both.
// 2. THE FIRST BKT SEQUENCE. The quiz lets a student retry until correct, so one
//    question yields fail,fail,…,success against ONE IRI. Contract §12 item 6 records
//    that nothing produced a sequence; this does. See emitAnswer().
// 3. REAL CARDINALITY. Six hotspots × two modes = twelve fragment IRIs on one page,
//    against bouncing-ball's single `#speed-slider`.
//
// WHAT IT STILL CANNOT DO: explore mode cannot measure understanding. Only `answered`
// carries result.success. Every explore statement contributes attempts = 0, by design.
// Quiz mode is where this diagram earns a mastery signal.

(function () {
  'use strict';

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

  // A mouse crossing the label list passes over all six rows in a few hundred ms, and a
  // mouse travelling to the controls crosses markers on the way. None of that is
  // evidence; only a deliberate pause is. Same family as the bouncing ball's sub-250ms
  // mis-click filter, sine-wave's slider deadband, and scientific-method's hover gate:
  // not all interaction is evidence, and each interaction CLASS needs its own answer to
  // "what here is real?"
  var HOVER_EVIDENCE_MS = 600;

  var lrs = LRS.emitter({
    mount: 'body',
    note: 'explore a structure (hover &gt;0.6s or click) to emit <code>interacted</code>; ' +
          'answer in Quiz mode to emit <code>answered</code>. Nothing is sent to a server.'
  });

  var PAGE_IRI = lrs.iri;

  // ── Object identity ───────────────────────────────────────────────────────
  //
  // THE CONTRACT QUESTION THIS SIM WAS BUILT TO ANSWER (TODO.md ranked item 3):
  //   "does a hotspot's object_type depend on the mode it is clicked in?"
  //
  // NO. object_type is a property of the OBJECT, not of the mode the student was in.
  // A mode-dependent type would mean one IRI denotes a Control on Monday and a Question
  // on Tuesday, and every reader of a statement would have to know the emitter's UI state
  // before they could interpret it. That is the same defect §1 rejects for main.html
  // (one activity, two identities) arriving from the other direction: two activities,
  // one identity.
  //
  // So they are two objects, because they ARE two things:
  //
  //   explore  .../sims/animal-cell/#nucleus     Control   the hotspot — "show me this"
  //   quiz     .../sims/animal-cell/#q-nucleus   Question  the question — "where is this?"
  //
  // Inspecting the nucleus and being asked to find the nucleus are different activities
  // that happen to share a pixel. They correctly re-converge at the concept rollup, whose
  // grain is (student, concept) and which applies no type filter — both carry
  // concept_id `cell-nucleus`, so both count as evidence about the nucleus. That is the
  // grain doing its job, and it is why splitting the IRI costs nothing.
  function hotspotIri(callout) { return PAGE_IRI + '#' + LRS.slug(callout.label); }

  // WHY NOT `#q{N}` — AND THIS IS A REAL CONTRACT DEFECT, NOT A LOCAL PREFERENCE.
  //
  // Contract §2 pins a question's IRI to its ONE-BASED ORDINAL as presented to the
  // student. This quiz breaks that rule, and the break is not fixable by renumbering:
  //
  //     initQuiz() { this.quizQueue = [...this.data.callouts].sort(() => Math.random() - 0.5); }
  //
  // The order is RESHUFFLED ON EVERY LOAD. `#q1` is the nucleus for one student and the
  // cytoplasm for the next, so mv_student_question_rollup — `GROUP BY object_id` — would
  // merge answers about six different structures into six meaningless rows. Worse than
  // useless: it looks like data.
  //
  // §2's own test catches this exactly: "would an edit that does not change what the
  // thing IS change its IRI?" Here a PAGE RELOAD does. So the ordinal is not this
  // question's stable identity — what it asks about is. That falls under §2's OTHER rule,
  // for named sub-activities: name it, do not number it.
  //
  // The `q-` prefix keeps questions visibly in the `#q…` family while naming by identity.
  // §2 needs amending to say the ordinal rule holds only when presentation order is
  // stable; this is written up in the spec and in TODO.md.
  function questionIri(callout) { return PAGE_IRI + '#q-' + LRS.slug(callout.label); }

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

  // ── Page dwell (contract §7) ──────────────────────────────────────────────
  //
  // The degenerate case of §7: this sim has no Start/Pause control, so the run interval
  // is simply time-on-page. Flushed on tab-hide because start-it-and-close-the-tab is the
  // common case, not the edge case — and visibilitychange, not beforeunload, is the only
  // one that fires reliably on mobile Safari.
  var pageShownAt = Date.now();
  var pageClosed  = false;

  function closePageInterval(reason) {
    if (pageClosed) return;
    pageClosed = true;

    var elapsed = Date.now() - pageShownAt;
    if (elapsed < 1000) return; // a glance is not engagement

    lrs.emit({
      verb: 'experienced',
      object: {
        // The page IRI with NO fragment -> exactly one PageEngagement row (§7).
        iri: PAGE_IRI,
        name: 'Animal Cell',
        type: 'MicroSim'
      },
      result: {
        durationMs: elapsed,               // the only field feeding dwell_ms_total
        extensions: { 'run-ended-by': reason }
      },
      concept: PAGE_CONCEPT
    }, 'experienced  page  ' + LRS.isoDuration(elapsed) + '  (' + reason + ')');
  }

  // ── Explore mode ──────────────────────────────────────────────────────────
  //
  // HOVER AND CLICK ARE THE SAME ACT HERE, AND THAT CHANGES THE RIGHT ANSWER.
  //
  // TODO.md carries an open design question — should an emitter track hover AND click? —
  // whose candidate middle path is "drop concept_id from hover statements only, so hover
  // lands in the log but only pins count as concept evidence."
  //
  // THAT MIDDLE PATH IS WRONG FOR THIS SIM, and working out why sharpens the rule.
  //
  // In scientific-method, hover and click are DIFFERENT acts: hovering previews, clicking
  // PINS the infobox. Pinning is deliberate intent, so it is genuinely stronger evidence
  // and demoting hover is defensible.
  //
  // Here, diagram.js wires both to the same function:
  //
  //     btn.onpointerenter = activate;              // -> showInfobox(callout)
  //     btn.onclick        = () => this.showInfobox(callout);
  //
  // There is no pin. Click does not mean "I am more interested" — it means "I am on a
  // touchscreen", where hover does not exist and a tap is the ONLY way to read the
  // infobox at all. Demoting hover would therefore not filter weak evidence; it would
  // count tablet users and discard laptop users for the identical act. That is the same
  // device-correlated bias TODO.md warns about, inverted — and in schools device
  // correlates with funding, so it is systematic bias, not noise that averages out.
  //
  // So: ONE statement per inspection, either input path, both carrying concept_id.
  // `engagement-mode` still records which path, because it is cheap and the log is the
  // system of record — but it is an INPUT-DEVICE fact, not an evidence-strength fact, and
  // nothing downstream should weight on it.
  //
  // The generalisable rule, which is stronger than "hover is bad": weight hover against
  // click only where clicking is a SEPARATE DESIGNED ACT. Where click is merely the touch
  // fallback for hover, they are one act and must be counted once, together.
  function emitInspect(callout, dwellMs, mode) {
    var concept = conceptFor(callout);
    if (!concept) return;

    lrs.emit({
      verb: 'interacted',                  // not `answered`: no success, no knowledge claim
      object: {
        iri: hotspotIri(callout),
        name: callout.label,
        // -> object_type 'Control' (§5). Deliberately NOT MicroSim: this IRI carries a
        // fragment and mv_student_page_rollup is GROUP BY object_id, so a MicroSim-typed
        // hotspot would mint six PageEngagement vertices for one page.
        type: 'Control'
      },
      result: {
        // NOTE: duration on a Control reaches no rollup (contract §12 item 9).
        // mv_student_page_rollup sums duration_ms but excludes Control;
        // mv_student_concept_rollup ignores duration entirely. Per-hotspot dwell lives in
        // lrs.statements only. Kept because it is the signal a teacher would actually want
        // and the log is the system of record — a rollup can be added later without
        // re-collecting it.
        durationMs: dwellMs,
        extensions: { 'engagement-mode': mode }
      },
      concept: concept,
      parent: PAGE_IRI
    }, 'interacted   #' + LRS.slug(callout.label) + '  ' + LRS.isoDuration(dwellMs) +
       '  [' + mode + ']  -> ' + concept);
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────
  //
  // EVERY ATTEMPT IS EMITTED. This is the first sequence in the repo, and it is the
  // whole reason the quiz is worth instrumenting.
  //
  // diagram.js's handleAnswer() locks only on a CORRECT answer; a wrong click just says
  // "Not quite — that is the Cell membrane. Try again." So one question naturally yields
  // fail, fail, success against ONE IRI. Contract §12 item 6 records that quiz-xapi.js
  // emits at most one `answered` per question per load and that "BKT's value comes from a
  // sequence of attempts, and nothing currently produces one." This produces one.
  //
  // WHY EMITTING THE FAILURES IS THE HONEST CHOICE, not the noisy one. With six hotspots
  // a student can brute-force: click every marker and the last one is necessarily right.
  // If only the success were emitted, that student would look identical to one who knew
  // it instantly — `attempts = 1, successes = 1` — and the rollup would report mastery
  // that the interaction plainly disproves. Emitting the full sequence yields
  // `attempts = 6, successes = 1`, and BKT's guess parameter exists precisely to read
  // that as a guess. The sequence is not noise around the signal; for a click-to-identify
  // quiz the sequence IS the signal.
  //
  // This is the mirror image of quiz-xapi.js's peek rule, and consistent with it: there,
  // suppressing a peeked answer prevents claiming knowledge the student did not
  // demonstrate. Here, emitting the failures prevents the same false claim. Both follow
  // from "do not report success the interaction does not support."
  var questionShownAt = null;
  var lastAttemptAt   = null;
  var attemptNo       = 0;

  function emitAnswer(clicked, target, correct) {
    var concept = conceptFor(target);
    if (!concept) return;

    attemptNo++;
    var now = Date.now();
    // Per-ATTEMPT time, not time-since-question: for attempt 1 they are the same, and for
    // later attempts this answers "how long did this attempt take" and still sums to the
    // total. Informational either way — Question duration reaches no rollup (§12 item 9).
    var since = now - (lastAttemptAt || questionShownAt || now);
    lastAttemptAt = now;

    lrs.emit({
      verb: 'answered',
      object: {
        iri: questionIri(target),          // named, not ordinal — the order is randomized
        name: 'Identify the ' + target.label,
        type: 'Question'                   // -> cmi.interaction (§5)
      },
      result: {
        // REQUIRED for `answered` (§3). Without it countIf(result_success IS NOT NULL)
        // counts zero attempts and the mastery path stays dark — the exact reason
        // `completed` is not in v1.
        success: correct,
        score: correct ? 1 : 0,
        // What they actually clicked. On a wrong answer this is the useful part: clicking
        // the cytoplasm when asked for the cell membrane is a different error from
        // clicking the nucleus, and only `response` preserves which.
        response: LRS.slug(clicked.label),
        durationMs: since,
        extensions: { 'attempt-number': attemptNo }
      },
      concept: concept,
      parent: PAGE_IRI                     // §4 — required for `answered`
    }, 'answered     #q-' + LRS.slug(target.label) + '  attempt ' + attemptNo + '  ' +
       (correct ? '✓' : '✗ (clicked ' + clicked.label + ')') +
       '  -> ' + concept);
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
    lrs.note_('mode: ' + newMode + (newMode === 'quiz'
      ? ' — every attempt is emitted, including wrong ones (that sequence is the signal)'
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
    // sets quizLocked and waits 1800ms before advancing; clicks in that window are
    // ignored by the sim and must be ignored here too, or they would emit answers to a
    // question that is already over.
    if (sim.quizLocked) return origHandleAnswer(clicked, target);

    var correct = clicked.id === target.id;
    origHandleAnswer(clicked, target);
    emitAnswer(clicked, target, correct);
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

      var leave = function () {
        if (sim.mode !== 'explore' || enteredAt === null) return;
        var dwell = Date.now() - enteredAt;
        enteredAt = null;
        if (dwell >= HOVER_EVIDENCE_MS) emitInspect(callout, dwell, 'hover');
      };

      var click = function () {
        if (sim.mode !== 'explore') return;   // in quiz mode the marker is an answer
        var dwell = enteredAt ? Date.now() - enteredAt : 0;
        // Suppress the in-flight hover rather than letting it fire on leave. A hover and a
        // click on ONE visit are one engagement, not two — the student inspected the
        // nucleus once. scientific-method learned this the hard way: an earlier version
        // restarted the hover clock here, which only DELAYED the duplicate, and clicking
        // all 12 nodes emitted 24 statements. `null` is what actually suppresses it,
        // because leave() returns early. Re-entering later starts a fresh interval, which
        // is correct — that is a genuinely separate visit.
        enteredAt = null;
        emitInspect(callout, dwell, 'click');
      };

      [sim.markers.get(callout.id), sim.labelRows.get(callout.id)].forEach(function (el) {
        if (!el) return;
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointerleave', leave);
        el.addEventListener('click', click);
      });
    });
  };

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') closePageInterval('tab-hidden');
  });

  // Render the panel immediately so the page shows it before any interaction — an empty
  // panel that explains itself is the affordance; a panel that appears only after a
  // statement is emitted cannot tell a student that emitting is possible.
  document.addEventListener('DOMContentLoaded', function () { lrs.panel(); });
})();
