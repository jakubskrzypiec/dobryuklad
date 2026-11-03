// DOBRY UKŁAD — strona główna nocą.
// Gwiazdy w tle, wejścia nagłówków, karty z głębią, orbita projektów i globus z miastami.
import * as THREE from 'three';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const isSmall = matchMedia('(max-width: 760px)').matches;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const GOLD = new THREE.Color('#d9a75a');
const AMBER = new THREE.Color('#ffb15a');
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function latLon(lat, lon, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).multiplyScalar(r);
}
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
// pętla renderowania tylko, gdy element jest w pobliżu ekranu
function whenVisible(el, onTick) {
  let visible = false;
  let running = false;
  const clock = new THREE.Timer();
  const loop = () => {
    if (!visible) {
      running = false;
      return;
    }
    clock.update();
    onTick(Math.min(clock.getDelta(), 0.05), reduceMotion ? 0 : clock.getElapsed());
    requestAnimationFrame(loop);
  };
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !running) {
      running = true;
      clock.update();
      requestAnimationFrame(loop);
    }
  }, { rootMargin: '150px 0px' }).observe(el);
}

/* ================================================================== */
/* 1. Gwiazdy w tle całej strony (2D, trzy warstwy paralaksy)           */
/* ================================================================== */
function initStars() {
  const canvas = document.querySelector('.noc-stars');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  let W = 0, H = 0, stars = [];
  const build = () => {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / (isSmall ? 2600 : 2100));
    stars = Array.from({ length: n }, () => {
      const layer = Math.random();
      const g = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.35 + Math.pow(Math.random(), 4) * 1.5 + layer * 0.3,
        depth: 0.02 + layer * 0.1,
        tw: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.8,
        c: g < 0.15 ? [217, 167, 90] : g < 0.35 ? [255, 226, 184] : [236, 234, 255],
      };
    });
  };
  build();
  addEventListener('resize', build);
  let shooting = null;
  let nextShot = 4 + Math.random() * 6;
  let last = performance.now();
  const draw = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    const sy = scrollY;
    for (const s of stars) {
      const y = (((s.y - sy * s.depth) % H) + H) % H;
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw));
      ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${(a * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // spadająca gwiazda co kilka sekund
    nextShot -= dt;
    if (!shooting && nextShot < 0) {
      shooting = { x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.4, life: 0 };
      nextShot = 6 + Math.random() * 9;
    }
    if (shooting) {
      shooting.life += dt;
      const k = shooting.life / 0.9;
      const x = shooting.x - k * 320;
      const y = shooting.y + k * 140;
      const g = ctx.createLinearGradient(x, y, x + 90, y - 40);
      g.addColorStop(0, `rgba(255,226,184,${(1 - k) * 0.9})`);
      g.addColorStop(1, 'rgba(255,226,184,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 90, y - 40);
      ctx.stroke();
      if (k >= 1) shooting = null;
    }
    if (!document.hidden) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      last = performance.now();
      requestAnimationFrame(draw);
    }
  });
}

