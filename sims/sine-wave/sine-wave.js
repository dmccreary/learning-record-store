// p5.js code to generate a sine wave with amplitude, frequency and phase controls.
// Frequency is in cycles across the drawing width; the period (1/f, in widths) is
// displayed beside it rather than controlled, so students see both and how they relate.
// Width-responsive version.
//
// This MicroSim also simulates how a Learning Record Store (LRS) turns raw
// user interactions into xAPI statements, and how those statements get
// compressed into summary vertices (see docs/specs/lrs-spec-v1.md, section 4.3).
//   - "Show Raw xAPI Events" streams one simulated xAPI statement per detected
//     slider movement.
//   - "Show MicroSim Summary" compresses that stream into engagement metrics,
//     modeled on the ConceptMastery / MicroSimEngagement summary vertices.

let canvasWidth = 600;
let drawHeight = 400;
// Three slider rows, two checkbox rows, then the xAPI mode radio + Simulate Done.
let controlHeight = 150;
let xapiRowY = drawHeight + 122;
let canvasHeight = drawHeight + controlHeight;
let halfWidth, halfHeight;
let amplitude = 0.5;
// One unit on the y-axis, in pixels. Amplitude is measured in these units and the axis is
// tick-marked in them, so the number on the label is one you can read off the graph.
// 0.9 of the half-height leaves a margin above and below a full-amplitude wave.
const Y_UNIT_PX = 180;
let phase = 0;

let frequency = 2;

let amplitudeSlider, frequencySlider, phaseSlider;
let sliderLeftMargin = 130;

// ---- xAPI simulation configuration ----
// `concept` is the concept_id each slider is evidence for (contract §6: one per
// statement). Each slider is named for the concept it is evidence for, so the control a
// student drags and the concept_id in the stream use the same word.
const SLIDER_META = {
  amplitude: { min: 0, max: 1, default: 0.5, step: 0.01, label: 'Amplitude Slider', round: 2, concept: 'amplitude' },
  frequency: { min: 1, max: 10, default: 2, step: 0.1, label: 'Frequency Slider', round: 1, concept: 'frequency' },
  // Phase is an ANGLE in radians, the φ in y = A·sin(2πf·x + φ) — not a horizontal
  // shift in pixels, which would change meaning with the canvas width and the frequency.
  phase: { min: -Math.PI, max: Math.PI, default: 0, step: 0.01, label: 'Phase Slider', round: 2, concept: 'phase' }
};
// The canonical published page IRI — see docs/specs/xapi-producer-contract-v1.md §1.
// It is mkdocs.yml's site_url + this sim's nav path, with the trailing slash.
//
// This was previously 'https://dmccreary.github.io/microsims/sims/sine-wave/main.html',
// which was wrong twice: it named a different repo's Pages site, and it named
// main.html — the iframe payload — rather than the page. main.html is the load-bearing
// half: MkDocs serves index.md at /sims/sine-wave/ and copies main.html beside it, so
// citing main.html mints a SECOND IRI for one activity. student_page_rollup is
// ORDER BY (district_id, student_key, object_id), so two IRIs put one student's
// engagement in two rows that never merge — under-reporting the C-6 compression ratio
// at the producer, before any server-side code runs.
const ACTIVITY_BASE_ID = 'https://dmccreary.github.io/learning-record-store/sims/sine-wave/';
const MAX_STORED_EVENTS = 400;
const MAX_LOG_LINES_RENDERED = 150;

let stats = {};             // per-slider interaction stats
let xapiEvents = [];        // emitted statements, capped at MAX_STORED_EVENTS
let totalEventsGenerated = 0;   // detected slider movements (what full mode emits one statement per)
let emittedCount = 0;           // statements actually emitted (full: one per movement; compact: summaries)

// Compact xAPI (LRS-Lite). metadata.json → "xapi": {"compact": true|false}. When compact,
// slider movements are folded into ONE `experienced` summary emitted when the sim loses
// focus (docs/lrs-lite/index.md §6) — Option B in the trade-off table on this sim's page,
// but with the summary itself kept as a real statement in the log. When false, or when
// lrs-lite-sim.js is absent (the p5.js editor), the full stream below is emitted unchanged.
let xapi = null;
let firstInteractionTime = null;
let lastInteractionTime = null;

