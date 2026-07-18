// Hard vs Soft Isolation Sorter
// CANVAS_HEIGHT: 440
// Drag each Tenancy Hierarchy level into Hard or Soft isolation. Correct locks green.
let containerWidth;
let canvasWidth = 500;
let drawHeight = 400;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let checkBtn, resetBtn;
let dragging = null, flash = null, infobox = null, seed = 4242;

const LEVELS = [
  { name: 'District', zone: 'hard', why: 'District is the hard isolation boundary (the tenant). No query, dashboard, or admin action crosses districts — enforced structurally.' },
  { name: 'School', zone: 'soft', why: 'School is a soft, role-scoped boundary within a district. Enforced by RBAC scope, not structural isolation.' },
  { name: 'Course', zone: 'soft', why: 'Course is a soft, role-scoped boundary. A district admin can see all courses; scope limits what others see.' },
  { name: 'Section', zone: 'soft', why: 'Section is a soft, role-scoped boundary. A teacher sees only their own sections — enforced by role scope.' }
];
let tiles = [];
const zones = [
  { id: 'hard', label: 'Hard Isolation', color: '#0f5c53' },
  { id: 'soft', label: 'Soft Isolation', color: '#5cbcb0' }
];

function layout() {
  const tw = 110, th = 40, gap = 14;
  const totalW = LEVELS.length * tw + (LEVELS.length - 1) * gap;
  let startX = (canvasWidth - totalW) / 2;
  // seeded shuffle of positions
  let idx = LEVELS.map(function (_, i) { return i; });
  for (let i = idx.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; const j = seed % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  tiles = LEVELS.map(function (lv, i) {
    const pos = idx.indexOf(i);
    const x = startX + pos * (tw + gap);
    return { name: lv.name, zone: lv.zone, why: lv.why, x: x, y: 60, w: tw, h: th, hx: x, hy: 60, locked: false, wrong: false };
  });
}
function zoneRects() {
  const w = (canvasWidth - 3 * margin) / 2, h = 150, y = 180;
  return [
    { id: 'hard', x: margin, y: y, w: w, h: h },
    { id: 'soft', x: margin * 2 + w, y: y, w: w, h: h }
  ];
}

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(14);
  layout();
  checkBtn = createButton('Check All'); checkBtn.position(10, drawHeight + 8); checkBtn.mousePressed(checkAll);
  resetBtn = createButton('Reset'); resetBtn.position(100, drawHeight + 8); resetBtn.mousePressed(function () { infobox = null; layout(); });
  describe('Sort four tenancy levels into hard or soft isolation buckets.', LABEL);
}

function checkAll() {
  const zr = zoneRects();
  tiles.forEach(function (t) {
    if (t.locked) return;
    const inZone = zr.find(function (z) { return t.x + t.w / 2 > z.x && t.x + t.w / 2 < z.x + z.w && t.y + t.h / 2 > z.y && t.y + t.h / 2 < z.y + z.h; });
    if (inZone && inZone.id === t.zone) { t.locked = true; t.wrong = false; }
    else if (inZone) { t.wrong = true; infobox = t.name + ': ' + t.why; setTimeout(function () { t.wrong = false; }, 800); t.x = t.hx; t.y = t.hy; }
  });
}

function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('Sort each level: Hard or Soft isolation?', canvasWidth / 2, 12);

  const zr = zoneRects();
  zr.forEach(function (z) {
    const meta = zones.find(function (zz) { return zz.id === z.id; });
    fill(meta.color); stroke('#1f7a6f'); strokeWeight(1); rect(z.x, z.y, z.w, z.h, 8);
    noStroke(); fill('#fff'); textAlign(CENTER, TOP); textStyle(BOLD); textSize(15);
    text(meta.label, z.x + z.w / 2, z.y + 8); textStyle(NORMAL);
  });

  tiles.forEach(function (t) { if (t !== dragging) drawTile(t); });
  if (dragging) drawTile(dragging);

  const sorted = tiles.filter(function (t) { return t.locked; }).length;
  noStroke(); fill('#1f7a6f'); textAlign(RIGHT, CENTER); textSize(14);
  text('Sorted: ' + sorted + ' / 4', canvasWidth - margin, drawHeight + controlHeight / 2);
  if (sorted === 4) { fill('#2f6b48'); textAlign(CENTER, BOTTOM); textSize(14); text('All four sorted — District is the only hard boundary.', canvasWidth / 2, 172); }
  if (infobox) { fill('#333'); textAlign(CENTER, TOP); textSize(13); text(infobox, margin, 342, canvasWidth - 2 * margin, 56); }
}
function drawTile(t) {
  fill(t.locked ? '#2a9d8f' : (t.wrong ? '#e05a5a' : '#f4efe1'));
  stroke(t.locked ? '#2f6b48' : '#c9bb93'); strokeWeight(t.locked ? 3 : 1);
  rect(t.x, t.y, t.w, t.h, 6);
  noStroke(); fill(t.locked ? '#fff' : '#333'); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(14);
  text(t.name, t.x + t.w / 2, t.y + t.h / 2); textStyle(NORMAL);
}
function mousePressed() {
  for (let i = tiles.length - 1; i >= 0; i--) {
    const t = tiles[i];
    if (mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) {
      if (t.locked) { infobox = t.name + ': ' + t.why; return; }
      dragging = t; t.ox = mouseX - t.x; t.oy = mouseY - t.y; return;
    }
  }
}
function mouseDragged() { if (dragging) { dragging.x = mouseX - dragging.ox; dragging.y = mouseY - dragging.oy; } }
function mouseReleased() { dragging = null; }
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); layout(); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 500; canvasWidth = containerWidth; }
