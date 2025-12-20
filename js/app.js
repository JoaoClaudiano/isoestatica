/* =====================================================
   UTIL MATRICIAL
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
   SOLVER MATRICIAL GLOBAL
===================================================== */
function solveStructure() {
  /* -------------------------
     1. NUMERAÇÃO DE DOFs
  ------------------------- */
  const dofMap = new Map();
  let dofCount = 0;

  model.nodes.forEach(n => {
    dofMap.set(n.id, [dofCount, dofCount + 1, dofCount + 2]);
    dofCount += 3;
  });

  /* -------------------------
     2. INICIALIZAÇÃO
  ------------------------- */
  let K = zeros(dofCount, dofCount);
  let F = Array(dofCount).fill(0);

  /* -------------------------
     3. MONTAGEM DA RIGIDEZ
  ------------------------- */
  model.elements.forEach(el => {
    const n1 = el.n1;
    const n2 = el.n2;

    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const L = Math.hypot(dx, dy);
    const c = dx / L;
    const s = dy / L;

    const E = el.E || 210e6;
    const A = el.A || 0.02;
    const I = el.I || 8e-4;

    const kLocal = [
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

    const kGlobal = multiply(transpose(T), multiply(kLocal, T));

    const dofs = [
      ...dofMap.get(n1.id),
      ...dofMap.get(n2.id)
    ];

    dofs.forEach((I, i) => {
      dofs.forEach((J, j) => {
        K[I][J] += kGlobal[i][j];
      });
    });
  });

  /* -------------------------
     4. CARGAS NODAIS
  ------------------------- */
  model.loads.forEach(l => {
    const dofs = dofMap.get(l.node.id);
    F[dofs[1]] -= l.value;
  });

  /* -------------------------
     5. VÍNCULOS
  ------------------------- */
  model.supports.forEach(s => {
    const dofs = dofMap.get(s.node.id);
    s.fixed.forEach((fix, i) => {
      if (fix) {
        const d = dofs[i];
        K[d].fill(0);
        K.forEach(r => r[d] = 0);
        K[d][d] = 1;
        F[d] = 0;
      }
    });
  });

  /* -------------------------
     6. RESOLUÇÃO
  ------------------------- */
  const u = gaussianElimination(K, F);
  console.log("Deslocamentos globais:", u);

  /* -------------------------
     7. PÓS-PROCESSAMENTO
  ------------------------- */
  model.elements.forEach(el => {
    const forces = recoverElementForces(el, u, dofMap);
    generateDiagramsFromForces(el, forces);
  });
}

/* =====================================================
   RECUPERAÇÃO DE ESFORÇOS
===================================================== */
function recoverElementForces(el, globalU, dofMap) {
  const n1 = el.n1;
  const n2 = el.n2;

  const dofs = [
    ...dofMap.get(n1.id),
    ...dofMap.get(n2.id)
  ];

  const uG = dofs.map(d => globalU[d]);

  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const L = Math.hypot(dx, dy);
  const c = dx / L;
  const s = dy / L;

  const T = [
    [ c, s, 0, 0, 0, 0 ],
    [ -s, c, 0, 0, 0, 0 ],
    [ 0, 0, 1, 0, 0, 0 ],
    [ 0, 0, 0, c, s, 0 ],
    [ 0, 0, 0, -s, c, 0 ],
    [ 0, 0, 0, 0, 0, 1 ]
  ];

  const uL = multiply(T, uG.map(v => [v]));

  const E = el.E || 210e6;
  const A = el.A || 0.02;
  const I = el.I || 8e-4;

  const kLocal = [
    [ A*E/L, 0, 0, -A*E/L, 0, 0 ],
    [ 0, 12*E*I/L**3, 6*E*I/L**2, 0, -12*E*I/L**3, 6*E*I/L**2 ],
    [ 0, 6*E*I/L**2, 4*E*I/L, 0, -6*E*I/L**2, 2*E*I/L ],
    [ -A*E/L, 0, 0, A*E/L, 0, 0 ],
    [ 0, -12*E*I/L**3, -6*E*I/L**2, 0, 12*E*I/L**3, -6*E*I/L**2 ],
    [ 0, 6*E*I/L**2, 2*E*I/L, 0, -6*E*I/L**2, 4*E*I/L ]
  ];

  const fLocal = multiply(kLocal, uL);

  return {
    N1: fLocal[0][0],
    V1: fLocal[1][0],
    M1: fLocal[2][0],
    N2: fLocal[3][0],
    V2: fLocal[4][0],
    M2: fLocal[5][0],
    L
  };
}

/* =====================================================
   DIAGRAMAS CONTÍNUOS
===================================================== */
function generateDiagramsFromForces(el, f) {
  const steps = 40;
  el.diagrams = { N: [], V: [], M: [] };

  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * f.L;

    el.diagrams.N.push({
      s,
      value: f.N1 + (f.N2 - f.N1) * s / f.L
    });

    el.diagrams.V.push({
      s,
      value: f.V1 + (f.V2 - f.V1) * s / f.L
    });

    el.diagrams.M.push({
      s,
      value:
        f.M1 * (1 - s / f.L) +
        f.M2 * (s / f.L) +
        f.V1 * s -
        f.V2 * s
    });
  }
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
