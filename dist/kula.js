// Finał strony: obracająca się Ziemia w beżach. Scroll obraca ją do Polski, kamera
// schodzi przez stratosferę (poświata, chmury pod nami) nad Koszalin, a na końcu
// pojawiają się profile społecznościowe studia.
import * as THREE from 'three';

const KOSZALIN = [54.19, 16.17];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
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

function init(section) {
  const stage = section.querySelector('.kula-stage');
  const host = section.querySelector('.kula-canvas');
  const haze = section.querySelector('.kula-haze');
  const steps = [...section.querySelectorAll('[data-kula-step]')];
  const label = section.querySelector('.kula-pin');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.0005, 40);
  const sunDir = new THREE.Vector3(-0.45, 0.5, 0.75).normalize();
  const loader = new THREE.TextureLoader();
  const tex = (n, srgb) => {
    const t = loader.load(`assets/planeta/${n}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const dayMap = tex('earth-day-4096.jpg', true);
  const packMap = tex('earth-pack-4096.jpg', false);
  packMap.wrapS = THREE.RepeatWrapping;

  const globe = new THREE.Group();
  scene.add(globe);

  // Ziemia w beżach i taupe: sepia z tekstury dnia, ocean jak jasny kamień
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 256, 160),
    new THREE.ShaderMaterial({
      uniforms: { uDay: { value: dayMap }, uPack: { value: packMap }, uSun: { value: sunDir } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDay, uPack; uniform vec3 uSun;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
          float ndl = dot(n, uSun);
          float lit = smoothstep(-0.35, 0.6, ndl);
          vec4 pk = texture2D(uPack, vUv);
          float land = smoothstep(0.3, 0.7, pk.g);
          vec3 day = texture2D(uDay, vUv).rgb;
          float lum = dot(day, vec3(0.2126, 0.7152, 0.0722));
          vec3 col = mix(vec3(0.34, 0.28, 0.23), vec3(0.66, 0.58, 0.49), smoothstep(0.03, 0.45, lum));
          col = mix(vec3(0.88, 0.855, 0.82), col, land);
          col *= 0.55 + 0.5 * lit;
          vec3 hv = normalize(uSun + v);
          col += vec3(1.0, 0.97, 0.92) * pow(max(dot(n, hv), 0.0), 90.0) * (1.0 - land) * 0.14;
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
          col = mix(col, vec3(0.97, 0.95, 0.92), fres * 0.4);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  globe.add(earth);

  // chmury: osobna, wolno płynąca warstwa nad lądem
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.006, 192, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uPack: { value: packMap }, uShift: { value: 0 }, uSun: { value: sunDir }, uAlpha: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uPack; uniform float uShift, uAlpha; uniform vec3 uSun;
        varying vec2 vUv; varying vec3 vN;
        void main(){
          float c = texture2D(uPack, vUv + vec2(uShift, 0.0)).b;
          float lit = 0.75 + 0.25 * smoothstep(-0.3, 0.6, dot(normalize(vN), uSun));
          gl_FragColor = vec4(vec3(1.0, 0.99, 0.97) * lit, smoothstep(0.25, 0.9, c) * 0.6 * uAlpha);
          #include <colorspace_fragment>
        }`,
    })
  );
  globe.add(clouds);

  // atmosfera: jasna obwódka, która przy zejściu staje się pasem nad horyzontem
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 128, 64),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 v = normalize(cameraPosition - vW);
          float rim = pow(clamp(0.8 + dot(normalize(vN), v), 0.0, 1.0), 4.0);
          gl_FragColor = vec4(vec3(1.0, 0.99, 0.97), rim * 0.9);
          #include <colorspace_fragment>
        }`,
    })
  );
  scene.add(halo);

  // granice państw: cienka grafitowa linia, wyraźna przy zbliżeniu
  const borderMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#353330'), transparent: true, opacity: 0 });
  fetch('assets/planeta/borders-europe.json')
    .then((r) => r.json())
    .then((lines) => {
      const pos = [];
      lines.forEach((l) => {
        for (let i = 0; i < l.length - 2; i += 2) {
          const a = latLon(l[i + 1], l[i], 1.0006);
          const b = latLon(l[i + 3], l[i + 2], 1.0006);
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      globe.add(new THREE.LineSegments(g, borderMat));
    })
    .catch(() => {});

  // Koszalin: kropka i pulsujący pierścień
  const K = latLon(...KOSZALIN);
  const pin = new THREE.Group();
  pin.position.copy(K).multiplyScalar(1.0008);
  pin.lookAt(K.clone().multiplyScalar(2));
  const pinMat = new THREE.MeshBasicMaterial({ color: '#111110', transparent: true, depthWrite: false, opacity: 0 });
  const dot = new THREE.Mesh(new THREE.CircleGeometry(1, 32), pinMat);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 64), pinMat.clone());
  pin.add(dot, ring);
  globe.add(pin);

  // orientacje: swobodny obrót → Koszalin naprzeciw kamery, północ w górę
  const qK = new THREE.Quaternion().setFromUnitVectors(K, new THREE.Vector3(0, 0, 1));
  const north = new THREE.Vector3(0, 1, 0).applyQuaternion(qK);
  const qTarget = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(north.x, north.y)).multiply(qK);
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.32);
  const qSpin = new THREE.Quaternion();
  const qNow = new THREE.Quaternion();
  const axisY = new THREE.Vector3(0, 1, 0);

  let progress = 0;
  const measure = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    progress = total > 0 ? clamp01(-r.top / total) : 1;
  };
  addEventListener('scroll', measure, { passive: true });

  let wide = true;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w / h > 0.9;
    camera.updateProjectionMatrix();
    measure();
  };
  addEventListener('resize', resize);
  resize();

  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  stage.addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const lookFar = new THREE.Vector3();
  const wp = new THREE.Vector3();
  const pr = new THREE.Vector3();
  let ps = progress;
  let spinAngle = 0;
  let visible = false;
  let running = false;
  let last = performance.now();

  const tick = (now) => {
    if (!visible) {
      running = false;
      return;
    }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ps += (progress - ps) * Math.min(1, dt * 5);
    mouseS.lerp(mouse, Math.min(1, dt * 2));
    const p = ps;

    // 1) kula kręci się sama; 2) obraca się do Polski; 3) kamera schodzi w stratosferę
    const turn = ease(smooth(0.12, 0.42, p));
    const dive = ease(smooth(0.34, 0.8, p));
    if (!reduceMotion) spinAngle += dt * 0.12 * (1 - turn);
    qSpin.setFromAxisAngle(axisY, spinAngle + p * 2.2).multiply(tilt);
    qNow.slerpQuaternions(qSpin, qTarget, turn);
    globe.quaternion.copy(qNow);

    const far = wide ? 3.5 : 4.6;
    // wysokość kamery nad Koszalinem: od orbity do ~120 km, pochylenie ku horyzontowi na północy
    const alt = THREE.MathUtils.lerp(far - 1, 0.05, dive);
    const lean = smooth(0.55, 0.95, p);
    camPos.set(mouseS.x * 0.02 * (1 - dive), -0.045 * lean - mouseS.y * 0.02 * (1 - dive), 1 + alt);
    camera.position.copy(camPos);
    look.set(0, 0, 0);
    lookFar.set(0, 0.035, 0.9994);
    look.lerp(lookFar, lean);
    camera.lookAt(look);
    camera.fov = THREE.MathUtils.lerp(34, 44, dive);
    // na szerokim ekranie kula najpierw z prawej (tekst po lewej), potem na środek
    const w = host.clientWidth, h = host.clientHeight;
    if (wide) camera.setViewOffset(w, h, -w * 0.2 * (1 - smooth(0.3, 0.6, p)), 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.14 * smooth(0.6, 0.9, p), w, h);
    camera.updateProjectionMatrix();

    clouds.material.uniforms.uShift.value = reduceMotion ? 0 : now * 0.0000025;
    // przy zejściu chmury rzedną pod kamerą, by było widać ląd
    clouds.material.uniforms.uAlpha.value = 1 - smooth(0.55, 0.8, p) * 0.8;
    borderMat.opacity = 0.55 * smooth(0.3, 0.55, p);

    // znacznik Koszalina rośnie z perspektywą
    const pinScale = THREE.MathUtils.lerp(0.012, 0.0013, dive);
    dot.scale.setScalar(pinScale * 0.35);
    const pulse = reduceMotion ? 0.5 : (now / 1000 * 0.45) % 1;
    ring.scale.setScalar(pinScale * (0.8 + pulse * 1.6));
    const pinA = smooth(0.4, 0.6, p);
    pinMat.opacity = pinA;
    ring.material.opacity = (1 - pulse) * 0.8 * pinA;

    // stratosfera: jasna mgła przy przejściu przez atmosferę
    if (haze) haze.style.opacity = (smooth(0.48, 0.64, p) * (1 - smooth(0.66, 0.84, p)) * 0.75).toFixed(3);

    renderer.render(scene, camera);

    // podpis Koszalina
    if (label) {
      pin.getWorldPosition(wp);
      pr.copy(wp).project(camera);
      const x = (pr.x * 0.5 + 0.5) * host.clientWidth;
      const y = (-pr.y * 0.5 + 0.5) * host.clientHeight;
      label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      label.style.opacity = (smooth(0.5, 0.62, p) * (pr.z < 1 ? 1 : 0)).toFixed(3);
    }

    // napisy: 0 — kula, 1 — stratosfera, 2 — Koszalin i social media
    const active = p < 0.36 ? 0 : p < 0.74 ? 1 : 2;
    steps.forEach((el) => el.classList.toggle('is-on', +el.dataset.kulaStep === active));

    requestAnimationFrame(tick);
  };

  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible && !running) {
      running = true;
      last = performance.now();
      measure();
      ps = progress;
      requestAnimationFrame(tick);
    }
  }, { rootMargin: '200px 0px' }).observe(section);
}

const section = document.querySelector('.kula-final');
if (section) {
  if (webglAvailable()) init(section);
  else section.classList.add('kula-static');
}
