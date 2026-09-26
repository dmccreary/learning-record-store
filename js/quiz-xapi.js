// quiz-xapi.js — turns a static chapter quiz into an xAPI `answered` emitter.
//
// Loaded on every page (via extra_javascript, after the xAPI runtime) and no-ops on pages
// with no quiz.
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
// Statements go through the shared runtime (lrs-sim.js `question().answer()`), so the page
// IRI, grouping, and statement shape come from lrs-xapi.js — never from here. Answers pass
// through in both Full and Compact mode, so a quiz has no mode to switch. Whether the
// statement log shows is the book's call: lrs-config.js `quizzes.teaching`.

(function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D'];

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
      // ONE-BASED: #q1 is Question 1 — the number the student actually sees (contract §2).
      number: parseInt(numMatch[1], 10),
      text: numMatch[2],
      correct: ansMatch[1].toUpperCase(),
      // A slug of the "Concept Tested" label. Still to do: map the label to its namespaced
      // learning-graph ConceptID (TODO.md, decision B) — only ~65% of labels match exactly.
      concept: conceptMatch ? LRS.slug(conceptMatch[1].split('\n')[0]) : null,
      options: Array.prototype.slice.call(list.querySelectorAll('li')),
      details: details
    };
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
    if (!divs.length) return;                 // not a quiz page — no-op
    if (!window.LRSSim) return;               // the xAPI runtime is not loaded

    var cfg = (window.LRS_CONFIG && window.LRS_CONFIG.quizzes) || {};
    var lrs = LRSSim.create({
      name: document.title,
      source: 'this chapter quiz',
      metadata: false,                        // a quiz page has no metadata.json
      policy: { teaching: cfg.teaching === true },
      modeControls: false,                    // answers pass through in both modes
      mount: document.querySelector('article') || document.body,
      modeText: function () {
        return 'answer a question above to emit one answered statement.';
      }
    });

    var wired = 0;

    Array.prototype.forEach.call(divs, function (div) {
      var q = parseQuestion(div);
      if (!q) return;

      var question = lrs.question('q' + q.number, { name: q.text, concept: q.concept });
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
            lrs.note('q' + q.number + ': answer was revealed before choosing — no statement ' +
                     'emitted (a peeked answer is not evidence)');
            return;
          }

          verdict(div, correct ? 'right' : 'wrong',
            correct
              ? 'You answered ' + letter + ' — correct. One `answered` statement emitted.'
              : 'You answered ' + letter + ' — incorrect. The correct answer is ' + q.correct +
                '. One `answered` statement emitted with success: false.');

          question.answer({ success: correct, response: letter, durationMs: Date.now() - shownAt });
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
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
