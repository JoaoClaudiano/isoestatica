/* ===============================
   ELEMENTOS
=============================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const shearCanvas = document.getElementById("shearCanvas");
const shearCtx = shearCanvas.getContext("2d");

const momentCanvas = document.getElementById("momentCanvas");
const momentCtx = momentCanvas.getContext("2d");

const beamLengthInput = document.getElementById("beam-length");

/* ===============================
   ESTADO
=============================== */
let tool = null;

const model = {
  L: 5,
  beamPx: 700,
  supports: {
    left: true,
    right: true
  },
  loads: [] // { x (m), q (kN) }
};

/* ===============================
   TOOL SELECTION
=============================== */
document.querySelectorAll("[data-tool]").forEach(btn => {
  btn.onclick = () => tool = btn.dataset.tool;
});

document.getElementById("create-beam").onclick = () => {
  model.L = parseFloat(beamLengthInput.value);
  redraw();
};

document.getElementById("solve").onclick = () => {
  solveAndDrawDiagrams();
};

/* ===============================
   MOUSE
=============================== */
canvas.addEventListener("mousedown", e => {
  const xPx = e.offsetX;
  const xReal = pixelToReal(xPx);

  if (tool === "load-point") {
    const q = parseFloat(prompt("Carga pontual (kN):", "10"));
    if (!isNaN(q)) {
      model.loads.push({ x: xReal, q });
    }
  }

  redraw();
});

/* ===============================
   DESENHO DA ESTRUTURA
=============================== */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBeam();
  drawSupports();
  drawLoads();
}

function drawBeam() {
  const y = canvas.height / 2;
  const start = (canvas.width - model.beamPx) / 2;

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(start + model.beamPx, y);
  ctx.stroke();
}

function drawSupports() {
  const y = canvas.height / 2;
  const start = (canvas.width - model.beamPx) / 2;
  const end = start + model.beamPx;

  ctx.fillRect(start - 4, y - 20, 8, 40);
  ctx.fillRect(end - 4, y - 20, 8, 40);
}

function drawLoads() {
  const y = canvas.height / 2;
  model.loads.forEach(l => {
    const xPx = realToPixel(l.x);
    ctx.beginPath();
    ctx.moveTo(xPx, y - 30);
    ctx.lineTo(xPx, y);
    ctx.stroke();
  });
}

/* ===============================
   SOLVER ISOSTÁTICO
=============================== */
function solveAndDrawDiagrams() {
  const L = model.L;

  // Reações
  let RB = 0;
  model.loads.forEach(l => RB += l.q * l.x / L);
  const RA = model.loads.reduce((s, l) => s + l.q, 0) - RB;

  drawShearDiagram(RA, RB);
  drawMomentDiagram(RA);
}

/* ===============================
   DIAGRAMAS
=============================== */
function drawShearDiagram(RA, RB) {
  shearCtx.clearRect(0, 0, shearCanvas.width, shearCanvas.height);

  const y0 = shearCanvas.height / 2;
  const scale = 10;

  let V = RA;
  let xPrev = 0;

  shearCtx.beginPath();
  shearCtx.moveTo(50, y0 - V * scale);

  model.loads
    .sort((a, b) => a.x - b.x)
    .forEach(l => {
      const x = mapX(l.x);
      shearCtx.lineTo(x, y0 - V * scale);
      V -= l.q;
      shearCtx.lineTo(x, y0 - V * scale);
    });

  shearCtx.lineTo(950, y0 - V * scale);
  shearCtx.stroke();
}

function drawMomentDiagram(RA) {
  momentCtx.clearRect(0, 0, momentCanvas.width, momentCanvas.height);

  const scale = 8;
  const yBase = momentCanvas.height - 20;

  momentCtx.beginPath();
  momentCtx.moveTo(50, yBase);

  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * model.L;
    let M = RA * x;

    model.loads.forEach(l => {
      if (x >= l.x) M -= l.q * (x - l.x);
    });

    momentCtx.lineTo(mapX(x), yBase - M * scale);
  }

  momentCtx.stroke();
}

/* ===============================
   UTILITÁRIOS
=============================== */
function pixelToReal(px) {
  const start = (canvas.width - model.beamPx) / 2;
  return ((px - start) / model.beamPx) * model.L;
}

function realToPixel(x) {
  const start = (canvas.width - model.beamPx) / 2;
  return start + (x / model.L) * model.beamPx;
}

function mapX(x) {
  return 50 + (x / model.L) * 900;
}
