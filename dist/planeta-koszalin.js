// Koszalin na mapie — wejście na stronę główną.
// Jasna Ziemia → zbliżenie nad Koszalin pokazany jak zwykła mapa (ląd, morze, Jamno, zieleń, drogi,
// podpisy) → biały błysk → jasne hero ze zdjęciem.
// Jasne niebo i Ziemia w beżach → chmury → Koszalin jako rysunek ulic → ciemne wnętrze (hero).
// Kopia planeta.js z jasną paletą; nocna wersja pozostaje w planeta.html.
// Czarne niebo z gwiazdami → nocna Ziemia w czerni i złocie → przelot przez chmury
// → Koszalin nocą z wysokości → rozmycie w fotograficzne hero.
// Natywny scroll, działa w obie strony.
import * as THREE from 'three';

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
const KOSZALIN = [54.19, 16.17];
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
/* Koszalin nocą: światła ulic, główne drogi, okoliczne wsie (w km)      */
/* x — wschód, z — południe (północ = -z), Bałtyk na północy             */
/* ------------------------------------------------------------------ */
function buildCityLights() {
  const pos = [];
  const col = [];
  const size = [];
  const amber = [1.0, 0.62, 0.26];
  const warm = [1.0, 0.82, 0.55];
  const cool = [0.86, 0.88, 1.0];
  const coastZ = (x) => -11.5 + Math.sin(x * 0.09) * 1.2 + Math.sin(x * 0.31) * 0.4;
  const push = (x, z, s, c) => {
    if (z < coastZ(x) + 0.2) return; // nic na morzu
    pos.push(x, 0.002 + rand() * 0.01, z);
    col.push(...c);
    size.push(s);
  };
  const pick = () => {
    const r = rand();
    return r < 0.72 ? amber : r < 0.95 ? warm : cool;
  };
  // zasięg miasta: nieregularny obrys, gęściej w środku
  const reach = (x, z) => {
    const ang = Math.atan2(z, x);
    const R = 3.3 * (1 + 0.32 * Math.sin(3 * ang + 1.1) + 0.18 * Math.sin(5 * ang + 2.3) + 0.12 * Math.sin(8 * ang));
    const r = Math.hypot(x * 0.95, z * 1.15);
    return clamp01((R - r) / (R * 0.55));
  };
  // dwie siatki ulic (stare miasto i osiedla), odcinki z przerwami jak kwartały
  const grids = [
    [0.32, 0.15, 6.0],
    [0.95, 0.19, 5.0],
  ];
  grids.forEach(([ang, spacing, half], gi) => {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (const dirSwap of [false, true]) {
      for (let line = -half; line <= half; line += spacing * (0.8 + rand() * 0.5)) {
        let on = rand() < 0.6;
        let next = 0.2 + rand() * 0.7;
        const bright = rand() < 0.12; // główne ulice
        for (let t = -half; t <= half; t += 0.042) {
          next -= 0.042;
          if (next <= 0) {
            on = rand() < (bright ? 0.85 : 0.55);
            next = 0.15 + rand() * 0.8;
          }
          if (!on) continue;
          const u = dirSwap ? line : t;
          const w = dirSwap ? t : line;
          const x = u * ca - w * sa;
          const z = u * sa + w * ca;
          // druga siatka tylko na wschodzie i południu (osiedla)
          if (gi === 1 && x + z * 0.4 < 0.6) continue;
          if (gi === 0 && x + z * 0.4 > 1.6 && rand() < 0.7) continue;
          const d = reach(x, z);
          if (rand() > d * (bright ? 1.0 : 0.8)) continue;
          push(x + (rand() - 0.5) * 0.012, z + (rand() - 0.5) * 0.012, bright ? 1.15 : 0.6 + rand() * 0.45, bright ? warm : pick());
        }
      }
    }
  });
  // śródmieście: kilka jaśniejszych placów i ulic handlowych
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 1.4) * 0.9;
    push(Math.cos(a) * d * 1.3, Math.sin(a) * d, 0.7 + rand() * 0.7, rand() < 0.5 ? warm : pick());
  }
  // drogi wylotowe (do Kołobrzegu, Słupska, Szczecinka, Bobolic, Mielna, Sianowa)
  const roads = [-2.6, -0.35, 0.55, 1.35, 1.95, 3.0, 3.75, 4.6, 5.4];
  roads.forEach((ang, k) => {
    let x = 0, z = 0;
    let a = ang;
    const len = 14 + rand() * 22;
    for (let t = 0; t < len; t += 0.08) {
      a += (rand() - 0.5) * 0.04;
      x += Math.cos(a) * 0.08;
      z += Math.sin(a) * 0.08;
      if (t > 3 && rand() > 0.55) continue;
      push(x + (rand() - 0.5) * 0.02, z + (rand() - 0.5) * 0.02, t < 3 ? 1.0 : 0.75, k % 3 ? amber : warm);
    }
  });
  // obwodnica
  for (let t = 0; t < Math.PI * 2; t += 0.012) {
    const r = 3.6 + Math.sin(t * 3) * 0.3;
    if (rand() > 0.7) push(Math.cos(t) * r, Math.sin(t) * r * 0.85, 0.8, amber);
  }
  // wsie i miasteczka w okolicy, Mielno nad samym morzem
  const towns = [[3.0, -10.6, 0.6, 220], [-12, -6, 0.5, 160], [9, 6, 0.45, 120], [-7, 9, 0.5, 140]];
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const d = 6 + rand() * 32;
    towns.push([Math.cos(a) * d, Math.sin(a) * d, 0.15 + rand() * 0.3, 20 + rand() * 70]);
  }
  towns.forEach(([cx, cz, r, n]) => {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.pow(rand(), 0.8) * r;
      push(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.6 + rand() * 0.5, pick());
    }
  });
  return { pos: new Float32Array(pos), col: new Float32Array(col), size: new Float32Array(size), coastZ };
}

