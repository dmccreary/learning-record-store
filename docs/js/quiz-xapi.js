// quiz-xapi.js — turns a static chapter quiz into an xAPI `answered` emitter.
//
// Loaded on every page (via extra_javascript) and no-ops on pages with no quiz.
//
// WHY THIS EXISTS
// ---------------
// Before this, no emitter in the repo produced `answered`, and the only result field any
// sim emitted was `duration`. That left three things structurally dark:
//   * mv_student_question_rollup had never seen a real statement;
//   * the concept rollup's attempts/successes were always zero;
//   * lrs.concept_mastery — BKT's P(L), the product's central number (F-7) — had no input.
// A chapter quiz is the natural source of `answered`, so this is the emitter that lights
// that path up.
//
// THE ANSWER KEY IS NOT DUPLICATED HERE.
// It is read out of the rendered page: mkdocs-material renders `??? question "Show Answer"`
// to <details class="question"> containing "The correct answer is <strong>A</strong>" and
// "<strong>Concept Tested:</strong> ...". quiz.md stays the single source of truth; this
// script parses it. Duplicating the key in JS would let the two drift, and a quiz whose
// emitted success disagrees with its own displayed answer is worse than no telemetry.
//
// Conforms to docs/specs/xapi-producer-contract-v1.md. Nothing is POSTed — statements
// render in the panel below the quiz.

