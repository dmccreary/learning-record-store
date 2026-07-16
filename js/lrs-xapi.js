// lrs-xapi.js — the one implementation of the xAPI producer contract.
//
// Normative reference: docs/specs/xapi-producer-contract-v1.md. Where this file and
// that document disagree, the document wins and this file is a bug.
//
// WHY THIS EXISTS
// ---------------
// Four emitters had independently re-implemented the same ~60 lines — UUID, ISO-8601
// duration, the actor block, the log panel, and the canonical-IRI rule:
//
//   docs/js/quiz-xapi.js                  derived the page IRI from location.pathname
//   docs/sims/bouncing-ball/*.js          hardcoded ACTIVITY_BASE_ID
//   docs/sims/sine-wave/*.js              hardcoded it
//   docs/sims/scientific-method/script.js hardcoded it
//
// They already disagreed. That is not a style problem: sine-wave's hardcoded IRI was
// wrong twice (wrong site AND `main.html` instead of the page), and contract §1 records
// that fixing it surfaced five more wrong URLs in the same file. The hardcoded ones that
// are correct are correct BY LUCK, not by construction — nothing stops the next
// copy-paste from carrying a stale base into a new sim.
//
// This module makes §1 true by construction: an emitter cannot supply a page IRI at all,
// so it cannot supply a wrong one.
//
// LOADS IN TWO CONTEXTS
// ---------------------
//   site pages  — mkdocs.yml `extra_javascript`
//   sim iframes — <script src="../../js/lrs-xapi.js"> in main.html
//
// An iframe payload does not receive `extra_javascript`, so sims must link it directly.
// Both contexts must produce the SAME IRI for the same activity — see pageIri() below,
// which is where that gets interesting.
//
// NOTHING HERE POSTS. Statements render into a panel. The gateway does not exist yet
// (see TODO.md's critical path); when it does, `transport` is the only thing that
// changes and no emitter should need editing.

