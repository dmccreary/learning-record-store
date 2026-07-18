// Sync Cadence Tradeoff Explorer
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 620;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 16;

let cadenceSlider, burstBtn, resetBtn;
let burst = false;

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(14);
  cadenceSlider = createSlider(5, 300, 60, 1);
  cadenceSlider.position(150, drawHeight - 44);
  cadenceSlider.size(canvasWidth - 150 - margin - 60);
  burstBtn = createButton('Show burst (50k/sec)'); burstBtn.position(10, drawHeight + 8); burstBtn.mousePressed(function () { burst = !burst; burstBtn.html(burst ? 'Peak (10k/sec)' : 'Show burst (50k/sec)'); });
  resetBtn = createButton('Reset to 60s'); resetBtn.position(170, drawHeight + 8); resetBtn.mousePressed(function () { cadenceSlider.value(60); burst = false; burstBtn.html('Show burst (50k/sec)'); });
  describe('Slider explorer of summarizer sync cadence versus write rate and lag.', LABEL);
}
// distinct active grains saturating curve anchored at (5,50k),(60,150k),(300,300k)
function grains(cad) {
  return Math.round(300000 * (1 - Math.exp(-cad / 95)) + 8000);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(17);
  text('Sync Cadence Tradeoff', canvasWidth / 2, 12);

  let cad = cadenceSlider.value();
  // snap to anchor ticks
  [5, 60, 300].forEach(function (a) { if (Math.abs(cad - a) <= 2) cad = a; });
  const ingest = burst ? 50000 : 10000;
  const coalesced = ingest * cad;
  const g = grains(cad);
  const upserts = Math.round(g / cad);
  const lag = cad;

  // four readouts
  const cards = [
    { label: 'Statements coalesced', val: coalesced.toLocaleString(), c: '#2a9d8f' },
    { label: 'Distinct active grains', val: g.toLocaleString(), c: '#1a7f72' },
    { label: 'Graph upserts/sec', val: upserts.toLocaleString(), c: '#e9a23b' },
    { label: 'Graph lag', val: lag + ' s', c: '#7b6cc4' }
  ];
  const cw = (canvasWidth - 2 * margin - 3 * 10) / 4, cy = 60, ch = 90;
  cards.forEach(function (cd, i) {
    const x = margin + i * (cw + 10);
    fill(cd.c); noStroke(); rect(x, cy, cw, ch, 8);
    fill('#fff'); textAlign(CENTER, TOP); textSize(11.5); text(cd.label, x + 4, cy + 8, cw - 8);
    textAlign(CENTER, CENTER); textSize(cd.val.length > 8 ? 15 : 20); textStyle(BOLD);
    text(cd.val, x + cw / 2, cy + ch / 2 + 8); textStyle(NORMAL);
  });

  // comparison bar vs 10,000/sec naive reference
  const barY = 180, barH = 30, barMaxW = canvasWidth - 2 * margin;
  noStroke(); fill('#f0d6d6'); rect(margin, barY, barMaxW, barH, 4);
  fill('#c0392b'); rect(margin, barY, barMaxW, 4); // reference line at top of bar
  fill('#2a9d8f'); rect(margin, barY, barMaxW * Math.min(1, upserts / 10000), barH, 4);
  fill('#7a2b2b'); textAlign(RIGHT, BOTTOM); textSize(11); text('10,000/sec naive (prohibited)', canvasWidth - margin, barY - 2);
  fill('#fff'); textAlign(LEFT, CENTER); textSize(12); text(upserts.toLocaleString() + ' upserts/sec', margin + 6, barY + barH / 2);

  // caption
  fill('#444'); textAlign(CENTER, TOP); textSize(12.5);
  text(burst ? 'Under a 50k/sec burst, coalesced statements jump 5x but upserts/sec barely move — burst insensitivity.'
             : 'Longer cadence trades freshness (lag) for a gentler write rate. 60 s is the design default.', margin, barY + barH + 16, barMaxW);

  // slider label
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(14);
  text('Sync cadence: ' + cad + ' s', margin, drawHeight - 34);
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); cadenceSlider.size(canvasWidth - 150 - margin - 60); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
