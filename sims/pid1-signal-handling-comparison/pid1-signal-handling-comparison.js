// PID 1 Signal Handling Comparison (exec vs shell form)
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let sendBtn, resetBtn, graceSlider;
let t0 = -1;   // frame the signal was sent (-1 = idle)

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  sendBtn = createButton('Send SIGTERM'); sendBtn.position(10, drawHeight + 8); sendBtn.mousePressed(function () { if (t0 < 0) t0 = frameCount; });
  resetBtn = createButton('Reset'); resetBtn.position(130, drawHeight + 8); resetBtn.mousePressed(function () { t0 = -1; });
  graceSlider = createSlider(1, 10, 5, 1); graceSlider.position(240, drawHeight + 10); graceSlider.size(canvasWidth - 240 - 60);
  describe('Compare SIGTERM handling under exec-form vs shell-form ENTRYPOINT.', LABEL);
}
function elapsed() { return t0 < 0 ? 0 : (frameCount - t0) / 60; }  // seconds (approx at 60fps)
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('SIGTERM under exec-form vs shell-form ENTRYPOINT', canvasWidth / 2, 8);

  const grace = graceSlider.value();
  const el = elapsed();
  const panelW = (canvasWidth - 3 * margin) / 2, panelX2 = margin * 2 + panelW, top = 40, panelH = drawHeight - top - 70;

  // LEFT: exec form
  drawPanel(margin, top, panelW, panelH, 'Exec form: ENTRYPOINT ["lrs"]');
  // exec: signal reaches lrs directly -> draining -> clean exit before grace
  let leftState = 'running';
  if (t0 >= 0) { if (el < 1) leftState = 'draining'; else leftState = 'exited'; }
  drawBox(margin + panelW / 2, top + 90, 'PID 1: lrs process', leftState);
  drawStatus(margin, top + panelH + 4, panelW, leftState === 'exited' ? 'Clean exit — in-flight request finished' : (leftState === 'draining' ? 'Draining…' : 'Running'), leftState);

  // RIGHT: shell form
  drawPanel(panelX2, top, panelW, panelH, 'Shell form: ENTRYPOINT lrs');
  let shellState = 'running', childState = 'running';
  if (t0 >= 0) {
    shellState = 'draining';
    if (el >= grace) { shellState = 'exited'; childState = 'killed'; }
    else childState = 'running'; // child never gets the signal
  }
  drawBox(panelX2 + panelW / 2, top + 60, 'PID 1: /bin/sh -c lrs', shellState);
  drawBox(panelX2 + panelW / 2, top + 130, 'PID 2 (child): lrs', childState);
  drawStatus(panelX2, top + panelH + 4, panelW, childState === 'killed' ? 'SIGKILL after ' + grace + 's — work LOST' : (t0 >= 0 ? 'Child unaware — countdown ' + Math.max(0, (grace - el)).toFixed(1) + 's' : 'Running'), childState);

  // signal travel indicator
  if (t0 >= 0 && el < 1) { fill('#c0392b'); noStroke(); textAlign(CENTER, TOP); textSize(11); text('SIGTERM →', canvasWidth / 2, top + 6); }

  // slider label
  noStroke(); fill('#1a3a5c'); textAlign(LEFT, CENTER); textSize(12); text('Grace: ' + grace + 's', canvasWidth - 55, drawHeight + 18);
}
function drawPanel(x, y, w, h, title) {
  noStroke(); fill('#f3f7f9'); stroke('#c9d4dc'); strokeWeight(1); rect(x, y, w, h, 8);
  noStroke(); fill('#37474f'); textAlign(CENTER, TOP); textSize(12); textStyle(BOLD); text(title, x, y + 6, w); textStyle(NORMAL);
}
function drawBox(cx, cy, label, state) {
  const c = state === 'running' ? '#2a9d8f' : state === 'draining' ? '#e9a23b' : state === 'exited' ? '#9aa7b4' : '#c0392b';
  fill(c); noStroke(); rectMode(CENTER); rect(cx, cy, 190, 44, 8); rectMode(CORNER);
  fill('#fff'); textAlign(CENTER, CENTER); textSize(12); text(label, cx, cy - 6, 180);
  textSize(10); text(state === 'running' ? '● running' : state === 'draining' ? '● draining' : state === 'exited' ? '○ exited' : '✕ killed', cx, cy + 12);
}
function drawStatus(x, y, w, msg, state) {
  const c = state === 'killed' ? '#c0392b' : state === 'exited' ? '#2f6b48' : '#666';
  noStroke(); fill(c); textAlign(CENTER, TOP); textSize(11.5); text(msg, x, y, w);
}
function mousePressed() {
  // click a box for info (child box in shell panel)
  const panelW = (canvasWidth - 3 * margin) / 2, panelX2 = margin * 2 + panelW, top = 40;
  // no-op infobox kept simple; boxes clarified via labels
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); graceSlider.size(canvasWidth - 240 - 60); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
