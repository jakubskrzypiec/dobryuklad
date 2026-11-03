// DOBRY UKŁAD — „od nocy do dnia”: ruch na jasnej stronie i jasny globus miast realizacji.
import * as THREE from 'three';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

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

/* ---------------- wejścia nagłówków i treści ---------------- */
function splitWords(el) {
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((l) => l.trim().split(/\s+/).filter(Boolean).map((w) => `<span class="nw" aria-hidden="true"><span>${w}</span></span>`).join(' '))
    .join('<br>');
  el.setAttribute('aria-label', label);
  return el.querySelectorAll('.nw > span');
}
function initReveals() {
  if (!gsap || reduceMotion) return;
  document.querySelectorAll('main .home-section h2, .project-interlude h2, .globe-copy h2, .home-social h2').forEach((h) => {
    const words = splitWords(h);
    gsap.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  // przerywnik portfolio: zdjęcie odsłania się i powoli przesuwa
  const photo = document.querySelector('.project-interlude-photo');
  if (photo) {
    gsap.fromTo(photo, { clipPath: 'inset(8% 6% 8% 6%)', scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, ease: 'none', scrollTrigger: { trigger: '.project-interlude', start: 'top bottom', end: 'center center', scrub: 0.6 } });
  }
  const groups = [['.home-offer-grid', '.home-offer-card'], ['.home-reviews-grid', 'article'], ['.course-grid', '.course-card'], ['.globe-cities', 'li']];
  groups.forEach(([wrap, item]) => {
    document.querySelectorAll(wrap).forEach((w) => {
      gsap.fromTo(w.querySelectorAll(item), { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, clearProps: 'transform', scrollTrigger: { trigger: w, start: 'top 85%', once: true } });
    });
  });
}

/* ---------------- jasny globus: Koszalin i miasta realizacji ---------------- */
const CITIES = [
  ['Koszalin', 54.19, 16.17],
  ['Gdańsk', 54.35, 18.65],
  ['Szczecin', 53.43, 14.55],
  ['Poznań', 52.41, 16.93],
  ['Wrocław', 51.11, 17.03],
  ['Warszawa', 52.23, 21.01],
  ['Kraków', 50.06, 19.94],
];
const LABEL_OFFSET = [[-14, -34], [8, -16], [-14, 4], [8, -6], [-14, 0], [8, -6], [8, -6]];

function initGlobe() {
  const section = document.querySelector('.globe-interlude');
  const host = section && section.querySelector('.globe-canvas');
  if (!host) return;
  const labels = [...section.querySelectorAll('.globe-labels span')];
  labels.forEach((el, i) => el.classList.toggle('is-left', LABEL_OFFSET[i][0] < 0));
  const labelBox = section.querySelector('.globe-labels');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
  const lightDir = new THREE.Vector3(-0.5, 0.7, 0.6).normalize();

  const pack = new THREE.TextureLoader().load('assets/planeta/earth-pack-2048.jpg');
  pack.anisotropy = 4;
  const globe = new THREE.Group();
  scene.add(globe);
  // papierowa mapa: beżowy ląd z poziomicami, jasne morze, grafitowa linia brzegu
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 192, 128),
    new THREE.ShaderMaterial({
      uniforms: {
        uPack: { value: pack },
        uLight: { value: lightDir },
        uLand: { value: new THREE.Color('#e3d8c8') },
        uSea: { value: new THREE.Color('#f6f2ec') },
        uInk: { value: new THREE.Color('#2b2620') },
        uGold: { value: new THREE.Color('#b8924f') },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uPack; uniform vec3 uLight, uLand, uSea, uInk, uGold;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        float iso(float x){ float fw = fwidth(x); float d = abs(fract(x - 0.5) - 0.5);
          return (1.0 - smoothstep(0.0, fw * 1.3, d)) * (1.0 - smoothstep(0.1, 0.32, fw)); }
        void main(){
          vec4 pk = texture2D(uPack, vUv);
          float land = smoothstep(0.3, 0.7, pk.g);
          vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
          vec3 col = mix(uSea, uLand, land);
          col = mix(col, uInk, iso(pk.r * 12.0) * 0.12 * land);
          float coast = 1.0 - smoothstep(0.0, fwidth(pk.g) * 1.5 + 1e-4, abs(pk.g - 0.5));
          col = mix(col, uInk, coast * 0.55);
          // delikatne cieniowanie kuli i ciemniejsza krawędź
          float diff = max(dot(n, uLight), 0.0);
          col *= 0.86 + 0.14 * diff;
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
          col = mix(col, uLand * 0.82, fres * 0.6);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  globe.add(earth);
  // siatka południków i równoleżników
  const grat = new THREE.Group();
  const gratMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#b9ab98'), transparent: true, opacity: 0.35 });
  for (let lat = -60; lat <= 75; lat += 15) {
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 121 }, (_, k) => latLon(lat, -180 + k * 3, 1.001))), gratMat));
  }
  for (let lon = -180; lon < 180; lon += 15) {
    grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 61 }, (_, k) => latLon(-80 + k * (160 / 60), lon, 1.001))), gratMat));
  }
  globe.add(grat);

  const GOLD = new THREE.Color('#a77f3d');
  const pts = CITIES.map(([, la, lo]) => latLon(la, lo, 1.002));
  const home = pts[0];
  const markerMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, depthWrite: false });
  const inkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#1c1915') });
  const markers = pts.map((p, i) => {
    const g = new THREE.Group();
    g.position.copy(p);
    g.lookAt(p.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(i === 0 ? 0.0045 : 0.0032, 24), i === 0 ? inkMat : markerMat);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48), markerMat.clone());
    ring.scale.setScalar(i === 0 ? 0.012 : 0.008);
    g.add(dot, ring);
    globe.add(g);
    return { g, ring, base: ring.scale.x };
  });
  const arcs = pts.slice(1).map((p) => {
    const N = 80;
    const a = home.clone().normalize();
    const b = p.clone().normalize();
    const ang = a.angleTo(b);
    const arr = Array.from({ length: N + 1 }, (_, k) => {
      const t = k / N;
      return new THREE.Vector3().copy(a).multiplyScalar(Math.sin((1 - t) * ang) / Math.sin(ang)).addScaledVector(b, Math.sin(t * ang) / Math.sin(ang)).multiplyScalar(1.002 + Math.sin(Math.PI * t) * ang * 0.35);
    });
    const geo = new THREE.BufferGeometry().setFromPoints(arr);
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GOLD }));
    globe.add(line);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 12, 12), new THREE.MeshBasicMaterial({ color: GOLD }));
    globe.add(spark);
    return { line, geo, arr, N, spark };
  });

  // Polska do kamery, północ w górę
  const qFocus = new THREE.Quaternion().setFromUnitVectors(latLon(52.4, 18.2).normalize(), new THREE.Vector3(0, 0, 1));
  const north = new THREE.Vector3(0, 1, 0).applyQuaternion(qFocus);
  const baseQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(north.x, north.y)).multiply(qFocus);
  globe.quaternion.copy(baseQ);

  let progress = reduceMotion || !ScrollTrigger ? 1 : 0;
  if (ScrollTrigger && !reduceMotion) ScrollTrigger.create({ trigger: section, start: 'top 80%', end: 'bottom 45%', onUpdate: (s) => (progress = s.progress) });

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    const wide = w / h > 0.9;
    camera.position.set(0, 0, wide ? 2.25 : 2.1);
    if (wide) camera.setViewOffset(w, h, -w * 0.22, 0, w, h);
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
  const tmp = new THREE.Vector3();
  const sway = new THREE.Quaternion();
  const euler = new THREE.Euler();
  let ps = progress;
  let visible = false;
  let running = false;
  const clock = new THREE.Timer();
  const tick = () => {
    if (!visible) {
      running = false;
      return;
    }
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = reduceMotion ? 0 : clock.getElapsed();
    ps += (progress - ps) * Math.min(1, dt * 3);
    mouseS.lerp(mouse, Math.min(1, dt * 2));
    euler.set(mouseS.y * 0.1 + (0.5 - ps) * 0.12, mouseS.x * 0.15 + (ps - 0.5) * 0.4, 0);
    sway.setFromEuler(euler);
    globe.quaternion.copy(sway).multiply(baseQ);
    arcs.forEach((a, i) => {
      const k = smooth(0.1 + i * 0.07, 0.4 + i * 0.07, ps);
      a.geo.setDrawRange(0, Math.floor(k * a.N) + 1);
      a.line.visible = k > 0.001;
      const tt = ((t * 0.35 + i * 0.17) % 1) * k;
      a.spark.position.copy(a.arr[Math.floor(tt * a.N)]);
      a.spark.visible = k > 0.98;
    });
    markers.forEach((m, i) => {
      const pulse = (t * 0.5 + i * 0.13) % 1;
      m.ring.scale.setScalar(m.base * (1 + pulse * 1.4));
      m.ring.material.opacity = (1 - pulse) * 0.9 * smooth(0.02, 0.15, ps);
    });
    renderer.render(scene, camera);
    const hostRect = host.getBoundingClientRect();
    const boxRect = labelBox.getBoundingClientRect();
    labels.forEach((el, i) => {
      markers[i].g.getWorldPosition(wp);
      const facing = tmp.copy(wp).normalize().dot(proj.copy(camera.position).sub(wp).normalize());
      proj.copy(wp).project(camera);
      const x = (proj.x * 0.5 + 0.5) * hostRect.width + hostRect.left - boxRect.left + LABEL_OFFSET[i][0];
      const y = (-proj.y * 0.5 + 0.5) * hostRect.height + hostRect.top - boxRect.top + LABEL_OFFSET[i][1];
      const show = i === 0 ? smooth(0.02, 0.12, ps) : smooth(0.25 + (i - 1) * 0.07, 0.4 + (i - 1) * 0.07, ps);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = (show * smooth(0.05, 0.2, facing)).toFixed(3);
    });
    requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !running) {
      running = true;
      clock.update();
      requestAnimationFrame(tick);
    }
  }, { rootMargin: '150px 0px' }).observe(section);
}

initReveals();
if (webglAvailable()) initGlobe();
addEventListener('load', () => ScrollTrigger && ScrollTrigger.refresh());