let showRawCheckbox, showSummaryCheckbox;
let modeRadio, doneButton;
let viewButton;   // opens the latest statement formatted in a new tab (xapi-json-viewer.js)
let rawPanel, rawLogEl, rawCountEl;
let summaryPanel;

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(canvasWidth, canvasHeight);
  var mainElement = document.querySelector('main');
  canvas.parent(mainElement);

  textFont('Arial');
  textSize(16);

  // Create sliders
  const a = SLIDER_META.amplitude;
  amplitudeSlider = createSlider(a.min, a.max, a.default, a.step);
  amplitudeSlider.position(sliderLeftMargin, drawHeight + 10);
  amplitudeSlider.size(canvasWidth - sliderLeftMargin - 15);

  const f = SLIDER_META.frequency;
  frequencySlider = createSlider(f.min, f.max, f.default, f.step);
  frequencySlider.position(sliderLeftMargin, drawHeight + 30);
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);

  const p = SLIDER_META.phase;
  phaseSlider = createSlider(p.min, p.max, p.default, p.step);
  phaseSlider.position(sliderLeftMargin, drawHeight + 50);
  phaseSlider.size(canvasWidth - sliderLeftMargin - 15);

  // Checkboxes for the xAPI event simulation
  showRawCheckbox = createCheckbox('Show Raw xAPI Events', false);
  showRawCheckbox.position(10, drawHeight + 74);
  showRawCheckbox.changed(toggleRawPanel);

  showSummaryCheckbox = createCheckbox('Show MicroSim Summary', false);
  showSummaryCheckbox.position(10, drawHeight + 98);
  showSummaryCheckbox.changed(toggleSummaryPanel);

  initStats();
  buildXapiPanels(mainElement);
  attachSliderXapiHandlers();

  if (window.LRSLite) {
    xapi = LRSLite.sim({ name: 'Sine Wave', concept: 'sine-wave', publish: publishStatement });

    // Full vs. Compact, so a reader can compare the two streams on the same slider moves.
    // Needs lrs-lite-sim.js, so it is not created in the p5.js editor (full mode only).
    modeRadio = createRadio();
    modeRadio.option('full', 'Full');
    modeRadio.option('compact', 'Compact');
    modeRadio.position(110, xapiRowY + 2);
    modeRadio.style('font-size', '16px');
    modeRadio.changed(handleModeChange);

    xapi.ready.then(function (session) {
      modeRadio.selected(session.compact ? 'compact' : 'full');
      updateRawCount();
    });
  }

  // Stands in for the host page taking focus away from the iframe (scroll away, tab
  // switch, leaving) — the moment a compact session emits its one summary.
  doneButton = createButton('Simulate Done');
  doneButton.position(xapi ? 290 : 10, xapiRowY);
  doneButton.mousePressed(simulateDone);

  // Refresh the summary panel once a second so elapsed-time metrics stay live.
  setInterval(() => {
    if (showSummaryCheckbox.checked()) {
      renderSummaryPanel();
    }
  }, 1000);

  describe('An interactive sine wave with sliders for amplitude, frequency and phase. ' +
    'Optional panels simulate the xAPI events those sliders would generate and a ' +
    'compressed summary of the resulting interaction evidence. A Full/Compact selector ' +
    'switches the xAPI stream, and Simulate Done ends a compact session.', LABEL);
}

function updateCanvasSize() {
  const mainElement = document.querySelector('main');
  if (mainElement) {
    canvasWidth = mainElement.offsetWidth;
  }
  halfWidth = canvasWidth / 2;
  halfHeight = drawHeight / 2;
}

function windowResized() {
  updateCanvasSize();
  resizeCanvas(canvasWidth, canvasHeight);

  // Resize sliders
  amplitudeSlider.size(canvasWidth - sliderLeftMargin - 15);
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);
  phaseSlider.size(canvasWidth - sliderLeftMargin - 15);
}