/* ------------------------------------------------------------------ */
function start() {
  body.classList.add('planet-active', 'planet-ink', 'planet-daylight');
  gsap.registerPlugin(ScrollTrigger);

  const host = stage.querySelector('.planet-canvas');
  const loading = stage.querySelector('.planet-loading');
  const finalLayer = stage.querySelector('.planet-final');
  const pinLabel = stage.querySelector('.planet-pin');
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
  // słońce za planetą, z lewej: z przodu noc, złoty sierp na krawędzi; Koszalin po nocnej stronie
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
  pivot.quaternion.setFromUnitVectors(latLon(...KOSZALIN), K);
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

  /* ---------------- znacznik Koszalina ---------------- */
  const pin = new THREE.Group();
  pin.position.copy(K).multiplyScalar(1.00001);
  const pinMat = new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, depthWrite: false, toneMapped: false });
  const pinRing = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 64), pinMat);
  const pinPulse = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 64), pinMat.clone());
  [pinRing, pinPulse].forEach((m) => {
    m.rotation.x = -Math.PI / 2;
    pin.add(m);
  });
  scene.add(pin);

  /* ---------------- Koszalin z wysokości ---------------- */
  const site = new THREE.Group();
  site.position.copy(K).multiplyScalar(1.0000005);
  site.scale.setScalar(KM);
  scene.add(site);

  const city = buildCityLights();
  const cityGeo = new THREE.BufferGeometry();
  cityGeo.setAttribute('position', new THREE.BufferAttribute(city.pos, 3));
  cityGeo.setAttribute('color', new THREE.BufferAttribute(city.col, 3));
  cityGeo.setAttribute('aSize', new THREE.BufferAttribute(city.size, 1));
  const cityUniforms = { uTime: { value: 0 }, uDpr: { value: DPR }, uAlpha: { value: 0 }, uScale: { value: 1 } };
  const cityLights = new THREE.Points(
    cityGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      
      vertexColors: true,
      uniforms: cityUniforms,
      vertexShader: LOGDEPTH_V + /* glsl */ `
        attribute float aSize; uniform float uTime, uDpr, uScale; varying vec3 vC; varying float vA;
        void main(){
          vC = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = -mv.z;
          float ph = position.x * 13.7 + position.z * 7.3;
          float tw = 0.82 + 0.18 * sin(uTime * (1.5 + fract(ph) * 3.0) + ph * 10.0);
          // dalekie światła słabną w mgiełce
          vA = tw * exp(-dist / (uScale * 26.0));
          float ps = aSize * uDpr * uScale * 34.0 / max(dist, 1e-9);
          // daleko: mniejsze niż piksel, więc ciemniejsze zamiast większych
          vA *= clamp(ps, 0.5, 1.0);
          gl_PointSize = clamp(ps, 1.0, 5.0 * uDpr);
          gl_Position = projectionMatrix * mv;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + /* glsl */ `
        uniform float uAlpha; varying vec3 vC; varying float vA;
        void main(){
          #include <logdepthbuf_fragment>
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float core = exp(-d * d * 12.0);
          float halo = exp(-d * d * 4.0) * 0.04;
          float a = clamp((core * 1.6 + halo * 4.0) * vA * 1.7, 0.0, 1.0) * uAlpha;
          // grafit, co któryś punkt w brązie
          gl_FragColor = vec4(mix(vec3(0.17, 0.14, 0.11), vec3(0.6, 0.45, 0.26), step(0.9, vC.b)), a);
          #include <colorspace_fragment>
        }`,
    })
  );
  cityLights.frustumCulled = false;
  site.add(cityLights);
  cityLights.visible = false; // zastąpione prawdziwym planem miasta

  /* ---------------- plan Koszalina z OpenStreetMap (metry → km) ---------------- */
  const map = new THREE.Group();
  map.scale.setScalar(0.001);
  site.add(map);
  const mapMats = [];
  const fillMat = (hex, y) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    m.userData = { k: 1, y };
    mapMats.push(m);
    return m;
  };
  const lineMat = (hex, k) => {
    const m = new THREE.LineBasicMaterial({ color: new THREE.Color(hex), transparent: true, opacity: 0, depthWrite: false });
    m.userData = { k };
    mapMats.push(m);
    return m;
  };
  const fills = (polys, mat, y, order) => {
    const shapes = [];
    polys.forEach((c) => {
      const n = c.length / 2;
      if (n < 3) return;
      // zamknięte obrysy tylko
      if (Math.abs(c[0] - c[c.length - 2]) + Math.abs(c[1] - c[c.length - 1]) > 6) return;
      const pts = [];
      for (let i = 0; i < c.length; i += 2) pts.push(new THREE.Vector2(c[i], c[i + 1]));
      shapes.push(new THREE.Shape(pts));
    });
    if (!shapes.length) return;
    const g = new THREE.ShapeGeometry(shapes);
    g.rotateX(Math.PI / 2); // (x, y) kształtu → (x, z) mapy
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.y = y;
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    map.add(mesh);
  };
  const lines = (polys, mat, y, order) => {
    const pos = [];
    polys.forEach((c) => {
      for (let i = 0; i < c.length - 2; i += 2) pos.push(c[i], y, c[i + 1], c[i + 2], y, c[i + 3]);
    });
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, mat);
    l.renderOrder = order;
    l.frustumCulled = false;
    map.add(l);
  };
  fetch('assets/planeta/koszalin-osm.json')
    .then((r) => r.json())
    .then((d) => {
      // morze: wielokąt z linii brzegowej domknięty daleko na północy
      const coast = (d.coast || []).map((c) => {
        const pts = [];
        for (let i = 0; i < c.length; i += 2) pts.push([c[i], c[i + 1]]);
        return pts;
      }).flat().sort((a, b) => a[0] - b[0]);
      if (coast.length > 2) {
        const sea = [...coast.flat(), coast[coast.length - 1][0] + 60000, coast[coast.length - 1][1], coast[coast.length - 1][0] + 60000, -90000, coast[0][0] - 60000, -90000, coast[0][0] - 60000, coast[0][1], coast[0][0], coast[0][1]];
        fills([sea], fillMat('#cdd6d6', 1), 0.3, 1);
      }
      fills(d.green || [], fillMat('#dcdcc8', 0.85), 0.4, 1);
      fills(d.water || [], fillMat('#c3cfd1', 1), 0.6, 2);
      lines((d.water || []), lineMat('#9fb0b4', 0.8), 0.7, 3);
      lines(d.r3 || [], lineMat('#d9cfc0', 0.55), 1.4, 5);
      lines(d.r2 || [], lineMat('#b9ab97', 0.9), 1.5, 6);
      lines(d.rail || [], lineMat('#8f877b', 0.6), 1.5, 6);
      lines([...(d.r1 || []), ...(d.r0 || [])], lineMat('#a77a45', 1), 1.6, 7);
      lines(d.coast || [], lineMat('#8fa1a6', 1), 1.6, 7);
    })
    .catch(() => {});

  // łuna nad miastem i ciemny teren z linią brzegu
  const groundUniforms = { uAlpha: { value: 0 }, uAmber: { value: C.amber } };
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(80, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: groundUniforms,
      vertexShader: LOGDEPTH_V + /* glsl */ `
        varying vec2 vP;
        void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LOGDEPTH_F + NOISE + /* glsl */ `
        uniform float uAlpha; uniform vec3 uAmber; varying vec2 vP;
        void main(){
          #include <logdepthbuf_fragment>
          // płaszczyzna leży w XZ: vP.x = wschód, -vP.y = południe
          float x = vP.x, z = -vP.y;
          float coast = -11.5 + sin(x * 0.09) * 1.2 + sin(x * 0.31) * 0.4;
          float sea = smoothstep(coast + 0.3, coast - 0.3, z);
          float r = length(vec2(x, z));
          vec3 land = vec3(0.94, 0.91, 0.86) * (0.985 + 0.03 * fbm2(vec2(x, z) * 0.25));
          vec3 water = vec3(0.83, 0.82, 0.79);
          vec3 col = land;
          col *= 1.0 - 0.04 * exp(-r * r / 18.0);
          float edge = 1.0 - smoothstep(55.0, 80.0, r);
          gl_FragColor = vec4(col, uAlpha * edge);
          #include <colorspace_fragment>
        }`,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  site.add(ground);

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
  const END_KM = new THREE.Vector3(0, 15, 6.5);
  let wide = true;
  const local = (x, y, z, out) => out.set(x, y, z).multiplyScalar(KM).add(K);
  const bez = (a, b, c, t, out) => out.copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(c, t * t);

  function cameraAt(p, intro) {
    if (p < 0.5) {
      // z kosmosu nad Koszalin
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
      // nad mapę Koszalina, potem bardzo powolny najazd
      const t = easeInOut(smooth(0.5, 0.74, p));
      const drift = smooth(0.72, 0.9, p);
      bez(vb.set(0, TOP_KM, 0.01), vc.set(0, 22, 2), END_KM, t, camLocal);
      camLocal.z -= drift * 1.6;
      camLocal.y -= drift * 1.6;
      local(camLocal.x, camLocal.y, camLocal.z, camPos);
      vb.set(0, 0, 0).lerp(va.set(0, 0, -3.6), t);
      vb.z -= drift * 0.6;
      local(vb.x, vb.y, vb.z, camTgt);
      camUp.copy(NORTH).lerp(UP, smooth(0.05, 0.6, t)).normalize();
    }
  }

  /* ---------------- podpisy na mapie (km: x — wschód, z — południe) ---------------- */
  const MAP_LABELS = [
    ['Koszalin', 0, 0, 'city'],
    ['Morze Bałtyckie', 1.5, -11.5, 'sea'],
    ['Jezioro Jamno', -2.6, -7.1, 'water'],
    ['Mielno', -7.2, -7.9, 'town'],
    ['Sianów', 7.5, -3.9, 'town'],
    ['Góra Chełmska', 2.2, 1.6, 'hill'],
  ];
  const labelLayer = stage.querySelector('.planet-maplabels');
  const labelEls = MAP_LABELS.map(([name, , , kind]) => {
    const el = document.createElement('span');
    el.className = 'planet-maplabel is-' + kind;
    el.textContent = name;
    labelLayer?.appendChild(el);
    return el;
  });
  const labelV = new THREE.Vector3();
  function placeLabels(p) {
    if (!labelLayer) return;
    const a = smooth(0.52, 0.6, p) * (1 - smooth(0.78, 0.82, p));
    MAP_LABELS.forEach(([, x, z], i) => {
      local(x, 0, z, labelV);
      place(labelEls[i], labelV, a);
    });
  }

  /* ---------------- stan ---------------- */
  const state = { target: 0, p: 0, intro: 0, idle: 0.9, running: false, visible: true };
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

  const proj = new THREE.Vector3();
  function place(el, worldVec, alpha) {
    if (!el) return;
    proj.copy(worldVec).project(camera);
    const x = (proj.x * 0.5 + 0.5) * host.clientWidth + host.offsetLeft;
    const y = (-proj.y * 0.5 + 0.5) * host.clientHeight + host.offsetTop;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.opacity = alpha.toFixed(3);
  }

  const clock = new THREE.Timer();
  if (location.hash === '#debug') window.__planet = { state, camera, K, KM }; // tylko do podglądu stanu kamery
  let lastChapter = -1;
  const toDay = true; // jasne intro: ciemny tusz do momentu wejścia w ciemne wnętrze
  let dayMode = false;

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

    cameraAt(p, state.intro);
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
    const cityA = smooth(0.28, 0.44, p);
    earthUniforms.uCity.value = cityA;
    borderMat.opacity = (0.22 + 0.4 * smooth(0.05, 0.25, p)) * (1 - smooth(0.36, 0.5, p)) * state.intro;
    earthUniforms.uLightsFade.value = 1 - smooth(0.004, 0.02, alt);
    earthUniforms.uRim.value = smooth(0.03, 0.3, alt);
    earthUniforms.uCloudShift.value = time * 0.0015;
    halo.material.uniforms.uFade.value = smooth(0.08, 0.35, alt) * state.intro;
    earth.visible = halo.visible = p < 0.7;

    // znacznik
    const pinA = smooth(0.2, 0.28, p) * (1 - smooth(0.42, 0.48, p));
    pin.visible = pinA > 0.001;
    if (pin.visible) {
      pin.scale.setScalar(alt * 0.03);
      pinMat.opacity = pinA;
      const pulse = (time * 0.6) % 1;
      pinPulse.scale.setScalar(1 + pulse * 1.6);
      pinPulse.material.opacity = pinA * (1 - pulse) * 0.8;
    }
    place(pinLabel, K, pinA);

    // miasto i chmury
    site.visible = p > 0.26;
    cityUniforms.uAlpha.value = cityA;
    mapMats.forEach((m) => (m.opacity = cityA * m.userData.k));
    cityUniforms.uTime.value = time;
    cityUniforms.uScale.value = KM;
    groundUniforms.uAlpha.value = cityA;
    const cloudFade = 0;
    cloudShared.uFade.value = cloudFade;
    cloudShared.uTime.value = time;
    const camKm = va.copy(camPos).sub(K).divideScalar(KM);
    cloudShared.uCam.value.copy(camKm);
    clouds.forEach((c) => (c.visible = cloudFade > 0.001));
    let mist = 0;
    if (cloudFade > 0.01) CLOUD_LAYERS.forEach((y) => (mist = Math.max(mist, Math.exp(-((camKm.y - y) ** 2) / 1.4))));
    // biały błysk: mapa gaśnie w biel, pod nią pojawia się zdjęcie hero
    const flash = smooth(0.78, 0.84, p) * (1 - smooth(0.86, 0.93, p));
    if (mistEl) mistEl.style.opacity = flash.toFixed(3);

    // rozdziały
    const ch = p < 0.3 ? 0 : p < 0.5 ? 1 : p < 0.8 ? 2 : 3;
    if (ch !== lastChapter) {
      lastChapter = ch;
      chapters.forEach((c, i) => c.classList.toggle('is-current', i === ch));
    }

    // rozmycie i przejście w hero
    const blur = smooth(0.76, 0.84, p) * 0.4;
    const photo = smooth(0.83, 0.85, p);
    stage.style.setProperty('--blur', `${(blur * 22).toFixed(2)}px`);
    stage.style.setProperty('--zoom', (1 + blur * 0.08).toFixed(4));
    stage.style.setProperty('--photo', photo.toFixed(3));
    // wariant „od nocy do dnia”: po rozjaśnieniu nagłówek przechodzi na ciemny tusz
    if (toDay) {
      const day = photo > 0.55;
      if (day !== dayMode) {
        dayMode = day;
        body.classList.toggle('planet-ink', !day);
      }
    }
    stage.style.setProperty('--hero-text', smooth(0.89, 0.95, p).toFixed(3));
    stage.style.setProperty('--ui', (1 - smooth(0.8, 0.85, p)).toFixed(3));
    placeLabels(p);
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
    // płótno jest odrobinę większe od sceny, żeby rozmyte krawędzie nie odsłaniały tła
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    wide = camera.aspect >= 0.8;
    camera.fov = wide ? 38 : 54;
    camera.updateProjectionMatrix();
  }
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
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.innerHTML = lines
      .map((line) => line.trim().split(/\s+/).map((w) => `<span class="pw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
      .join('<br>');
    return el.querySelectorAll('.pw > span');
  };

  gsap.set(stage.querySelectorAll('.planet-caption.is-center'), { xPercent: -50, yPercent: -50 });
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
    onLeave: () => body.classList.add('planet-past'),
    onEnterBack: () => body.classList.remove('planet-past'),
  });

  const skip = stage.querySelector('.planet-skip');
  if (skip) {
    skip.hidden = false;
    skip.addEventListener('click', () => {
      scrollTo({ top: seq.offsetTop + seq.offsetHeight - innerHeight, behavior: 'auto' });
      finalLayer?.querySelector('a')?.focus({ preventScroll: true });
    });
  }
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
