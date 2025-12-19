/* =====================================================
   ESTADO GLOBAL
===================================================== */
const appState = {
  mode: "parametric", // parametric | draw
  tool: "draw-beam",  // draw-beam | add-support
  beam: {
    length: null,
    pixelLength: null,
    supports: []
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

const toolAddSupportBtn = document.getElementById("tool-add-support");
const toolDrawBeamBtn = document.getElementById("tool-draw-beam");

/* =====================================================
   INICIALIZAÇÃO
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

  toolAddSupportBtn.addEventListener("click", () => {
    appState.tool = "add-support";
  });

  toolDrawBeamBtn.addEventListener("click", () => {
    appState.tool = "draw-beam";
  });

  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseup", onCanvasMouseUp);

  scaleDialog.addEventListener("close", onScaleDialogClose);
}

/* =====================================================
   CONTROLE DE MODO
===================================================== */
function onModeChange(e) {
  appState.mode = e.target.value;
  resetDrawing();
  updateUIByMode();
}

function updateUIByMode() {
  if (appState.mode === "draw") {
    geometrySection.style.display = "none";
    canvasHint.style.display = "flex";
  } else {
    geometrySection.style.display = "block";
    canvasHint.style.display = "none";
  }

  clearCanvas();
}

/* =====================================================
   CANVAS – EVENTOS
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
}

function onCanvasMouseMove(e) {
  if (!appState.drawing.isDrawing) return;

  const { x } = getMousePosition(e);
  appState.drawing.endX = x;

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
   DIALOG – ESCALA
===================================================== */
function onScaleDialogClose() {
  if (scaleDialog.returnValue !== "confirm") {
    resetDrawing();
    clearCanvas();
    return;
  }

  const value = parseFloat(
    realLengthInput.value.replace(",", ".")
  );

  if (isNaN(value) || value <= 0) {
    alert("Comprimento inválido.");
    resetDrawing();
    clearCanvas();
    return;
  }

  appState.beam.length = value;
  drawFinalBeam();
}

/* =====================================================
   APOIOS
===================================================== */
function tryAddSupport(xClick) {
  if (!appState.beam.pixelLength) return;

  const beamY = canvas.height / 2;
  const beamStart = (canvas.width - appState.beam.pixelLength) / 2;
  const beamEnd = beamStart + appState.beam.pixelLength;

  if (xClick < beamStart || xClick > beamEnd) return;

  const type = prompt(
    "Tipo de apoio: pinned | roller | fixed",
    "pinned"
  );

  if (!["pinned", "roller", "fixed"].includes(type)) return;

  const xReal =
    ((xClick - beamStart) / appState.beam.pixelLength) *
    appState.beam.length;

  appState.beam.supports.push({
    type,
    xPixel: xClick,
    xReal
  });

  redrawScene();
}

/* =====================================================
   DESENHO
===================================================== */
function redrawScene() {
  clearCanvas();
  drawFinalBeam();
  drawSupports();
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

function drawFinalBeam() {
  const y = canvas.height / 2;
  const center = canvas.width / 2;
  const half = appState.beam.pixelLength / 2;

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(center - half, y);
  ctx.lineTo(center + half, y);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${appState.beam.length} m`, center, y - 12);
}

function drawSupports() {
  const y = canvas.height / 2;

  appState.beam.supports.forEach(support => {
    ctx.fillStyle = "#1e293b";

    if (support.type === "pinned") {
      ctx.beginPath();
      ctx.moveTo(support.xPixel - 10, y + 20);
      ctx.lineTo(support.xPixel + 10, y + 20);
      ctx.lineTo(support.xPixel, y);
      ctx.closePath();
      ctx.fill();
    }

    if (support.type === "roller") {
      ctx.beginPath();
      ctx.arc(support.xPixel, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (support.type === "fixed") {
      ctx.fillRect(support.xPixel - 4, y - 20, 8, 40);
    }
  });
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetDrawing() {
  appState.beam = {
    length: null,
    pixelLength: null,
    supports: []
  };
  realLengthInput.value = "";
}

function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
