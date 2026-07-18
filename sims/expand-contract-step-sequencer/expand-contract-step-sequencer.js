// Expand-Contract Step Sequencer
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 640;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let checkBtn, resetBtn;
let dragging = null, seed = 55, infobox = null;

const STEPS = [
  { order: 1, text: 'Add new column (nullable)', why: 'Must come first: the new column has to exist before anything can write to it. Nullable so old code is unaffected — ships on its own.' },
  { order: 2, text: 'Dual-write to both columns', why: 'Write both old and new so they stay in sync going forward, before any backfill or read switch. Ships on its own.' },
  { order: 3, text: 'Backfill from old column', why: 'Copy historical rows into the new column. Safe only once dual-write is on, or new writes during backfill would be missed.' },
  { order: 4, text: 'Switch reads to new column', why: 'Only after backfill is complete and dual-write guarantees freshness can reads safely move to the new column.' },
  { order: 5, text: 'Drop old column', why: 'Last: once nothing reads or writes the old column, it can be removed. The contract step.' }
];
let tiles = [];   // shelf tiles (draggable)
let slots = [];   // 5 numbered drop slots

function layout() {
  const slotW = 300, slotH = 44, top = 60;
  slots = [1, 2, 3, 4, 5].map(function (n, i) { return { n: n, x: margin, y: top + i * (slotH + 8), w: slotW, h: slotH, tile: null }; });
  // shelf on right, seeded scrambled
  let idx = STEPS.map(function (_, i) { return i; });
  for (let i = idx.length - 1; i > 0; i--) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; const j = seed % (i + 1); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  const shelfX = margin * 2 + slotW;
  tiles = STEPS.map(function (s, i) {
    const pos = idx.indexOf(i);
    const x = shelfX, y = top + pos * (slotH + 8);
    return { order: s.order, text: s.text, why: s.why, x: x, y: y, w: canvasWidth - shelfX - margin, h: slotH, hx: x, hy: y, placed: null, locked: false };
  });
}
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13); layout();
  checkBtn = createButton('Check Order'); checkBtn.position(10, drawHeight + 8); checkBtn.mousePressed(checkOrder);
  resetBtn = createButton('Reset'); resetBtn.position(110, drawHeight + 8); resetBtn.mousePressed(function () { infobox = null; layout(); });
  describe('Drag the five expand-contract migration steps into correct order.', LABEL);
}
function checkOrder() {
  slots.forEach(function (sl) {
    if (sl.tile && !sl.tile.locked) {
      if (sl.tile.order === sl.n) sl.tile.locked = true;
      else { infobox = sl.tile.text + ' — ' + sl.tile.why; sl.tile.x = sl.tile.hx; sl.tile.y = sl.tile.hy; sl.tile.placed = null; sl.tile = null; }
    }
  });
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Order the Expand-Contract Migration', canvasWidth / 2, 8);
  fill('#666'); textSize(11); textAlign(LEFT, TOP); text('slots', margin, 42); textAlign(RIGHT, TOP); text('shelf', canvasWidth - margin, 42);

  slots.forEach(function (sl) {
    fill('#eef2f5'); stroke('#b7c6d0'); strokeWeight(1); rect(sl.x, sl.y, sl.w, sl.h, 6);
    noStroke(); fill('#8aa0ad'); textAlign(LEFT, CENTER); textSize(15); text(sl.n, sl.x + 8, sl.y + sl.h / 2);
  });
  tiles.forEach(function (t) { if (t !== dragging) drawTile(t); });
  if (dragging) drawTile(dragging);

  const placed = slots.filter(function (s) { return s.tile && s.tile.locked; }).length;
  noStroke(); fill('#1f7a6f'); textAlign(RIGHT, CENTER); textSize(13);
  text('Correctly placed: ' + placed + ' / 5', canvasWidth - margin, drawHeight + controlHeight / 2);
  if (placed === 5) { fill('#2f6b48'); textAlign(CENTER, BOTTOM); textSize(12); text('Expand, contract, done — every step above could have shipped on its own.', canvasWidth / 2, drawHeight - 4); }
  if (infobox) { fill('#7a2b2b'); textAlign(CENTER, BOTTOM); textSize(11.5); text(infobox, margin, drawHeight - 22, canvasWidth - 2 * margin, 20); }
}
function drawTile(t) {
  fill(t.locked ? '#2a9d8f' : '#8fd3c9'); stroke(t.locked ? '#2f6b48' : '#3bab9d'); strokeWeight(t.locked ? 3 : 1);
  rect(t.x, t.y, t.w, t.h, 6);
  noStroke(); fill(t.locked ? '#fff' : '#0c2f2b'); textAlign(LEFT, CENTER); textSize(12.5);
  text((t.locked ? t.order + '. ' : '') + t.text, t.x + 10, t.y + t.h / 2, t.w - 16);
}
function mousePressed() {
  for (let i = tiles.length - 1; i >= 0; i--) { const t = tiles[i];
    if (!t.locked && mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) {
      if (t.placed) { t.placed.tile = null; t.placed = null; }
      dragging = t; t.ox = mouseX - t.x; t.oy = mouseY - t.y; return; }
    if (t.locked && mouseX > t.x && mouseX < t.x + t.w && mouseY > t.y && mouseY < t.y + t.h) { infobox = t.text + ' — ' + t.why; return; }
  }
}
function mouseDragged() { if (dragging) { dragging.x = mouseX - dragging.ox; dragging.y = mouseY - dragging.oy; } }
function mouseReleased() {
  if (!dragging) return; const t = dragging;
  const sl = slots.find(function (s) { return !s.tile && mouseX > s.x && mouseX < s.x + s.w && mouseY > s.y && mouseY < s.y + s.h; });
  if (sl) { t.x = sl.x; t.y = sl.y; t.w = sl.w; sl.tile = t; t.placed = sl; }
  else { t.x = t.hx; t.y = t.hy; }
  dragging = null;
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); layout(); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
