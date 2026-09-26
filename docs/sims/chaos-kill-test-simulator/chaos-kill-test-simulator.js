// Chaos Kill Test Simulator
// CANVAS_HEIGHT: 480
let containerWidth;
let canvasWidth = 640;
let drawHeight = 440;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 12;

let svcSel, killBtn, restoreBtn, resetBtn, p1, p2, p3;
let killed = null;
let prediction = null;
let revealed = false;

const SERVICES = ['Gateway', 'Kafka', 'Processor', 'ClickHouse', 'Summarizer', 'Neo4j', 'Redis', 'Identity'];
// effect on [Ingestion, Graph Freshness, Dashboard Latency] + prediction answer + note
const EFFECT = {
  Gateway: { lights: ['red', 'green', 'amber'], answer: 'Some data loss', note: 'Gateway down: new statements are rejected (503) until it recovers — some in-flight loss. It is the durability boundary.' },
  Kafka: { lights: ['red', 'amber', 'green'], answer: 'Some data loss', note: 'Kafka down: ingestion stops immediately. Anything not yet acked is lost; already-acked data is safe.' },
  Processor: { lights: ['amber', 'amber', 'green'], answer: 'No data loss', note: 'Processor down: statements wait safely in Kafka; graph freshness lags but nothing is lost.' },
  ClickHouse: { lights: ['amber', 'amber', 'red'], answer: 'No data loss', note: 'ClickHouse down: the processor pauses (backpressure); data waits in Kafka. Dashboards fail until it returns.' },
  Summarizer: { lights: ['green', 'red', 'green'], answer: 'No data loss', note: 'Summarizer stopped: graph freshness climbs (stale) but ClickHouse still has everything — recompute on restart.' },
  Neo4j: { lights: ['green', 'red', 'amber'], answer: 'No data loss', note: 'Neo4j down: the graph is a projection — rebuildable from ClickHouse by resetting the watermark. No loss.' },
  Redis: { lights: ['green', 'green', 'amber'], answer: 'No data loss', note: 'Redis down: only dashboard latency rises (cache miss); it repopulates on the next query. No loss.' },
  Identity: { lights: ['amber', 'green', 'green'], answer: 'Some data loss', note: 'Identity down: statements cannot be pseudonymized/resolved; ingestion degrades until it recovers.' }
};

