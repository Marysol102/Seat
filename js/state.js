// ── Estado global y gestión de partida ───────────────────────
// Depende de: config.js, logic.js

let grid, anden, won, pieceById, puzzle;
let history    = [];
let redoStack  = [];
let moveCount  = 0;
let elapsedSeconds = 0;
let timerStart = null;
let timerInterval = null;

// ── Modo de juego ─────────────────────────────────────────────
// 'daily'   → puzzle del día, con guardado
// 'history' → puzzle de otro día, sin guardado
// 'reto'    → seed aleatoria compartida, sin guardado
let gameMode = 'daily';
let gameSeed = null;      // seed activa
let dateOffset = 0;       // 0 = hoy, -1 = ayer, etc.

function seedForOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
}

function dateForOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

// ── Persistencia (solo daily) ─────────────────────────────────
function saveGame() {
  if (gameMode !== 'daily') return;
  const data = { grid, anden, moveCount, elapsedSeconds, won, date: new Date().toDateString() };
  localStorage.setItem('formas_save', JSON.stringify(data));
}

function loadGame() {
  if (gameMode !== 'daily') return null;
  const saved = localStorage.getItem('formas_save');
  if (!saved) return null;
  const data = JSON.parse(saved);
  if (data.date !== new Date().toDateString()) return null;
  return data;
}

// ── Timer ─────────────────────────────────────────────────────
function formatTime(s) {
  const m = Math.floor(s/60), ss = s%60;
  return m + ':' + String(ss).padStart(2,'0');
}

function startTimer() {
  if (timerInterval) return;
  timerStart = Date.now() - elapsedSeconds * 1000;
  timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    const el = document.getElementById('timer-display');
    if (el) el.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── Historial de movimientos ──────────────────────────────────
function saveState() {
  moveCount++;
  const md = document.getElementById('moves-display');
  if (md) md.textContent = '· ' + moveCount + ' mov';
  startTimer();
  history.push({ grid: JSON.parse(JSON.stringify(grid)), anden: [...anden], won });
  if (history.length > 50) history.shift();
  redoStack = [];
  updateUndoButtons();
  saveGame();
}

function undo() {
  if (history.length === 0) return;
  moveCount++; startTimer();
  redoStack.push({ grid: JSON.parse(JSON.stringify(grid)), anden: [...anden], won });
  const prev = history.pop();
  grid = prev.grid; anden = prev.anden; won = prev.won;
  renderAll(); updateUndoButtons(); saveGame();
}

function redo() {
  if (redoStack.length === 0) return;
  moveCount++; startTimer();
  history.push({ grid: JSON.parse(JSON.stringify(grid)), anden: [...anden], won });
  const next = redoStack.pop();
  grid = next.grid; anden = next.anden; won = next.won;
  renderAll(); updateUndoButtons(); saveGame();
}

function resetGame() {
  if (anden.length === puzzle.pieces.length) return;
  saveState();
  grid  = Array.from({length:N}, () => Array(N).fill(null));
  anden = puzzle.pieces.map(p => p.id);
  won   = false;
  renderAll(); updateUndoButtons(); saveGame();
}

function updateUndoButtons() {
  document.getElementById('btn-undo').disabled = history.length === 0;
  document.getElementById('btn-redo').disabled = redoStack.length === 0;
}
