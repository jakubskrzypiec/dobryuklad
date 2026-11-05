/* Scroll-scrubbed hero film (hilight.design style): scroll position = video time.
   The hero is only pinned once the video is actually playable; otherwise it stays a normal static hero. */
(() => {
  const wrap = document.getElementById('hero-scroll');
  const video = wrap && wrap.querySelector('.hero-video');
  if (!wrap || !video) return;
  // scrubbing is driven by the user, so it stays on with reduced motion (only easing is dropped)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = wrap.querySelector('.hero');
  const copy = wrap.querySelector('.hero-left');
  const hint = wrap.querySelector('.hero-scroll-hint');
  const photo = wrap.querySelector('.hero-photo');
  const caps = [...wrap.querySelectorAll('.hero-caption')];
  const bar = wrap.querySelector('.hero-progress i');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let target = 0, current = 0, running = false, enabled = false, dead = false;

  function measure() {
    const range = wrap.offsetHeight - innerHeight;
    const top = wrap.getBoundingClientRect().top;
    target = range > 0 ? clamp(-top / range) : 0;
  }
  function pinFallback() {
    // if position:sticky does not hold in this browser, pin with fixed/absolute instead
    if (!enabled) return;
    const r = wrap.getBoundingClientRect();
    const mid = r.top < 0 && r.bottom > innerHeight;
    if (mid && Math.abs(hero.getBoundingClientRect().top) > 2) wrap.classList.add('pin-js');
    if (wrap.classList.contains('pin-js')) {
      wrap.classList.toggle('pin-fixed', mid);
      wrap.classList.toggle('pin-end', r.bottom <= innerHeight);
    }
  }
  function render() {
    current = reduced ? target : current + (target - current) * 0.12;
    if (Math.abs(target - current) < 0.0004) current = target;
    if (!video.seeking && video.duration) {
      const t = current * (video.duration - 0.05);
      if (Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
    }
    const fade = clamp((0.14 - current) / 0.05);
    if (copy) { copy.style.opacity = fade; copy.style.transform = `translate3d(0,${(1 - fade) * -40}px,0)`; copy.style.pointerEvents = fade < .2 ? 'none' : ''; }
    if (hint) hint.style.opacity = clamp(1 - current / 0.04);
    caps.forEach(c => { c.classList.toggle('is-on', current >= +c.dataset.from && current < +c.dataset.to); c.classList.toggle('is-past', current >= +c.dataset.to); });
    if (bar) bar.style.transform = `scaleX(${current})`;
    if (current !== target) requestAnimationFrame(render); else running = false;
  }
  function kick() { if (!enabled) return; measure(); pinFallback(); if (!running) { running = true; requestAnimationFrame(render); } }

  function enable() {
    if (enabled || dead) return;
    if (scrollY > 80) { dead = true; return; }      // user already scrolled: keep the page as is, no layout jump
    enabled = true;
    video.pause(); video.currentTime = 0;
    wrap.classList.add('is-scrub');
    if (photo) video.addEventListener('seeked', () => { photo.style.visibility = 'hidden'; }, { once: true });
    measure(); current = target; kick();
  }
  function tryEnable() { if (video.readyState >= 1 && video.duration) enable(); }

  video.addEventListener('canplay', tryEnable);
  video.addEventListener('loadeddata', tryEnable);
  video.addEventListener('error', () => { dead = true; });
  // iOS/Safari ignore preload: a muted play() kicks the download off
  const p = video.play && video.play();
  if (p && p.catch) p.then(() => { if (!enabled) video.pause(); tryEnable(); }).catch(() => {});
  video.addEventListener('loadedmetadata', tryEnable);
  tryEnable();
  setTimeout(() => { if (!enabled) enable(); }, 2500);   // even if the film is slow, keep the pinned captions

  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });
})();
