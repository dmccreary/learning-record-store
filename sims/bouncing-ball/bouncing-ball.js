// Bouncing Ball — width-responsive p5.js MicroSim, instrumented for xAPI.
// Adapted from the microsim-generator p5 template (MicroSim template version 2026.03).
// CANVAS_HEIGHT = 430 — the p5 canvas only. When the config says `teaching: true`, the xAPI
// panel below it (log + Full/Compact + Simulate Done) adds the rest: index.md sizes the iframe.
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
let row1Y = drawHeight + 5;
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

// ------------------------------------------------------------------- xAPI ----
// Through the shared runtime (docs/js/lrs-sim.js), which decides Full vs. Compact from config
// (this sim's metadata.json `xapi` block, over the book's lrs-config.js), builds every
// statement, and renders the statement log. Without it (pasted into the p5.js editor) the
// sim still runs; it just emits nothing.
//
// The sim's concept, for the run intervals and the Start/Pause presses: both are evidence
// of engaging with the ball's motion. The speed slider gets its OWN concept (contract §6: one
// concept_id per statement) — "adjustable speed" is what a slider drag is evidence of.
// Both are illustrative placeholders; see index.md, "Concepts This Sim Could Evidence".
const CONCEPT_ID = 'motion';
const SPEED_CONCEPT_ID = 'adjustable-speed';

let lrs = null;           // the LRSSim instance (`x` is already the ball's position)
let speedEvidence;        // continuous parameter
let startPause;           // discrete press: contract §7.1, carries no duration
let run;                  // the run interval: contract §7, one `experienced` per run

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
  speedSlider.input(() => { if (lrs) speedEvidence.input(speedSlider.value()); });

  if (window.LRSSim) {
    lrs = LRSSim.create({
      name: 'Bouncing Ball Simulation',
      concept: CONCEPT_ID,
      source: 'the Bouncing Ball MicroSim',
      mount: '#xapi-slot',
      modeText: (compact) => compact
        ? 'COMPACT (LRS-Lite) — slider moves, Start/Pause presses, and runs are folded into ONE ' +
          'experienced summary, emitted when the sim loses focus. Press Simulate Done to see it.'
        : 'FULL (full LRS) — every slider step and Start/Pause press is its own interacted ' +
          'statement; Pause also closes the run into one experienced statement.'
    });
    // Deadband of 1: the slider moves in whole steps of 1, and each one is a new speed.
    speedEvidence = lrs.slider('speed-slider', {
      name: 'Speed Slider', concept: SPEED_CONCEPT_ID, initial: speed, deadband: 1
    });
    // One button, one stable fragment: the label toggles between Start and Pause, but that
    // does not change what the control IS (contract §2).
    startPause = lrs.button('start-pause-control', { name: 'Start/Pause Control', concept: CONCEPT_ID });
    // Whatever closes a run — Pause, or a flush such as a hidden tab or Simulate Done —
    // the ball stops, so no run is ever left open behind the student's back.
    run = lrs.runner({ onStop: () => setRunning(false) });
  }

  describe(
    'Interactive bouncing ball simulation with a speed slider and a start/pause button. ' +
    'Teaching versions show the xAPI statements it emits in a panel below the canvas.',
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
}

// ------------------------------------------------------- the Start/Pause plan ----

function setRunning(on) {
  isRunning = on;
  startButton.html(on ? 'Pause' : 'Start');
}

// A press is evidence the control was touched (§7.1); the run is the dwell (§7). Pause
// reports both: the click, then the interval it closes.
function toggleSimulation() {
  if (isRunning) {
    if (lrs) { startPause.press('pause'); run.stop('paused'); }
    setRunning(false);
  } else {
    if (lrs) { startPause.press('start'); run.start(); }
    setRunning(true);
  }
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
