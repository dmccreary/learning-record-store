// ClickHouse lrs.statements Anatomy
// CANVAS_HEIGHT: 560
let containerWidth;
let canvasWidth = 640;
let drawHeight = 520;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let keyBtn, compBtn;
let mode = 'all'; // 'all' | 'key' | 'comp'
let selected = null;

const BANDS = [
  { name: 'Identity & Tenancy', color: '#3d5a80', cols: ['district_id', 'statement_id', 'student_key'] },
  { name: 'Statement Content', color: '#5aa0c4', cols: ['verb_id', 'object_type', 'object_id', 'textbook_id', 'version_id', 'section_id', 'concept_ids', 'result_score', 'result_success', 'duration_ms'] },
  { name: 'Lifecycle Flags', color: '#7b6cc4', cols: ['voided_by', 'provisional'] },
  { name: 'Timing & Raw', color: '#8b9bb0', cols: ['timestamp', 'stored_at', 'raw'] }
];
const KEY = ['district_id', 'student_key', 'timestamp', 'statement_id'];
const LOWCARD = ['verb_id', 'object_type', 'result_success', 'provisional'];
const ZSTD = ['raw', 'concept_ids', 'object_id'];
const INFO = {
  district_id: 'LowCardinality(String). The tenant. LEADS the ORDER BY so queries prune to one district before any sort.',
  statement_id: 'UUID. Unique id. Last in the ORDER BY key — a tiebreaker, not a prune key.',
  student_key: 'String (HMAC). Pseudonymous learner. Second in the ORDER BY so per-student rows sit together on disk.',
  verb_id: 'LowCardinality(String). The action. Compresses well — few distinct verbs.',
  object_type: 'LowCardinality(String). Activity type.',
  object_id: 'String, ZSTD. The activity IRI.',
  textbook_id: 'String. Which textbook.', version_id: 'String. Which version.',
  section_id: 'String. Class section.', concept_ids: 'Array(String), ZSTD. Covered concepts.',
  result_score: 'Nullable(Float). The score.', result_success: 'LowCardinality. Pass/fail.',
  duration_ms: 'UInt32. Time on task.',
  voided_by: 'Nullable(UUID). Set when voided.', provisional: 'LowCardinality(Bool). Stub flag.',
  timestamp: 'DateTime64. When it happened. THIRD in the ORDER BY — sorts within a student.',
  stored_at: 'DateTime64. When the LRS received it.', raw: 'String, ZSTD. Full JSON payload — compresses hard.'
};

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12);
  keyBtn = createButton('Highlight ORDER BY key'); keyBtn.position(10, drawHeight + 8); keyBtn.mousePressed(function () { mode = mode === 'key' ? 'all' : 'key'; });
  compBtn = createButton('Highlight compression'); compBtn.position(180, drawHeight + 8); compBtn.mousePressed(function () { mode = mode === 'comp' ? 'all' : 'comp'; });
  describe('Anatomy of the ClickHouse lrs.statements table and its ORDER BY key.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('lrs.statements — 18 columns', canvasWidth / 2, 8);

  // ORDER BY sidebar (top strip)
  fill('#eef6f5'); stroke('#2a9d8f'); strokeWeight(1); rect(margin, 32, canvasWidth - 2 * margin, 30, 6);
  noStroke(); fill('#1f7a6f'); textAlign(LEFT, CENTER); textSize(12);
  text('ORDER BY:  ' + KEY.join('  ->  ') + '   (prune, then sort)', margin + 8, 47);

  // columns
  const colW = (canvasWidth - 2 * margin - 12) / 2;
  let y = 74; const rowH = 22; let colX = margin;
  let count = 0;
  BANDS.forEach(function (band) {
    band.cols.forEach(function (col) {
      const x = colX;
      const inKey = KEY.indexOf(col) >= 0;
      const isComp = LOWCARD.indexOf(col) >= 0 || ZSTD.indexOf(col) >= 0;
      let dim = false;
      if (mode === 'key' && !inKey) dim = true;
      if (mode === 'comp' && !isComp) dim = true;
      const fillC = inKey && (mode !== 'comp') ? color('#2a9d8f') : color(band.color);
      fillC.setAlpha(dim ? 60 : 255);
      fill(fillC); stroke(selected === col ? '#e9a23b' : '#fff'); strokeWeight(selected === col ? 2 : 1);
      rect(x, y, colW, rowH, 3);
      noStroke(); fill(dim ? '#aaa' : '#fff'); textAlign(LEFT, CENTER); textSize(11.5);
      text(col + (inKey ? '  *' : ''), x + 6, y + rowH / 2);
      if (mode === 'comp' && !dim) { fill('#fff'); textAlign(RIGHT, CENTER); textSize(9); text(ZSTD.indexOf(col) >= 0 ? 'ZSTD' : 'LowCard', x + colW - 4, y + rowH / 2); }
      count++;
      y += rowH + 3;
      if (count === 9) { y = 74; colX = margin + colW + 12; }
    });
  });

  // info line
  noStroke(); textAlign(LEFT, TOP); textSize(12);
  if (selected) { fill('#1f7a6f'); text(selected + ' — ' + INFO[selected], margin, drawHeight - 60, canvasWidth - 2 * margin, 56); }
  else { fill('#666'); text('Click a column for its type and role. The ORDER BY leads with district_id + student_key so queries prune to one learner before sorting by time — timestamp alone would scatter each learner across the whole table.', margin, drawHeight - 60, canvasWidth - 2 * margin, 56); }
}
function mousePressed() {
  const colW = (canvasWidth - 2 * margin - 12) / 2; let y = 74; const rowH = 22; let colX = margin; let count = 0;
  for (const band of BANDS) for (const col of band.cols) {
    if (mouseX > colX && mouseX < colX + colW && mouseY > y && mouseY < y + rowH) { selected = col; return; }
    count++; y += rowH + 3; if (count === 9) { y = 74; colX = margin + colW + 12; }
  }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
