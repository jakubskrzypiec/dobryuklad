import { FRAME_COUNT, HOLD_RATIO, CROP_BOTTOM, frameAtProgress, advanceFrame } from './entrance-walk-motion.mjs?v=4';

const intro = document.querySelector('.walk-intro');
if (intro) initWalk();

function initWalk() {
  const stage = intro.querySelector('.walk-stage');
  const canvas = intro.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const poster = intro.querySelector('.hero-photo');
  const opening = intro.querySelector('.walk-opening');
  const startButton = intro.querySelector('.walk-start');
  const startLabel = startButton.querySelector('span');
  const hero = intro.querySelector('.hero-left');
  const heroActions = intro.querySelector('.walk-hero-actions');
  const header = document.querySelector('.header');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const base = 'assets/entrance-upstairs-v3/';
  const portrait = innerWidth <= 760 && innerHeight > innerWidth;
  const profile = portrait ? 'mobile' : 'desktop';
  const limit = portrait ? 28 : 24;
  const frames = new Map(), decoding = new Set(), packs = new Map(), pendingPacks = new Map(), failedPacks = new Map(), controllers = new Set();
  let manifest, generation = 0, prepared = false, disabled = false, active = true;
  let current = 0, velocity = 0, target = 0, drawn = -1, previous = 0, raf = 0, retryTimer = 0;
  let width = 1, height = 1, start = 0, range = 1, phase = '';
  let firstFrameFailure = false;
  const failures = new Map();

  function setPhase(next) {
    if (phase === next) return;
    phase = next; intro.dataset.phase = next;
    const isHero = next === 'hero' || next === 'static';
    intro.classList.toggle('is-at-hero', isHero);
    document.body.classList.toggle('walk-hero', isHero);
    hero.inert = !isHero; heroActions.inert = !isHero; header.inert = false;
    opening.inert = next !== 'opening' && next !== 'loading';
    stage.dataset.phase = next;
  }

  function measure() {
    start = intro.getBoundingClientRect().top + scrollY;
    range = Math.max(1, intro.offsetHeight - stage.offsetHeight);
    const sourceWidth = manifest?.width || 1920, sourceHeight = (manifest?.height || 1080) - CROP_BOTTOM;
    const sourceDensity = Math.min(sourceWidth / stage.clientWidth, sourceHeight / stage.clientHeight);
    const ratio = Math.min(devicePixelRatio || 1, 2, sourceDensity);
    width = Math.max(1, Math.round(stage.clientWidth * ratio));
    height = Math.max(1, Math.round(stage.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      if (frames.has(drawn)) draw(drawn);
    }
    if (context) context.imageSmoothingQuality = 'high';
    onScroll();
  }

  function draw(index) {
    const bitmap = frames.get(index); if (!bitmap) return;
    const viewHeight = bitmap.height - CROP_BOTTOM;
    const scale = Math.max(width / bitmap.width, height / viewHeight);
    const w = bitmap.width * scale, h = viewHeight * scale;
    context.drawImage(bitmap, 0, 0, bitmap.width, viewHeight, (width - w) / 2, (height - h) / 2, w, h);
    drawn = index; stage.classList.add('has-frame');
    stage.dataset.frame = String(index);
  }

  function evict() {
    while (frames.size > limit) {
      let farthest = -1, distance = -1;
      for (const index of frames.keys()) {
        if (index === drawn || index === 0 || index === FRAME_COUNT - 1) continue;
        const d = Math.abs(index - current);
        if (d > distance) { farthest = index; distance = d; }
      }
      if (farthest < 0) break;
      frames.get(farthest).close?.(); frames.delete(farthest);
    }
    stage.dataset.buffered = String(frames.size);
  }

  async function decode(index, session = generation) {
    decoding.add(index);
    try {
      const packIndex = Math.floor(index / manifest.packSize);
      const pack = manifest.packs[packIndex], bytes = packs.get(packIndex);
      if (!bytes) return;
      const local = index - pack.first;
      const blob = new Blob([new Uint8Array(bytes, pack.offsets[local], pack.offsets[local + 1] - pack.offsets[local])], { type: 'image/webp' });
      let bitmap;
      if ('createImageBitmap' in window) {
        try { bitmap = await createImageBitmap(blob); } catch (_) { /* Safari/WebKit fallback below. */ }
      }
      if (!bitmap) {
        const objectUrl = URL.createObjectURL(blob);
        try {
          bitmap = new Image();
          bitmap.src = objectUrl;
          await bitmap.decode();
        } finally { URL.revokeObjectURL(objectUrl); }
      }
      if (disabled || session !== generation) { bitmap.close?.(); return; }
      frames.set(index, bitmap); evict();
      if (index === 0 && drawn < 0) draw(0);
      schedule();
    } catch (_) {
      failures.set(index, performance.now() + 2500);
      if (index === 0) firstFrameFailure = true;
      clearTimeout(retryTimer); retryTimer = setTimeout(() => { fillWindow(); schedule(); }, 2600);
    } finally {
      if (session === generation) { decoding.delete(index); if (prepared && active) fillWindow(); }
    }
  }

  // Fetch only the footage needed for the current scroll position. The old
  // implementation fetched every pack (~80 MB desktop) before allowing scroll.
  async function loadPack(packIndex, session = generation) {
    if (!manifest || packIndex < 0 || packIndex >= manifest.packs.length ||
        packs.has(packIndex) || pendingPacks.has(packIndex) ||
        pendingPacks.size >= 3 || (failedPacks.get(packIndex) || 0) > performance.now()) return;
    const controller = new AbortController();
    controllers.add(controller);
    const deadline = setTimeout(() => controller.abort(), 30000);
    const task = (async () => {
      try {
        const pack = manifest.packs[packIndex];
        const bytes = await (await request(`${base}${profile}/${pack.file}`, controller.signal)).arrayBuffer();
        if (session !== generation || disabled) return;
        if (bytes.byteLength !== pack.offsets[pack.offsets.length - 1]) throw new Error('Incomplete frame pack');
        packs.set(packIndex, bytes);
        failedPacks.delete(packIndex);
      } catch (_) {
        if (session === generation && !disabled) {
          failedPacks.set(packIndex, performance.now() + 5000);
          setTimeout(() => { if (session === generation && active) { fillWindow(); schedule(); } }, 5100);
        }
      } finally {
        clearTimeout(deadline);
        controllers.delete(controller);
        pendingPacks.delete(packIndex);
        if (session === generation && prepared && active) { fillWindow(); schedule(); }
      }
    })();
    pendingPacks.set(packIndex, task);
    return task;
  }

  function fillWindow() {
    if (!prepared || disabled || !active || document.hidden) return;
    const centre = Math.round(current), seek = Math.round(target);
    const direction = Math.abs(velocity) > 5 ? Math.sign(velocity) : target < current ? -1 : 1;
    const needed = [seek, centre];
    for (let offset = 1; offset <= limit; offset++) {
      needed.push(centre + offset * direction);
      if (offset <= 7) needed.push(centre - offset * direction);
      if (offset <= 5) { needed.push(seek + offset, seek - offset); }
    }
    for (const index of new Set(needed.filter(i => i >= 0 && i < FRAME_COUNT))) {
      if (frames.has(index) || decoding.has(index) || (failures.get(index) || 0) > performance.now()) continue;
      const packIndex = Math.floor(index / manifest.packSize);
      if (!packs.has(packIndex)) { loadPack(packIndex); continue; }
      if (decoding.size >= (portrait ? 3 : 4)) continue;
      decode(index);
    }
  }

  function tick(now) {
    raf = 0;
    if (disabled || !prepared || !active || document.hidden) return;
    const dt = previous ? (now - previous) / 1000 : 1 / 60;
    previous = now;
    const seek = Math.round(target);
    const jumping = Math.abs(target - current) > 40 && frames.has(seek);
    const next = jumping ? { position: target, velocity: 0 } : advanceFrame(current, velocity, target, dt);
    const index = Math.round(next.position);
    // If a visitor jumps several screens, seek to the decoded target instead of freezing.
    if (frames.has(index)) { current = next.position; velocity = next.velocity; if (index !== drawn) draw(index); }
    else velocity = 0;
    fillWindow();
    const atEnd = target === FRAME_COUNT - 1 && (drawn === FRAME_COUNT - 1 || scrollY >= start + range - 1);
    setPhase(atEnd ? 'hero' : Math.max(drawn, target) <= 6 ? 'opening' : 'travel');
    if (Math.abs(current - target) > .015) schedule();
    else previous = 0;
  }

  function schedule() {
    if (!raf && prepared && !disabled && active && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    const progress = Math.max(0, Math.min(1, (scrollY - start) / range));
    target = frameAtProgress(progress);
    const rect = intro.getBoundingClientRect();
    active = rect.bottom > 0 && rect.top < innerHeight;
    document.body.classList.toggle('walk-active', active && !disabled);
    document.body.style.setProperty('--walk-header-y', `${Math.min(0, range - (scrollY - start))}px`);
    if (prepared && progress >= 1) {
      target = FRAME_COUNT - 1;
      if (frames.has(target)) {
        current = target; velocity = 0; draw(target);
      } else {
        poster.src = `${base}hero-final-crop.webp`;
        stage.classList.remove('has-frame');
      }
      setPhase('hero');
    }
    if (active) { fillWindow(); schedule(); }
  }

  function cleanup() {
    generation++; controllers.forEach(c => c.abort()); controllers.clear();
    cancelAnimationFrame(raf); raf = 0; clearTimeout(retryTimer);
    frames.forEach(bitmap => bitmap.close?.()); frames.clear(); decoding.clear(); packs.clear(); pendingPacks.clear(); failedPacks.clear(); failures.clear();
    drawn = -1; prepared = false; previous = 0; velocity = 0;
  }

  function staticHero() {
    disabled = true; cleanup();
    document.body.classList.remove('walk-cinematic', 'walk-preparing', 'walk-active');
    intro.classList.add('walk-static'); intro.classList.remove('walk-loading');
    poster.src = `${base}hero-final-crop.webp`; stage.classList.remove('has-frame');
    setPhase('static'); measure();
  }

  async function request(url, signal) {
    const response = await fetch(url, { cache: 'force-cache', signal });
    if (!response.ok) throw new Error('Walkthrough asset unavailable');
    return response;
  }

  async function prepare() {
    cleanup(); disabled = false; firstFrameFailure = false;
    const session = generation;
    intro.classList.add('walk-static', 'walk-loading');
    document.body.classList.add('walk-cinematic', 'walk-preparing');
    poster.src = `${base}opening-crop.webp`; stage.classList.remove('has-frame');
    startButton.disabled = true; startLabel.textContent = 'Loading 0%'; setPhase('loading');
    const controller = new AbortController(); controllers.add(controller);
    const deadline = setTimeout(() => controller.abort(), 60000);
    try {
      manifest = await (await request(`${base}${profile}/index.json`, controller.signal)).json();
      if (manifest.frameCount !== FRAME_COUNT) throw new Error('Unexpected frame count');
      stage.dataset.source = `${manifest.width}x${manifest.height}`;
      measure();
      // Start after the first 48-frame pack; the other packs stream when required.
      startLabel.textContent = 'Ładowanie spaceru…';
      await loadPack(0, session);
      if (session !== generation) return;
      if (!packs.has(0)) throw new Error('Opening frames unavailable');
      await Promise.all([0, 1, 2, 3].filter(i => !frames.has(i)).map(i => decode(i, session)));
      if (firstFrameFailure || !frames.has(0)) throw new Error('Image decoder unavailable');
      prepared = true;
      intro.classList.remove('walk-static', 'walk-loading');
      document.body.classList.remove('walk-preparing');
      startButton.disabled = false; startLabel.textContent = 'Scroll down';
      current = 0; setPhase('opening'); measure(); fillWindow(); schedule();
    } catch (_) { if (session === generation) staticHero(); }
    finally { clearTimeout(deadline); controllers.delete(controller); }
  }

  startButton.addEventListener('click', () => {
    if (!prepared) return;
    scrollTo({ top: start + range * (1 - HOLD_RATIO) * .045, behavior: 'smooth' });
  });
  intro.querySelector('.walk-skip').addEventListener('click', () => {
    if (!prepared) { staticHero(); return; }
    current = target = FRAME_COUNT - 1; velocity = 0; draw(FRAME_COUNT - 1); setPhase('hero');
    scrollTo({ top: start + range * (1 - HOLD_RATIO), behavior: 'instant' });
    fillWindow(); schedule();
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => { previous = 0; if (!document.hidden) onScroll(); });
  const sync = () => reduced.matches || !context ? staticHero() : prepare();
  reduced.addEventListener('change', sync); sync();
}
