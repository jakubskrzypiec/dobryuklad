// Martwa natura ze skanów (Poly Haven, CC0): stolik, ceramika, mosiądz, gałązki, sukulent, fotel.
// Światło z okna: HDR wnętrza + słońce z cieniem ramy okna i liści na ścianie.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';
import { HDRLoader } from './vendor/three/HDRLoader.js';

const host = document.querySelector('.skany-canvas');
const isSmall = matchMedia('(max-width: 760px)').matches;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9e1d6');
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

const manager = new THREE.LoadingManager();
const done = new Promise((res) => (manager.onLoad = res));
const texLoader = new THREE.TextureLoader(manager);
const T = (p, srgb, rep = 1) => {
  const t = texLoader.load(p);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
};

new HDRLoader(manager).load('assets/skany/hdri/brown_photostudio_02_1k.hdr', (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = 0.45;
});

/* ---------------- pokój: dębowa podłoga i ściana z tynku ---------------- */
const oak = 'assets/skany/textures/oak_veneer_01/';
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 14),
  new THREE.MeshStandardMaterial({ map: T(oak + 'diff.jpg', true, 5), normalMap: T(oak + 'nor.jpg', false, 5), roughnessMap: T(oak + 'rough.jpg', false, 5), color: '#c4b29d' })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const pl = 'assets/skany/textures/white_plaster_rough_01/';
const wallMat = new THREE.MeshStandardMaterial({ color: '#efe6da', normalMap: T(pl + 'nor.jpg', false, 2), roughness: 0.95 });
wallMat.normalScale.set(0.7, 0.7);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
wall.position.set(0, 3, -1.6);
wall.receiveShadow = true;
scene.add(wall);

/* ---------------- światło z okna ---------------- */
scene.add(new THREE.HemisphereLight('#fff4e6', '#b49c80', 0.25));
const sun = new THREE.DirectionalLight('#ffe4c4', 3.2);
sun.position.set(-4.5, 4.2, 2.6);
sun.target.position.set(0.3, 0.4, -0.6);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 6;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 14;
scene.add(sun, sun.target);

const leaf = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.6), new THREE.MeshBasicMaterial({ map: T('assets/shadow.webp', true), transparent: true, opacity: 0.5, blending: THREE.MultiplyBlending, premultipliedAlpha: true, depthWrite: false }));
leaf.position.set(0.3, 1.9, -1.59);
scene.add(leaf);

/* ---------------- skany ---------------- */
const gltf = new GLTFLoader(manager);
const box = new THREE.Box3();
const load = (id, setup) =>
  gltf.load(`assets/skany/models/${id}/${id}.gltf`, (g) => {
    const root = g.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material.map) o.material.map.anisotropy = 8;
      }
    });
    setup(root);
    scene.add(root);
  });

let tableTop = 0.42;
load('modern_coffee_table_01', (r) => {
  box.setFromObject(r);
  tableTop = box.max.y;
  r.position.set(0, 0, 0);
});
const onTable = (id, x, z, rotY = 0, s = 1) =>
  load(id, (r) => {
    r.scale.setScalar(s);
    r.rotation.y = rotY;
    box.setFromObject(r);
    r.position.set(x, tableTop - box.min.y, z);
  });
onTable('ceramic_vase_03', -0.22, -0.05, 0.4);
onTable('ceramic_vase_02', 0.1, 0.08, 1.2);
onTable('brass_vase_04', 0.32, -0.1, 0.2, 1.3);
load('potted_plant_04', (r) => {
  r.scale.setScalar(2.4);
  r.position.set(0.75, 0, -1.25);
});
load('mid_century_lounge_chair', (r) => {
  r.rotation.y = -0.75;
  r.position.set(1.25, 0, -0.75);
});

/* ---------------- kamera i render ---------------- */
const target = new THREE.Vector3(0.15, 0.5, -0.3);
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w / h < 0.8 ? 42 : 30;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
const mouse = new THREE.Vector2();
const mouseS = new THREE.Vector2();
addEventListener('pointermove', (e) => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
const clock = new THREE.Timer();
function frame() {
  clock.update();
  const t = clock.getElapsed();
  mouseS.lerp(mouse, 0.04);
  // kadr: stolik po prawej, miejsce na tekst po lewej
  camera.position.set(-0.55 + mouseS.x * 0.12 + Math.sin(t * 0.1) * 0.04, 1.0 - mouseS.y * 0.05, 2.05);
  camera.lookAt(target.x - 0.45, target.y + 0.05, target.z);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
done.then(() => document.body.classList.add('skany-ready'));
requestAnimationFrame(frame);
