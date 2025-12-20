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

function add(A, B) {
  return A.map((r, i) => r.map((v, j) => v + B[i][j]));
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
   SOLVER MATRICIAL
===================================================== */
function solveStructure() {
  const dofMap = new Map();
  let dofCount = 0;

  // Numerar DOFs
  model.nodes.forEach(n => {
    dofMap.set(n.id, [dofCount, dofCount + 1, dofCount + 2]);
    dofCount += 3;
  });

  let K = zeros(dofCount, dofCount);
  let F = Array(dofCount).fill(0);

  // Montagem da rigidez global
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

    const k = [
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

    const kG = multiply(transpose(T), multiply(k, T));

    const dofs = [
      ...dofMap.get(n1.id),
      ...dofMap.get(n2.id)
    ];

    dofs.forEach((i, r) => {
      dofs.forEach((j, c) => {
        K[i][j] += kG[r][c];
      });
    });
  });

  // Aplicar cargas nodais (por enquanto pontuais)
  model.loads.forEach(l => {
    const dofs = dofMap.get(l.node.id);
    F[dofs[1]] -= l.value;
  });

  // Aplicar vínculos
  model.supports.forEach(s => {
    const dofs = dofMap.get(s.node.id);
    s.fixed.forEach((isFixed, i) => {
      if (isFixed) {
        const d = dofs[i];
        K[d].fill(0);
        K.forEach(r => r[d] = 0);
        K[d][d] = 1;
        F[d] = 0;
      }
    });
  });

  // Resolver sistema (Gauss simples)
  const u = gaussianElimination(K, F);
  console.log("Deslocamentos:", u);
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
