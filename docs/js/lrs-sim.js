// lrs-sim.js — the one xAPI API a MicroSim talks to.
//
// A sim reports WHAT happened, as evidence classes (TODO.md, "add-xapi-events-to-microsim"):
//
//   const x = LRSSim.create({ name: 'Sine Wave', concept: 'sine-wave', mount: 'main' });
//   const amp = x.slider('amplitude-slider', { name: 'Amplitude Slider', concept: 'amplitude',
//                                              min: 0, max: 1, initial: 0.5, round: 2 });
//   amplitudeSlider.input(() => amp.input(amplitudeSlider.value()));
//
//   x.slider(key, o)  a continuous parameter      .input(v)   .settle(v)
//   x.item(key, o)    something inspected         .study(mode, ms)   mode: 'hover' | 'pinned' | …
//   x.button(key, o)  a discrete press            .press(action)     e.g. 'start' | 'pause'
//   x.runner(o)       a Start/Pause run interval  .start()    .stop(reason)
//   x.question(key,o) a checked answer            .answer({success, response, …})
//   pageDwell: true   time on a sim with no Run control, as one `experienced` per visit
//
// Answers are never folded: in BOTH modes each one is its own `answered` statement, emitted
// as it happens (Dan, 2026-09-26). Compact mode folds exposure evidence only.
//
// This file decides whether each becomes a Full-mode statement now or a fold into the
// Compact session (lrs-lite-sim.js); builds every statement with LRS.build (lrs-xapi.js), so
// no sim constructs xAPI by hand; and closes open intervals on focus loss and mode switches.
//
// MODE AND TEACHING UI COME FROM CONFIG, NEVER FROM THE SIM. The book's lrs-config.js `xapi`
// block sets the defaults; a sim's metadata.json `xapi` block overrides them:
//   compact   true -> LRS-Lite, one summary per session; false -> the full per-interaction stream
//   teaching  true -> show the statement log, the Full/Compact switch, Simulate Done, and View
//             Formatted JSON. Only for sims that TEACH xAPI; production sims are silent.
// A viewer can override both for one visit with the URL switch `?xapi=teaching` (on the sim's
// page or the page that embeds it; lrs-lite-sim.js urlPolicy). A production sim switched on
// that way grows its iframe to fit the panel (_fitFrame).
//
// The teaching controls live in this panel, in HTML, for every library — p5 included. They
// operate on the xAPI stream, not the simulation, so they belong beside the log they affect,
// and a production sim (teaching off) keeps its original layout with no empty control row.
//
// Loads after lrs-config.js, lrs-xapi.js, lrs-lite-sim.js (and xapi-json-viewer.js for the
// formatted view). A sim must still run without it — pasted into the p5.js editor — so guard
// every call site:  if (window.LRSSim) { ... }

