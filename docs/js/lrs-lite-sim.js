// lrs-lite-sim.js — compact xAPI for MicroSims.
//
// Design reference: docs/lrs-lite/index.md §6 (producer-side summarization). Statement
// construction stays in lrs-xapi.js, the one module that owns the producer contract; this
// file decides WHEN to emit and WHAT a session summary contains.
//
// WHAT "COMPACT" MEANS
// --------------------
// A MicroSim in full mode emits one statement per meaningful interaction: every slider
// step past its deadband, every Start/Pause run, every node a student studies. In compact
// mode the same interactions are folded into an in-memory SESSION, and the session is
// emitted as ONE `experienced` statement when the sim loses focus. The summary says how
// many full-mode statements it stands for (`statements_represented`), so the compression
// stays observable — the producer-side version of spec C-6.
//
// CONTROLLED BY CONFIG: lrs-config.js (the book) and metadata.json (the sim)
// -------------------------------------------------------------------------
// The sim's own metadata.json (fetched relative to main.html) may carry:
//
//   "xapi": { "compact": true, "teaching": false,
//             "idleMs": 90000, "offscreenMs": 10000, "blurMs": 30000 }
//
//   compact      true  -> fold into a session, emit one summary on focus loss
//                false -> the sim emits its full per-interaction stream, unchanged
//   teaching     true  -> the sim shows its teaching UI (statement log, Full/Compact switch,
//                         Simulate Done, View Formatted JSON) — only for sims that teach xAPI
//   idleMs       no input for this long (and the sim is not running) ends the session
//   offscreenMs  the sim mostly (< 25%) out of view for this long ends the session
//   blurMs       the frame losing keyboard focus for this long ends the session
//
// Any key missing from the sim's block comes from the book's lrs-config.js `xapi` block,
// then from DEFAULTS. With neither, the sim is COMPACT and silent, per §6.4: a sim with no
// policy is in summary mode — not silent about the data, and not verbose.
//
// Above all of them sits the URL switch (urlPolicy below): `?xapi=teaching` on the sim's
// page — or on the lesson or chapter page that embeds it — shows the teaching panel for
// that visit, so any instrumented sim can become a teaching aid without editing a file.
//
// A teaching sim may override the policy at runtime with session.setCompact(bool), so a
// reader can flip between the two streams. Leaving compact flushes the open session
// (end_reason 'mode-switch') so nothing already folded is lost.
//
// "LOSES FOCUS" (§6.1)
// --------------------
// No single browser event catches every way a student leaves a sim, so any of these ends
// the session: tab hidden (visibilitychange), page left (pagehide), scrolled mostly out of
// view (IntersectionObserver — inside an iframe the implicit root is the top-level
// viewport, so this sees the PARENT page scrolling), idle, or blurred. Re-engaging starts
// a new session.
//
// LOADING
// -------
//   <script src="../../js/lrs-xapi.js"></script>
//   <script src="../../js/lrs-lite-sim.js"></script>
//   <script src="your-sim.js"></script>
//
// A sim's JS must still run without this file — teachers paste sim JS into the p5.js
// editor — so every call site is guarded: `if (xapi && xapi.compact) { ... }`.
//
// NOTHING HERE POSTS. Statements go to the sim's own publish() (its log panel) and to
// LRSLite.statements. When the LRS-Lite store exists (§5), record() is where it attaches.

