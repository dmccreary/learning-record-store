// District Management UI Mockup
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 660;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let diffBtn, approveBtn, discardBtn;
let legalHold = false;
let diffOpen = false;
let syncStatus = 'Success, 6 hours ago';
let hoverCard = -1;

const CARDS = [
  { title: 'Roster Source', tip: 'The SIS connector and sync schedule that feed enrollment into this district.' },
  { title: 'Data Residency', tip: 'The region where this district’s data is stored and processed.' },
  { title: 'Retention Policy', tip: 'How long data is kept before the scheduled purge.' },
  { title: 'Legal Hold', tip: 'Suspends (does not replace) the retention schedule while a hold is active.' }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  diffBtn = createButton('Preview Roster Diff'); diffBtn.position(10, drawHeight + 8); diffBtn.mousePressed(function () { diffOpen = true; });
  approveBtn = createButton('Approve'); approveBtn.position(170, drawHeight + 8); approveBtn.mousePressed(function () { if (diffOpen) { syncStatus = 'Success, just now'; diffOpen = false; } });
  discardBtn = createButton('Discard'); discardBtn.position(250, drawHeight + 8); discardBtn.mousePressed(function () { diffOpen = false; });
  describe('Mock District Management admin screen with roster diff and legal-hold toggle.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('#e9eef2');
  // browser frame
  fill('#fff'); stroke('#c9d4dc'); strokeWeight(1); rect(margin, 8, canvasWidth - 2 * margin, drawHeight - 16, 8);
  fill('#37474f'); noStroke(); rect(margin, 8, canvasWidth - 2 * margin, 26, 8);
  fill('#fff'); textAlign(LEFT, CENTER); textSize(12); text('Districts  >  Riverbend Unified', margin + 12, 21);

  const railW = 120, contentX = margin + railW + 10, contentY = 44, contentW = canvasWidth - margin - contentX - 10;
  // left rail
  fill('#f3f7f9'); noStroke(); rect(margin + 2, 36, railW, drawHeight - 46);
  fill('#37546a'); textAlign(LEFT, TOP); textSize(11);
  ['District', 'Schools', 'Courses', 'Sections', 'Deployments'].forEach(function (r, i) { fill(i === 0 ? '#1f7a6f' : '#8aa0ad'); text(r, margin + 12, 46 + i * 22); });

  // 2x2 cards
  const cw = (contentW - 10) / 2, chh = (drawHeight - contentY - 20) / 2;
  hoverCard = -1;
  CARDS.forEach(function (cd, i) {
    const col = i % 2, row = Math.floor(i / 2);
    const x = contentX + col * (cw + 10), y = contentY + row * (chh + 10);
    fill('#fff'); stroke('#dbe4ea'); strokeWeight(1); rect(x, y, cw, chh, 6);
    noStroke(); fill('#1a3a5c'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12.5); text(cd.title, x + 10, y + 8); textStyle(NORMAL);
    if (mouseX > x && mouseX < x + cw && mouseY > y + 4 && mouseY < y + 22) hoverCard = i;
    fill('#333'); textSize(11); textAlign(LEFT, TOP);
    if (i === 0) { text('SIS Connector Key: •••••‒42a1\nSync: Nightly, 02:00 local', x + 10, y + 30, cw - 20); fill('#2f6b48'); text('Last sync: ' + syncStatus, x + 10, y + chh - 22); }
    if (i === 1) { text('Region: US-East\nStored and processed in-region.', x + 10, y + 30, cw - 20); }
    if (i === 2) { text('Retention window: 5 years\nNext purge: 2027-01-15', x + 10, y + 30, cw - 20); }
    if (i === 3) {
      // toggle
      const tx = x + 10, ty = y + 34;
      fill(legalHold ? '#e9a23b' : '#c9d4dc'); rect(tx, ty, 42, 20, 10);
      fill('#fff'); circle(legalHold ? tx + 32 : tx + 10, ty + 10, 16);
      fill(legalHold ? '#b8791f' : '#888'); textSize(11); text(legalHold ? '1 record set on hold' : 'No active holds', tx + 50, ty + 4);
      fill('#666'); textSize(10); text('A hold suspends, not replaces, retention.', x + 10, y + chh - 20, cw - 20);
      cardToggle = { x: tx, y: ty, w: 42, h: 20 };
    }
  });

  // diff slide-out
  if (diffOpen) {
    const dx = canvasWidth - margin - 240, dy = 44, dw = 230, dh = drawHeight - 60;
    fill('#fff'); stroke('#2a9d8f'); strokeWeight(2); rect(dx, dy, dw, dh, 8);
    noStroke(); fill('#1a3a5c'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(12); text('Roster Diff (dry run)', dx + 10, dy + 8); textStyle(NORMAL);
    fill('#2f6b48'); textSize(11); text('+ Add: Amara Okoye (Gr 7)', dx + 10, dy + 34);
    text('+ Add: Ben Ruiz (Gr 7)', dx + 10, dy + 52);
    fill('#c0392b'); text('- Remove: Chen Li (transferred)', dx + 10, dy + 70);
    fill('#666'); text('Nothing is applied until you Approve.', dx + 10, dy + 96, dw - 20);
  }

  // tooltip
  if (hoverCard >= 0) { fill('#333'); noStroke(); textAlign(LEFT, TOP); textSize(11); text(CARDS[hoverCard].tip, contentX, drawHeight - 20, contentW); }
}
let cardToggle = null;
function mousePressed() {
  if (cardToggle && mouseX > cardToggle.x && mouseX < cardToggle.x + cardToggle.w && mouseY > cardToggle.y && mouseY < cardToggle.y + cardToggle.h) { legalHold = !legalHold; }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 660; canvasWidth = containerWidth; }
