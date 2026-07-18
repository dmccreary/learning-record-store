// Authentication Scheme Comparison (Basic vs OAuth)
// CANVAS_HEIGHT: 460
// Click a cell for a justification; pick a scenario to highlight the recommended row.
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let serverBtn, browserBtn;
let scenario = null;   // 'server' | 'browser'
let selected = null;   // {r,c}

const CRITERIA = ['Credential exposure\nper request', 'Implementation\neffort', 'Revocation\nwithout password change', 'Best-fit Learning\nRecord Provider'];
const ROWS = ['Basic Authentication', 'OAuth Authentication'];
const CELLS = [
  ['Sends credentials every request', 'Very low — one header', 'No — must change the password', 'Server-side ingestion gateway'],
  ['Sends a short-lived token', 'Higher — token flow + refresh', 'Yes — revoke the token', 'Browser-based MicroSim']
];
const INFO = [
  ['Basic sends the base64 username:password on every request, so each call re-exposes the long-lived credential.', 'Basic is trivial: set one Authorization header. Ideal when the client is a trusted server you control.', 'To cut off Basic access you must rotate the underlying password — coarse and disruptive.', 'Best fit: a server-side textbook publisher ingesting through a gateway it fully controls.'],
  ['OAuth sends a short-lived access token, not the password, so a leaked token expires and never exposes the credential.', 'OAuth needs an authorization flow, token issuance, and refresh — more moving parts.', 'OAuth access is revoked by invalidating the token, without touching the user password — fine-grained.', 'Best fit: a browser-based MicroSim, where you never want a long-lived secret in the client.']
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  serverBtn = createButton('Scenario: server-side publisher'); serverBtn.position(10, drawHeight + 8); serverBtn.mousePressed(function () { scenario = 'server'; });
  browserBtn = createButton('Scenario: browser MicroSim'); browserBtn.position(230, drawHeight + 8); browserBtn.mousePressed(function () { scenario = 'browser'; });
  describe('Comparison table of Basic vs OAuth authentication with a scenario recommender.', LABEL);
}
function grid() {
  const labelW = 150, tableX = margin, tableTop = 74;
  const cols = CRITERIA.length, cellW = (canvasWidth - 2 * margin - labelW) / cols;
  const rowH = 70, headH = 44;
  return { labelW: labelW, tableX: tableX, tableTop: tableTop, cellW: cellW, rowH: rowH, headH: headH };
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('Basic vs OAuth Authentication', canvasWidth / 2, 10);

  const g = grid();
  // header row
  textSize(12);
  for (let c = 0; c < CRITERIA.length; c++) {
    fill('#37474f'); stroke('#fff'); strokeWeight(1);
    rect(g.tableX + g.labelW + c * g.cellW, g.tableTop, g.cellW, g.headH);
    noStroke(); fill('#fff'); textAlign(CENTER, CENTER); text(CRITERIA[c], g.tableX + g.labelW + c * g.cellW + g.cellW / 2, g.tableTop + g.headH / 2, g.cellW - 6);
  }
  // rows
  for (let r = 0; r < ROWS.length; r++) {
    const y = g.tableTop + g.headH + r * g.rowH;
    const recommended = (scenario === 'server' && r === 0) || (scenario === 'browser' && r === 1);
    fill(recommended ? '#d8f0ec' : '#eef2f5'); stroke('#c9d4dc'); strokeWeight(1);
    rect(g.tableX, y, g.labelW, g.rowH);
    noStroke(); fill(recommended ? '#1f7a6f' : '#1a3a5c'); textAlign(LEFT, CENTER); textStyle(BOLD); textSize(13);
    text(ROWS[r] + (recommended ? '  ★' : ''), g.tableX + 8, y + g.rowH / 2, g.labelW - 12); textStyle(NORMAL);
    for (let c = 0; c < CRITERIA.length; c++) {
      const x = g.tableX + g.labelW + c * g.cellW;
      const sel = selected && selected.r === r && selected.c === c;
      fill(sel ? '#fff4dc' : (recommended ? '#e7f4ef' : '#fff')); stroke('#c9d4dc'); strokeWeight(1);
      rect(x, y, g.cellW, g.rowH);
      noStroke(); fill('#333'); textAlign(CENTER, CENTER); textSize(11.5);
      text(CELLS[r][c], x + g.cellW / 2, y + g.rowH / 2, g.cellW - 8);
    }
  }
  // info line
  noStroke(); textAlign(CENTER, TOP); textSize(12.5);
  if (selected) { fill('#7a4a12'); text(INFO[selected.r][selected.c], margin, drawHeight - 46, canvasWidth - 2 * margin, 44); }
  else { fill('#666'); text('Click any cell for a justification, or pick a scenario to highlight the recommended scheme.', margin, drawHeight - 40, canvasWidth - 2 * margin); }
}
function mousePressed() {
  const g = grid();
  for (let r = 0; r < ROWS.length; r++) for (let c = 0; c < CRITERIA.length; c++) {
    const x = g.tableX + g.labelW + c * g.cellW, y = g.tableTop + g.headH + r * g.rowH;
    if (mouseX > x && mouseX < x + g.cellW && mouseY > y && mouseY < y + g.rowH) { selected = { r: r, c: c }; return; }
  }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
