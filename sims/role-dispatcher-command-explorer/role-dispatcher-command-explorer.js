// Role Dispatcher Command Explorer
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 640;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let filterSel, searchIn;
let selected = 0;
let filter = 'all';

const CMDS = [
  { name: 'bootstrap', kind: 'server', port: 'no port — exits when done', desc: 'One-shot: runs migrations and seeds config, then exits. Other roles wait for it to complete.', tags: ['migrate', 'setup', 'seed config'], oneShot: true },
  { name: 'identity', kind: 'server', port: 'internal only', desc: 'Long-running: resolves salted keys against the vault. The only service on vault-net.', tags: ['pseudonymize', 'salt', 'identity'], oneShot: false },
  { name: 'analytics-api', kind: 'server', port: '8081', desc: 'Long-running: backs every report and dashboard query.', tags: ['reports', 'dashboards', 'query'], oneShot: false },
  { name: 'admin-api', kind: 'server', port: '8082', desc: 'Long-running: serves admin UIs; every mutation audited.', tags: ['admin', 'rbac', 'audit'], oneShot: false },
  { name: 'dashboards', kind: 'server', port: '8080', desc: 'Long-running: the Dash/Plotly front end.', tags: ['ui', 'dash', 'plotly'], oneShot: false },
  { name: 'seed', kind: 'op', port: 'no port — exits when done', desc: 'One-shot: loads demo/showcase data into the stores.', tags: ['demo', 'load data'], oneShot: true },
  { name: 'loadgen', kind: 'op', port: 'no port — exits when done', desc: 'One-shot: generates synthetic load at the producer-contract shape.', tags: ['load test', '200/sec', 'burst'], oneShot: true },
  { name: 'replay', kind: 'op', port: 'no port — exits when done', desc: 'One-shot: replays the immutable log to rebuild a projection or the graph.', tags: ['recover', 'rebuild', 'fix bad data', 'rebuild graph'], oneShot: true },
  { name: 'healthcheck', kind: 'op', port: 'no port — exits when done', desc: 'One-shot: exit 0 if healthy. Used by Docker/K8s liveness probes.', tags: ['liveness', 'is it healthy', 'probe'], oneShot: true }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  filterSel = createSelect(); filterSel.position(10, drawHeight + 8);
  filterSel.option('Show all'); filterSel.option('Server roles'); filterSel.option('Operational commands');
  filterSel.changed(function () { const v = filterSel.value(); filter = v === 'Server roles' ? 'server' : (v === 'Operational commands' ? 'op' : 'all'); });
  searchIn = createInput(''); searchIn.attribute('placeholder', 'scenario, e.g. recover the graph'); searchIn.position(200, drawHeight + 8); searchIn.size(200);
  searchIn.input(doSearch);
  describe('Explore the nine lrs subcommands: server roles vs one-shot operational commands.', LABEL);
}
function doSearch() {
  const q = searchIn.value().toLowerCase();
  if (!q) return;
  let best = -1, bestScore = 0;
  CMDS.forEach(function (c, i) { let sc = 0; c.tags.forEach(function (t) { if (q.indexOf(t) >= 0 || t.indexOf(q) >= 0) sc += 2; }); if (c.name.indexOf(q) >= 0) sc += 3; if (sc > bestScore) { bestScore = sc; best = i; } });
  if (best >= 0) selected = best;
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('lrs Command Dispatcher', canvasWidth / 2, 8);

  const listW = 200, tileH = 30, top = 36;
  CMDS.forEach(function (c, i) {
    const dim = filter !== 'all' && c.kind !== filter;
    const y = top + i * (tileH + 4);
    const border = c.kind === 'server' ? '#2a9d8f' : '#e9a23b';
    fill(dim ? '#eef2f5' : '#fff'); stroke(i === selected ? '#333' : '#ddd'); strokeWeight(i === selected ? 2 : 1);
    rect(margin, y, listW, tileH, 5);
    noStroke(); fill(border); rect(margin, y, 5, tileH, 5);
    fill(dim ? '#bbb' : '#222'); textAlign(LEFT, CENTER); textFont('monospace'); textSize(13);
    text(c.name, margin + 14, y + tileH / 2); textFont('Arial');
    fill(border); textAlign(RIGHT, CENTER); textSize(9); text(c.kind === 'server' ? '↻' : '✓', margin + listW - 6, y + tileH / 2);
  });

  // detail card
  const cx = margin * 2 + listW, cy = 36, cw = canvasWidth - cx - margin, ch = drawHeight - 44;
  const c = CMDS[selected];
  fill('#f8fbfc'); stroke('#c9d4dc'); strokeWeight(1); rect(cx, cy, cw, ch, 8);
  noStroke(); fill(c.kind === 'server' ? '#1f7a6f' : '#b8791f'); textAlign(LEFT, TOP); textStyle(BOLD); textSize(16); textFont('monospace');
  text('lrs ' + c.name, cx + 14, cy + 14); textFont('Arial'); textStyle(NORMAL);
  fill('#37474f'); textSize(13);
  text((c.kind === 'server' ? 'SERVER ROLE (long-running)' : 'OPERATIONAL COMMAND (one-shot)'), cx + 14, cy + 44);
  text('Port: ' + c.port, cx + 14, cy + 68);
  fill('#333'); text(c.desc, cx + 14, cy + 96, cw - 28, ch - 110);
  fill('#888'); textSize(11); text('tags: ' + c.tags.join(', '), cx + 14, cy + ch - 26, cw - 28);
}
function mousePressed() {
  const listW = 200, tileH = 30, top = 36;
  for (let i = 0; i < CMDS.length; i++) { const y = top + i * (tileH + 4); if (mouseX > margin && mouseX < margin + listW && mouseY > y && mouseY < y + tileH) { selected = i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
