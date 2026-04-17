// ── Lógica pura del puzzle ───────────────────────────────────
// Depende de: config.js
// Optimizado para 5×5: precomputación de posiciones, forward checking,
// validación incremental (color constraints) en cada nodo.

function mkRng(seed) {
  let s = (seed ^ 0x9E3779B9) >>> 0;
  return () => {
    s = Math.imul(s ^ (s>>>16), 0x45d9f3b);
    s = Math.imul(s ^ (s>>>13), 0x3a5a9c1d);
    return ((s ^ (s>>>16)) >>> 0) / 0x100000000;
  };
}

function isValidPos(shape, r, c, blocks) {
  if (blocks && blocks.some(([br,bc]) => br===r && bc===c)) return false;
  const corner = (r===0||r===N-1) && (c===0||c===N-1);
  const border  = r===0 || r===N-1 || c===0 || c===N-1;
  if (shape==='circle')   return true;
  if (shape==='square')   return corner;
  if (shape==='triangle') return border && !corner;
  if (shape==='x')        return r>=1 && r<=N-2 && c>=1 && c<=N-2;
  if (shape==='diamond')  return (r+c)%2 === 0;
  return false;
}

function nbrs(r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([a,b]) => a>=0&&a<N&&b>=0&&b<N);
}

function isValid(piece, r, c, g) {
  if (!isValidPos(piece.shape, r, c)) return false;
  if (piece.color==='white' || piece.color==='yellow') return true;
  const ns = nbrs(r, c);
  if (ns.some(([a,b]) => g[a][b]?.color==='yellow')) return true;
  if (piece.color==='red')   return !ns.some(([a,b]) => g[a][b] != null);
  if (piece.color==='blue')  { for(let i=0;i<N;i++) if(i!==c&&g[r][i]?.color==='green') return false; return true; }
  if (piece.color==='green') { for(let i=0;i<N;i++) if(i!==r&&g[i][c]?.color==='blue')  return false; return true; }
  return true;
}

function allValid(g) {
  for (let r=0; r<N; r++) for (let c=0; c<N; c++) {
    const p = g[r][c]; if (p && !isValid(p,r,c,g)) return false;
  }
  return true;
}

// ── Precomputación de posiciones válidas por forma ──────────
function precomputeValidPos(blocks) {
  const v = {};
  for (const shape of SHAPES) {
    v[shape] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (isValidPos(shape, r, c, blocks))
          v[shape].push(r * N + c);
  }
  return v;
}

// ── Verificación incremental: tras colocar pieza en (r,c), ¿siguen
//    válidas TODAS las piezas colocadas hasta ahora? ──────────
function checkPlacedValid(g) {
  for (let rr = 0; rr < N; rr++)
    for (let cc = 0; cc < N; cc++)
      if (g[rr][cc] && !isValid(g[rr][cc], rr, cc, g))
        return false;
  return true;
}

// ── Forward checking: ¿cada pieza restante tiene al menos una
//    celda libre entre sus posiciones válidas? ────────────────
function hasOpenCells(validByShape, g, fromIdx, order, pieces) {
  for (let i = fromIdx; i < order.length; i++) {
    const cells = validByShape[pieces[order[i]].shape];
    let open = false;
    for (let k = 0; k < cells.length; k++) {
      const pos = cells[k];
      if (!g[(pos / N) | 0][pos % N]) { open = true; break; }
    }
    if (!open) return false;
  }
  return true;
}

// ── Contar soluciones (con pruning agresivo) ─────────────────
function countSolutions(pieces, blocks, cap) {
  const order = [...Array(pieces.length).keys()].sort((a,b) => SPRIO[pieces[a].shape] - SPRIO[pieces[b].shape]);
  const vp = precomputeValidPos(blocks);
  const g  = Array.from({length:N}, () => Array(N).fill(null));
  let found = 0;

  function search(idx) {
    if (found >= cap) return;
    if (idx === order.length) { found++; return; }

    const p = pieces[order[idx]];
    const positions = vp[p.shape];

    for (let i = 0; i < positions.length && found < cap; i++) {
      const pos = positions[i];
      const r = (pos / N) | 0, c = pos % N;
      if (g[r][c]) continue;                         // celda ocupada

      g[r][c] = p;

      if (checkPlacedValid(g) && hasOpenCells(vp, g, idx + 1, order, pieces))
        search(idx + 1);

      g[r][c] = null;
    }
  }

  search(0);
  return found;
}

// ── Construir un placement válido (con pruning) ──────────────
function buildValidPlacement(pieces, blocks, rng) {
  const order = [...Array(pieces.length).keys()].sort((a,b) => SPRIO[pieces[a].shape] - SPRIO[pieces[b].shape]);
  const vp = precomputeValidPos(blocks);

  function search(idx, g) {
    if (idx === order.length) return allValid(g) ? g : null;

    const p = pieces[order[idx]];
    const positions = [...vp[p.shape]];             // copia para shuffle

    // Fisher-Yates shuffle con rng
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (const pos of positions) {
      const r = (pos / N) | 0, c = pos % N;
      if (g[r][c]) continue;

      g[r][c] = p;

      if (checkPlacedValid(g) && hasOpenCells(vp, g, idx + 1, order, pieces)) {
        const res = search(idx + 1, g);
        if (res) return res;
      }

      g[r][c] = null;
    }
    return null;
  }

  return search(0, Array.from({length:N}, () => Array(N).fill(null)));
}

// ── Generador de puzzles ─────────────────────────────────────
function genPuzzle(seed) {
  const rng = mkRng(seed);

  for (let attempt = 0; attempt < 300; attempt++) {
    const nPieces = 7 + (attempt % 2); // 7-8 piezas

    // Mezclar pool de 25 combinaciones
    const pool = [];
    for (const s of SHAPES) for (const c of COLORS) pool.push({shape:s, color:c});
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const pieces = [];
    for (let i = 0; i < nPieces; i++) pieces.push({...pool[i], id: i});
    const blocks = [];

    // 1. Buscar al menos un placement válido
    const solGrid = buildValidPlacement(pieces, blocks, rng);
    if (!solGrid) continue;

    // 2. ¿Es solución única?
    let sols = countSolutions(pieces, blocks, 2);

    if (sols === 1)
      return { pieces, blocks, nPieces: pieces.length, nBlocks: blocks.length };

    if (sols === 0) continue; // no debería ocurrir, pero por seguridad

    // 3. Añadir bloques para forzar unicidad
    for (let round = 0; round < 12 && sols >= 2; round++) {
      // Recoger celdas vacías (no ocupadas por piezas ni ya bloqueadas)
      const emptyCells = [];
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
          if (!solGrid[r][c] && !blocks.some(([br,bc]) => br===r && bc===c))
            emptyCells.push([r, c]);

      if (emptyCells.length === 0) break;

      // Mezclar para probar en orden aleatorio
      for (let i = emptyCells.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
      }

      let added = false;
      for (const [br, bc] of emptyCells) {
        blocks.push([br, bc]);
        const ns = countSolutions(pieces, blocks, 2);

        if (ns === 0) {
          blocks.pop();         // este bloque mata toda solución, descartar
        } else {
          sols = ns;
          added = true;
          if (sols === 1) break; // ¡única!
        }
      }

      if (!added) break;       // ningún bloque fue útil, siguiente intento
    }

    if (sols === 1)
      return { pieces, blocks, nPieces: pieces.length, nBlocks: blocks.length };
  }

  // Fallback: puzzle trivial
  return { pieces: [{id:0,shape:'square',color:'white'},{id:1,shape:'x',color:'red'}], blocks: [], nPieces:2, nBlocks:0 };
}
