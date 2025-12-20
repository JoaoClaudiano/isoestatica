/* =======================================
   MODELO
======================================= */
const model = {
  nodes: [],
  elements: [],
  supports: [],
  loads: [],
  hinges: []
};

/* =======================================
   VARIÁVEIS DE CONTROLE
======================================= */
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let crosshair = document.getElementById("crosshair");

let drawMode = null;
let selectedNodesForBeam = [];
let scale = 1;
let offsetX = 0;
let offsetY = 0;

/* =======================================
   INTERAÇÃO DO USUÁRIO
======================================= */
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  crosshair.style.left = (e.clientX - rect.left) + "px";
  crosshair.style.top = (e.clientY - rect.top) + "px";
});

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left - offsetX) / scale;
  const mouseY = (e.clientY - rect.top - offsetY) / scale;

  if(drawMode === "beam"){
    let nearest = findNearestNode(mouseX, mouseY);
    if(!nearest) return;
    selectedNodesForBeam.push(nearest);
    if(selectedNodesForBeam.length === 2){
      let confirmed = confirm(`Criar viga entre Nó ${selectedNodesForBeam[0].id} e Nó ${selectedNodesForBeam[1].id}?`);
      if(confirmed){
        model.elements.push({
          n1:selectedNodesForBeam[0],
          n2:selectedNodesForBeam[1],
          E:210e6,
          A:0.02,
          I:8e-4,
          hinges:[],
          distLoads:[]
        });
        selectedNodesForBeam = [];
        drawMode = null;
        updateRightSidebar();
        solveStructure();
        zoomToElements();
        draw();
      } else {
        selectedNodesForBeam = [];
        drawMode = null;
      }
    }
  }
});

/* =======================================
   FUNÇÕES DE INSERÇÃO
======================================= */
function addNodePrompt(){
  const x = parseFloat(prompt("Posição X do nó (m):"));
  const y = parseFloat(prompt("Posição Y do nó (m):"));
  if(isNaN(x)||isNaN(y)) return;
  const id = model.nodes.length + 1;
  const type = prompt("Tipo de apoio: fixo, desl. horizontal, desl. vertical, livre","fixo");
  const fixed = [false,false,false];
  if(type==="fixo") fixed[0]=fixed[1]=fixed[2]=true;
  else if(type==="desl. horizontal") fixed[1]=fixed[2]=true;
  else if(type==="desl. vertical") fixed[0]=fixed[2]=true;
  const node = {id,x,y};
  model.nodes.push(node);
  if(type!=="livre") model.supports.push({node,fixed,reactions:{Fx:0,Fy:0,Mz:0}});
  draw();
  updateRightSidebar();
  solveStructure();
  zoomToElements();
}

function startDrawBeam(){
  drawMode="beam";
  selectedNodesForBeam=[];
  alert("Clique em dois nós/apoios para criar a viga.");
}

function addLoadPrompt(){
  const id = parseInt(prompt("ID do nó para carga:"));
  const node = model.nodes.find(n=>n.id===id);
  if(!node) return;
  const fy = parseFloat(prompt("Força vertical (kN):"))||0;
  model.loads.push({node,value:fy});
  draw();
  solveStructure();
  updateMemoryCard();
  updateRightSidebar();
  zoomToElements();
}

function addDistLoadPrompt(){
  const beamIndex = parseInt(prompt("Número da viga:"))-1;
  const beam = model.elements[beamIndex];
  if(!beam) return;
  const start = parseFloat(prompt("Início da carga (m, relativo à viga):"))||0;
  const end = parseFloat(prompt("Fim da carga (m):"))||1;
  const magnitude = parseFloat(prompt("Magnitude (kN/m):"))||0;
  beam.distLoads.push({start,end,magnitude});
  draw();
  zoomToElements();
}

function addMomentPrompt(){
  const id = parseInt(prompt("ID do nó para momento:"));
  const node = model.nodes.find(n=>n.id===id);
  if(!node) return;
  const M = parseFloat(prompt("Momento aplicado (kN·m):"))||0;
  if(!node.moments) node.moments=[];
  node.moments.push(M);
  draw();
  zoomToElements();
}

