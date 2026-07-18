// BKT Mastery Trace Stepper
// CANVAS_HEIGHT: 480
let containerWidth;
let canvasWidth = 620;
let drawHeight = 440;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let nextBtn, backBtn, resetBtn, seqSelect;
let stage = 0;
const prior = 0.30, slip = 0.10, guess = 0.20, transit = 0.15;
const SEQS = {
  'default (C, X, C, C)': [true, false, true, true],
  'all four correct': [true, true, true, true],
  'two slips in a row': [false, false, true, true]
};
let seqName = 'default (C, X, C, C)';

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  backBtn = createButton('Back'); backBtn.position(10, drawHeight + 8); backBtn.mousePressed(function () { if (stage > 0) stage--; });
  nextBtn = createButton('Next Observation'); nextBtn.position(70, drawHeight + 8); nextBtn.mousePressed(function () { if (stage < SEQS[seqName].length) stage++; });
  resetBtn = createButton('Reset'); resetBtn.position(210, drawHeight + 8); resetBtn.mousePressed(function () { stage = 0; });
  seqSelect = createSelect(); seqSelect.position(270, drawHeight + 8);
  Object.keys(SEQS).forEach(function (k) { seqSelect.option(k); });
  seqSelect.changed(function () { seqName = seqSelect.value(); stage = 0; });
  describe('Step through a BKT mastery computation observation by observation.', LABEL);
}
function series() {
  const seq = SEQS[seqName]; let L = prior; const steps = [{ L: L, cond: null, correct: null }];
  seq.forEach(function (correct) {
    let cond;
    if (correct) cond = (L * (1 - slip)) / (L * (1 - slip) + (1 - L) * guess);
    else cond = (L * slip) / (L * slip + (1 - L) * (1 - guess));
    const Lnext = cond + (1 - cond) * transit;
    steps.push({ L: Lnext, cond: cond, correct: correct });
    L = Lnext;
  });
  return steps;
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Mastery Trace: "Balancing Chemical Equations"', canvasWidth / 2, 8);

  // pinned parameters
  fill('#37474f'); textAlign(LEFT, TOP); textSize(12);
  text('prior=0.30   slip=0.10   guess=0.20   transit=0.15', margin, 34);

  const steps = series();
  const s = steps[stage];
  // equation panel
  fill('#eef2f5'); stroke('#c9d4dc'); strokeWeight(1); rect(margin, 56, canvasWidth - 2 * margin, 120, 8);
  noStroke(); fill('#1f7a6f'); textAlign(LEFT, TOP); textSize(13);
  if (stage === 0) {
    text('Stage 0 — before any observation:\n\nP(L0) = ' + prior.toFixed(2), margin + 12, 68);
  } else {
    const seq = SEQS[seqName];
    const correct = s.correct;
    const prevL = steps[stage - 1].L;
    const line1 = 'Observation ' + stage + ': ' + (correct ? 'CORRECT' : 'INCORRECT');
    let cond;
    if (correct) cond = 'P(L' + (stage - 1) + ' | correct) = (' + prevL.toFixed(2) + ' x 0.90) / (' + prevL.toFixed(2) + ' x 0.90 + ' + (1 - prevL).toFixed(2) + ' x 0.20) = ' + s.cond.toFixed(2);
    else cond = 'P(L' + (stage - 1) + ' | incorrect) = (' + prevL.toFixed(2) + ' x 0.10) / (' + prevL.toFixed(2) + ' x 0.10 + ' + (1 - prevL).toFixed(2) + ' x 0.80) = ' + s.cond.toFixed(2);
    const trans = 'P(L' + stage + ') = ' + s.cond.toFixed(2) + ' + (1 - ' + s.cond.toFixed(2) + ') x 0.15 = ' + s.L.toFixed(2);
    text(line1 + '\n\nEvidence Conditioning:\n' + cond + '\n\nLearning Transition:\n' + trans, margin + 12, 66, canvasWidth - 2 * margin - 24);
  }
  // running chart
  const chartX = margin + 30, chartY = 195, chartW = canvasWidth - 2 * margin - 40, chartH = drawHeight - chartY - 40;
  stroke('#ccc'); strokeWeight(1); line(chartX, chartY, chartX, chartY + chartH); line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);
  noStroke(); fill('#666'); textAlign(RIGHT, CENTER); textSize(10); text('1.0', chartX - 4, chartY); text('0.0', chartX - 4, chartY + chartH);
  const n = SEQS[seqName].length;
  stroke('#2a9d8f'); strokeWeight(3); noFill();
  beginShape();
  for (let i = 0; i <= stage; i++) vertex(chartX + (i / n) * chartW, chartY + chartH - steps[i].L * chartH);
  endShape();
  for (let i = 0; i <= stage; i++) { fill(i === stage ? '#e9a23b' : '#2a9d8f'); noStroke(); circle(chartX + (i / n) * chartW, chartY + chartH - steps[i].L * chartH, i === stage ? 10 : 7); }
  noStroke(); fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(13);
  text('Stage ' + stage + ' of ' + n + '   P(L' + stage + ') = ' + s.L.toFixed(2), margin, drawHeight - 26);
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