(function (global) {
  'use strict';

  // ── Contract constants ────────────────────────────────────────────────────
  // §1: the canonical site root. NOT window.location.origin — a statement emitted
  // from a local `mkdocs serve` must carry the PUBLISHED IRI, never 127.0.0.1.
  var SITE_URL       = 'https://dmccreary.github.io/learning-record-store/';
  var SITE_BASE_PATH = '/learning-record-store/';        // the GitHub Pages project base
  var VERSION_IRI    = SITE_URL + 'textbook/lrs/v1.0.0'; // §4 — the textbook VERSION, not a page
  var EXT            = 'https://w3id.org/lrs/ext/';      // §6. sine-wave once used a
                                                         // different namespace here; that is
                                                         // exactly what a shared constant prevents.

  // §3 — exactly three verbs are valid. Anything else is rejected at the gateway.
  var VERB = {
    answered:    'http://adlnet.gov/expapi/verbs/answered',
    experienced: 'http://adlnet.gov/expapi/verbs/experienced',
    interacted:  'http://adlnet.gov/expapi/verbs/interacted'
  };

  // §5 — activity type -> object_type. Keyed by the object_type the DDL stores, because
  // that is what an emitter author is actually thinking about ("this is a Control").
  //
  // Note Question and Control differ by four characters (`cmi.interaction` vs
  // `interaction`) and drive entirely different materialized views. That trap is an
  // inheritance from the ADL vocabulary, and naming the types by their OUTPUT column is
  // how this module keeps an author from falling into it.
  var TYPE = {
    Page:     'http://adlnet.gov/expapi/activities/lesson',
    MicroSim: 'http://adlnet.gov/expapi/activities/simulation',
    Question: 'http://adlnet.gov/expapi/activities/cmi.interaction',
    Control:  'http://adlnet.gov/expapi/activities/interaction'
  };

  // §10 — the demo tenant. `homePage` names an account NAMESPACE, not a website.
  // Every emitter hardcodes one student; contract §12 item 7 owns that gap (it is
  // loadgen's job, not a sim's) and centralising it here at least makes it one line
  // to fix rather than five.
  function actor() {
    return {
      objectType: 'Agent',
      name: 'demo-student',
      account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
    };
  }

  // ── The canonical page IRI ────────────────────────────────────────────────
  //
  // DERIVED, never supplied. This resolves the derive-vs-hardcode split in favour of
  // derive, and the reason is contract §1's own failure case: `main.html` is the iframe
  // PAYLOAD, not a navigable page. MkDocs renders index.md to /sims/x/ and copies
  // main.html beside it, so a sim has two URLs and only one of them is the activity.
  // Citing main.html mints a SECOND IRI for one activity, which splits
  // student_page_rollup (ORDER BY object_id) into two rows that never merge.
  //
  // The subtlety that makes deriving non-obvious — and worth writing down, because the
  // naive derive is WRONG:
  //
  //   iframe at /sims/animal-cell/main.html   -> must emit .../sims/animal-cell/
  //   page   at /sims/animal-cell/            -> must emit .../sims/animal-cell/
  //   quiz   at /chapters/01-.../quiz/        -> must emit .../chapters/01-.../quiz/
  //
  // quiz-xapi.js's version stripped only the base path, which is correct for a site page
  // and would have produced `.../sims/animal-cell/main.html` inside an iframe — the exact
  // IRI §1 forbids. Stripping the payload filename is what makes one rule cover both, and
  // it is why this could not simply be lifted from the existing copy.
  function pageIri() {
    var p = global.location.pathname;

    if (p.indexOf(SITE_BASE_PATH) === 0) p = p.slice(SITE_BASE_PATH.length);
    p = p.replace(/^\/+/, '');

    // main.html is the iframe payload; index.html is the same page as its directory.
    // Neither is ever the activity — the directory is.
    p = p.replace(/(^|\/)(main|index)\.html$/, '$1');

    if (p && p.charAt(p.length - 1) !== '/') p += '/'; // §1: the trailing slash is significant

    return SITE_URL + p;
  }

  // §2 — a named sub-activity's fragment is its stable local name, slugified. Not its
  // position: an edit that does not change what the thing IS must not change its IRI.
  function slug(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  function uuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (global.crypto && global.crypto.getRandomValues)
        ? global.crypto.getRandomValues(new Uint8Array(1))[0] % 16
        : Math.floor(Math.random() * 16);
      return (c === 'x' ? r : (r % 4) + 8).toString(16);
    });
  }

  // ms -> ISO-8601 duration. The processor parses this back to duration_ms, which is the
  // only field feeding dwell_ms_total.
  function isoDuration(ms) {
    var t = ms / 1000;
    var h = Math.floor(t / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = Math.round((t % 60) * 100) / 100;
    var out = 'PT';
    if (h) out += h + 'H';
    if (m) out += m + 'M';
    return out + s + 'S';
  }

  // Short extension keys -> fully-qualified IRIs. An emitter writes `duration` and
  // `engagement-mode`; the namespace is applied here exactly once. A key that is already
  // absolute is passed through, so a sim can still send a foreign extension.
  function qualify(exts) {
    var out = {};
    for (var k in exts) {
      if (!Object.prototype.hasOwnProperty.call(exts, k)) continue;
      if (exts[k] === undefined) continue;
      out[/^https?:\/\//.test(k) ? k : EXT + k] = exts[k];
    }
    return out;
  }

  // ── Statement builder ─────────────────────────────────────────────────────
  //
  // spec = {
  //   verb:    'interacted' | 'experienced' | 'answered',
  //   object:  { iri, name, type: 'Page'|'MicroSim'|'Question'|'Control' },
  //   result:  { durationMs, success, score, response, extensions },   (optional)
  //   concept: 'concept-id',                                           (optional, §6)
  //   parent:  iri                                                     (optional, §4)
  // }
  function build(spec) {
    if (!VERB[spec.verb])        throw new Error('lrs-xapi: invalid verb "' + spec.verb + '" (§3)');
    if (!TYPE[spec.object.type]) throw new Error('lrs-xapi: invalid object type "' + spec.object.type + '" (§5)');

    var st = {
      id: uuid(),
      actor: actor(),
      verb: { id: VERB[spec.verb], display: { 'en-US': spec.verb } },
      object: {
        objectType: 'Activity',
        id: spec.object.iri,
        definition: {
          name: { 'en-US': spec.object.name },
          type: TYPE[spec.object.type]
        }
      },
      context: {
        // §4 — grouping is REQUIRED on every statement. textbook_id and version_id are
        // NOT NULL in lrs.statements and have no sensible default.
        contextActivities: { grouping: [{ id: VERSION_IRI }] },
        extensions: {}
      },
      timestamp: new Date().toISOString()
    };

    if (spec.parent) st.context.contextActivities.parent = [{ id: spec.parent }];

    var r = spec.result;
    if (r) {
      st.result = {};
      if (r.durationMs !== undefined) st.result.duration = isoDuration(r.durationMs);
      // `!== undefined`, not truthiness: success:false is the whole point of an
      // `answered` statement that failed, and `if (r.success)` would silently drop it.
      if (r.success !== undefined)    st.result.success  = r.success;
      if (r.score !== undefined)      st.result.score    = { scaled: r.score };
      if (r.response !== undefined)   st.result.response = r.response;
      if (r.extensions)               st.result.extensions = qualify(r.extensions);
    }

    // §6 — without this the statement is skipped entirely by mv_student_concept_rollup's
    // own WHERE notEmpty(concept_ids), so it reaches no concept evidence at all.
    if (spec.concept) st.context.extensions[EXT + 'concept_id'] = spec.concept;
    if (spec.contextExtensions) {
      var extra = qualify(spec.contextExtensions);
      for (var k in extra) st.context.extensions[k] = extra[k];
    }

    validate(st, spec);
    return st;
  }

  // Fail loudly in the console rather than emitting a shape the gateway would reject.
  // These sims are what a student reads to learn what an xAPI statement IS, so a wrong
  // shape is a teaching bug, not just a data bug (contract §1).
  function validate(st, spec) {
    var id = st.object.id;
    if (id.indexOf('https://') !== 0)  warn('object.id is not absolute https: ' + id + ' (§1)');
    if (id.indexOf('main.html') !== -1) warn('object.id names the iframe payload, not the page: ' + id + ' (§1)');
    if (id.indexOf('127.0.0.1') !== -1 || id.indexOf('localhost') !== -1) {
      warn('object.id carries a local origin: ' + id + ' (§1)');
    }
    // §3 — `answered` without success cannot feed countIf(result_success IS NOT NULL),
    // so the concept rollup reports attempts = 0 and BKT gets nothing. That is the exact
    // failure that makes `completed` unusable and kept it out of v1.
    if (spec.verb === 'answered' && (!st.result || st.result.success === undefined)) {
      warn('`answered` requires result.success (§3) — without it attempts stays 0');
    }
    if (spec.verb === 'experienced' && (!st.result || st.result.duration === undefined)) {
      warn('`experienced` requires result.duration (§3/§7)');
    }
    // A fragment-qualified IRI typed MicroSim would become its own PageEngagement vertex,
    // because mv_student_page_rollup is GROUP BY object_id (§5).
    if (id.indexOf('#') !== -1 && (spec.object.type === 'MicroSim' || spec.object.type === 'Page')) {
      warn('fragment IRI typed ' + spec.object.type + ' — this mints a spurious PageEngagement vertex (§5): ' + id);
    }
  }

  function warn(msg) {
    if (global.console && global.console.warn) global.console.warn('[lrs-xapi] ' + msg);
  }

  // ── Emitter ───────────────────────────────────────────────────────────────

  function Emitter(opts) {
    opts = opts || {};
    this.iri        = pageIri();
    this.count      = 0;
    this.statements = [];
    this.mount      = opts.mount || null;   // selector or element for the panel
    this.note       = opts.note  || '';     // panel header explanation
    this.logEl      = null;
  }

  Emitter.prototype.emit = function (spec, summary) {
    var st = build(spec);
    this.statements.push(st);
    this.count++;
    this.render(st, summary);
    return st;
  };

  Emitter.prototype.panel = function () {
    if (this.logEl && this.logEl.isConnected) return this.logEl;

    var wrap = document.createElement('div');
    wrap.className = 'xapi-panel';
    wrap.innerHTML =
      '<div class="xapi-panel-header"><strong>xAPI statements emitted:</strong> ' +
      '<span class="xapi-count">0</span>' +
      '<span class="xapi-header-note"> &mdash; ' + this.note + '</span></div>' +
      '<div class="xapi-log"></div>';

    var host = null;
    if (typeof this.mount === 'string') host = document.querySelector(this.mount);
    else if (this.mount)               host = this.mount;
    host = host || document.querySelector('article') || document.body;
    host.appendChild(wrap);

    this.wrapEl = wrap;
    this.logEl  = wrap.querySelector('.xapi-log');
    return this.logEl;
  };

  Emitter.prototype.render = function (st, summary) {
    var log = this.panel();

    var a = document.createElement('div');
    a.className   = 'xapi-log-line';
    a.textContent = '▸ ' + summary;
    log.appendChild(a);

    var b = document.createElement('div');
    b.className   = 'xapi-log-line xapi-log-raw';
    b.textContent = JSON.stringify(st);
    log.appendChild(b);

    while (log.childElementCount > 80) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;

    var c = this.wrapEl.querySelector('.xapi-count');
    if (c) c.textContent = String(this.count);
  };

  // A line in the log that is NOT a statement — used to say why something was
  // deliberately not emitted. "Nothing happened" and "nothing was recorded, on purpose"
  // look identical otherwise, and the second is the interesting one.
  Emitter.prototype.note_ = function (msg) {
    var log = this.panel();
    var d = document.createElement('div');
    d.className   = 'xapi-log-line xapi-log-note';
    d.textContent = '· ' + msg;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  };

  global.LRS = {
    SITE_URL: SITE_URL,
    VERSION_IRI: VERSION_IRI,
    EXT: EXT,
    VERB: VERB,
    TYPE: TYPE,
    pageIri: pageIri,
    slug: slug,
    uuid: uuid,
    isoDuration: isoDuration,
    build: build,
    emitter: function (opts) { return new Emitter(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
