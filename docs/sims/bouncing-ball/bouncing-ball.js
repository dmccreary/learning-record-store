// Bouncing Ball — width-responsive p5.js MicroSim, instrumented for xAPI.
// Adapted from the microsim-generator p5 template (MicroSim template version 2026.03).
// CANVAS_HEIGHT = 430 — use this for the iframe height that embeds this MicroSim.
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
let controlHeight = 30;
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
// mv_student_concept_rollup's own WHERE notEmpty(concept_ids).
const CONCEPT_ID = 'motion';

const MAX_LOG_LINES = 60;

// Start/Pause bracket a dwell interval. `runStartedAt` is the wall clock at Start, or
// null while paused. Start emits NOTHING — a student who starts the sim and walks away
// has produced no evidence, and an unclosed interval is worse than no interval.
let runStartedAt = null;

// Deadband for the speed slider, matching sine-wave's Option C strategy (see
// docs/sims/sine-wave/index.md, "Architecture Trade-off"). The raw `input` event fires
// hundreds of times per drag; almost none of those values carry new information.
let lastEmittedSpeed = null;
const SPEED_EMIT_STEP = 1;

let statementCount = 0;

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
  startButton.position(10, drawHeight + 5);
  startButton.mousePressed(toggleSimulation);

  speedSlider = createSlider(0, 20, speed);
  speedSlider.position(sliderLeftMargin, drawHeight + 5);
  speedSlider.size(canvasWidth - sliderLeftMargin - margin);
  speedSlider.input(handleSpeedInput);

  lastEmittedSpeed = speed;

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
    'Interactive bouncing ball simulation with a speed slider and a start/pause button. ' +
    'Emits xAPI statements to the log panel below the canvas.',
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
  text('Speed: ' + speed, 70, drawHeight + 15);
}

// ------------------------------------------------------- the Start/Pause plan ----

function toggleSimulation() {
  if (isRunning) {
    closeRunInterval('paused');
  } else {
    // Start: take the clock and emit nothing. See runStartedAt above.
    runStartedAt = Date.now();
    isRunning = true;
    startButton.html('Pause');
  }
}

// Emit exactly ONE `experienced` statement carrying the elapsed run time. This is the
// whole Start/Pause contract (§7): one statement per run interval, not two.
function closeRunInterval(reason) {
  if (runStartedAt === null) return;

  const elapsedMs = Date.now() - runStartedAt;
  runStartedAt = null;
  isRunning = false;
  startButton.html('Start');

  // A run shorter than a tick is a mis-click, not engagement. Emitting it would put
  // PT0S rows into dwell_ms_total and inflate statements_compressed with noise.
  if (elapsedMs < 250) {
    appendLogLine('· run under 250ms — treated as a mis-click, no statement emitted');
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
      extensions: { 'https://w3id.org/lrs/ext/concept_id': CONCEPT_ID }
    },
    timestamp: new Date().toISOString()
  };

  publish(statement, 'interacted   speed=' + value +
    (previousValue === null ? '' : ' (was ' + previousValue + ')'));
}

// ------------------------------------------------------------------ output ----

function publish(statement, summary) {
  statementCount++;
  appendLogLine('▸ ' + summary);
  appendRaw(statement);
  const counter = document.getElementById('stmt-count');
  if (counter) counter.textContent = String(statementCount);
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