function addHingePrompt(){
  const beamIndex = parseInt(prompt("Número da viga para rótula:"))-1;
  const beam = model.elements[beamIndex];
  if(!beam) return;
  const pos = parseFloat(prompt("Posição da rótula na viga (0=início,1=fim):"))||0.5;
  beam.hinges.push(pos);
  draw();
  zoomToElements();
}

/* =======================================
   FUNÇÃO DE DESENHO
======================================= */
function draw(){
  ctx.setTransform(scale,0,0,scale,offsetX,offsetY);
  ctx.clearRect(-offsetX/scale,-offsetY/scale,canvas.width/scale,canvas.height/scale);

  // Vigas
  model.elements.forEach((el,i)=>{
    ctx.beginPath();
    ctx.moveTo(el.n1.x,el.n1.y);
    ctx.lineTo(el.n2.x,el.n2.y);
    ctx.strokeStyle="#005b96";
    ctx.lineWidth=4/scale;
    ctx.stroke();

    // Rótulas
    el.hinges.forEach(p=>{
      const x = el.n1.x + (el.n2.x - el.n1.x)*p;
      const y = el.n1.y + (el.n2.y - el.n1.y)*p;
      ctx.beginPath();
      ctx.arc(x,y,6/scale,0,2*Math.PI);
      ctx.fillStyle="red";
      ctx.fill();
    });

    // Carga distribuída
    if(el.distLoads){
      el.distLoads.forEach(d=>{
        const sx = el.n1.x + (el.n2.x - el.n1.x)*d.start;
        const ex = el.n1.x + (el.n2.x - el.n1.x)*d.end;
        const sy = el.n1.y + (el.n2.y - el.n1.y)*d.start;
        const ey = el.n1.y + (el.n2.y - el.n1.y)*d.end;
        ctx.strokeStyle="orange";
        ctx.lineWidth=2/scale;
        ctx.beginPath();
        ctx.moveTo(sx,sy);
        ctx.lineTo(ex,ey-10*d.magnitude/10);
        ctx.stroke();
      });
    }
  });

  // Nós/apoios
  model.nodes.forEach(n=>{
    ctx.beginPath();
    ctx.arc(n.x,n.y,6/scale,0,2*Math.PI);
    ctx.fillStyle="#007acc";
    ctx.fill();
    ctx.strokeStyle="#003f5c";
    ctx.stroke();
  });

  // Cargas concentradas
  model.loads.forEach(l=>{
    ctx.beginPath();
    ctx.moveTo(l.node.x,l.node.y);
    ctx.lineTo(l.node.x,l.node.y-20*l.value/10);
    ctx.strokeStyle="orange";
    ctx.lineWidth=2/scale;
    ctx.stroke();
  });
}

/* =======================================
   UTILIDADES
======================================= */
function findNearestNode(x,y){
  let minDist = Infinity;
  let nearest = null;
  model.nodes.forEach(n=>{
    const dx = n.x - x;
    const dy = n.y - y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if(d<minDist && d<20/scale){ minDist=d; nearest=n; }
  });
  return nearest;
}

/* =======================================
   ZOOM AUTOMÁTICO
======================================= */
function zoomToElements(){
  if(model.nodes.length===0) return;
  let minX=Math.min(...model.nodes.map(n=>n.x));
  let maxX=Math.max(...model.nodes.map(n=>n.x));
  let minY=Math.min(...model.nodes.map(n=>n.y));
  let maxY=Math.max(...model.nodes.map(n=>n.y));

  const padding = 50;
  const cw = canvas.width;
  const ch = canvas.height;

  const scaleX = (cw-2*padding)/(maxX-minX);
  const scaleY = (ch-2*padding)/(maxY-minY);
  scale = Math.min(scaleX,scaleY,1);

  offsetX = padding - minX*scale + (cw-(maxX-minX)*scale)/2 - cw/2;
  offsetY = padding - minY*scale + (ch-(maxY-minY)*scale)/2 - ch/2;

  draw();
}

