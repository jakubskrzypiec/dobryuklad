// Od planety do rzutu — wariant wejścia na stronę.
// Gliniany globus → Koszalin → mapa z poziomicami → rzut mieszkania → biała makieta
// → materiały → fotograficzne hero. Natywny scroll, działa w obie strony.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const body = document.body;
const seq = document.querySelector('.planet-sequence');
const stage = seq && seq.querySelector('.planet-stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}


/* ------------------------------------------------------------------ */
/* Dane                                                                 */
/* ------------------------------------------------------------------ */
const KOSZALIN = [54.19, 16.17];
const S = 0.002; // jednostki sceny na metr (promień Ziemi = 1)
const PLAN_CENTER = [6, 4];

// ściany: x1, z1, x2, z2, wysokość, grubość (m) — przednia ściana przycięta jak w makiecie
const WALLS = [
  [0, 0, 12, 0, 2.8, 0.22],
  [12, 0, 12, 8, 2.8, 0.22],
  [12, 8, 7, 8, 1.0, 0.22],
  [5.6, 8, 0, 8, 1.0, 0.22],
  [0, 8, 0, 5.2, 2.8, 0.22],
  [0, 2.6, 0, 0, 2.8, 0.22],
  [8, 0, 8, 3.0, 2.8, 0.14],
  [8, 4.2, 8, 8, 2.8, 0.14],
  [0, 2.6, 0, 5.2, 0.55, 0.12], // parapet dużego okna
];
// meble: [rodzaj, x1, z1, x2, z2, wysokość, materiał] lub [cyl, x, z, r, h, materiał]
const FURNITURE = [
  ['box', 1.0, 3.2, 5.4, 7.3, 0.02, 'rug'],
  ['box', 1.2, 6.05, 4.9, 7.0, 0.72, 'linen'],
  ['box', 1.2, 3.8, 2.15, 6.05, 0.72, 'linen'],
  ['cyl', 3.4, 4.95, 0.55, 0.36, 'walnut'],
  ['box', 4.35, 3.55, 5.25, 4.45, 0.68, 'linen'],
  ['box', 4.6, 1.6, 7.4, 2.6, 0.95, 'stone'],
  ['box', 1.0, 0.12, 7.8, 0.75, 0.9, 'walnut'],
  ['box', 9.2, 0.7, 11.6, 3.0, 0.5, 'linen'],
  ['box', 11.25, 4.8, 11.88, 7.85, 2.2, 'walnut'],
  ['cyl', 0.65, 7.35, 0.28, 1.3, 'plant'],
];

const COLORS = {
  bg: '#17130e',
  ink: '#2b241d',
  paper: '#ece6dc',
  paperSea: '#ddd4c7',
  clayLight: '#cdbba3',
  clayDark: '#6e5948',
  sea: '#251d16',
  gold: '#c9a46a',
  model: '#f1ece4',
  wall: '#3d2b1f',
  floor: '#3a332c',
  linen: '#cbbca9',
  walnut: '#4b3526',
  stone: '#8e867b',
  rug: '#6a5e53',
  plant: '#3b4632',
};

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function latLon(lat, lon) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
}

