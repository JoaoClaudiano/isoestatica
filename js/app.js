const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = "draw";
let mouse = { x: 0, y: 0 };
let temp = null;

/* ==========================
   MODELO GLOBAL
========================== */
const model = {
  nodes: [],
  elements: []
};

/* ==========================
   EVENTOS DE MOUSE
========================== */
canvas.addEventListener("mousemove", e => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
  redraw();
});

canvas.addEventListener("mousedown", e => {
  if (tool === "draw") startElement(e);
  if (tool === "load-point") placePointLoad(e);
  if (tool === "load-dist") startDistLoad(e);
  if (tool === "moment") placeMoment(e);
});

canvas.addEventListener("mouseup", e => {
  if (temp?.type === "element") finishElement(e);
  if (temp?.type === "distLoad") finishDistLoad(e);
});

/* ==========================
   ELEMENTOS
========================== */
function startElement(e) {
  const n1 = createNode(e.offsetX, e.offsetY);
  temp = { type: "element", n1 };
}

function finishElement(e) {
  const n2 = createNode(e.offsetX, e.offsetY);
  const L = parseFloat(prompt("Comprimento real do elemento (m):", "5"));
  if (isNaN(L)) return;

  model.elements.push({
    id: Date.now(),
    n1,
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
function placePointLoad(e) {
  const el = findClosestElement(e.offsetX, e.offsetY);
  if (!el) return;

  const s = project(el, e.offsetX, e.offsetY);
  const q = parseFloat(prompt("Carga pontual (kN):", "10"));
  if (isNaN(q)) return;

  el.loads.push({ type: "point", s, value: q });
}

function startDistLoad(e) {
  const el = findClosestElement(e.offsetX, e.offsetY);
  if (!el) return;

  const s0 = project(el, e.offsetX, e.offsetY);
  temp = { type: "distLoad", el, s0 };
}

function finishDistLoad(e) {
  const s1 = project(temp.el, e.offsetX, e.offsetY);
  const q = parseFloat(prompt("Carga distribuída (kN/m):", "5"));
  if (isNaN(q)) return;

  temp.el.loads.push({
    type: "distributed",
    s0: Math.min(temp.s0, s1),
    s1: Math.max(temp.s0, s1),
    value: q
  });

  temp = null;
}

function placeMoment(e) {
  const el = findClosestElement(e.offsetX, e.offsetY);
  if (!el) return;

  const s = project(el, e.offsetX, e.offsetY);
  const m = parseFloat(prompt("Momento concentrado (kN·m):", "10"));
  if (isNaN(m)) return;

  el.loads.push({ type: "moment", s, value: m });
}

/* ==========================
   SOLVER POR ELEMENTO
========================== */
function solveElement(el) {
  const L = el.length;
  const steps = 40;

  el.diagrams = { N: [], V: [], M: [] };

  let RA = 0;
  let RB = 0;

  el.loads.forEach(l => {
    if (l.type === "point") {
      RB += l.value * l.s / L;
      RA += l.value;
    }
    if (l.type === "distributed") {
      const w = l.value * (l.s1 - l.s0);
      const xc = (l.s0 + l.s1) / 2;
      RB += w * xc / L;
      RA += w;
    }
  });

  RA -= RB;

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * L;
    let V = RA;
    let M = RA * s;
    let N = 0;

    el.loads.forEach(l => {
      if (l.type === "point" && s >= l.s) {
        V -= l.value;
        M -= l.value * (s - l.s);
      }
      if (l.type === "distributed" && s >= l.s0) {
        const dx = Math.min(s, l.s1) - l.s0;
        if (dx > 0) {
          V -= l.value * dx;
          M -= l.value * dx * (s - (l.s0 + dx / 2));
        }
      }
      if (l.type === "moment" && s >= l.s) {
        M -= l.value;
      }
    });

    el.diagrams.N.push({ s, value: N });
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
    drawLoads(el);
    drawDiagrams(el);
  });

  drawTemp();
  drawCrosshair();
}

function drawElement(el) {
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(el.n1.x, el.n1.y);
  ctx.lineTo(el.n2.x, el.n2.y);
  ctx.stroke();
}

function drawLoads(el) {
  el.loads.forEach(l => {
    const p = pointOn(el, l.s);
    if (l.type === "point") {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 20);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    if (l.type === "moment") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 1.5);
      ctx.stroke();
    }
  });
}

function drawDiagrams(el) {
  const dx = el.n2.x - el.n1.x;
  const dy = el.n2.y - el.n1.y;
  const Lpx = Math.hypot(dx, dy);

  const tx = dx / Lpx;
  const ty = dy / Lpx;
  const nx = -ty;
  const ny = tx;

  plotDiagram(el.diagrams.N, el, nx, ny, -6);
  plotDiagram(el.diagrams.V, el, nx, ny, 6);
  plotDiagram(el.diagrams.M, el, nx, ny, 2);
}

function plotDiagram(data, el, nx, ny, scale) {
  ctx.beginPath();
  data.forEach((p, i) => {
    const base = pointOn(el, p.s);
    const x = base.x + p.value * scale * nx;
    const y = base.y + p.value * scale * ny;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
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

  if (temp?.type === "distLoad") {
    const p0 = pointOn(temp.el, temp.s0);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }
}

function drawCrosshair() {
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(mouse.x, 0);
  ctx.lineTo(mouse.x, canvas.height);
  ctx.moveTo(0, mouse.y);
  ctx.lineTo(canvas.width, mouse.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ==========================
   UTIL
========================== */
function createNode(x, y) {
  const n = { id: Date.now() + Math.random(), x, y };
  model.nodes.push(n);
  return n;
}

function pointOn(el, s) {
  const r = s / el.length;
  return {
    x: el.n1.x + r * (el.n2.x - el.n1.x),
    y: el.n1.y + r * (el.n2.y - el.n1.y)
  };
}

function project(el, x, y) {
  const dx = el.n2.x - el.n1.x;
  const dy = el.n2.y - el.n1.y;
  const L2 = dx * dx + dy * dy;

  const t =
    ((x - el.n1.x) * dx + (y - el.n1.y) * dy) / L2;

  return Math.max(0, Math.min(1, t)) * el.length;
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
