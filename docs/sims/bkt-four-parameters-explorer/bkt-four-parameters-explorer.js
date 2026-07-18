// BKT Four Parameters Explorer
// CANVAS_HEIGHT: 480
let containerWidth;
let canvasWidth = 620;
let drawHeight = 440;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let paramSlider, resetBtn;
let selected = 0;
const P = [
  { key: 'prior', label: 'Prior P(L0)', val: 0.30, def: 'Prior: the chance the student already knew the concept before any evidence.', c: '#2a9d8f' },
  { key: 'slip', label: 'Slip p_slip', val: 0.10, def: 'Slip: the chance a student who KNOWS it answers incorrectly anyway.', c: '#e9a23b' },
  { key: 'guess', label: 'Guess p_guess', val: 0.20, def: 'Guess: the chance a student who does NOT know it answers correctly by luck.', c: '#d16a8a' },
  { key: 'transit', label: 'Transit p_transit', val: 0.15, def: 'Transit: the chance the student learns the concept between one observation and the next.', c: '#4c956c' }
];
const SEQ = [true, false, true, true, true]; // correct, incorrect, correct, correct, correct

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  paramSlider = createSlider(0, 1, P[0].val, 0.01);
  paramSlider.position(120, drawHeight - 40);
  paramSlider.size(canvasWidth - 120 - margin - 50);
  paramSlider.input(function () { P[selected].val = paramSlider.value(); });
  resetBtn = createButton('Reset to defaults'); resetBtn.position(10, drawHeight + 8);
  resetBtn.mousePressed(function () { P[0].val = 0.30; P[1].val = 0.10; P[2].val = 0.20; P[3].val = 0.15; paramSlider.value(P[selected].val); });
  describe('Explore the four BKT parameters and their effect on a mastery trajectory.', LABEL);
}
function trajectory() {
  const prior = P[0].val, slip = P[1].val, guess = P[2].val, transit = P[3].val;
  let L = prior; const out = [L];
  SEQ.forEach(function (correct) {
    let cond;
    if (correct) cond = (L * (1 - slip)) / (L * (1 - slip) + (1 - L) * guess);
    else cond = (L * slip) / (L * slip + (1 - L) * (1 - guess));
    L = cond + (1 - cond) * transit;
    out.push(L);
  });
  return out;
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('BKT Parameters -> Mastery Trajectory', canvasWidth / 2, 8);

  // cards
  const cw = (canvasWidth - 2 * margin - 3 * 8) / 4, cy = 38, ch = 56;
  P.forEach(function (p, i) {
    const x = margin + i * (cw + 8);
    fill(i === selected ? p.c : color(red(color(p.c)), green(color(p.c)), blue(color(p.c)), 120));
    stroke(i === selected ? '#333' : 'transparent'); strokeWeight(2); rect(x, cy, cw, ch, 6);
    noStroke(); fill('#fff'); textAlign(CENTER, TOP); textSize(11.5); textStyle(BOLD); text(p.label, x + 3, cy + 6, cw - 6);
    textSize(16); text(p.val.toFixed(2), x + cw / 2, cy + 30); textStyle(NORMAL);
  });

  // definition line
  fill('#1f7a6f'); textAlign(CENTER, TOP); textSize(12.5); text(P[selected].def, margin, cy + ch + 8, canvasWidth - 2 * margin);

  // line chart
  const chartX = margin + 30, chartY = 150, chartW = canvasWidth - 2 * margin - 40, chartH = drawHeight - chartY - 70;
  stroke('#ccc'); strokeWeight(1); line(chartX, chartY, chartX, chartY + chartH); line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);
  noStroke(); fill('#666'); textAlign(RIGHT, CENTER); textSize(10);
  text('1.0', chartX - 4, chartY); text('0.0', chartX - 4, chartY + chartH);
  const traj = trajectory();
  stroke(P[selected].c); strokeWeight(3); noFill();
  beginShape();
  traj.forEach(function (v, i) { vertex(chartX + (i / (traj.length - 1)) * chartW, chartY + chartH - v * chartH); });
  endShape();
  traj.forEach(function (v, i) { fill(P[selected].c); noStroke(); circle(chartX + (i / (traj.length - 1)) * chartW, chartY + chartH - v * chartH, 7); });
  noStroke(); fill('#333'); textAlign(CENTER, TOP); textSize(10);
  ['start', 'C', 'X', 'C', 'C', 'C'].forEach(function (lbl, i) { text(lbl, chartX + (i / (traj.length - 1)) * chartW, chartY + chartH + 4); });
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(13); text(P[selected].label + ': ' + P[selected].val.toFixed(2), margin, drawHeight - 30);
}
function mousePressed() {
  const cw = (canvasWidth - 2 * margin - 3 * 8) / 4, cy = 38, ch = 56;
  for (let i = 0; i < 4; i++) { const x = margin + i * (cw + 8); if (mouseX > x && mouseX < x + cw && mouseY > cy && mouseY < cy + ch) { selected = i; paramSlider.value(P[i].val); return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); paramSlider.size(canvasWidth - 120 - margin - 50); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
