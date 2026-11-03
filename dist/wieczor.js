// Wieczór — kinowe wejście na stronę i hero.
// Ciemne wnętrze, prawdziwe skany 3D (Poly Haven, CC0): komoda z orzecha, ceramika, mosiądz, fotel.
// Scroll prowadzi smugę światła przez kolejne przedmioty, a na końcu wnętrze rozświetla się w hero.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';
import { HDRLoader } from './vendor/three/HDRLoader.js';
import { EffectComposer } from './vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/postprocessing/RenderPass.js';
import { BokehPass } from './vendor/three/postprocessing/BokehPass.js';
import { UnrealBloomPass } from './vendor/three/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from './vendor/three/postprocessing/ShaderPass.js';
import { OutputPass } from './vendor/three/postprocessing/OutputPass.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const body = document.body;
const seq = document.querySelector('.wz-sequence');
const stage = seq && seq.querySelector('.wz-stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = matchMedia('(max-width: 760px)').matches;
const ASSETS = window.WZ_ASSETS || {}; // podgląd może podmienić sposób ładowania plików binarnych

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Ujęcia: [postęp, pozycja kamery, punkt patrzenia = cel światła]      */
/* ------------------------------------------------------------------ */
const SHOTS_WIDE = [
  [0.0, [-1.6, 1.08, 1.3], [-0.74, 0.9, 0.0]],
  [0.12, [-1.3, 1.02, 1.05], [-0.72, 0.88, 0.0]],
  [0.32, [-0.05, 1.15, 1.15], [0.2, 1.0, 0.0]],
  [0.52, [1.3, 1.0, 1.25], [0.98, 0.84, 0.0]],
  [0.7, [1.6, 1.0, 2.0], [1.45, 0.62, 0.55]],
  [0.86, [0.85, 1.28, 3.3], [0.2, 0.86, 0.0]],
  [1.0, [0.7, 1.26, 3.15], [0.15, 0.86, 0.0]],
];
const SHOTS_TALL = [
  [0.0, [-1.2, 1.15, 1.7], [-0.68, 0.98, 0.0]],
  [0.12, [-1.0, 1.1, 1.5], [-0.62, 0.95, 0.0]],
  [0.32, [0.0, 1.2, 1.55], [0.12, 0.98, 0.0]],
  [0.52, [0.9, 1.1, 1.75], [0.78, 0.9, 0.0]],
  [0.7, [1.5, 1.05, 2.5], [1.45, 0.65, 0.55]],
  [0.86, [0.2, 1.75, 5.2], [0.15, 1.05, 0.0]],
  [1.0, [0.15, 1.72, 5.05], [0.12, 1.05, 0.0]],
];

function start() {
  body.classList.add('wz-active');
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0); // przy ciężkich klatkach animacje trzymają się czasu
  const host = stage.querySelector('.wz-canvas');
  const loaderEl = stage.querySelector('.wz-loader');
  const loaderPct = stage.querySelector('.wz-loader b');
  const heroCopy = stage.querySelector('.wz-hero');
  const progressEl = stage.querySelector('.wz-guide progress');
  heroCopy.setAttribute('inert', '');

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  const DPR = Math.min(devicePixelRatio, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070605');
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 40);

  /* ---------------- ładowanie ---------------- */
  const manager = new THREE.LoadingManager();
  const ready = new Promise((res) => {
    manager.onLoad = res;
    manager.onError = () => {};
  });
  manager.onProgress = (_u, l, t) => loaderPct && (loaderPct.textContent = String(Math.round((l / t) * 100)).padStart(2, '0'));
  const texLoader = new THREE.TextureLoader(manager);
  const T = (p, srgb, rep = 1) => {
    const t = texLoader.load(p);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const binUrl = ASSETS.binUrl || ((p) => Promise.resolve(p));

  manager.itemStart('hdr');
  binUrl('assets/skany/hdri/brown_photostudio_02_1k.hdr').then((u) =>
    new HDRLoader().load(u, (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 0.06;
      manager.itemEnd('hdr');
    }, undefined, () => manager.itemEnd('hdr'))
  );

  /* ---------------- pokój: ciemna dębowa podłoga, ściana z tynku ---------------- */
  const oak = 'assets/skany/textures/oak_veneer_01/';
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ map: T(oak + 'diff.jpg', true, 9), normalMap: T(oak + 'nor.jpg', false, 9), roughnessMap: T(oak + 'rough.jpg', false, 9), color: '#5c4a3b' })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: '#8d7f70', normalMap: T('assets/skany/textures/white_plaster_rough_01/nor.jpg', false, 3), roughness: 0.96 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  wall.position.set(0, 3.5, -0.34);
  wall.receiveShadow = true;
  scene.add(wall);

  /* ---------------- światło ---------------- */
  const hemi = new THREE.HemisphereLight('#ffe8cc', '#1a1410', 0.05);
  scene.add(hemi);
  // smuga słońca przez okno: wąski reflektor z cieniem liści
  const shaft = new THREE.SpotLight('#ffcf94', 0, 14, 0.2, 0.5, 1.2);
  shaft.position.set(-3.6, 3.7, 2.6);
  shaft.castShadow = true;
  shaft.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
  shaft.shadow.bias = -0.0002;
  shaft.shadow.normalBias = 0.015;
  shaft.shadow.radius = 4;
  shaft.shadow.camera.near = 1;
  shaft.shadow.camera.far = 12;
  scene.add(shaft, shaft.target);
  // ciepła lampa w hero: rozświetla ścianę za komodą
  const lamp = new THREE.PointLight('#ffb870', 0, 5, 1.8);
  lamp.position.set(0.2, 1.75, 0.15);
  lamp.castShadow = false;
  scene.add(lamp);
  const wash = new THREE.SpotLight('#ffcf9a', 0, 8, 0.75, 1, 1.5);
  wash.position.set(0.3, 3.3, 2.4);
  wash.target.position.set(0.2, 1.1, -0.34);
  wash.castShadow = true;
  wash.shadow.mapSize.set(1024, 1024);
  wash.shadow.radius = 8;
  scene.add(wash, wash.target);
  // kontra z tyłu, by sylwetki odcinały się od ciemności
  const rim = new THREE.DirectionalLight('#c79d6a', 0.0);
  rim.position.set(2.5, 2.2, -2.5);
  scene.add(rim);

  // widoczny snop światła z kurzem
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uA: { value: 0 }, uCol: { value: new THREE.Color('#ffcf94') } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform float uA; uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float along = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
        gl_FragColor = vec4(uCol * edge * along * uA, 1.0); }`,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.5, 1, 48, 1, true), beamMat);
  scene.add(beam);
  const DUST = isSmall ? 260 : 520;
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos.set([(Math.random() - 0.5) * 4, Math.random() * 2.6, (Math.random() - 0.3) * 2.8], i * 3);
    dustSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  const dustU = { uTime: { value: 0 }, uA: { value: 0 }, uLight: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector3() }, uCos: { value: 0.98 }, uDpr: { value: DPR } };
  const dust = new THREE.Points(
    dustGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: dustU,
      vertexShader: /* glsl */ `attribute float aSeed; uniform float uTime, uDpr; uniform vec3 uLight, uDir; uniform float uCos; varying float vA;
        void main(){ vec3 p = position;
          p.y += mod(uTime * (0.01 + aSeed * 0.02) + aSeed * 3.0, 2.6) - position.y * 0.0;
          p.y = mod(p.y, 2.6);
          p.x += sin(uTime * 0.2 + aSeed * 20.0) * 0.08;
          p.z += cos(uTime * 0.15 + aSeed * 13.0) * 0.06;
          vec3 d = normalize(p - uLight);
          float inBeam = smoothstep(uCos, uCos + 0.012, dot(d, uDir));
          vA = inBeam * (0.4 + 0.6 * fract(aSeed * 7.3));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.0 + aSeed * 2.0) * uDpr * (2.2 / max(-mv.z, 0.4));
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uA; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.85, 0.62) * a * vA * uA, 1.0); }`,
    })
  );
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---------------- skany ---------------- */
  const gltf = new GLTFLoader(manager);
  const box = new THREE.Box3();
  const loadModel = (id) => {
    manager.itemStart(id);
    const base = `assets/skany/models/${id}/`;
    const done = (g) => {
      g.scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          const m = o.material;
          if (m.map) m.map.anisotropy = 8;
        }
      });
      manager.itemEnd(id);
      return g.scene;
    };
    if (ASSETS.loadGltf) return ASSETS.loadGltf(gltf, base, id).then(done);
    return new Promise((res) => gltf.load(base + id + '.gltf', (g) => res(done(g)), undefined, () => manager.itemEnd(id)));
  };
  let top = 0.68;
  const flames = [];
  const candleLights = [];
  const place = (id, x, z, rotY = 0, s = 1) =>
    loadModel(id).then((r) => {
      r.scale.setScalar(s);
      r.rotation.y = rotY;
      box.setFromObject(r);
      r.position.set(x, top - box.min.y, z);
      scene.add(r);
      return r;
    });
  loadModel('modern_wooden_cabinet').then((r) => {
    box.setFromObject(r);
    top = box.max.y;
    r.position.set(0, -box.min.y, 0);
    scene.add(r);
    place('ceramic_vase_03', -0.86, -0.04, 0.5);
    place('ceramic_vase_02', -0.6, 0.05, 1.1);
    place('brass_candleholders', 0.2, -0.04, 0.0).then((r) => {
      // płomienie świec: świecą same i rzucają migoczące światło
      r.updateMatrixWorld(true);
      r.traverse((o) => {
        if (o.isMesh && o.material.name === 'brass_candleholders_flame') {
          o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.2, 3.0, 1.2), toneMapped: false });
          o.castShadow = false;
          o.geometry.computeBoundingBox();
          const c = o.geometry.boundingBox.getCenter(new THREE.Vector3());
          o.localToWorld(c);
          flames.push(o);
          const l = new THREE.PointLight('#ffae5c', 0, 2.6, 1.6);
          l.position.copy(c).add(new THREE.Vector3(0, 0.05, 0.06));
          l.userData.seed = Math.random() * 10;
          scene.add(l);
          candleLights.push(l);
        }
      });
    });
    place('brass_vase_04', 0.98, 0.06, 0.2, 1.3);
  });
  loadModel('mid_century_lounge_chair').then((r) => {
    r.rotation.y = -0.95;
    r.position.set(1.85, 0, 0.95);
    scene.add(r);
  });

  /* ---------------- postprocessing: głębia ostrości, poświata, ziarno ---------------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 1.2, aperture: 0.0035, maxblur: 0.008 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.92);
  composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 1.1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */ `uniform sampler2D tDiffuse; uniform float uTime, uVig; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv);
        vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * uVig; c.rgb *= clamp(v, 0.0, 1.0);
        c.rgb += (h(vUv * 1000.0) - 0.5) * 0.025;
        gl_FragColor = c; }`,
  });
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  /* ---------------- stan i kadrowanie ---------------- */
  let SHOTS = SHOTS_WIDE;
  let wide = true;
  let vw = 1, vh = 1;
  const state = { target: 0, p: 0, intro: 0, running: false, visible: true };
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
  const camPos = new THREE.Vector3();
  const camTgt = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  function shotAt(p) {
    for (let i = 0; i < SHOTS.length - 1; i++) {
      const [p0, c0, t0] = SHOTS[i];
      const [p1, c1, t1] = SHOTS[i + 1];
      if (p <= p1) {
        const k = ease(clamp01((p - p0) / (p1 - p0)));
        camPos.fromArray(c0).lerp(a.fromArray(c1), k);
        camTgt.fromArray(t0).lerp(b.fromArray(t1), k);
        return;
      }
    }
    camPos.fromArray(SHOTS[SHOTS.length - 1][1]);
    camTgt.fromArray(SHOTS[SHOTS.length - 1][2]);
  }

  const lightTgt = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const clock = new THREE.Timer();
  function frame() {
    if (!state.running) return;
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsed();
    state.p += (state.target - state.p) * Math.min(1, dt * 4.5);
    if (Math.abs(state.target - state.p) < 1e-5) state.p = state.target;
    const p = state.p;
    mouseS.lerp(mouse, Math.min(1, dt * 2));

    shotAt(p);
    camPos.x += mouseS.x * 0.12 + Math.sin(t * 0.21) * 0.02;
    camPos.y -= mouseS.y * 0.06 + Math.cos(t * 0.17) * 0.012;
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    // w hero kompozycja przesuwa się w prawo (szeroki ekran) lub w górę (telefon), robiąc miejsce na tekst
    const hk = ease(smooth(0.7, 0.88, p));
    if (wide) camera.setViewOffset(vw, vh, -vw * 0.29 * hk, 0, vw, vh);
    else camera.setViewOffset(vw, vh, 0, vh * 0.16 * hk, vw, vh);

    // światło podąża za kadrem; w hero smuga rozszerza się na całą komodę
    const heroK = smooth(0.7, 0.9, p);
    lightTgt.copy(camTgt).lerp(a.set(0.15, 0.9, -0.1), heroK);
    shaft.target.position.copy(lightTgt);
    shaft.angle = THREE.MathUtils.lerp(0.15, 0.38, heroK);
    shaft.penumbra = THREE.MathUtils.lerp(0.45, 0.75, heroK);
    // bliżej przedmiotów światło słabsze, żeby ściana nie przepalała się
    const near = smooth(0.12, 0.3, p) * (1 - smooth(0.6, 0.75, p));
    shaft.intensity = state.intro * THREE.MathUtils.lerp(THREE.MathUtils.lerp(240, 110, near), 75, heroK);
    lamp.intensity = smooth(0.74, 0.92, p) * 1.2;
    const candle = state.intro * (0.55 + 0.45 * smooth(0.3, 0.45, p));
    candleLights.forEach((l) => {
      const s0 = l.userData.seed;
      const flick = 0.85 + Math.sin(t * 9 + s0) * 0.05 + Math.sin(t * 23 + s0 * 3) * 0.04 + Math.sin(t * 3.1 + s0) * 0.06;
      l.intensity = candle * 0.9 * flick;
    });
    flames.forEach((f, i) => f.scale.set(1, 0.92 + Math.sin(t * 11 + i) * 0.06, 1));
    wash.intensity = smooth(0.72, 0.92, p) * 12;
    rim.intensity = 0.25 * state.intro + heroK * 0.25;
    hemi.intensity = 0.05 + heroK * 0.12;
    scene.environmentIntensity = 0.06 + heroK * 0.1;

    // snop i kurz
    const dir = a.copy(lightTgt).sub(shaft.position);
    const len = dir.length();
    dir.normalize();
    beam.position.copy(shaft.position).addScaledVector(dir, len / 2);
    beam.quaternion.setFromUnitVectors(up, b.copy(dir).negate());
    const r = Math.tan(shaft.angle) * len;
    beam.scale.set(r / 0.5, len, r / 0.5);
    beamMat.uniforms.uA.value = state.intro * THREE.MathUtils.lerp(0.06, 0.035, heroK);
    dustU.uTime.value = t;
    dustU.uA.value = state.intro * 1.2;
    dustU.uLight.value.copy(shaft.position);
    dustU.uDir.value.copy(dir);
    dustU.uCos.value = Math.cos(shaft.angle * 0.95);

    // ostrość na tym, co oświetlone
    const focus = camPos.distanceTo(camTgt);
    bokeh.uniforms.focus.value = focus;
    bokeh.uniforms.aperture.value = THREE.MathUtils.lerp(0.004, 0.0016, heroK) * (wide ? 1 : 0.8);
    grade.uniforms.uTime.value = t % 10;

    composer.render();

    stage.style.setProperty('--hero', smooth(0.82, 0.92, p).toFixed(3));
    stage.style.setProperty('--ui', (1 - smooth(0.8, 0.88, p)).toFixed(3));
    const interactive = p > 0.86;
    if (interactive === heroCopy.hasAttribute('inert')) heroCopy.toggleAttribute('inert', !interactive);
    if (progressEl) progressEl.value = p;
    requestAnimationFrame(frame);
  }

  function run() {
    if (state.running || !state.visible) return;
    state.running = true;
    clock.update();
    requestAnimationFrame(frame);
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    vw = w; vh = h;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    wide = w / h >= 0.9;
    SHOTS = wide ? SHOTS_WIDE : SHOTS_TALL;
    camera.fov = wide ? 32 : 46;
    // na szerokim ekranie kompozycja w hero przesuwa się w prawo, robiąc miejsce na tekst
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();
  new IntersectionObserver((en) => {
    state.visible = en[0].isIntersecting;
    if (state.visible) run();
    else state.running = false;
  }, { rootMargin: '200px 0px' }).observe(seq);

  /* ---------------- teksty ---------------- */
  const split = (el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i)
      .map((l) => l.trim().split(/\s+/).map((w) => `<span class="pw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
      .join('<br>');
    return el.querySelectorAll('.pw > span');
  };
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to('.wz-intro', { autoAlpha: 0, y: -30, duration: 0.04 }, 0.08);
  stage.querySelectorAll('.wz-caption').forEach((cap) => {
    const a0 = parseFloat(cap.dataset.from);
    const b0 = parseFloat(cap.dataset.to);
    const words = split(cap.querySelector('h2'));
    tl.set(cap, { autoAlpha: 1 }, a0);
    tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.03, stagger: 0.004 }, a0);
    tl.fromTo(cap.querySelectorAll('p'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.025, stagger: 0.01 }, a0 + 0.012);
    tl.to(cap, { autoAlpha: 0, y: -20, filter: 'blur(6px)', duration: 0.025 }, b0);
    tl.set(cap, { y: 0, filter: 'none' }, b0 + 0.026);
  });
  const heroWords = split(heroCopy.querySelector('h1'));
  tl.fromTo(heroWords, { yPercent: 110 }, { yPercent: 0, duration: 0.05, stagger: 0.008 }, 0.84);
  tl.fromTo(heroCopy.querySelectorAll('.wz-hero-eyebrow, .hero-statement, .hero-actions, .wz-hero-scope'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.012 }, 0.87);
  tl.to({}, { duration: 0.001 }, 1);

  ScrollTrigger.create({
    trigger: seq,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
    animation: tl,
    onUpdate: (self) => {
      state.target = self.progress;
      run();
    },
    onLeave: () => body.classList.add('wz-past'),
    onEnterBack: () => body.classList.remove('wz-past'),
  });

  const skip = stage.querySelector('.wz-skip');
  skip.hidden = false;
  skip.addEventListener('click', () => {
    scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'auto' });
    heroCopy.querySelector('a')?.focus({ preventScroll: true });
  });
  heroCopy.addEventListener('focusin', () => {
    if (state.p < 0.86) scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'auto' });
  });

  const intro = stage.querySelector('.wz-intro');
  const introWords = split(intro.querySelector('h2'));
  run();
  ready.then(() => {
    loaderEl?.classList.add('is-done');
    body.classList.add('wz-ready');
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(state, { intro: 1, duration: 3.2, ease: 'power2.inOut' }, 0.2)
      .from('.header > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 0.8)
      .from(intro.querySelector('.wz-eyebrow'), { y: 16, autoAlpha: 0, duration: 1 }, 1.2)
      .from(introWords, { yPercent: 110, duration: 1.3, stagger: 0.07, ease: 'power4.out' }, 1.3)
      .from(intro.querySelector('p:last-child'), { y: 16, autoAlpha: 0, duration: 1 }, 1.9)
      .from(['.wz-guide', '.wz-skip'], { autoAlpha: 0, y: 10, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 2.2);
  });
  addEventListener('load', () => ScrollTrigger.refresh());
}

if (!seq || !stage || reduceMotion || !gsap || !ScrollTrigger || !webglAvailable()) {
  body.classList.add('wz-static');
} else {
  start();
}
