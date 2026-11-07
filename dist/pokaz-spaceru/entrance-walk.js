import { FRAME_COUNT, HOLD_RATIO, CROP_BOTTOM, frameAtProgress, advanceFrame } from './entrance-walk-motion.mjs?v=4';
import { chooseBufferedFrame, frameStepBudget } from './frame-stability.mjs?v=1';

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
  const limit = portrait ? 24 : 36;
  const frames = new Map(), decoding = new Set(), packs = new Map(), pendingPacks = new Map(), failedPacks = new Map(), controllers = new Set();
  let manifest, generation = 0, prepared = false, disabled = false, active = true;
  let current = 0, velocity = 0, target = 0, drawn = -1, previous = 0, raf = 0, retryTimer = 0, scrollIdleTimer = 0;
  let settle = null;
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
    // Bitmap may have been downsampled to the display size to keep GPU work low.
    const viewHeight = bitmap.height * (1 - CROP_BOTTOM / (manifest?.height || 1080));
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
        // Preserve both ends of the journey while scrubbing a long distance.
        const d = Math.min(Math.abs(index - current), Math.abs(index - target), Math.abs(index - drawn));
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
        try {
          const scale = Math.min(1, Math.max(0.5, stage.clientWidth * 1.25 / manifest.width));
          const decodeWidth = Math.max(1, Math.round(manifest.width * scale));
          const decodeHeight = Math.max(1, Math.round(manifest.height * scale));
          bitmap = await createImageBitmap(blob, {
            resizeWidth: decodeWidth, resizeHeight: decodeHeight, resizeQuality: 'medium'
          });
        } catch (_) {
          // Older Safari implementations do not support ImageBitmap resize.
          try { bitmap = await createImageBitmap(blob); } catch (_) { /* Image fallback below. */ }
        }
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
    const anchor = drawn >= 0 ? drawn : centre;
    const direction = Math.sign(centre - anchor) || Math.sign(seek - anchor) || 1;
    // Load where the user actually sees the camera, not just the distant target.
    const anchorPack = Math.floor(anchor / manifest.packSize);
    const centrePack = Math.floor(centre / manifest.packSize);
    const targetPack = Math.floor(seek / manifest.packSize);
    if (!packs.has(anchorPack)) loadPack(anchorPack);
    const advancePack = Math.floor((anchor + direction * 24) / manifest.packSize);
    if (advancePack >= 0 && advancePack < manifest.packs.length && !packs.has(advancePack)) loadPack(advancePack);
    if (!packs.has(centrePack)) loadPack(centrePack);
    if (!packs.has(targetPack)) loadPack(targetPack);

    const needed = [anchor];
    for (let offset = 1; offset <= 14; offset++) needed.push(anchor + offset * direction);
    for (let offset = 1; offset <= 3; offset++) needed.push(anchor - offset * direction);
    needed.push(centre, seek);
    for (let offset = 1; offset <= 4; offset++) needed.push(centre + offset * direction, seek - offset * direction);
    for (const index of new Set(needed.filter(i => i >= 0 && i < FRAME_COUNT))) {
      if (decoding.size >= (portrait ? 2 : 3)) break;
      if (frames.has(index) || decoding.has(index) ||
          (failures.get(index) || 0) > performance.now()) continue;
      const packIndex = Math.floor(index / manifest.packSize);
      if (!packs.has(packIndex)) {
        if (pendingPacks.size < 3) loadPack(packIndex);
        continue;
      }
      decode(index);
    }
  }

  function tick(now) {
    raf = 0;
    if (disabled || !prepared || !active || document.hidden) return;
    const dt = previous ? (now - previous) / 1000 : 1 / 60;
    previous = now;
    // Never snap to a far-away decoded frame. Keep the original motion model.
    let next;
    if (settle) {
      // Cubic Hermite ease: keep the current frame and travelling speed
      // continuous, then gradually bring the camera to a complete stop.
      const u = Math.min(1, (now - settle.start) / settle.duration);
      const u2 = u * u, u3 = u2 * u;
      const delta = settle.to - settle.from;
      const tangent = Math.sign(delta) * Math.min(
        Math.abs(settle.velocity) * settle.duration / 1000,
        Math.abs(delta) * 2
      );
      const position = (2 * u3 - 3 * u2 + 1) * settle.from
        + (u3 - 2 * u2 + u) * tangent
        + (-2 * u3 + 3 * u2) * settle.to;
      next = { position, velocity: u < 1 ? (position - current) / Math.max(dt, 1 / 120) : 0 };
      if (u >= 1) settle = null;
    } else {
      next = advanceFrame(current, velocity, target, dt);
    }
    // Advance the playhead even if the exact frame is still decoding.
    current = next.position;
    velocity = next.velocity;
    const index = chooseBufferedFrame(frames, drawn, current, frameStepBudget(dt));
    if (index >= 0 && index !== drawn) draw(index);
    fillWindow();
    const atEnd = target === FRAME_COUNT - 1 && (drawn === FRAME_COUNT - 1 || scrollY >= start + range - 1);
    setPhase(atEnd ? 'hero' : Math.max(drawn, target) <= 6 ? 'opening' : 'travel');
    if (settle || Math.abs(current - target) > .015 ||
        chooseBufferedFrame(frames, drawn, current, frameStepBudget(dt)) >= 0) schedule();
    else previous = 0;
  }

  function schedule() {
    if (!raf && prepared && !disabled && active && !document.hidden) raf = requestAnimationFrame(tick);
  }

  // Smoothly brake after a scroll gesture; never jump to the final frame.
  function settleScroll() {
    clearTimeout(scrollIdleTimer); scrollIdleTimer = 0;
    if (!prepared || disabled || !active || document.hidden) return;
    if (Math.abs(target - current) > .015) {
      settle = {
        start: performance.now(),
        duration: Math.max(200, Math.min(1300, Math.abs(target - current) * 11)),
        from: current,
        to: target,
        velocity
      };
    }
    fillWindow();
    schedule();
  }

  function onScroll() {
    const progress = Math.max(0, Math.min(1, (scrollY - start) / range));
    target = frameAtProgress(progress);
    const rect = intro.getBoundingClientRect();
    active = rect.bottom > 0 && rect.top < innerHeight;
    document.body.classList.toggle('walk-active', active && !disabled);
    document.body.style.setProperty('--walk-header-y', `${Math.min(0, range - (scrollY - start))}px`);
    // Keep the last two screen-heights as a smooth final-frame hold.
    // Only force the poster after the entire stage is already offscreen.
    if (prepared && progress >= 1 && !active) {
      current = target;
      velocity = 0;
      settle = null;
      if (frames.has(FRAME_COUNT - 1)) draw(FRAME_COUNT - 1);
      else { poster.src = `${base}hero-final-crop.webp`; stage.classList.remove('has-frame'); }
      setPhase('hero');
    }
    if (active) {
      settle = null; // A new scroll gesture resumes the original motion model.
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(settleScroll, 85);
      fillWindow();
      schedule();
    }
  }

  function cleanup() {
    generation++; controllers.forEach(c => c.abort()); controllers.clear();
    cancelAnimationFrame(raf); raf = 0; clearTimeout(retryTimer); clearTimeout(scrollIdleTimer); scrollIdleTimer = 0;
    frames.forEach(bitmap => bitmap.close?.()); frames.clear(); decoding.clear(); packs.clear(); pendingPacks.clear(); failedPacks.clear(); failures.clear();
    drawn = -1; prepared = false; previous = 0; velocity = 0; settle = null;
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
      await Promise.all(Array.from({ length: 10 }, (_, i) => i).filter(i => !frames.has(i)).map(i => decode(i, session)));
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
