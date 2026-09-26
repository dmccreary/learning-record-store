// Bouncing Ball — width-responsive p5.js MicroSim, instrumented for xAPI.
// Adapted from the microsim-generator p5 template (MicroSim template version 2026.03).
// CANVAS_HEIGHT = 470 — the p5 canvas only; the xAPI log panel below it adds ~380px
// at a 700px content width, so index.md embeds main.html in an 860px iframe.
//
// WHY THIS SIM EXISTS
// -------------------
// It is the reference emitter for the **Start/Pause dwell pattern** in
// docs/specs/xapi-producer-contract-v1.md §7. A Start/Pause animation is the most
// common MicroSim control there is, and it is the one interaction the 2-verb contract
// could not express until §7 was written. This sim is the worked example.
//
// Like sine-wave, this sim NEVER POSTs. Statements are rendered in the panel below the
// canvas so you can read them. But the shape is exactly what `lrs loadgen` and a real
// gateway will accept — that is the point of a test emitter.

// ---------------------------------------------------------------- layout ----
let containerWidth;
let canvasWidth = 400;
let drawHeight = 400;
// Two control rows: Start + speed slider, then the xAPI mode radio + Simulate Done.
let controlHeight = 70;
let row1Y = drawHeight + 5;
let row2Y = drawHeight + 40;
let canvasHeight = drawHeight + controlHeight;
let containerHeight = canvasHeight;
let margin = 25;
let sliderLeftMargin = 160;
let defaultTextSize = 16;

// ------------------------------------------------------- simulation state ----
let r = 20;
let x = canvasWidth / 2;
let y = drawHeight / 2;
let speed = 3;
let dx = speed;
let dy = speed;
let speedSlider;
let startButton;
let modeRadio;
let doneButton;
let viewButton;   // opens the latest statement formatted in a new tab (xapi-json-viewer.js)
let lastStatement = null;

// The default state of every MicroSim must be paused. A simulation that animates as a
// student scrolls past is a distraction and a source of cognitive load. This is a
// MicroSim standard with no exceptions — and here it is also load-bearing for the
// contract: an auto-running sim would emit dwell the student never chose to spend.
let isRunning = false;

// ------------------------------------------------------------ xAPI config ----
// Canonical published page IRI — contract §1. site_url + nav path + trailing slash.
// Never main.html (that is the iframe payload, not the page).
const ACTIVITY_BASE_ID = 'https://dmccreary.github.io/learning-record-store/sims/bouncing-ball/';
// The textbook version IRI — contract §4. NOT this sim's page URL.
const VERSION_IRI = 'https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0';
// This sim's concept. Without it, concept_ids is empty and the statement is skipped by
// mv_student_concept_rollup's own WHERE notEmpty(concept_ids). Used for the whole-sim
// dwell statement (experienced) and the Start/Pause button's own interacted statements —
// both are evidence of engaging with the ball's motion.
const CONCEPT_ID = 'motion';
// The speed slider gets its OWN concept, not CONCEPT_ID (contract §6: one concept_id per
// statement). "Adjustable speed" is what a slider drag is actually evidence of; folding
// it into the umbrella 'motion' concept would blur two different things a downstream
// mastery model might want to tell apart. Same illustrative-placeholder status as
// CONCEPT_ID — see docs/sims/bouncing-ball/index.md for the full list of candidates.
const SPEED_CONCEPT_ID = 'adjustable-speed';

const MAX_LOG_LINES = 60;

// Start/Pause bracket a dwell interval. `runStartedAt` is the wall clock at Start, or
// null while paused. Pressing Start emits an `interacted` statement (the click itself is
// evidence — see recordControlAction below), but NOT an `experienced` interval: a student
// who starts the sim and walks away has produced no *dwell* evidence, and an unclosed
// interval is worse than no interval. Dwell still comes from exactly one statement, on
// Pause — contract §7's "why not two statements" argument is about not reconstructing
// duration from a start/pause pair, and that is unchanged here.
let runStartedAt = null;

// Deadband for the speed slider, matching sine-wave's Option C strategy (see
// docs/sims/sine-wave/index.md, "Architecture Trade-off"). The raw `input` event fires
// hundreds of times per drag; almost none of those values carry new information.
let lastEmittedSpeed = null;
const SPEED_EMIT_STEP = 1;

let statementCount = 0;