function draw() {
  // draw light borders around the drawing region and the controls
  stroke('silver');
  // make the background drawing region light blue
  fill('aliceblue');
  rect(0, 0, canvasWidth, drawHeight);
  // make the background of the controls white
  fill('white')
  rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke();
  amplitude = amplitudeSlider.value();
  frequency = frequencySlider.value();
  phase = phaseSlider.value();

  // draw the title
  strokeWeight(0);
  fill('black');
  textSize(24);
  textAlign(CENTER, TOP);
  text('Sine Wave', canvasWidth * 0.33, 10);

  // The slider's float step can land on -0.00; show a clean zero.
  const phaseShown = Math.abs(phase) < 0.005 ? 0 : phase;

  // draw slider labels
  textSize(16);
  textAlign(LEFT, BASELINE);
  text('Amplitude: ' + amplitude.toFixed(2), 10, drawHeight + 25);
  text('Frequency: ' + frequency.toFixed(1), 10, drawHeight + 45);
  text('Phase: '     + phaseShown.toFixed(2) + ' rad', 10, drawHeight + 65);
  if (xapi) text('xAPI events:', 10, xapiRowY + 16);

  // draw on the standard axis to keep text upright
  drawAxis();
  push();
  translate(canvasWidth / 2, drawHeight / 2);
  scale(1, -1); // Flip y-axis to make positive y up
  drawSineWave(amplitude, frequency, phase);
  pop();

  // Drawn LAST so the wave passes behind it, never over it.
  drawReadout(phaseShown);
}

