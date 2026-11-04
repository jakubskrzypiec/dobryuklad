// Wypukłe kafelki: przechylenie za kursorem i odblask w miejscu wskaźnika.
(() => {
  const sel = '.home-offer-card, .project-slide, .course-photo, .home-reviews-grid article, .studio-photo-placeholder';
  const cards = document.querySelectorAll(sel);
  cards.forEach((el) => el.classList.add('wypukly'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !matchMedia('(hover: hover)').matches) return;
  cards.forEach((el) => {
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.classList.add('is-tilt');
        el.style.setProperty('--rx', ((x - 0.5) * 2).toFixed(3));
        el.style.setProperty('--ry', ((0.5 - y) * 2).toFixed(3));
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.classList.remove('is-tilt');
      el.style.setProperty('--rx', 0);
      el.style.setProperty('--ry', 0);
    });
  });
})();
