// Dashboard Patterns — Common Dashboard Anatomy
// CANVAS_HEIGHT: 480
let containerWidth;
let canvasWidth = 640;
let drawHeight = 440;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let resetBtn;
let selected = null;

const REGIONS = [
  { id: 'header', label: 'Header', info: 'Header: title, date-range picker, and global filters (textbook version, term). Sets the context every component below inherits.', belongs: 'title, filters, date range' },
  { id: 'rail', label: 'Left Rail', info: 'Left rail: navigation between report families and saved views. Persistent so a reader never gets lost moving between dashboards.', belongs: 'navigation, report list' },
  { id: 'canvas', label: 'Canvas', info: 'Canvas: the main work area. KPI tiles across the top, a heatmap or primary chart in the middle, supporting detail tables below. This is where the analysis lives.', belongs: 'KPI tiles, heatmap, detail tables' },
  { id: 'footer', label: 'Footer', info: 'Footer: data freshness, privacy/suppression notice, and export controls. The trust-and-provenance strip.', belongs: 'freshness, privacy notice, export' }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  resetBtn = createButton('Reset'); resetBtn.position(10, drawHeight + 8); resetBtn.mousePressed(function () { selected = null; });
  describe('Common dashboard anatomy: header, rail, canvas, footer, and what belongs in each.', LABEL);
}
function rects() {
  const x = margin, y = 40, w = canvasWidth - 2 * margin, h = drawHeight - 130;
  const headH = 40, footH = 34, railW = 120;
  return {
    header: { x: x, y: y, w: w, h: headH },
    rail: { x: x, y: y + headH + 4, w: railW, h: h - headH - footH - 8 },
    canvas: { x: x + railW + 6, y: y + headH + 4, w: w - railW - 6, h: h - headH - footH - 8 },
    footer: { x: x, y: y + h - footH, w: w, h: footH }
  };
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Common Dashboard Anatomy — click a region', canvasWidth / 2, 10);

  const r = rects();
  REGIONS.forEach(function (reg) {
    const b = r[reg.id];
    const on = selected === reg.id;
    fill(on ? '#2a9d8f' : '#dfeaf0'); stroke(on ? '#1f7a6f' : '#9fb4c0'); strokeWeight(on ? 3 : 1);
    rect(b.x, b.y, b.w, b.h, 6);
    noStroke(); fill(on ? '#fff' : '#37546a'); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(13);
    text(reg.label, b.x + b.w / 2, b.y + Math.min(b.h / 2, 16));
    if (reg.id === 'canvas' && !on) {
      // sketch KPI tiles + heatmap placeholder
      noStroke(); fill('#c9d9e2');
      for (let i = 0; i < 3; i++) rect(b.x + 12 + i * ((b.w - 24) / 3 + 0), b.y + 34, (b.w - 48) / 3, 30, 4);
      fill('#b8ccd6'); rect(b.x + 12, b.y + 74, b.w - 24, b.h - 110, 4);
      fill('#8aa6b4'); textAlign(CENTER, CENTER); textSize(11); text('KPI tiles / heatmap / detail', b.x + b.w / 2, b.y + b.h - 18);
    }
  });

  // info panel
  const sel = REGIONS.find(function (x) { return x.id === selected; });
  noStroke(); textAlign(LEFT, TOP); textSize(12.5);
  if (sel) { fill('#1f7a6f'); text(sel.info + '\n\nBelongs here: ' + sel.belongs, margin, drawHeight - 82, canvasWidth - 2 * margin, 78); }
  else { fill('#666'); text('A consistent header / rail / canvas / footer skeleton lets a reader navigate any dashboard in this book without relearning the layout. Click a region to see which component types belong there.', margin, drawHeight - 60, canvasWidth - 2 * margin, 56); }
}
function mousePressed() {
  const r = rects();
  for (const reg of REGIONS) { const b = r[reg.id]; if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) { selected = reg.id; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