// All four parameters in their units. The period is derived, not controlled: it is shown
// beside the frequency it comes from.
function drawReadout(phaseShown) {
  textSize(14);
  const lines = [
    'Amplitude A = ' + amplitude.toFixed(2) + ' (peak height on the y-axis)',
    'Frequency f = ' + frequency.toFixed(1) + ' cycles across the width',
    'Period T = 1/f = ' + (1 / frequency).toFixed(2) + ' of the width',
    'Phase φ = ' + phaseShown.toFixed(2) + ' rad = ' + Math.round(degrees(phaseShown)) + '°'
  ];
  const boxW = Math.max(...lines.map(t => textWidth(t))) + 12;
  noStroke();
  fill(255, 255, 255, 215);
  rect(4, 38, boxW, lines.length * 18 + 6, 4);
  fill('black');
  textAlign(LEFT, TOP);
  lines.forEach((t, i) => text(t, 10, 42 + i * 18));
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function drawAxis() {
  fill('black')
  strokeWeight(0)
  text('y', halfWidth - 20, 15)
  text('x', canvasWidth - 20, halfHeight + 20)
  stroke('gray')
  strokeWeight(1)
  setLineDash([5, 5])

  // horizontal line
  line(0, halfHeight, canvasWidth, halfHeight)
  // vertical line
  line(halfWidth, 0, halfWidth, drawHeight)

  // y-axis ticks in amplitude units, so A can be read directly off the graph
  setLineDash([1, 0])
  textSize(12)
  textAlign(LEFT, CENTER)
  for (const v of [-1, -0.5, 0.5, 1]) {
    const py = halfHeight - v * Y_UNIT_PX
    stroke('gray')
    line(halfWidth - 5, py, halfWidth + 5, py)
    noStroke()
    fill('dimgray')
    text(String(v), halfWidth + 8, py)
  }
}

function drawSineWave(amplitude, frequency, phase) {
  stroke('blue');
  strokeWeight(3)
  noFill();
  // turn off dash line
  setLineDash([1, 0])
  beginShape();
    // `frequency` cycles fit across the canvas width, whatever that width is.
    const k = TWO_PI * frequency / canvasWidth;
    for (let x = -canvasWidth / 2; x < canvasWidth / 2; x++) {
      let y = amplitude * Y_UNIT_PX * sin(k * x + phase);
      vertex(x, y);
    }
  endShape();
}

// ============================================================
// xAPI event simulation
//
// Every slider carries its own interaction stats (touched, min/max reached,
// direction reversals, attempts/successes per drag). Each slider movement is
// throttled into a stream of simulated xAPI "interacted" statements, and the
// stream is compressed on demand into summary metrics.
// ============================================================

function initStats() {
  for (const key of Object.keys(SLIDER_META)) {
    stats[key] = {
      touched: false,
      count: 0,               // xAPI statements emitted for this slider
      min: null,
      max: null,
      lastRawVal: SLIDER_META[key].default,
      lastDir: 0,
      reversals: 0,
      pendingReversals: 0,    // reversals not yet carried by a compact touch
      lastEmittedVal: null,
      attempts: 0,
      successes: 0,
      sessionStartVal: SLIDER_META[key].default,
      firstSeen: null,
      lastSeen: null
    };
  }
}

function attachSliderXapiHandlers() {
  amplitudeSlider.input(() => handleSliderInput('amplitude', amplitudeSlider.value()));
  amplitudeSlider.changed(() => handleSliderChanged('amplitude', amplitudeSlider.value()));

  frequencySlider.input(() => handleSliderInput('frequency', frequencySlider.value()));
  frequencySlider.changed(() => handleSliderChanged('frequency', frequencySlider.value()));

  phaseSlider.input(() => handleSliderInput('phase', phaseSlider.value()));
  phaseSlider.changed(() => handleSliderChanged('phase', phaseSlider.value()));
}

function handleSliderInput(key, value) {
  const s = stats[key];
  const meta = SLIDER_META[key];
  const now = new Date();

  if (firstInteractionTime === null) firstInteractionTime = now;
  lastInteractionTime = now;

  const delta = value - s.lastRawVal;
  const dir = delta > 0 ? 1 : (delta < 0 ? -1 : 0);
  if (dir !== 0) {
    if (s.lastDir !== 0 && dir !== s.lastDir) {
      s.reversals++;
      s.pendingReversals++;
    }
    s.lastDir = dir;
  }

  s.touched = true;
  s.min = (s.min === null) ? value : Math.min(s.min, value);
  s.max = (s.max === null) ? value : Math.max(s.max, value);
  s.lastRawVal = value;
  if (s.firstSeen === null) s.firstSeen = now;
  s.lastSeen = now;

  // Throttle the emitted statement stream to roughly 60 statements per full
  // sweep of the slider, regardless of that slider's numeric range.
  const range = meta.max - meta.min;
  const emitStep = range / 60;
  if (s.lastEmittedVal === null || Math.abs(value - s.lastEmittedVal) >= emitStep) {
    emitOrFold(key, value, s.lastEmittedVal);
    s.lastEmittedVal = value;
    s.count++;
  }

  if (showSummaryCheckbox.checked()) {
    renderSummaryPanel();
  }
}

function handleSliderChanged(key, value) {
  const s = stats[key];
  const meta = SLIDER_META[key];
  const delta = Math.abs(value - s.sessionStartVal);
  if (delta > 0) {
    s.attempts++;
    if (delta / (meta.max - meta.min) >= 0.15) {
      s.successes++;
    }
  }
  s.sessionStartVal = value;

  // Make sure the final settled value is always captured in the stream, even
  // if it fell below the emit-throttle step.
  if (s.lastEmittedVal !== value) {
    emitOrFold(key, value, s.lastEmittedVal);
    s.lastEmittedVal = value;
    s.count++;
  }

  if (showSummaryCheckbox.checked()) {
    renderSummaryPanel();
  }
}

// One detected movement: a full statement, or one more interaction folded into the
// compact session. The summary panel counts movements either way.
// The three per-concept understanding estimates in the summary panel are computed from
// range coverage, direction reversals, and movement count. Both streams must carry that
// evidence: the full stream implicitly (ordered values, one per movement), the compact
// summary explicitly (n, min, max, and `reversals`, since a summary has no order).
function emitOrFold(key, value, previousValue) {
  totalEventsGenerated++;
  const s = stats[key];
  const reversals = s.pendingReversals;
  s.pendingReversals = 0;
  if (xapi && xapi.compact) {
    xapi.touch(key + '-slider', roundForDisplay(key, value),
      { concept: SLIDER_META[key].concept, reversals: reversals });
    updateRawCount();
    return;
  }
  emitXapiStatement(key, value, previousValue);
}

// ---- Full / Compact / Simulate Done ----

// Both controls are about the raw stream, so make sure it is on screen.
function showRawStream() {
  if (!showRawCheckbox.checked()) {
    showRawCheckbox.checked(true);
    toggleRawPanel();
  }
}

function handleModeChange() {
  const compact = modeRadio.value() === 'compact';
  // Leaving compact flushes the open session as a 'mode-switch' summary, so folded
  // movements are emitted rather than lost.
  xapi.setCompact(compact);
  showRawStream();
  appendNoteLine('switched to ' + (compact ? 'COMPACT' : 'FULL') + ' mode');
  updateRawCount();
}

// What the host page would trigger by taking focus from the iframe. This sim has no
// Start/Pause, so in full mode there is no open interval to close: every movement is
// already a statement, and there is nothing left to send.
function simulateDone() {
  showRawStream();
  if (xapi && xapi.compact) {
    const before = emittedCount;
    xapi.end('simulated-done');
    if (emittedCount === before) {
      appendNoteLine('simulated done — no movements folded yet, so no summary');
    } else if (viewButton) {
      appendNoteLine('summary emitted — press View Formatted JSON ↗ (or click the line) to read it');
    }
    return;
  }
  appendNoteLine('simulated done — full mode already emitted every movement; nothing to flush');
}

function emitXapiStatement(key, value, previousValue) {
  const meta = SLIDER_META[key];
  const now = new Date();

  // Conforms to docs/specs/xapi-producer-contract-v1.md. This sim never POSTs — the
  // statements are rendered in the log panel below — but it is the shape students read
  // to learn what an xAPI statement looks like, so it has to be a shape the gateway
  // would actually accept.
  const statement = {
    id: generateUuid(),
    actor: {
      objectType: 'Agent',
      name: 'demo-student',
      // The demo tenant (contract §10). Was 'https://dmccreary.github.io/microsims/',
      // which named a website rather than an account namespace.
      account: { homePage: 'https://demo.example.edu', name: 'demo-student' }
    },
    // `interacted` — contract §3. A slider drag is neither an answer nor dwell.
    verb: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { 'en-US': 'interacted' } },
    object: {
      // Page IRI + control fragment. ACTIVITY_BASE_ID ends in '/', so this reads
      // …/sims/sine-wave/#amplitude-slider — one page, one control.
      id: ACTIVITY_BASE_ID + '#' + key + '-slider',
      objectType: 'Activity',
      definition: {
        name: { 'en-US': meta.label },
        // → object_type 'Control' (contract §5). Deliberately NOT MicroSim: this IRI
        // carries a fragment, and mv_student_page_rollup GROUPs BY object_id, so a
        // MicroSim-typed slider would become its own PageEngagement row.
        type: 'http://adlnet.gov/expapi/activities/interaction'
      }
    },
    result: {
      extensions: {
        // The LRS extension namespace (contract §6), not a per-site one.
        'https://w3id.org/lrs/ext/value': roundForDisplay(key, value),
        'https://w3id.org/lrs/ext/previous-value':
          previousValue === null ? null : roundForDisplay(key, previousValue)
      }
    },
    context: {
      contextActivities: {
        // grouping[0] is the TEXTBOOK VERSION IRI (contract §4) — not the page URL.
        // It previously held this sim's own page URL, which is what `parent` is for.
        grouping: [{ id: 'https://dmccreary.github.io/learning-record-store/textbook/lrs/v1.0.0' }],
        // The page this control belongs to.
        parent: [{ id: ACTIVITY_BASE_ID }]
      },
      // Without this, concept_ids is empty and mv_student_concept_rollup skips the
      // statement entirely via its own WHERE notEmpty(concept_ids).
      extensions: { 'https://w3id.org/lrs/ext/concept_id': meta.concept }
    },
    timestamp: now.toISOString()
  };

  publishStatement(statement);
}

