/* =====================================================
   ESTADO GLOBAL
===================================================== */
const appState = {
  mode: "parametric", // parametric | draw
  tool: "draw-beam",  // draw-beam | add-support | add-load
  beam: {
    length: null,
    pixelLength: null,
    supports: [],
    loads: []
  },
  drawing: {
    isDrawing: false,
    startX: 0,
    endX: 0
  }
};

/* =====================================================
   ELEMENTOS DOM
===================================================== */
const inputModeSelect = document.getElementById("input-mode");
const geometrySection = document.getElementById("geometry-section");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const scaleDialog = document.getElementById("scale-dialog");
const realLengthInput = document.getElementById("real-length-input");
const canvasHint = document.getElementById("canvas-hint");

const toolDrawBeamBtn = document.getElementById("tool-draw-beam");
const toolAddSupportBtn = document.getElementById("tool-add-support");
const toolAddLoadBtn = document.getElementById("tool-add-load");
const solveBtn = document.getElementById("solve-structure");

/* =====================================================
   INIT
===================================================== */
init();

function init() {
  registerEvents();
  updateUIByMode();
  clearCanvas();
}

/* =====================================================
   EVENTOS
===================================================== */
function registerEvents() {
  inputModeSelect.addEventListener("change", onModeChange);

  toolDrawBeamBtn.addEventListener("click", () => appState.tool = "draw-beam");
  toolAddSupportBtn.addEventListener("click", () => appState.tool = "add-support");
  toolAddLoadBtn.addEventListener("click", () => appState.tool = "add-load");

  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseup", onCanvasMouseUp);

  scaleDialog.addEventListener("close", onScaleDialogClose);
  solveBtn.addEventListener("click", solveStructure);
}

/* =====================================================
   MODO
===================================================== */
function onModeChange(e) {
  appState.mode = e.target.value;
  resetStructure();
  updateUIByMode();
}

function updateUIByMode() {
  geometrySection.style.display =
    appState.mode === "draw" ? "none" : "block";

  canvasHint.style.display =
    appState.mode === "draw" ? "flex" : "none";

  clearCanvas();
}

/* =====================================================
   CANVAS
===================================================== */
function onCanvasMouseDown(e) {
  if (appState.mode !== "draw") return;

  const { x } = getMousePosition(e);

  if (appState.tool === "draw-beam") {
    appState.drawing.isDrawing = true;
    appState.drawing.startX = x;
    appState.drawing.endX = x;
    canvasHint.style.display = "none";
  }

  if (appState.tool === "add-support") {
    tryAddSupport(x);
  }

  if (appState.tool === "add-load") {
    tryAddPointLoad(x);
  }
}

function onCanvasMouseMove(e) {
  if (!appState.drawing.isDrawing) return;
  appState.drawing.endX = getMousePosition(e).x;
  redrawBeamPreview();
}

function onCanvasMouseUp() {
  if (!appState.drawing.isDrawing) return;

  appState.drawing.isDrawing = false;

  const lengthPx = Math.abs(
    appState.drawing.endX - appState.drawing.startX
  );

  if (lengthPx < 30) {
    clearCanvas();
    return;
  }

  appState.beam.pixelLength = lengthPx;
  scaleDialog.showModal();
}

/* =====================================================
   ESCALA
===================================================== */
function onScaleDialogClose() {
  if (scaleDialog.returnValue !== "confirm") {
    resetStructure();
    clearCanvas();
    return;
  }

  const L = parseFloat(realLengthInput.value.replace(",", "."));
  if (isNaN(L) || L <= 0) {
    alert("Comprimento inválido");
    resetStructure();
    clearCanvas();
    return;
  }

  appState.beam.length = L;
  redrawScene();
}

/* =====================================================
   APOIOS
===================================================== */
function tryAddSupport(x) {
  if (!beamExists()) return;

  const { start, end } = beamLimits();
  if (x < start || x > end) return;

  const type = prompt("Tipo de apoio: pinned | roller | fixed", "pinned");
  if (!["pinned", "roller", "fixed"].includes(type)) return;

  const xReal = pixelToReal(x);
  appState.beam.supports.push({ type, xPixel: x, xReal });
  redrawScene();
}

/* =====================================================
   CARGAS PONTUAIS
===================================================== */
function tryAddPointLoad(x) {
  if (!beamExists()) return;

  const { start, end } = beamLimits();
  if (x < start || x > end) return;

  const magnitude = parseFloat(
    prompt("Magnitude da carga (positiva para baixo)", "10")
  );
  if (isNaN(magnitude)) return;

  const xReal = pixelToReal(x);
  appState.beam.loads.push({
    type: "point",
    xPixel: x,
    xReal,
    magnitude
  });

  redrawScene();
}

