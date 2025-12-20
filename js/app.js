/* =======================================
   UTILIDADES MATRICIAIS
======================================= */
function zeros(n,m){return Array.from({length:n},()=>Array(m).fill(0));}
function transpose(A){return A[0].map((_,i)=>A.map(r=>r[i]));}
function multiply(A,B){
  const C=zeros(A.length,B[0].length);
  for(let i=0;i<A.length;i++)
    for(let j=0;j<B[0].length;j++)
      for(let k=0;k<B.length;k++)
        C[i][j]+=A[i][k]*B[k][j];
  return C;
}

/* =======================================
   MODELO
======================================= */
const model={nodes:[],elements:[],supports:[],loads:[],hinges:[]};

/* =======================================
   VARIÁVEIS DE CONTROLE
======================================= */
let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");
let showEfforts=true;
let drawMode=null;
let selectedNodesForBeam=[];

/* =======================================
   INTERAÇÃO USUÁRIO
======================================= */
function addNodePrompt(){
  const x=parseFloat(prompt("Posição X do nó (m):"));
  const y=parseFloat(prompt("Posição Y do nó (m):"));
  if(isNaN(x)||isNaN(y)) return;
  const id=model.nodes.length+1;
  const type=prompt("Tipo de apoio: fixo, desl. horizontal, desl. vertical, livre","fixo");
  const fixed=[false,false,false];
  if(type==="fixo") fixed[0]=fixed[1]=fixed[2]=true;
  else if(type==="desl. horizontal") fixed[1]=fixed[2]=true;
  else if(type==="desl. vertical") fixed[0]=fixed[2]=true;
  else fixed[0]=fixed[1]=fixed[2]=false;
  const node={id,x,y};
  model.nodes.push(node);
  if(type!=="livre") model.supports.push({node,fixed,reactions:{Fx:0,Fy:0,Mz:0}});
  draw();
  updateRightSidebar();
  solveStructure();
}

function startDrawBeam(){
  drawMode="beam";
  selectedNodesForBeam=[];
  alert("Clique em dois nós/apoios para criar a viga.");
}

canvas.addEventListener("click", e=>{
  const rect=canvas.getBoundingClientRect();
  const mouseX=(e.clientX-rect.left);
  const mouseY=(e.clientY-rect.top);
  if(drawMode==="beam"){
    let nearest=findNearestNode(mouseX,mouseY);
    if(!nearest) return;
    selectedNodesForBeam.push(nearest);
    if(selectedNodesForBeam.length===2){
      let confirmed=confirm(`Criar viga entre Nó ${selectedNodesForBeam[0].id} e Nó ${selectedNodesForBeam[1].id}?`);
      if(confirmed){
        model.elements.push({n1:selectedNodesForBeam[0],n2:selectedNodesForBeam[1],E:210e6,A:0.02,I:8e-4});
        updateRightSidebar();
        draw();
        solveStructure();
      }
      selectedNodesForBeam=[];
      drawMode=null;
    }
  }
});

/* Cargas */
function addLoadPrompt(){
  const id=parseInt(prompt("ID do nó para carga:"));
  const node=model.nodes.find(n=>n.id===id);
  if(!node) return;
  const fx=parseFloat(prompt("Força X (kN):"))||0;
  const fy=parseFloat(prompt("Força Y (kN):"))||0;
  model.loads.push({node,value:fy}); // para simplificação Fy, Fx pode ser estendido
  draw();
  solveStructure();
  updateMemoryCard();
  updateRightSidebar();
}

function addDistLoadPrompt(){
  const beamIndex=parseInt(prompt("Número da viga:"))-1;
  const beam=model.elements[beamIndex];
  if(!beam) return;
  const start=parseFloat(prompt("Início da carga (m, relativo à viga):"))||0;
  const end=parseFloat(prompt("Fim da carga (m):"))||1;
  const magnitude=parseFloat(prompt("Magnitude (kN/m):"))||0;
  if(!beam.distLoads) beam.distLoads=[];
  beam.distLoads.push({start,end,magnitude});
  draw();
}

