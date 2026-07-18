// Single-Server Pilot VM Layout
// CANVAS_HEIGHT: 460
let containerWidth;
let canvasWidth = 640;
let drawHeight = 420;
let controlHeight = 40;
let canvasHeight = drawHeight + controlHeight;
let margin = 14;

let vaultBtn;
let selected = null;

const VMS = [
  { name: 'app', vcpu: 16, ram: 20, contents: 'Gateway, APIs, Dashboards, identity dispatcher', kind: 'workload' },
  { name: 'streaming-analytics', vcpu: 8, ram: 28, contents: 'Kafka/Redpanda, Stream Processor, ClickHouse', kind: 'workload' },
  { name: 'graph-cache', vcpu: 6, ram: 20, contents: 'Neo4j Community single instance + Redis', kind: 'workload' },
  { name: 'vault', vcpu: 2, ram: 4, contents: 'vault-db (PII vault) + identity service', kind: 'compliance' },
  { name: 'meta-objects', vcpu: 3, ram: 6, contents: 'meta-db (config/RBAC/audit) + MinIO', kind: 'workload' }
];
const TOTAL_VCPU = VMS.reduce(function (a, v) { return a + v.vcpu; }, 0);

function setup() {
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, canvasHeight);
  canvas.parent(document.querySelector('main'));
  textSize(13);
  vaultBtn = createButton('Why is vault separate?'); vaultBtn.position(10, drawHeight + 8);
  vaultBtn.mousePressed(function () { selected = 'vault'; });
  describe('Five VMs on one pilot server, sized by vCPU, with vault flagged as a compliance boundary.', LABEL);
}
function draw() {
  updateCanvasSize();
  background('aliceblue');
  stroke('silver'); strokeWeight(1); noFill(); rect(0, 0, canvasWidth, drawHeight);
  fill('white'); rect(0, drawHeight, canvasWidth, controlHeight);
  noStroke(); fill('#1a3a5c'); textAlign(CENTER, TOP); textSize(15);
  text('Single-Server Pilot — VM Layout', canvasWidth / 2, 8);

  // physical server frame
  const fx = margin, fy = 40, fw = canvasWidth - 2 * margin, fh = drawHeight - 130;
  fill('#eef2f5'); stroke('#37474f'); strokeWeight(2); rect(fx, fy, fw, fh, 8);
  noStroke(); fill('#37474f'); textAlign(LEFT, TOP); textSize(11);
  text('Physical Server (32-48 cores, 128 GB RAM, 2-4 TB NVMe RAID)', fx + 8, fy + 6);

  // VM boxes sized by vCPU
  let x = fx + 10; const y = fy + 30, h = fh - 44, innerW = fw - 20 - (VMS.length - 1) * 8;
  VMS.forEach(function (v) {
    const w = innerW * (v.vcpu / TOTAL_VCPU);
    const on = selected === v.name;
    if (v.kind === 'compliance') { fill(on ? '#e9a23b' : '#f3e2c2'); stroke('#b8791f'); strokeWeight(on ? 4 : 2); }
    else { fill(on ? '#2a9d8f' : '#8fd3c9'); stroke('#1f7a6f'); strokeWeight(on ? 3 : 1); }
    rect(x, y, w, h, 6);
    noStroke(); fill(v.kind === 'compliance' ? '#5a3a08' : '#0c2f2b'); textAlign(CENTER, TOP); textStyle(BOLD); textSize(11.5);
    text(v.name, x + w / 2, y + 8, w - 4); textStyle(NORMAL); textSize(10);
    text(v.vcpu + ' vCPU\n' + v.ram + ' GB', x + w / 2, y + 26, w - 4);
    v._x = x; v._y = y; v._w = w; v._h = h;
    x += w + 8;
  });
  // hypervisor band
  fill('#37474f'); noStroke(); rect(fx, fy + fh - 20, fw, 20);
  fill('#fff'); textAlign(CENTER, CENTER); textSize(10); text('Hypervisor (Proxmox / KVM / ESXi)', fx + fw / 2, fy + fh - 10);

  // info
  const sel = VMS.find(function (v) { return v.name === selected; });
  noStroke(); textAlign(LEFT, TOP); textSize(12.5);
  if (sel) {
    if (sel.kind === 'compliance') fill('#b8791f'); else fill('#1f7a6f');
    let msg = sel.name + ' — ' + sel.contents + '. ' + sel.vcpu + ' vCPU / ' + sel.ram + ' GB.';
    if (sel.name === 'vault') msg += '  Isolated for a COMPLIANCE reason: it holds the PII-to-key mapping, reachable only by the identity service — not a scale split like the others.';
    text(msg, margin, drawHeight - 78, canvasWidth - 2 * margin, 74);
  } else { fill('#666'); text('Boxes are sized by vCPU. Click a VM for its contents. Four VMs split workload for SCALE; vault (amber) is separate for COMPLIANCE.', margin, drawHeight - 60, canvasWidth - 2 * margin, 56); }
}
function mousePressed() {
  for (const v of VMS) { if (v._x != null && mouseX > v._x && mouseX < v._x + v._w && mouseY > v._y && mouseY < v._y + v._h) { selected = v.name; return; } }
}
function windowResized() { updateCanvasSize(); resizeCanvas(containerWidth, canvasHeight); redraw(); }
function updateCanvasSize() { const c = document.querySelector('main').getBoundingClientRect(); containerWidth = Math.floor(c.width) || 640; canvasWidth = containerWidth; }
