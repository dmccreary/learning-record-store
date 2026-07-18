// Privacy Access Audit Explorer
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 660;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 10;

let filterSel;
let selRow = -1, elevatedOnly = false;

const ROWS = [
  { actor: 'Ms. Alvarez', action: 'View section mastery', target: 'stu_8f2a', ts: '09:14', role: 'Teacher', elevated: false, perm: 'analytics:read (own sections)', note: 'Routine analytics: a teacher viewing their own section aggregates. Never exposes PII.' },
  { actor: 'D. Okafor', action: 'View adoption report', target: '(aggregate)', ts: '09:20', role: 'District Admin', elevated: false, perm: 'analytics:read (district)', note: 'Routine analytics: district-level aggregate, de-identified.' },
  { actor: 'D. Okafor', action: 'Resolve PII (erasure)', target: 'stu_2c19', ts: '10:02', role: 'District Admin', elevated: true, perm: 'pii:resolve (data-subject request)', note: 'ELEVATED: resolving a real identity during a data-subject erasure request. Requires an explicit request record; heavily audited.' },
  { actor: 'Auditor-1', action: 'Read audit log', target: '(log)', ts: '10:30', role: 'Auditor', elevated: false, perm: 'audit:read', note: 'Routine: read-only audit review. Cannot change anything.' },
  { actor: 'Mr. Chen', action: 'View student detail', target: 'stu_51bd', ts: '11:05', role: 'Teacher', elevated: false, perm: 'analytics:read (own students)', note: 'Routine: a teacher drilling into a student on their own roster.' },
  { actor: 'sys-svc', action: 'Export (signed URL)', target: '(bulk)', ts: '11:40', role: 'System Admin', elevated: false, perm: 'export:create', note: 'Routine bulk export of de-identified data via the Export API.' }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12);
  filterSel = createSelect(); filterSel.position(10, drawHeight + 8);
  filterSel.option('All access'); filterSel.option('Elevated only');
  filterSel.changed(function () { elevatedOnly = filterSel.value() === 'Elevated only'; selRow = -1; });
  describe('Sample privacy access audit table; click a row to see role and RBAC rule.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Privacy Access Audit', canvasWidth / 2, 6);

  const tx = margin, ty = 34, rowH = 30, cols = [0.20, 0.26, 0.16, 0.10, 0.16, 0.12];
  const tw = canvasWidth - 2 * margin;
  // header
  fill('#37474f'); noStroke(); rect(tx, ty, tw, 24);
  fill('#fff'); textAlign(LEFT, CENTER); textSize(11);
  const heads = ['Actor', 'Action', 'Target', 'Time', 'Role', 'Type'];
  let cx = tx + 6; heads.forEach(function (h, i) { text(h, cx, ty + 12); cx += cols[i] * tw; });

  let visIdx = 0;
  ROWS.forEach(function (r, i) {
    if (elevatedOnly && !r.elevated) return;
    const y = ty + 24 + visIdx * rowH;
    fill(r.elevated ? '#f6e3c6' : (selRow === i ? '#e7f4ef' : '#fff')); stroke('#dbe4ea'); strokeWeight(1); rect(tx, y, tw, rowH);
    noStroke(); fill('#333'); textAlign(LEFT, CENTER); textSize(11);
    let vx = tx + 6; [r.actor, r.action, r.target, r.ts, r.role].forEach(function (v, ci) { text(v, vx, y + rowH / 2, cols[ci] * tw - 4); vx += cols[ci] * tw; });
    fill(r.elevated ? '#b8791f' : '#2f6b48'); textStyle(BOLD); text(r.elevated ? 'Elevated' : 'Routine', vx, y + rowH / 2); textStyle(NORMAL);
    r._y = y; r._h = rowH;
    visIdx++;
  });

  // detail panel
  const dy = ty + 24 + (elevatedOnly ? 1 : ROWS.length) * rowH + 12;
  fill('#f8fbfc'); stroke('#c9d4dc'); strokeWeight(1); rect(tx, dy, tw, drawHeight - dy - 10, 8);
  noStroke(); textAlign(LEFT, TOP); textSize(12.5);
  if (selRow >= 0) { const r = ROWS[selRow]; fill(r.elevated ? '#b8791f' : '#1f7a6f'); text('Role: ' + r.role + '   |   RBAC permission: ' + r.perm + '\n\n' + r.note, tx + 12, dy + 10, tw - 24, drawHeight - dy - 24); }
  else { fill('#666'); text('Click a row to see the actor\'s role, the RBAC permission that authorized it, and whether the access was routine or elevated.', tx + 12, dy + 10, tw - 24); }
}
function mousePressed() {
  for (let i = 0; i < ROWS.length; i++) { const r = ROWS[i]; if (r._y != null && (!elevatedOnly || r.elevated) && mouseX > margin && mouseX < canvasWidth - margin && mouseY > r._y && mouseY < r._y + r._h) { selRow = i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 660; canvasWidth = containerWidth; }
