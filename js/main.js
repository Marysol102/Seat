// ── Punto de entrada ──────────────────────────────────────────

function initPuzzle(seed, mode) {
  stopTimer();
  puzzle        = genPuzzle(seed);
  pieceById     = Object.fromEntries(puzzle.pieces.map(p => [p.id, p]));
  history       = [];
  redoStack     = [];
  moveCount     = 0;
  elapsedSeconds = 0;
  won            = false;

  const saved = (mode === 'daily') ? loadGame() : null;
  if (saved) {
    grid           = saved.grid;
    anden          = saved.anden;
    moveCount      = saved.moveCount;
    elapsedSeconds = saved.elapsedSeconds;
    won            = saved.won;
    if (!won) startTimer();
  } else {
    grid  = Array.from({length:N}, () => Array(N).fill(null));
    anden = puzzle.pieces.map(p => p.id);
  }

  const tdisp = document.getElementById('timer-display');
  if (tdisp) tdisp.textContent = formatTime(elapsedSeconds);
  const mdisp = document.getElementById('moves-display');
  if (mdisp) mdisp.textContent = '· ' + moveCount + ' mov';

  updateSubtitle();
  updateNavButtons();
  updateUndoButtons();
  renderAll();
}

function updateSubtitle() {
  const d     = dateForOffset(dateOffset);
  const fecha = d.toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});
  const num   = Math.floor(d.getTime() / 86400000);

  let prefix = '';
  if (gameMode === 'reto')         prefix = '🎯 RETO · ';
  else if (dateOffset < 0)         prefix = '📅 ';

  document.getElementById('subtitle').textContent = prefix + '#' + num + ' · ' + fecha;

  // Modo badge
  const badge = document.getElementById('mode-badge');
  if (badge) {
    if (gameMode === 'reto') {
      badge.textContent = 'RETO';
      badge.className   = 'mode-badge reto';
      badge.style.display = '';
    } else if (dateOffset < 0) {
      badge.textContent = 'HISTÓRICO';
      badge.className   = 'mode-badge history';
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }
}

function updateNavButtons() {
  const prev = document.getElementById('btn-prev-day');
  const next = document.getElementById('btn-next-day');
  if (!prev || !next) return;
  // Solo historial disponible en modo daily/history, no en reto
  const inNav = (gameMode !== 'reto');
  prev.style.display = inNav ? '' : 'none';
  next.style.display = inNav ? '' : 'none';
  prev.disabled = (dateOffset <= -7);   // máx 7 días atrás
  next.disabled = (dateOffset >= 0);    // no ir al futuro
}

// ── Navegación de días ────────────────────────────────────────
function goDay(delta) {
  const newOffset = dateOffset + delta;
  if (newOffset > 0 || newOffset < -7) return;
  dateOffset = newOffset;
  gameMode   = dateOffset === 0 ? 'daily' : 'history';
  gameSeed   = seedForOffset(dateOffset);
  // Limpiar param reto de la URL si había
  history_url_clear();
  initPuzzle(gameSeed, gameMode);
}

function history_url_clear() {
  const url = new URL(window.location.href);
  url.searchParams.delete('reto');
  window.history.replaceState({}, '', url);
}

// ── Modo Reto ─────────────────────────────────────────────────
function startChallenge() {
  const seed    = Math.floor(Math.random() * 9999999) + 1000000;
  gameMode      = 'reto';
  gameSeed      = seed;
  dateOffset    = 0;

  // Actualizar URL
  const url = new URL(window.location.href);
  url.searchParams.set('reto', seed);
  window.history.replaceState({}, '', url);

  initPuzzle(seed, 'reto');

  // Copiar link al portapapeles y mostrar toast
  navigator.clipboard.writeText(url.toString()).then(() => {
    const btn = document.getElementById('btn-challenge');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Link copiado';
      setTimeout(() => { btn.innerHTML = orig; }, 2500);
    }
    // Toast
    const toast = document.getElementById('challenge-toast');
    if (toast) {
      toast.classList.remove('hidden', 'hiding');
      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.classList.add('hidden'), 300);
      }, 1000);
    }
  });
}

// ── Arranque ──────────────────────────────────────────────────
window.onload = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has('reto')) {
    gameMode = 'reto';
    gameSeed = parseInt(params.get('reto')) || seedForOffset(0);
    dateOffset = 0;
  } else {
    gameMode   = 'daily';
    gameSeed   = seedForOffset(0);
    dateOffset = 0;
  }

  // Iconos del panel de reglas
  SHAPES.forEach(s => {
    const el = document.getElementById('ri-' + s);
    if (el) el.innerHTML = shapeSVG(s, 'white', 18);
  });

  initPuzzle(gameSeed, gameMode);
};
