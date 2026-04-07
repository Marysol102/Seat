// ── Lógica pura del puzzle ───────────────────────────────────
// Depende de: config.js

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

function countSolutions(pieces, blocks, cap) {
  const order = [...Array(pieces.length).keys()].sort((a,b) => SPRIO[pieces[a].shape] - SPRIO[pieces[b].shape]);
  let found = 0;
  const g = Array.from({length:N}, () => Array(N).fill(null));
  function search(idx) {
    if (found >= cap) return;
    if (idx === order.length) { if (allValid(g)) found++; return; }
    const p = pieces[order[idx]];
    for (let r=0; r<N && found<cap; r++)
      for (let c=0; c<N && found<cap; c++) {
        if (g[r][c] || !isValidPos(p.shape, r, c, blocks)) continue;
        g[r][c] = p; search(idx+1); g[r][c] = null;
      }
  }
  search(0);
  return found;
}

function buildValidPlacement(pieces, blocks, rng) {
  const order = [...Array(pieces.length).keys()].sort((a,b) => SPRIO[pieces[a].shape] - SPRIO[pieces[b].shape]);
  function search(idx, g) {
    if (idx === order.length) return allValid(g) ? g : null;
    const p = pieces[order[idx]];
    const cells = [];
    for (let r=0; r<N; r++) for (let c=0; c<N; c++) if (!g[r][c] && isValidPos(p.shape, r, c, blocks)) cells.push([r,c]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    for (const [r,c] of cells) {
      g[r][c] = p; const res = search(idx+1, g);
      if (res) return res; g[r][c] = null;
    }
    return null;
  }
  return search(0, Array.from({length:N}, () => Array(N).fill(null)));
}

function genPuzzle(seed) {
  const rng = mkRng(seed);
  for (let attempt = 0; attempt < 100; attempt++) {
    const nPieces = 9 + (attempt % 2);
    const pieces = [];
    const pool = [];
    for (const s of SHAPES) for (const c of COLORS) pool.push({shape:s, color:c});
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for(let i=0; i<nPieces; i++) pieces.push({...pool[i], id: i});
    const blocks = [];
    const solGrid = buildValidPlacement(pieces, blocks, rng);
    if (!solGrid) continue;
    let sols = countSolutions(pieces, blocks, 2);
    let pressure = 0;
    while(sols > 1 && pressure < 10) {
      let added = false;
      const emptyCells = [];
      for(let r=0; r<N; r++) for(let c=0; c<N; c++) if(!solGrid[r][c] && !blocks.some(b=>b[0]===r && b[1]===c)) emptyCells.push([r,c]);
      if(emptyCells.length > 0) {
        const b = emptyCells[Math.floor(rng()*emptyCells.length)];
        blocks.push(b);
        sols = countSolutions(pieces, blocks, 2);
        if(sols === 0) { blocks.pop(); sols = 2; }
        else added = true;
      }
      pressure++;
      if(!added) break;
    }
    if (sols === 1) return { pieces, blocks, nPieces: pieces.length, nBlocks: blocks.length };
  }
  return { pieces: [{id:0,shape:'square',color:'white'},{id:1,shape:'x',color:'red'}], blocks: [], nPieces:2, nBlocks:0 };
}
