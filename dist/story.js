/* Scroll storytelling for every page: kinetic headings (word-by-word reveal) and, on the home page,
   a quote whose words light up with scroll. */
(() => {
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

  /* 1. headings: masked word reveal when they enter the viewport */
  const heads = [...document.querySelectorAll(
    '.home-section h2,.home-social h2,.project-interlude h2,body.about-page main h2,body.about-page .about-hero h1,body.about-page .project-white-hero h1'
  )].filter(h => !h.closest('.hero-v3'));
  heads.forEach(h => words(h, 'sw', true));
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sw-on'); io.unobserve(e.target); } }), { threshold: .2 });
    heads.forEach(h => io.observe(h));
  } else heads.forEach(h => h.classList.add('sw-on'));

  /* 2. home quote: words light up with scroll */
  const quote = document.querySelector('.quote-interlude h2');
  if (!quote) return;
  const qwords = words(quote, 'sw', true);
  // the quote uses its own word-by-word light-up instead of the masked reveal
  quote.classList.add('sw-on');
  qwords.forEach(w => { w.style.overflow = 'visible'; w.firstChild.style.transform = 'none'; w.firstChild.style.transition = 'opacity .25s linear'; });
  let raf = 0;
  function frame() {
    raf = 0;
    const r = quote.getBoundingClientRect();
    const q = clamp((innerHeight * .82 - r.top) / (innerHeight * .55 + r.height * .2));
    qwords.forEach((w, k) => { w.firstChild.style.opacity = reduced ? 1 : (0.16 + 0.84 * clamp(q * qwords.length - k)).toFixed(2); });
  }
  const sched = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', sched, { passive: true }); addEventListener('resize', sched, { passive: true });
  frame();
})();