// ------------------------------------------------------ compact xAPI (LRS-Lite) ----
// metadata.json → "xapi": {"compact": true|false} sets the STARTING mode; the Full/Compact
// radio then switches it live (session.setCompact). When compact, the speed slider and the
// Start/Pause runs below are folded into ONE `experienced` summary that is emitted when
// the sim loses focus (docs/lrs-lite/index.md §6). When false — or when lrs-lite-sim.js is
// absent, as in the p5.js editor — the full per-interaction stream is emitted unchanged.
let xapi = null;

// ---------------------------------------------------------------- p5 setup ----
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, containerHeight);
  const mainElement = document.querySelector('main');
  canvas.parent(mainElement);

  // Centre the ball against the REAL canvas width. The declarations above run at module
  // load, when canvasWidth is still the 400 placeholder — so on any container wider than
  // 400px the ball would start visibly off-centre. updateCanvasSize() has now run.
  x = canvasWidth / 2;
  y = drawHeight / 2;

  textSize(defaultTextSize);

  startButton = createButton('Start');
  startButton.position(10, row1Y);
  startButton.mousePressed(toggleSimulation);

  speedSlider = createSlider(0, 20, speed);
  speedSlider.position(sliderLeftMargin, row1Y);
  speedSlider.size(canvasWidth - sliderLeftMargin - margin);
  speedSlider.input(handleSpeedInput);

  lastEmittedSpeed = speed;

  // Created BEFORE the visibilitychange listener below, so in compact mode the session
  // ends first — and beforeEnd closes a still-running interval into the summary.
  if (window.LRSLite) {
    xapi = LRSLite.sim({
      name: 'Bouncing Ball Simulation',
      concept: CONCEPT_ID,
      publish: publish,
      beforeEnd: function (reason) { if (isRunning) closeRunInterval(reason); }
    });

    // Full vs. Compact, so a reader can compare the two streams on the same actions.
    // Needs lrs-lite-sim.js, so it is not created in the p5.js editor (full mode only).
    modeRadio = createRadio();
    modeRadio.option('full', 'Full');
    modeRadio.option('compact', 'Compact');
    modeRadio.position(110, row2Y + 2);
    modeRadio.style('font-size', defaultTextSize + 'px');
    modeRadio.changed(handleModeChange);

    xapi.ready.then(function (session) {
      modeRadio.selected(session.compact ? 'compact' : 'full');
      showXapiMode(session);
    });
  }

  // Stands in for the host page taking focus away from the iframe (scroll away, tab
  // switch, leaving). Not a button press in the xAPI sense, so it emits no interacted.
  doneButton = createButton('Simulate Done');
  doneButton.position(xapi ? 290 : 10, row2Y);
  doneButton.mousePressed(simulateDone);

  // A one-line JSON statement is unreadable; this opens the latest one pretty-printed and
  // explained in a new tab. A tab, not an inline panel: this sim lives in a fixed-height
  // iframe, and a ~60-line statement would be clipped or force the iframe taller.
  const header = document.querySelector('.xapi-panel-header');
  if (window.XapiJsonViewer && header) {
    viewButton = createButton('View Formatted JSON ↗');
    viewButton.parent(header);
    viewButton.class('xapi-view-btn');
    viewButton.attribute('disabled', '');
    viewButton.attribute('title', 'Open the most recent statement, formatted, in a new tab');
    viewButton.mousePressed(function () { viewStatement(lastStatement); });
  }

  // If the student navigates away or hides the tab while the sim is running, the dwell
  // interval is still real evidence — flush it rather than lose it. Without this, the
  // common case (start it, get bored, close the tab) emits nothing at all.
  // `visibilitychange` is used rather than `beforeunload` because it is the only one
  // that fires reliably on mobile Safari.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && isRunning) {
      closeRunInterval('tab-hidden');
    }
  });

  describe(
    'Interactive bouncing ball simulation with a speed slider, a start/pause button, a ' +
    'Full/Compact xAPI mode selector, and a Simulate Done button. Emits xAPI statements ' +
    'to the log panel below the canvas.',
    LABEL
  );
}

