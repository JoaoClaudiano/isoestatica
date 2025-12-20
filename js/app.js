const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = "draw";
let mouse = { x: 0, y: 0 };
let temp = null;

/* ==========================
   MODELO
========================== */
const model = {
  nodes: [],
  elements: [],
  loads: [] // { type, elementId, s, value }
};

/* ==========================
   EVENTOS
========================== */
canvas.addEventListener("mousemove", e => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
  redraw();
});

canvas.addEventListener("mousedown", e => {
  if (tool === "draw") startElement(e);
  if (tool === "load") addPointLoad(e);
});

canvas.addEventListener("mouseup", e => {
  if (temp?.type === "element") finishElement(e);
});

/* ==========================
   ELEMENTOS
========================== */
function startElement(e) {
  const n = createNode(e.offsetX, e.offsetY);
  temp = { type: "element", n1: n };
}

function finishElement(e) {
  const n2 = createNode(e.offsetX, e.offsetY);

  const dx = n2.x - temp.n1.x;
  const dy = n2.y - temp.n1.y;
  const Lpx = Math.hypot(dx, dy);

  const L = parseFloat(prompt("Comprimento real (m):", "5"));

  model.elements.push({
    id: Date.now(),
    n1: temp.n1,
    n2,
    length: L,
    loads: [],
    diagrams: { N: [], V: [], M: [] }
  });

  temp = null;
}

/* ==========================
   CARGAS
========================== */
function addPointLoad(e) {
  const el = findClosestElement(e.offsetX, e.offsetY);
  if (!el) return;

  const s = projectOnElement(el, e.offsetX, e.offsetY);
  const value = parseFloat(prompt("Carga (kN):", "10"));
  if (isNaN(value)) return;

  el.loads.push({ type: "point", s, value });
}

/* ==========================
   SOLVER ISOSTÁTICO SIMPLES
========================== */
function solveElement(el) {
  const L = el.length;

  let RA = 0, RB = 0;
  el.loads.forEach(l => {
    RB += l.value * l.s / L;
    RA += l.value;
  });
  RA -= RB;

  const steps = 40;
  el.diagrams.V = [];
  el.diagrams.M = [];

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * L;
    let V = RA;
    let M = RA * s;

    el.loads.forEach(l => {
      if (s >= l.s) {
        V -= l.value;
        M -= l.value * (s - l.s);
      }
    });

    el.diagrams.V.push({ s, value: V });
    el.diagrams.M.push({ s, value: M });
  }
}

/* ==========================
   DESENHO
========================== */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  model.elements.forEach(el => {
    solveElement(el);
    drawElement(el);
    drawDiagrams(el);
  });

  drawTemp();
}

function drawElement(el) {
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(el.n1.x, el.n1.y);
  ctx.lineTo(el.n2.x, el.n2.y);
  ctx.stroke();
}

function drawDiagrams(el) {
  const dx = el.n2.x - el.n1.x;
  const dy = el.n2.y - el.n1.y;
  const Lpx = Math.hypot(dx, dy);

  const tx = dx / Lpx;
  const ty = dy / Lpx;
  const nx = -ty;
  const ny = tx;

  drawDiagram(el.diagrams.V, el, nx, ny, 10);
  drawDiagram(el.diagrams.M, el, nx, ny, 4);
}

function drawDiagram(data, el, nx, ny, scale) {
  ctx.beginPath();

  data.forEach((p, i) => {
    const ratio = p.s / el.length;
    const x = el.n1.x + ratio * (el.n2.x - el.n1.x);
    const y = el.n1.y + ratio * (el.n2.y - el.n1.y);

    const xd = x + p.value * scale * nx;
    const yd = y + p.value * scale * ny;

    if (i === 0) ctx.moveTo(xd, yd);
    else ctx.lineTo(xd, yd);
  });

  ctx.stroke();
}

function drawTemp() {
  if (temp?.type === "element") {
    ctx.beginPath();
    ctx.moveTo(temp.n1.x, temp.n1.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }
}

/* ==========================
   UTIL
========================== */
function createNode(x, y) {
  const node = { id: Date.now() + Math.random(), x, y };
  model.nodes.push(node);
  return node;
}

function findClosestElement(x, y) {
  let best = null;
  let min = 15;

  model.elements.forEach(el => {
    const d = distToSegment(el.n1, el.n2, x, y);
    if (d < min) {
      min = d;
      best = el;
    }
  });

  return best;
}

function projectOnElement(el, x, y) {
  const dx = el.n2.x - el.n1.x;
  const dy = el.n2.y - el.n1.y;
  const Lpx = Math.hypot(dx, dy);

  const t =
    ((x - el.n1.x) * dx + (y - el.n1.y) * dy) / (Lpx * Lpx);

  return Math.max(0, Math.min(1, t)) * el.length;
}

function distToSegment(n1, n2, x, y) {
  const A = x - n1.x;
  const B = y - n1.y;
  const C = n2.x - n1.x;
  const D = n2.y - n1.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = dot / lenSq;

  t = Math.max(0, Math.min(1, t));

  const px = n1.x + t * C;
  const py = n1.y + t * D;

  return Math.hypot(x - px, y - py);
}
