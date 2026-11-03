// Jasny globus → koncepcyjna zabudowa → wejście do salonu → jasne hero.
// Natywny scroll, działa w obie strony.
import * as THREE from 'three';
import {createHomeInterior} from './home-interior.js?v=city-home-3';
import {homeJourneyPhases} from './home-journey-motion.js?v=city-home-3';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const body = document.body;
const seq = document.querySelector('.planet-sequence');
const stage = seq && seq.querySelector('.planet-stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = matchMedia('(max-width: 760px)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
const LANDING_COORDS = [54.19, 16.17];
const KM = 1 / 6371; // jednostki sceny na kilometr (promień Ziemi = 1)
const CLOUD_LAYERS = [6.5, 9.5]; // km

const COLORS = {
  space: '#efe8de',
  gold: '#d9a75a',
  amber: '#ffb15a',
  warmWhite: '#ffe2b8',
  ink: '#120d08',
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (() => {
  let s = 1234567;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

function latLon(lat, lon) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
}

const LOGDEPTH_V = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
`;
const LOGDEPTH_F = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_fragment>
`;
const NOISE = /* glsl */ `
  float h2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(h2(i), h2(i + vec2(1,0)), u.x), mix(h2(i + vec2(0,1)), h2(i + vec2(1,1)), u.x), u.y); }
  float fbm2(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * n2(p); p *= 2.03; a *= 0.5; } return v; }
`;

/* ------------------------------------------------------------------ */
function start() {
  body.classList.add('planet-active', 'planet-ink', 'planet-daylight');
  gsap.registerPlugin(ScrollTrigger);

  const host = stage.querySelector('.planet-canvas');
  const interior = createHomeInterior(stage);
  const loading = stage.querySelector('.planet-loading');
  const skipButton=stage.querySelector('.planet-skip');
  const finalLayer = stage.querySelector('.planet-final');
  const mistEl = stage.querySelector('.planet-mist');
  const progressEl = stage.querySelector('.planet-guide progress');
  const chapters = [...stage.querySelectorAll('.planet-chapters span')];
  finalLayer?.setAttribute('inert', '');

  /* ---------------- renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
  const DPR = Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(COLORS.space);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 30);
  const C = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, new THREE.Color(v)]));
  // Miękkie światło globusu w neutralnej palecie.
  const sunDir = new THREE.Vector3(-0.35, 0.55, 0.75).normalize();

  /* ---------------- tekstury ---------------- */
  const manager = new THREE.LoadingManager();
  const ready = new Promise((res) => {
    manager.onLoad = res;
    manager.onError = res;
  });
  const loader = new THREE.TextureLoader(manager);
  const tex = (name, srgb) => {
    const t = loader.load(`assets/planeta/${name}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };
  const dayMap = tex('earth-day-4096.jpg', true);
  const nightMap = tex('earth-night-4096.jpg', true);
  const packMap = tex('earth-pack-4096.jpg', false); // R wysokość, G ląd, B chmury

  /* ---------------- niebo z gwiazdami ---------------- */
  const K = new THREE.Vector3(0, 1, 0);
  const skyUniforms = { uLow: { value: 0 }, uUp: { value: K }, uGold: { value: C.gold }, uTime: { value: 0 } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: skyUniforms,
      vertexShader: LOGDEPTH_V + /* glsl */ `
        varying vec3 vDir;
        void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + /* glsl */ `
        uniform float uLow; uniform vec3 uUp, uGold;
        varying vec3 vDir;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 d = normalize(vDir);
          float h = dot(d, uUp);
          // nocne niebo: prawie czarne, ciepła łuna miasta tuż nad horyzontem
          vec3 col = mix(vec3(0.93, 0.9, 0.86), vec3(0.86, 0.82, 0.76), smoothstep(-0.2, 0.8, d.y * 0.5 + 0.5));
          float glow = exp(-max(h + 0.02, 0.0) * 6.0) * uLow;
          col = mix(col, vec3(0.97, 0.95, 0.91), glow * 0.8);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  sky.renderOrder = -10;
  scene.add(sky);

  const STARS = isSmall ? 700 : 1300;
  const sPos = new Float32Array(STARS * 3);
  const sCol = new Float32Array(STARS * 3);
  const sSize = new Float32Array(STARS);
  const v = new THREE.Vector3();
  for (let i = 0; i < STARS; i++) {
    v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize().multiplyScalar(18);
    sPos.set([v.x, v.y, v.z], i * 3);
    const r = rand();
    const c = r < 0.12 ? C.gold : r < 0.3 ? C.warmWhite : new THREE.Color(0.92, 0.92, 1);
    sCol.set([c.r, c.g, c.b], i * 3);
    sSize[i] = Math.pow(rand(), 4) * 9.0 + 2.2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  const starUniforms = { uTime: { value: 0 }, uDpr: { value: DPR }, uAlpha: { value: 1 } };
  const stars = new THREE.Points(
    starGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      
      uniforms: starUniforms,
      vertexColors: true,
      vertexShader: LOGDEPTH_V + /* glsl */ `
        attribute float aSize; uniform float uTime, uDpr; varying vec3 vC; varying float vT;
        void main(){
          vC = color;
          float ph = position.x * 3.1 + position.y * 7.7;
          vT = 0.6 + 0.4 * sin(uTime * (0.7 + fract(ph) * 1.4) + ph);
          gl_PointSize = aSize * uDpr * (0.85 + 0.3 * vT);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + /* glsl */ `
        uniform float uAlpha; varying vec3 vC; varying float vT;
        void main(){
          #include <logdepthbuf_fragment>
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d); a *= a;
          // złota iskra: jasny środek i cztery krótkie promienie
          vec2 q = abs(gl_PointCoord - 0.5) * 2.0;
          float spark = max(smoothstep(0.12, 0.0, q.x) * smoothstep(1.0, 0.2, q.y), smoothstep(0.12, 0.0, q.y) * smoothstep(1.0, 0.2, q.x));
          float k = max(smoothstep(0.5, 0.15, d), spark * 0.8);
          gl_FragColor = vec4(mix(vec3(0.6, 0.44, 0.2), vec3(0.74, 0.56, 0.28), vT), k * (0.45 + 0.55 * vT) * uAlpha);
          #include <colorspace_fragment>
        }`,
    })
  );
  stars.renderOrder = -9;
  scene.add(stars);

  /* ---------------- Ziemia nocą ---------------- */
  const pivot = new THREE.Group();
  pivot.quaternion.setFromUnitVectors(latLon(...LANDING_COORDS), K);
  scene.add(pivot);
  const spin = new THREE.Group();
  pivot.add(spin);

  const earthUniforms = {
    uDay: { value: dayMap },
    uNight: { value: nightMap },
    uPack: { value: packMap },
    uSun: { value: sunDir },
    uGold: { value: C.gold },
    uAmber: { value: C.amber },
    uCloudShift: { value: 0 },
    uCity: { value: 0 },
    uLightsFade: { value: 0 },
    uRim: { value: 1 },
  };
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 256, 192),
    new THREE.ShaderMaterial({
      uniforms: earthUniforms,
      vertexShader: LOGDEPTH_V + /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + /* glsl */ `
        uniform sampler2D uDay, uNight, uPack; uniform vec3 uSun, uGold, uAmber; uniform float uCloudShift, uCity, uLightsFade, uRim;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 n = normalize(vN);
          vec3 v = normalize(cameraPosition - vW);
          float ndl = dot(n, uSun);
          float dayF = smoothstep(-0.12, 0.35, ndl);
          vec4 pk = texture2D(uPack, vUv);
          float land = smoothstep(0.3, 0.7, pk.g);
          float cl = texture2D(uPack, vUv + vec2(uCloudShift, 0.0)).b;

          // dzień w czerni i złocie: monochromatyczna sepia, ocean prawie czarny
          vec3 day = texture2D(uDay, vUv).rgb;
          float lum = dot(day, vec3(0.2126, 0.7152, 0.0722));
          // ląd: taupe → piasek, ocean: jasny kamień; ciepłe, spokojne światło
          vec3 sepia = mix(vec3(0.3, 0.24, 0.18), vec3(0.78, 0.68, 0.54), smoothstep(0.03, 0.5, lum));
          sepia = mix(vec3(0.66, 0.62, 0.56), sepia, land);
          vec3 col = sepia * (0.62 + 0.42 * dayF);
          col = mix(col, vec3(0.97, 0.95, 0.91), cl * 0.45);
          // złoty refleks słońca na oceanie
          vec3 hv = normalize(uSun + v);
          col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, hv), 0.0), 120.0) * (1.0 - land) * (1.0 - cl) * dayF * 0.12;

          // światła miast: złote, gęste, z miękką poświatą
          vec3 night = texture2D(uNight, vUv).rgb;
          float nl = dot(night, vec3(0.333));
          vec3 lights = mix(uAmber, vec3(1.0, 0.9, 0.7), smoothstep(0.5, 1.0, nl)) * pow(nl, 1.6) * 2.9;
          lights *= (1.0 - dayF) * (1.0 - cl * 0.65) * (1.0 - uLightsFade);
          // za dnia bez świateł miast
          // chmury w nocy: słabo podświetlone przez miasta


          // złota atmosfera na krawędzi, mocniejsza od strony słońca
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          float sunSide = smoothstep(-0.5, 0.4, ndl);
          col = mix(col, vec3(0.96, 0.93, 0.88), fres * 0.55 * uRim);
          // ziemia pod miastem przy samym końcu: ciemna, ciepła
          col = mix(col, vec3(0.93, 0.9, 0.85), uCity * 0.9);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  spin.add(earth);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.045, 128, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: { uSun: { value: sunDir }, uGold: { value: C.gold }, uFade: { value: 1 } },
      vertexShader: LOGDEPTH_V + /* glsl */ `
        varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + /* glsl */ `
        uniform vec3 uSun, uGold; uniform float uFade; varying vec3 vN; varying vec3 vW;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 v = normalize(cameraPosition - vW);
          float rim = pow(clamp(0.82 + dot(normalize(vN), v), 0.0, 1.0), 5.0);
          gl_FragColor = vec4(vec3(0.99, 0.97, 0.93), rim * 0.85 * uFade);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(halo);

  const borderMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#3a3027'), transparent: true, opacity: 0 });
  fetch('assets/planeta/borders-europe.json')
    .then((r) => r.json())
    .then((lines) => {
      const pos = [];
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      lines.forEach((l) => {
        for (let i = 0; i < l.length - 2; i += 2) {
          a.copy(latLon(l[i + 1], l[i])).multiplyScalar(1.0004);
          b.copy(latLon(l[i + 3], l[i + 2])).multiplyScalar(1.0004);
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const borders = new THREE.LineSegments(g, borderMat);
      spin.add(borders);
    })
    .catch(() => {});

  const site=new THREE.Group();site.position.copy(K).multiplyScalar(1.0000005);site.scale.setScalar(KM);scene.add(site);

  // chmury: ciemne, od spodu podświetlone złotem miasta
  const cloudShared = { uTime: { value: 0 }, uFade: { value: 0 }, uCam: { value: new THREE.Vector3() }, uAmber: { value: C.amber } };
  const clouds = CLOUD_LAYERS.map((y, i) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { ...cloudShared, uY: { value: y }, uSeed: { value: i * 13.7 } },
        vertexShader: LOGDEPTH_V + /* glsl */ `
          varying vec3 vL;
          void main(){ vL = vec3(position.x, 0.0, -position.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            #include <logdepthbuf_vertex>
          }`,
        fragmentShader: LOGDEPTH_F + NOISE + /* glsl */ `
          uniform float uTime, uFade, uY, uSeed; uniform vec3 uCam, uAmber; varying vec3 vL;
          void main(){
            #include <logdepthbuf_fragment>
            vec2 p = vL.xz * 0.12 + vec2(uSeed, uSeed * 0.6) + vec2(uTime * 0.004, uTime * 0.002);
            float n = fbm2(p);
            float n2 = fbm2(p * 2.6 - uTime * 0.003);
            float dens = smoothstep(0.55, 0.88, n * 0.75 + n2 * 0.35);
            float r = length(vL.xz);
            float under = exp(-r * r / 40.0); // złota łuna miasta na spodzie chmur
            float below = step(uCam.y, uY);
            vec3 col = mix(vec3(0.9, 0.87, 0.83), vec3(0.99, 0.98, 0.96), n2);
            float near = smoothstep(0.15, 1.6, abs(uCam.y - uY));
            float edge = 1.0 - smoothstep(45.0, 78.0, length(vL.xz - uCam.xz));
            gl_FragColor = vec4(col, dens * near * edge * uFade * 0.85);
            #include <colorspace_fragment>
          }`,
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    site.add(m);
    return m;
  });

  /* ---------------- kamera ---------------- */
  const startDir = new THREE.Vector3(0.22, 0.34, 1).normalize();
  const UP = new THREE.Vector3(0, 1, 0);
  const NORTH = new THREE.Vector3(0, 0, -1);
  const camPos = new THREE.Vector3();
  const camTgt = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const camLocal = new THREE.Vector3();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const qFull = new THREE.Quaternion().setFromUnitVectors(startDir, UP);
  const qPart = new THREE.Quaternion();
  const TOP_KM = 34;
  const END_KM = new THREE.Vector3(0, 3.4, 3.6);
  let wide = true;
  const local = (x, y, z, out) => out.set(x, y, z).multiplyScalar(KM).add(K);
  const bez = (a, b, c, t, out) => out.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(c, t * t);

  function cameraAt(p, intro) {
    if (p < 0.5) {
      // z kosmosu w kierunku zbliżenia nad miasto
      const eD = smooth(0.02, 0.3, p);
      const eT = smooth(0.04, 0.28, p);
      const k = smooth(0.03, 0.5, p);
      const h = Math.exp(THREE.MathUtils.lerp(Math.log(3.4 + (1 - intro) * 1.8), Math.log(TOP_KM * KM), easeInOut(k)));
      qPart.identity().slerp(qFull, eD);
      const dir = va.copy(startDir).applyQuaternion(qPart);
      camPos.copy(dir).multiplyScalar(1 + h);
      const side = 1 - smooth(0.0, 0.18, p);
      camTgt.set(wide ? -0.6 * side : 0, wide ? 0 : -0.5 * side, 0).lerp(K, eT);
      camUp.copy(UP).lerp(NORTH, smooth(0.16, 0.32, p)).normalize();
      if (dir.distanceTo(UP) < 1e-5) camPos.z += 1e-8;
    } else {
      // przez chmury, nad miastem, z widokiem na łunę
      const t = easeInOut(smooth(0.5, 0.82, p));
      const drift = smooth(0.8, 1.0, p);
      bez(vb.set(0, TOP_KM, 0.01), vc.set(0, 18, 3), END_KM, t, camLocal);
      camLocal.z -= drift * 2.4;
      camLocal.y -= drift * 2.0;
      local(camLocal.x, camLocal.y, camLocal.z, camPos);
      vb.set(0, 0, 0).lerp(va.set(0, 0, -0.9), t);
      vb.z -= drift * 1.2;
      local(vb.x, vb.y, vb.z, camTgt);
      camUp.copy(NORTH).lerp(UP, smooth(0.05, 0.6, t)).normalize();
    }
  }

  /* ---------------- stan ---------------- */
  const state = { target: 0, p: 0, intro: 0, idle: 0.9, running: false, visible: true };
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

  const clock = new THREE.Timer();
  if (location.hash === '#debug') window.__planet = { state, camera, K, KM }; // tylko do podglądu stanu kamery
  let lastChapter = -1;


  function frame() {
    if (!state.running) return;
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsed();
    state.p += (state.target - state.p) * Math.min(1, dt * 5);
    if (Math.abs(state.target - state.p) < 1e-5) state.p = state.target;
    const p = state.p;
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));

    if (p < 0.002) state.idle += dt * 0.05;
    const unwind = 1 - smooth(0.0, 0.24, p);
    spin.rotation.y = (((state.idle + Math.PI) % (Math.PI * 2)) - Math.PI) * unwind;

    const journey = homeJourneyPhases(p), worldP = journey.world;
    cameraAt(worldP, state.intro);
    const par = (1 - smooth(0.08, 0.3, p)) * 0.12;
    camPos.x += mouseS.x * par;
    camPos.y -= mouseS.y * par;
    const low = smooth(0.62, 0.8, p);
    camPos.addScaledVector(va.set(mouseS.x, -mouseS.y * 0.5, 0), low * 0.25 * KM);
    camera.position.copy(camPos);
    camera.up.copy(camUp);
    camera.lookAt(camTgt);
    const alt = camPos.distanceTo(K);
    camera.near = Math.max(1e-7, Math.min(0.05, alt * 0.02));
    camera.updateProjectionMatrix();

    // niebo i gwiazdy podążają za kamerą
    sky.position.copy(camPos);
    stars.position.copy(camPos);
    skyUniforms.uLow.value = low;
    starUniforms.uTime.value = time;
    // złote gwiazdy: widoczne w kosmosie, gasną przy schodzeniu nad miasto
    starUniforms.uAlpha.value = state.intro * (1 - smooth(0.2, 0.42, p)) * 0.85;
    stars.visible = starUniforms.uAlpha.value > 0.002;

    // Ziemia
    const cityA = smooth(0.28, 0.44, worldP);
    earthUniforms.uCity.value = cityA;
    borderMat.opacity = (0.22 + 0.4 * smooth(0.05, 0.25, p)) * (1 - smooth(0.36, 0.5, p)) * state.intro;
    earthUniforms.uLightsFade.value = 1 - smooth(0.004, 0.02, alt);
    earthUniforms.uRim.value = smooth(0.03, 0.3, alt);
    earthUniforms.uCloudShift.value = time * 0.0015;
    halo.material.uniforms.uFade.value = smooth(0.08, 0.35, alt) * state.intro;
    earth.visible = halo.visible = p < 0.7;

    // miasto i chmury
    site.visible = worldP > 0.26;
    const cloudFade = smooth(0.44, 0.5, worldP) * (1 - smooth(0.64, 0.7, worldP));
    cloudShared.uFade.value = cloudFade;
    cloudShared.uTime.value = time;
    const camKm = va.copy(camPos).sub(K).divideScalar(KM);
    cloudShared.uCam.value.copy(camKm);
    clouds.forEach((c) => (c.visible = cloudFade > 0.001));
    let mist = 0;
    if (cloudFade > 0.01) CLOUD_LAYERS.forEach((y) => (mist = Math.max(mist, Math.exp(-((camKm.y - y) ** 2) / 1.4))));
    if (mistEl) mistEl.style.opacity = Math.max(mist * cloudFade * 0.6,interior.ready?journey.veil:0).toFixed(3);

    // rozdziały
    const ch = p < .45 ? 0 : p < .68 ? 1 : 2;
    if (ch !== lastChapter) {
      lastChapter = ch;
      chapters.forEach((c, i) => c.classList.toggle('is-current', i === ch));
    }

    // rozmycie i przejście w hero
    const photo = interior.failed?smooth(.57,.78,p):journey.photo;
    interior.render(p);
    stage.style.setProperty('--blur', '0px');
    stage.style.setProperty('--zoom', '1');
    stage.style.setProperty('--photo', photo.toFixed(3));
    stage.style.setProperty('--hero-text', journey.text.toFixed(3));
    stage.style.setProperty('--ui', (1 - smooth(0.84, 0.9, p)).toFixed(3));
    if(skipButton)skipButton.hidden=p>.93;
    if (finalLayer) {
      const interactive = p > 0.95;
      if (interactive === finalLayer.hasAttribute('inert')) finalLayer.toggleAttribute('inert', !interactive);
    }
    if (progressEl) progressEl.value = p;

    stage.dataset.journeyProgress=p.toFixed(4);stage.dataset.journeyPhase=photo>.999?'hero':journey.photo>0?'photo':journey.travel>.56?'interior':journey.room>.99?'city':'globe';
    if (photo < 0.999 && (!interior.ready || journey.room<.999)) renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function run() {
    if (state.running || !state.visible) return;
    state.running = true;
    clock.update();
    requestAnimationFrame(frame);
  }

  function resize() {
    // płótno jest odrobinę większe od sceny, żeby rozmyte krawędzie nie odsłaniały tła
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    wide = camera.aspect >= 0.8;
    camera.fov = wide ? 38 : 54;
    camera.updateProjectionMatrix();
    interior.resize();
    syncHeaderPosition();
  }
  function syncHeaderPosition(){body.classList.toggle('planet-past',seq.getBoundingClientRect().bottom<stage.clientHeight-.5);}
  addEventListener('scroll',syncHeaderPosition,{passive:true});
  addEventListener('resize', resize);
  resize();

  new IntersectionObserver((entries) => {
    state.visible = entries[0].isIntersecting;
    if (state.visible) run();
    else state.running = false;
  }, { rootMargin: '200px 0px' }).observe(seq);

  /* ---------------- scroll + teksty (GSAP) ---------------- */
  const split = (el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.setAttribute('aria-label', lines.map(line=>line.replace(/<[^>]+>/g,'')).join(' ').replace(/\s+/g, ' ').trim());
    el.innerHTML = lines
      .map((line) => line.trim().split(/\s+/).map((w) => `<span class="pw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
      .join('<br>');
    return el.querySelectorAll('.pw > span');
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to('.planet-intro', { autoAlpha: 0, y: -40, duration: 0.05 }, 0.03);
  stage.querySelectorAll('.planet-caption').forEach((cap) => {
    const a = parseFloat(cap.dataset.from);
    const b = parseFloat(cap.dataset.to);
    const words = split(cap.querySelector('h2'));
    tl.set(cap, { autoAlpha: 1 }, a);
    tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.03, stagger: 0.004 }, a);
    tl.fromTo(cap.querySelector('p'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.025 }, a + 0.02);
    tl.to(cap, { autoAlpha: 0, y: -24, filter: 'blur(6px)', duration: 0.025 }, b);
    tl.set(cap, { y: 0, filter: 'none' }, b + 0.026);
  });
  const heroBits = finalLayer ? finalLayer.querySelectorAll('.hero-left > *, [data-hero-bit]') : [];
  if (heroBits.length) tl.fromTo(heroBits, { y: 28, filter: 'blur(8px)' }, { y: 0, filter: 'blur(0px)', duration: 0.05, stagger: 0.012 }, 0.9);
  tl.to({}, { duration: 0.001 }, 1);

  ScrollTrigger.create({
    trigger: seq,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.4,
    animation: tl,
    onUpdate: (self) => {
      state.target = self.progress;
      run();
    },
    onLeave: syncHeaderPosition,
    onEnterBack: syncHeaderPosition,
  });

  const skip = skipButton;
  if (skip) {
    skip.hidden = false;
    skip.addEventListener('click', () => {
      state.p=state.target=1;tl.progress(1);finalLayer?.removeAttribute('inert');
      scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'instant' });
      finalLayer?.querySelector('a')?.focus({ preventScroll: true });
    });
  }
  finalLayer?.addEventListener('focusin', () => {
    if (state.p < 0.95) scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'auto' });
  });

  /* ---------------- wejście ---------------- */
  const intro = stage.querySelector('.planet-intro');
  const introWords = split(intro.querySelector('h2'));
  ready.then(async () => {
    await interior.prepare();
    loading?.setAttribute('hidden', '');
    run();
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to(state, { intro: 1, duration: 3.4, ease: 'power2.out' }, 0)
      .fromTo('.planet-canvas', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.8 }, 0)
      .from('.header > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 0.6)
      .from(intro.querySelector('.planet-eyebrow'), { y: 16, autoAlpha: 0, duration: 1 }, 0.8)
      .from(introWords, { yPercent: 110, duration: 1.3, stagger: 0.07, ease: 'power4.out' }, 0.9)
      .from(['.planet-guide', '.planet-chapters', '.planet-skip', '.planet-classic'], { autoAlpha: 0, y: 10, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 1.7);
  });
  run();
  addEventListener('load', () => ScrollTrigger.refresh());
}

// start po zadeklarowaniu wszystkich stałych
if (!seq || !stage || reduceMotion || !gsap || !ScrollTrigger || !webglAvailable()) {
  body.classList.add('planet-static');
} else {
  start();
}