(function (global) {
  'use strict';

  var DEFAULTS = {
    compact: true,
    teaching: false,
    idleMs: 90000,
    offscreenMs: 10000,
    blurMs: 30000
  };
  // Not configurable yet: a tick counts as active if the student gave input this recently.
  var ACTIVE_WINDOW_MS = 30000;
  // The frame counts as "in view" while at least this fraction of it is visible.
  var VISIBLE_FRACTION = 0.25;
  var TICK_MS = 1000;

  // Every statement published on this page, full or compact, in order. Tests read this.
  var statements = [];

  function record(st) {
    statements.push(st);
    try {
      global.dispatchEvent(new CustomEvent('lrs-lite:statement', { detail: st }));
    } catch (e) { /* CustomEvent unavailable: the array is still authoritative */ }
  }

  // ── The URL switch: a viewer's explicit request wins over every config layer ─────
  //
  //   ?xapi=teaching            show the teaching panel; starts on Full, like every teaching sim
  //   ?xapi=teaching,compact    the same, starting on Compact
  //   ?xapi=full | compact      choose the stream without the panel (read LRSLite.statements)
  //   ?xapi=production          hide the panel on a teaching sim, to see what production shows
  //
  // Read from the sim's own URL AND, inside an iframe, from the embedding page's URL. That is
  // what makes it useful: readers never see main.html's URL, so `?xapi=teaching` on a lesson
  // or chapter page turns every instrumented sim on that page into a teaching aid, with no
  // file edited. Tokens combine with `,` or `+`; a later token wins over an earlier one, and
  // the embedding page's tokens are read after the sim's own.
  function urlPolicy() {
    var tokens = [];
    function read(loc) {
      try {
        var v = new URLSearchParams(loc.search).get('xapi');
        if (v) tokens = tokens.concat(v.split(/[\s,+]+/));
      } catch (e) { /* no URLSearchParams, or a location we may not read */ }
    }
    read(global.location);
    try {
      if (global.parent && global.parent !== global) read(global.parent.location);
    } catch (e) { /* cross-origin embed: only the sim's own URL counts */ }

    var out = {};
    tokens.forEach(function (t) {
      t = t.toLowerCase();
      if (t === 'teaching') out.teaching = true;
      else if (t === 'production') out.teaching = false;
      else if (t === 'full') out.compact = false;
      else if (t === 'compact') out.compact = true;
      else if (t && global.console) {
        global.console.warn('[lrs-lite-sim] unknown ?xapi= token "' + t +
                            '" — use teaching, production, full or compact');
      }
    });
    // Teaching sims start on Full (Dan, 2026-09-26): each statement is what they teach.
    if (out.teaching === true && out.compact === undefined) out.compact = false;
    return out;
  }

  // Config -> policy. Resolves, never rejects: an unreadable metadata.json is "no policy".
  //   opts.metadata === false  a page with no metadata.json of its own (a chapter quiz): skip it
  //   opts.policy              keys the page sets itself, over the book's and under the sim's
  function loadPolicy(opts) {
    opts = opts || {};
    var fetched = (typeof fetch === 'function' && opts.metadata !== false)
      ? fetch('metadata.json', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; })
      : Promise.resolve(null);

    return fetched.then(function (meta) {
      // Precedence, lowest first: DEFAULTS < this book's lrs-config.js `xapi` < the page's own
      // `policy` option < this sim's metadata.json `xapi` < the URL switch. An agent changes a
      // whole textbook in one file, or one sim in its own; a viewer changes one visit in the URL.
      var cfg = global.LRS_CONFIG;
      var book = (cfg && typeof cfg.xapi === 'object' && cfg.xapi) || {};
      var page = opts.policy || {};
      var block = (meta && typeof meta.xapi === 'object' && meta.xapi) || {};
      var url = urlPolicy();
      var policy = {};
      for (var k in DEFAULTS) {
        policy[k] = url[k] !== undefined ? url[k]
                  : block[k] !== undefined ? block[k]
                  : page[k] !== undefined ? page[k]
                  : book[k] !== undefined ? book[k]
                  : DEFAULTS[k];
      }
      // Only an explicit `false` turns compaction off; only an explicit `true` shows teaching UI.
      policy.compact = policy.compact !== false;
      policy.teaching = policy.teaching === true;
      // True when ONLY the URL turned the panel on. The sim's iframe was then sized without
      // the panel, so lrs-sim.js grows the frame to fit it (teaching sims were sized for it).
      var configured = block.teaching !== undefined ? block.teaching
                     : page.teaching !== undefined ? page.teaching : book.teaching;
      policy.teachingFromUrl = url.teaching === true && configured !== true;
      policy.source = Object.keys(url).length ? '?xapi= URL switch'
                    : meta && meta.xapi ? 'metadata.json' : cfg && cfg.xapi ? 'lrs-config.js' : 'default';
      return policy;
    });
  }

  // ── Session ───────────────────────────────────────────────────────────────
  //
  // opts = {
  //   name:      'Bouncing Ball Simulation',   // object.definition.name
  //   concept:   'motion',                     // context concept_id (contract §6)
  //   publish:   function (statement, summaryText) { ... },   // the sim's log panel
  //   beforeEnd: function (reason) { ... },    // optional: close open intervals first
  //   metadata, policy                          // optional: see loadPolicy()
  // }
  function Session(opts) {
    var self = this;
    this.opts = opts || {};
    this.compact = false;        // false until the policy loads — nothing is folded early
    this.policy = null;
    this.busy = false;           // e.g. a Start/Pause sim that is running
    this.lastInputAt = Date.now();
    this.frameVisible = true;
    this.ending = false;
    this.ticker = null;
    this.offscreenTimer = null;
    this.blurTimer = null;
    this._reset();

    this.listening = false;
    this.pendingCompact = null;   // a setCompact() before the policy loaded wins over it

    this.ready = loadPolicy(this.opts).then(function (policy) {
      self.policy = policy;
      self._applyMode(self.pendingCompact !== null ? self.pendingCompact : policy.compact);
      return self;
    });
  }

  Session.prototype._applyMode = function (compact) {
    this.compact = compact;
    document.documentElement.setAttribute('data-xapi-mode', compact ? 'compact' : 'full');
    if (compact && !this.listening) this._listen();
  };

  // Switch modes at runtime — for teaching sims that let the reader compare the two
  // streams side by side. Leaving compact mode ends the open session first, so folded
  // work is emitted as a summary rather than silently dropped. The focus-loss listeners
  // stay attached once added; end() is a no-op in full mode.
  Session.prototype.setCompact = function (compact) {
    compact = !!compact;
    if (!this.policy) { this.pendingCompact = compact; return; }  // timers need the policy
    if (compact === this.compact) return;
    if (!compact) this.end('mode-switch');
    this._applyMode(compact);
  };

  Session.prototype._reset = function () {
    this.open = false;
    this.startedAt = null;
    this.lastTickAt = null;
    this.activeMs = 0;
    this.interactions = 0;
    this.represented = 0;        // full-mode statements this session stands for
    this.controls = {};
    this.runs = { count: 0, ms: 0 };
  };

  Session.prototype._open = function () {
    if (this.open) return;
    var self = this;
    this.open = true;
    this.startedAt = Date.now();
    this.lastTickAt = this.startedAt;
    this.ticker = setInterval(function () { self._tick(); }, TICK_MS);
  };

  Session.prototype._visible = function () {
    return document.visibilityState !== 'hidden' && this.frameVisible;
  };

  // Credit the time since the last tick if the student was plausibly engaged, then check
  // for idleness. A running sim (busy) is engaged without input and never goes idle.
  Session.prototype._tick = function () {
    if (!this.open) return;
    var now = Date.now();
    var dt = Math.min(now - this.lastTickAt, 2 * TICK_MS);
    this.lastTickAt = now;
    if (this._visible() && (this.busy || now - this.lastInputAt < ACTIVE_WINDOW_MS)) {
      this.activeMs += dt;
    }
    if (!this.busy && now - this.lastInputAt >= this.policy.idleMs) this.end('idle');
  };

  Session.prototype._listen = function () {
    var self = this;
    this.listening = true;

    function onInput() {
      self.lastInputAt = Date.now();
      clearTimeout(self.blurTimer);
    }
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'input', 'change']
      .forEach(function (type) {
        global.addEventListener(type, onInput, { capture: true, passive: true });
      });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') self.end('tab-hidden');
    });
    global.addEventListener('pagehide', function () { self.end('page-left'); });

    global.addEventListener('blur', function () {
      clearTimeout(self.blurTimer);
      self.blurTimer = setTimeout(function () { self.end('blurred'); }, self.policy.blurMs);
    });
    global.addEventListener('focus', function () { clearTimeout(self.blurTimer); });

    if (typeof IntersectionObserver === 'function') {
      var thresholds = [];
      for (var i = 0; i <= 20; i++) thresholds.push(i / 20);
      new IntersectionObserver(function (entries) {
        var e = entries[entries.length - 1];
        // Fraction of the FRAME that is visible, not of the document: a sim taller than
        // its iframe is still "fully in view" when the whole frame is on screen.
        var frame = Math.min(global.innerHeight, e.boundingClientRect.height) || 1;
        var fraction = e.isIntersecting ? e.intersectionRect.height / frame : 0;
        self._setFrameVisible(fraction >= VISIBLE_FRACTION);
      }, { threshold: thresholds }).observe(document.documentElement);
    }
  };

  Session.prototype._setFrameVisible = function (visible) {
    var self = this;
    if (visible === this.frameVisible) return;
    this.frameVisible = visible;
    clearTimeout(this.offscreenTimer);
    if (!visible) {
      this.offscreenTimer = setTimeout(function () {
        if (!self.frameVisible) self.end('scrolled-away');
      }, this.policy.offscreenMs);
    }
  };

  // ── What a sim calls ──────────────────────────────────────────────────────

  // A control interaction that full mode would have emitted as one statement.
  //   value — a numeric control's value (min/max/last are kept), or undefined
  //   extra — { ms: dwell, mode: 'hover'|'pinned'|..., concept: 'concept-id',
  //             reversals: direction changes since the last touch }
  // Reversals are carried because a summary loses the ORDER of values, and order is the
  // only thing a direction change could otherwise be recovered from.
  Session.prototype.touch = function (control, value, extra) {
    this._open();
    extra = extra || {};
    this.interactions++;
    this.represented++;
    var c = this.controls[control] || (this.controls[control] = { n: 0 });
    c.n++;
    if (typeof value === 'number' && isFinite(value)) {
      c.min = (c.min === undefined) ? value : Math.min(c.min, value);
      c.max = (c.max === undefined) ? value : Math.max(c.max, value);
      c.last = value;
    }
    if (extra.ms) c.ms = (c.ms || 0) + Math.round(extra.ms);
    if (extra.mode) {
      c.modes = c.modes || {};
      c.modes[extra.mode] = (c.modes[extra.mode] || 0) + 1;
    }
    if (extra.concept) c.concept = extra.concept;
    if (extra.reversals) c.reversals = (c.reversals || 0) + extra.reversals;
  };

  // A Start/Pause run interval (contract §7) that full mode would have emitted.
  Session.prototype.run = function (ms) {
    this._open();
    this.runs.count++;
    this.runs.ms += Math.round(ms);
    this.represented++;
  };

  // There is deliberately NO way to fold an answer, prediction, or goal into a session.
  // Checked answers pass through in both modes as their own `answered` statements (Dan,
  // 2026-09-26; lrs-sim.js `question().answer()`): BKT reads the ORDER of attempts, each
  // answer keeps its question IRI, and the per-question rollups stay replayable (C-2).
  // A summary carries exposure evidence only.

  Session.prototype.setBusy = function (busy) {
    this.busy = !!busy;
    if (this.busy) this.lastInputAt = Date.now();
  };

  // End the session and emit its summary. Safe to call any time, in any mode.
  Session.prototype.end = function (reason) {
    if (!this.compact || !this.open || this.ending) return;
    this.ending = true;
    try {
      // e.g. close a run that is still going, so it lands in THIS summary
      if (this.opts.beforeEnd) this.opts.beforeEnd(reason);
    } catch (e) {
      if (global.console) global.console.warn('[lrs-lite-sim] beforeEnd failed', e);
    }
    this._tick();

    var st = this._summary(reason);
    clearInterval(this.ticker);
    clearTimeout(this.offscreenTimer);
    this._reset();
    this.ending = false;

    if (!st) return;
    var text = 'experienced  SUMMARY  ' + st.result.duration + '  (' + reason + ')  — folds ' +
      st.context.extensions[global.LRS.EXT + 'statements_represented'] + ' statements';
    if (typeof this.opts.publish === 'function') this.opts.publish(st, text);
    else record(st);
  };

  Session.prototype._summary = function (reason) {
    // No evidence at all — nothing worth a statement.
    if (!this.represented) return null;
    if (!global.LRS) {
      if (global.console) global.console.warn('[lrs-lite-sim] lrs-xapi.js not loaded — summary dropped');
      return null;
    }

    var ext = {
      xapi_mode: 'compact',
      end_reason: reason,
      active_ms: this.activeMs,
      session_ms: Date.now() - this.startedAt,
      interaction_count: this.interactions,
      controls: this.controls
    };
    if (this.runs.count) ext.runs = this.runs;

    return global.LRS.build({
      verb: 'experienced',
      object: { iri: global.LRS.pageIri(), name: this.opts.name || document.title, type: 'MicroSim' },
      // `experienced` requires result.duration (contract §3). Engaged time, or the summed
      // run intervals if those are longer — a run is dwell by definition (§7).
      result: { durationMs: Math.max(this.activeMs, this.runs.ms), extensions: ext },
      concept: this.opts.concept,
      contextExtensions: { statements_represented: this.represented }
    });
  };

  global.LRSLite = {
    DEFAULTS: DEFAULTS,
    statements: statements,
    record: record,
    loadPolicy: loadPolicy,
    sim: function (opts) { return new Session(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