(function (global) {
  'use strict';

  var HOVER_MS = 600;       // a shorter hover is a mouse crossing the sim, not attention
  var MISCLICK_MS = 250;    // a shorter run is a mis-click (contract §7)
  var GLANCE_MS = 1000;     // shorter page dwell is a glance, not engagement
  var MAX_LOG_LINES = 150;
  var MAX_KEPT = 400;       // statements kept in memory to fill a panel built after they were emitted
  var instances = 0;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function roundTo(v, places) {
    if (places === undefined || typeof v !== 'number') return v;
    var f = Math.pow(10, places);
    return Math.round(v * f) / f;
  }

  // ── The sim ───────────────────────────────────────────────────────────────
  //
  // opts = {
  //   name, concept     the MicroSim activity and its page-level concept (summary, run, dwell)
  //   pageDwell         true for sims with no Run control: Full mode reports time on the page
  //   source            how the formatted-JSON tab names this sim ('the Sine Wave MicroSim')
  //   metadata          false for a page with no metadata.json of its own (a chapter quiz)
  //   policy            config keys the page sets itself, e.g. { teaching: true }
  //   Teaching UI — used only when the config says `teaching: true`:
  //   mount             element or selector the panel is appended to (default <body>)
  //   title             log header (default 'xAPI statements emitted:')
  //   modeText(compact, sim)  header explanation, called on every update
  //   foldNotes         false to skip the "· … folded into the session summary" log lines
  //   modeControls      false where the Full/Compact switch would change nothing — a page
  //                     whose every statement is an answer, which passes through in both modes
  // }
  function Sim(opts) {
    var self = this;
    this.opts = opts = opts || {};
    this.id = ++instances;
    this.name = opts.name || document.title;
    this.concept = opts.concept;
    this.iri = LRS.pageIri();
    this.count = 0;           // statements emitted, full or compact
    this.interactions = 0;    // evidence events reported, whether emitted or folded
    this.kept = [];           // {st, text}, to fill a teaching panel built after the fact
    this.latest = null;
    this.runners = [];
    this.pageShownAt = Date.now();
    this.pageClosed = false;
    this.panelEl = this.headerEl = this.logEl = null;

    this.session = LRSLite.sim({
      name: this.name,
      concept: this.concept,
      metadata: opts.metadata,
      policy: opts.policy,
      publish: function (st, text) { self._publish(st, text); },
      // A compact session is ending: close a run that is still going, so it lands in THIS summary.
      beforeEnd: function (reason) { self._stopRunners(reason); }
    });

    // Registered AFTER the session's own listener, so in compact mode the session has already
    // ended (and folded any open run) by the time this runs; then this only handles Full mode.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && !self.compact) {
        self._stopRunners('tab-hidden');
        self._closePage('tab-hidden');
      }
    });

    this.ready = this.session.ready.then(function () {
      if (self.teaching) self._buildPanel();
      return self;
    });
  }

  Object.defineProperty(Sim.prototype, 'compact', {
    get: function () { return this.session.compact; }
  });
  Object.defineProperty(Sim.prototype, 'teaching', {
    get: function () { return !!(this.session.policy && this.session.policy.teaching); }
  });

  // ── Evidence classes ──────────────────────────────────────────────────────

  Sim.prototype.slider = function (key, o) { return new Slider(this, key, o || {}); };
  Sim.prototype.item = function (key, o) { return new Item(this, key, o || {}); };
  Sim.prototype.button = function (key, o) { return new Button(this, key, o || {}); };
  Sim.prototype.question = function (key, o) { return new Question(this, key, o || {}); };
  Sim.prototype.runner = function (o) {
    var r = new Runner(this, o || {});
    this.runners.push(r);
    return r;
  };

  // Any other contract statement, built and published the same way.
  Sim.prototype.emit = function (spec, text) {
    this._publish(LRS.build(spec), text);
  };

  // ── Mode switch and Simulate Done (teaching) ─────────────────────────────

  // Each mode keeps its own record of engagement: Full mode its open run and page interval,
  // Compact mode its session. Switching closes the record being LEFT, so nothing is lost and
  // nothing is counted twice.
  Sim.prototype.setCompact = function (compact) {
    compact = !!compact;
    if (!this.session.policy) { this.session.setCompact(compact); return; }  // not loaded yet
    if (compact === this.compact) return;
    if (compact) {
      this._stopRunners('mode-switch');
      this._closePage('mode-switch');
      this.session.setCompact(true);
    } else {
      this.session.setCompact(false);   // ends the session: a 'mode-switch' summary
      this._restartPage();
    }
    this.note('switched to ' + (compact ? 'COMPACT' : 'FULL') + ' mode');
    this._syncControls();
    this._update();
  };

  // What the host page does when the student moves on: it takes focus from the sim.
  Sim.prototype.done = function () {
    var before = this.count;
    if (this.compact) {
      this.session.end('simulated-done');
      if (this.count === before) this.note('simulated done — nothing folded yet, so no summary');
      else if (global.XapiJsonViewer) {
        this.note('summary emitted — press View Formatted JSON ↗ (or click the line) to read it');
      }
      return;
    }
    if (this._stopRunners('simulated-done')) return;
    if (this.opts.pageDwell) {
      this.note(this._closePage('simulated-done')
        ? 'page dwell emitted — full mode had already sent every other interaction'
        : 'simulated done — under 1s on the page, so no dwell to emit');
      this._restartPage();
      return;
    }
    this.note('simulated done — full mode already emitted every interaction; nothing to flush');
  };

  Sim.prototype.view = function (st) {
    if (st && global.XapiJsonViewer) {
      global.XapiJsonViewer.open(st, { source: this.opts.source || this.name });
    }
  };
  Sim.prototype.viewLatest = function () { this.view(this.latest); };

  // A log line that is NOT a statement: why something was deliberately not emitted.
  Sim.prototype.note = function (msg) {
    if (!this.logEl) return;
    var d = document.createElement('div');
    d.className = 'xapi-log-line xapi-log-note';
    d.textContent = '· ' + msg;
    this._append(d);
  };

  // ── Internals ─────────────────────────────────────────────────────────────

  Sim.prototype._publish = function (st, text) {
    this.count++;
    this.latest = st;
    this.kept.push({ st: st, text: text });
    if (this.kept.length > MAX_KEPT) this.kept.shift();
    LRSLite.record(st);
    if (this.logEl) this._render(st, text);
    this._update();
  };

  Sim.prototype._fold = function (what) {
    if (this.opts.foldNotes !== false) this.note(what + ' folded into the session summary');
    this._update();
  };

  // Returns true if a running interval was closed.
  Sim.prototype._stopRunners = function (reason) {
    var any = false;
    for (var i = 0; i < this.runners.length; i++) {
      if (this.runners[i].running) { this.runners[i].stop(reason); any = true; }
    }
    return any;
  };

  // Full mode's page interval, for sims with no Run control. Returns true if it emitted.
  Sim.prototype._closePage = function (reason) {
    if (!this.opts.pageDwell || this.compact || this.pageClosed) return false;
    this.pageClosed = true;
    var ms = Date.now() - this.pageShownAt;
    if (ms < GLANCE_MS) return false;
    this.interactions++;
    this.emit({
      verb: 'experienced',
      object: { iri: this.iri, name: this.name, type: 'MicroSim' },  // page IRI: one PageEngagement
      concept: this.concept,
      result: { durationMs: ms, extensions: { 'run-ended-by': reason } }
    }, 'experienced  page  ' + LRS.isoDuration(ms) + '  (' + reason + ')');
    return true;
  };

  Sim.prototype._restartPage = function () {
    this.pageShownAt = Date.now();
    this.pageClosed = false;
  };

  Sim.prototype._buildPanel = function () {
    var self = this, o = this.opts;
    var host = typeof o.mount === 'string' ? document.querySelector(o.mount) : o.mount;
    var wrap = document.createElement('div');
    wrap.className = 'xapi-panel';

    var group = 'xapi-mode-' + this.id;
    wrap.innerHTML = (o.modeControls === false ? '' :
      '<div class="xapi-controls"><span class="xapi-controls-label">xAPI events:</span>' +
      '<label><input type="radio" name="' + group + '" value="full"> Full</label>' +
      '<label><input type="radio" name="' + group + '" value="compact"> Compact</label>' +
      '<button type="button" class="xapi-done">Simulate Done</button></div>') +
      '<div class="xapi-panel-header"><strong>' +
      esc(o.title || 'xAPI statements emitted:') + '</strong> <span class="xapi-count">0</span>' +
      '<span class="xapi-header-note"> &mdash; <span class="xapi-mode-text"></span> ' +
      'Nothing is sent to a server.</span></div><div class="xapi-log"></div>';
    (host || document.body).appendChild(wrap);

    this.panelEl = wrap;
    this.headerEl = wrap.querySelector('.xapi-panel-header');
    this.logEl = wrap.querySelector('.xapi-log');

    if (global.XapiJsonViewer) {
      var vb = document.createElement('button');
      vb.type = 'button';
      vb.className = 'xapi-view-btn';
      vb.textContent = 'View Formatted JSON ↗';
      vb.title = 'Open the most recent statement, formatted, in a new tab';
      vb.disabled = true;
      vb.addEventListener('click', function () { self.viewLatest(); });
      this.headerEl.appendChild(vb);
      this.viewBtn = vb;
    }
    Array.prototype.forEach.call(wrap.querySelectorAll('.xapi-controls input'), function (r) {
      r.addEventListener('change', function () { self.setCompact(r.value === 'compact'); });
    });
    var doneBtn = wrap.querySelector('.xapi-done');
    if (doneBtn) doneBtn.addEventListener('click', function () { self.done(); });

    this.kept.forEach(function (k) { self._render(k.st, k.text); });
    this._syncControls();
    this._update();
    if (this.session.policy && this.session.policy.teachingFromUrl) this._fitFrame();
  };

  // `?xapi=teaching` on a PRODUCTION sim: its iframe was sized without this panel (and often
  // has scrolling="no"), so the panel would be clipped. Grow the embedding iframe to fit it,
  // and keep following it: the log fills, and content ABOVE the panel can grow too (the FDM
  // chart reveals an info box on click). Same-origin only (frameElement is null otherwise),
  // and grow-only. Teaching sims never get here: their iframes are sized for the panel (the
  // add-xapi-events-to-microsim skill, step 8).
  //
  // One layout cannot be fitted: one sized by its frame (100vh, or html/body at 100%). Every
  // time the frame grows, the content above the panel grows by the same amount and pushes
  // the panel back out. That is detectable exactly: the panel moved down by as much as the
  // viewport grew. Stop there and say so, rather than chasing the frame forever.
  Sim.prototype._fitFrame = function () {
    var frame = null;
    try { frame = global.frameElement; } catch (e) { return; }
    if (!frame || !this.panelEl) return;
    var panel = this.panelEl;
    var base = frame.clientHeight;
    var last = null;
    var stopped = false;
    function fit() {
      if (stopped) return;
      var box = panel.getBoundingClientRect();
      var top = box.top + (global.scrollY || 0);
      var vh = global.innerHeight;
      if (last && vh > last.vh && top > last.top && Math.abs((top - last.top) - (vh - last.vh)) <= 2) {
        stopped = true;
        if (global.console) {
          global.console.warn('[lrs-sim] this sim is laid out to fill its frame (100vh or 100%), so ' +
            'the ?xapi=teaching panel cannot be fitted by growing the iframe. Pin its height while ' +
            'the panel is present: body:has(> .xapi-panel) <container> { height: <px> }');
        }
        return;
      }
      last = { top: top, vh: vh };
      var need = Math.ceil(top + box.height +
                           (parseFloat(global.getComputedStyle(panel).marginBottom) || 0) + 16);
      if (need > base && need > frame.clientHeight) frame.style.height = need + 'px';
    }
    fit();
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(fit);
      ro.observe(panel);                 // the log filling
      ro.observe(document.body);         // content above the panel growing (or the frame itself)
    }
  };

  Sim.prototype._render = function (st, text) {
    var self = this;
    function line(cls, content) {
      var d = document.createElement('div');
      d.className = cls;
      d.textContent = content;
      if (global.XapiJsonViewer) {
        d.classList.add('xapi-log-clickable');
        d.title = 'Click to view this statement formatted, in a new tab';
        d.addEventListener('click', function () { self.view(st); });
      }
      self._append(d);
    }
    if (text) line('xapi-log-line', '▸ ' + text);
    line('xapi-log-line xapi-log-raw', JSON.stringify(st));
    if (this.viewBtn) this.viewBtn.disabled = false;
  };

  Sim.prototype._append = function (el) {
    this.logEl.appendChild(el);
    while (this.logEl.childElementCount > MAX_LOG_LINES) this.logEl.removeChild(this.logEl.firstChild);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  };

  Sim.prototype._syncControls = function () {
    if (!this.panelEl) return;
    var want = this.compact ? 'compact' : 'full';
    Array.prototype.forEach.call(this.panelEl.querySelectorAll('.xapi-controls input'), function (r) {
      r.checked = r.value === want;
    });
  };

  Sim.prototype._update = function () {
    if (!this.panelEl) return;
    this.panelEl.querySelector('.xapi-count').textContent = String(this.count);
    this.panelEl.querySelector('.xapi-mode-text').textContent = this.opts.modeText
      ? this.opts.modeText(this.compact, this)
      : this.compact
        ? 'COMPACT (LRS-Lite): interactions are folded into ONE summary statement, emitted ' +
          'when the sim loses focus. Press Simulate Done to see it.'
        : 'FULL (full LRS): every interaction is its own statement, sent as it happens.';
  };

  // Page IRI + a stable local name (contract §2), typed Control (§5) so it lands in the
  // concept rollup and never becomes its own PageEngagement row.
  function control(sim, key, name) {
    return { iri: sim.iri + '#' + key, name: name || key, type: 'Control' };
  }

  // ── 1. Continuous parameter ───────────────────────────────────────────────
  //
  // o = { name, concept, min, max, initial, round, deadband }
  //   deadband  the least change worth a statement; default (max - min) / 60, about 60
  //             statements per full sweep, whatever the slider's numeric range
  //   initial   the control's starting value: the first move's previous-value, and where
  //             direction tracking starts
  //   round     decimal places for the reported value — report what the student SEES
  function Slider(sim, key, o) {
    this.sim = sim;
    this.key = key;
    this.o = o;
    this.deadband = o.deadband !== undefined ? o.deadband
      : o.max !== undefined && o.min !== undefined ? (o.max - o.min) / 60 : 0;
    this.lastEmitted = o.initial !== undefined ? o.initial : null;
    this.lastRaw = this.lastEmitted;
    this.lastDir = 0;
    this.pendingReversals = 0;
    this.count = 0;
  }

  // Every raw input event. Returns true if this one was reported (emitted or folded).
  Slider.prototype.input = function (v) {
    // Direction changes are counted on EVERY raw value, not just reported ones: a compact
    // summary has no order to recover them from later, so they must be carried explicitly.
    if (this.lastRaw !== null && v !== this.lastRaw) {
      var dir = v > this.lastRaw ? 1 : -1;
      if (this.lastDir && dir !== this.lastDir) this.pendingReversals++;
      this.lastDir = dir;
    }
    this.lastRaw = v;
    if (this.lastEmitted !== null &&
        (v === this.lastEmitted || Math.abs(v - this.lastEmitted) < this.deadband)) return false;
    this._report(v);
    return true;
  };

  // The value the student let go at (a `change` event): always captured, even inside the deadband.
  Slider.prototype.settle = function (v) {
    if (v === this.lastEmitted) return false;
    this._report(v);
    return true;
  };

  Slider.prototype._report = function (v) {
    var sim = this.sim, o = this.o;
    var prev = this.lastEmitted;
    this.lastEmitted = v;
    this.count++;
    sim.interactions++;
    var value = roundTo(v, o.round);
    var previous = prev === null ? null : roundTo(prev, o.round);
    var reversals = this.pendingReversals;
    this.pendingReversals = 0;

    if (sim.compact) {
      sim.session.touch(this.key, value, { concept: o.concept, reversals: reversals });
      sim._fold(this.key + '=' + value);
      return;
    }
    sim.emit({
      verb: 'interacted',
      object: control(sim, this.key, o.name),
      parent: sim.iri,
      concept: o.concept,
      result: { extensions: { value: value, 'previous-value': previous } }
    }, 'interacted  ' + this.key + '=' + value + (previous === null ? '' : ' (was ' + previous + ')'));
  };

  // ── 2. Discrete inspection ────────────────────────────────────────────────
  //
  // o = { name, concept }. study(mode, ms): mode says how strong the evidence is — 'hover'
  // (attention above HOVER_MS) or 'pinned' (a deliberate click). The same object either way.
  function Item(sim, key, o) {
    this.sim = sim;
    this.key = key;
    this.o = o;
  }

  Item.prototype.study = function (mode, ms) {
    var sim = this.sim, o = this.o;
    sim.interactions++;
    if (sim.compact) {
      sim.session.touch(this.key, undefined, { ms: ms, mode: mode, concept: o.concept });
      sim._fold(this.key + ' [' + mode + ']');
      return;
    }
    sim.emit({
      verb: 'interacted',
      object: control(sim, this.key, o.name),
      parent: sim.iri,
      concept: o.concept,
      // Duration on a Control reaches no rollup today (contract §12 item 9), but the log is
      // the system of record: "which step did they labour over?" is answerable from it.
      result: { durationMs: ms, extensions: { 'engagement-mode': mode } }
    }, 'interacted  ' + this.key + '  ' + (ms === undefined ? '' : LRS.isoDuration(ms) + '  ') +
       '[' + mode + ']' + (o.concept ? '  → ' + o.concept : ''));
  };

  // ── 3a. A discrete press ──────────────────────────────────────────────────
  //
  // o = { name, concept }. press(action) — contract §7.1: additive evidence the control was
  // touched. It carries no duration and is never emitted for a flush (tab hidden, idle, …).
  function Button(sim, key, o) {
    this.sim = sim;
    this.key = key;
    this.o = o;
  }

  Button.prototype.press = function (action) {
    var sim = this.sim, o = this.o;
    sim.interactions++;
    if (sim.compact) {
      sim.session.touch(this.key, undefined, { mode: action, concept: o.concept });
      sim._fold(this.key + ' [' + action + ']');
      return;
    }
    sim.emit({
      verb: 'interacted',
      object: control(sim, this.key, o.name),
      parent: sim.iri,
      concept: o.concept,
      result: { extensions: { action: action } }
    }, 'interacted  ' + this.key + '  [' + action + ']');
  };

  // ── 5. A checked answer ───────────────────────────────────────────────────
  //
  // o = { name, concept }. key names the QUESTION, not the thing it asks about: `q3` for a
  // fixed-order quiz (contract §2, one-based), `q-nucleus` when the order is shuffled.
  // answer(r), r = { success, response, score, durationMs, extensions }:
  //   success   REQUIRED (contract §3) — without it the concept rollup counts no attempt
  //   score     0..1; defaults to 1 for success, 0 otherwise
  //   response  what the student actually chose — a wrong answer's most useful part
  //
  // PASS-THROUGH IN BOTH MODES (Dan, 2026-09-26): an answer is never folded into a compact
  // summary. BKT reads the order of attempts (wrong, wrong, right is not right, wrong, wrong),
  // each answer keeps its question IRI, and the per-question rollups stay replayable (C-2).
  // Emit EVERY attempt, wrong ones included: a student who brute-forces six options must not
  // look like one who knew the answer.
  function Question(sim, key, o) {
    this.sim = sim;
    this.key = key;
    this.o = o;
  }

  Question.prototype.answer = function (r) {
    var sim = this.sim, o = this.o;
    r = r || {};
    sim.interactions++;
    sim.emit({
      verb: 'answered',
      object: { iri: sim.iri + '#' + this.key, name: o.name || this.key, type: 'Question' },
      parent: sim.iri,                      // §4 — required for `answered`
      concept: o.concept,
      result: {
        success: r.success,
        score: r.score !== undefined ? r.score : (r.success ? 1 : 0),
        response: r.response,
        durationMs: r.durationMs,
        extensions: r.extensions
      }
    }, 'answered  ' + this.key + '  ' + (r.response !== undefined ? r.response + '  ' : '') +
       (r.success ? '✓' : '✗') + (o.concept ? '  → ' + o.concept : ''));
    // In Compact, the answer also opens the sim's session (without folding into it), so a
    // visit made only of answers still ends in a summary carrying its time on the sim. Not
    // on a page with no metadata.json of its own, i.e. a chapter quiz. That page is not a
    // MicroSim, and a summary typed MicroSim would misname it (contract §5).
    if (sim.compact && sim.opts.metadata !== false) sim.session.answered();
  };

  // ── 3b. A Start/Pause run interval ────────────────────────────────────────
  //
  // Contract §7: one `experienced` per run, emitted when it closes, carrying the whole run
  // as result.duration; nothing on start. o.onStop(reason) runs whenever the run closes —
  // Pause, or a flush the sim did not ask for — so the sim can halt its animation.
  function Runner(sim, o) {
    this.sim = sim;
    this.o = o;
    this.running = false;
    this.startedAt = null;
  }

  Runner.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.startedAt = Date.now();
    this.sim.session.setBusy(true);   // a running sim is engaged even without input
  };

  // Returns the elapsed ms, or null if nothing was running.
  Runner.prototype.stop = function (reason) {
    if (!this.running) return null;
    var sim = this.sim;
    var ms = Date.now() - this.startedAt;
    this.running = false;
    this.startedAt = null;
    sim.session.setBusy(false);
    if (this.o.onStop) this.o.onStop(reason);

    if (ms < MISCLICK_MS) {
      sim.note('run under 250ms — treated as a mis-click, no statement emitted');
      return ms;
    }
    sim.interactions++;
    if (sim.compact) {
      sim.session.run(ms);
      sim._fold('run ' + LRS.isoDuration(ms));
      return ms;
    }
    sim.emit({
      verb: 'experienced',
      // The PAGE, not the button: the run is engagement with the simulation (contract §7).
      object: { iri: sim.iri, name: sim.name, type: 'MicroSim' },
      concept: sim.concept,
      result: { durationMs: ms, extensions: { 'run-ended-by': reason } }
    }, 'experienced  ' + LRS.isoDuration(ms) + '  (' + reason + ')');
    return ms;
  };

  global.LRSSim = {
    HOVER_MS: HOVER_MS,
    MISCLICK_MS: MISCLICK_MS,
    GLANCE_MS: GLANCE_MS,
    create: function (opts) { return new Sim(opts); }
  };
})(typeof window !== 'undefined' ? window : this);
