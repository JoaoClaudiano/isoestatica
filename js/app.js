/* =====================================================
   UTILIDADES MATRICIAIS
===================================================== */
function zeros(n, m) {
  return Array.from({ length: n }, () => Array(m).fill(0));
}
function transpose(A) {
  return A[0].map((_, i) => A.map(r => r[i]));
}
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
const model = {
  nodes: [],
  elements: [],
  supports: [],
  loads: []
};

/* =====================================================
   SOLVER MATRICIAL + REAÇÕES
===================================================== */
function solveStructure() {

  /* 1. DOFs */
  const dofMap = new Map();
  let dofCount = 0;
  model.nodes.forEach(n => {
    dofMap.set(n.id, [dofCount, dofCount + 1, dofCount + 2]);
    dofCount += 3;
  });

  /* 2. Inicialização */
  let K = zeros(dofCount, dofCount);
  let F = Array(dofCount).fill(0);

  /* 3. Rigidez global */
  model.elements.forEach(el => {
    const { n1, n2 } = el;
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.hypot(dx, dy);
    const c = dx / L;
    const s = dy / L;

    const E = el.E || 210e6;
    const A = el.A || 0.02;
    const I = el.I || 8e-4;

    const kL = [
      [ A*E/L, 0, 0, -A*E/L, 0, 0 ],
      [ 0, 12*E*I/L**3, 6*E*I/L**2, 0, -12*E*I/L**3, 6*E*I/L**2 ],
      [ 0, 6*E*I/L**2, 4*E*I/L, 0, -6*E*I/L**2, 2*E*I/L ],
      [ -A*E/L, 0, 0, A*E/L, 0, 0 ],
      [ 0, -12*E*I/L**3, -6*E*I/L**2, 0, 12*E*I/L**3, -6*E*I/L**2 ],
      [ 0, 6*E*I/L**2, 2*E*I/L, 0, -6*E*I/L**2, 4*E*I/L ]
    ];

    const T = [
      [ c, s, 0, 0, 0, 0 ],
      [ -s, c, 0, 0, 0, 0 ],
      [ 0, 0, 1, 0, 0, 0 ],
      [ 0, 0, 0, c, s, 0 ],
      [ 0, 0, 0, -s, c, 0 ],
      [ 0, 0, 0, 0, 0, 1 ]
    ];

    const kG = multiply(transpose(T), multiply(kL, T));
    const dofs = [...dofMap.get(n1.id), ...dofMap.get(n2.id)];

    dofs.forEach((I, i) => {
      dofs.forEach((J, j) => {
        K[I][J] += kG[i][j];
      });
    });
  });

  /* 4. Cargas nodais */
  model.loads.forEach(l => {
    const d = dofMap.get(l.node.id);
    F[d[1]] -= l.value;
  });

  /* 5. Vínculos */
  model.supports.forEach(s => {
    const d = dofMap.get(s.node.id);
    s.fixed.forEach((fix, i) => {
      if (fix) {
        const k = d[i];
        K[k].fill(0);
        K.forEach(r => r[k] = 0);
        K[k][k] = 1;
        F[k] = 0;
      }
    });
  });

  /* 6. Resolver */
  const u = gaussianElimination(K.map(r => [...r]), [...F]);

  /* 7. Reações */
  const Ku = multiply(K, u.map(v => [v])).map(v => v[0]);
  const R = Ku.map((v, i) => v - F[i]);

  model.supports.forEach(s => {
    const d = dofMap.get(s.node.id);
    s.reactions = {
      Fx: s.fixed[0] ? R[d[0]] : 0,
      Fy: s.fixed[1] ? R[d[1]] : 0,
      Mz: s.fixed[2] ? R[d[2]] : 0
    };
  });

  console.log("Reações:", model.supports);
}

/* =====================================================
   VISUALIZAÇÃO DAS REAÇÕES
===================================================== */
function drawReactions(ctx) {
  model.supports.forEach(s => {
    const { x, y } = s.node;
    const r = s.reactions;
    const scale = 0.02;

    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";

    if (r.Fy !== 0) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - r.Fy * scale);
      ctx.stroke();
      ctx.fillText(r.Fy.toFixed(2) + " kN", x + 4, y - r.Fy * scale);
    }

    if (r.Mz !== 0) {
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.fillText(r.Mz.toFixed(2) + " kN·m", x + 20, y - 20);
    }
  });
}

/* =====================================================
   GAUSS
===================================================== */
function gaussianElimination(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i + 1; k < n; k++)
      if (Math.abs(A[k][i]) > Math.abs(A[max][i])) max = k;
    [A[i], A[max]] = [A[max], A[i]];
    [b[i], b[max]] = [b[max], b[i]];

    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
      b[k] -= f * b[i];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}