// ---- xAPI (docs/js/lrs-sim.js). Without it (p5.js editor) the sim still runs, silently. ----
// Full vs. Compact and any teaching panel come from config; this production sim shows nothing.
// The evidence is the CHECKED prediction: each Kill is one `answered` for the service it
// predicts (#q-kafka), in both modes. Choosing a service or a prediction, Restore, and Reset
// are exposure evidence of the page concept, and fold into the Compact summary.
const PAGE_CONCEPT = 353;   // Chaos Kill Test
// The learning-graph failure mode each question tests. Deliberately NOT mapped (their answers
// reach no concept rollup; see metadata.json): Gateway and Processor have no failure-mode
// concept in the learning graph, and Identity's answer above contradicts Chapter 19 (Identity
// Service Unavailable loses no data), so its `success` would credit the wrong belief.
const FAILURE_CONCEPT = { Kafka: 334, ClickHouse: 335, Neo4j: 336, Summarizer: 337, Redis: 340 };
let lrs = null, serviceEv, predictionEv, restoreEv, resetEv;
const questions = {};
let roundStartedAt = null;  // when the service was chosen: the sim clears the prediction then
let lastCheck = null;       // { s, p, at } of the last answer this round

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  svcSel = createSelect(); svcSel.position(10, drawHeight + 8); svcSel.option('Pick a service'); SERVICES.forEach(function (s) { svcSel.option(s); });
  svcSel.changed(function () { killed = null; revealed = false; prediction = null; xapiService(svcSel.value()); });
  killBtn = createButton('Kill'); killBtn.position(160, drawHeight + 8); killBtn.mousePressed(function () { const s = svcSel.value(); if (SERVICES.indexOf(s) >= 0 && prediction) { killed = s; revealed = true; xapiCheck(s, prediction); } });
  restoreBtn = createButton('Restore'); restoreBtn.position(210, drawHeight + 8); restoreBtn.mousePressed(function () { const wasDown = killed; killed = null; revealed = false; if (lrs && wasDown) restoreEv.press('restore'); });
  resetBtn = createButton('Reset'); resetBtn.position(280, drawHeight + 8); resetBtn.mousePressed(function () { const dirty = killed || prediction || SERVICES.indexOf(svcSel.value()) >= 0; killed = null; revealed = false; prediction = null; svcSel.selected('Pick a service'); xapiReset(dirty); });
  describe('Predict then verify how killing a service affects ingestion, graph freshness, and latency.', LABEL);

  if (window.LRSSim) {
    const c = LRS.conceptId(PAGE_CONCEPT);
    // No Run control, so time on the sim is page dwell (Full: one `experienced` on focus loss).
    lrs = LRSSim.create({ name: 'Chaos Kill Test Simulator', concept: c, pageDwell: true,
                          mount: '#xapi-slot', source: 'the Chaos Kill Test Simulator MicroSim' });
    serviceEv = lrs.item('service-select', { name: 'Service to Kill', concept: c });
    predictionEv = lrs.item('prediction', { name: 'Data-Loss Prediction', concept: c });
    restoreEv = lrs.button('restore-button', { name: 'Restore Button', concept: c });
    resetEv = lrs.button('reset-button', { name: 'Reset Button', concept: c });
  }
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Chaos Kill Test', canvasWidth / 2, 8);

  // service icons row
  const n = SERVICES.length, iw = (canvasWidth - 2 * margin) / n, iy = 40;
  SERVICES.forEach(function (s, i) {
    const x = margin + i * iw + iw / 2;
    const dead = killed === s;
    fill(dead ? '#c0392b' : '#2a9d8f'); noStroke(); rectMode(CENTER); rect(x, iy + 24, iw - 8, 44, 6); rectMode(CORNER);
    // No box width in text(): with one, p5 treats x as the box's LEFT edge, which pushed every
    // name half a box right and clipped it ("Gate", "Ka"). Centre on x; shrink a name that won't fit.
    fill('#fff'); textAlign(CENTER, CENTER); textSize(10);
    if (textWidth(s) > iw - 12) textSize(10 * (iw - 12) / textWidth(s));
    text(s, x, iy + 18);
    const status = dead ? '✕ down' : '● healthy';
    fill(dead ? '#ffd0d0' : '#d7f5ee'); textSize(9);
    if (textWidth(status) > iw - 12) textSize(9 * (iw - 12) / textWidth(status));
    text(status, x, iy + 34);
  });

  // status lights
  const lights = revealed && killed ? EFFECT[killed].lights : ['green', 'green', 'green'];
  const labels = ['Ingestion', 'Graph Freshness', 'Dashboard Latency'];
  const ly = 130, lw = (canvasWidth - 2 * margin) / 3;
  labels.forEach(function (lbl, i) {
    const x = margin + i * lw;
    const c = lights[i] === 'red' ? '#c0392b' : lights[i] === 'amber' ? '#e9a23b' : '#2f9e6f';
    fill(c); noStroke(); rect(x + 8, ly, lw - 16, 40, 6);
    fill('#fff'); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(12); text(lbl, x + lw / 2, ly + 14); textStyle(NORMAL);
    textSize(11); text(lights[i].toUpperCase(), x + lw / 2, ly + 30);
  });

  // prediction buttons (drawn) — click to choose
  const preds = ['No data loss', 'Some data loss', 'System fully down'];
  const py = 200, pw = (canvasWidth - 2 * margin) / 3;
  noStroke(); fill('#37474f'); textAlign(LEFT, TOP); textSize(12); text('1. Predict before killing:', margin, py - 20);
  preds.forEach(function (p, i) {
    const x = margin + i * pw;
    fill(prediction === p ? '#2a9d8f' : '#e9edf0'); stroke('#c9d4dc'); strokeWeight(1); rect(x + 6, py, pw - 12, 34, 6);
    noStroke(); fill(prediction === p ? '#fff' : '#333'); textAlign(CENTER, CENTER); textSize(12); text(p, x + pw / 2, py + 17);
    if (mouseIsInside(x + 6, py, pw - 12, 34)) cursor(HAND);
  });

  // reveal panel
  noStroke(); textAlign(LEFT, TOP); textSize(12.5);
  if (revealed && killed) {
    const e = EFFECT[killed];
    const correct = prediction === e.answer;
    fill(correct ? '#2f6b48' : '#b8791f');
    text('You predicted: ' + prediction + '.  Actual: ' + e.answer + (correct ? '  ✓ correct' : '  — reconsider') + '\n\n' + e.note, margin, py + 46, canvasWidth - 2 * margin, drawHeight - py - 46);
  } else {
    fill('#666'); text(prediction ? 'Now pick a service and press Kill.' : 'Pick a prediction, then a service, then Kill. Restore to recover.', margin, py + 46, canvasWidth - 2 * margin);
  }
}
function mouseIsInside(x, y, w, h) { return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h; }
function mousePressed() {
  const preds = ['No data loss', 'Some data loss', 'System fully down'];
  const py = 200, pw = (canvasWidth - 2 * margin) / 3;
  // xAPI reports from INSIDE the hit branch: mousePressed() fires for every click on the page.
  // Picking is not answering; the answer is emitted at Kill, when the pick is checked.
  preds.forEach(function (p, i) { const x = margin + i * pw; if (mouseIsInside(x + 6, py, pw - 12, 34)) { const changed = prediction !== p; prediction = p; if (lrs && changed) predictionEv.study('select'); } });
}
// ---- xAPI helpers: each is a no-op without the runtime ----
// A new service starts a new round (the sim itself clears the prediction when it changes).
function xapiService(s) {
  if (!lrs) return;
  lastCheck = null;
  roundStartedAt = SERVICES.indexOf(s) >= 0 ? Date.now() : null;
  if (roundStartedAt) serviceEv.study('select');   // back to "Pick a service" is not a choice
}
// Kill with a prediction checks it: one class-5 answer, emitted now, in both modes. Every
// attempt counts, wrong ones included; pressing Kill again on the pair already checked this
// round (a double-click, or Restore then Kill) is not a new attempt.
function xapiCheck(s, p) {
  if (!lrs || (lastCheck && lastCheck.s === s && lastCheck.p === p)) return;
  const now = Date.now(), q = xapiQuestion(s);
  q.attempts++;
  q.handle.answer({ success: p === EFFECT[s].answer, response: LRS.slug(p),
                    durationMs: now - (lastCheck ? lastCheck.at : roundStartedAt || now),
                    extensions: { 'attempt-number': q.attempts } });
  lastCheck = { s: s, p: p, at: now };
}
function xapiQuestion(s) {
  const key = 'q-' + LRS.slug(s);
  if (!questions[key]) {
    const n = FAILURE_CONCEPT[s];
    if (n === undefined) {
      console.warn('[chaos-kill-test-simulator] no concept mapped for "' + s +
                   '" — its answers will reach no concept rollup (contract §6)');
    }
    questions[key] = { attempts: 0, handle: lrs.question(key, {
      name: 'Predict the effect of killing ' + s, concept: n === undefined ? undefined : LRS.conceptId(n) }) };
  }
  return questions[key];
}
function xapiReset(dirty) {
  if (!lrs) return;
  lastCheck = null; roundStartedAt = null;
  if (dirty) resetEv.press('reset');                 // a Reset with nothing to reset is not evidence
}

function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
