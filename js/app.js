/* =====================================================
   UTILIDADES MATRICIAIS
===================================================== */
function zeros(n, m) {
  return Array.from({ length: n }, () => Array(m).fill(0));
}
function transpose(A) { return A[0].map((_, i) => A.map(r => r[i])); }
function multiply(A, B) {
  const C = zeros(A.length, B[0].length);
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < B[0].length; j++)
      for (let k = 0; k < B.length; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

/* =====================================================
   MODELO
===================================================== */
const model = { nodes: [], elements: [], supports: [], loads: [] };

/* =====================================================
   EDIÇÃO DE APOIOS
===================================================== */
function setSupport(nodeId, fixX, fixY, fixM) {
  const sup = model.supports.find(s => s.node.id === nodeId);
  if (sup) sup.fixed = [fixX, fixY, fixM];
  else {
    const node = model.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error("Nó não encontrado");
    model.supports.push({ node, fixed: [fixX, fixY, fixM] });
  }
}

/* =====================================================
   EDIÇÃO INTERATIVA DE CARGAS
===================================================== */
let selectedLoad = null;
let dragType = null;

function addLoad(nodeId, valueX=0, valueY=0, moment=0) {
  const node = model.nodes.find(n => n.id === nodeId);
  if (!node) throw new Error("Nó não encontrado");
  model.loads.push({ node, valueX, valueY, moment });
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.addEventListener("mousedown", e => {
  const pos = { x: e.offsetX, y: e.offsetY };
  selectedLoad = model.loads.find(l => Math.abs(l.node.x - pos.x) < 10 && Math.abs(l.node.y - pos.y) < 10);
  if (selectedLoad) dragType = 'force';
});

canvas.addEventListener("mousemove", e => {
  if (selectedLoad && dragType==='force') {
    const dx = e.offsetX - selectedLoad.node.x;
    const dy = selectedLoad.node.y - e.offsetY; 
    selectedLoad.valueX = dx / 5; 
    selectedLoad.valueY = dy / 5; 
    solveStructure(); draw();
  }
});

canvas.addEventListener("mouseup", e => { selectedLoad = null; dragType=null; });

/* =====================================================
   SOLVER MATRICIAL + REAÇÕES
===================================================== */
function solveStructure() {
  const dofMap = new Map();
  let dofCount = 0;
  model.nodes.forEach(n => { dofMap.set(n.id, [dofCount, dofCount+1, dofCount+2]); dofCount+=3; });

  let K = zeros(dofCount, dofCount);
  let F = Array(dofCount).fill(0);

  model.elements.forEach(el => {
    const { n1, n2 } = el;
    const dx = n2.x - n1.x; const dy = n2.y - n1.y;
    const L = Math.hypot(dx, dy); const c = dx/L; const s = dy/L;
    const E = el.E||210e6, A=el.A||0.02, I=el.I||8e-4;

    const kL = [
      [A*E/L,0,0,-A*E/L,0,0],
      [0,12*E*I/L**3,6*E*I/L**2,0,-12*E*I/L**3,6*E*I/L**2],
      [0,6*E*I/L**2,4*E*I/L,0,-6*E*I/L**2,2*E*I/L],
      [-A*E/L,0,0,A*E/L,0,0],
      [0,-12*E*I/L**3,-6*E*I/L**2,0,12*E*I/L**3,-6*E*I/L**2],
      [0,6*E*I/L**2,2*E*I/L,0,-6*E*I/L**2,4*E*I/L]
    ];
    const T = [[c,s,0,0,0,0],[-s,c,0,0,0,0],[0,0,1,0,0,0],[0,0,0,c,s,0],[0,0,0,-s,c,0],[0,0,0,0,0,1]];
    const kG = multiply(transpose(T), multiply(kL, T));
    const dofs = [...dofMap.get(n1.id), ...dofMap.get(n2.id)];
    dofs.forEach((I,i)=>dofs.forEach((J,j)=>{ K[I][J]+=kG[i][j]; }));
  });

  model.loads.forEach(l => {
    const d = dofMap.get(l.node.id);
    F[d[0]] += l.valueX; F[d[1]] += l.valueY; 
  });

  model.supports.forEach(s => {
    const d = dofMap.get(s.node.id);
    s.fixed.forEach((fix,i)=>{
      if(fix){ const k=d[i]; K[k].fill(0); K.forEach(r=>r[k]=0); K[k][k]=1; F[k]=0; }
    });
  });

  const u = gaussianElimination(K.map(r=>[...r]), [...F]);
  const Ku = multiply(K, u.map(v=>[v])).map(v=>v[0]);
  const R = Ku.map((v,i)=>v-F[i]);
  model.supports.forEach(s=>{
    const d = dofMap.get(s.node.id);
    s.reactions={ Fx: s.fixed[0]?R[d[0]]:0, Fy:s.fixed[1]?R[d[1]]:0, Mz:s.fixed[2]?R[d[2]]:0 };
  });
}

/* =====================================================
   FUNÇÃO DE DESENHO AVANÇADO
===================================================== */
function drawGrid(ctx, width, height, step=25) {
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 0.5;
  for(let x=0;x<=width;x+=step){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke();
  }
  for(let y=0;y<=height;y+=step){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  // Elementos (vigas)
  ctx.strokeStyle="black";
  ctx.lineWidth=2;
  model.elements.forEach(el=>{
    ctx.beginPath();
    ctx.moveTo(el.n1.x,el.n1.y);
    ctx.lineTo(el.n2.x,el.n2.y);
    ctx.stroke();

    // Gráficos de esforços simplificados (educativo)
    const nx = el.n2.x - el.n1.x;
    const ny = el.n2.y - el.n1.y;
    const length = Math.hypot(nx, ny);
    const angle = Math.atan2(ny, nx);

    // Função para converter valor de esforço em pixels
    const scale = 0.02;

    // Desenhar momento fletor
    ctx.strokeStyle = "purple";
    ctx.beginPath();
    for(let t=0;t<=1;t+=0.05){
      const x = el.n1.x + nx*t;
      const y = el.n1.y + ny*t - scale*50*Math.sin(Math.PI*t); // curva senoidal para momento
      if(t===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.fillText("M", el.n1.x + nx/2, el.n1.y - 55);

    // Desenhar cortante
    ctx.strokeStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(el.n1.x, el.n1.y - scale*30);
    ctx.lineTo(el.n2.x, el.n2.y - scale*30);
    ctx.stroke();
    ctx.fillText("V", el.n2.x + 5, el.n2.y - 30);

    // Desenhar normal
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(el.n1.x, el.n1.y);
    ctx.lineTo(el.n2.x, el.n2.y);
    ctx.stroke();
    ctx.fillText("N", el.n2.x + 5, el.n2.y + 15);
  });

  // Nós
  ctx.fillStyle="blue";
  model.nodes.forEach(n=>{
    ctx.beginPath();
    ctx.arc(n.x,n.y,6,0,Math.PI*2);
    ctx.fill();
  });

  // Apoios
  model.supports.forEach(s=>{
    const {x,y}=s.node;
    ctx.fillStyle="green"; ctx.fillRect(x-8,y+5,16,8);
  });

  // Cargas
  model.loads.forEach(l=>{
    const {x,y}=l.node;
    ctx.strokeStyle="red"; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+l.valueX*5, y-l.valueY*5);
    ctx.stroke();
    ctx.fillStyle="red";
    ctx.fillText(`Fx:${l.valueX.toFixed(1)}, Fy:${l.valueY.toFixed(1)}`, x+5, y-5);
  });
}

/* =====================================================
   GAUSS
===================================================== */
function gaussianElimination(A,b){
  const n=b.length;
  for(let i=0;i<n;i++){
    let max=i;
    for(let k=i+1;k<n;k++) if(Math.abs(A[k][i])>Math.abs(A[max][i])) max=k;
    [A[i],A[max]]=[A[max],A[i]];
    [b[i],b[max]]=[b[max],b[i]];
    for(let k=i+1;k<n;k++){
      const f=A[k][i]/A[i][i];
      for(let j=i;j<n;j++) A[k][j]-=f*A[i][j];
      b[k]-=f*b[i];
    }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){
    x[i]=b[i]; for(let j=i+1;j<n;j++) x[i]-=A[i][j]*x[j]; x[i]/=A[i][i];
  }
  return x;
}

/* =====================================================
   EXEMPLO DE USO
===================================================== */
model.nodes.push({id:1,x:100,y:400});
model.nodes.push({id:2,x:400,y:400});
model.nodes.push({id:3,x:700,y:400});

model.elements.push({n1:model.nodes[0],n2:model.nodes[1]});
model.elements.push({n1:model.nodes[1],n2:model.nodes[2]});

setSupport(1,true,true,false);
setSupport(3,true,true,false);
addLoad(2,50,100,0);

solveStructure();
draw();
