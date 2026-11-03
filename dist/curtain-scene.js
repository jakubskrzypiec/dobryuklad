import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/three/RoundedBoxGeometry.js';
import {upholsteryGeometry,addUpholsteryWelt} from './interior-craft.js?v=atelier-5';
import {RectAreaLightUniformsLib} from './vendor/three/lights/RectAreaLightUniformsLib.js';
import {createCurtainGeometry,updateCurtainGeometry} from './curtain-motion.js?v=corridor-10';

// A quiet dining room in the palette of the existing photographic divider.
export async function createCurtainScene(){
 RectAreaLightUniformsLib.init();
 const scene=new THREE.Scene(),room=new THREE.Group();scene.add(room);
 const loader=new THREE.TextureLoader();
 const load=async(file,color=false)=>{const t=await loader.loadAsync(new URL('./assets/'+file,import.meta.url).href);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(color)t.colorSpace=THREE.SRGBColorSpace;return t;};
 const [woodMap,stoneMap,floorMap,clothNormal]=await Promise.all([load('interior/walnut-color.webp',true),load('interior-marble-v2.webp',true),load('interior-floor-v2.webp',true),load('interior/linen-normal.webp')]);
 woodMap.center.set(.5,.5);woodMap.rotation=Math.PI/2;woodMap.repeat.set(1,2);floorMap.repeat.set(3,3);clothNormal.repeat.set(3,2);
 const wood=new THREE.MeshStandardMaterial({map:woodMap,color:'#746451',roughness:.77});
 const stone=new THREE.MeshPhysicalMaterial({map:stoneMap,color:'#ad9b83',roughness:.46,clearcoat:.12});
 const floor=new THREE.MeshStandardMaterial({map:floorMap,color:'#d0c4b1',roughness:.63});
 const fabric=new THREE.MeshPhysicalMaterial({color:'#b8a993',roughness:.98,sheen:.8,sheenColor:new THREE.Color('#e3d7bf'),normalMap:clothNormal,normalScale:new THREE.Vector2(.14,.14)});
 const bronze=new THREE.MeshStandardMaterial({color:'#8c795c',metalness:.75,roughness:.35});
 const wall=new THREE.MeshStandardMaterial({color:'#a99e8c',roughness:.97});
 const box=(w,h,d,m,x,y,z,r=0,parent=room)=>{const mesh=new THREE.Mesh(r?new RoundedBoxGeometry(w,h,d,4,r):new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 box(8,.12,12,floor,0,-.08,1);box(8,4.3,.22,wood,0,2.15,-3.5);box(.2,4.3,12,wall,4.1,2.15,1);box(8,.15,12,wall,0,4.3,1);box(.15,4.3,12,wall,-4.18,2.15,1).castShadow=false;
 for(let x=-3.7;x<4;x+=.66)box(.012,4.28,.026,bronze,x,2.15,-3.36);
 // Elliptical stone tabletop, curved seats, and a restrained branch arrangement.
 const table=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.095,96),stone);table.scale.set(2.6,1,.88);table.position.set(.1,.82,-.75);table.castShadow=table.receiveShadow=true;room.add(table);
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.64,.69,.78,64),stone);pedestal.scale.z=.75;pedestal.position.set(.1,.39,-.75);pedestal.castShadow=true;room.add(pedestal);
 for(const [x,z,angle] of [[-1.35,.7,0],[1.35,.7,0],[-1.2,-2.1,Math.PI],[1.4,-2.1,Math.PI]]){
  const chair=new THREE.Group();chair.position.set(x,0,z);chair.rotation.y=angle;room.add(chair);
  const seat=new THREE.Mesh(upholsteryGeometry(.93,.21,.82),fabric);seat.position.y=.48;seat.castShadow=seat.receiveShadow=true;chair.add(seat);addUpholsteryWelt(seat,.93,.21,.82,false,fabric);
  const back=new THREE.Mesh(new THREE.CylinderGeometry(.49,.49,.62,48,1,true,-Math.PI/2,Math.PI),fabric);back.position.set(0,.82,0);back.scale.z=.82;back.castShadow=back.receiveShadow=true;chair.add(back);
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.62,48,1,true,-Math.PI/2,Math.PI),fabric);inner.position.copy(back.position);inner.scale.z=.82;inner.material=fabric;inner.material.side=THREE.DoubleSide;chair.add(inner);
  for(const y of [.51,1.13]){const points=Array.from({length:49},(_,i)=>{const a=-Math.PI/2+i*Math.PI/48;return new THREE.Vector3(Math.sin(a)*.46,y,Math.cos(a)*.46*.82);});const rim=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.031,8,false),fabric);chair.add(rim);}
  for(const x of [-.46,.46])box(.06,.62,.06,fabric,x,.82,0,.02,chair);
  for(const a of [-.31,.31])for(const b of [-.24,.24])box(.14,.4,.14,fabric,a,.21,b,.04,chair);
 }
 const vase=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.44,48),bronze);vase.position.set(.7,1.1,-.8);room.add(vase);
 for(let i=0;i<8;i++){
  const end=new THREE.Vector3(.7+Math.sin(i*2.4)*.66,1.8+(i%3)*.12,-.8+Math.cos(i*2.4)*.3),start=new THREE.Vector3(.7,1.15,-.8),direction=end.clone().sub(start);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.004,.006,direction.length(),5),bronze);stem.position.copy(start).addScaledVector(direction,.5);stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());room.add(stem);
  for(let j=0;j<4;j++){const bud=new THREE.Mesh(new THREE.SphereGeometry(.017,5,4),bronze);bud.position.copy(start).lerp(end,.45+j*.18);room.add(bud);}
 }
 // Window frame remains part of the room; only the fabric continues over the live page.
 for(const z of [-2.7,-.4,1.9,4.2])box(.09,3.7,.055,bronze,-4.02,1.85,z);
 const curtains=new THREE.Group();curtains.position.set(-3.97,0,.8);curtains.rotation.y=Math.PI/2;scene.add(curtains);
 const curtainMaterial=new THREE.MeshPhysicalMaterial({color:'#e0d6c3',roughness:1,side:THREE.DoubleSide,sheen:1,sheenColor:new THREE.Color('#fff5e4'),sheenRoughness:.85});
 const panels=[-1,1].map(side=>{const g=createCurtainGeometry();updateCurtainGeometry(g,side,0);const mesh=new THREE.Mesh(g,curtainMaterial);curtains.add(mesh);return {g,side};});
 scene.add(new THREE.HemisphereLight('#fff5e5','#5a4b3c',.65));
 const sun=new THREE.DirectionalLight('#ffecd0',1.3);sun.position.set(-6,5,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:24});sun.shadow.normalBias=.01;sun.shadow.radius=4;scene.add(sun);
 const daylight=new THREE.RectAreaLight('#fff0dc',3.3,5.8,3.1);daylight.position.set(-3.8,1.9,.8);daylight.lookAt(0,1.3,-.4);scene.add(daylight);
 const clothBounce=new THREE.RectAreaLight('#f5eddf',2,3.6,2.7);clothBounce.position.set(-1,2.2,1.2);clothBounce.lookAt(-4,1.8,.8);scene.add(clothBounce);
 const fill=new THREE.DirectionalLight('#dad9d2',.48);fill.position.set(1,3,5);scene.add(fill);
 const roomMaterials=new Set();room.traverse(o=>{if(o.material)roomMaterials.add(o.material);});
 let priorOpening=-1;
 return {scene,update(opening,opacity){room.visible=opacity>.001;for(const m of roomMaterials){m.transparent=opacity<.999;m.opacity=opacity;m.depthWrite=opacity>.5;}if(Math.abs(opening-priorOpening)>.00001){for(const {g,side} of panels)updateCurtainGeometry(g,side,opening);priorOpening=opening;}}};
}
