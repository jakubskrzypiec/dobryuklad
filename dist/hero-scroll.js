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
  let target = 0, current = 0, running = false, enabled = false;

  function measure() {
    const range = wrap.offsetHeight - innerHeight * 1.5;   // the next section slides over the last half screen
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
    if (!video.seeking && video.duration && wrap.classList.contains('video-ready')) {
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

  // Pin immediately: the poster + captions work even before (or without) the film.
  function enable() {
    if (enabled) return;
    enabled = true;
    wrap.classList.add('is-scrub');
    measure(); current = target; kick();
  }
  function videoReady() {
    if (!video.duration) return;
    video.pause();
    wrap.classList.add('video-ready');
    video.currentTime = current * (video.duration - 0.05);
    video.addEventListener('seeked', () => { wrap.classList.add('video-on'); if (photo) photo.style.visibility = 'hidden'; }, { once: true });
    kick();
  }
  video.addEventListener('loadedmetadata', videoReady);
  video.addEventListener('loadeddata', videoReady, { once: true });
  // iOS/Safari ignore preload: a muted play() kicks the download off
  const p = video.play && video.play();
  if (p && p.catch) p.then(() => video.pause()).catch(() => {});
  enable();
  if (video.readyState >= 1) videoReady();

  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });
})();

/* Diagnostics: open the page with #debug to see what the hero is doing on this device. */
(() => {
  if (location.hash !== '#debug') return;
  const box = document.createElement('pre');
  box.style.cssText = 'position:fixed;z-index:99999;left:8px;bottom:8px;margin:0;padding:10px;background:#000c;color:#0f0;font:12px/1.4 monospace;white-space:pre-wrap;max-width:92vw';
  document.body.appendChild(box);
  const errs = [];
  addEventListener('error', e => errs.push(e.message));
  const tick = () => {
    const w = document.getElementById('hero-scroll'), v = w && w.querySelector('.hero-video');
    box.textContent = [
      'build 4', 'ua: ' + navigator.userAgent.slice(0, 90),
      'reduced-motion: ' + matchMedia('(prefers-reduced-motion: reduce)').matches,
      'wrap class: ' + (w && w.className), 'wrap h: ' + (w && w.offsetHeight) + ' vh: ' + innerHeight,
      'scrollY: ' + Math.round(scrollY),
      'video: ' + (v ? 'ready=' + v.readyState + ' net=' + v.networkState + ' t=' + v.currentTime.toFixed(2) + ' dur=' + v.duration + ' err=' + (v.error && v.error.code) : 'none'),
      'errors: ' + errs.join(' | ')
    ].join('\n');
  };
  setInterval(tick, 300);
})();
