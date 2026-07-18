// Makefile Target Explorer
// CANVAS_HEIGHT: 490
let containerWidth;
let canvasWidth = 640;
let drawHeight = 450;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let filterSel, searchIn;
let selected = 0;
let implOnly = false;

const T = [
  { name: 'up', cmd: 'docker compose up -d', desc: 'Start the whole stack in the background.', tags: ['start', 'run'], impl: true },
  { name: 'down', cmd: 'docker compose down', desc: 'Stop and remove the stack.', tags: ['stop'], impl: true },
  { name: 'clean', cmd: 'docker compose down -v && rm -rf .data', desc: 'Stop and delete all volumes and local data.', tags: ['reset', 'wipe'], impl: true },
  { name: 'logs', cmd: 'docker compose logs -f', desc: 'Tail logs from every service.', tags: ['tail', 'debug'], impl: true },
  { name: 'seed', cmd: 'lrs seed --demo', desc: 'Load demo data into the stores.', tags: ['demo', 'data'], impl: true },
  { name: 'smoke', cmd: 'scripts/smoke.sh', desc: 'Run the honest smoke check end to end.', tags: ['verify', 'health'], impl: true },
  { name: 'perf', cmd: 'lrs loadgen --rate 200', desc: 'Sustain the 200 stmt/sec baseline load.', tags: ['baseline', 'load'], impl: true },
  { name: 'burst', cmd: 'lrs loadgen --rate 1000 --burst', desc: 'Drive a 5x ingest burst for the insensitivity proof.', tags: ['load test', '5x', 'burst'], impl: true },
  { name: 'rebuild', cmd: 'docker compose build --no-cache', desc: 'Rebuild images from scratch.', tags: ['image', 'no-cache'], impl: true },
  { name: 'test', cmd: 'uv run pytest', desc: 'Run the unit and integration test suite.', tags: ['pytest', 'ci'], impl: true },
  { name: 'obs', cmd: '# (deferred) docker compose --profile obs up', desc: 'Bring up the observability stack (Jaeger/Prometheus/Grafana). Not yet built.', tags: ['tracing', 'not yet built', 'observability'], impl: false }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  filterSel = createSelect(); filterSel.position(10, drawHeight + 8);
  filterSel.option('Show all'); filterSel.option('Implemented only');
  filterSel.changed(function () { implOnly = filterSel.value() === 'Implemented only'; });
  searchIn = createInput(''); searchIn.attribute('placeholder', 'scenario, e.g. load test'); searchIn.position(180, drawHeight + 8); searchIn.size(200);
  searchIn.input(doSearch);
  describe('Explore the eleven make targets: implemented vs the deferred obs target.', LABEL);
}
function doSearch() {
  const q = searchIn.value().toLowerCase(); if (!q) return; let best = -1, bs = 0;
  T.forEach(function (t, i) { let s = 0; t.tags.forEach(function (g) { if (q.indexOf(g) >= 0 || g.indexOf(q) >= 0) s += 2; }); if (t.name.indexOf(q) >= 0) s += 3; if (s > bs) { bs = s; best = i; } });
  if (best >= 0) selected = best;
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('make Targets', canvasWidth / 2, 8);

  const listW = 180, tileH = 30, top = 34;
  let vy = top;
  T.forEach(function (t, i) {
    if (implOnly && !t.impl) return;
    const border = t.impl ? '#2a9d8f' : '#e9a23b';
    fill('#fff'); stroke(i === selected ? '#333' : '#ddd'); strokeWeight(i === selected ? 2 : 1);
    if (!t.impl) drawingContext.setLineDash([4, 3]);
    rect(margin, vy, listW, tileH, 5); drawingContext.setLineDash([]);
    noStroke(); fill(border); rect(margin, vy, 5, tileH, 5);
    fill('#222'); textAlign(LEFT, CENTER); textFont('monospace'); textSize(13); text('make ' + t.name, margin + 14, vy + tileH / 2); textFont('Arial');
    if (!t.impl) { fill('#b8791f'); textAlign(RIGHT, CENTER); textSize(9); text('deferred', margin + listW - 6, vy + tileH / 2); }
    t._y = vy; vy += tileH + 4;
  });

  const cx = margin * 2 + listW, cy = 34, cw = canvasWidth - cx - margin, ch = drawHeight - 42;
  const t = T[selected];
  fill('#f8fbfc'); stroke('#c9d4dc'); strokeWeight(1); rect(cx, cy, cw, ch, 8);
  noStroke(); fill(t.impl ? '#1f7a6f' : '#b8791f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(16); textFont('monospace');
  text('make ' + t.name, cx + 14, cy + 14); textStyle(NORMAL); textSize(12); fill('#333');
  text('$ ' + t.cmd, cx + 14, cy + 44, cw - 28); textFont('Arial');
  fill(t.impl ? '#2f6b48' : '#b8791f'); textSize(12); text(t.impl ? 'Status: Implemented' : 'Status: Deferred (not yet built)', cx + 14, cy + 78);
  fill('#333'); textSize(13); text(t.desc, cx + 14, cy + 104, cw - 28, ch - 120);
}
function mousePressed() {
  for (let i = 0; i < T.length; i++) { const t = T[i]; if (t._y != null && mouseX > margin && mouseX < margin + 180 && mouseY > t._y && mouseY < t._y + 30) { selected = i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
