// ── Modo Dios ─────────────────────────────────────────────────
// Depende de: config.js, logic.js, state.js, render.js

(function () {

  // ── Konami code ─────────────────────────────────────────────
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kIdx = 0;
  document.addEventListener('keydown', e => {
    kIdx = (e.key === KONAMI[kIdx]) ? kIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; godToggle(); }
  });

  window.godToggle = () => document.getElementById('god-panel').classList.toggle('god-visible');

  // ── Regenerar con seed ───────────────────────────────────────
  window.godRegenerate = () => {
    const s = parseInt(document.getElementById('god-seed').value) ||
      new Date().getFullYear()*10000+(new Date().getMonth()+1)*100+new Date().getDate();
    puzzle = genPuzzle(s);
    pieceById = Object.fromEntries(puzzle.pieces.map(p => [p.id, p]));
    grid = Array.from({length:N}, () => Array(N).fill(null));
    anden = puzzle.pieces.map(p => p.id);
    won = false; history = []; redoStack = [];
    renderAll(); updateUndoButtons(); saveGame();
  };

  window.godRandomSeed = () => {
    document.getElementById('god-seed').value = Math.floor(Math.random() * 99999999);
    godRegenerate();
  };

  // ── Ver solución ─────────────────────────────────────────────
  window.godShowSolution = () => {
    const s = parseInt(document.getElementById('god-seed').value) ||
      new Date().getFullYear()*10000+(new Date().getMonth()+1)*100+new Date().getDate();
    const sol = buildValidPlacement(puzzle.pieces, puzzle.blocks, mkRng(s));
    if (!sol) return;
    document.querySelectorAll('.cell[data-r]').forEach(cell => {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      if (sol[r][c]) cell.style.outline = '3px solid #7eb8f7';
    });
    setTimeout(() => document.querySelectorAll('.cell[data-r]').forEach(c => c.style.outline = ''), 3000);
  };

  // ── Colocar solución ─────────────────────────────────────────
  window.godPlaceSolution = () => {
    const s = parseInt(document.getElementById('god-seed').value) ||
      new Date().getFullYear()*10000+(new Date().getMonth()+1)*100+new Date().getDate();
    const sol = buildValidPlacement(puzzle.pieces, puzzle.blocks, mkRng(s));
    if (!sol) return;
    saveState(); grid = sol; anden = [];
    renderAll(); updateUndoButtons(); saveGame();
  };

  // ── Vaciar tablero ───────────────────────────────────────────
  window.godClearBoard = () => {
    saveState();
    grid  = Array.from({length:N}, () => Array(N).fill(null));
    anden = puzzle.pieces.map(p => p.id);
    renderAll(); saveGame();
  };

  // ── Editar bloqueos ──────────────────────────────────────────
  let blockEditMode = false;

  window.godToggleBlockEdit = () => {
    blockEditMode = !blockEditMode;
    document.getElementById('god-block-label').textContent =
      blockEditMode ? 'Editar bloqueos OFF' : 'Editar bloqueos ON';

    document.querySelectorAll('.cell[data-r]').forEach(cell => {
      if (blockEditMode) {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', onBlockCellClick);
      } else {
        cell.style.cursor = '';
        cell.removeEventListener('click', onBlockCellClick);
      }
    });
  };

  function onBlockCellClick(e) {
    const cell = e.currentTarget;
    const r = +cell.dataset.r, c = +cell.dataset.c;
    const idx = puzzle.blocks.findIndex(b => b[0]===r && b[1]===c);
    if (idx !== -1) {
      puzzle.blocks.splice(idx, 1);
    } else {
      // Quitar pieza si hay una
      if (grid[r][c]) { anden.push(grid[r][c].id); grid[r][c] = null; }
      puzzle.blocks.push([r, c]);
    }
    renderAll(); saveGame();
  }

})();
