// Concept Mastery Radar
// CANVAS_HEIGHT: 470
let containerWidth;
let canvasWidth = 560;
let drawHeight = 430;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;

let studentSlider;
let selectedSpoke = -1;

const CATS = ['Vocabulary', 'Procedures', 'Analysis', 'Application', 'Synthesis', 'Evaluation'];
const STUDENTS = [
  { name: 'Amara', scores: [0.85, 0.70, 0.45, 0.60, 0.30, 0.55], weak: { Analysis: 'Cell signaling, Feedback loops', Synthesis: 'Systems integration, Model building' } },
  { name: 'Devon', scores: [0.55, 0.50, 0.60, 0.40, 0.65, 0.45], weak: { Application: 'Word problems, Lab design', Vocabulary: 'Technical terms' } },
  { name: 'Priya', scores: [0.90, 0.88, 0.80, 0.85, 0.72, 0.78], weak: { Synthesis: 'Cross-topic synthesis' } }
];

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  studentSlider = createSlider(0, 2, 0, 1); studentSlider.position(150, drawHeight + 10); studentSlider.size(200);
  describe('Radar chart of one student mastery by taxonomy category, with a 0.75 reference ring.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  const s = STUDENTS[studentSlider.value()];
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Concept Mastery Radar — ' + s.name, canvasWidth / 2, 8);

  const cx = canvasWidth / 2, cy = drawHeight / 2 + 10, R = Math.min(canvasWidth, drawHeight) * 0.32;
  const n = CATS.length;
  // grid rings
  stroke('#d5dde3'); strokeWeight(1); noFill();
  for (let r = 1; r <= 4; r++) { beginShape(); for (let i = 0; i < n; i++) { const a = -HALF_PI + i * TWO_PI / n; vertex(cx + cos(a) * R * r / 4, cy + sin(a) * R * r / 4); } endShape(CLOSE); }
  // 0.75 reference ring (dashed gray)
  stroke('#999'); drawingContext.setLineDash([5, 4]); beginShape(); for (let i = 0; i < n; i++) { const a = -HALF_PI + i * TWO_PI / n; vertex(cx + cos(a) * R * 0.75, cy + sin(a) * R * 0.75); } endShape(CLOSE); drawingContext.setLineDash([]);
  // spoke lines + labels
  for (let i = 0; i < n; i++) {
    const a = -HALF_PI + i * TWO_PI / n;
    stroke('#d5dde3'); line(cx, cy, cx + cos(a) * R, cy + sin(a) * R);
    noStroke(); fill(selectedSpoke === i ? '#e9a23b' : '#37474f'); textAlign(CENTER, CENTER); textSize(11);
    const lx = cx + cos(a) * (R + 30), ly = cy + sin(a) * (R + 22);
    text(CATS[i], lx, ly);
  }
  // mastery polygon
  fill(42, 157, 143, 90); stroke('#2a9d8f'); strokeWeight(2);
  beginShape(); for (let i = 0; i < n; i++) { const a = -HALF_PI + i * TWO_PI / n; vertex(cx + cos(a) * R * s.scores[i], cy + sin(a) * R * s.scores[i]); } endShape(CLOSE);
  for (let i = 0; i < n; i++) { const a = -HALF_PI + i * TWO_PI / n; fill('#1f7a6f'); noStroke(); circle(cx + cos(a) * R * s.scores[i], cy + sin(a) * R * s.scores[i], 6); }

  // weakest callout / selected info
  noStroke(); textAlign(CENTER, TOP); textSize(12);
  let minI = 0; s.scores.forEach(function (v, i) { if (v < s.scores[minI]) minI = i; });
  if (selectedSpoke >= 0 && s.weak[CATS[selectedSpoke]]) { fill('#b8791f'); text(CATS[selectedSpoke] + ' (' + s.scores[selectedSpoke].toFixed(2) + ') — pulled down by: ' + s.weak[CATS[selectedSpoke]], 10, drawHeight - 26, canvasWidth - 20); }
  else { fill('#666'); text('Weakest category: ' + CATS[minI] + ' (' + s.scores[minI].toFixed(2) + '). Dashed ring = 0.75 mastery threshold. Click a spoke label.', 10, drawHeight - 26, canvasWidth - 20); }
  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(12); text('Student:', 10, drawHeight + 20);
}
function mousePressed() {
  const cx = canvasWidth / 2, cy = drawHeight / 2 + 10, R = Math.min(canvasWidth, drawHeight) * 0.32, n = CATS.length;
  for (let i = 0; i < n; i++) { const a = -HALF_PI + i * TWO_PI / n; const lx = cx + cos(a) * (R + 30), ly = cy + sin(a) * (R + 22); if (dist(mouseX, mouseY, lx, ly) < 40) { selectedSpoke = selectedSpoke === i ? -1 : i; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 560; canvasWidth = containerWidth; }
