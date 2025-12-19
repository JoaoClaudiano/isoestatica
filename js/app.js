/* =====================================================
   ESTADO GLOBAL DA APLICAÇÃO
===================================================== */
const appState = {
  mode: "parametric", // parametric | draw
  beam: {
    length: null,     // comprimento real (m)
    pixelLength: null // comprimento em pixels
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
   REGISTRO DE EVENTOS
===================================================== */
function registerEvents() {
  inputModeSelect.addEventListener("change", onModeChange);

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
   CANVAS – DESENHO DA VIGA
===================================================== */
function onCanvasMouseDown(e) {
  if (appState.mode !== "draw") return;

  const { x } = getMousePosition(e);

  appState.drawing.isDrawing = true;
  appState.drawing.startX = x;
  appState.drawing.endX = x;

  canvasHint.style.display = "none";
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

  if (lengthPx < 20) {
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
   FUNÇÕES DE DESENHO
===================================================== */
function redrawBeamPreview() {
  clearCanvas();

  const y = canvas.height / 2;
  const x1 = appState.drawing.startX;
  const x2 = appState.drawing.endX;

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function drawFinalBeam() {
  clearCanvas();

  const y = canvas.height / 2;
  const center = canvas.width / 2;
  const halfLength = appState.beam.pixelLength / 2;

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.moveTo(center - halfLength, y);
  ctx.lineTo(center + halfLength, y);
  ctx.stroke();

  drawBeamLabel(center, y);
}

function drawBeamLabel(x, y) {
  ctx.fillStyle = "#0f172a";
  ctx.font = "13px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    `${appState.beam.length} m`,
    x,
    y - 12
  );
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function resetDrawing() {
  appState.drawing.isDrawing = false;
  appState.beam.pixelLength = null;
  appState.beam.length = null;
  realLengthInput.value = "";
}

function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}
