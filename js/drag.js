// ── Drag & Drop (ratón + touch) ───────────────────────────────
// Depende de: config.js, logic.js, state.js, render.js

let dragging = null;
const ghostEl = document.getElementById('ghost');

// ── Lógica compartida ─────────────────────────────────────────
function startDragging(piece, from, fr, fc, x, y) {
  dragging = {piece, from, fr, fc};
  ghostEl.innerHTML = shapeSVG(piece.shape, piece.color, 68);
  ghostEl.style.left    = x + 'px';
  ghostEl.style.top     = y + 'px';
  ghostEl.style.display = 'block';
  renderAll();
  document.querySelectorAll('.cell[data-r]').forEach(cell => {
    const r = +cell.dataset.r, col = +cell.dataset.c;
    if (!puzzle.blocks.some(b=>b[0]===r&&b[1]===col) && isValidPos(piece.shape, r, col))
      cell.classList.add('valid-target');
  });
}

function moveDragging(x, y) {
  ghostEl.style.left = x + 'px';
  ghostEl.style.top  = y + 'px';
  document.querySelectorAll('.cell.valid-hover').forEach(el => el.classList.remove('valid-hover'));
  ghostEl.style.display = 'none';
  const under = document.elementFromPoint(x, y);
  ghostEl.style.display = 'block';
  const cell = under?.closest?.('.cell[data-r]');
  if (cell && cell.classList.contains('valid-target')) cell.classList.add('valid-hover');
}

function endDragging(x, y) {
  ghostEl.style.display = 'none';
  document.querySelectorAll('.cell.valid-hover').forEach(el => el.classList.remove('valid-hover'));
  const under     = document.elementFromPoint(x, y);
  const cellEl    = under?.closest?.('.cell[data-r]');
  const andenZone = under?.closest?.('#anden');

  if (cellEl && cellEl.classList.contains('valid-target')) {
    const r = +cellEl.dataset.r, col = +cellEl.dataset.c;
    saveState();
    const existing = grid[r][col];
    if (dragging.from === 'grid') grid[dragging.fr][dragging.fc] = existing;
    else { anden = anden.filter(id => id !== dragging.piece.id); if (existing) anden.push(existing.id); }
    grid[r][col] = dragging.piece;
  } else if (andenZone && dragging.from === 'grid') {
    saveState();
    grid[dragging.fr][dragging.fc] = null;
    if (!anden.includes(dragging.piece.id)) anden.push(dragging.piece.id);
  }

  document.querySelectorAll('.cell.valid-target').forEach(el => el.classList.remove('valid-target'));
  dragging = null;
  renderAll(); updateUndoButtons(); saveGame();
}

// ── Manejadores de ratón ──────────────────────────────────────
function dragStart(e, piece, from, fr, fc) {
  if (e.type === 'mousedown') {
    e.preventDefault();
    startDragging(piece, from, fr, fc, e.clientX, e.clientY);
  }
}

function onMove(e) {
  if (!dragging || e.type !== 'mousemove') return;
  moveDragging(e.clientX, e.clientY);
}

function onUp(e) {
  if (!dragging || e.type !== 'mouseup') return;
  endDragging(e.clientX, e.clientY);
}

document.addEventListener('mousemove', onMove);
document.addEventListener('mouseup', onUp);

// ── Manejadores de touch ──────────────────────────────────────
document.addEventListener('touchmove', e => {
  if (!dragging) return;
  e.preventDefault();
  const t = e.touches[0];
  moveDragging(t.clientX, t.clientY);
}, {passive: false});

document.addEventListener('touchend', e => {
  if (!dragging) return;
  const t = e.changedTouches[0];
  endDragging(t.clientX, t.clientY);
});

document.addEventListener('touchcancel', e => {
  if (!dragging) return;
  ghostEl.style.display = 'none';
  document.querySelectorAll('.cell.valid-target,.cell.valid-hover')
    .forEach(el => el.classList.remove('valid-target','valid-hover'));
  dragging = null;
  renderAll();
});