// ----------------------------------------------------------------- p5 draw ----
function draw() {
  updateCanvasSize();

  fill('aliceblue');
  stroke('silver');
  strokeWeight(1);
  rect(0, 0, canvasWidth, drawHeight);

  fill('white');
  rect(0, drawHeight, canvasWidth, canvasHeight - drawHeight);
  noStroke();

  speed = speedSlider.value();

  fill('black');
  noStroke();
  textAlign(CENTER, TOP);
  textSize(32);
  text('Bouncing Ball Simulation', canvasWidth / 2, margin);

  if (isRunning) {
    dx = dx > 0 ? speed : -speed;
    dy = dy > 0 ? speed : -speed;

    x += dx;
    y += dy;

    if (x > canvasWidth - r || x < r) dx = dx * -1;
    if (y > drawHeight - r || y < r) dy = dy * -1;
  }

  fill('blue');
  circle(x, y, r * 2);

  fill('black');
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(defaultTextSize);
  text('Speed: ' + speed, 70, row1Y + 10);
  if (xapi) text('xAPI events:', 10, row2Y + 12);
}

// ------------------------------------------------------ Full / Compact / Done ----

function handleModeChange() {
  const compact = modeRadio.value() === 'compact';
  // Leaving compact flushes the open session as a 'mode-switch' summary, so the reader
  // sees what had been folded instead of losing it.
  xapi.setCompact(compact);
  appendLogLine('· switched to ' + (compact ? 'COMPACT' : 'FULL') + ' mode');
  showXapiMode(xapi);
}

// What the host page would trigger by taking focus from the iframe. Compact: end the
// session and emit its one summary. Full: close a running interval, exactly as a hidden
// tab does — there is nothing else open to flush.
function simulateDone() {
  if (xapi && xapi.compact) {
    const before = LRSLite.statements.length;
    xapi.end('simulated-done');
    if (LRSLite.statements.length === before) {
      appendLogLine('· simulated done — nothing folded yet, so no summary');
    } else if (viewButton) {
      appendLogLine('· summary emitted — press View Formatted JSON ↗ (or click the line) to read it');
    }
    return;
  }
  if (isRunning) {
    closeRunInterval('simulated-done');
  } else {
    appendLogLine('· simulated done — full mode already emitted everything; nothing open');
  }
}

// ------------------------------------------------------- the Start/Pause plan ----

function toggleSimulation() {
  if (isRunning) {
    // The click itself is evidence, distinct from the dwell interval it also closes.
    recordControlAction('pause');
    closeRunInterval('paused');
  } else {
    recordControlAction('start');
    // Start: take the clock. See runStartedAt above — the interval itself still emits
    // nothing until Pause (or a flush) closes it.
    runStartedAt = Date.now();
    isRunning = true;
    startButton.html('Pause');
    if (xapi) xapi.setBusy(true);   // a running sim is engaged even without input
  }
}

// A literal Start or Pause button press — always real evidence, unlike the dwell interval
// it may or may not close into something worth scoring (see the <250ms mis-click filter
// below). Deliberately NOT called from closeRunInterval(), which also runs on flushes
// (tab-hidden, idle, ...) that are not button presses at all.
function recordControlAction(action) {
  if (xapi && xapi.compact) {
    xapi.touch('start-pause-control', undefined, { mode: action, concept: CONCEPT_ID });
    appendLogLine('· ' + action + ' folded into the session summary');
    return;
  }
  emitControlInteracted(action);
}

function emitControlInteracted(action) {
  const statement = {
    id: generateUuid(),
    actor: {
      objectType: 'Agent',
      name: 'demo-student',
      account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
    },
    // `interacted` — contract §3. One button, one stable fragment id: the label toggles
    // between "Start" and "Pause" but that does not change what the control IS (contract
    // §2's "would an edit that does not change what the thing is change its IRI?" test).
    verb: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { 'en-US': 'interacted' } },
    object: {
      id: ACTIVITY_BASE_ID + '#start-pause-control',
      objectType: 'Activity',
      definition: {
        name: { 'en-US': 'Start/Pause Control' },
        // -> object_type 'Control' (contract §5), same reasoning as #speed-slider: a
        // fragment-qualified MicroSim would become its own PageEngagement row.
        type: 'http://adlnet.gov/expapi/activities/interaction'
      }
    },
    result: {
      extensions: { 'https://w3id.org/lrs/ext/action': action }
    },
    context: {
      contextActivities: {
        grouping: [{ id: VERSION_IRI }],
        parent: [{ id: ACTIVITY_BASE_ID }]
      },
      extensions: { 'https://w3id.org/lrs/ext/concept_id': CONCEPT_ID }
    },
    timestamp: new Date().toISOString()
  };

  publish(statement, 'interacted   ' + action + '-pause-control');
}