/* ================================================================== */
/* 2. Wejścia nagłówków i kart                                          */
/* ================================================================== */
function splitWords(el) {
  if (el.dataset.split) return el.querySelectorAll('.nw > span');
  el.dataset.split = '1';
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const lines = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = lines
    .map((l) => l.trim().split(/\s+/).filter(Boolean).map((w) => `<span class="nw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
    .join('<br>');
  el.setAttribute('aria-label', label);
  return el.querySelectorAll('.nw > span');
}

function initReveals() {
  if (!gsap || reduceMotion) return;
  const heads = document.querySelectorAll('main .home-section h2, .home-social h2, .orbit-copy h2, .globe-copy h2');
  heads.forEach((h) => {
    const words = splitWords(h);
    gsap.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
  });
  gsap.utils.toArray('main .home-kicker, .globe-cities li, .globe-note').forEach((k) => {
    gsap.fromTo(k, { autoAlpha: 0, y: 14, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: k, start: 'top 90%', once: true } });
  });
  const groups = [
    ['.home-offer-grid', '.home-offer-card'],
    ['.home-reviews-grid', 'article'],
    ['.course-grid', '.course-card'],
    ['.social-profiles', '.social-profile'],
  ];
  groups.forEach(([wrap, item]) => {
    document.querySelectorAll(wrap).forEach((w) => {
      const items = w.querySelectorAll(item);
      gsap.fromTo(items, { autoAlpha: 0, y: 50, rotateX: 8, transformPerspective: 900 }, { autoAlpha: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, clearProps: 'transform', scrollTrigger: { trigger: w, start: 'top 82%', once: true } });
    });
  });
}

// karty lekko pochylają się za kursorem
function initTilt() {
  if (!gsap || reduceMotion || !finePointer) return;
  document.querySelectorAll('.home-offer-card, .project-slide, .course-card, .studio-photo-placeholder').forEach((el) => {
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 7);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

/* ================================================================== */
/* Wspólne: nocna Ziemia w czerni i złocie                              */
/* ================================================================== */
const LD_V = '#include <common>\n#include <logdepthbuf_pars_vertex>\n';
const LD_F = '#include <common>\n#include <logdepthbuf_pars_fragment>\n';
function earthMaterial(loader, sunDir) {
  const t = (n, srgb) => {
    const x = loader.load(`assets/planeta/${n}`);
    if (srgb) x.colorSpace = THREE.SRGBColorSpace;
    x.anisotropy = 4;
    x.wrapS = THREE.RepeatWrapping;
    return x;
  };
  return new THREE.ShaderMaterial({
    uniforms: {
      uDay: { value: t('earth-day-2048.jpg', true) },
      uNight: { value: t('earth-night-4096.jpg', true) },
      uPack: { value: t('earth-pack-2048.jpg', false) },
      uSun: { value: sunDir },
      uGold: { value: GOLD },
      uAmber: { value: AMBER },
      uTime: { value: 0 },
    },
    vertexShader: LD_V + /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: LD_F + /* glsl */ `
      uniform sampler2D uDay, uNight, uPack; uniform vec3 uSun, uGold, uAmber; uniform float uTime;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        #include <logdepthbuf_fragment>
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        float ndl = dot(n, uSun);
        float dayF = smoothstep(-0.12, 0.35, ndl);
        vec4 pk = texture2D(uPack, vUv);
        float land = smoothstep(0.3, 0.7, pk.g);
        float cl = texture2D(uPack, vUv + vec2(uTime * 0.0015, 0.0)).b;
        vec3 day = texture2D(uDay, vUv).rgb;
        float lum = dot(day, vec3(0.2126, 0.7152, 0.0722));
        vec3 sepia = mix(vec3(0.02, 0.014, 0.008), vec3(0.62, 0.47, 0.29), smoothstep(0.02, 0.5, lum));
        sepia = mix(vec3(0.008, 0.007, 0.006) + uGold * 0.015, sepia, land);
        vec3 col = sepia * dayF * 0.95;
        col = mix(col, vec3(0.8, 0.7, 0.56) * dayF, cl * 0.75);
        vec3 hv = normalize(uSun + v);
        col += uGold * pow(max(dot(n, hv), 0.0), 70.0) * (1.0 - land) * (1.0 - cl) * dayF * 1.4;
        vec3 night = texture2D(uNight, vUv).rgb;
        float nl = dot(night, vec3(0.333));
        col += mix(uAmber, vec3(1.0, 0.9, 0.7), smoothstep(0.5, 1.0, nl)) * pow(nl, 1.4) * 2.6 * (1.0 - dayF) * (1.0 - cl * 0.65);
        // kontur lądu: subtelna złota linia brzegowa
        float coast = 1.0 - smoothstep(0.0, fwidth(pk.g) * 1.5 + 1e-4, abs(pk.g - 0.5));
        col += uGold * coast * 0.1;
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        float sunSide = smoothstep(-0.5, 0.4, ndl);
        col += mix(uAmber * 0.18, uGold * 1.1, sunSide) * fres * (0.25 + sunSide);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
function goldHalo(radius, sunDir, strength = 1) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uSun: { value: sunDir }, uGold: { value: GOLD }, uK: { value: strength } },
      vertexShader: LD_V + /* glsl */ `
        varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: LD_F + /* glsl */ `
        uniform vec3 uSun, uGold; uniform float uK; varying vec3 vN; varying vec3 vW;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 v = normalize(cameraPosition - vW);
          float rim = pow(clamp(0.82 + dot(normalize(vN), v), 0.0, 1.0), 6.0);
          float s = smoothstep(-0.6, 0.6, dot(normalize(vW), uSun));
          gl_FragColor = vec4(uGold * rim * (0.15 + 1.2 * s * s) * uK, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
}

/* ================================================================== */
/* 3. Orbita projektów: kadry wnętrz krążą wokół złotej planety          */
/* ================================================================== */
function initOrbit() {
  const section = document.querySelector('.orbit-interlude');
  const host = section && section.querySelector('.orbit-canvas');
  if (!host) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const sunDir = new THREE.Vector3(-0.8, 0.35, -0.5).normalize();
  const loader = new THREE.TextureLoader();

  const center = new THREE.Group();
  scene.add(center);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), earthMaterial(loader, sunDir));
  planet.rotation.set(0.35, -1.2, 0);
  center.add(planet, goldHalo(1.05, sunDir, 0.9));

  const images = ['hero-v2.webp', 'dining-v2.webp', 'bathroom-v2.webp', 'interior-linen-v2.webp', 'about-hero-v2.webp', 'portfolio-divider-v3.webp', 'about-contact-v2.webp', 'offer-complete-v1.webp'];
  const ring = new THREE.Group();
  ring.rotation.set(0.42, 0, -0.18);
  center.add(ring);
  const R = 2.85;
  const frames = images.map((name, i) => {
    const tex = loader.load(`assets/${name}`, (t) => {
      const a = t.image.width / t.image.height;
      mesh.scale.set(a > 1 ? 1 : a, a > 1 ? 1 / a : 1, 1);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), mat);
    const border = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.35, 1.35)), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55 }));
    mesh.add(border);
    const holder = new THREE.Group();
    holder.add(mesh);
    holder.userData = { a: (i / images.length) * Math.PI * 2, mat, border };
    ring.add(holder);
    return holder;
  });
  // cienka złota orbita
  const orbitPts = Array.from({ length: 181 }, (_, k) => {
    const a = (k / 180) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
  });
  ring.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPts), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.25 })));

  let progress = 0;
  if (ScrollTrigger) {
    ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onUpdate: (s) => (progress = s.progress) });
  }
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w / h > 0.9;
    center.position.set(wide ? 2.2 : 0, wide ? -0.1 : 1.4, 0);
    camera.position.set(0, 1.2, wide ? 10.5 : 13);
    camera.lookAt(0, 0.2, 0);
  };
  addEventListener('resize', resize);
  resize();
  const tmp = new THREE.Vector3();
  let ps = 0;
  whenVisible(section, (dt, t) => {
    ps += (progress - ps) * Math.min(1, dt * 4);
    planet.material.uniforms.uTime.value = t;
    planet.rotation.y = -1.2 + t * 0.03 + ps * 0.8;
    const spinA = t * 0.06 + ps * 2.6;
    frames.forEach((f) => {
      const a = f.userData.a + spinA;
      f.position.set(Math.cos(a) * R, Math.sin(a * 2) * 0.12, Math.sin(a) * R);
      // kadry zawsze zwrócone do widza
      f.quaternion.copy(ring.quaternion).invert();
      f.getWorldPosition(tmp);
      const front = smooth(-3.5, 3.5, tmp.z);
      f.userData.mat.opacity = 0.35 + 0.65 * front;
      f.userData.mat.color.setScalar(0.45 + 0.55 * front);
      f.userData.border.material.opacity = 0.2 + 0.5 * front;
      f.scale.setScalar(0.85 + 0.3 * front);
    });
    renderer.render(scene, camera);
  });
}

