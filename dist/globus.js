// Przerywnik „Dobre wnętrze…”: jasna planeta w beżach, wyraźne granice państw,
// Koszalin (studio) i kilka większych miast. Spokojny ruch: lekki obrót przy scrollu i za kursorem.
import * as THREE from 'three';

const ScrollTrigger = window.ScrollTrigger;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NIGHT = document.body.classList.contains('noc');
const GOLD = new THREE.Color(NIGHT ? '#a99e95' : '#9a7440');
const INK = new THREE.Color(NIGHT ? '#a99e95' : '#2b241d');
const AMBER = new THREE.Color(document.body.classList.contains('noc') ? '#e8e3df' : '#ffb15a');

// Koszalin pierwszy; przesunięcia podpisów w px (ujemne x = podpis po lewej kropki)
const CITIES = [
  ['Koszalin', 54.19, 16.17, [-16, -30]],
  ['Gdańsk', 54.35, 18.65, [12, -8]],
  ['Poznań', 52.41, 16.93, [-14, -6]],
  ['Warszawa', 52.23, 21.01, [12, -6]],
  ['Wrocław', 51.11, 17.03, [-14, -4]],
  ['Kraków', 50.06, 19.94, [12, -4]],
];

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

function initGlobe() {
  const section = document.querySelector('.globe-interlude');
  const host = section && section.querySelector('.globe-canvas');
  if (!host) return;
  const labels = [...section.querySelectorAll('.globe-labels span')];
  labels.forEach((el, i) => el.classList.toggle('is-left', CITIES[i][3][0] < 0));
  const labelBox = section.querySelector('.globe-labels');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
  const sunDir = new THREE.Vector3(-0.35, 0.55, -1).normalize();
  const loader = new THREE.TextureLoader();
  const tex = (n, srgb) => {
    const t = loader.load(`assets/planeta/${n}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };

  const globe = new THREE.Group();
  scene.add(globe);

  // nocna Ziemia: czerń, złoto, przygaszone światła miast, by granice i miasta były czytelne
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 192, 128),
    new THREE.ShaderMaterial({
      uniforms: {
        uNight: { value: tex('earth-night-4096.jpg', true) },
        uPack: { value: tex('earth-pack-2048.jpg', false) },
        uSun: { value: sunDir },
        uGold: { value: GOLD },
        uAmber: { value: AMBER },
        uSea: { value: new THREE.Color(NIGHT ? '#0b0b0a' : '#e6dfd5').convertSRGBToLinear() },
        uLand: { value: new THREE.Color(NIGHT ? '#2a2927' : '#bba893').convertSRGBToLinear() },
        uRim: { value: new THREE.Color(NIGHT ? '#55504b' : '#f2ece2').convertSRGBToLinear() },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uNight, uPack; uniform vec3 uSun, uGold, uAmber, uSea, uLand, uRim;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
          vec4 pk = texture2D(uPack, vUv);
          float land = smoothstep(0.3, 0.7, pk.g);
          // ląd: ciepły taupe, morze: jasny kamień — wyraźny, spokojny podział
          vec3 col = mix(uSea, uLand, land);
          // miasta jako delikatne ciemniejsze plamki
          float nl = dot(texture2D(uNight, vUv).rgb, vec3(0.333));
          col = ${NIGHT ? 'true' : 'false'} ? col + uAmber * pow(nl, 1.4) * 1.6 : col * (1.0 - pow(nl, 1.5) * 0.35 * land);
          float diff = max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
          col *= 0.86 + 0.16 * diff;
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);
          col = mix(col, uRim, fres * 0.6);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    })
  );
  globe.add(earth);

  // złota poświata wokół kuli
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.04, 96, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: { uSun: { value: sunDir }, uGold: { value: GOLD } },
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vW;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `uniform vec3 uSun, uGold; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 v = normalize(cameraPosition - vW);
          float rim = pow(clamp(0.82 + dot(normalize(vN), v), 0.0, 1.0), 6.0);
          float s = smoothstep(-0.6, 0.6, dot(normalize(vW), uSun));
          gl_FragColor = vec4(${NIGHT ? 'vec3(0.66, 0.62, 0.58)' : 'vec3(0.99, 0.97, 0.93)'}, rim * 0.7);
          #include <colorspace_fragment>
        }`,
    })
  ));

  // granice państw i linia brzegowa (Natural Earth 1:50m)
  const borderMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0 });
  fetch('assets/planeta/borders-europe.json')
    .then((r) => r.json())
    .then((lines) => {
      const pos = [];
      lines.forEach((l) => {
        for (let i = 0; i < l.length - 2; i += 2) {
          const a = latLon(l[i + 1], l[i], 1.0015);
          const b = latLon(l[i + 3], l[i + 2], 1.0015);
          pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      globe.add(new THREE.LineSegments(g, borderMat));
    })
    .catch(() => {});

  // miasta: spokojne kropki, tylko Koszalin z pierścieniem
  const dotMat = new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0 });
  const homeMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0 });
  const markers = CITIES.map(([, la, lo], i) => {
    const p = latLon(la, lo, 1.003);
    const g = new THREE.Group();
    g.position.copy(p);
    g.lookAt(p.clone().multiplyScalar(2));
    g.add(new THREE.Mesh(new THREE.CircleGeometry(i === 0 ? 0.0042 : 0.0028, 24), i === 0 ? homeMat : dotMat));
    let ring = null;
    if (i === 0) {
      ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), homeMat.clone());
      ring.scale.setScalar(0.011);
      g.add(ring);
    }
    globe.add(g);
    return { g, ring };
  });

  // Polska do kamery, północ w górę
  const qFocus = new THREE.Quaternion().setFromUnitVectors(latLon(52.3, 18.6).normalize(), new THREE.Vector3(0, 0, 1));
  const north = new THREE.Vector3(0, 1, 0).applyQuaternion(qFocus);
  const baseQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(north.x, north.y)).multiply(qFocus);

  let progress = reduceMotion || !ScrollTrigger ? 1 : 0;
  if (ScrollTrigger && !reduceMotion) {
    window.gsap?.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: section, start: 'top 75%', end: 'bottom 30%', onUpdate: (s) => (progress = s.progress) });
  }

  let wide = true;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    wide = w / h > 0.9;
    camera.position.set(0, 0, wide ? 2.6 : 2.25);
    // globus w prawej połowie, nieco wyżej, by zostawić lewy dół na tekst
    if (wide) camera.setViewOffset(w, h, -w * 0.18, h * 0.04, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.12, w, h);
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
    euler.set(mouseS.y * 0.08 + (0.5 - ps) * 0.14, mouseS.x * 0.12 + (ps - 0.5) * 0.5, 0);
    sway.setFromEuler(euler);
    globe.quaternion.copy(sway).multiply(baseQ);

    const reveal = smooth(0.08, 0.3, ps);
    borderMat.opacity = 0.42 * reveal;
    dotMat.opacity = smooth(0.2, 0.4, ps);
    homeMat.opacity = smooth(0.12, 0.3, ps);
    const pulse = (t * 0.4) % 1;
    const ring = markers[0].ring;
    ring.scale.setScalar(0.011 * (1 + pulse * 1.2));
    ring.material.opacity = (1 - pulse) * 0.8 * homeMat.opacity;

    renderer.render(scene, camera);

    const hostRect = host.getBoundingClientRect();
    const boxRect = labelBox.getBoundingClientRect();
    labels.forEach((el, i) => {
      markers[i].g.getWorldPosition(wp);
      const facing = tmp.copy(wp).normalize().dot(proj.copy(camera.position).sub(wp).normalize());
      proj.copy(wp).project(camera);
      const [dx, dy] = CITIES[i][3];
      const x = (proj.x * 0.5 + 0.5) * hostRect.width + hostRect.left - boxRect.left + dx;
      const y = (-proj.y * 0.5 + 0.5) * hostRect.height + hostRect.top - boxRect.top + dy;
      const show = i === 0 ? homeMat.opacity : dotMat.opacity;
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

if (webglAvailable()) initGlobe();
else document.querySelector('.globe-interlude')?.classList.add('globe-static');