// Every emitted statement — a full-mode `interacted` or a compact-mode summary — lands here.
function publishStatement(statement) {
  emittedCount++;
  if (window.LRSLite) LRSLite.record(statement);
  xapiEvents.push(statement);
  if (xapiEvents.length > MAX_STORED_EVENTS) {
    xapiEvents.shift();
  }
  if (viewButton) viewButton.removeAttribute('disabled');

  if (showRawCheckbox.checked()) {
    appendRawLogLine(statement);
  } else {
    updateRawCount();
  }
}

function roundForDisplay(key, value) {
  const places = SLIDER_META[key].round;
  const factor = Math.pow(10, places);
  return Math.round(value * factor) / factor;
}

function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function computeConceptScore(s, meta) {
  if (!s.touched) return 0;
  const coverage = constrain((s.max - s.min) / (meta.max - meta.min), 0, 1);
  const reversalScore = constrain(s.reversals / 4, 0, 1);
  const interactionScore = constrain(s.count / 15, 0, 1);
  return constrain(0.45 * coverage + 0.30 * reversalScore + 0.25 * interactionScore, 0, 1);
}

function understandingLabel(score) {
  if (score >= 0.67) return 'High confidence';
  if (score >= 0.34) return 'Moderate confidence';
  if (score > 0) return 'Low confidence';
  return 'No evidence yet';
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ---- DOM panels ----

function buildXapiPanels(mainElement) {
  // Raw event stream panel
  rawPanel = document.createElement('div');
  rawPanel.className = 'xapi-panel xapi-raw-panel';
  rawPanel.style.display = 'none';

  const rawHeader = document.createElement('div');
  rawHeader.className = 'xapi-panel-header';
  const rawTitle = document.createElement('strong');
  rawTitle.textContent = 'Raw xAPI Event Stream';
  rawCountEl = document.createElement('span');
  rawCountEl.className = 'xapi-header-note';
  rawCountEl.textContent = ' — one statement per detected slider movement (0 so far)';
  rawHeader.appendChild(rawTitle);
  rawHeader.appendChild(rawCountEl);

  // A one-line JSON statement is unreadable; this opens the latest one pretty-printed and
  // explained in a new tab. A tab, not an inline panel: this sim lives in a fixed-height
  // iframe, and a ~60-line statement would be clipped or force the iframe taller.
  if (window.XapiJsonViewer) {
    viewButton = createButton('View Formatted JSON ↗');
    viewButton.parent(rawHeader);
    viewButton.class('xapi-view-btn');
    viewButton.attribute('disabled', '');
    viewButton.attribute('title', 'Open the most recent statement, formatted, in a new tab');
    viewButton.mousePressed(() => viewStatement(xapiEvents[xapiEvents.length - 1]));
  }

  rawLogEl = document.createElement('div');
  rawLogEl.className = 'xapi-log';

  rawPanel.appendChild(rawHeader);
  rawPanel.appendChild(rawLogEl);

  // Summary panel
  summaryPanel = document.createElement('div');
  summaryPanel.className = 'xapi-panel xapi-summary-panel';
  summaryPanel.style.display = 'none';

  mainElement.appendChild(rawPanel);
  mainElement.appendChild(summaryPanel);
}

function toggleRawPanel() {
  const on = showRawCheckbox.checked();
  rawPanel.style.display = on ? 'block' : 'none';
  if (on) renderFullRawLog();
}

function toggleSummaryPanel() {
  const on = showSummaryCheckbox.checked();
  summaryPanel.style.display = on ? 'block' : 'none';
  if (on) renderSummaryPanel();
}

function viewStatement(statement) {
  if (statement && window.XapiJsonViewer) {
    XapiJsonViewer.open(statement, { source: 'the Sine Wave MicroSim' });
  }
}

// One raw log line. Clicking it opens that statement formatted.
function makeLogLine(statement) {
  const line = document.createElement('div');
  line.className = 'xapi-log-line';
  line.textContent = JSON.stringify(statement);
  if (window.XapiJsonViewer) {
    line.classList.add('xapi-log-clickable');
    line.title = 'Click to view this statement formatted, in a new tab';
    line.addEventListener('click', () => viewStatement(statement));
  }
  return line;
}

function appendRawLogLine(statement) {
  const line = makeLogLine(statement);
  rawLogEl.appendChild(line);
  while (rawLogEl.children.length > MAX_LOG_LINES_RENDERED) {
    rawLogEl.removeChild(rawLogEl.firstChild);
  }
  rawLogEl.scrollTop = rawLogEl.scrollHeight;
  updateRawCount();
}

// A log line that is NOT a statement. Not kept in xapiEvents, so re-rendering drops it.
function appendNoteLine(msg) {
  const line = document.createElement('div');
  line.className = 'xapi-log-line xapi-log-note';
  line.textContent = '· ' + msg;
  rawLogEl.appendChild(line);
  rawLogEl.scrollTop = rawLogEl.scrollHeight;
}

function renderFullRawLog() {
  rawLogEl.innerHTML = '';
  const toShow = xapiEvents.slice(-MAX_LOG_LINES_RENDERED);
  for (const stmt of toShow) {
    rawLogEl.appendChild(makeLogLine(stmt));
  }
  rawLogEl.scrollTop = rawLogEl.scrollHeight;
  updateRawCount();
}

function updateRawCount() {
  const noun = emittedCount === 1 ? 'statement' : 'statements';
  if (xapi && xapi.compact) {
    rawCountEl.textContent = ' — COMPACT (LRS-Lite): one summary statement per session, emitted ' +
      'when the sim loses focus — press Simulate Done (' + emittedCount + ' ' + noun +
      ' emitted, ' + totalEventsGenerated + ' slider movements so far)';
  } else {
    rawCountEl.textContent = ' — FULL (full LRS): one statement per detected slider movement (' +
      emittedCount + ' ' + noun + ' so far)';
  }
}

function renderSummaryPanel() {
  const keys = Object.keys(SLIDER_META);
  const touchedAll = keys.every(k => stats[k].touched);
  const dwellMs = firstInteractionTime ? (lastInteractionTime - firstInteractionTime) : 0;

  const conceptRows = keys.map(k => {
    const s = stats[k];
    const meta = SLIDER_META[k];
    // Label by CONCEPT, and name the slider too if it ever differs from its concept.
    const label = capitalize(meta.concept) + (meta.concept !== k ? ' (' + k + ' slider)' : '');
    return { key: k, label, s, meta, score: computeConceptScore(s, meta) };
  });

  const overallScore = conceptRows.reduce((sum, r) => sum + r.score, 0) / conceptRows.length;
  const completed = touchedAll && overallScore >= 0.5;

  let html = '';
  html += '<div class="xapi-panel-header"><strong>MicroSim Summary</strong>' +
    '<span class="xapi-header-note"> — compressed from ' + totalEventsGenerated + ' slider movements</span></div>';

  html += '<div class="xapi-concept-scores">';
  for (const r of conceptRows) {
    html += '<div class="xapi-concept-score">' +
      '<div class="xapi-overall-label">' + r.label + ' — probability of understanding</div>' +
      '<div class="xapi-bar"><div class="xapi-bar-fill" style="width:' + Math.round(r.score * 100) + '%"></div></div>' +
      '<div class="xapi-overall-value">' + Math.round(r.score * 100) + '% — ' + understandingLabel(r.score) + '</div>' +
      '</div>';
  }
  html += '</div>';

  html += '<div class="xapi-overall xapi-overall-combined">' +
    '<div class="xapi-overall-label">Combined — all three concepts</div>' +
    '<div class="xapi-bar"><div class="xapi-bar-fill" style="width:' + Math.round(overallScore * 100) + '%"></div></div>' +
    '<div class="xapi-overall-value">' + Math.round(overallScore * 100) + '% — ' + understandingLabel(overallScore) + '</div>' +
    '<div class="xapi-caveat">Each score is a heuristic estimate based on that slider\'s range coverage, direction reversals and interaction count — not a formal assessment.</div>' +
    '</div>';

  html += '<div class="xapi-table-wrap"><table class="xapi-table"><thead><tr>' +
    '<th>Concept</th><th>Tried?</th><th>Events</th><th>Range Explored</th><th>Direction Changes</th>' +
    '</tr></thead><tbody>';
  for (const r of conceptRows) {
    const rangeExplored = r.s.touched
      ? Math.round(((r.s.max - r.s.min) / (r.meta.max - r.meta.min)) * 100)
      : 0;
    html += '<tr>' +
      '<td>' + r.label + '</td>' +
      '<td>' + (r.s.touched ? '<span class="xapi-yes">Yes</span>' : '<span class="xapi-no">No</span>') + '</td>' +
      '<td>' + r.s.count + '</td>' +
      '<td>' + rangeExplored + '%</td>' +
      '<td>' + r.s.reversals + '</td>' +
      '</tr>';
  }
  html += '</tbody></table></div>';

  html += '<div class="xapi-vertex">' +
    '<div class="xapi-vertex-title">Simulated <code>MicroSimEngagement</code> summary vertex</div>' +
    '<div class="xapi-vertex-grid">' +
    '<div><span>interaction_count</span><b>' + totalEventsGenerated + '</b></div>' +
    '<div><span>dwell_ms_total</span><b>' + dwellMs + '</b></div>' +
    '<div><span>completed</span><b>' + (completed ? 'true' : 'false') + '</b></div>' +
    '<div><span>statements_compressed</span><b>' + totalEventsGenerated + '</b></div>' +
    '<div><span>tried_all_controls</span><b>' + (touchedAll ? 'true' : 'false') + '</b></div>' +
    '<div><span>last_seen</span><b>' + (lastInteractionTime ? lastInteractionTime.toLocaleTimeString() : '—') + '</b></div>' +
    '</div></div>';

  summaryPanel.innerHTML = html;
}
