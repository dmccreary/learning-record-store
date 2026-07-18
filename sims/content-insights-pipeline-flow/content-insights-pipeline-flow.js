// Content Insights Pipeline Flow
// CANVAS_HEIGHT: 500
let containerWidth;
let canvasWidth = 660;
let drawHeight = 460;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 10;

let resetBtn;
let selSource = -1, selReport = -1;

const SOURCES = [
  { name: 'PageEngagement', info: 'Grain (student, page): event_count, dwell_ms. Chapter 8.' },
  { name: 'MicroSimEngagement', info: 'Grain (student, microsim): interactions, dwell. Chapter 8.' },
  { name: 'QuestionResponse', info: 'Grain (student, question): correctness, attempts. Chapter 8.' },
  { name: 'ConceptMastery', info: 'Grain (student, concept): BKT mastery estimate. Chapter 8.' }
];
const REPORTS = [
  { name: 'Page Effectiveness', src: [0, 3], info: 'Which pages actually move mastery.' },
  { name: 'MicroSim Impact', src: [1, 3], info: 'Whether a sim improves mastery.' },
  { name: 'Confusing-Content Finder', src: [0, 1], info: 'High dwell, low mastery = confusing.' },
  { name: 'Drop-off Map', src: [0], info: 'Where learners stop engaging.' },
  { name: 'Concept-Coverage Gaps', src: [3], info: 'Concepts with little evidence.' },
  { name: 'Question Health', src: [2], info: 'Item difficulty and discrimination.' },
  { name: 'Version Comparison', src: [0, 1, 2, 3], info: 'Compare two content versions.' },
  { name: 'Cross-District Benchmark', src: [3], info: 'De-identified cross-district mastery.' }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(12);
  resetBtn = createButton('Reset'); resetBtn.position(10, drawHeight + 8); resetBtn.mousePressed(function () { selSource = -1; selReport = -1; });
  describe('Four summary vertices feeding eight content-insights reports through a hub.', LABEL);
}
function geom() {
  const srcX = margin, srcW = 150, repX = canvasWidth - margin - 160, repW = 160;
  const hubX = canvasWidth / 2 - 55, hubY = drawHeight / 2 - 24, hubW = 110, hubH = 48;
  const srcH = 40, srcGap = 10, srcTop = 44;
  const repH = 38, repGap = 6, repTop = 40;
  return { srcX: srcX, srcW: srcW, srcH: srcH, srcGap: srcGap, srcTop: srcTop, repX: repX, repW: repW, repH: repH, repGap: repGap, repTop: repTop, hub: { x: hubX, y: hubY, w: hubW, h: hubH } };
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Content Insights — Evidence to Reports', canvasWidth / 2, 6);
  const g = geom();

  // connection lines
  REPORTS.forEach(function (rep, ri) {
    const ry = g.repTop + ri * (g.repH + g.repGap) + g.repH / 2;
    const highlighted = selReport === ri;
    rep.src.forEach(function (si) {
      const sy = g.srcTop + si * (g.srcH + g.srcGap) + g.srcH / 2;
      const on = highlighted || selSource === si;
      stroke(on ? '#c0392b' : '#cfd8dc'); strokeWeight(on ? 2.5 : 1);
      // source -> hub -> report
      line(g.srcX + g.srcW, sy, g.hub.x, g.hub.y + g.hub.h / 2);
      line(g.hub.x + g.hub.w, g.hub.y + g.hub.h / 2, g.repX, ry);
    });
  });
  // hub
  fill('#37474f'); noStroke(); rect(g.hub.x, g.hub.y, g.hub.w, g.hub.h, 8);
  fill('#fff'); textAlign(CENTER, CENTER); textSize(11); text('Content Insights\nHub', g.hub.x + g.hub.w / 2, g.hub.y + g.hub.h / 2);
  // sources
  SOURCES.forEach(function (s, i) {
    const y = g.srcTop + i * (g.srcH + g.srcGap);
    fill(selSource === i ? '#1f7a6f' : '#2a9d8f'); stroke('#1f7a6f'); strokeWeight(1); rect(g.srcX, y, g.srcW, g.srcH, 6);
    noStroke(); fill('#fff'); textAlign(CENTER, CENTER); textSize(11); text(s.name, g.srcX + g.srcW / 2, y + g.srcH / 2);
  });
  // reports
  REPORTS.forEach(function (r, i) {
    const y = g.repTop + i * (g.repH + g.repGap);
    fill(selReport === i ? '#c9822b' : '#e9a23b'); stroke('#b8791f'); strokeWeight(1); rect(g.repX, y, g.repW, g.repH, 6);
    noStroke(); fill('#222'); textAlign(CENTER, CENTER); textSize(10.5); text(r.name, g.repX + g.repW / 2, y + g.repH / 2, g.repW - 6);
  });
  // info line
  noStroke(); textAlign(CENTER, TOP); textSize(12);
  if (selSource >= 0) { fill('#1f7a6f'); text(SOURCES[selSource].name + ' — ' + SOURCES[selSource].info, margin, drawHeight - 24, canvasWidth - 2 * margin); }
  else if (selReport >= 0) { fill('#b8791f'); text(REPORTS[selReport].name + ' — ' + REPORTS[selReport].info + '  (reads: ' + REPORTS[selReport].src.map(function (i) { return SOURCES[i].name; }).join(', ') + ')', margin, drawHeight - 24, canvasWidth - 2 * margin); }
  else { fill('#666'); text('Click a source or a report to highlight its connections. Every report is a view of the same four vertices.', margin, drawHeight - 24, canvasWidth - 2 * margin); }
}
function mousePressed() {
  const g = geom();
  SOURCES.forEach(function (s, i) { const y = g.srcTop + i * (g.srcH + g.srcGap); if (mouseX > g.srcX && mouseX < g.srcX + g.srcW && mouseY > y && mouseY < y + g.srcH) { selSource = i; selReport = -1; } });
  REPORTS.forEach(function (r, i) { const y = g.repTop + i * (g.repH + g.repGap); if (mouseX > g.repX && mouseX < g.repX + g.repW && mouseY > y && mouseY < y + g.repH) { selReport = i; selSource = -1; } });
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 660; canvasWidth = containerWidth; }
