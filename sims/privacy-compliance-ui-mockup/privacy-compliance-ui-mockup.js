// Privacy & Compliance UI Mockup
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 660;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let accessBtn, rectifyBtn, eraseBtn, threshSlider;
let preset = 'COPPA';
let dialogOpen = false;
let consent = ['Granted', 'Pending', 'Withdrawn'];
let radioHit = [];
let chipHit = [];
const PRESETS = { FERPA: 10, COPPA: 10, GDPR: 15 };
const RETENTION = { FERPA: '5 years', COPPA: '3 years', GDPR: '1 year' };

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12);
  accessBtn = createButton('Access'); accessBtn.position(10, drawHeight + 8);
  rectifyBtn = createButton('Rectify'); rectifyBtn.position(75, drawHeight + 8);
  eraseBtn = createButton('Erase'); eraseBtn.position(140, drawHeight + 8); eraseBtn.mousePressed(function () { dialogOpen = true; });
  threshSlider = createSlider(5, 20, PRESETS[preset], 1); threshSlider.position(320, drawHeight + 10); threshSlider.size(canvasWidth - 320 - 30);
  describe('Mock Privacy & Compliance admin screen with policy presets, DSR, consent, and threshold.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('#e9eef2');
  fill('#fff'); stroke('#c9d4dc'); strokeWeight(1); rect(margin, 8, canvasWidth - 2 * margin, drawHeight - 16, 8);
  fill('#37474f'); noStroke(); rect(margin, 8, canvasWidth - 2 * margin, 24, 8);
  fill('#fff'); textAlign(LEFT, CENTER); textSize(11); text('Districts > Riverbend Unified > Privacy & Compliance', margin + 10, 20);

  const cx = margin + 8, cy = 40, cw = (canvasWidth - 2 * margin - 24) / 2, chh = (drawHeight - cy - 20) / 2;
  radioHit = []; chipHit = [];
  // Card 1: Policy Profile (radios)
  card(cx, cy, cw, chh, 'Policy Profile');
  ['FERPA', 'COPPA', 'GDPR'].forEach(function (p, i) {
    const rx = cx + 16, ry = cy + 36 + i * 24;
    stroke('#888'); strokeWeight(1); fill('#fff'); circle(rx, ry, 14);
    if (preset === p) { fill('#2a9d8f'); noStroke(); circle(rx, ry, 8); }
    noStroke(); fill('#333'); textAlign(LEFT, CENTER); textSize(12); text(p, rx + 14, ry);
    radioHit.push({ p: p, x: rx - 8, y: ry - 8, w: 90, h: 16 });
  });
  fill('#666'); textSize(10); text('A preset configures threshold + retention together.', cx + 12, cy + chh - 18, cw - 20);

  // Card 2: Data Subject Request
  card(cx + cw + 8, cy, cw, chh, 'Data Subject Request');
  fill('#f3f7f9'); stroke('#dbe4ea'); rect(cx + cw + 20, cy + 34, cw - 24, 22, 4);
  noStroke(); fill('#888'); textAlign(LEFT, CENTER); textSize(11); text('Search by roster identity…', cx + cw + 26, cy + 45);
  fill('#666'); textSize(10); text('Access / Rectify / Erase (below). Erase is irreversible.', cx + cw + 20, cy + chh - 18, cw - 28);

  // Card 3: Consent Status
  const c3y = cy + chh + 8;
  card(cx, c3y, cw, chh, 'Consent Status');
  ['Ada', 'Ben', 'Chi'].forEach(function (nm, i) {
    const y = c3y + 34 + i * 22; const st = consent[i];
    fill('#333'); textAlign(LEFT, CENTER); textSize(11); text(nm, cx + 16, y);
    const col = st === 'Granted' ? '#2f9e6f' : st === 'Pending' ? '#e9a23b' : '#9aa7b4';
    fill(col); noStroke(); rect(cx + 70, y - 9, 78, 18, 9); fill('#fff'); textAlign(CENTER, CENTER); textSize(10); text(st, cx + 109, y);
    chipHit.push({ i: i, x: cx + 70, y: y - 9, w: 78, h: 18 });
  });
  if (consent.indexOf('Withdrawn') >= 0) { fill('#8b9bb0'); textSize(9); text('Withdrawn = excluded from non-essential processing.', cx + 12, c3y + chh - 16, cw - 20); }

  // Card 4: Aggregation Threshold
  card(cx + cw + 8, c3y, cw, chh, 'Aggregation Threshold');
  fill('#1f7a6f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(20); text('Minimum group size: ' + threshSlider.value(), cx + cw + 20, c3y + 40); textStyle(NORMAL);
  fill('#666'); textSize(10); text('Groups smaller than this are suppressed on every report.  Retention: ' + RETENTION[preset], cx + cw + 20, c3y + chh - 26, cw - 28);

  // Erase confirmation dialog
  if (dialogOpen) {
    fill(0, 0, 0, 90); noStroke(); rect(margin, 8, canvasWidth - 2 * margin, drawHeight - 16, 8);
    const dw = 320, dh = 150, dx = canvasWidth / 2 - dw / 2, dy = drawHeight / 2 - dh / 2;
    fill('#fff'); stroke('#c0392b'); strokeWeight(2); rect(dx, dy, dw, dh, 10);
    noStroke(); fill('#c0392b'); textAlign(CENTER, TOP); textStyle(BOLD); textSize(13); text('Confirm Erasure', dx, dy + 12, dw); textStyle(NORMAL);
    fill('#333'); textSize(11.5); text('This will permanently remove this student\'s identity mapping. De-identified aggregates will be preserved. This cannot be undone.', dx + 16, dy + 40, dw - 32);
    fill('#c0392b'); rect(dx + 30, dy + dh - 40, 110, 28, 5); fill('#fff'); textAlign(CENTER, CENTER); textSize(12); text('Confirm', dx + 85, dy + dh - 26);
    fill('#9aa7b4'); rect(dx + dw - 140, dy + dh - 40, 110, 28, 5); fill('#fff'); text('Cancel', dx + dw - 85, dy + dh - 26);
    dialogBtns = { confirm: { x: dx + 30, y: dy + dh - 40, w: 110, h: 28 }, cancel: { x: dx + dw - 140, y: dy + dh - 40, w: 110, h: 28 } };
  }
}
let dialogBtns = null;
function card(x, y, w, h, title) { fill('#fff'); stroke('#dbe4ea'); strokeWeight(1); rect(x, y, w, h, 6); noStroke(); fill('#1a3a5c'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12.5); text(title, x + 10, y + 8); textStyle(NORMAL); }
function inside(b) { return b && mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h; }
function mousePressed() {
  if (dialogOpen) { if (inside(dialogBtns && dialogBtns.confirm) || inside(dialogBtns && dialogBtns.cancel)) dialogOpen = false; return; }
  radioHit.forEach(function (r) { if (inside(r)) { preset = r.p; threshSlider.value(PRESETS[preset]); } });
  chipHit.forEach(function (c) { if (inside(c)) { const order = ['Granted', 'Pending', 'Withdrawn']; consent[c.i] = order[(order.indexOf(consent[c.i]) + 1) % 3]; } });
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); threshSlider.size(canvasWidth - 320 - 30); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 660; canvasWidth = containerWidth; }
