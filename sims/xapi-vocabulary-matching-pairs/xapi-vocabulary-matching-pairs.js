// xAPI Vocabulary Matching Pairs
// CANVAS_HEIGHT: 440
// Drag a term tile (left) onto its definition (right). Correct locks green; wrong flashes red.
let containerWidth;
let canvasWidth = 500;
let drawHeight = 400;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;
let defaultTextSize = 14;

let shuffleBtn, revealBtn, resetBtn;
let seed = 12345;
let attempts = 0;

const PAIRS = [
  { term: 'Actor', def: 'Who did the thing (the learner or group).' },
  { term: 'Verb', def: 'The action performed, from a shared vocabulary.' },
  { term: 'Object Activity', def: 'What the actor acted on (the activity).' },
  { term: 'Activity Type', def: 'The category the object activity belongs to.' },
  { term: 'Result', def: 'The outcome: score, success, or duration.' },
  { term: 'Context', def: 'The circumstances: course, section, registration.' }
];

let terms = [];   // draggable
let defs = [];    // targets
let dragging = null;
let flash = null; // {x,y,t}

function seededShuffle(arr) {
  // simple LCG for reproducible order within a session
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function layout() {
  const colW = (canvasWidth - 3 * margin) / 2;
  const tileH = 46, gap = 10;
  const top = 60;
  terms = PAIRS.map(function (p, i) {
    return { term: p.term, def: p.def, x: margin, y: top + i * (tileH + gap), w: colW, h: tileH, hx: margin, hy: top + i * (tileH + gap), locked: false };
  });
  const order = seededShuffle(PAIRS.map(function (_, i) { return i; }));
  defs = order.map(function (idx, i) {
    return { def: PAIRS[idx].def, term: PAIRS[idx].term, x: margin * 2 + colW, y: top + i * (tileH + gap), w: colW, h: tileH, filled: false };
  });
}

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(defaultTextSize);
  layout();
  shuffleBtn = createButton('Shuffle');
  shuffleBtn.position(10, drawHeight + 8);
  shuffleBtn.mousePressed(function () { seed = (seed + 7919) & 0x7fffffff; attempts = 0; layout(); });
  revealBtn = createButton('Reveal All');
  revealBtn.position(90, drawHeight + 8);
  revealBtn.mousePressed(revealAll);
  resetBtn = createButton('Reset');
  resetBtn.position(190, drawHeight + 8);
  resetBtn.mousePressed(function () { attempts = 0; layout(); });
  describe('Drag-and-drop matching of six xAPI vocabulary terms to their definitions.', LABEL);
}

function revealAll() {
  if (attempts < 1) return;
  terms.forEach(function (t) {
    const d = defs.find(function (dd) { return dd.term === t.term; });
    if (d) { t.x = d.x; t.y = d.y; t.locked = true; d.filled = true; }
  });
}

function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill();
  rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);

  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('Match each term to its definition', canvasWidth / 2, 12);

  // definition targets
  textSize(defaultTextSize);
  defs.forEach(function (d) {
    fill(d.filled ? '#e7f4ef' : '#f4efe1'); stroke('#c9bb93'); strokeWeight(1);
    rect(d.x, d.y, d.w, d.h, 6);
    noStroke(); fill('#333'); textAlign(LEFT, CENTER);
    text(d.def, d.x + 8, d.y + d.h / 2, d.w - 16, d.h);
  });

  // term tiles
  const matched = terms.filter(function (t) { return t.locked; }).length;
  terms.forEach(function (t) {
    if (t === dragging) return;
    drawTerm(t);
  });
  if (dragging) drawTerm(dragging);

  // flash
  if (flash) {
    noFill(); stroke('#e05a5a'); strokeWeight(3);
    rect(flash.x, flash.y, terms[0].w, terms[0].h, 6);
    flash.t--; if (flash.t <= 0) flash = null;
  }

  // score
  noStroke(); fill('#1f7a6f'); textAlign(RIGHT, CENTER); textSize(defaultTextSize);
  text('Matched: ' + matched + ' / 6', canvasWidth - margin, drawHeight + controlHeight / 2);
  if (matched === 6) { fill('#2f6b48'); textAlign(CENTER, BOTTOM); text('All matched! You know the vocabulary.', canvasWidth / 2, drawHeight - 6); }
}

function drawTerm(t) {
  fill(t.locked ? '#2a9d8f' : '#3bab9d');
  stroke(t.locked ? '#2f6b48' : '#1f7a6f'); strokeWeight(t.locked ? 3 : 1);
  rect(t.x, t.y, t.w, t.h, 6);
  noStroke(); fill('#fff'); textAlign(CENTER, CENTER); textStyle(BOLD);
  text(t.term, t.x + t.w / 2, t.y + t.h / 2); textStyle(NORMAL);
}

function mousePressed() {
  for (let i = terms.length - 1; i >= 0; i--) {
    const t = terms[i];
    if (!t.locked && mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) {
      dragging = t; t.ox = mouseX - t.x; t.oy = mouseY - t.y; return;
    }
  }
}
function mouseDragged() { if (dragging) { dragging.x = mouseX - dragging.ox; dragging.y = mouseY - dragging.oy; } }
function mouseReleased() {
  if (!dragging) return;
  const t = dragging;
  const target = defs.find(function (d) { return !d.filled && mouseX > d.x && mouseX < d.x + d.w && mouseY > d.y && mouseY < d.y + d.h; });
  attempts++;
  if (target && target.term === t.term) {
    t.x = target.x; t.y = target.y; t.locked = true; target.filled = true;
  } else {
    flash = { x: t.hx, y: t.hy, t: 30 };
    t.x = t.hx; t.y = t.hy;
  }
  dragging = null;
}

function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); layout(); redraw(); }
function updateCanvasSize() {
  const c = document.querySelector('main').getBoundingClientRect();
  containerWidth = Math.floor(c.width) || 500;
  canvasWidth = containerWidth;
}
