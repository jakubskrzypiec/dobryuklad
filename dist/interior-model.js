import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/three/RoundedBoxGeometry.js';

// Metres, Y up. A real concept interior; no client project is represented.
export async function createInterior(){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d6d8d2');
 const loader=new THREE.TextureLoader();
 const textures=await Promise.all(['walkthrough-walnut.webp','walkthrough-stone.webp'].map(file=>loader.loadAsync(new URL('./assets/'+file,import.meta.url).href).catch(()=>null)));
 function map(texture,x=1,y=1,bump=false){if(!texture)return null;const t=texture.clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(x,y);t.colorSpace=bump?THREE.NoColorSpace:THREE.SRGBColorSpace;t.anisotropy=4;t.needsUpdate=true;return t;}
 let seed=921;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=128;const fabricContext=fabricCanvas.getContext('2d'),pixels=fabricContext.createImageData(128,128);
 for(let i=0;i<pixels.data.length;i+=4){const v=110+random()*80;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255;}fabricContext.putImageData(pixels,0,0);const grain=new THREE.CanvasTexture(fabricCanvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(5,5);
 const standard=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,...extra});
 const materials={
  plaster:standard('#c9c2b7',{bumpMap:grain,bumpScale:.014}),dark:standard('#282722'),
  oak:standard('#d2c9bd',{map:map(textures[0],1,1),bumpMap:map(textures[0],1,1,true),bumpScale:.012,roughness:.6}),
  stone:standard('#e0dbd3',{map:map(textures[1],1,1),bumpMap:map(textures[1],1,1,true),bumpScale:.022,roughness:.68}),
  floor:standard('#d6d1c7',{map:map(textures[1],1,2),bumpMap:map(textures[1],1,2,true),bumpScale:.014,roughness:.75}),
  fabric:standard('#c0b6a7',{bumpMap:grain,bumpScale:.022}),pillow:standard('#9a8d7b',{bumpMap:grain,bumpScale:.02}),
  rug:standard('#aaa395',{bumpMap:grain,bumpScale:.035,roughness:1}),bronze:standard('#6f5d43',{metalness:.8,roughness:.34}),
  black:standard('#222320',{metalness:.4,roughness:.32}),book:standard('#ded8cb'),leaf:standard('#65705a',{roughness:1}),trunk:standard('#635b4c'),
  light:standard('#fff0d0',{emissive:'#ffdda5',emissiveIntensity:2}),glass:new THREE.MeshPhysicalMaterial({color:'#e5efeb',transparent:true,opacity:.08,roughness:.06,metalness:.05,depthWrite:false})
 };
 const geometries=new Map();
 function box(w,h,d,material,x=0,y=0,z=0,parent=scene,round=0){
  const key=[w,h,d,round].join(',');if(!geometries.has(key))geometries.set(key,round?new RoundedBoxGeometry(w,h,d,3,Math.min(round,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d));
  const mesh=new THREE.Mesh(geometries.get(key),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function cylinder(rt,rb,h,material,x,y,z,parent=scene,segments=48){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function sphere(x,y,z,sx,sy,sz,material,parent=scene){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function lineTube(points,radius,material,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,8,false),material);mesh.castShadow=true;parent.add(mesh);return mesh;}
 // Architecture: full-depth floor, enclosed hall, a physical doorway and living room.
 const floor=box(12.6,.18,19.6,materials.dark,0,-.1,.7);floor.castShadow=false;
 for(let x=-5.25;x<6;x+=2.1)for(let z=-7.2;z<10;z+=2.45){const tile=box(2.094,.035,2.444,materials.floor,x,-.001,z);tile.castShadow=false;}
 const ceiling=box(12.6,.16,19.6,materials.plaster,0,3.88,.7);ceiling.castShadow=true;
 box(.22,3.8,14.2,materials.oak,-6.25,1.9,-1.65);
 box(.22,3.8,14.2,materials.plaster,6.25,1.9,-1.65);
 // Recessed timber wall panels and thin shadow gaps.
 for(let z=-7.7;z<4.8;z+=1.04){box(.035,3.5,1.018,materials.oak,-6.12,1.95,z);box(.045,.028,1.04,materials.black,-6.08,.15,z);}
 box(4.5,3.8,.32,materials.oak,-4,1.9,4.85);box(4.5,3.8,.32,materials.plaster,4,1.9,4.85);
 box(3.5,.64,.5,materials.oak,0,3.48,4.85);
 box(.16,3.15,.5,materials.oak,-1.77,1.57,4.85);box(.16,3.15,.5,materials.oak,1.77,1.57,4.85);
 box(.025,3.1,.04,materials.bronze,-1.67,1.55,5.13);box(.025,3.1,.04,materials.bronze,1.67,1.55,5.13);
 box(3.36,.025,.04,materials.bronze,0,3.1,5.13);
 box(.18,3.8,5.4,materials.oak,-1.88,1.9,7.7);box(.18,3.8,5.4,materials.plaster,1.88,1.9,7.7);
 for(const x of [-1.75,1.75])box(.025,.025,4.9,materials.light,x,3.62,7.65);
 box(.32,.07,1.7,materials.oak,1.62,.87,7.7,scene,.02);
 cylinder(.1,.085,.28,materials.bronze,1.6,1.04,7.5);
 // Rear glazing: transparent glass and actual mullions cast the window shadows.
 box(12.6,.22,.22,materials.black,0,.11,-8.7);box(12.6,.16,.22,materials.black,0,3.7,-8.7);
 for(let x=-6.15;x<=6.2;x+=2.46)box(.055,3.5,.14,materials.black,x,1.9,-8.7);
 const glazing=box(12.2,3.45,.025,materials.glass,0,1.92,-8.7);glazing.castShadow=false;
 box(12.6,.04,.12,materials.black,0,2.76,-8.7);
 // Exterior terrace and quiet planted backdrop, not a borrowed photograph.
 box(23,.15,11,materials.stone,0,-.22,-14.1);box(28,.3,3.2,materials.leaf,0,.0,-18.5,scene,.1);
 function olive(x,z,scale=1){
  const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group);
  const pot=cylinder(.48,.33,.75,materials.stone,0,.36,0,group);pot.castShadow=false;
  lineTube([[0,.7,0],[.05,1.5,0],[-.1,2.3,.05],[.1,2.9,0]],.055,materials.trunk,group);
  const geo=new THREE.IcosahedronGeometry(1,1),leaves=new THREE.InstancedMesh(geo,materials.leaf,480),dummy=new THREE.Object3D();
  for(let branch=0;branch<10;branch++){
   const angle=branch*2.4,end=[Math.cos(angle)*.7,2.45+random()*.8,Math.sin(angle)*.6];
   lineTube([[0,1.55,0],[end[0]*.45,2.1,end[2]*.5],end],.016,materials.trunk,group);
   for(let j=0;j<48;j++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.37;dummy.position.set(end[0]+Math.cos(a)*r,end[1]+(random()-.5)*.65,end[2]+Math.sin(a)*r);dummy.scale.set(.085+random()*.04,.015+random()*.012,.028);dummy.rotation.set(random()*3,random()*6,random()*3);dummy.updateMatrix();leaves.setMatrixAt(branch*48+j,dummy.matrix);}
  }leaves.castShadow=true;group.add(leaves);
 }
 olive(-4,-12.3,1.15);olive(4.3,-12,1.28);olive(.4,-15,1.05);
 // Full-height curtains at the sides of the glazing.
 for(const side of [-1,1]){for(let i=0;i<9;i++){const curtain=cylinder(.09,.1,3.5,materials.fabric,side*(5.4+i*.085),1.9,-8.38,scene,12);curtain.castShadow=false;}}
 // Kitchen: tall joinery, worktop, a stone island and hanging linear light.
 for(let z=-5.9;z<-.3;z+=.75){box(.58,2.65,.73,materials.oak,-5.72,1.45,z);box(.025,.08,.32,materials.bronze,-5.4,1.3,z);}
 box(.8,.07,5.8,materials.stone,-5.58,.96,-3.05);
 box(1.65,.88,3.45,materials.stone,-3.7,.46,-2.1,scene,.025);
 box(1.72,.09,3.53,materials.stone,-3.7,.94,-2.1,scene,.025);
 box(1.37,.13,3.13,materials.black,-3.7,.08,-2.1);
 const sink=cylinder(.26,.26,.02,materials.black,-3.7,.995,-3.05);sink.scale.z=1.35;
 lineTube([[-3.98,1.0,-3.2],[-3.98,1.4,-3.2],[-3.8,1.47,-3.2],[-3.64,1.34,-3.2]],.017,materials.black);
 box(.08,.07,2.5,materials.bronze,-3.7,2.8,-2.1,scene,.02);box(.045,.012,2.35,materials.light,-3.7,2.755,-2.1);
 for(const z of [-3.05,-1.15])cylinder(.009,.009,1.0,materials.black,-3.7,3.3,z);
 function stool(x,z){cylinder(.27,.27,.1,materials.pillow,x,.68,z);for(const dx of [-.18,.18])for(const dz of [-.18,.18]){const leg=cylinder(.015,.018,.62,materials.bronze,x+dx,.32,z+dz,scene,12);leg.rotation.z=dx>0?-.06:.06;}}
 stool(-2.35,-2.8);stool(-2.35,-1.5);
 // Soft modular sofa; all cushions and arms have actual bevelled geometry.
 const sofa=new THREE.Group();sofa.position.set(3.65,0,-.85);sofa.rotation.y=-Math.PI/2;scene.add(sofa);
 box(3.9,.28,1.42,materials.fabric,0,.25,0,sofa,.12);
 for(const x of [-1.18,0,1.18]){box(1.13,.26,1.18,materials.fabric,x,.5,.06,sofa,.1);const back=box(1.13,.78,.3,materials.fabric,x,.88,-.53,sofa,.12);back.rotation.x=-.1;}
 for(const x of [-1.87,1.87])box(.28,.71,1.4,materials.fabric,x,.58,0,sofa,.12);
 for(const [x,z,r] of [[-1.16,-.25,.13],[1.18,-.27,-.16]]){const pillow=box(.6,.58,.2,materials.pillow,x,.9,z,sofa,.09);pillow.rotation.z=r;pillow.rotation.x=-.25;}
 const rug=box(4.65,.018,5.2,materials.rug,2.6,.029,-1.15,scene,.005);rug.castShadow=false;
 cylinder(.73,.73,.26,materials.stone,1.75,.2,-1.25);cylinder(.49,.49,.48,materials.oak,2.45,.3,-.68);
 const bowl=cylinder(.24,.14,.08,materials.black,1.75,.38,-1.25);bowl.scale.z=.8;
 box(.38,.045,.26,materials.book,2.42,.565,-.68,scene,.01);const book=box(.35,.035,.25,materials.plaster,2.45,.605,-.69,scene,.008);book.rotation.y=.16;
 // A sculptural lounge chair near the window.
 const chair=new THREE.Group();chair.position.set(3.8,0,-5.5);chair.rotation.y=.3;scene.add(chair);
 box(1.02,.24,1.0,materials.fabric,0,.35,0,chair,.12);box(.95,.65,.3,materials.fabric,0,.77,-.4,chair,.13);
 for(const x of [-.47,.47])box(.2,.48,.95,materials.fabric,x,.57,0,chair,.09);
 cylinder(.28,.2,.44,materials.bronze,4.8,.24,-5.4);cylinder(.42,.42,.06,materials.stone,4.8,.49,-5.4);
 // Restrained abstract relief on the right wall.
 box(.05,1.7,2.5,materials.pillow,6.08,2.2,-.7,scene,.02);
 const relief=cylinder(.48,.48,.04,materials.plaster,6.03,2.35,-1.0);relief.rotation.z=Math.PI/2;
 const relief2=cylinder(.34,.34,.05,materials.oak,6,1.97,-.4);relief2.rotation.z=Math.PI/2;
 // A reading lamp and a curved ceramic vessel.
 cylinder(.22,.22,.035,materials.black,5,.04,-2.8);cylinder(.014,.014,1.6,materials.bronze,5,.85,-2.8,scene,16);
 sphere(5,1.72,-2.8,.3,.13,.3,materials.bronze);cylinder(.22,.22,.01,materials.light,5,1.67,-2.8);
 const vasePoints=[[.12,0],[.23,.12],[.22,.32],[.13,.45],[.1,.49]].map(([x,y])=>new THREE.Vector2(x,y));
 const vase=new THREE.Mesh(new THREE.LatheGeometry(vasePoints,40),materials.stone);vase.position.set(-3.7,.99,-1.1);vase.castShadow=true;scene.add(vase);
 for(let i=0;i<5;i++)lineTube([[-3.7,1.4,-1.1],[-3.7+(i-2)*.06,1.8,-1.1],[-3.7+(i-2)*.15,2.05+random()*.15,-1.08]],.006,materials.trunk);
 // Soft contact shadows supplement the sun without any photographic backplates.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.38)');gradient.addColorStop(.55,'rgba(0,0,0,.17)');gradient.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
 for(const [x,z,w,d] of [[3.6,-.8,2.8,5.1],[1.75,-1.25,2.4,2.4],[-3.7,-2.1,3.4,4.8],[3.8,-5.5,2.1,2.1]]){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.62}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.052,z);scene.add(mesh);}
 const hemi=new THREE.HemisphereLight('#f6f3e9','#73614b',1.15);scene.add(hemi);
 scene.add(new THREE.AmbientLight('#dcd3c7',.16));
 const sun=new THREE.DirectionalLight('#fff2d8',3.1);sun.position.set(-9,7,-26);sun.target.position.set(0,0,2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:12,bottom:-12,near:.5,far:45});sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun,sun.target);
 const hallLight=new THREE.PointLight('#ffead0',16,9,2);hallLight.position.set(0,3.35,7.4);scene.add(hallLight);
 const kitchenLight=new THREE.PointLight('#ffe4bd',12,6,2);kitchenLight.position.set(-3.7,2.65,-2.1);scene.add(kitchenLight);
 return {scene,materials};
}
