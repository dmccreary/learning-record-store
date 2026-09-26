// p5.js code to generate a sine wave with amplitude, frequency and phase controls.
// Frequency is in cycles across the drawing width; the period (1/f, in widths) is
// displayed beside it rather than controlled, so students see both and how they relate.
// Width-responsive version.
//
// This MicroSim also teaches how a Learning Record Store (LRS) turns raw user interactions
// into xAPI statements, and how those statements get compressed into summary vertices
// (see docs/specs/lrs-spec-v1.md, section 4.3).
//   - Teaching versions show the raw xAPI statement stream below the canvas, with its
//     Full/Compact switch and Simulate Done (docs/js/lrs-sim.js renders all of it).
//   - "Show MicroSim Summary" compresses the slider movements into engagement metrics,
//     modeled on the ConceptMastery / MicroSimEngagement summary vertices.

let canvasWidth = 600;
let drawHeight = 400;
// Three slider rows, then the Show MicroSim Summary checkbox.
let controlHeight = 100;
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

let stats = {};                 // per-slider interaction stats, for the MicroSim Summary panel
let totalEventsGenerated = 0;   // slider movements reported (one Full statement, or one Compact fold, each)
let firstInteractionTime = null;
let lastInteractionTime = null;

// ---- xAPI, through the shared runtime (docs/js/lrs-sim.js) ----
// Each slider is one continuous-parameter control. lrs-sim.js decides Full vs. Compact from
// config (this sim's metadata.json `xapi` block, over the book's lrs-config.js), builds every
// statement, and renders the statement log with its Full/Compact switch and Simulate Done —
// only when the config says `teaching: true`. Without lrs-sim.js (pasted into the p5.js
// editor) the sim still runs; it just emits nothing.
let x = null;
let sliderEvidence = {};        // SLIDER_META key -> x.slider(...) handle

let showSummaryCheckbox;
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

  showSummaryCheckbox = createCheckbox('Show MicroSim Summary', false);
  showSummaryCheckbox.position(10, drawHeight + 74);
  showSummaryCheckbox.changed(toggleSummaryPanel);

  initStats();
  // The statement log mounts ABOVE the summary panel, so it goes in its own slot first.
  const rawSlot = document.createElement('div');
  mainElement.appendChild(rawSlot);
  summaryPanel = document.createElement('div');
  summaryPanel.className = 'xapi-panel xapi-summary-panel';
  summaryPanel.style.display = 'none';
  mainElement.appendChild(summaryPanel);
  attachSliderHandlers();

  if (window.LRSSim) {
    x = LRSSim.create({
      name: 'Sine Wave',
      concept: 'sine-wave',
      source: 'the Sine Wave MicroSim',
      mount: rawSlot,
      title: 'Raw xAPI Event Stream — statements emitted:',
      foldNotes: false,       // compact mode's log stays silent until the summary
      modeText: (compact, sim) => compact
        ? 'COMPACT (LRS-Lite): one summary statement per session, emitted when the sim loses ' +
          'focus — press Simulate Done (' + sim.interactions + ' slider movements folded so far).'
        : 'FULL (full LRS): one statement per detected slider movement.'
    });
    for (const key of Object.keys(SLIDER_META)) {
      const m = SLIDER_META[key];
      sliderEvidence[key] = x.slider(key + '-slider', {
        name: m.label, concept: m.concept, min: m.min, max: m.max, initial: m.default, round: m.round
      });
    }
  }

  // Refresh the summary panel once a second so elapsed-time metrics stay live.
  setInterval(() => {
    if (showSummaryCheckbox.checked()) {
      renderSummaryPanel();
    }
  }, 1000);

  describe('An interactive sine wave with sliders for amplitude, frequency and phase, and an ' +
    'optional compressed summary of the interaction evidence. Teaching versions also show ' +
    'the raw xAPI event stream below the canvas.', LABEL);
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
// Slider evidence
//
// Every slider keeps its own interaction stats (touched, min/max reached, direction
// reversals, attempts/successes per drag) for the MicroSim Summary panel, and reports each
// movement to lrs-sim.js, which emits it (Full) or folds it into the session (Compact).
// ============================================================

function initStats() {
  for (const key of Object.keys(SLIDER_META)) {
    stats[key] = {
      touched: false,
      count: 0,               // movements reported for this slider
      min: null,
      max: null,
      lastRawVal: SLIDER_META[key].default,
      lastDir: 0,
      reversals: 0,
      attempts: 0,
      successes: 0,
      sessionStartVal: SLIDER_META[key].default,
      firstSeen: null,
      lastSeen: null
    };
  }
}

function attachSliderHandlers() {
  amplitudeSlider.input(() => handleSliderInput('amplitude', amplitudeSlider.value()));
  amplitudeSlider.changed(() => handleSliderChanged('amplitude', amplitudeSlider.value()));

  frequencySlider.input(() => handleSliderInput('frequency', frequencySlider.value()));
  frequencySlider.changed(() => handleSliderChanged('frequency', frequencySlider.value()));

  phaseSlider.input(() => handleSliderInput('phase', phaseSlider.value()));
  phaseSlider.changed(() => handleSliderChanged('phase', phaseSlider.value()));
}

function handleSliderInput(key, value) {
  const s = stats[key];
  const now = new Date();

  if (firstInteractionTime === null) firstInteractionTime = now;
  lastInteractionTime = now;

  const delta = value - s.lastRawVal;
  const dir = delta > 0 ? 1 : (delta < 0 ? -1 : 0);
  if (dir !== 0) {
    if (s.lastDir !== 0 && dir !== s.lastDir) s.reversals++;
    s.lastDir = dir;
  }

  s.touched = true;
  s.min = (s.min === null) ? value : Math.min(s.min, value);
  s.max = (s.max === null) ? value : Math.max(s.max, value);
  s.lastRawVal = value;
  if (s.firstSeen === null) s.firstSeen = now;
  s.lastSeen = now;

  // The runtime's deadband (range/60) throttles the stream to about 60 statements per full
  // sweep; it returns true when this movement was reported.
  if (x && sliderEvidence[key].input(value)) {
    s.count++;
    totalEventsGenerated++;
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

  // The value the student let go at is always reported, even inside the deadband.
  if (x && sliderEvidence[key].settle(value)) {
    s.count++;
    totalEventsGenerated++;
  }

  if (showSummaryCheckbox.checked()) {
    renderSummaryPanel();
  }
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

// ---- MicroSim Summary panel ----

function toggleSummaryPanel() {
  const on = showSummaryCheckbox.checked();
  summaryPanel.style.display = on ? 'block' : 'none';
  if (on) renderSummaryPanel();
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
