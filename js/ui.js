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
  const d     = dateForOffset(dateOffset);
  const num   = Math.floor(d.getTime() / 86400000);
  const fecha = d.toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});

  document.getElementById('v-num').textContent   = (gameMode === 'reto' ? '🎯 RETO' : 'FORMAS #' + num);
  document.getElementById('v-date').textContent  = fecha;
  document.getElementById('v-time').textContent  = formatTime(elapsedSeconds);
  document.getElementById('v-moves').textContent = moveCount;

  // Countdown solo en modo daily
  const cdWrap = document.getElementById('v-countdown-wrap');
  if (cdWrap) {
    if (gameMode === 'daily') {
      cdWrap.style.display = '';
      startCountdown();
    } else {
      cdWrap.style.display = 'none';
    }
  }

  document.getElementById('victory').classList.remove('hidden');
}

function hideVictory() {
  stopCountdown();
  document.getElementById('victory').classList.add('hidden');
}

// ── Countdown al siguiente puzzle ────────────────────────────
let cdInterval = null;
function startCountdown() {
  const update = () => {
    const now  = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((next - now) / 1000));
    const h    = Math.floor(diff / 3600);
    const m    = Math.floor((diff % 3600) / 60);
    const s    = diff % 60;
    const el   = document.getElementById('v-countdown');
    if (el) el.textContent = h + 'h ' + String(m).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's';
  };
  update();
  cdInterval = setInterval(update, 1000);
}
function stopCountdown() { clearInterval(cdInterval); cdInterval = null; }

// ── Compartir ─────────────────────────────────────────────────
function share() {
  const d     = dateForOffset(dateOffset);
  const num   = Math.floor(d.getTime() / 86400000);
  const fecha = d.toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});

  let header, link;
  if (gameMode === 'reto') {
    const url = new URL(window.location.href);
    url.searchParams.set('reto', gameSeed);
    header = '🎯 FORMAS RETO #' + gameSeed;
    link   = url.toString();
  } else {
    header = '🔷 FORMAS #' + num + ' · ' + fecha;
    link   = 'https://is.gd/Shapes';
  }

  const text = header + '\n'
             + '⏱ ' + formatTime(elapsedSeconds) + '  ·  🔢 ' + moveCount + ' movimientos\n'
             + '● ■ ▲ ✕ ◆\n'
             + '▸ ' + link;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
}
