const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const shearCanvas = document.getElementById("shearCanvas");
const shearCtx = shearCanvas.getContext("2d");

const momentCanvas = document.getElementById("momentCanvas");
const momentCtx = momentCanvas.getContext("2d");

const beamLengthInput = document.getElementById("beam-length");

let tool = null;

const model = {
  L: 5,
  beamPx: 700,
  supports: [],
  loads: []
};

/* ===========================
   TOOL SELECTION
=========================== */
document.querySelectorAll("[data-tool]").forEach(btn => {
  btn.onclick = () => tool = btn.dataset.tool;
});

document.getElementById("create-beam").onclick = () => {
  model.L = parseFloat(beamLengthInput.value);
  redraw();
};

document.getElementById("solve").onclick = () => {
  drawShearDiagram();
  drawMomentDiagram();
};

/* ===========================
   MOUSE
=========================== */
canvas.addEventListener("mousedown", e => {
  const x = e.offsetX;

  if (tool?.startsWith("support")) {
    model.supports.push({ x });
  }

  if (tool === "load-point") {
    const q = parseFloat(prompt("Carga (kN):", "10"));
    if (!isNaN(q)) model.loads.push({ x, q });
  }

  redraw();
});

/* ===========================
   DRAWING
=========================== */
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
  model.supports.forEach(s => {
    ctx.fillRect(s.x - 4, y - 20, 8, 40);
  });
}

function drawLoads() {
  const y = canvas.height / 2;
  model.loads.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(l.x, y - 30);
    ctx.lineTo(l.x, y);
    ctx.stroke();
  });
}

/* ===========================
   DIAGRAMAS (PLACEHOLDER VISUAL)
=========================== */
function drawShearDiagram() {
  shearCtx.clearRect(0, 0, shearCanvas.width, shearCanvas.height);
  shearCtx.beginPath();
  shearCtx.moveTo(50, 90);
  shearCtx.lineTo(950, 90);
  shearCtx.stroke();
}

function drawMomentDiagram() {
  momentCtx.clearRect(0, 0, momentCanvas.width, momentCanvas.height);
  momentCtx.beginPath();
  momentCtx.moveTo(50, 120);
  momentCtx.lineTo(500, 40);
  momentCtx.lineTo(950, 120);
  momentCtx.stroke();
}
