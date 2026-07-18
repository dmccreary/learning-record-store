// Class Mastery Heatmap
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 640;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 10;

let threshSlider;
const CONCEPTS = ['Cells', 'Membrane', 'Transport', 'Osmosis', 'Respir.', 'ATP', 'Enzymes', 'Genetics'];
const N = 14; // students
let students = [];
let hoverCell = null, selCol = -1, selRow = -1;
let seed = 20;

function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed % 1000) / 1000; }
function build() {
  students = [];
  for (let r = 0; r < N; r++) {
    const name = 'S' + (r + 1);
    const row = [];
    for (let c = 0; c < CONCEPTS.length; c++) {
      let v = 0.45 + rnd() * 0.5;
      if (c === 3) v = 0.20 + rnd() * 0.25;   // dark column (Osmosis - class weak)
      if (r === 9) v = 0.15 + rnd() * 0.2;     // dark row (one weak student)
      row.push(Math.min(0.99, v));
    }
    students.push({ name: name, row: row });
  }
}
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12); build();
  threshSlider = createSlider(0, 100, 100, 5); threshSlider.position(220, drawHeight + 10); threshSlider.size(canvasWidth - 220 - 40);
  describe('Class mastery heatmap distinguishing a weak concept column from a weak student row.', LABEL);
}
function grid() {
  const labelW = 46, headH = 54, x0 = margin + labelW, y0 = 30 + headH;
  const cw = (canvasWidth - x0 - margin) / CONCEPTS.length;
  const ch = (drawHeight - y0 - 40) / N;
  return { labelW: labelW, headH: headH, x0: x0, y0: y0, cw: cw, ch: ch };
}
function draw() {
  updateCanvasSize();
  background('#fff');
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Class Mastery Heatmap', canvasWidth / 2, 6);
  const g = grid(); const th = threshSlider.value() / 100;
  hoverCell = null;
  // column headers
  for (let c = 0; c < CONCEPTS.length; c++) {
    const x = g.x0 + c * g.cw;
    push(); translate(x + g.cw / 2, 30 + g.headH - 6); rotate(-QUARTER_PI);
    noStroke(); fill(selCol === c ? '#e9a23b' : '#37474f'); textAlign(LEFT, CENTER); textSize(10); text(CONCEPTS[c], 0, 0); pop();
  }
  for (let r = 0; r < N; r++) {
    const st = students[r];
    // row label
    noStroke(); fill(selRow === r ? '#e9a23b' : '#37474f'); textAlign(RIGHT, CENTER); textSize(10);
    text(st.name, g.x0 - 4, g.y0 + r * g.ch + g.ch / 2);
    for (let c = 0; c < CONCEPTS.length; c++) {
      const v = st.row[c];
      const x = g.x0 + c * g.cw, y = g.y0 + r * g.ch;
      const dim = v > th; // filter: show only below threshold
      // teal sequential: light (high) to dark (low)
      const t = 1 - v; // 0 high -> 1 low
      const col = lerpColor(color('#e7f6f3'), color('#0c4a43'), t);
      if (dim) col.setAlpha(40);
      fill(col); stroke((selCol === c || selRow === r) ? '#e9a23b' : '#fff'); strokeWeight((selCol === c || selRow === r) ? 2 : 1);
      rect(x, y, g.cw, g.ch);
      if (mouseX > x && mouseX < x + g.cw && mouseY > y && mouseY < y + g.ch) hoverCell = { r: r, c: c, v: v, x: x, y: y };
    }
  }
  // legend + status
  noStroke(); textAlign(LEFT, TOP); textSize(11); fill('#666');
  text('light = high mastery, dark = low', margin, drawHeight - 34);
  if (selCol >= 0) { fill('#b8791f'); textAlign(CENTER, TOP); let m = 0; for (let r = 0; r < N; r++) m += students[r].row[selCol]; m /= N; text('Column ' + CONCEPTS[selCol] + ': class mean ' + m.toFixed(2) + ' — a dark COLUMN means whole-class re-teaching.', canvasWidth / 2, drawHeight - 34, canvasWidth - 20); }
  else if (selRow >= 0) { fill('#b8791f'); textAlign(CENTER, TOP); text('Row ' + students[selRow].name + ': a dark ROW means individual attention. [View Student Detail]', canvasWidth / 2, drawHeight - 34, canvasWidth - 20); }
  // hover tooltip
  if (hoverCell) {
    fill('#222'); noStroke(); rectMode(CORNER); const tx = Math.min(hoverCell.x, canvasWidth - 150);
    rect(tx, hoverCell.y - 22, 140, 18, 3); fill('#fff'); textAlign(LEFT, CENTER); textSize(10);
    text(students[hoverCell.r].name + ' / ' + CONCEPTS[hoverCell.c] + ': ' + hoverCell.v.toFixed(2), tx + 4, hoverCell.y - 13);
  }
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(11); text('Show below mastery: ' + (th).toFixed(2), margin, drawHeight + 20);
}
function mousePressed() {
  const g = grid();
  // column header click
  for (let c = 0; c < CONCEPTS.length; c++) { const x = g.x0 + c * g.cw; if (mouseX > x && mouseX < x + g.cw && mouseY > 30 && mouseY < 30 + g.headH) { selCol = selCol === c ? -1 : c; selRow = -1; return; } }
  // row label click
  for (let r = 0; r < N; r++) { const y = g.y0 + r * g.ch; if (mouseX > margin && mouseX < g.x0 && mouseY > y && mouseY < y + g.ch) { selRow = selRow === r ? -1 : r; selCol = -1; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); threshSlider.size(canvasWidth - 220 - 40); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
