// MicroSim Impact: Observational vs Controlled
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let revealBtn, resetBtn;
let revealed = false;

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  revealBtn = createButton('Reveal confound'); revealBtn.position(10, drawHeight + 8); revealBtn.mousePressed(function () { revealed = true; });
  resetBtn = createButton('Reset'); resetBtn.position(140, drawHeight + 8); resetBtn.mousePressed(function () { revealed = false; });
  describe('Why an observational MicroSim mastery delta can be confounded by prior mastery.', LABEL);
}
function bar(x, w, baseY, h, c, label, val) {
  fill(c); noStroke(); rect(x, baseY - h, w, h, 4);
  fill('#333'); textAlign(CENTER, TOP); textSize(11); text(label, x, baseY + 4, w);
  fill('#fff'); textAlign(CENTER, BOTTOM); textSize(12); text(val.toFixed(2), x + w / 2, baseY - 4);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('MicroSim Impact — Observational vs Controlled', canvasWidth / 2, 8);

  const baseY = 300, maxH = 190, panelW = canvasWidth - 2 * margin;
  if (!revealed) {
    // simple comparison
    const used = 0.72, skipped = 0.54;
    const bw = 130, gap = 90, sx = canvasWidth / 2 - bw - gap / 2;
    bar(sx, bw, baseY, used * maxH, '#5f7182', 'Used the MicroSim', used);
    bar(sx + bw + gap, bw, baseY, skipped * maxH, '#8b9bb0', 'Skipped the MicroSim', skipped);
    // observed delta bracket
    stroke('#c0392b'); strokeWeight(2);
    line(sx + bw / 2, baseY - used * maxH - 12, sx + bw + gap + bw / 2, baseY - used * maxH - 12);
    noStroke(); fill('#c0392b'); textAlign(CENTER, BOTTOM); textSize(12); text('Observed Delta = 0.18', canvasWidth / 2, baseY - used * maxH - 14);
    fill('#37474f'); textAlign(CENTER, TOP); textSize(12.5); text('Naive comparison: MicroSim users score higher.', margin, 330, panelW);
  } else {
    // stratified by prior-mastery band: within each band the gap shrinks
    const bands = ['Low prior', 'Med prior', 'High prior'];
    const used = [0.42, 0.66, 0.86], skip = [0.38, 0.63, 0.85];
    const groupW = panelW / 3;
    for (let b = 0; b < 3; b++) {
      const gx = margin + b * groupW;
      const shade = lerpColor(color('#cdd6df'), color('#37546a'), b / 2);
      const shade2 = lerpColor(color('#e0e6ec'), color('#5f7d94'), b / 2);
      bar(gx + 14, groupW / 2 - 20, baseY, used[b] * maxH, shade, 'used', used[b]);
      bar(gx + groupW / 2 + 6, groupW / 2 - 20, baseY, skip[b] * maxH, shade2, 'skip', skip[b]);
      noStroke(); fill('#37474f'); textAlign(CENTER, TOP); textSize(11); text(bands[b], gx, baseY + 20, groupW);
    }
    fill('#b8791f'); textAlign(CENTER, TOP); textSize(12.5);
    text('Within each prior-mastery band, the gap nearly vanishes — the naive comparison was partly measuring who was already stronger, not what the MicroSim taught. Only a controlled experiment supports a causal claim.', margin, 340, panelW);
  }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
