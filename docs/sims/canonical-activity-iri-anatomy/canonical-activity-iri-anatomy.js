// Canonical Activity IRI Anatomy
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let whyBtn;
let selected = -1, showWhy = false;

const CARDS = [
  { iri: 'https://dmccreary.github.io/learning-record-store/sims/sine-wave/', ok: true, bad: '', verdict: 'Canonical — absolute HTTPS, trailing slash present. This is the single correct identity for the page.' },
  { iri: 'https://dmccreary.github.io/learning-record-store/sims/sine-wave', ok: false, bad: '(no trailing slash)', verdict: 'Violates the Trailing Slash Rule — a different ORDER BY string, so it splits one page\'s engagement into two ClickHouse rows.' },
  { iri: 'https://dmccreary.github.io/learning-record-store/sims/sine-wave/main.html', ok: false, bad: 'main.html', verdict: 'Violates the Canonical Activity IRI rule — main.html is the iframe payload, not the page; it mints a second identity for the same content.' }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12);
  whyBtn = createButton('Why it matters'); whyBtn.position(10, drawHeight + 8); whyBtn.mousePressed(function () { showWhy = !showWhy; });
  describe('Classify three object.id IRI strings as canonical or malformed.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Canonical vs Malformed object.id', canvasWidth / 2, 8);

  const cw = (canvasWidth - 2 * margin - 2 * 8) / 3, cy = 36, ch = 150;
  CARDS.forEach(function (cd, i) {
    const x = margin + i * (cw + 8);
    fill(cd.ok ? '#e7f4ef' : '#faefd9'); stroke(selected === i ? '#333' : (cd.ok ? '#2a9d8f' : '#e9a23b')); strokeWeight(selected === i ? 3 : 1.5);
    rect(x, cy, cw, ch, 8);
    noStroke(); fill(cd.ok ? '#1f7a6f' : '#b8791f'); textAlign(CENTER, TOP); textStyle(BOLD); textSize(12);
    text('Card ' + (i + 1) + (cd.ok ? '  ✓' : '  ✗'), x + cw / 2, cy + 8); textStyle(NORMAL);
    fill('#333'); textAlign(LEFT, TOP); textFont('monospace'); textSize(10);
    text('…/sims/sine-wave' + (i === 0 ? '/' : (i === 1 ? '' : '/main.html')), x + 8, cy + 34, cw - 16);
    textFont('Arial');
    if (cd.bad) { fill('#c0392b'); textAlign(CENTER, TOP); textSize(11); text('broken: ' + cd.bad, x + cw / 2, cy + ch - 26, cw - 8); }
  });

  // verdict panel
  fill('#f8fbfc'); stroke('#c9d4dc'); strokeWeight(1); rect(margin, 200, canvasWidth - 2 * margin, 90, 8);
  noStroke(); textAlign(LEFT, TOP); textSize(13);
  if (selected >= 0) { fill(CARDS[selected].ok ? '#1f7a6f' : '#b8791f'); text(CARDS[selected].verdict, margin + 12, 212, canvasWidth - 2 * margin - 24, 80); }
  else { fill('#666'); text('Click a card to classify it. Only Card 1 is the canonical identity; the other two each split one page into two rows in ClickHouse.', margin + 12, 212, canvasWidth - 2 * margin - 24); }

  if (showWhy) {
    // mock two-row ClickHouse split
    fill('#0f1720'); noStroke(); rect(margin, 300, canvasWidth - 2 * margin, 100, 8);
    fill('#8fd3c9'); textFont('monospace'); textAlign(LEFT, TOP); textSize(11);
    text('object_id                                       engagement\n' +
         '…/sims/sine-wave/          <- canonical         120 events\n' +
         '…/sims/sine-wave           <- no slash           35 events\n' +
         '…/sims/sine-wave/main.html <- payload            18 events', margin + 10, 312, canvasWidth - 2 * margin - 20);
    fill('#ff9c9c'); text('One page, three identities: engagement is scattered across rows instead of summing to 173.', margin + 10, 384);
    textFont('Arial');
  }
}
function mousePressed() {
  const cw = (canvasWidth - 2 * margin - 2 * 8) / 3, cy = 36, ch = 150;
  for (let i = 0; i < 3; i++) { const x = margin + i * (cw + 8); if (mouseX > x && mouseX < x + cw && mouseY > cy && mouseY < cy + ch) { selected = i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
