import { FRAME_COUNT, HOLD_RATIO, frameAtProgress, approachFrame } from './entrance-walk-motion.mjs';

const intro = document.querySelector('.walk-intro');
if (intro) initWalk();

function initWalk() {
  const stage = intro.querySelector('.walk-stage');
  const canvas = intro.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const label = intro.querySelector('[data-walk-label]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)').matches;
  const folder = `assets/entrance-walk/${mobile ? 'mobile' : 'desktop'}/`;
  const limit = mobile ? 24 : 40;
  const blobs = new Map(), pendingFetch = new Map(), frames = new Map(), decoding = new Set(), failures = new Map();
  let current = 0, target = 0, drawn = -1, previous = 0, raf = 0, direction = 1;
  let progress = 0, start = 0, range = 1, active = true, disabled = false, generation = 0;
  let width = 1, height = 1, prefetchIndex = 0, prefetchStarted = false;
  const url = index => `${folder}frame-${String(index).padStart(4, '0')}.webp`;
  const valid = index => index >= 0 && index < FRAME_COUNT;

  function measure() {
    start = intro.getBoundingClientRect().top + scrollY;
    range = Math.max(1, intro.offsetHeight - stage.offsetHeight);
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 1920 / stage.clientWidth);
    width = canvas.width = Math.max(1, Math.round(stage.clientWidth * ratio));
    height = canvas.height = Math.max(1, Math.round(stage.clientHeight * ratio));
    if (frames.has(drawn)) draw(drawn);
    onScroll();
  }

  async function fetchFrame(index) {
    if (blobs.has(index)) return blobs.get(index);
    if (pendingFetch.has(index)) return pendingFetch.get(index);
    if ((failures.get(index) || 0) > performance.now()) throw new Error('Frame retry deferred');
    const pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url(index), { signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`Frame ${response.status}`);
        const blob = await response.blob();
        blobs.set(index, blob);
        return blob;
      } catch (error) { failures.set(index, performance.now() + 10000); throw error; }
      finally { clearTimeout(timeout); pendingFetch.delete(index); }
    })();
    pendingFetch.set(index, pending);
    return pending;
  }

  function evict() {
    while (frames.size > limit) {
      let farthest = -1, distance = -1;
      for (const index of frames.keys()) {
        if (index === drawn) continue;
        const score = Math.abs(index - current);
        if (score > distance) { farthest = index; distance = score; }
      }
      if (farthest < 0) break;
      frames.get(farthest).close?.(); frames.delete(farthest);
    }
  }

  async function decode(index) {
    const session = generation;
    decoding.add(index);
    try {
      const blob = await fetchFrame(index);
      let bitmap;
      if ('createImageBitmap' in window) bitmap = await createImageBitmap(blob);
      else {
        const objectUrl = URL.createObjectURL(blob);
        try { bitmap = new Image(); bitmap.src = objectUrl; await bitmap.decode(); }
        finally { URL.revokeObjectURL(objectUrl); }
      }
      if (disabled || session !== generation) { bitmap.close?.(); return; }
      frames.set(index, bitmap); evict();
      if (drawn < 0 && index === Math.round(current)) draw(index);
      if (!prefetchStarted && frames.size >= 4) {
        prefetchStarted = true;
        for (let worker = 0; worker < 2; worker++) prefetch();
      }
      schedule();
    } catch (_) {
      // Do not strand a visitor in a long pinned section if loading is unavailable.
      if (index === 0 && drawn < 0 && !disabled) {
        disabled = true; generation++;
        intro.classList.add('walk-static');
        intro.querySelector('.hero-photo').src = 'assets/entrance-walk/hero-final.webp';
        document.body.classList.remove('walk-active');
        measure();
      }
    } finally { decoding.delete(index); if (!disabled && active) fillWindow(); }
  }

  function fillWindow() {
    if (disabled || !active || document.hidden) return;
    const centre = Math.round(current);
    const needed = [centre];
    for (let offset = 1; offset <= 22; offset++) {
      needed.push(centre + offset * direction);
      if (offset <= 12) needed.push(centre - offset * direction);
    }
    for (const index of needed.filter(valid).slice(0, limit - 2)) {
      if (decoding.size >= 4) break;
      if (valid(index) && !frames.has(index) && !decoding.has(index) && (failures.get(index) || 0) < performance.now()) decode(index);
    }
  }

  async function prefetch() {
    // Compressed frames only: decoded images are kept in a bounded moving window.
    while (prefetchIndex < FRAME_COUNT && !disabled) {
      if (document.hidden || !active) { prefetchStarted = false; return; }
      const index = prefetchIndex++;
      try { await fetchFrame(index); } catch (_) { /* Visible frames retry independently. */ }
    }
  }

  function draw(index) {
    const bitmap = frames.get(index);
    if (!bitmap) return;
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const w = bitmap.width * scale, h = bitmap.height * scale;
    context.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
    drawn = index;
    stage.classList.add('has-frame');
    stage.dataset.frame = String(index);
  }

  function tick(now) {
    raf = 0;
    if (disabled || document.hidden || !active) return;
    const dt = previous ? (now - previous) / 1000 : 1 / 60;
    previous = now;
    current = approachFrame(current, target, dt);
    fillWindow();
    const desired = Math.round(current);
    if (desired !== drawn) {
      if (frames.has(desired)) draw(desired);
      else {
        // Never flash an unrelated frame when the user scrolls faster than loading.
        const available = [...frames.keys()].filter(index => direction > 0 ? index >= drawn && index <= desired : index <= drawn && index >= desired);
        if (available.length) draw(available.reduce((a, b) => Math.abs(b - desired) < Math.abs(a - desired) ? b : a));
      }
    }
    const atHero = target === FRAME_COUNT - 1 && drawn === FRAME_COUNT - 1;
    intro.classList.toggle('is-at-hero', atHero);
    label.textContent = atHero ? 'Przestrzeń dla Ciebie. Przewiń dalej.' : 'Przewiń, aby wejść do wnętrza';
    if (Math.abs(current - target) > .015) schedule();
    else previous = 0;
  }

  function schedule() { if (!raf && !disabled && active && !document.hidden) raf = requestAnimationFrame(tick); }
  function onScroll() {
    progress = Math.max(0, Math.min(1, (scrollY - start) / range));
    const next = frameAtProgress(progress);
    if (Math.abs(next - target) > .01) direction = next > target ? 1 : -1;
    target = next;
    const rect = intro.getBoundingClientRect();
    active = rect.bottom > 0 && rect.top < innerHeight;
    document.body.classList.toggle('walk-active', active && !disabled);
    document.body.style.setProperty('--walk-header-y', `${Math.min(0, range - (scrollY - start))}px`);
    intro.style.setProperty('--walk-progress', String(Math.min(1, progress / (1 - HOLD_RATIO))));
    if (active) { fillWindow(); schedule(); }
  }

  function syncPreference() {
    disabled = reduced.matches || !context || navigator.connection?.saveData === true;
    generation++;
    intro.classList.toggle('walk-static', disabled);
    intro.querySelector('.hero-photo').src = disabled ? 'assets/entrance-walk/hero-final.webp' : 'assets/entrance-walk/desktop/frame-0000.webp';
    if (disabled) {
      cancelAnimationFrame(raf); raf = 0; frames.forEach(image => image.close?.()); frames.clear();
      stage.classList.remove('has-frame'); drawn = -1; document.body.classList.remove('walk-active');
    }
    measure();
  }

  intro.querySelector('.walk-skip').addEventListener('click', () => {
    // Keep a visible stretch of the final hero after skipping the journey.
    scrollTo({ top: start + range * (1 - HOLD_RATIO), behavior: 'instant' });
    current = target = FRAME_COUNT - 1; direction = 1; fillWindow(); schedule();
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => { previous = 0; if (!document.hidden) onScroll(); });
  reduced.addEventListener('change', syncPreference);
  syncPreference();
}
