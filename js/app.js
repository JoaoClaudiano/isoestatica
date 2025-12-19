/* =====================================================
   ESTADO GLOBAL
===================================================== */
const appState = {
  mode: "draw",
  tool: "draw-beam",
  zoom: 1,
  panX: 0,
  beam: {
    length: null,
    pixelLength: null,
    supports: [],
    loads: [] // point | distributed
  },
  drawing: {
    isDrawing: false,
    startX: 0,
    endX: 0
  }
};

/* =====================================================
   CANVAS
===================================================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* =====================================================
   TOOLS
===================================================== */
document.getElementById("tool-draw-beam").onclick = () => appState.tool = "draw-beam";
document.getElementById("tool-add-support").onclick = () => appState.tool = "add-support";
document.getElementById("tool-add-load").onclick = () => appState.tool = "add-load";
document.getElementById("tool-add-dist-load").onclick = () => appState.tool = "add-dist-load";
document.getElementById("solve-structure").onclick = solveStructure;
document.getElementById("draw-diagrams").onclick = drawDiagrams;

/* =====================================================
   ZOOM (SCROLL)
===================================================== */
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  appState.zoom += e.deltaY * -0.001;
  appState.zoom = Math.min(Math.max(0.5, appState.zoom), 2.5);
  redrawScene();
});

/* =====================================================
   MOUSE EVENTS
===================================================== */
canvas.addEventListener("mousedown", e => {
  const x = getMouseX(e);

  if (appState.tool === "draw-beam") {
    appState.drawing.isDrawing = true;
    appState.drawing.startX = x;
    appState.drawing.endX = x;
  }

  if (appState.tool === "add-support") addSupport(x);
  if (appState.tool === "add-load") addPointLoad(x);
  if (appState.tool === "add-dist-load") startDistributedLoad(x);
});

canvas.addEventListener("mousemove", e => {
  if (!appState.drawing.isDrawing) return;
  appState.drawing.endX = getMouseX(e);
  redrawPreview();
});

canvas.addEventListener("mouseup", () => {
  if (!appState.drawing.isDrawing) return;
  appState.drawing.isDrawing = false;

  const px = Math.abs(appState.drawing.endX - appState.drawing.startX);
  if (px < 30) return;

  appState.beam.pixelLength = px;
  const L = parseFloat(prompt("Comprimento real da viga (m):", "5"));
  if (!L || L <= 0) return;

  appState.beam.length = L;
  redrawScene();
});

/* =====================================================
   APOIOS
===================================================== */
function addSupport(x) {
  if (!beamReady()) return;
  const type = prompt("Apoio: pinned | roller | fixed", "pinned");
  if (!["pinned", "roller", "fixed"].includes(type)) return;
  appState.beam.supports.push({ type, xPixel: x, xReal: pixelToReal(x) });
  redrawScene();
}

/* =====================================================
   CARGAS
===================================================== */
function addPointLoad(x) {
  if (!beamReady()) return;
  const q = parseFloat(prompt("Carga concentrada (kN):", "10"));
  if (isNaN(q)) return;
  appState.beam.loads.push({ type: "point", xPixel: x, xReal: pixelToReal(x), magnitude: q });
  redrawScene();
}

let distStart = null;
function startDistributedLoad(x) {
  if (!beamReady()) return;
  if (!distStart) {
    distStart = x;
  } else {
    const q = parseFloat(prompt("Carga distribuída (kN/m):", "5"));
    if (isNaN(q)) return;
    appState.beam.loads.push({
      type: "distributed",
      xStart: distStart,
      xEnd: x,
      q,
      xRealStart: pixelToReal(distStart),
      xRealEnd: pixelToReal(x)
    });
    distStart = null;
    redrawScene();
  }
}

/* =====================================================
   SOLVER
===================================================== */
function solveStructure() {
  redrawScene();
  drawReactions(computeReactions());
}

function computeReactions() {
  const supports = appState.beam.supports;
  const loads = expandLoads();
  if (supports.some(s => s.type === "fixed")) return solveCantilever(supports, loads);
  return solveSimplySupported(supports, loads);
}

function expandLoads() {
  const expanded = [];
  appState.beam.loads.forEach(l => {
    if (l.type === "point") expanded.push(l);
    if (l.type === "distributed") {
      const L = l.xRealEnd - l.xRealStart;
      expanded.push({
        type: "point",
        xReal: l.xRealStart + L / 2,
        magnitude: l.q * L
      });
    }
  });
  return expanded;
}

