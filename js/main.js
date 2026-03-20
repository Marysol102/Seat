// ── Punto de entrada ──────────────────────────────────────────
// Se ejecuta cuando el DOM está listo.
// Depende de todos los módulos anteriores.

window.onload = () => {
  const seed = new Date().getFullYear()*10000 + (new Date().getMonth()+1)*100 + new Date().getDate();
  puzzle    = genPuzzle(seed);
  pieceById = Object.fromEntries(puzzle.pieces.map(p => [p.id, p]));

  const saved = loadGame();
  if (saved) {
    grid           = saved.grid;
    anden          = saved.anden;
    moveCount      = saved.moveCount;
    elapsedSeconds = saved.elapsedSeconds;
    won            = saved.won;
    if (!won) startTimer();
  } else {
    grid           = Array.from({length:N}, () => Array(N).fill(null));
    anden          = puzzle.pieces.map(p => p.id);
    won            = false;
    moveCount      = 0;
    elapsedSeconds = 0;
  }

  const tdisp = document.getElementById('timer-display');
  if (tdisp) tdisp.textContent = formatTime(elapsedSeconds);
  const mdisp = document.getElementById('moves-display');
  if (mdisp) mdisp.textContent = '· ' + moveCount + ' mov';

  const num = Math.floor(Date.now() / 86400000);
  document.getElementById('subtitle').textContent = `#${num} · ${new Date().toLocaleDateString()}`;

  // Iconos del panel de reglas
  SHAPES.forEach(s => {
    const el = document.getElementById('ri-' + s);
    if (el) el.innerHTML = shapeSVG(s, 'white', 18);
  });

  updateUndoButtons();
  renderAll();
};
