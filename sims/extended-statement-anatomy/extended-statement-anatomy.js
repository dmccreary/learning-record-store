// Extended Statement Anatomy — click the four optional pieces
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let resetBtn;
let selected = null;

const SATS = [
  { id: 'Sub-Statement', attach: 'attached to the Object', info: 'A Sub-Statement embeds a whole Actor-Verb-Object inside another Statement, without asserting it happened. Worked example: "Ms. Alvarez recommended [Maya practiced fractions]." The inner statement is the recommendation’s subject, not a claim that Maya practiced.' },
  { id: 'Attachment', attach: 'attached to the Statement', info: 'An Attachment carries a SHA-2 hash and a contentType referencing a file (an essay PDF, a certificate). The actual bytes travel separately; the Statement only references them by hash so integrity can be verified.' },
  { id: 'Extensions', attach: 'attached to Context or Result', info: 'Extensions add custom key-value data. The KEY is a full IRI (e.g. https://example.org/hintsUsed), so two vendors never collide on a bare name like "hintsUsed". Value example: { ".../hintsUsed": 2 }.' },
  { id: 'Registration', attach: 'attached to Context', info: 'A Registration is a UUID that groups many Statements into one attempt. Two Statements sharing a registration belong to the same session; two with different UUIDs are separate attempts of the same activity.' }
];
let coreBox, sats = [];

function layout() {
  coreBox = { x: canvasWidth / 2 - 90, y: drawHeight / 2 - 34, w: 180, h: 68 };
  const positions = [
    { x: canvasWidth / 2 - 90, y: 54 },                       // top
    { x: canvasWidth - 200, y: drawHeight / 2 - 26 },         // right
    { x: canvasWidth / 2 - 90, y: drawHeight - 120 },         // bottom
    { x: 20, y: drawHeight / 2 - 26 }                         // left
  ];
  sats = SATS.map(function (s, i) { return { id: s.id, attach: s.attach, info: s.info, x: positions[i].x, y: positions[i].y, w: 180, h: 52 }; });
}
function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  layout();
  resetBtn = createButton('Reset'); resetBtn.position(10, drawHeight + 8); resetBtn.mousePressed(function () { selected = null; });
  describe('Click each of four optional Statement pieces to see what problem it solves.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('The Optional Statement Pieces', canvasWidth / 2, 10);

  // connectors
  sats.forEach(function (s) {
    stroke(selected === s.id ? '#e9a23b' : '#c9d4dc'); strokeWeight(selected === s.id ? 3 : 1);
    line(s.x + s.w / 2, s.y + s.h / 2, coreBox.x + coreBox.w / 2, coreBox.y + coreBox.h / 2);
  });
  // core (dimmed)
  noStroke(); fill('#c7d2d0'); rect(coreBox.x, coreBox.y, coreBox.w, coreBox.h, 8);
  fill('#5a6b68'); textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD);
  text('Core Statement\nActor / Verb / Object', coreBox.x + coreBox.w / 2, coreBox.y + coreBox.h / 2); textStyle(NORMAL);
  fill('#7a8a88'); textSize(11); text('You already know this part.', coreBox.x + coreBox.w / 2, coreBox.y + coreBox.h + 12);

  // satellites
  sats.forEach(function (s) {
    const on = selected === s.id;
    fill(on ? '#2a9d8f' : '#8fd3c9'); stroke(on ? '#1f7a6f' : '#3bab9d'); strokeWeight(on ? 3 : 1);
    rect(s.x, s.y, s.w, s.h, 8);
    noStroke(); fill(on ? '#fff' : '#0c2f2b'); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(13);
    text(s.id, s.x + s.w / 2, s.y + s.h / 2 - 8); textStyle(NORMAL); textSize(10.5);
    text(s.attach, s.x + s.w / 2, s.y + s.h / 2 + 12);
  });

  // info panel
  const sel = sats.find(function (s) { return s.id === selected; });
  noStroke(); textAlign(LEFT, TOP); textSize(12.5);
  if (sel) { fill('#1f7a6f'); text(sel.info, margin, drawHeight - 96, canvasWidth - 2 * margin, 92); }
  else { fill('#666'); text('Click any of the four satellite pieces to see the problem it solves. They are independent — there is no required order.', margin, drawHeight - 40, canvasWidth - 2 * margin); }
}
function mousePressed() {
  for (const s of sats) { if (mouseX > s.x && mouseX < s.x + s.w && mouseY > s.y && mouseY < s.y + s.h) { selected = s.id; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); layout(); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
