// ── Drag & Drop con Pointer Events ───────────────────────────
// Una sola API para ratón y touch. Sin conflictos, sin doble tap.
// Depende de: config.js, logic.js, state.js, render.js

let dragging = null;
const ghostEl = document.getElementById('ghost');

// En touch el ghost sube sobre el dedo para que se vea el destino
const TOUCH_LIFT = 55;

// ── API pública: render.js llama esto en cada pieza ───────────
function attachDrag(el, piece, from, fr, fc) {
  el.addEventListener('pointerdown', e => {
    if (e.button > 0) return; // solo botón principal del ratón
    e.preventDefault();
    _startDrag(piece, from, fr, fc, e.clientX, e.clientY, e.pointerType !== 'mouse');
  });
}

// ── Inicio ────────────────────────────────────────────────────
function _startDrag(piece, from, fr, fc, x, y, isTouch) {
  dragging = { piece, from, fr, fc, isTouch };
  ghostEl.innerHTML = shapeSVG(piece.shape, piece.color, 64);
  _moveGhost(x, y);
  ghostEl.style.display = 'block';
  renderAll();
  // Marcar celdas donde es válida la forma
  document.querySelectorAll('.cell[data-r]').forEach(cell => {
    const r = +cell.dataset.r, c = +cell.dataset.c;
    if (!puzzle.blocks.some(b => b[0]===r && b[1]===c) && isValidPos(piece.shape, r, c))
      cell.classList.add('valid-target');
  });
}

// ── Movimiento ────────────────────────────────────────────────
document.addEventListener('pointermove', e => {
  if (!dragging) return;
  e.preventDefault();
  _moveGhost(e.clientX, e.clientY);
  // Actualizar celda resaltada
  document.querySelectorAll('.cell.valid-hover').forEach(el => el.classList.remove('valid-hover'));
  const cell = _cellAt(e.clientX, e.clientY);
  if (cell?.classList.contains('valid-target')) cell.classList.add('valid-hover');
}, { passive: false });

// ── Soltar ────────────────────────────────────────────────────
document.addEventListener('pointerup', e => {
  if (!dragging) return;
  _drop(e.clientX, e.clientY);
});

// ── Cancelar (llamada del sistema, ej. notificación) ──────────
document.addEventListener('pointercancel', () => {
  if (!dragging) return;
  _cancel();
});

// ── Helpers internos ──────────────────────────────────────────
function _moveGhost(x, y) {
  ghostEl.style.left = x + 'px';
  ghostEl.style.top  = (dragging.isTouch ? y - TOUCH_LIFT : y) + 'px';
}

// Oculta el ghost momentáneamente para que elementFromPoint lo ignore
function _cellAt(x, y) {
  ghostEl.style.visibility = 'hidden';
  const el = document.elementFromPoint(x, y);
  ghostEl.style.visibility = 'visible';
  return el?.closest?.('.cell[data-r]');
}

function _drop(x, y) {
  ghostEl.style.display = 'none';
  document.querySelectorAll('.cell.valid-hover').forEach(el => el.classList.remove('valid-hover'));

  ghostEl.style.visibility = 'hidden';
  const under   = document.elementFromPoint(x, y);
  ghostEl.style.visibility = 'visible';
  const cellEl  = under?.closest?.('.cell[data-r]');
  const andenEl = under?.closest?.('#anden');

  if (cellEl?.classList.contains('valid-target')) {
    // Soltar sobre celda válida
    const r = +cellEl.dataset.r, col = +cellEl.dataset.c;
    saveState();
    const existing = grid[r][col];
    if (dragging.from === 'grid') {
      grid[dragging.fr][dragging.fc] = existing; // intercambio
    } else {
      anden = anden.filter(id => id !== dragging.piece.id);
      if (existing) anden.push(existing.id);
    }
    grid[r][col] = dragging.piece;

  } else if (andenEl && dragging.from === 'grid') {
    // Devolver al andén desde el tablero
    saveState();
    grid[dragging.fr][dragging.fc] = null;
    if (!anden.includes(dragging.piece.id)) anden.push(dragging.piece.id);
  }
  // Si se suelta en vacío → la pieza vuelve sola (no se hace nada)

  document.querySelectorAll('.cell.valid-target').forEach(el => el.classList.remove('valid-target'));
  dragging = null;
  renderAll(); updateUndoButtons(); saveGame();
}

function _cancel() {
  ghostEl.style.display = 'none';
  document.querySelectorAll('.cell.valid-target, .cell.valid-hover')
    .forEach(el => el.classList.remove('valid-target', 'valid-hover'));
  dragging = null;
  renderAll();
}