/* ================================================================== */
/* 4. Globus: Koszalin i miasta realizacji, złote łuki                  */
/* ================================================================== */
const CITIES = [
  ['Koszalin', 54.19, 16.17],
  ['Gdańsk', 54.35, 18.65],
  ['Szczecin', 53.43, 14.55],
  ['Poznań', 52.41, 16.93],
  ['Wrocław', 51.11, 17.03],
  ['Warszawa', 52.23, 21.01],
  ['Kraków', 50.06, 19.94],
];
// przesunięcie podpisów (px), żeby się nie nakładały; ujemne x = podpis po lewej
const LABEL_OFFSET = [
  [-14, -34],
  [8, -16],
  [-14, 4],
  [8, -6],
  [-14, 0],
  [8, -6],
  [8, -6],
];
function initGlobe() {
  const section = document.querySelector('.globe-interlude');
  const host = section && section.querySelector('.globe-canvas');
  if (!host) return;
  const labels = [...section.querySelectorAll('.globe-labels span')];
  labels.forEach((el, i) => el.classList.toggle('is-left', LABEL_OFFSET[i][0] < 0));
  const labelBox = section.querySelector('.globe-labels');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
  const sunDir = new THREE.Vector3(-0.2, 0.5, -1).normalize();
  const loader = new THREE.TextureLoader();

  const globe = new THREE.Group();
  scene.add(globe);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 192, 128), earthMaterial(loader, sunDir));
  globe.add(earth, goldHalo(1.04, sunDir, 1.1));

  // znaczniki i łuki
  const pts = CITIES.map(([, la, lo]) => latLon(la, lo, 1.002));
  const home = pts[0];
  const markerMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false });
  const markers = pts.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(p);
    g.lookAt(p.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(i === 0 ? 0.0042 : 0.003, 24), markerMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), markerMat.clone());
    ring.scale.setScalar(i === 0 ? 0.011 : 0.0075);
    g.add(dot, ring);
    globe.add(g);
    return { g, ring, base: ring.scale.x };
  });
  const arcs = pts.slice(1).map((p) => {
    const N = 80;
    const a = home.clone().normalize();
    const b = p.clone().normalize();
    const angle = a.angleTo(b);
    const arr = Array.from({ length: N + 1 }, (_, k) => {
      const t = k / N;
      const v = new THREE.Vector3().copy(a).multiplyScalar(Math.sin((1 - t) * angle) / Math.sin(angle)).addScaledVector(b, Math.sin(t * angle) / Math.sin(angle));
      return v.multiplyScalar(1.002 + Math.sin(Math.PI * t) * angle * 0.35);
    });
    const geo = new THREE.BufferGeometry().setFromPoints(arr);
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.85 }));
    globe.add(line);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.86, 0.6) }));
    globe.add(spark);
    return { line, geo, arr, N, spark };
  });

  // Polska zwrócona do kamery, północ w górę
  const focus = latLon(52.4, 18.2);
  const qFocus = new THREE.Quaternion().setFromUnitVectors(focus.clone().normalize(), new THREE.Vector3(0, 0, 1));
  const tilt = new THREE.Quaternion();
  const north = new THREE.Vector3(0, 1, 0).applyQuaternion(qFocus);
  // obrót wokół osi widoku, by biegun północny wskazywał w górę ekranu
  const roll = Math.atan2(north.x, north.y);
  tilt.setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll);
  const baseQ = tilt.multiply(qFocus);
  globe.quaternion.copy(baseQ);

  let progress = 0;
  if (ScrollTrigger) {
    ScrollTrigger.create({ trigger: section, start: 'top 85%', end: 'bottom 40%', onUpdate: (s) => (progress = reduceMotion ? 1 : s.progress) });
  }
  if (reduceMotion || !ScrollTrigger) progress = 1;

  let wide = true;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    wide = w / h > 0.9;
    camera.position.set(0, 0, wide ? 2.15 : 2.0);
    // na szerokim ekranie globus siedzi w prawej połowie
    if (wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  section.addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
  const proj = new THREE.Vector3();
  const wp = new THREE.Vector3();
  const sway = new THREE.Quaternion();
  const euler = new THREE.Euler();
  let ps = 0;

  whenVisible(section, (dt, t) => {
    ps += (progress - ps) * Math.min(1, dt * 3);
    mouseS.lerp(mouse, Math.min(1, dt * 2));
    earth.material.uniforms.uTime.value = t;
    // lekki obrót: scroll i kursor
    euler.set(mouseS.y * 0.12 + (0.5 - ps) * 0.1, mouseS.x * 0.18 + (ps - 0.5) * 0.35, 0);
    sway.setFromEuler(euler);
    globe.quaternion.copy(sway).multiply(baseQ);
    // łuki rysują się po kolei
    arcs.forEach((a, i) => {
      const k = smooth(0.12 + i * 0.07, 0.42 + i * 0.07, ps);
      a.geo.setDrawRange(0, Math.floor(k * a.N) + 1);
      a.line.visible = k > 0.001;
      const tt = ((t * 0.35 + i * 0.17) % 1) * k;
      a.spark.position.copy(a.arr[Math.floor(tt * a.N)]);
      a.spark.visible = k > 0.98;
    });
    markers.forEach((m, i) => {
      const pulse = (t * 0.5 + i * 0.13) % 1;
      m.ring.scale.setScalar(m.base * (1 + pulse * 1.4));
      m.ring.material.opacity = (1 - pulse) * 0.8 * smooth(0.05, 0.2, ps);
    });
    renderer.render(scene, camera);
    // podpisy miast
    const hostRect = host.getBoundingClientRect();
    const boxRect = labelBox.getBoundingClientRect();
    labels.forEach((el, i) => {
      markers[i].g.getWorldPosition(wp);
      const facing = wp.clone().normalize().dot(proj.copy(camera.position).sub(wp).normalize());
      proj.copy(wp).project(camera);
      const x = (proj.x * 0.5 + 0.5) * hostRect.width + hostRect.left - boxRect.left;
      const y = (-proj.y * 0.5 + 0.5) * hostRect.height + hostRect.top - boxRect.top;
      const show = i === 0 ? smooth(0.02, 0.15, ps) : smooth(0.3 + (i - 1) * 0.07, 0.45 + (i - 1) * 0.07, ps);
      const [dx, dy] = LABEL_OFFSET[i];
      el.style.transform = `translate3d(${(x + dx).toFixed(1)}px, ${(y + dy).toFixed(1)}px, 0)`;
      el.style.opacity = (show * smooth(0.05, 0.2, facing)).toFixed(3);
    });
  });
}

/* ================================================================== */
initStars();
initReveals();
initTilt();
if (webglAvailable()) {
  initOrbit();
  initGlobe();
}
addEventListener('load', () => ScrollTrigger && ScrollTrigger.refresh());