function solveSimplySupported(s, loads) {
  const A = s[0], B = s[1];
  let F = 0, M = 0;
  loads.forEach(l => {
    F += l.magnitude;
    M += l.magnitude * (l.xReal - A.xReal);
  });
  const RB = M / (B.xReal - A.xReal);
  return [
    { support: A, value: F - RB },
    { support: B, value: RB }
  ];
}

function solveCantilever(s, loads) {
  const f = s.find(x => x.type === "fixed");
  let V = 0, M = 0;
  loads.forEach(l => {
    V += l.magnitude;
    M += l.magnitude * (l.xReal - f.xReal);
  });
  return [{ support: f, value: V, moment: M }];
}

/* =====================================================
   DIAGRAMAS
===================================================== */
function drawDiagrams() {
  redrawScene();
  const loads = expandLoads();
  const reactions = computeReactions();

  const events = [];
  reactions.forEach(r => events.push({ x: r.support.xReal, v: -r.value }));
  loads.forEach(l => events.push({ x: l.xReal, v: l.magnitude }));
  events.sort((a, b) => a.x - b.x);

  let shear = 0;
  let moment = 0;
  let prevX = 0;
  const V = [], M = [];

  events.forEach(e => {
    shear += e.v;
    moment += shear * (e.x - prevX);
    V.push({ x: e.x, v: shear });
    M.push({ x: e.x, m: moment });
    prevX = e.x;
  });

  autoScaleDiagram(V, "shear");
  autoScaleDiagram(M, "moment");
}

function autoScaleDiagram(data, type) {
  const max = Math.max(...data.map(d => Math.abs(type === "shear" ? d.v : d.m)));
  const scale = 60 / max;
  const baseY = type === "shear" ? 350 : 450;

  ctx.beginPath();
  ctx.strokeStyle = type === "shear" ? "#2563eb" : "#9333ea";
  ctx.moveTo(realToPixel(0), baseY);

  data.forEach(d => {
    const y = baseY - (type === "shear" ? d.v : d.m) * scale;
    ctx.lineTo(realToPixel(d.x), y);
  });
  ctx.stroke();
}

/* =====================================================
   DESENHO
===================================================== */
function redrawScene() {
  ctx.setTransform(appState.zoom, 0, 0, appState.zoom, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBeam();
  drawSupports();
  drawLoads();
}

function redrawPreview() {
  redrawScene();
  ctx.beginPath();
  ctx.moveTo(appState.drawing.startX, canvas.height / 2);
  ctx.lineTo(appState.drawing.endX, canvas.height / 2);
  ctx.stroke();
}

function drawBeam() {
  if (!beamReady()) return;
  const y = canvas.height / 2;
  const { start, end } = beamLimits();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(end, y);
  ctx.stroke();
}

function drawSupports() {
  const y = canvas.height / 2;
  appState.beam.supports.forEach(s => ctx.fillRect(s.xPixel - 4, y - 20, 8, 40));
}

function drawLoads() {
  const y = canvas.height / 2;
  appState.beam.loads.forEach(l => {
    if (l.type === "point") drawArrow(l.xPixel, y);
    if (l.type === "distributed") drawDist(l);
  });
}

function drawArrow(x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function drawDist(l) {
  for (let x = l.xStart; x <= l.xEnd; x += 20) drawArrow(x, canvas.height / 2);
}

function drawReactions(r) {
  r.forEach(rx => drawArrow(rx.support.xPixel, canvas.height / 2 + 30));
}

/* =====================================================
   UTIL
===================================================== */
function beamReady() {
  return appState.beam.length && appState.beam.pixelLength;
}
function beamLimits() {
  const s = (canvas.width - appState.beam.pixelLength) / 2;
  return { start: s, end: s + appState.beam.pixelLength };
}
function pixelToReal(x) {
  const { start } = beamLimits();
  return ((x - start) / appState.beam.pixelLength) * appState.beam.length;
}
function realToPixel(x) {
  const { start } = beamLimits();
  return start + (x / appState.beam.length) * appState.beam.pixelLength;
}
function getMouseX(e) {
  return (e.offsetX) / appState.zoom;
}