// Emit exactly ONE `experienced` statement carrying the elapsed run time. This is the
// whole Start/Pause contract (§7): one statement per run interval, not two.
function closeRunInterval(reason) {
  if (runStartedAt === null) return;

  const elapsedMs = Date.now() - runStartedAt;
  runStartedAt = null;
  isRunning = false;
  startButton.html('Start');
  if (xapi) xapi.setBusy(false);

  // A run shorter than a tick is a mis-click, not engagement. Emitting it would put
  // PT0S rows into dwell_ms_total and inflate statements_compressed with noise.
  if (elapsedMs < 250) {
    appendLogLine('· run under 250ms — treated as a mis-click, no statement emitted');
    return;
  }

  if (xapi && xapi.compact) {
    xapi.run(elapsedMs);
    appendLogLine('· run ' + msToIso8601Duration(elapsedMs) + ' folded into the session summary');
    return;
  }

  emitExperienced(elapsedMs, reason);
}

function emitExperienced(elapsedMs, reason) {
  const statement = {
    id: generateUuid(),
    actor: {
      objectType: 'Agent',
      name: 'demo-student',
      account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
    },
    // `experienced` carries dwell — contract §3.
    verb: { id: 'http://adlnet.gov/expapi/verbs/experienced', display: { 'en-US': 'experienced' } },
    object: {
      // The PAGE IRI, no fragment. This is what makes the statement roll up into
      // student_page_rollup as one PageEngagement row for this sim.
      id: ACTIVITY_BASE_ID,
      objectType: 'Activity',
      definition: {
        name: { 'en-US': 'Bouncing Ball Simulation' },
        // → object_type 'MicroSim' (contract §5). mv_student_page_rollup was widened
        // to `object_type IN ('Page','MicroSim')` on 2026-07-16 specifically so this
        // duration is not collected and then silently dropped.
        type: 'http://adlnet.gov/expapi/activities/simulation'
      }
    },
    result: {
      // result.duration is the required field for `experienced` (contract §3), and the
      // only thing feeding dwell_ms_total.
      duration: msToIso8601Duration(elapsedMs),
      extensions: {
        // Why the interval closed: 'paused' (student chose) or 'tab-hidden' (flushed).
        // Not consumed by any rollup — kept because a dwell number whose provenance is
        // unknown is hard to trust when the burst-test chart looks strange.
        'https://w3id.org/lrs/ext/run-ended-by': reason
      }
    },
    context: {
      contextActivities: {
        grouping: [{ id: VERSION_IRI }]
      },
      extensions: { 'https://w3id.org/lrs/ext/concept_id': CONCEPT_ID }
    },
    timestamp: new Date().toISOString()
  };

  publish(statement, 'experienced  ' + statement.result.duration + '  (' + reason + ')');
}

// ------------------------------------------------------------ slider events ----

function handleSpeedInput() {
  const value = speedSlider.value();
  if (lastEmittedSpeed !== null && Math.abs(value - lastEmittedSpeed) < SPEED_EMIT_STEP) {
    return; // deadband — see SPEED_EMIT_STEP
  }
  const previous = lastEmittedSpeed;
  lastEmittedSpeed = value;
  if (xapi && xapi.compact) {
    xapi.touch('speed-slider', value, { concept: SPEED_CONCEPT_ID });
    appendLogLine('· speed=' + value + ' folded into the session summary');
    return;
  }
  emitInteracted(value, previous);
}

