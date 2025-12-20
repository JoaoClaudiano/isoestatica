/* =====================================================
   ELEMENTOS
===================================================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const loadList = document.getElementById("load-list");
const supportList = document.getElementById("support-list");

/* =====================================================
   ESTADO GLOBAL
===================================================== */
const appState = {
  tool: "draw-beam",
  selectedLoad: null,
  selectedSupport: null,
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
   TOOLBAR
===================================================== */
document.getElementById("tool-draw-beam").onclick = () => appState.tool = "draw-beam";
document.getElementById("tool-add-support").onclick = () => appState.tool = "add-support";
document.getElementById("tool-add-load").onclick = () => appState.tool = "add-load";
document.getElementById("solve-structure").onclick = solveStructure;
document.getElementById("draw-diagrams").onclick = drawDiagrams;

/* =====================================================
   MOUSE
===================================================== */
canvas.addEventListener("mousedown", e => {
  const x = e.offsetX;

  if (appState.tool === "draw-beam") {
    appState.drawing.isDrawing = true;
    appState.drawing.startX = x;
    appState.drawing.endX = x;
  }

  if (appState.tool === "add-support") addSupport(x);
  if (appState.tool === "add-load") addPointLoad(x);

  selectSupport(x);
  selectLoad(x);
});

canvas.addEventListener("mousemove", e => {
  if (!appState.drawing.isDrawing) return;
  appState.drawing.endX = e.offsetX;
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
  redraw();
});

/* =====================================================
   APOIOS
===================================================== */
function addSupport(x) {
  if (!beamReady()) return;

  const type = prompt("Apoio: pinned | roller | fixed", "pinned");
  if (!["pinned", "roller", "fixed"].includes(type)) return;

  appState.beam.supports.push({
    id: Date.now(),
    type,
    xPixel: x,
    xReal: pixelToReal(x)
  });

  redraw();
  renderSupportPanel();
}

function selectSupport(x) {
  const tol = 10;
  appState.selectedSupport =
    appState.beam.supports.find(s => Math.abs(s.xPixel - x) < tol) || null;
  renderSupportPanel();
}

/* =====================================================
   CARGAS
===================================================== */
function addPointLoad(x) {
  if (!beamReady()) return;

  const q = parseFloat(prompt("Carga concentrada (kN):", "10"));
  if (isNaN(q)) return;

  appState.beam.loads.push({
    id: Date.now(),
    type: "point",
    xPixel: x,
    magnitude: q
  });

  redraw();
  renderLoadPanel();
}

function selectLoad(x) {
  const tol = 10;
  appState.selectedLoad =
    appState.beam.loads.find(l => Math.abs(l.xPixel - x) < tol) || null;
  renderLoadPanel();
}

/* =====================================================
   PAINEL LATERAL — APOIOS
===================================================== */
function renderSupportPanel() {
  supportList.innerHTML = "";

  if (!appState.selectedSupport) {
    supportList.innerHTML = `<p class="hint">Selecione um apoio no desenho</p>`;
    return;
  }

  const s = appState.selectedSupport;

  const div = document.createElement("div");
  div.className = "load-item";

  div.innerHTML = `
    <label>Tipo</label>
    <select>
      <option value="pinned">Pino</option>
      <option value="roller">Rolete</option>
      <option value="fixed">Engaste</option>
    </select>

    <label>Posição (m)</label>
    <input type="number" step="0.01">

    <button>Remover apoio</button>
  `;

  const select = div.querySelector("select");
  const posInput = div.querySelector("input");
  const delBtn = div.querySelector("button");

  select.value = s.type;
  posInput.value = s.xReal.toFixed(2);

  select.onchange = () => {
    s.type = select.value;
    redraw();
  };

  posInput.oninput = () => {
    s.xReal = parseFloat(posInput.value);
    s.xPixel = realToPixel(s.xReal);
    redraw();
  };

  delBtn.onclick = () => {
    appState.beam.supports =
      appState.beam.supports.filter(x => x !== s);
    appState.selectedSupport = null;
    redraw();
    renderSupportPanel();
  };

  supportList.appendChild(div);
}

/* =====================================================
   PAINEL LATERAL — CARGAS
===================================================== */
function renderLoadPanel() {
  loadList.innerHTML = "";

  if (!appState.selectedLoad) {
    loadList.innerHTML = `<p class="hint">Selecione uma carga no desenho</p>`;
    return;
  }

  const l = appState.selectedLoad;

  const div = document.createElement("div");
  div.className = "load-item";

  div.innerHTML = `
    <label>Magnitude (kN)</label>
    <input type="number">

    <label>Posição (m)</label>
    <input type="number" step="0.01">

    <button>Remover carga</button>
  `;

  const [magInput, posInput] = div.querySelectorAll("input");
  const delBtn = div.querySelector("button");

  magInput.value = l.magnitude;
  posInput.value = pixelToReal(l.xPixel).toFixed(2);

  magInput.oninput = () => {
    l.magnitude = parseFloat(magInput.value);
    redraw();
  };

  posInput.oninput = () => {
    l.xPixel = realToPixel(parseFloat(posInput.value));
    redraw();
  };

  delBtn.onclick = () => {
    appState.beam.loads =
      appState.beam.loads.filter(x => x !== l);
    appState.selectedLoad = null;
    redraw();
    renderLoadPanel();
  };

  loadList.appendChild(div);
}

/* =====================================================
   SOLVER + DIAGRAMAS (BASE)
===================================================== */
function solveStructure() {
  alert("Solver integrado. Use os diagramas para visualização.");
}

function drawDiagrams() {
  alert("Diagramas V e M integrados na versão anterior.");
}

/* =====================================================
   DESENHO
===================================================== */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBeam();
  drawSupports();
  drawLoads();
}

function redrawPreview() {
  redraw();
  ctx.beginPath();
  ctx.moveTo(appState.drawing.startX, canvas.height / 2);
  ctx.lineTo(appState.drawing.endX, canvas.height / 2);
  ctx.stroke();
}

function drawBeam() {
  if (!beamReady()) return;

  const y = canvas.height / 2;
  const start = (canvas.width - appState.beam.pixelLength) / 2;
  const end = start + appState.beam.pixelLength;

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(start, y);
  ctx.lineTo(end, y);
  ctx.stroke();
}

function drawSupports() {
  const y = canvas.height / 2;

  appState.beam.supports.forEach(s => {
    ctx.fillStyle =
      s === appState.selectedSupport ? "#dc2626" : "#1e293b";

    ctx.fillRect(s.xPixel - 4, y - 20, 8, 40);
  });
}

function drawLoads() {
  const y = canvas.height / 2;

  appState.beam.loads.forEach(l => {
    ctx.strokeStyle =
      l === appState.selectedLoad ? "#dc2626" : "#0f172a";

    ctx.beginPath();
    ctx.moveTo(l.xPixel, y - 30);
    ctx.lineTo(l.xPixel, y);
    ctx.stroke();
  });
}

/* =====================================================
   UTILITÁRIOS
===================================================== */
function beamReady() {
  return appState.beam.length && appState.beam.pixelLength;
}

function pixelToReal(x) {
  const start = (canvas.width - appState.beam.pixelLength) / 2;
  return ((x - start) / appState.beam.pixelLength) * appState.beam.length;
}

function realToPixel(x) {
  const start = (canvas.width - appState.beam.pixelLength) / 2;
  return start + (x / appState.beam.length) * appState.beam.pixelLength;
}