function addMomentPrompt(){
  const id=parseInt(prompt("ID do nó para momento:"));
  const node=model.nodes.find(n=>n.id===id);
  if(!node) return;
  const M=parseFloat(prompt("Momento aplicado (kN·m):"))||0;
  if(!node.moments) node.moments=[];
  node.moments.push(M);
  draw();
}

function addHingePrompt(){
  const beamIndex=parseInt(prompt("Número da viga para rótula:"))-1;
  const beam=model.elements[beamIndex];
  if(!beam) return;
  const pos=parseFloat(prompt("Posição da rótula na viga (m, 0=start, 1=end):"))||0.5;
  if(!beam.hinges) beam.hinges=[];
  beam.hinges.push(pos);
  draw();
}

/* =======================================
   DESENHO
======================================= */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Vigas
  model.elements.forEach(el=>{
    ctx.beginPath();
    ctx.moveTo(el.n1.x,el.n1.y);
    ctx.lineTo(el.n2.x,el.n2.y);
    ctx.strokeStyle="#005b96";
    ctx.lineWidth=4;
    ctx.stroke();

    // Rótulas
    if(el.hinges) el.hinges.forEach(p=>{
      const x=el.n1.x+(el.n2.x-el.n1.x)*p;
      const y=el.n1.y+(el.n2.y-el.n1.y)*p;
      ctx.beginPath();
      ctx.arc(x,y,6,0,2*Math.PI);
      ctx.fillStyle="red";
      ctx.fill();
    });
  });

  // Nós/apoios
  model.nodes.forEach(n=>{
    ctx.beginPath();
    ctx.arc(n.x,n.y,6,0,2*Math.PI);
    ctx.fillStyle="#007acc";
    ctx.fill();
    ctx.strokeStyle="#003f5c";
    ctx.stroke();
  });

  // Cargas concentradas (somente Fy mostrado)
  model.loads.forEach(l=>{
    ctx.beginPath();
    ctx.moveTo(l.node.x,l.node.y);
    ctx.lineTo(l.node.x,l.node.y-20*l.value/10);
    ctx.strokeStyle="orange";
    ctx.lineWidth=2;
    ctx.stroke();
  });
}

/* =======================================
   UTILIDADES
======================================= */
function findNearestNode(x,y){
  let minDist=Infinity;
  let nearest=null;
  model.nodes.forEach(n=>{
    const dx=n.x-x;
    const dy=n.y-y;
    const d=Math.sqrt(dx*dx+dy*dy);
    if(d<minDist && d<20){ minDist=d; nearest=n; }
  });
  return nearest;
}

/* =======================================
   SOLVER (simplificado)
======================================= */
function solveStructure(){
  // Para simplificação apenas placeholder
  model.supports.forEach(s=>{s.reactions={Fx:0,Fy:0,Mz:0};});
  updateMemoryCard();
}

function updateMemoryCard(){
  const container=document.getElementById("reactionMemory");
  if(model.supports.length===0){container.innerHTML="Nenhuma reação calculada ainda."; return;}
  let html="<ul>";
  model.supports.forEach(s=>{
    const r=s.reactions||{Fx:0,Fy:0,Mz:0};
    html+=`<li>Nó ${s.node.id}: Fx=${r.Fx.toFixed(2)} kN, Fy=${r.Fy.toFixed(2)} kN, Mz=${r.Mz.toFixed(2)} kN·m</li>`;
  });
  html+="</ul>";
  container.innerHTML=html;
}

/* =======================================
   SIDEBAR DIREITA
======================================= */
function updateRightSidebar(){
  const container=document.getElementById("elementList");
  if(model.nodes.length+model.elements.length+model.loads.length===0){
    container.innerHTML="Nenhum elemento ainda."; return;
  }
  let html="";
  model.nodes.forEach(n=>html+=`<div class="element">Nó ${n.id} - (${n.x.toFixed(2)}, ${n.y.toFixed(2)})</div>`);
  model.elements.forEach((el,i)=>html+=`<div class="element">Viga ${i+1} - Nó ${el.n1.id} a Nó ${el.n2.id}</div>`);
  model.loads.forEach((l,i)=>html+=`<div class="element">Carga ${i+1} - Nó ${l.node.id} - ${l.value} kN</div>`);
  container.innerHTML=html;
}
