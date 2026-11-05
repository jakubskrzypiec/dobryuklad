/* DOBRY UKŁAD — experience layer: smooth scroll, scroll intro, split headings,
   odometer numbers, photo parallax, magnetic buttons and the adaptive header. */
(() => {
  const doc = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const vh = () => window.innerHeight;
  body.classList.add('xp');

  /* ---------- Smooth scrolling ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .95 });
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const header = document.querySelector('.header');
  const scrollToTarget = target => {
    const offset = target.id === 'start' ? 0 : -(header ? 70 : 0);
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href').length < 2) return;
    const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', link.getAttribute('href'));
  });

  /* ---------- Split-line headings and drawn kickers ---------- */
  const splitTargets = [...document.querySelectorAll('main h2, main h1:not(.intro-title)')]
    .filter(el => !el.closest('.intro') && [...el.childNodes].every(n => n.nodeType === 3 || n.nodeName === 'BR'));
  splitTargets.forEach(el => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
    el.innerHTML = lines.map((line, i) => `<span class="split-line" style="--i:${i}"><span>${line}</span></span>`).join('');
    el.classList.add('xp-split');
  });
  const kickers = [...document.querySelectorAll('.home-kicker, .about-eyebrow, .offer-eyebrow, .shop-eyebrow')]
    .filter(el => !el.closest('.intro') && !el.closest('dialog'));
  kickers.forEach(el => el.classList.add('kicker-draw'));

  /* ---------- Odometer numbers ---------- */
  const odometers = [...document.querySelectorAll('.home-offer-number, .offer-step>span, .offer-package-number, .process-track span')]
    .filter(el => /^\d{1,3}$/.test(el.textContent.trim()) && !el.closest('dialog'));
  odometers.forEach(el => {
    const text = el.textContent.trim();
    el.innerHTML = `<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">${text}</span>` +
      `<span class="odo" aria-hidden="true">${[...text].map((d, i) => {
        const n = +d, digits = [...Array(10).keys(), ...Array.from({ length: n + 1 }, (_, k) => k)];
        return `<span class="odo-col" style="--n:${10 + n};--d:${i}">${digits.map(k => `<span>${k}</span>`).join('')}</span>`;
      }).join('')}</span>`;
  });

  const revealOnce = [...splitTargets, ...kickers, ...odometers.map(el => el.querySelector('.odo'))];
  if (reduced || !('IntersectionObserver' in window)) revealOnce.forEach(el => el.classList.add('split-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('split-in');
      io.unobserve(entry.target);
    }), { rootMargin: '0px 0px -12% 0px' });
    revealOnce.forEach(el => io.observe(el));
  }

  /* ---------- Buttons: rolling label, arrow, fill and magnet ---------- */
  const arrow = '<svg class="btn-arrow" aria-hidden="true" width="16" height="10" viewBox="0 0 16 10"><path d="M0 5h14.5M10.5 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  const buttons = [...document.querySelectorAll('.hero-button, .home-cta, .button, .contact-submit, .shop-buy')];
  buttons.forEach(btn => {
    let hasArrow = false;
    [...btn.childNodes].forEach(node => {
      if (node.nodeType === 3 && node.textContent.trim()) {
        const text = node.textContent.trim();
        const label = document.createElement('span');
        label.className = 'btn-label';
        const inner = document.createElement('span');
        inner.textContent = text;
        inner.dataset.text = text;
        label.append(inner);
        node.replaceWith(label);
      } else if (node.nodeType === 1 && /^[\s⟶→↗›]+$/.test(node.textContent)) {
        node.classList.add('btn-arrow');
        hasArrow = true;
      }
    });
    if (!hasArrow && (btn.matches('.home-cta, .hero-button'))) btn.insertAdjacentHTML('beforeend', arrow);
    if (!finePointer || reduced) return;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${clamp((e.clientX - r.left - r.width / 2) * .18, -9, 9).toFixed(1)}px`);
      btn.style.setProperty('--my', `${clamp((e.clientY - r.top - r.height / 2) * .3, -6, 6).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  });

  /* ---------- Photographic sections: clip reveal and parallax ---------- */
  const frames = [...document.querySelectorAll('.project-interlude, .quote-interlude, .about-hero, .about-contact, .shop-closing-image, .contact-closing')]
    .filter(el => [...el.children].some(c => c.tagName === 'IMG'));
  frames.forEach(el => el.classList.add('xp-parallax'));

  /* ---------- Breathing glow in light sections ---------- */
  if (!reduced) {
    [...document.querySelectorAll('main>section')].filter(s => !s.matches('.intro, .hero, .about-hero, .project-interlude, .quote-interlude, .about-contact, .shop-closing, .contact-closing, .space-gallery'))
      .forEach((section, i) => {
        const glow = document.createElement('span');
        glow.className = 'xp-glow';
        glow.setAttribute('aria-hidden', 'true');
        glow.style.cssText = `${i % 2 ? 'left' : 'right'}:-22vmax;top:${10 + (i * 23) % 50}%;animation-delay:${-i * 4}s`;
        section.classList.add('xp-has-glow');
        section.prepend(glow);
      });
  }

  /* ---------- Scroll intro ---------- */
  const intro = document.querySelector('.intro');
  const scenes = intro ? [...intro.querySelectorAll('.intro-scene')] : [];
  const live = intro && !reduced;
  const T = [[.15, .29], [.38, .52], [.61, .75]];
  const lineWindows = [[.21, .29, .38, .43], [.44, .52, .61, .66], [.67, .75, .80, .84]];
  let introParts = null;
  if (live) {
    intro.classList.add('is-live');
    intro.querySelectorAll('.intro-rooms>span').forEach((s, k) => s.style.setProperty('--k', k));
    introParts = {
      frame: intro.querySelector('.intro-frame'),
      copy: [...intro.querySelector('.intro-copy').children],
      title: [...intro.querySelectorAll('.intro-title .ln>span')],
      lines: [...intro.querySelectorAll('.intro-line')].map(l => [...l.querySelectorAll('.ln>span')]),
      hud: intro.querySelector('.intro-hud'),
      outro: intro.querySelector('.intro-outro'),
      outroLines: [...intro.querySelectorAll('.intro-outro-text .ln>span')],
      imgs: scenes.map(s => s.querySelector('img')),
    };
  }
  let introP = -1;
  function renderIntro() {
    const rect = intro.getBoundingClientRect();
    const run = rect.height - vh();
    const p = clamp(-rect.top / run);
    intro.classList.toggle('is-scrolling', p > .005);
    if (Math.abs(p - introP) < .0002) return p;
    introP = p;
    const { frame, copy, title, lines, hud, outro, outroLines, imgs } = introParts;

    // Opening copy leaves upwards, line by line.
    const out = range(p, .025, .12);
    title.forEach((el, i) => {
      if (out <= 0) el.style.removeProperty('transform');
      else el.style.transform = `translateY(${-110 * ease(clamp(out * 1.4 - i * .25))}%)`;
    });
    copy.forEach((el, i) => {
      if (el.classList.contains('intro-title')) return;
      if (out <= 0) { el.style.removeProperty('opacity'); el.style.removeProperty('transform'); return; }
      const t = ease(clamp(out * 1.3 - i * .08));
      el.style.opacity = 1 - t;
      el.style.transform = `translateY(${-28 * t}px)`;
    });

    // Rooms: each one opens from the centre like a doorway while the previous room pushes in.
    let current = 0;
    scenes.forEach((scene, i) => {
      const img = imgs[i];
      const enter = i === 0 ? 1 : easeIO(range(p, T[i - 1][0], T[i - 1][1]));
      const leave = i < T.length ? ease(range(p, T[i][0], T[i][1])) : 0;
      const lifeStart = i === 0 ? 0 : T[i - 1][1];
      const lifeEnd = i < T.length ? T[i][0] : 1;
      const drift = range(p, lifeStart, lifeEnd);
      if (enter > .5) current = i;
      if (i > 0) {
        scene.style.setProperty('--cx', `${(50 * (1 - enter)).toFixed(2)}%`);
        scene.style.setProperty('--cy', `${(50 * (1 - enter)).toFixed(2)}%`);
      }
      const scale = (i === 0 ? 1 : 1 + .32 * (1 - enter)) + .08 * drift + .38 * leave;
      if (i === 0 && p < .001) img.style.removeProperty('transform');
      else img.style.transform = `scale(${scale.toFixed(4)})`;
      scene.style.visibility = enter > 0 && (leave < 1 || i === scenes.length - 1) ? 'visible' : 'hidden';
    });
    intro.style.setProperty('--scene', current);

    // Captions for rooms 2–4.
    lines.forEach((spans, k) => {
      const [a, b, c, d] = lineWindows[k];
      const tin = ease(range(p, a, b)), tout = ease(range(p, c, d));
      spans.forEach((el, i) => {
        const tinI = clamp(tin * 1.3 - i * .3), toutI = clamp(tout * 1.3 - i * .3);
        el.style.transform = `translateY(${110 * (1 - ease(tinI)) - 110 * ease(toutI)}%)`;
      });
    });

    // Outro: the photograph withdraws into a frame and the cream studio statement takes over.
    const shrink = easeIO(range(p, .79, .93));
    frame.style.setProperty('--fx', `${(9 * shrink).toFixed(2)}%`);
    frame.style.setProperty('--fy', `${(13 * shrink).toFixed(2)}%`);
    frame.style.opacity = 1 - ease(range(p, .87, .95));
    hud.style.opacity = 1 - range(p, .78, .84);
    intro.style.setProperty('--outro', range(p, .78, .82).toFixed(3));
    intro.style.setProperty('--p', p.toFixed(4));
    outro.style.setProperty('--o1', ease(range(p, .86, .92)).toFixed(3));
    outro.style.setProperty('--o2', ease(range(p, .95, 1)).toFixed(3));
    outro.style.setProperty('--draw', (1 - easeIO(range(p, .82, 1))).toFixed(4));
    outroLines.forEach((el, i) => { el.style.transform = `translateY(${110 * (1 - ease(range(p, .88 + i * .025, .95 + i * .025)))}%)`; });
    return p;
  }

  /* ---------- Header ---------- */
  let lastY = window.scrollY;
  function renderHeader(y, p) {
    if (!header) return;
    const first = document.querySelector('main>section');
    let solid;
    if (live) solid = p >= .8 || y > intro.offsetTop + intro.offsetHeight - vh();
    else solid = y > Math.max(60, (first ? first.offsetHeight : vh()) - 90);
    header.classList.toggle('is-solid', solid);
    const goingDown = y > lastY + 2, goingUp = y < lastY - 2;
    const deep = live ? y > intro.offsetTop + intro.offsetHeight : y > vh();
    if (body.classList.contains('menu-open')) header.classList.remove('is-hidden');
    else if (goingDown && deep) header.classList.add('is-hidden');
    else if (goingUp || !deep) header.classList.remove('is-hidden');
    lastY = y;
  }

  /* ---------- Frame loop ---------- */
  let ticking = false;
  function render() {
    ticking = false;
    const y = window.scrollY;
    const p = live ? renderIntro() : 0;
    renderHeader(y, p);
    if (reduced) return;
    const h = vh();
    frames.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      const e = ease(clamp((h - r.top) / (h * .85)));
      const isTop = el.matches('.about-hero');
      el.style.setProperty('--clip-x', isTop ? '0%' : `${(6 * (1 - e)).toFixed(2)}%`);
      el.style.setProperty('--clip-y', isTop ? '0%' : `${(9 * (1 - e)).toFixed(2)}%`);
      const max = r.height * .07;
      el.style.setProperty('--py', `${clamp((r.top + r.height / 2 - h / 2) * -.14, -max, max).toFixed(1)}px`);
      el.style.setProperty('--ps', (1.16 - .04 * e).toFixed(3));
    });
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  if (lenis) lenis.on('scroll', schedule);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { introP = -1; schedule(); }, { passive: true });
  render();

  /* ---------- Preloader and opening ---------- */
  const preloader = document.querySelector('.preloader');
  const startIntro = () => {
    body.classList.add('intro-wait');
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove('intro-wait')));
  };
  if (preloader && doc.classList.contains('is-preloading')) {
    if (lenis) lenis.stop();
    const count = preloader.querySelector('.preloader-count');
    const images = scenes.map(s => s.querySelector('img'));
    let loaded = 0, shown = 0, done = false;
    const started = performance.now();
    images.forEach(img => {
      const mark = () => { loaded++; };
      if (img.complete) mark(); else { img.addEventListener('load', mark, { once: true }); img.addEventListener('error', mark, { once: true }); }
    });
    body.classList.add('intro-wait');
    const tick = now => {
      const target = Math.min(100, (loaded / Math.max(1, images.length)) * 100, ((now - started) / 1300) * 100);
      const forced = now - started > 4000 ? 100 : target;
      shown += (forced - shown) * .14;
      if (forced === 100 && shown > 99.4) shown = 100;
      count.textContent = `${Math.round(shown)}%`;
      preloader.style.setProperty('--load', `${shown}%`);
      if (shown >= 100 && !done) {
        done = true;
        try { sessionStorage.setItem('du-intro', '1'); } catch (e) {}
        setTimeout(() => {
          preloader.classList.add('is-leaving');
          setTimeout(() => body.classList.remove('intro-wait'), 350);
          setTimeout(() => { doc.classList.remove('is-preloading'); if (lenis) lenis.start(); }, 1150);
        }, 180);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else if (intro && !reduced) startIntro();
})();
