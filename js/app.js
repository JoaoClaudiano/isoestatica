const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = null;
let tempAction = null;

const model = {
  mode: "parametric",
  nodes: [],
  elements: [],
  supports: [],
  loads: []
};

/* =========================
   TOOL SELECTION
========================= */
document.querySelectorAll("[data-tool]").forEach(btn => {
  btn.onclick = () => tool = btn.dataset.tool;
});

document.getElementById("mode-parametric").onclick = () => {
  model.mode = "parametric";
};

document.getElementById("mode-free").onclick = () => {
  model.mode = "free";
};

/* =========================
   MOUSE + CROSSHAIR
========================= */
let mouse = { x: 0, y: 0 };

canvas.addEventListener("mousemove", e => {
  mouse.x = e.offsetX;
  mouse.y = e.offsetY;
  redraw();
});

canvas.addEventListener("mousedown", e => {
  if (tool === "draw-element") startElement(e);
  if (tool === "support") placeSupport(e);
  if (tool === "load-point") placePointLoad(e);
  if (tool === "load-dist") startDistributedLoad(e);
  if (tool === "moment") placeMoment(e);
});

canvas.addEventListener("mouseup", e => {
  if (tempAction?.type === "element") finishElement(e);
  if (tempAction?.type === "distLoad") finishDistributedLoad(e);
});

/* =========================
   ELEMENT DRAWING
========================= */
function startElement(e) {
  const n = createNode(e.offsetX, e.offsetY);
  tempAction = { type: "element", startNode: n };
}

function finishElement(e) {
  const n2 = createNode(e.offsetX, e.offsetY);
  model.elements.push({
    id: Date.now(),
    n1: tempAction.startNode.id,
    n2: n2.id
  });

  const L = parseFloat(prompt("Comprimento real (m):", "5"));
  model.elements.at(-1).length = L;

  tempAction = null;
}

/* =========================
   LOADS
========================= */
function placePointLoad(e) {
  const value = parseFloat(prompt("Carga (kN):", "10"));
  if (isNaN(value)) return;

  model.loads.push({
    type: "point",
    x: e.offsetX,
    y: e.offsetY,
    value
  });
}

function startDistributedLoad(e) {
  tempAction = {
    type: "distLoad",
    x1: e.offsetX,
    y: e.offsetY
  };
}

function finishDistributedLoad(e) {
  const value = parseFloat(prompt("Carga distribuída (kN/m):", "5"));
  if (isNaN(value)) return;

  model.loads.push({
    type: "distributed",
    x1: tempAction.x1,
    x2: e.offsetX,
    y: e.offsetY,
    value
  });

  tempAction = null;
}

function placeMoment(e) {
  const value = parseFloat(prompt("Momento (kN.m):", "10"));
  if (isNaN(value)) return;

  model.loads.push({
    type: "moment",
    x: e.offsetX,
    y: e.offsetY,
    value
  });
}

/* =========================
   SUPPORTS
========================= */
function placeSupport(e) {
  model.supports.push({
    x: e.offsetX,
    y: e.offsetY,
    type: "pinned"
  });
}

/* =========================
   DRAWING
========================= */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawElements();
  drawSupports();
  drawLoads();
  drawCrosshair();
  drawTempAction();
}

function drawElements() {
  ctx.lineWidth = 3;
  model.elements.forEach(el => {
    const n1 = model.nodes.find(n => n.id === el.n1);
    const n2 = model.nodes.find(n => n.id === el.n2);
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.stroke();
  });
}

function drawSupports() {
  model.supports.forEach(s => {
    ctx.fillRect(s.x - 4, s.y - 20, 8, 40);
  });
}

function drawLoads() {
  model.loads.forEach(l => {
    if (l.type === "point") {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 30);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
    }

    if (l.type === "distributed") {
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y);
      ctx.lineTo(l.x2, l.y);
      ctx.stroke();
    }

    if (l.type === "moment") {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 15, 0, Math.PI * 1.5);
      ctx.stroke();
    }
  });
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

function drawTempAction() {
  if (!tempAction) return;

  if (tempAction.type === "element") {
    const n = model.nodes.find(n => n.id === tempAction.startNode.id);
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
  }

  if (tempAction.type === "distLoad") {
    ctx.beginPath();
    ctx.moveTo(tempAction.x1, tempAction.y);
    ctx.lineTo(mouse.x, tempAction.y);
    ctx.stroke();
  }
}

/* =========================
   UTIL
========================= */
function createNode(x, y) {
  const node = { id: Date.now() + Math.random(), x, y };
  model.nodes.push(node);
  return node;
}
