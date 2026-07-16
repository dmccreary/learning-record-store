// p5.js code to generate a sine wave with amplitude, frequency and period controls
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
let controlHeight = 120;
let canvasHeight = drawHeight + controlHeight;
let halfWidth, halfHeight;
let amplitude = 100;
let phase = 0;

let amplitudeSlider, periodSlider, phaseSlider;
let sliderLeftMargin = 120;

// ---- xAPI simulation configuration ----
const SLIDER_META = {
  amplitude: { min: 0, max: 200, default: 100, label: 'Amplitude Slider', round: 0 },
  period: { min: 1, max: 100, default: 50, label: 'Period Slider', round: 0 },
  phase: { min: -Math.PI * 100, max: Math.PI * 100, default: 0, label: 'Phase Slider', round: 2 }
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
let xapiEvents = [];        // stored statements, capped at MAX_STORED_EVENTS
let totalEventsGenerated = 0;
let firstInteractionTime = null;
let lastInteractionTime = null;

let showRawCheckbox, showSummaryCheckbox;
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
  amplitudeSlider = createSlider(SLIDER_META.amplitude.min, SLIDER_META.amplitude.max, SLIDER_META.amplitude.default);
  amplitudeSlider.position(sliderLeftMargin, drawHeight + 10);
  amplitudeSlider.size(canvasWidth - sliderLeftMargin - 15);

  periodSlider = createSlider(SLIDER_META.period.min, SLIDER_META.period.max, SLIDER_META.period.default);
  periodSlider.position(sliderLeftMargin, drawHeight + 30);
  periodSlider.size(canvasWidth - sliderLeftMargin - 15);

  phaseSlider = createSlider(SLIDER_META.phase.min, SLIDER_META.phase.max, SLIDER_META.phase.default, 0.01);
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

  // Refresh the summary panel once a second so elapsed-time metrics stay live.
  setInterval(() => {
    if (showSummaryCheckbox.checked()) {
      renderSummaryPanel();
    }
  }, 1000);

  describe('An interactive sine wave with sliders for amplitude, period and phase. ' +
    'Optional panels simulate the xAPI events those sliders would generate and a ' +
    'compressed summary of the resulting interaction evidence.', LABEL);
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
  periodSlider.size(canvasWidth - sliderLeftMargin - 15);
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
  period = periodSlider.value();
  phase = phaseSlider.value();

  // draw the title
  strokeWeight(0);
  fill('black');
  textSize(24);
  textAlign(CENTER, TOP);
  text('Sine Wave', canvasWidth * 0.33, 10);

  // draw slider labels
  textSize(16);
  textAlign(LEFT, BASELINE);
  text('Amplitude: ' + amplitude/100,    10, drawHeight + 25);
  text('Period: '    + period,           10, drawHeight + 45);
  text('Phase: '     + phase.toFixed(2), 10, drawHeight + 65);

  // draw on the standard axis to keep text upright
  drawAxis();
  translate(canvasWidth / 2, drawHeight / 2);

  scale(1, -1); // Flip y-axis to make positive y up
  drawSineWave(amplitude, 1/period, phase);
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
}

function drawSineWave(amplitude, frequency, phase) {
  stroke('blue');
  strokeWeight(3)
  noFill();
  // turn off dash line
  setLineDash([1, 0])
  beginShape();
    for (let x = -canvasWidth / 2; x < canvasWidth / 2; x++) {
      let y = amplitude * sin(frequency * (x - phase));
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

  periodSlider.input(() => handleSliderInput('period', periodSlider.value()));
  periodSlider.changed(() => handleSliderChanged('period', periodSlider.value()));

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
    emitXapiStatement(key, value, s.lastEmittedVal);
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
    emitXapiStatement(key, value, s.lastEmittedVal);
    s.lastEmittedVal = value;
    s.count++;
  }

  if (showSummaryCheckbox.checked()) {
    renderSummaryPanel();
  }
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
      extensions: { 'https://w3id.org/lrs/ext/concept_id': key }
    },
    timestamp: now.toISOString()
  };

  totalEventsGenerated++;
  xapiEvents.push(statement);
  if (xapiEvents.length > MAX_STORED_EVENTS) {
    xapiEvents.shift();
  }

  if (showRawCheckbox.checked()) {
    appendRawLogLine(statement);
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

function appendRawLogLine(statement) {
  const line = document.createElement('div');
  line.className = 'xapi-log-line';
  line.textContent = JSON.stringify(statement);
  rawLogEl.appendChild(line);
  while (rawLogEl.children.length > MAX_LOG_LINES_RENDERED) {
    rawLogEl.removeChild(rawLogEl.firstChild);
  }
  rawLogEl.scrollTop = rawLogEl.scrollHeight;
  updateRawCount();
}

function renderFullRawLog() {
  rawLogEl.innerHTML = '';
  const toShow = xapiEvents.slice(-MAX_LOG_LINES_RENDERED);
  for (const stmt of toShow) {
    const line = document.createElement('div');
    line.className = 'xapi-log-line';
    line.textContent = JSON.stringify(stmt);
    rawLogEl.appendChild(line);
  }
  rawLogEl.scrollTop = rawLogEl.scrollHeight;
  updateRawCount();
}

function updateRawCount() {
  const noun = totalEventsGenerated === 1 ? 'statement' : 'statements';
  rawCountEl.textContent = ' — one statement per detected slider movement (' + totalEventsGenerated + ' ' + noun + ' so far)';
}

function renderSummaryPanel() {
  const keys = Object.keys(SLIDER_META);
  const touchedAll = keys.every(k => stats[k].touched);
  const dwellMs = firstInteractionTime ? (lastInteractionTime - firstInteractionTime) : 0;

  const conceptRows = keys.map(k => {
    const s = stats[k];
    const meta = SLIDER_META[k];
    return { key: k, label: capitalize(k), s, meta, score: computeConceptScore(s, meta) };
  });

  const overallScore = conceptRows.reduce((sum, r) => sum + r.score, 0) / conceptRows.length;
  const completed = touchedAll && overallScore >= 0.5;

  let html = '';
  html += '<div class="xapi-panel-header"><strong>MicroSim Summary</strong>' +
    '<span class="xapi-header-note"> — compressed from ' + totalEventsGenerated + ' raw statements</span></div>';

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
