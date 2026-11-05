/* Scroll-scrubbed hero film (hilight.design style): scroll position = video time. */
(() => {
  const wrap = document.getElementById('hero-scroll');
  const video = wrap && wrap.querySelector('.hero-video');
  if (!wrap || !video || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const copy = wrap.querySelector('.hero-left');
  const hint = wrap.querySelector('.hero-scroll-hint');
  const photo = wrap.querySelector('.hero-photo');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let target = 0, current = 0, running = false, ready = false;

  function measure() {
    const range = wrap.offsetHeight - innerHeight;
    const top = wrap.getBoundingClientRect().top;
    target = range > 0 ? clamp(-top / range) : 0;
  }
  function render() {
    // ease the video toward the scroll position for a smooth, inertial feel
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.0004) current = target;
    if (ready && !video.seeking) {
      const t = current * (video.duration - 0.05);
      if (Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
    }
    // headline + hint fade away as the camera starts moving
    const fade = clamp(1 - current / 0.1);
    if (copy) { copy.style.opacity = fade; copy.style.transform = `translate3d(0,${(1 - fade) * -40}px,0)`; copy.style.pointerEvents = fade < .2 ? 'none' : ''; }
    if (hint) hint.style.opacity = clamp(1 - current / 0.04);
    if (current !== target) requestAnimationFrame(render); else running = false;
  }
  function kick() { measure(); if (!running) { running = true; requestAnimationFrame(render); } }

  video.addEventListener('loadedmetadata', () => {
    ready = true; video.pause(); video.currentTime = 0;
    video.addEventListener('seeked', () => { if (photo) photo.style.visibility = 'hidden'; }, { once: true });
    kick();
  });
  if (video.readyState >= 1) video.dispatchEvent(new Event('loadedmetadata'));
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });
  measure(); current = target; kick();
})();