(function () {
  'use strict';

  // Canonical published site root — contract §1. NOT window.location.origin.
  // §1: "a statement emitted from a local `mkdocs serve` must carry the *published* IRI,
  // not http://127.0.0.1:8000/...". The IRI is an identifier, not a URL to fetch, so it
  // must be identical whether this page is served from localhost, a preview, or Pages.
  var SITE_URL = 'https://dmccreary.github.io/learning-record-store/';
  var SITE_BASE_PATH = '/learning-record-store/'; // the GitHub Pages project base
  var VERSION_IRI = SITE_URL + 'textbook/lrs/v1.0.0'; // contract §4

  var ACTIVITY_TYPE_QUESTION = 'http://adlnet.gov/expapi/activities/cmi.interaction';
  var VERB_ANSWERED = 'http://adlnet.gov/expapi/verbs/answered';
  var LETTERS = ['A', 'B', 'C', 'D'];

  var statements = [];

  // Rebuild the canonical page IRI from the path, discarding the local origin.
  // Locally the path is /chapters/x/quiz/; on Pages it is
  // /learning-record-store/chapters/x/quiz/. Both must yield the same IRI.
  function canonicalPageIri() {
    var p = window.location.pathname;
    if (p.indexOf(SITE_BASE_PATH) === 0) p = p.slice(SITE_BASE_PATH.length);
    p = p.replace(/^\/+/, '');
    if (p && p.charAt(p.length - 1) !== '/') p += '/'; // trailing slash is significant (§1)
    return SITE_URL + p;
  }

  function slugify(s) {
    return s.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (window.crypto && window.crypto.getRandomValues)
        ? window.crypto.getRandomValues(new Uint8Array(1))[0] % 16
        : Math.floor(Math.random() * 16);
      return (c === 'x' ? r : (r % 4) + 8).toString(16);
    });
  }

  // ms -> ISO-8601 duration (contract §3). The processor parses this back to duration_ms.
  function isoDuration(ms) {
    var total = ms / 1000;
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = Math.round((total % 60) * 100) / 100;
    var out = 'PT';
    if (h > 0) out += h + 'H';
    if (m > 0) out += m + 'M';
    return out + s + 'S';
  }

  // --- parse one question out of the rendered DOM -------------------------------
  function parseQuestion(div) {
    var heading = div.previousElementSibling;
    while (heading && heading.tagName !== 'H4') heading = heading.previousElementSibling;

    var details = div.nextElementSibling;
    while (details && details.tagName !== 'DETAILS') details = details.nextElementSibling;

    var list = div.querySelector('ol');
    if (!heading || !details || !list) return null;

    // Strip the headerlink pilcrow that Material appends.
    var headingText = heading.textContent.replace(/¶\s*$/, '').trim();
    var numMatch = headingText.match(/^(\d+)\.\s*(.+)$/);
    if (!numMatch) return null;

    var body = details.textContent;
    var ansMatch = body.match(/correct answer is\s*([A-D])\b/i);
    var conceptMatch = body.match(/Concept Tested:\s*(.+?)\s*(?:See:|$)/s);
    if (!ansMatch) return null;

    return {
      // ONE-BASED: #q1 is Question 1 — the number the student actually sees.
      // Contract §2 was re-pinned to one-based on 2026-07-16 for exactly this reason;
      // `#q0` meaning "Question 1" is a permanent footgun when reading a statement.
      number: parseInt(numMatch[1], 10),
      text: numMatch[2],
      correct: ansMatch[1].toUpperCase(),
      concept: conceptMatch ? slugify(conceptMatch[1].split('\n')[0]) : null,
      options: Array.prototype.slice.call(list.querySelectorAll('li')),
      details: details
    };
  }

  // --- emit ---------------------------------------------------------------------
  function emitAnswered(q, chosenLetter, pageIri, elapsedMs) {
    var correct = chosenLetter === q.correct;

    var statement = {
      id: uuid(),
      actor: {
        objectType: 'Agent',
        name: 'demo-student',
        account: { homePage: 'https://demo.example.edu', name: 'demo-student' } // §10
      },
      // `answered` — contract §3. This is the verb that carries result.success, and the
      // only route to attempts/successes and therefore to BKT.
      verb: { id: VERB_ANSWERED, display: { 'en-US': 'answered' } },
      object: {
        objectType: 'Activity',
        id: pageIri + '#q' + q.number, // §2, one-based
        definition: {
          name: { 'en-US': q.text },
          // cmi.interaction -> object_type 'Question' (§5). Note this is NOT
          // .../activities/interaction, which maps to 'Control' — four characters apart,
          // entirely different rollups.
          type: ACTIVITY_TYPE_QUESTION
        }
      },
      result: {
        // success is REQUIRED for `answered` (§3). Without it,
        // mv_student_concept_rollup's countIf(result_success IS NOT NULL) counts zero
        // attempts and the mastery path stays dark.
        success: correct,
        score: { scaled: correct ? 1 : 0 },
        response: chosenLetter,
        duration: isoDuration(elapsedMs)
      },
      context: {
        contextActivities: {
          grouping: [{ id: VERSION_IRI }],   // textbook version IRI, §4
          parent: [{ id: pageIri }]          // the quiz page this question sits on
        },
        extensions: {}
      },
      timestamp: new Date().toISOString()
    };

    if (q.concept) {
      // Without this, concept_ids is empty and the statement is skipped entirely by
      // mv_student_concept_rollup's own WHERE notEmpty(concept_ids) — so it would never
      // reach BKT. §6.
      statement.context.extensions['https://w3id.org/lrs/ext/concept_id'] = q.concept;
    }

    statements.push(statement);
    render(statement, 'answered  q' + q.number + '  ' + chosenLetter +
      (correct ? '  ✓' : '  ✗ (correct: ' + q.correct + ')'));
  }

  // --- output panel --------------------------------------------------------------
  function panel() {
    var el = document.getElementById('quiz-xapi-log');
    if (el) return el;

    var wrap = document.createElement('div');
    wrap.className = 'xapi-panel';
    wrap.innerHTML =
      '<div class="xapi-panel-header"><strong>xAPI statements emitted:</strong> ' +
      '<span id="quiz-stmt-count">0</span>' +
      '<span class="xapi-header-note"> &mdash; answer a question above to emit one ' +
      '<code>answered</code> statement. Nothing is sent to a server.</span></div>' +
      '<div id="quiz-xapi-log" class="xapi-log"></div>';

    var content = document.querySelector('article') || document.body;
    content.appendChild(wrap);
    return document.getElementById('quiz-xapi-log');
  }

  function render(statement, summary) {
    var log = panel();
    var a = document.createElement('div');
    a.className = 'xapi-log-line';
    a.textContent = '▸ ' + summary;
    log.appendChild(a);
    var b = document.createElement('div');
    b.className = 'xapi-log-line xapi-log-raw';
    b.textContent = JSON.stringify(statement);
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    var c = document.getElementById('quiz-stmt-count');
    if (c) c.textContent = String(statements.length);
  }

  function note(msg) {
    var log = panel();
    var d = document.createElement('div');
    d.className = 'xapi-log-line xapi-log-note';
    d.textContent = '· ' + msg;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  // A plain-language verdict directly under the options. The radio persists *which*
  // option was chosen; this states what that means and whether it was recorded. Without
  // it, "what answer did I give and did it count?" is only answerable by reading colours.
  function verdict(div, kind, text) {
    var el = document.createElement('p');
    el.className = 'quiz-verdict quiz-verdict--' + kind;
    el.setAttribute('role', 'status'); // announced by screen readers when it appears
    el.textContent = text;
    div.insertAdjacentElement('afterend', el);
  }

  // --- wire up --------------------------------------------------------------------
  function init() {
    var divs = document.querySelectorAll('div.upper-alpha');
    if (!divs.length) return; // not a quiz page — no-op

    var pageIri = canonicalPageIri();
    var wired = 0;

    Array.prototype.forEach.call(divs, function (div) {
      var q = parseQuestion(div);
      if (!q) return;

      var shownAt = Date.now();
      var answered = false;
      var peeked = false;

      // A student who reads the answer before choosing has not produced evidence of
      // knowledge. Emitting that as success:true would teach BKT that they mastered the
      // concept, which is precisely the guessing/slipping error BKT exists to model.
      // Same instinct as the bouncing ball's sub-250ms mis-click filter: not all
      // interaction is evidence.
      q.details.addEventListener('toggle', function () {
        if (q.details.open && !answered) peeked = true;
      });

      // Native radios, not click-handlers on <li>. A bare list gives a reader no signal
      // that it is answerable at all — `cursor: pointer` is invisible until you happen to
      // hover. Radios are self-evidently a control, they persist the chosen answer
      // visibly, and they bring real keyboard and screen-reader semantics rather than the
      // role="button" approximation of them.
      var groupName = 'lrs-q' + q.number;
      var radios = [];

      q.options.forEach(function (li, i) {
        var letter = LETTERS[i];
        var label = document.createElement('label');
        label.className = 'quiz-choice';

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = groupName;
        input.value = letter;

        var span = document.createElement('span');
        // Move the existing option text inside the label so the whole row is clickable.
        while (li.firstChild) span.appendChild(li.firstChild);

        label.appendChild(input);
        label.appendChild(span);
        li.appendChild(label);
        li.classList.add('quiz-option');
        radios.push(input);

        input.addEventListener('change', function () {
          if (answered) return; // first answer is the evidence; later changes are review
          answered = true;

          var correct = letter === q.correct;

          // Lock every option in the group, and always mark the right one — a student who
          // chose wrong still needs to see the answer.
          radios.forEach(function (r, j) {
            r.disabled = true;
            var owner = r.closest('li');
            owner.classList.add('quiz-locked');
            if (LETTERS[j] === q.correct) owner.classList.add('quiz-correct');
          });
          li.classList.add('quiz-chosen');
          if (!correct) li.classList.add('quiz-wrong');

          if (peeked) {
            verdict(div, 'peeked',
              'You answered ' + letter + '. The answer was revealed before you chose, so no ' +
              'xAPI statement was emitted — a peeked answer is not evidence of knowledge.');
            note('q' + q.number + ': answer was revealed before choosing — no statement ' +
                 'emitted (a peeked answer is not evidence)');
            return;
          }

          verdict(div, correct ? 'right' : 'wrong',
            correct
              ? 'You answered ' + letter + ' — correct. One `answered` statement emitted.'
              : 'You answered ' + letter + ' — incorrect. The correct answer is ' + q.correct +
                '. One `answered` statement emitted with success: false.');

          emitAnswered(q, letter, pageIri, Date.now() - shownAt);
        });
      });
      wired++;
    });

    if (wired > 0) {
      // Say the quiz is answerable. The static markdown gives no such signal, and a
      // reader who does not know to answer emits nothing at all.
      var intro = document.createElement('p');
      intro.className = 'quiz-intro';
      intro.textContent = 'Select an answer for each question. Your first choice is ' +
        'recorded and emits one xAPI statement — nothing is sent to a server.';
      var first = document.querySelector('div.upper-alpha');
      var anchor = first && first.previousElementSibling;
      while (anchor && anchor.tagName !== 'H4') anchor = anchor.previousElementSibling;
      if (anchor) anchor.insertAdjacentElement('beforebegin', intro);
      panel();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
