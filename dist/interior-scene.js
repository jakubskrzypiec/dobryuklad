import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/three/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from './vendor/three/lights/RectAreaLightUniformsLib.js';

// A continuous interior with enough circulation space for the full camera loop.
export async function createInterior(){
 RectAreaLightUniformsLib.init();
 const scene=new THREE.Scene();scene.background=new THREE.Color('#a6a598');
 const loader=new THREE.TextureLoader();
 const files=['walkthrough-walnut.webp','interior-marble-v2.webp','interior-floor-v2.webp','interior-linen-v2.webp'];
 const sources=await Promise.all(files.map(file=>loader.loadAsync(new URL('./assets/'+file,import.meta.url).href).catch(()=>null)));
 function texture(index,x=1,y=1,bump=false){if(!sources[index])return null;const t=sources[index].clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(x,y);t.colorSpace=bump?THREE.NoColorSpace:THREE.SRGBColorSpace;t.anisotropy=8;t.needsUpdate=true;return t;}
 let seed=781;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
 const physical=(color,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness:.7,...extra});
 const oak=physical('#b8afa2',{map:texture(0),bumpMap:texture(0,1,1,true),bumpScale:.001,roughness:.57});
 const marble=physical('#e1dacf',{map:texture(1),bumpMap:texture(1,1,1,true),bumpScale:.0005,roughness:.34,clearcoat:.18,clearcoatRoughness:.32});
 const floor=physical('#c3b9ab',{map:texture(2,2.2,3.8),bumpMap:texture(2,2.2,3.8,true),bumpScale:.0008,roughness:.38,clearcoat:.12,clearcoatRoughness:.4});
 const linen=physical('#e5ded0',{map:texture(3,4,4),bumpMap:texture(3,4,4,true),bumpScale:.0012,roughness:.93,sheen:1,sheenColor:new THREE.Color('#d4c9b8'),sheenRoughness:.82});
 const pillowMaterial=linen.clone();pillowMaterial.color.set('#c9bda8');
 const dark=new THREE.MeshStandardMaterial({color:'#191a17',roughness:.6});
 const metal=physical('#282822',{metalness:.9,roughness:.26});
 const bronze=physical('#a08d71',{metalness:.94,roughness:.3});
 const plaster=physical('#a49a8a',{roughness:.94});
 const warmLight=new THREE.MeshBasicMaterial({color:'#f6c98b',toneMapped:false});
 const paper=physical('#a59a83',{roughness:.95});
 const rugMaterial=linen.clone();rugMaterial.color.set('#a19986');rugMaterial.map=texture(3,16,12);rugMaterial.bumpMap=texture(3,16,12,true);rugMaterial.bumpScale=.0025;
 const geometries=new Map();
 function box(w,h,d,material,x,y,z,parent=scene,radius=0){const key=[w,h,d,radius].join(',');if(!geometries.has(key))geometries.set(key,radius?new RoundedBoxGeometry(w,h,d,6,Math.min(radius,w*.45,h*.45,d*.45)):new THREE.BoxGeometry(w,h,d));const mesh=new THREE.Mesh(geometries.get(key),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cylinder(rt,rb,h,material,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,64),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function tube(points,radius,material,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,8,false),material);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function lathe(points,material,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),72),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cushion(w,h,d,x,y,z,parent,material=linen,pillow=false){
  const geometry=new RoundedBoxGeometry(w,h,d,8,Math.min(h*.38,.14));const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   let px=positions.getX(i),py=positions.getY(i),pz=positions.getZ(i);const nx=px/(w*.5),ny=py/(h*.5),nz=pz/(d*.5);
   if(pillow){const bulge=Math.max(0,1-nx*nx)*Math.max(0,1-ny*ny);pz+=Math.sign(nz)*.027*bulge;const crease=Math.exp(-Math.pow((Math.abs(nx)-.72)*12,2))*.006;pz-=crease*Math.sin(ny*8);}
   else{const centre=Math.max(0,1-nx*nx)*Math.max(0,1-nz*nz);py-=Math.max(0,ny)*.024*centre;py+=.004*Math.sin(px*28)*Math.exp(-Math.pow((Math.abs(nz)-.87)*13,2));}
   positions.setXYZ(i,px,py,pz);
  }geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 // Continuous stone floor avoids the exaggerated grid of the first model.
 const slab=box(12.6,.12,18,floor,0,-.08,2.2);slab.castShadow=false;
 const jointMaterial=new THREE.MeshBasicMaterial({color:'#4d463d',transparent:true,opacity:.25});
 for(let x=-5;x<6;x+=2.5){const seam=box(.003,.001,17.8,jointMaterial,x,-.017,2.2);seam.castShadow=false;}
 for(let z=-5;z<11;z+=2.7){const seam=box(12.5,.001,.003,jointMaterial,0,-.017,z);seam.castShadow=false;}
 box(12.6,.16,12.2,plaster,0,6.38,.2);
 // Rear walnut wall, deep kitchen alcove and full-height pier.
 box(7.35,6.3,.24,oak,-2.55,3.15,-5.6);
 for(let x=-5.85;x<1.05;x+=.69){const panel=oak.clone();panel.color.multiplyScalar(.94+random()*.1);box(.684,6.26,.035,panel,x,3.15,-5.45);}
 box(.85,6.3,1.12,oak,1.17,3.15,-5.15);
 box(12.6,6.3,.2,oak,0,3.15,-6.35);box(4.35,6.3,.22,oak,3.93,3.15,-6.1);box(4.4,2.18,.8,oak,3.95,5.2,-5.6);
 box(.2,6.3,12.2,oak,6.3,3.15,.1);
 box(.22,6.3,.95,oak,-6.3,3.15,-5.55);box(.22,6.3,3.4,oak,-6.3,3.15,4.5);box(.22,2.7,7.9,oak,-6.3,4.95,-.9);
 // High side glazing, with real mullions and a landscape outside.
 const glass=new THREE.MeshPhysicalMaterial({color:'#e2e5d6',transparent:true,opacity:.035,roughness:.06,metalness:.05,depthWrite:false});
 const glazing=box(.012,3.48,7.9,glass,-6.3,1.82,-.9);glazing.castShadow=false;
 for(const z of [-4.8,-2.84,-.87,1.1,3.05])box(.11,3.6,.055,metal,-6.26,1.8,z);
 for(const y of [.08,3.55])box(.15,.07,7.9,metal,-6.27,y,-.9);
 box(7,.15,16,plaster,-9.9,-.17,-.5);
 // Entry corridor on the right. Camera traverses the opening before turning left.
 box(12.6,2.7,.3,oak,0,4.95,6.3);
 box(8.7,3.6,.25,oak,-1.95,1.8,6.3);box(1.0,3.6,.25,oak,5.85,1.8,6.3);
 box(2.8,.54,.4,oak,3.8,3.33,6.3);
 for(const x of [2.37,5.23]){box(.15,3.1,.55,oak,x,1.55,6.3);box(.025,3.08,.03,bronze,x+(x<3? .09:-.09),1.54,6.6);}
 box(.18,3.6,5.6,oak,2.25,1.8,9);box(.18,3.6,5.6,plaster,5.35,1.8,9);box(3.3,.15,5.7,plaster,3.8,3.68,9);
 for(const x of [2.36,5.24])box(.015,.018,5.3,warmLight,x,3.42,9.0);
 box(.25,.07,1.75,oak,5.15,.86,9,scene,.018);
 // Kitchen fronts and warmly lit marble splashback.
 for(let x=1.85;x<6.1;x+=.71){box(.699,.95,.7,oak,x,.49,-5.64);box(.699,1.75,.6,oak,x,2.67,-5.69);}
 box(4.38,.07,.84,marble,3.94,1.02,-5.57);box(4.35,.67,.045,marble,3.94,1.4,-6.0);box(4.18,.018,.05,warmLight,3.94,1.76,-5.83);
 for(const y of [2.19,2.94]){box(1.85,.065,.4,oak,5.17,y,-5.6);box(1.78,.015,.022,warmLight,5.17,y-.04,-5.4);}
 tube([[4.8,1.07,-5.5],[4.8,1.45,-5.5],[4.63,1.52,-5.5],[4.5,1.39,-5.5]],.015,metal);
 // Monolithic marble island, including a slim worktop over the bar seating.
 box(2.05,.96,1.23,marble,2.92,.49,-2.5,scene,.014);box(3.78,.065,1.3,marble,3.78,1.005,-2.5,scene,.018);
 box(1.85,.1,1.05,dark,2.92,.035,-2.5);
 for(const x of [4.42,5.25]){
  cushion(.55,.08,.46,x,.74,-1.6,scene,pillowMaterial);
  for(const dx of [-.21,.21])for(const dz of [-.17,.17])cylinder(.012,.014,.7,metal,x+dx,.36,-1.6+dz);
  tube([[x-.22,.72,-1.38],[x-.22,1.0,-1.38],[x+.22,1.0,-1.38],[x+.22,.72,-1.38]],.014,metal);
  box(.46,.14,.032,metal,x,.93,-1.37,scene,.012);
 }
 // Floating bronze linear pendant.
 box(2.8,.055,.085,bronze,4.48,2.65,-2.6,scene,.015);box(2.7,.008,.06,warmLight,4.48,2.618,-2.6);
 for(const x of [3.35,5.62])cylinder(.006,.006,.98,metal,x,3.16,-2.6);
 // Sculptural upholstered L-sofa, with shaped cushions and fine fabric detail.
 const sofa=new THREE.Group();sofa.position.set(-1.9,0,-.55);scene.add(sofa);
 box(4.15,.2,1.55,dark,0,.18,0,sofa,.07);box(4.28,.28,1.65,linen,0,.34,0,sofa,.13);
 for(const x of [-1.34,0,1.34]){cushion(1.32,.3,1.35,x,.56,.1,sofa);const back=cushion(1.36,.65,.4,x,.87,-.62,sofa,linen,true);back.rotation.x=-.08;}
 box(1.4,.3,2.5,linen,-1.45,.34,.72,sofa,.13);cushion(1.35,.3,2.25,-1.45,.56,.8,sofa);
 box(.33,.63,1.56,linen,2.05,.63,0,sofa,.14);box(.3,.6,2.3,linen,-2.06,.62,.7,sofa,.13);
 for(const [x,y,z,r] of [[-1.55,1,-.3,.12],[-.9,.9,-.24,-.23],[1.32,.99,-.28,-.12]]){const pillow=cushion(.78,.68,.21,x,y,z,sofa,pillowMaterial,true);pillow.rotation.z=r;pillow.rotation.x=-.14;pillow.rotation.y=x>0?-.12:.1;}
 // A woven throw follows the chaise surface and drops over its front edge.
 const throwMaterial=linen.clone();throwMaterial.color.set('#9e9483');throwMaterial.side=THREE.DoubleSide;throwMaterial.bumpScale=.001;
 const cloth=new THREE.PlaneGeometry(.88,1.56,38,64),cp=cloth.attributes.position;
 for(let i=0;i<cp.count;i++){
  const u=cp.getX(i),v=(cp.getY(i)+.78)/1.56,fall=Math.max(0,(v-.67)/.33);
  cp.setXYZ(i,-1.48+u+.035*Math.sin(v*12),.724-fall*.58+.008*(Math.sin(u*39+v*3)+.45*Math.sin(u*67-v*5))*(1+fall),.65+Math.min(v/.67,1)*.93+fall*.045);
 }cloth.computeVertexNormals();const throwMesh=new THREE.Mesh(cloth,throwMaterial);throwMesh.castShadow=throwMesh.receiveShadow=true;sofa.add(throwMesh);
 // Fine upholstered back seams also read naturally during the reverse view.
 for(const x of [-.67,.67])tube([[x,.43,-.835],[x,.72,-.84],[x,1.12,-.81]],.002,seamMaterial(),sofa);
 function seamMaterial(){const m=linen.clone();m.color.multiplyScalar(.86);return m;}
 // A sheer folded curtain filters the edge of the glazing.
 const curtainMaterial=physical('#d3cbbd',{map:texture(3,3,7),roughness:1,side:THREE.DoubleSide,transparent:true,opacity:.68});
 const curtain=new THREE.PlaneGeometry(1.05,3.45,56,36),curtainPositions=curtain.attributes.position;
 for(let i=0;i<curtainPositions.count;i++){const u=curtainPositions.getX(i),v=curtainPositions.getY(i);curtainPositions.setXYZ(i,.09*Math.sin(u*40)+.015*Math.sin(v*3),v,u);}
 curtain.computeVertexNormals();const curtainMesh=new THREE.Mesh(curtain,curtainMaterial);curtainMesh.position.set(-6.09,1.79,2.65);curtainMesh.receiveShadow=true;scene.add(curtainMesh);
 // Sink rim, recessed basin, tap and modest kitchen objects give scale to the room.
 box(.65,.012,.43,metal,4.45,1.061,-5.53,scene,.035);box(.55,.008,.34,dark,4.45,1.069,-5.53,scene,.035);
 const board=box(.34,.027,.26,oak,2.45,1.07,-5.52,scene,.018);board.rotation.y=.19;
 lathe([[.07,0],[.08,.02],[.08,.22],[.065,.23],[.06,.23]],plaster,2.17,1.06,-5.7);
 // A narrow piped seam around each seat, with an upholstered rather than black finish.
 const seamMat=linen.clone();seamMat.color.multiplyScalar(.78);
 for(const x of [0,1.34]){const points=[[-.55,.0,-.5],[.55,0,-.5],[.62,0,-.42],[.62,0,.5],[.54,0,.6],[-.54,0,.6],[-.62,0,.5],[-.62,0,-.42],[-.55,0,-.5]].map(p=>[p[0]+x,p[1]+.68,p[2]+.1]);tube(points,.002,seamMat,sofa);}
 const rug=box(6.2,.012,4.25,rugMaterial,-1.65,.001,.8,scene,.004);rug.castShadow=false;
 const coffee=cylinder(.94,.94,.29,oak,-1.05,.21,1.1);coffee.scale.z=.62;
 cylinder(.58,.58,.08,dark,-1.05,.07,1.1).scale.z=.62;
 const book=box(.39,.045,.27,paper,-1.45,.385,1.03,scene,.009);book.rotation.y=-.08;const book2=box(.32,.033,.25,paper,-1.46,.426,1.03,scene,.006);book2.rotation.y=.09;
 lathe([[0,0],[.19,0],[.22,.1],[.18,.23],[.13,.3],[.1,.32]],dark,-.89,.36,1.08);
 lathe([[0,0],[.12,0],[.24,.035],[.3,.1],[.3,.13],[.28,.135],[.23,.08],[0,.045]],metal,-.89,.67,1.08);
 // Metallic vase and branched seed stems, matching the scale of the hero still life.
 lathe([[.12,0],[.14,.02],[.14,.43],[.12,.46],[.1,.46],[.105,.42]],bronze,2.8,1.04,-2.5);
 const stemMat=new THREE.MeshStandardMaterial({color:'#a08353',roughness:.7});const seeds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,5),stemMat,168),dummy=new THREE.Object3D();let instance=0;
 for(let i=0;i<14;i++){
  const a=i*2.4,r=.25+random()*.8,ex=2.8+Math.cos(a)*r,ey=1.9+random()*.85,ez=-2.5+Math.sin(a)*r*.5;
  tube([[2.8,1.42,-2.5],[2.8+(ex-2.8)*.4,1.74,-2.5+(ez+2.5)*.4],[ex,ey,ez]],.004,stemMat);
  for(let j=0;j<12;j++){const t=.45+j*.045;dummy.position.set(2.8+(ex-2.8)*t+(random()-.5)*.12,1.48+(ey-1.48)*t,-2.5+(ez+2.5)*t+(random()-.5)*.12);dummy.scale.set(.013,.018,.012);dummy.updateMatrix();seeds.setMatrixAt(instance++,dummy.matrix);}
 }seeds.castShadow=true;scene.add(seeds);
 // Trees outside the left-hand glazing, modelled as instanced leaves.
 const leafMat=new THREE.MeshStandardMaterial({color:'#65705a',roughness:1});const trunkMat=new THREE.MeshStandardMaterial({color:'#51483b',roughness:1});
 for(const z of [-4.3,.7]){
  const tree=new THREE.Group();tree.position.set(-8.3,0,z);scene.add(tree);tube([[0,0,0],[.05,1.5,.08],[-.12,3.2,0],[.04,4.6,0]],.075,trunkMat,tree);
  const leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leafMat,800);
  for(let b=0;b<10;b++){const a=b*2.4,tip=[Math.cos(a)*1.2,3.1+random()*1.7,Math.sin(a)*1.0];tube([[0,2,0],[tip[0]*.4,2.8,tip[2]*.4],tip],.02,trunkMat,tree);for(let j=0;j<80;j++){const angle=random()*6.28,r=Math.sqrt(random())*.7;dummy.position.set(tip[0]+Math.cos(angle)*r,tip[1]+(random()-.5)*.7,tip[2]+Math.sin(angle)*r);dummy.scale.set(.1,.02,.035);dummy.rotation.set(random()*3,random()*6,random()*3);dummy.updateMatrix();leaves.setMatrixAt(b*80+j,dummy.matrix);}}leaves.castShadow=false;tree.add(leaves);
 }
 // Low-contrast contact occlusion underneath furniture, not a screen-sized fake shadow.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.55)');gradient.addColorStop(.6,'rgba(0,0,0,.2)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(canvas);
 for(const [x,z,w,d] of [[-1.9,-.2,5.3,3.0],[-1.05,1.1,2.8,1.8],[3.0,-2.5,3.3,2.0]]){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.65}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.012,z);scene.add(mesh);}
 scene.add(new THREE.HemisphereLight('#d8d9d4','#393127',.78));scene.add(new THREE.AmbientLight('#b5a38a',.08));
 const sun=new THREE.DirectionalLight('#ffe4b7',2.8);sun.position.set(-13,6,1);sun.target.position.set(1,0,-2);sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<760?2048:4096,innerWidth<760?2048:4096);Object.assign(sun.shadow.camera,{left:-8,right:8,top:9,bottom:-9,near:1,far:35});sun.shadow.bias=-.0001;sun.shadow.normalBias=.012;sun.shadow.radius=3;scene.add(sun,sun.target);
 const windowLight=new THREE.RectAreaLight('#dfe6eb',3.0,7.2,3.1);windowLight.position.set(-6.1,1.9,-.7);windowLight.lookAt(0,1.2,-1.0);scene.add(windowLight);
 const fill=new THREE.RectAreaLight('#d5c7b4',.8,5,2);fill.position.set(.4,2.4,5.8);fill.lookAt(-1,1,-1);scene.add(fill);
 const splash=new THREE.RectAreaLight('#ffce8c',3.5,4.0,.25);splash.position.set(3.9,1.72,-5.75);splash.lookAt(3.9,1.25,-5.8);scene.add(splash);
 const islandFill=new THREE.RectAreaLight('#ffe6bf',1.9,2.7,.08);islandFill.position.set(4.45,2.59,-2.6);islandFill.lookAt(4.45,0,-2.6);scene.add(islandFill);
 const hallLight=new THREE.PointLight('#ffe0b0',12,8,2);hallLight.position.set(3.8,3.1,9.2);scene.add(hallLight);
 return {scene,capturePosition:new THREE.Vector3(.2,1.6,2.8)};
}