/* ------------------------------------------------------------------ */
function start() {
  body.classList.add('planet-active');
  gsap.registerPlugin(ScrollTrigger);

  const host = stage.querySelector('.planet-canvas');
  const loading = stage.querySelector('.planet-loading');
  const finalLayer = stage.querySelector('.planet-final');
  const pinLabel = stage.querySelector('.planet-pin');
  const dimW = stage.querySelector('[data-dim="w"]');
  const dimH = stage.querySelector('[data-dim="h"]');
  const progressEl = stage.querySelector('.planet-guide progress');
  const chapters = [...stage.querySelectorAll('.planet-chapters span')];
  finalLayer?.setAttribute('inert', '');

  /* ---------------- renderer ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(COLORS.bg);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.001, 20);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const C = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, new THREE.Color(v)]));
  const lightDir = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();

  /* ---------------- tekstura reliefu ---------------- */
  const manager = new THREE.LoadingManager();
  const ready = new Promise((res) => {
    manager.onLoad = res;
    manager.onError = res;
  });
  const relief = new THREE.TextureLoader(manager).load('assets/planeta/earth-relief-2048.jpg');
  relief.anisotropy = 1;
  relief.wrapS = THREE.RepeatWrapping;

  /* ---------------- globus ---------------- */
  const K = new THREE.Vector3(0, 1, 0); // Koszalin, po obrocie leży na szczycie globusa
  const pivot = new THREE.Group();
  pivot.quaternion.setFromUnitVectors(latLon(...KOSZALIN), K);
  scene.add(pivot);
  const spin = new THREE.Group();
  pivot.add(spin);

  const globeUniforms = {
    uMap: { value: relief },
    uTopo: { value: 0 },
    uDark: { value: 0 },
    uLight: { value: lightDir },
    uInk: { value: C.ink },
    uPaper: { value: C.paper },
    uPaperSea: { value: C.paperSea },
    uClayLight: { value: C.clayLight },
    uClayDark: { value: C.clayDark },
    uSea: { value: C.sea },
    uGold: { value: C.gold },
    uBg: { value: C.bg },
  };
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, 256, 192),
    new THREE.ShaderMaterial({
      uniforms: globeUniforms,
      vertexShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vL;
        void main(){
          vUv = uv; vL = position;
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_fragment>
        uniform sampler2D uMap; uniform float uTopo, uDark; uniform vec3 uLight;
        uniform vec3 uInk, uPaper, uPaperSea, uClayLight, uClayDark, uSea, uGold, uBg;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vL;

        float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float n3(vec3 x){
          vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * n3(p); p *= 2.07; a *= 0.5; } return v; }
        // gradient noise for the relief: value-noise derivatives show square cells
        vec3 g3(vec3 p){
          p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
        }
        float gn(vec3 p){
          vec3 i = floor(p); vec3 f = fract(p);
          vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
          return mix(mix(mix(dot(g3(i), f), dot(g3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                         mix(dot(g3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(g3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
                     mix(mix(dot(g3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(g3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                         mix(dot(g3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(g3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
        }
        // izolinia z antyaliasingiem; znika, gdy linie są zbyt gęste
        float iso(float x){
          float fw = fwidth(x);
          float d = abs(fract(x - 0.5) - 0.5);
          return (1.0 - smoothstep(0.0, fw * 1.3, d)) * (1.0 - smoothstep(0.1, 0.32, fw));
        }
        vec3 bump(vec3 n, float h, float k){
          vec3 sx = dFdx(vW), sy = dFdy(vW);
          vec3 r1 = cross(sy, n), r2 = cross(n, sx);
          float det = dot(sx, r1);
          vec3 g = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2) * k;
          return normalize(abs(det) * n - g);
        }
        void main(){
          #include <logdepthbuf_fragment>
          vec4 t = texture2D(uMap, vUv);
          float elev = t.r;
          float land = smoothstep(0.3, 0.7, t.g);
          vec3 n0 = normalize(vN);
          vec3 v = normalize(cameraPosition - vW);

          // ---- glina ----
          // relief from smooth noise, scaled by elevation (bilinear height would facet per texel)
          float rough = 0.25 + smoothstep(0.02, 0.5, elev) * 1.6;
          float hc = (gn(vL * 9.0) * 0.6 + gn(vL * 23.0) * 0.3 + gn(vL * 61.0) * 0.12) * land * rough * 0.14;
          vec3 n = bump(n0, hc, 1.0);
          float diff = max(dot(n, uLight), 0.0);
          vec3 clay = mix(uSea, mix(uClayDark, uClayLight, smoothstep(0.0, 0.55, elev)), land);
          vec3 warm = vec3(1.0, 0.86, 0.68);
          vec3 clayLit = clay * (0.16 + 1.05 * diff * warm);
          clayLit += uGold * iso(elev * 14.0) * 0.1 * land * (0.4 + diff);
          float fres = pow(1.0 - max(dot(n0, v), 0.0), 3.0);
          clayLit += vec3(0.85, 0.66, 0.45) * fres * (0.25 + 0.6 * max(dot(n0, uLight), 0.0));

          // ---- mapa na papierze ----
          float H = elev + 0.2 * fbm(vL * 24.0) + 0.05 * fbm(vL * 260.0) + 0.012 * fbm(vL * 2400.0);
          float lines = iso(H * 9.0) * 0.95 + iso(H * 45.0) * 0.6 + iso(H * 225.0) * 0.45 + iso(H * 1125.0) * 0.4;
          float g = t.g;
          float coast = 1.0 - smoothstep(0.0, fwidth(g) * 1.6 + 1e-4, abs(g - 0.5));
          vec3 paper = mix(uPaperSea, uPaper, smoothstep(0.15, 0.85, land)) * (0.975 + 0.025 * n3(vL * 1800.0));
          paper = mix(paper, uInk, clamp(lines * 0.32 + coast * 0.75, 0.0, 1.0));
          paper *= 0.93 + 0.07 * max(dot(n0, uLight), 0.0);

          vec3 col = mix(clayLit, paper, uTopo);
          // przy materiałach otoczenie gaśnie, zostaje wnętrze
          col = mix(col, uBg * 1.25 + col * 0.06, uDark);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  spin.add(globe);

  // ciepła poświata wokół glinianej kuli
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.07, 96, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uFade: { value: 1 }, uLight: { value: lightDir } },
      vertexShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_fragment>
        uniform float uFade; uniform vec3 uLight; varying vec3 vN; varying vec3 vW;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 v = normalize(cameraPosition - vW);
          float rim = pow(clamp(0.8 + dot(normalize(vN), v), 0.0, 1.0), 4.0);
          float lit = 0.35 + 0.65 * smoothstep(-0.4, 0.7, dot(normalize(vW), uLight));
          gl_FragColor = vec4(vec3(0.78, 0.58, 0.36) * rim * lit * 0.38 * uFade, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(halo);

  /* ---------------- złoty pył ---------------- */
  const DUST = matchMedia('(max-width: 760px)').matches ? 450 : 900;
  const dPos = new Float32Array(DUST * 3);
  const dSeed = new Float32Array(DUST);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < DUST; i++) {
    tmp.randomDirection().multiplyScalar(1.25 + Math.pow(Math.random(), 1.5) * 2.6);
    dPos.set([tmp.x, tmp.y, tmp.z], i * 3);
    dSeed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dustUniforms = { uTime: { value: 0 }, uFade: { value: 1 }, uDpr: { value: renderer.getPixelRatio() }, uGold: { value: C.gold } };
  const dust = new THREE.Points(
    dustGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: dustUniforms,
      vertexShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_vertex>
        attribute float aSeed; uniform float uTime, uDpr; varying float vA;
        void main(){
          vec3 p = position;
          p.y += sin(uTime * 0.15 + aSeed * 30.0) * 0.06;
          p.x += cos(uTime * 0.11 + aSeed * 20.0) * 0.05;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0));
          gl_PointSize = (1.0 + aSeed * 2.4) * uDpr * (3.0 / max(-mv.z, 0.5));
          gl_Position = projectionMatrix * mv;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <logdepthbuf_pars_fragment>
        uniform float uFade; uniform vec3 uGold; varying float vA;
        void main(){
          #include <logdepthbuf_fragment>
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uGold * a * a * vA * uFade * 0.9, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---------------- znacznik Koszalina ---------------- */
  const pin = new THREE.Group();
  pin.position.copy(K).multiplyScalar(1.00002);
  const pinMat = new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, depthWrite: false, toneMapped: false });
  const pinRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), pinMat);
  const pinPulse = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 64), pinMat.clone());
  const pinDot = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), pinMat);
  [pinRing, pinPulse, pinDot].forEach((m) => {
    m.rotation.x = -Math.PI / 2;
    pin.add(m);
  });
  scene.add(pin);

  /* ---------------- mieszkanie (w metrach) ---------------- */
  const site = new THREE.Group();
  site.position.copy(K).multiplyScalar(1.000004);
  site.scale.setScalar(S);
  scene.add(site);
  const plan = new THREE.Group();
  plan.position.set(-PLAN_CENTER[0], 0, -PLAN_CENTER[1]);
  site.add(plan);

  // arkusz kalki pod rysunkiem
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(17.5, 13),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#f6f2eb'), transparent: true, opacity: 0, depthWrite: false })
  );
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.y = 0.004;
  site.add(sheet);

  const mats = {};
  const matFor = (key, final) => {
    if (!mats[key]) {
      mats[key] = new THREE.MeshStandardMaterial({ color: C.model.clone(), roughness: 0.92, metalness: 0, transparent: false });
      mats[key].userData.final = final;
    }
    return mats[key];
  };
  const wallMat = matFor('wall', C.wall);
  const floorMat = matFor('floor', C.floor);
  const finals = { linen: C.linen, walnut: C.walnut, stone: C.stone, rug: C.rug, plant: C.plant };
  Object.entries(finals).forEach(([k, v]) => matFor(k, v));
  mats.stone.roughness = 0.45;

  const inkLine = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0 });
  const inkMat = new THREE.MeshBasicMaterial({ color: C.ink, transparent: true, opacity: 1 });

  // posadzka
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.08, 8.2), floorMat);
  floor.position.set(6, 0.04, 4);
  floor.receiveShadow = true;
  floor.visible = false;
  plan.add(floor);

  // ściany: rysowane długością, potem wyciągane w górę
  const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0);
  const walls = WALLS.map(([x1, z1, x2, z2, h, t], i) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ext = t / 2;
    const m = new THREE.Mesh(unitBox, inkMat);
    const dir = new THREE.Vector2(x2 - x1, z2 - z1).normalize();
    m.position.set(x1 - dir.x * ext, 0.06, z1 - dir.y * ext);
    m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData = { len: len + t, h, t, order: i / WALLS.length };
    plan.add(m);
    return m;
  });

  // meble: kontur na rzucie + bryła w makiecie
  const furniture = FURNITURE.map((f, i) => {
    let solid, outline;
    if (f[0] === 'box') {
      const [, x1, z1, x2, z2, h, key] = f;
      solid = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1).translate(0, h / 2, 0), matFor(key));
      solid.position.set((x1 + x2) / 2, 0.08, (z1 + z2) / 2);
      const pts = [[x1, z1], [x2, z1], [x2, z2], [x1, z2], [x1, z1]].map(([x, z]) => new THREE.Vector3(x, 0.07, z));
      outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkLine.clone());
    } else {
      const [, x, z, r, h, key] = f;
      solid = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 40).translate(0, h / 2, 0), matFor(key));
      solid.position.set(x, 0.08, z);
      const pts = Array.from({ length: 49 }, (_, k) => {
        const a = (k / 48) * Math.PI * 2;
        return new THREE.Vector3(x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r);
      });
      outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkLine.clone());
    }
    solid.castShadow = true;
    solid.receiveShadow = true;
    solid.visible = false;
    solid.userData.order = i / FURNITURE.length;
    plan.add(solid, outline);
    return { solid, outline };
  });

  // symbole drzwi i wymiary — tylko na rzucie
  const annot = [];
  const addLine = (pts) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(x, 0.07, z))), inkLine.clone());
    plan.add(l);
    annot.push(l);
    return l;
  };
  const arc = (cx, cz, r, a0, a1) => Array.from({ length: 25 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / 24;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
  });
  addLine([[5.6, 8], [5.6, 6.6]]);
  addLine(arc(5.6, 8, 1.4, -Math.PI / 2, 0));
  addLine([[8, 3.0], [9.2, 3.0]]);
  addLine(arc(8, 3.0, 1.2, 0, Math.PI / 2));
  // okno: trzy cienkie linie
  [-0.06, 0, 0.06].forEach((o) => addLine([[o, 2.6], [o, 5.2]]));
  // linie wymiarowe
  const dimTop = -1.0;
  const dimLeft = -1.0;
  addLine([[0, dimTop], [12, dimTop]]);
  addLine([[0, dimTop - 0.25], [0, dimTop + 0.25]]);
  addLine([[12, dimTop - 0.25], [12, dimTop + 0.25]]);
  addLine([[dimLeft, 0], [dimLeft, 8]]);
  addLine([[dimLeft - 0.25, 0], [dimLeft + 0.25, 0]]);
  addLine([[dimLeft - 0.25, 8], [dimLeft + 0.25, 8]]);
  const dimAnchors = { w: new THREE.Vector3(6, 0, dimTop - 0.45), h: new THREE.Vector3(dimLeft - 0.55, 0, 4) };

  /* ---------------- światło makiety ---------------- */
  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x3a2d22, 0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe2bd, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -11 * S;
  sc.right = sc.top = 11 * S;
  sc.near = 0.0001;
  sc.far = 0.2;
  sun.shadow.bias = -0.00001;
  sun.shadow.normalBias = 0.00002;
  sun.position.copy(K).add(new THREE.Vector3(-9, 16, 7).multiplyScalar(S * 3));
  sun.target.position.copy(K);
  scene.add(sun, sun.target);

  /* ---------------- kamera ---------------- */
  const startDir = new THREE.Vector3(0.22, 0.34, 1).normalize();
  const UP = new THREE.Vector3(0, 1, 0);
  const NORTH = new THREE.Vector3(0, 0, -1);
  const camPos = new THREE.Vector3();
  const camTgt = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const toLocal = (x, y, z, out) => out.set(x, y, z).multiplyScalar(S).add(K);
  let topM = 18;
  const off = new THREE.Vector3(-3.4, 0, 0); // przesunięcie kadru rzutu (m)

  const L = {
    threeQ: new THREE.Vector3(-10.5, 11, 16),
    threeQT: new THREE.Vector3(-1.6, 0.4, 0.8),
    eye: new THREE.Vector3(-5.0, 1.45, 3.4),
    eyeT: new THREE.Vector3(0.6, 0.95, -1.6),
  };
  const bez = (a, b, c, t, out) => out.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(c, t * t);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();

  function cameraAt(p, intro) {
    if (p < 0.6) {
      // globus → Koszalin, z lotu ptaka
      const eD = smooth(0.0, 0.34, p);
      const eT = smooth(0.02, 0.3, p);
      const k = smooth(0.02, 0.44, p);
      const h = Math.exp(THREE.MathUtils.lerp(Math.log(3.3 + (1 - intro) * 1.6), Math.log(topM * S), easeInOut(k)));
      qa.setFromUnitVectors(startDir, UP);
      const dir = startDir.clone().applyQuaternion(new THREE.Quaternion().slerp(qa, eD));
      camPos.copy(dir).multiplyScalar(1 + h);
      // na starcie globus stoi po prawej stronie kadru, obok tytułu
      const side = 1 - smooth(0.0, 0.16, p);
      camTgt.set(aspectWide ? -0.62 * side : 0, aspectWide ? 0 : -0.45 * side, 0).lerp(K, eT);
      camUp.copy(UP).lerp(NORTH, smooth(0.16, 0.38, p)).normalize();
      if (dir.distanceTo(UP) < 1e-4) camPos.z += 1e-7;
      const o = smooth(0.28, 0.44, p) * S;
      camPos.addScaledVector(off, o);
      camTgt.addScaledVector(off, o);
    } else if (p < 0.75) {
      // rzut → makieta w ujęciu 3/4
      const t = easeInOut(smooth(0.6, 0.75, p));
      bez(va.set(off.x, topM, off.z + 0.002), vb.set(off.x - 3, topM * 0.85, off.z + 7), L.threeQ, t, vc);
      toLocal(vc.x, vc.y, vc.z, camPos);
      vc.copy(off).lerp(L.threeQT, t);
      toLocal(vc.x, vc.y, vc.z, camTgt);
      camUp.copy(NORTH).lerp(UP, smooth(0.0, 0.6, t)).normalize();
    } else {
      // przez przyciętą ścianę na wysokość oczu
      const t = easeInOut(smooth(0.75, 0.9, p));
      bez(L.threeQ, va.set(-7.5, 4.2, 7.5), L.eye, t, vc);
      toLocal(vc.x, vc.y, vc.z, camPos);
      vc.copy(L.threeQT).lerp(L.eyeT, t);
      toLocal(vc.x, vc.y, vc.z, camTgt);
      camUp.copy(UP);
    }
  }

  /* ---------------- stan ---------------- */
  let aspectWide = true;
  const state = { target: 0, p: 0, intro: 0, idle: 0.6, running: false, visible: true };
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

  const proj = new THREE.Vector3();
  function place(el, worldVec, alpha, dx = 0, dy = 0) {
    if (!el) return;
    proj.copy(worldVec).project(camera);
    const x = (proj.x * 0.5 + 0.5) * innerWidth + dx;
    const y = (-proj.y * 0.5 + 0.5) * innerHeight + dy;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.opacity = alpha.toFixed(3);
  }

  const lerpColor = (mat, from, to, t) => mat.color.copy(from).lerp(to, t);
  const clock = new THREE.Timer();
  let lastChapter = -1;
  let lightMode = false;

  function frame() {
    if (!state.running) return;
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsed();
    state.p += (state.target - state.p) * Math.min(1, dt * 6);
    if (Math.abs(state.target - state.p) < 1e-5) state.p = state.target;
    const p = state.p;
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));

    // obrót: przed scrollem globus kręci się sam, potem wraca do Koszalina
    if (p < 0.002) state.idle += dt * 0.06;
    const unwind = 1 - smooth(0.0, 0.2, p);
    spin.rotation.y = (((state.idle + Math.PI) % (Math.PI * 2)) - Math.PI) * unwind;

    cameraAt(p, state.intro);
    // delikatna paralaksa na globusie
    const par = (1 - smooth(0.1, 0.3, p)) * 0.12 + smooth(0.75, 0.9, p) * 0.4 * S;
    camPos.x += mouseS.x * par;
    camPos.y -= mouseS.y * par;
    camera.position.copy(camPos);
    camera.up.copy(camUp);
    camera.lookAt(camTgt);
    const dist = camPos.distanceTo(K);
    camera.near = Math.max(1e-6, Math.min(0.05, dist * 0.02));
    camera.far = 20;
    camera.updateProjectionMatrix();

    // globus
    globeUniforms.uTopo.value = smooth(0.2, 0.4, p);
    globeUniforms.uDark.value = smooth(0.74, 0.86, p);
    halo.material.uniforms.uFade.value = (1 - smooth(0.12, 0.3, p)) * state.intro;
    dustUniforms.uTime.value = time;
    dustUniforms.uFade.value = (1 - smooth(0.06, 0.22, p)) * state.intro;
    dust.visible = dustUniforms.uFade.value > 0.001;

    // znacznik
    const pinA = smooth(0.06, 0.14, p) * (1 - smooth(0.36, 0.43, p));
    pin.visible = pinA > 0.001;
    if (pin.visible) {
      pin.scale.setScalar(dist * 0.03);
      pinMat.opacity = pinA;
      const pulse = (time * 0.6) % 1;
      pinPulse.scale.setScalar(1 + pulse * 1.6);
      pinPulse.material.opacity = pinA * (1 - pulse) * 0.8;
    }
    place(pinLabel, K, pinA, 0, 0);
    if (pinLabel) pinLabel.classList.toggle('on-paper', globeUniforms.uTopo.value > 0.35);

    // rzut
    const drawW = smooth(0.42, 0.52, p);
    const ext = easeInOut(smooth(0.6, 0.7, p));
    const modelA = smooth(0.58, 0.62, p); // tusz → biała makieta
    const matT = smooth(0.74, 0.86, p); // makieta → materiały
    sheet.material.opacity = smooth(0.4, 0.46, p) * (1 - smooth(0.6, 0.66, p));
    sheet.visible = sheet.material.opacity > 0.001;
    const siteVisible = p > 0.38;
    site.visible = siteVisible;
    if (siteVisible) {
      inkMat.opacity = 1;
      walls.forEach((w) => {
        const d = smooth(w.userData.order * 0.75, w.userData.order * 0.75 + 0.3, drawW);
        const flat = 0.02;
        w.scale.set(Math.max(0.0001, w.userData.len * d), flat + (w.userData.h - flat) * ext, w.userData.t);
        w.visible = d > 0.001;
        w.material = modelA > 0.5 ? wallMat : inkMat;
      });
      const outlineA = smooth(0.48, 0.56, p) * (1 - smooth(0.62, 0.68, p));
      furniture.forEach(({ solid, outline }) => {
        const o = solid.userData.order;
        outline.material.opacity = outlineA * smooth(o * 0.6, o * 0.6 + 0.4, smooth(0.48, 0.58, p));
        outline.visible = outline.material.opacity > 0.001;
        const rise = easeInOut(smooth(0.63 + o * 0.05, 0.7 + o * 0.05, p));
        solid.visible = rise > 0.001;
        solid.scale.y = Math.max(0.001, rise);
      });
      const annotA = smooth(0.5, 0.58, p) * (1 - smooth(0.6, 0.64, p));
      annot.forEach((l) => {
        l.material.opacity = annotA;
        l.visible = annotA > 0.001;
      });
      floor.visible = modelA > 0.001;
      floor.scale.y = Math.max(0.01, modelA);
      // kolory: biała makieta → materiały
      Object.values(mats).forEach((m) => lerpColor(m, C.model, m.userData.final, matT));
      mats.wall.roughness = 0.92 - matT * 0.35;
      hemi.intensity = 0.62 * smooth(0.58, 0.64, p) * (1 - 0.4 * matT);
      sun.intensity = 1.55 * smooth(0.58, 0.64, p) * (1 - 0.2 * matT);
      sun.color.setRGB(1, 0.89 - 0.12 * matT, 0.74 - 0.2 * matT);
      scene.environmentIntensity = 0.32 * (1 - 0.5 * matT);
    }
    place(dimW, toLocal(dimAnchors.w.x - PLAN_CENTER[0], 0, dimAnchors.w.z - PLAN_CENTER[1], vc), smooth(0.52, 0.58, p) * (1 - smooth(0.6, 0.64, p)));
    place(dimH, toLocal(dimAnchors.h.x - PLAN_CENTER[0], 0, dimAnchors.h.z - PLAN_CENTER[1], vc), smooth(0.52, 0.58, p) * (1 - smooth(0.6, 0.64, p)));

    // jasne etapy: nagłówek przechodzi na ciemny tusz
    const light = p > 0.27 && p < 0.74;
    if (light !== lightMode) {
      lightMode = light;
      body.classList.toggle('planet-light', light);
    }
    const ch = p < 0.4 ? 0 : p < 0.6 ? 1 : p < 0.75 ? 2 : 3;
    if (ch !== lastChapter) {
      lastChapter = ch;
      chapters.forEach((c, i) => c.classList.toggle('is-current', i === ch));
    }

    // fotograficzny finał
    const photo = smooth(0.865, 0.915, p);
    stage.style.setProperty('--photo', photo.toFixed(3));
    stage.style.setProperty('--hero-text', smooth(0.91, 0.96, p).toFixed(3));
    stage.style.setProperty('--ui', (1 - smooth(0.88, 0.94, p)).toFixed(3));
    if (finalLayer) {
      const interactive = p > 0.95;
      if (interactive === finalLayer.hasAttribute('inert')) finalLayer.toggleAttribute('inert', !interactive);
    }
    if (progressEl) progressEl.value = p;

    if (photo < 0.999) renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function run() {
    if (state.running || !state.visible) return;
    state.running = true;
    clock.update();
    requestAnimationFrame(frame);
  }

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 52 : 38;
    camera.updateProjectionMatrix();
    // rzut z wymiarami mieści się w kadrze na każdym ekranie
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    aspectWide = camera.aspect >= 0.8;
    if (aspectWide) off.set(-3.4, 0, 0);
    else off.set(0, 0, 3.2);
    const needH = aspectWide ? Math.max(13.5, (17 + 6.8) / camera.aspect) : Math.max(13.5 + 6.4, 15 / camera.aspect);
    topM = needH / (2 * tan);
    L.eye.set(camera.aspect < 0.8 ? -4.2 : -5.0, 1.45, camera.aspect < 0.8 ? 3.5 : 3.4);
  }
  addEventListener('resize', resize);
  resize();

  // renderuj tylko w pobliżu ekranu
  new IntersectionObserver((entries) => {
    state.visible = entries[0].isIntersecting;
    if (state.visible) run();
    else state.running = false;
  }, { rootMargin: '200px 0px' }).observe(seq);

  /* ---------------- scroll + teksty (GSAP) ---------------- */
  const split = (el) => {
    const text = el.innerHTML.split(/<br\s*\/?>/i);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.innerHTML = text
      .map((line) => line.trim().split(/\s+/).map((w) => `<span class="pw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
      .join('<br>');
    return el.querySelectorAll('.pw > span');
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  tl.to('.planet-intro', { autoAlpha: 0, y: -40, duration: 0.05 }, 0.02);
  stage.querySelectorAll('.planet-caption').forEach((cap) => {
    const a = parseFloat(cap.dataset.from);
    const b = parseFloat(cap.dataset.to);
    const words = split(cap.querySelector('h2'));
    tl.set(cap, { autoAlpha: 1 }, a);
    tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 0.03, stagger: 0.004 }, a);
    tl.fromTo(cap.querySelector('p'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.025 }, a + 0.02);
    tl.to(cap, { autoAlpha: 0, y: -24, duration: 0.025 }, b);
    tl.set(cap, { y: 0 }, b + 0.026);
  });
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
    onLeave: () => body.classList.add('planet-past'),
    onEnterBack: () => body.classList.remove('planet-past'),
  });

  const skip = stage.querySelector('.planet-skip');
  if (skip) {
    skip.hidden = false;
    skip.addEventListener('click', () => {
      const end = seq.offsetTop + seq.offsetHeight - innerHeight;
      scrollTo({ top: end, behavior: 'auto' });
      finalLayer?.querySelector('a')?.focus({ preventScroll: true });
    });
  }
  // fokus na linku z hero kończy animację
  finalLayer?.addEventListener('focusin', () => {
    if (state.p < 0.95) scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'auto' });
  });

  /* ---------------- wejście ---------------- */
  const intro = stage.querySelector('.planet-intro');
  const introWords = split(intro.querySelector('h2'));
  ready.then(() => {
    loading?.setAttribute('hidden', '');
    run();
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to(state, { intro: 1, duration: 3.2, ease: 'power2.out' }, 0)
      .fromTo('.planet-canvas', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6 }, 0)
      .from('.header > *', { y: -16, autoAlpha: 0, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 0.5)
      .from(intro.querySelector('.planet-eyebrow'), { y: 16, autoAlpha: 0, duration: 1 }, 0.7)
      .from(introWords, { yPercent: 110, duration: 1.3, stagger: 0.07, ease: 'power4.out' }, 0.8)
      .from(['.planet-guide', '.planet-chapters', '.planet-skip', '.planet-classic'], { autoAlpha: 0, y: 10, duration: 1, stagger: 0.08, clearProps: 'opacity,visibility,transform' }, 1.6);
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