/* =======================================
   SOLVER SIMPLIFICADO
======================================= */
function solveStructure(){
  model.supports.forEach(s=>{
    s.reactions = {Fx:0,Fy:0,Mz:0}; // placeholder para cálculo real
  });
  updateMemoryCard();
}

/* =======================================
   MEMÓRIA DE CÁLCULO
======================================= */
function updateMemoryCard(){
  const container = document.getElementById("reactionMemory");
  if(model.supports.length===0){container.innerHTML="Nenhuma reação calculada ainda."; return;}
  let html = "<ul>";
  model.supports.forEach(s=>{
    const r = s.reactions||{Fx:0,Fy:0,Mz:0};
    html += `<li>Nó ${s.node.id}: Fx=${r.Fx.toFixed(2)} kN, Fy=${r.Fy.toFixed(2)} kN, Mz=${r.Mz.toFixed(2)} kN·m</li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

/* =======================================
   SIDEBAR DIREITA: EDIÇÃO
======================================= */
function updateRightSidebar(){
  const container = document.getElementById("elementList");
  if(model.nodes.length+model.elements.length+model.loads.length===0){
    container.innerHTML="Nenhum elemento ainda."; return;
  }
  let html="";
  model.nodes.forEach(n=>{
    html+=`<div class="element">Nó ${n.id} - (${n.x.toFixed(2)},${n.y.toFixed(2)}) <button onclick="editNode(${n.id})">Editar</button> <button onclick="removeNode(${n.id})">Remover</button></div>`;
  });
  model.elements.forEach((el,i)=>{
    html+=`<div class="element">Viga ${i+1} - Nó ${el.n1.id} a Nó ${el.n2.id} <button onclick="editBeam(${i})">Editar</button> <button onclick="removeBeam(${i})">Remover</button></div>`;
  });
  model.loads.forEach((l,i)=>{
    html+=`<div class="element">Carga ${i+1} - Nó ${l.node.id} - ${l.value} kN <button onclick="editLoad(${i})">Editar</button> <button onclick="removeLoad(${i})">Remover</button></div>`;
  });
  container.innerHTML = html;
}

/* EDIÇÃO */
function editNode(id){
  const node = model.nodes.find(n=>n.id===id);
  if(!node) return;
  const x = parseFloat(prompt("Nova posição X (m):",node.x));
  const y = parseFloat(prompt("Nova posição Y (m):",node.y));
  if(!isNaN(x)&&!isNaN(y)){ node.x=x; node.y=y; draw(); zoomToElements(); }
}

function removeNode(id){
  model.nodes = model.nodes.filter(n=>n.id!==id);
  model.supports = model.supports.filter(s=>s.node.id!==id);
  model.elements = model.elements.filter(el=>el.n1.id!==id && el.n2.id!==id);
  model.loads = model.loads.filter(l=>l.node.id!==id);
  draw();
  updateRightSidebar();
  solveStructure();
}

function editBeam(index){
  const beam = model.elements[index];
  const e = parseFloat(prompt("Módulo de elasticidade E (Pa):",beam.E));
  const a = parseFloat(prompt("Área A (m²):",beam.A));
  const i = parseFloat(prompt("Inércia I (m⁴):",beam.I));
  if(!isNaN(e)) beam.E=e;
  if(!isNaN(a)) beam.A=a;
  if(!isNaN(i)) beam.I=i;
  draw();
  solveStructure();
}

function removeBeam(index){
  model.elements.splice(index,1);
  draw();
  updateRightSidebar();
  solveStructure();
}

function editLoad(index){
  const load = model.loads[index];
  const fy = parseFloat(prompt("Nova força vertical (kN):",load.value));
  if(!isNaN(fy)) load.value=fy;
  draw();
  solveStructure();
  updateMemoryCard();
  updateRightSidebar();
}

function removeLoad(index){
  model.loads.splice(index,1);
  draw();
  solveStructure();
  updateMemoryCard();
  updateRightSidebar();
}