function emitInteracted(value, previousValue) {
  const statement = {
    id: generateUuid(),
    actor: {
      objectType: 'Agent',
      name: 'demo-student',
      account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
    },
    // `interacted` — contract §3. A slider drag is neither an answer nor dwell.
    verb: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { 'en-US': 'interacted' } },
    object: {
      // Page IRI + control fragment.
      id: ACTIVITY_BASE_ID + '#speed-slider',
      objectType: 'Activity',
      definition: {
        name: { 'en-US': 'Speed Slider' },
        // → object_type 'Control' (contract §5). Deliberately NOT MicroSim: this IRI
        // carries a fragment and mv_student_page_rollup GROUPs BY object_id, so a
        // MicroSim-typed slider would become its own PageEngagement row for a page the
        // student visited once.
        type: 'http://adlnet.gov/expapi/activities/interaction'
      }
    },
    result: {
      extensions: {
        'https://w3id.org/lrs/ext/value': value,
        'https://w3id.org/lrs/ext/previous-value': previousValue === null ? null : previousValue
      }
    },
    context: {
      contextActivities: {
        grouping: [{ id: VERSION_IRI }],
        parent: [{ id: ACTIVITY_BASE_ID }]
      },
      extensions: { 'https://w3id.org/lrs/ext/concept_id': SPEED_CONCEPT_ID }
    },
    timestamp: new Date().toISOString()
  };

  publish(statement, 'interacted   speed=' + value +
    (previousValue === null ? '' : ' (was ' + previousValue + ')'));
}

// ------------------------------------------------------------------ output ----

function publish(statement, summary) {
  statementCount++;
  if (window.LRSLite) LRSLite.record(statement);
  lastStatement = statement;
  makeClickable(appendLogLine('▸ ' + summary), statement);
  makeClickable(appendRaw(statement), statement);
  if (viewButton) viewButton.removeAttribute('disabled');
  const counter = document.getElementById('stmt-count');
  if (counter) counter.textContent = String(statementCount);
}

// Say in the panel which mode metadata.json selected, so a reader knows what to expect.
function showXapiMode(session) {
  const el = document.getElementById('xapi-mode');
  if (!el) return;
  el.textContent = session.compact
    ? 'COMPACT (LRS-Lite) — slider moves, Start/Pause presses, and runs are folded into ONE ' +
      'experienced summary, emitted when the sim loses focus. Press Simulate Done to see it.'
    : 'FULL (full LRS) — every slider step and Start/Pause press is its own interacted ' +
      'statement; Pause also closes the run into one experienced statement.';
}

function appendLogLine(line) {
  const log = document.getElementById('xapi-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'xapi-log-line';
  div.textContent = line;
  log.appendChild(div);
  while (log.childElementCount > MAX_LOG_LINES) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
  return div;
}

function viewStatement(statement) {
  if (statement && window.XapiJsonViewer) {
    XapiJsonViewer.open(statement, { source: 'the Bouncing Ball MicroSim' });
  }
}

// Clicking a statement's log line opens that statement formatted.
function makeClickable(div, statement) {
  if (!div || !window.XapiJsonViewer) return;
  div.classList.add('xapi-log-clickable');
  div.title = 'Click to view this statement formatted, in a new tab';
  div.addEventListener('click', function () { viewStatement(statement); });
}

function appendRaw(statement) {
  const log = document.getElementById('xapi-log');
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'xapi-log-line xapi-log-raw';
  div.textContent = JSON.stringify(statement);
  log.appendChild(div);
  while (log.childElementCount > MAX_LOG_LINES) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
  return div;
}

// ----------------------------------------------------------------- helpers ----

// ms → ISO-8601 duration, the form result.duration requires (contract §3).
// The processor parses this back to duration_ms.
function msToIso8601Duration(ms) {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round((totalSeconds % 60) * 100) / 100;
  let out = 'PT';
  if (hours > 0) out += hours + 'H';
  if (minutes > 0) out += minutes + 'M';
  out += seconds + 'S';
  return out;
}

// RFC 4122 v4. The gateway assigns a UUIDv7 when `id` is absent, but supplying one is
// what makes gateway-side dedup on statement_id possible at all (contract §9).
function generateUuid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const rand = (window.crypto && window.crypto.getRandomValues)
      ? window.crypto.getRandomValues(new Uint8Array(1))[0] % 16
      : Math.floor(Math.random() * 16);
    const v = c === 'x' ? rand : (rand % 4) + 8;
    return v.toString(16);
  });
}

// These two functions must be present for width-responsive MicroSims.
// Always place them at the END of the code.
function windowResized() {
  updateCanvasSize();
  resizeCanvas(containerWidth, containerHeight);
  speedSlider.size(canvasWidth - sliderLeftMargin - margin);
  redraw();
}

function updateCanvasSize() {
  const container = document.querySelector('main').getBoundingClientRect();
  containerWidth = Math.floor(container.width);
  canvasWidth = containerWidth;
}
