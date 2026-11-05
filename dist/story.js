/* Scroll storytelling for the home page: kinetic headings, word-by-word quote, daylight clock + sun. */
(() => {
  if (!document.body.classList.contains('home-page')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* split a heading into words (keeps <br>) */
  function words(el, cls, wrap) {
    if (el.dataset.split) return [];
    el.dataset.split = '1';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const out = []; let i = 0;
    [...el.childNodes].forEach(node => {
      if (node.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span');
        w.setAttribute('aria-hidden', 'true');
        w.className = cls;
        if (wrap) { const inner = document.createElement('span'); inner.textContent = part; w.appendChild(inner); w.style.setProperty('--i', i++); }
        else w.textContent = part;
        frag.appendChild(w); out.push(w);
      });
      node.replaceWith(frag);
    });
    return out;
  }

  /* 1. headings: masked word reveal when they enter */
  const heads = [...document.querySelectorAll('body.home-page .home-section h2,.home-social h2,.project-interlude h2')];
  heads.forEach(h => words(h, 'sw', true));
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sw-on'); io.unobserve(e.target); } }), { threshold: .25 });
    heads.forEach(h => io.observe(h));
  } else heads.forEach(h => h.classList.add('sw-on'));

  /* 2. quote: words light up with scroll */
  const quote = document.querySelector('.quote-interlude h2');
  const qwords = quote ? words(quote, 'qw', false) : [];

  /* 3. daylight: clock + sun colour/position follow the whole page */
  const stops = [  // [progress, time (h), sun colour]
    [0, 7.2, '#ffe8c4'], [.18, 9.5, '#fff3dc'], [.45, 12.8, '#fffaf0'], [.7, 17.5, '#ffc27a'], [.88, 20.2, '#ff8a3d'], [1, 21.6, '#7a6bd8']
  ];
  const sun = document.querySelector('.sun-glow');
  const root = document.documentElement;
  const clock = document.querySelector('.daylight-time');
  function mix(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = k => Math.round(((pa >> k) & 255) * (1 - t) + ((pb >> k) & 255) * t); return `rgb(${c(16)},${c(8)},${c(0)})`; }
  let raf = 0;
  function frame() {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max) : 0;
    let i = 0; while (i < stops.length - 2 && p > stops[i + 1][0]) i++;
    const a = stops[i], b = stops[i + 1], t = clamp((p - a[0]) / (b[0] - a[0]));
    const h = a[1] + (b[1] - a[1]) * t;
    if (clock) clock.textContent = `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
    root.style.setProperty('--day', p.toFixed(4));
    if (sun && !reduced) {
      sun.style.setProperty('--sun', mix(a[2], b[2], t));
      sun.style.setProperty('--sx', `${(12 + 76 * p).toFixed(1)}%`);
      sun.style.setProperty('--sy', `${(78 - 62 * Math.sin(Math.PI * p)).toFixed(1)}%`);
    }
    if (qwords.length) {
      const r = quote.getBoundingClientRect();
      const q = clamp((innerHeight * .82 - r.top) / (innerHeight * .55 + r.height * .2));
      qwords.forEach((w, k) => { w.style.opacity = reduced ? 1 : (0.16 + 0.84 * clamp(q * qwords.length - k)).toFixed(2); });
    }
  }
  const sched = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', sched, { passive: true }); addEventListener('resize', sched, { passive: true });
  frame();
})();
