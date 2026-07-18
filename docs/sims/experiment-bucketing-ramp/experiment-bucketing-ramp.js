// Experiment Bucketing Ramp
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 620;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 16;

let allocSlider, rampBox, resetBtn;
let maxBoundaryReached = 0; // ramp rule: boundary never moves backward
const STUDENTS = [];
let seed = 7;

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  // five students at fixed seeded bucket positions
  for (let i = 0; i < 5; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; STUDENTS.push({ name: 'S' + (i + 1), bucket: seed % 10000 }); }
  allocSlider = createSlider(0, 100, 30, 1); allocSlider.position(160, drawHeight - 40); allocSlider.size(canvasWidth - 160 - margin - 40);
  rampBox = createCheckbox(' Enforce Ramping Allocation Rule', true); rampBox.position(10, drawHeight + 8);
  resetBtn = createButton('Reset'); resetBtn.position(canvasWidth - 70, drawHeight + 8); resetBtn.mousePressed(function () { allocSlider.value(30); maxBoundaryReached = 30; });
  maxBoundaryReached = 30;
  describe('Experiment bucketing with a ramping allocation rule that prevents backward moves.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(16);
  text('xxhash64 Bucketing + Ramp Rule', canvasWidth / 2, 10);

  let alloc = allocSlider.value();
  let rampBlocked = false;
  if (rampBox.checked()) {
    if (alloc < maxBoundaryReached) { rampBlocked = true; alloc = maxBoundaryReached; allocSlider.value(alloc); }
    else maxBoundaryReached = alloc;
  }
  const boundary = alloc / 100;

  // tick strip
  const stripX = margin, stripY = 60, stripW = canvasWidth - 2 * margin, stripH = 60;
  const bx = stripX + boundary * stripW;
  fill('#2a9d8f'); noStroke(); rect(stripX, stripY, boundary * stripW, stripH); // treatment
  fill('#9aa7b4'); rect(bx, stripY, stripW - boundary * stripW, stripH);        // control
  stroke('#c0392b'); strokeWeight(rampBlocked ? 4 : 2); line(bx, stripY - 6, bx, stripY + stripH + 6);
  noStroke(); fill('#fff'); textAlign(LEFT, CENTER); textSize(12); text('Treatment', stripX + 8, stripY + stripH / 2);
  fill('#333'); textAlign(RIGHT, CENTER); text('Control', stripX + stripW - 8, stripY + stripH / 2);

  // student dots at fixed buckets
  const dotY = 180;
  STUDENTS.forEach(function (s) {
    const x = stripX + (s.bucket / 10000) * stripW;
    const inTreatment = (s.bucket / 10000) < boundary;
    // detect flip-back bug when rule off
    const bug = (!rampBox.checked()) && ((s.bucket / 10000) < maxBoundaryReached / 100) && !inTreatment;
    fill(bug ? '#c0392b' : (inTreatment ? '#2a9d8f' : '#9aa7b4'));
    stroke('#fff'); strokeWeight(2); circle(x, dotY, 26);
    noStroke(); fill('#fff'); textAlign(CENTER, CENTER); textSize(11); text(s.name, x, dotY);
    fill('#333'); textAlign(CENTER, TOP); textSize(10); text('bkt ' + s.bucket, x, dotY + 16);
    if (bug) { fill('#c0392b'); textAlign(CENTER, TOP); textSize(10); text('flipped back!', x, dotY + 30); }
  });

  noStroke(); fill('#444'); textAlign(CENTER, TOP); textSize(12.5);
  if (rampBlocked) text('Ramp rule BLOCKED a leftward move — allocation can only increase.', margin, 240, canvasWidth - 2 * margin);
  else if (!rampBox.checked()) text('Rule OFF: moving the boundary left can flip a student from treatment back to control — this is the bug the rule prevents.', margin, 240, canvasWidth - 2 * margin);
  else text('Each bucket number is FIXED; only the boundary moves. Buckets never change with allocation.', margin, 240, canvasWidth - 2 * margin);

  fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(13); text('Treatment allocation: ' + alloc + '%', margin, drawHeight - 30);
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); allocSlider.size(canvasWidth - 160 - margin - 40); resetBtn.position(canvasWidth - 70, drawHeight + 8); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 620; canvasWidth = containerWidth; }
