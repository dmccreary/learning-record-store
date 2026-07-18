// BKT Soft-Correctness Mapping
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 600;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 16;

let typeSelect, valSlider, compareBox;
let evType = 'Graded quiz response';

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  typeSelect = createSelect(); typeSelect.position(10, drawHeight + 8);
  ['Graded quiz response', 'Page dwell time', 'MicroSim interaction depth'].forEach(function (o) { typeSelect.option(o); });
  typeSelect.changed(function () { evType = typeSelect.value(); });
  valSlider = createSlider(0, 100, 60, 1); valSlider.position(220, drawHeight + 10); valSlider.size(canvasWidth - 220 - 130);
  compareBox = createCheckbox(' Compare to graded', false); compareBox.position(canvasWidth - 150, drawHeight + 8);
  describe('Map raw evidence signals to a soft correctness value and a blending weight.', LABEL);
}
function compute() {
  const v = valSlider.value() / 100;
  if (evType === 'Graded quiz response') return { soft: v > 0.5 ? 1 : 0, weight: 1.0, expl: 'A graded response is binary and authoritative — full weight 1.0.' };
  if (evType === 'Page dwell time') return { soft: 1 - Math.exp(-v * 2.2), weight: 0.30, expl: 'Dwell time rises smoothly with engagement, but reading is weak evidence of mastery — capped weight 0.30.' };
  return { soft: 1 - Math.exp(-v * 2.6), weight: 0.30, expl: 'Interaction depth suggests engagement, not correctness — non-binary, so capped weight 0.30.' };
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('Evidence -> Soft Correctness + Weight', canvasWidth / 2, 10);

  const r = compute();
  const barW = 120, gap = 60, baseY = 320, maxH = 200;
  let startX = canvasWidth / 2 - (barW + gap / 2);
  // soft correctness
  drawBar(startX, baseY, barW, r.soft * maxH, '#2a9d8f', 'Soft Correctness', r.soft.toFixed(2));
  // weight
  drawBar(startX + barW + gap, baseY, barW, r.weight * maxH, '#9aa7b4', 'Evidence Weight', r.weight.toFixed(2));
  if (compareBox.checked()) {
    // amber reference weight 1.0
    stroke('#e9a23b'); strokeWeight(2); line(margin, baseY - 1.0 * maxH, canvasWidth - margin, baseY - 1.0 * maxH);
    noStroke(); fill('#b8791f'); textAlign(LEFT, BOTTOM); textSize(11); text('graded weight = 1.0', margin + 4, baseY - 1.0 * maxH - 2);
  }
  noStroke(); fill('#444'); textAlign(CENTER, TOP); textSize(12.5);
  text(r.expl, margin, 340, canvasWidth - 2 * margin);
  fill('#888'); textSize(11);
  text('Open question: the spec leaves the component that owns this mapping undecided.', margin, 384, canvasWidth - 2 * margin);
  // slider label
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(12);
  const unit = evType === 'Page dwell time' ? Math.round(valSlider.value() * 3) + ' s' : (evType === 'MicroSim interaction depth' ? Math.round(valSlider.value() / 5) + ' interactions' : (valSlider.value() > 50 ? 'correct' : 'incorrect'));
  text('Signal: ' + unit, 10, drawHeight - 8);
}
function drawBar(x, baseY, w, h, c, label, valTxt) {
  noStroke(); fill('#e9edf0'); rect(x, baseY - 200, w, 200, 4);
  fill(c); rect(x, baseY - h, w, h, 4);
  fill('#333'); textAlign(CENTER, TOP); textSize(12); text(label, x, baseY + 6, w);
  fill('#fff'); textAlign(CENTER, BOTTOM); textStyle(BOLD); textSize(14); text(valTxt, x + w / 2, baseY - 6); textStyle(NORMAL);
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); valSlider.size(canvasWidth - 220 - 130); compareBox.position(canvasWidth - 150, drawHeight + 8); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 600; canvasWidth = containerWidth; }
