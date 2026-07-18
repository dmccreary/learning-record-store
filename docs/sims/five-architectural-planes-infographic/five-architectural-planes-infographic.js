// Five Architectural Planes Sorter
// CANVAS_HEIGHT: 520
// Drag each component tile into the correct plane band.
let containerWidth;
let canvasWidth = 620;
let drawHeight = 480;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 10;

let checkBtn, resetBtn;
let dragging = null, seed = 991, infobox = null;

const COMPONENTS = [
  { name: 'Ingestion Gateway', plane: 'Ingestion', why: 'Accepts and validates statements at the front door.' },
  { name: 'Durable Event Queue', plane: 'Ingestion', why: 'Holds statements in order until a processor consumes them.' },
  { name: 'Stream Processor', plane: 'Processing', why: 'Enriches: resolves learner, adds context, pseudonymizes.' },
  { name: 'Event Store', plane: 'Storage', why: 'The durable, queryable log of every statement.' },
  { name: 'Analytics API', plane: 'Analytics', why: 'Backs every report and dashboard query.' },
  { name: 'Admin API', plane: 'Analytics', why: 'Serves admin UIs; every mutation audited.' },
  { name: 'Experiment API', plane: 'Analytics', why: 'Assignment and readout for A/B tests.' },
  { name: 'Roster API', plane: 'Analytics', why: 'Inbound: ingests enrollment data.' },
  { name: 'Export API', plane: 'Analytics', why: 'Bulk async export with signed URL.' },
  { name: 'Dashboards', plane: 'Presentation', why: 'Renders dashboards and admin UIs for people.' }
];
const PLANES = [
  { id: 'Ingestion', color: '#0f5c53' },
  { id: 'Processing', color: '#1a7f72' },
  { id: 'Storage', color: '#2a9d8f' },
  { id: 'Analytics', color: '#5cbcb0' },
  { id: 'Presentation', color: '#a7ddd5' }
];
let tiles = [];

function layout() {
  const tw = 118, th = 28, perRow = Math.max(1, Math.floor((canvasWidth - 2 * margin) / (tw + 8)));
  let idx = COMPONENTS.map(function (_, i) { return i; });
  for (let i = idx.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; const j = seed % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  tiles = COMPONENTS.map(function (c, i) {
    const pos = idx.indexOf(i);
    const x = margin + (pos % perRow) * (tw + 8);
    const y = 44 + Math.floor(pos / perRow) * (th + 6);
    return { name: c.name, plane: c.plane, why: c.why, x: x, y: y, w: tw, h: th, hx: x, hy: y, locked: false };
  });
}
function bandRects() {
  const top = 130, h = 62, gap = 6;
  return PLANES.map(function (p, i) { return { id: p.id, color: p.color, x: margin, y: top + i * (h + gap), w: canvasWidth - 2 * margin, h: h }; });
}
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  layout();
  checkBtn = createButton('Check All'); checkBtn.position(10, drawHeight + 8); checkBtn.mousePressed(checkAll);
  resetBtn = createButton('Reset'); resetBtn.position(100, drawHeight + 8); resetBtn.mousePressed(function () { infobox = null; layout(); });
  describe('Sort ten components into the five architectural planes.', LABEL);
}
function checkAll() {
  const br = bandRects();
  tiles.forEach(function (t) {
    if (t.locked) return;
    const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    const band = br.find(function (b) { return cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h; });
    if (band && band.id === t.plane) { t.locked = true; }
    else if (band) { infobox = t.name + ' belongs in ' + t.plane + ' Plane: ' + t.why; t.x = t.hx; t.y = t.hy; }
  });
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Drag each component into its plane', canvasWidth / 2, 8);

  bandRects().forEach(function (b) {
    fill(b.color); stroke('#1f7a6f'); strokeWeight(1); rect(b.x, b.y, b.w, b.h, 6);
    noStroke(); fill(b.id === 'Presentation' ? '#08312c' : '#fff'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(13);
    text(b.id + ' Plane', b.x + 8, b.y + 6); textStyle(NORMAL);
  });
  tiles.forEach(function (t) { if (t !== dragging) drawTile(t); });
  if (dragging) drawTile(dragging);

  const sorted = tiles.filter(function (t) { return t.locked; }).length;
  noStroke(); fill('#1f7a6f'); textAlign(RIGHT, CENTER); textSize(13);
  text('Sorted: ' + sorted + ' / 10', canvasWidth - margin, drawHeight + controlHeight / 2);
  if (sorted === 10) { fill('#2f6b48'); textAlign(CENTER, BOTTOM); textSize(13); text('All ten placed correctly — you know the five planes.', canvasWidth / 2, drawHeight - 4); }
  if (infobox) { fill('#7a2b2b'); textAlign(CENTER, BOTTOM); textSize(12); text(infobox, margin, drawHeight - 22, canvasWidth - 2 * margin, 20); }
}
function drawTile(t) {
  fill(t.locked ? '#2a9d8f' : '#f4efe1'); stroke(t.locked ? '#2f6b48' : '#c9bb93'); strokeWeight(t.locked ? 2 : 1);
  rect(t.x, t.y, t.w, t.h, 5);
  noStroke(); fill(t.locked ? '#fff' : '#333'); textAlign(CENTER, CENTER); textSize(11.5);
  text(t.name, t.x + t.w / 2, t.y + t.h / 2);
}
function mousePressed() {
  for (let i = tiles.length - 1; i >= 0; i--) { const t = tiles[i];
    if (mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) {
      if (t.locked) { infobox = t.name + ' — ' + t.why; return; }
      dragging = t; t.ox = mouseX - t.x; t.oy = mouseY - t.y; return; } }
}
function mouseDragged() { if (dragging) { dragging.x = mouseX - dragging.ox; dragging.y = mouseY - dragging.oy; } }
function mouseReleased() { dragging = null; }
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); layout(); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
