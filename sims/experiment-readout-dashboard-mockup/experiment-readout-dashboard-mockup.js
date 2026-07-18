// Experiment Readout Dashboard Mockup
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 640;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let meanSlider, srmBox, guardBox;

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  meanSlider = createSlider(-20, 60, 30, 1); meanSlider.position(180, drawHeight + 10); meanSlider.size(canvasWidth - 180 - 40);
  srmBox = createCheckbox(' SRM', false); srmBox.position(10, drawHeight + 8);
  guardBox = createCheckbox(' Guardrail regression', false); guardBox.position(75, drawHeight + 8);
  describe('Mock experiment readout: judge whether a result is trustworthy enough to ship.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('#eef2f5');
  const srm = srmBox.checked(), guard = guardBox.checked();
  const d = meanSlider.value() / 100; // Cohen's d
  const control = 0.60, treatment = control + d * 0.15;

  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Experiment Readout', canvasWidth / 2, 8);

  const px = margin, pw = canvasWidth - 2 * margin;
  // Panel 1: allocation + SRM
  panel(px, 34, pw, 46);
  fill('#37474f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12); text('Allocation', px + 10, 40); textStyle(NORMAL);
  const planned = '50 / 50 planned', actual = srm ? '58 / 42 actual' : '52 / 48 actual';
  fill('#333'); textSize(11); text(planned + '   ·   ' + actual, px + 10, 58);
  badge(px + pw - 130, 44, 118, srm ? 'SRM: FAIL' : 'SRM: OK', srm ? '#c0392b' : '#2f9e6f');

  // Panel 2: outcome bars with CI whiskers
  panel(px, 88, pw, 150);
  fill('#37474f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12); text('Primary metric (mean ± 95% CI)', px + 10, 94); textStyle(NORMAL);
  const baseY = 224, maxH = 110, bw = 90;
  const ci = 0.05; // whisker half-width
  drawArm(px + 120, baseY, bw, control * maxH, '#5f7182', 'Control', control, ci * maxH);
  drawArm(px + 260, baseY, bw, treatment * maxH, '#2a9d8f', 'Treatment', treatment, ci * maxH);
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(12); text("Cohen's d = " + d.toFixed(2), px + 380, baseY - maxH / 2);

  // Panel 3: guardrails
  panel(px, 246, pw, 44);
  fill('#37474f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12); text('Guardrails', px + 10, 252); textStyle(NORMAL);
  badge(px + 120, 256, 90, 'Engagement', '#2f9e6f');
  badge(px + 220, 256, 90, 'Latency', '#2f9e6f');
  badge(px + 320, 256, 130, guard ? 'Completion: REGRESS' : 'Completion: OK', guard ? '#c0392b' : '#2f9e6f');

  // Panel 4: verdict
  let verdict, vcolor;
  if (srm) { verdict = 'Investigate assignment before trusting this result (SRM failure).'; vcolor = '#c0392b'; }
  else if (guard) { verdict = 'Primary metric improved, but a guardrail regressed — do not ship without review.'; vcolor = '#e9a23b'; }
  else if (d >= 0.2) { verdict = 'Clean, significant, guardrail-safe — Ready to ship.'; vcolor = '#2f9e6f'; }
  else { verdict = 'Effect too small / CI overlaps — not conclusive, keep running.'; vcolor = '#8b9bb0'; }
  fill(vcolor); noStroke(); rect(px, 300, pw, 44, 8);
  fill('#fff'); textAlign(CENTER, CENTER); textSize(13); text('Verdict: ' + verdict, px + pw / 2, 322, pw - 20);

  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(11); text('Treatment mean →', canvasWidth - 165, drawHeight + 20);
}
function panel(x, y, w, h) { fill('#fff'); stroke('#dbe4ea'); strokeWeight(1); rect(x, y, w, h, 6); noStroke(); }
function badge(x, y, w, txt, c) { fill(c); noStroke(); rect(x, y, w, 20, 10); fill('#fff'); textAlign(CENTER, CENTER); textSize(10); text(txt, x + w / 2, y + 10); }
function drawArm(x, baseY, w, h, c, label, val, ci) {
  fill(c); noStroke(); rect(x, baseY - h, w, h, 4);
  stroke('#333'); strokeWeight(1.5); line(x + w / 2, baseY - h - ci, x + w / 2, baseY - h + ci); line(x + w / 2 - 6, baseY - h - ci, x + w / 2 + 6, baseY - h - ci); line(x + w / 2 - 6, baseY - h + ci, x + w / 2 + 6, baseY - h + ci);
  noStroke(); fill('#333'); textAlign(CENTER, TOP); textSize(11); text(label, x, baseY + 4, w); fill('#fff'); textAlign(CENTER, BOTTOM); textSize(11); text(val.toFixed(2), x + w / 2, baseY - 4);
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); meanSlider.size(canvasWidth - 180 - 40); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
