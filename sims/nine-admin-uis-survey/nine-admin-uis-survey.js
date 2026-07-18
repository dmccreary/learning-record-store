// Nine Admin UIs Survey
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 640;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let roleSel;
let expanded = null;
let roleFilter = 'All roles';

const ROLES = ['System Admin', 'District Admin', 'School Admin', 'Teacher', 'Author', 'Auditor'];
const UIS = [
  { name: 'District Management', ch: 25, icon: '🏢', desc: 'Configure a district: roster source, data residency, retention, legal hold.', roles: ['System Admin', 'District Admin'] },
  { name: 'School / Course / Section', ch: 25, icon: '▦', desc: 'Manage the tenancy hierarchy below the district.', roles: ['System Admin', 'District Admin', 'School Admin'] },
  { name: 'Textbook Deployment', ch: 25, icon: '📦', desc: 'Bind textbook versions to sections.', roles: ['System Admin', 'District Admin', 'School Admin'] },
  { name: 'xAPI Credentials', ch: 0, icon: '🔑', desc: 'Issue and revoke Learning Record Provider credentials.', roles: ['System Admin', 'District Admin'] },
  { name: 'Experiment Administration', ch: 0, icon: '⚗', desc: 'Define and monitor A/B experiments.', roles: ['System Admin', 'Author'] },
  { name: 'User & Access Management', ch: 26, icon: '🛡', desc: 'Assign roles and scopes; run access reviews and impersonation.', roles: ['System Admin', 'District Admin'] },
  { name: 'Privacy Compliance', ch: 27, icon: '🛡', desc: 'Manage suppression thresholds, consent, and erasure requests.', roles: ['System Admin', 'District Admin', 'Auditor'] },
  { name: 'Audit Monitoring', ch: 0, icon: '🔍', desc: 'Browse the immutable audit log.', roles: ['System Admin', 'Auditor'] },
  { name: 'System Configuration', ch: 0, icon: '⚙', desc: 'Platform-wide retention defaults, feature flags, rate limits, alerting.', roles: ['System Admin'] }
];
function chColor(ch) { return ch === 25 ? '#2a9d8f' : ch === 26 ? '#7b6cc4' : ch === 27 ? '#e9a23b' : '#8b9bb0'; }

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  roleSel = createSelect(); roleSel.position(10, drawHeight + 8);
  roleSel.option('All roles'); ROLES.forEach(function (r) { roleSel.option(r); });
  roleSel.changed(function () { roleFilter = roleSel.value(); });
  describe('Survey of the nine admin UIs, filterable by which role can open each.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Nine Admin UIs', canvasWidth / 2, 8);

  const cols = 3, gap = 8, gx = margin, gy = 34;
  const cw = (canvasWidth - 2 * margin - (cols - 1) * gap) / cols;
  const ch = (drawHeight - gy - margin - 2 * gap) / 3;
  UIS.forEach(function (u, i) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = gx + col * (cw + gap), y = gy + row * (ch + gap);
    const accessible = roleFilter === 'All roles' || u.roles.indexOf(roleFilter) >= 0;
    const c = color(chColor(u.ch)); c.setAlpha(accessible ? 255 : 70);
    fill(c); stroke(expanded === i ? '#333' : '#fff'); strokeWeight(expanded === i ? 2 : 1);
    rect(x, y, cw, ch, 8);
    noStroke(); fill(accessible ? '#fff' : 'rgba(255,255,255,0.5)'); textAlign(CENTER, TOP); textSize(20); text(u.icon, x + cw / 2, y + 8);
    textStyle(BOLD); textSize(12); text(u.name, x + cw / 2, y + 36, cw - 8); textStyle(NORMAL);
    if (expanded === i) {
      textSize(10); textAlign(LEFT, TOP); text(u.desc, x + 6, y + 62, cw - 12, ch - 90);
      textSize(9); fill('#fff'); text('roles: ' + u.roles.join(', '), x + 6, y + ch - 22, cw - 12);
    }
    u._r = { x: x, y: y, w: cw, h: ch };
  });
  noStroke(); fill('#666'); textAlign(RIGHT, CENTER); textSize(11);
  text(roleFilter === 'All roles' ? 'Filter by role to dim inaccessible UIs' : ('Showing what ' + roleFilter + ' can open'), canvasWidth - margin, drawHeight + controlHeight / 2);
}
function mousePressed() {
  for (let i = 0; i < UIS.length; i++) { const r = UIS[i]._r; if (r && mouseX > r.x && mouseX < r.x + r.w && mouseY > r.y && mouseY < r.y + r.h) { expanded = expanded === i ? null : i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
