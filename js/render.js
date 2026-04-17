// ── Renderizado ───────────────────────────────────────────────
// Depende de: config.js, logic.js, state.js

function shapeSVG(shape, color, size) {
  const f=C_HEX[color], sw=Math.max(1.5,size*.055), hw=size/2;
  const pt=(x,y)=>`${x.toFixed(1)},${y.toFixed(1)}`;
  let body='';
  if(shape==='circle')
    body=`<circle cx="${hw}" cy="${hw}" r="${(hw*.78).toFixed(1)}" fill="${f}" stroke="#2A2A2A" stroke-width="${sw.toFixed(1)}"/>`;
  else if(shape==='square')
    body=`<rect x="${(size*.1).toFixed(1)}" y="${(size*.1).toFixed(1)}" width="${(size*.8).toFixed(1)}" height="${(size*.8).toFixed(1)}" fill="${f}" stroke="#2A2A2A" stroke-width="${sw.toFixed(1)}" rx="2"/>`;
  else if(shape==='triangle')
    body=`<polygon points="${pt(hw,size*.1)} ${pt(size*.9,size*.9)} ${pt(size*.1,size*.9)}" fill="${f}" stroke="#2A2A2A" stroke-width="${sw.toFixed(1)}"/>`;
  else if(shape==='x'){
    const w1=(size*.28).toFixed(1), w2=(size*.19).toFixed(1);
    body=`<line x1="${(size*.14).toFixed(1)}" y1="${(size*.14).toFixed(1)}" x2="${(size*.86).toFixed(1)}" y2="${(size*.86).toFixed(1)}" stroke="#2A2A2A" stroke-width="${w1}" stroke-linecap="round"/>
          <line x1="${(size*.86).toFixed(1)}" y1="${(size*.14).toFixed(1)}" x2="${(size*.14).toFixed(1)}" y2="${(size*.86).toFixed(1)}" stroke="#2A2A2A" stroke-width="${w1}" stroke-linecap="round"/>
          <line x1="${(size*.14).toFixed(1)}" y1="${(size*.14).toFixed(1)}" x2="${(size*.86).toFixed(1)}" y2="${(size*.86).toFixed(1)}" stroke="${f}" stroke-width="${w2}" stroke-linecap="round"/>
          <line x1="${(size*.86).toFixed(1)}" y1="${(size*.14).toFixed(1)}" x2="${(size*.14).toFixed(1)}" y2="${(size*.86).toFixed(1)}" stroke="${f}" stroke-width="${w2}" stroke-linecap="round"/>`;
  } else if(shape==='diamond')
    body=`<polygon points="${pt(hw,size*.1)} ${pt(size*.9,hw)} ${pt(hw,size*.9)} ${pt(size*.1,hw)}" fill="${f}" stroke="#2A2A2A" stroke-width="${sw.toFixed(1)}"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;pointer-events:none"><g filter="url(#f-lapiz)">${body}</g></svg>`;
}

function renderGrid() {
  const el = document.getElementById('grid');
  el.innerHTML = '';
  for (let r=0; r<N; r++) for (let c=0; c<N; c++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.r = r;
    cell.dataset.c = c;
    const isBlocked = puzzle.blocks.some(b=>b[0]===r && b[1]===c);
    if ((r+c)%2 === 0 && !isBlocked) cell.classList.add('chess-dark');
    if (isBlocked) {
      cell.classList.add('blocked');
      el.appendChild(cell);
      continue;
    }
    const p = grid[r][c];
    if (p) {
      const v = isValid(p, r, c, grid);
      cell.classList.add(v ? 'valid-state' : 'invalid-state');
      const wrap = document.createElement('div');
      wrap.className = 'piece-wrap';
      if (dragging?.piece.id === p.id) wrap.classList.add('dragging');
      wrap.innerHTML = shapeSVG(p.shape, p.color, 48);
      attachDrag(wrap, p, 'grid', r, c);
      const ind = document.createElement('span');
      ind.className = 'cell-indicator';
      ind.style.color = v ? '#52B052' : '#E05252';
      ind.textContent = v ? '✓' : '✗';
      cell.appendChild(wrap);
      cell.appendChild(ind);
    }
    el.appendChild(cell);
  }
}

function renderAnden() {
  const el = document.getElementById('anden');
  el.innerHTML = '';
  el.style.setProperty('--anden-cols', Math.max(anden.length, 1));
  if (anden.length === 0) {
    el.style.setProperty('--anden-cols', '1');
    el.innerHTML = '<span class="anden-empty">¡Listo!</span>';
    return;
  }
  anden.forEach(id => {
    const p = pieceById[id];
    const div = document.createElement('div');
    div.className = 'anden-tile';
    if (dragging?.piece.id === id) div.classList.add('dragging');
    div.innerHTML = shapeSVG(p.shape, p.color, 36);
    attachDrag(div, p, 'anden', null, null);
    el.appendChild(div);
  });
}

function renderProgress() {
  let validCount = 0, placed = 0;
  for(let r=0; r<N; r++) for(let c=0; c<N; c++) {
    if(grid[r][c]) { placed++; if(isValid(grid[r][c],r,c,grid)) validCount++; }
  }
  const total = puzzle.pieces.length;
  const fill  = document.getElementById('progress-fill');
  fill.style.width = (validCount / total * 100) + '%';
  document.getElementById('progress-label').textContent = `${validCount}/${total} válidas`;

  if (validCount === total && placed === total && !won) {
    won = true;
    const g = document.getElementById('game');
    g.classList.add('victory-sweep');
    spawnConfetti();
    setTimeout(() => { showVictory(); g.classList.remove('victory-sweep'); }, 2000);
  }
  document.getElementById('btn-share').classList.toggle('hidden', !won);
}

function renderAll() {
  renderGrid();
  renderAnden();
  renderProgress();
}
