// ── Tutorial ──────────────────────────────────────────────────
// Depende de: render.js (shapeSVG)

(function () {
  let curr = 0;
  const tot = 4;

  window.goSlide = (n) => {
    document.getElementById('t-slide-' + curr).classList.add('hidden');
    curr = n;
    document.getElementById('t-slide-' + curr).classList.remove('hidden');
    document.querySelectorAll('.t-dot-nav').forEach((d, i) => d.classList.toggle('active', i === curr));
    document.getElementById('t-btn-next').textContent = curr === tot - 1 ? '¡Jugar!' : 'Siguiente';
  };

  window.nextSlide = () => {
    if (curr < tot - 1) goSlide(curr + 1); else closeTutorial();
  };

  window.closeTutorial = () => {
    document.getElementById('tutorial-bg').classList.add('hidden');
    localStorage.setItem('formas_tutorial', 'true');
  };

  window.addEventListener('load', () => {
    ['circle','square','triangle','x','diamond'].forEach(s => {
      const el = document.getElementById('ti-' + s);
      if (el) el.innerHTML = shapeSVG(s, 'white', 24);
    });
    if (!localStorage.getItem('formas_tutorial'))
      document.getElementById('tutorial-bg').classList.remove('hidden');
  });
})();