/* =====================================================
   SOLVER DE VIGA ISOSTÁTICA
===================================================== */
function solveStructure() {
  if (!beamExists()) {
    alert("Desenhe a viga antes de resolver.");
    return;
  }

  if (appState.beam.supports.length === 0) {
    alert("Adicione apoios antes de resolver.");
    return;
  }

  const supports = appState.beam.supports;
  const loads = appState.beam.loads;

  const hasFixed = supports.some(s => s.type === "fixed");

  let reactions = [];

  if (hasFixed) {
    reactions = solveCantilever(supports, loads);
  } else {
    reactions = solveSimplySupported(supports, loads);
  }

  redrawScene();
  drawReactions(reactions);
  console.table(reactions);
}

function solveSimplySupported(supports, loads) {
  if (supports.length !== 2) {
    alert("Viga biapoiada deve ter exatamente 2 apoios.");
    return [];
  }

  const A = supports[0];
  const B = supports[1];

  let sumF = 0;
  let sumMA = 0;

  loads.forEach(l => {
    sumF += l.magnitude;
    sumMA += l.magnitude * (l.xReal - A.xReal);
  });

  const RB = sumMA / (B.xReal - A.xReal);
  const RA = sumF - RB;

  return [
    { support: A, value: RA },
    { support: B, value: RB }
  ];
}

function solveCantilever(supports, loads) {
  const fixed = supports.find(s => s.type === "fixed");

  let V = 0;
  let M = 0;

  loads.forEach(l => {
    V += l.magnitude;
    M += l.magnitude * (l.xReal - fixed.xReal);
  });

  return [{ support: fixed, value: V, moment: M }];
}

/* =====================================================
   DESENHO
===================================================== */
function redrawScene() {
  clearCanvas();
  drawBeam();
  drawSupports();
  drawLoads();
}

function redrawBeamPreview() {
  clearCanvas();
  const y = canvas.height / 2;

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(appState.drawing.startX, y);
  ctx.lineTo(appState.drawing.endX, y);
  ctx.stroke();
}

function drawBeam() {
  const y = canvas.height / 2;
  const { start, end } = beamLimits();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(end, y);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${appState.beam.length} m`, canvas.width / 2, y - 12);
}

function drawSupports() {
  const y = canvas.height / 2;

  appState.beam.supports.forEach(s => {
    ctx.fillStyle = "#1e293b";

    if (s.type === "pinned") {
      ctx.beginPath();
      ctx.moveTo(s.xPixel - 10, y + 20);
      ctx.lineTo(s.xPixel + 10, y + 20);
      ctx.lineTo(s.xPixel, y);
      ctx.closePath();
      ctx.fill();
    }

    if (s.type === "roller") {
      ctx.beginPath();
      ctx.arc(s.xPixel, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (s.type === "fixed") {
      ctx.fillRect(s.xPixel - 4, y - 20, 8, 40);
    }
  });
}

function drawLoads() {
  const y = canvas.height / 2;

  appState.beam.loads.forEach(l => {
    drawPointLoad(l.xPixel, y, l.magnitude);
  });
}

function drawPointLoad(x, y, magnitude) {
  const dir = magnitude >= 0 ? 1 : -1;
  const L = 30;

  ctx.strokeStyle = "#dc2626";
  ctx.fillStyle = "#dc2626";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x, y - dir * L);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 5, y - dir * (L - 5));
  ctx.lineTo(x + 5, y - dir * (L - 5));
  ctx.lineTo(x, y - dir * L);
  ctx.closePath();
  ctx.fill();

  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${magnitude}`, x, y - dir * (L + 8));
}

function drawReactions(reactions) {
  const y = canvas.height / 2;

  reactions.forEach(r => {
    const x = r.support.xPixel;

    ctx.strokeStyle = "#16a34a";
    ctx.fillStyle = "#16a34a";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 5, y + 5);
    ctx.lineTo(x + 5, y + 5);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${r.value.toFixed(2)}`, x, y + 45);

    if (r.moment !== undefined) {
      ctx.fillText(`M = ${r.moment.toFixed(2)}`, x, y - 30);
    }
  });
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function beamExists() {
  return appState.beam.length && appState.beam.pixelLength;
}

function beamLimits() {
  const start = (canvas.width - appState.beam.pixelLength) / 2;
  return { start, end: start + appState.beam.pixelLength };
}

function pixelToReal(xPixel) {
  const { start } = beamLimits();
  return ((xPixel - start) / appState.beam.pixelLength) * appState.beam.length;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetStructure() {
  appState.beam = {
    length: null,
    pixelLength: null,
    supports: [],
    loads: []
  };
  realLengthInput.value = "";
}

function getMousePosition(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left };
}
