// Threshold + Complementary Suppression Simulator
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 620;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 16;

let threshSlider, scenSelect, resetBtn;
let revealCell = null;

const BANDS = ['Beginning', 'Developing', 'Proficient', 'Advanced'];
const SCENARIOS = {
  'Safe — all above threshold': [12, 15, 20, 11],
  'Single suppression needed': [6, 8, 20, 15],
  'Complementary suppression needed': [6, 14, 20, 15]
};
let scenName = 'Complementary suppression needed';

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  threshSlider = createSlider(5, 20, 10, 1); threshSlider.position(140, drawHeight - 40); threshSlider.size(canvasWidth - 140 - margin - 40);
  scenSelect = createSelect(); scenSelect.position(10, drawHeight + 8);
  Object.keys(SCENARIOS).forEach(function (k) { scenSelect.option(k); });
  scenSelect.selected(scenName);
  scenSelect.changed(function () { scenName = scenSelect.value(); revealCell = null; });
  resetBtn = createButton('Reset'); resetBtn.position(canvasWidth - 70, drawHeight + 8); resetBtn.mousePressed(function () { threshSlider.value(10); scenName = 'Complementary suppression needed'; scenSelect.selected(scenName); revealCell = null; });
  describe('Threshold and complementary suppression over a small mastery-band table.', LABEL);
}
function compute() {
  const counts = SCENARIOS[scenName];
  const th = threshSlider.value();
  const total = counts.reduce(function (a, b) { return a + b; }, 0);
  const state = counts.map(function (c) { return c < th ? 'threshold' : 'visible'; });
  const hidden = state.filter(function (s) { return s === 'threshold'; }).length;
  let complementaryIdx = -1;
  if (hidden === 1) {
    // one hidden -> recoverable by subtraction; hide the smallest visible cell too
    let best = -1, bestVal = Infinity;
    counts.forEach(function (c, i) { if (state[i] === 'visible' && c < bestVal) { bestVal = c; best = i; } });
    if (best >= 0) { state[best] = 'complementary'; complementaryIdx = best; }
  }
  return { counts: counts, th: th, total: total, state: state, hidden: hidden, complementaryIdx: complementaryIdx };
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Threshold + Complementary Suppression', canvasWidth / 2, 8);

  const r = compute();
  const tx = margin, ty = 44, cw = (canvasWidth - 2 * margin) / 5, rowH = 40;
  // header
  ['Band', 'Count', 'Suppressed?', 'Rule', 'Row Total'];
  fill('#37474f'); noStroke(); rect(tx, ty, canvasWidth - 2 * margin, 26);
  fill('#fff'); textAlign(LEFT, CENTER); textSize(12);
  text('Mastery Band', tx + 8, ty + 13); text('Count', tx + cw + 8, ty + 13); text('Status', tx + 2 * cw + 8, ty + 13); text('Rule', tx + 3 * cw + 8, ty + 13); text('Row Total', tx + 4 * cw + 8, ty + 13);

  for (let i = 0; i < 4; i++) {
    const y = ty + 26 + i * rowH;
    const st = r.state[i];
    const bg = st === 'threshold' ? '#f0d0d0' : (st === 'complementary' ? '#f3e2c2' : '#fff');
    fill(bg); stroke('#c9d4dc'); strokeWeight(1); rect(tx, y, canvasWidth - 2 * margin, rowH);
    noStroke(); fill('#333'); textAlign(LEFT, CENTER); textSize(13);
    text(BANDS[i], tx + 8, y + rowH / 2);
    const shown = (st === 'visible') ? r.counts[i] : (revealCell === i ? r.counts[i] + ' (demo)' : '—');
    fill(st === 'visible' ? '#333' : '#b23b3b'); text(shown, tx + cw + 8, y + rowH / 2);
    fill('#333'); text(st === 'visible' ? 'shown' : (st === 'threshold' ? '🔒 threshold' : '🔒 complementary'), tx + 2 * cw + 8, y + rowH / 2);
    fill('#666'); textSize(11); text(st === 'threshold' ? 'below ' + r.th : (st === 'complementary' ? 'blocks subtraction' : '—'), tx + 3 * cw + 8, y + rowH / 2);
    textSize(13); fill('#333'); if (i === 0) text('' + r.total, tx + 4 * cw + 8, y + rowH / 2);
  }

  // status line
  noStroke(); textAlign(LEFT, TOP); textSize(12.5); fill('#7a2b2b');
  let status;
  if (r.hidden === 0) status = 'All cells are at or above the threshold of ' + r.th + ' — no suppression needed.';
  else if (r.complementaryIdx >= 0) status = BANDS[r.state.indexOf('threshold')] + ' is below ' + r.th + ' — suppressed. ' + BANDS[r.complementaryIdx] + ' is now ALSO suppressed: with the row total and the visible cells, ' + BANDS[r.state.indexOf('threshold')] + ' could otherwise be recovered by subtraction.';
  else status = r.hidden + ' cells are below ' + r.th + ' — suppressed. With ' + r.hidden + ' unknowns and one equation (the row total), no single value can be recovered by subtraction.';
  text(status, margin, drawHeight - 74, canvasWidth - 2 * margin, 70);

  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(12); text('Threshold: ' + r.th, margin, drawHeight - 30);
}
function mousePressed() {
  const ty = 44, rowH = 40;
  for (let i = 0; i < 4; i++) { const y = ty + 26 + i * rowH; if (mouseY > y && mouseY < y + rowH && mouseX > margin && mouseX < canvasWidth - margin) { revealCell = (revealCell === i ? null : i); return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); threshSlider.size(canvasWidth - 140 - margin - 40); resetBtn.position(canvasWidth - 70, drawHeight + 8); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
