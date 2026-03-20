// ── Interfaz de usuario ───────────────────────────────────────
// Depende de: state.js, render.js

// ── Confeti ───────────────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#E05252','#4D6FD1','#4EA84E','#D4AE2C','#FFF'];
  for(let i=0; i<60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (Math.random() * 2 + 2) + 's';
    c.style.opacity = Math.random();
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}

// ── Panel de reglas ───────────────────────────────────────────
function toggleRules() {
  const p   = document.getElementById('rules-panel');
  const btn = document.getElementById('btn-toggle');
  p.classList.toggle('visible');
  btn.classList.toggle('open');
  document.getElementById('toggle-icon').textContent = p.classList.contains('visible') ? '✕' : 'ℹ️';
}

// ── Pantalla de victoria ──────────────────────────────────────
function showVictory() {
  stopTimer();
  const num   = Math.floor(Date.now() / 86400000);
  const fecha = new Date().toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});
  document.getElementById('v-num').textContent   = 'FORMAS #' + num;
  document.getElementById('v-date').textContent  = fecha;
  document.getElementById('v-time').textContent  = formatTime(elapsedSeconds);
  document.getElementById('v-moves').textContent = moveCount;
  document.getElementById('victory').classList.remove('hidden');
}

function hideVictory() {
  document.getElementById('victory').classList.add('hidden');
}

// ── Compartir ─────────────────────────────────────────────────
function share() {
  const num   = Math.floor(Date.now() / 86400000);
  const fecha = new Date().toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});
  const text  = '🔷 FORMAS #' + num + ' · ' + fecha + '\n'
              + '⏱ ' + formatTime(elapsedSeconds) + '  ·  🔢 ' + moveCount + ' movimientos\n'
              + '● ■ ▲ ✕ ◆\n'
              + '▸ is.gd/Shapes';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}
