import * as THREE from './vendor/three/three.module.min.js';

export function createProjectStage(interiorScene){
 const scene=new THREE.Scene();scene.background=new THREE.Color().setRGB(2.5,2.48,2.43);
 const root=interiorScene.clone(true);root.background=null;root.environment=null;
 const clay=new THREE.MeshStandardMaterial({color:'#dedad1',roughness:.92,metalness:0}),thread=new THREE.LineBasicMaterial({color:'#d7d2c7'}),remove=[];
 root.traverse(object=>{
  const materials=object.material?(Array.isArray(object.material)?object.material:[object.material]):[];
  if(object.isLight||object.userData.ceiling||object.userData.exterior||materials.some(m=>m.transparent)){remove.push(object);return;}
  if(object.isMesh)object.material=clay;
  if(object.isLine)object.material=thread;
 });
 for(const object of remove)object.removeFromParent();scene.add(root);
 scene.add(new THREE.HemisphereLight('#ffffff','#b8b1a3',1.35));
 const key=new THREE.DirectionalLight('#fff9ec',1.8);key.position.set(-8,16,6);scene.add(key);
 const fill=new THREE.DirectionalLight('#e8eef1',.5);fill.position.set(6,9,-4);scene.add(fill);
 const plan=createFloorPlan();scene.add(plan.group);
 return {scene,root,plan,update(growth,lineOpacity){root.visible=growth>.001;root.scale.y=THREE.MathUtils.lerp(.0008,1,growth);plan.group.visible=lineOpacity>.001;for(const material of plan.materials)material.opacity=lineOpacity;}};
}

export function createFloorPlan(){
 const group=new THREE.Group();group.name='Concept floor plan — same interior';
 const ink=new THREE.MeshBasicMaterial({color:'#35342e',transparent:true}),thin=new THREE.LineBasicMaterial({color:'#4c4a44',transparent:true}),faint=new THREE.LineBasicMaterial({color:'#8e8a80',transparent:true}),materials=[ink,thin,faint];
 function wall(w,d,x,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.015,d),ink);mesh.position.set(x,.025,z);group.add(mesh);}
 // The glazed wall, kitchen rear wall, portal and entrance corridor match the room geometry.
 wall(12.6,.22,0,-6.3);wall(.2,12.6,6.3,0);wall(.22,.95,-6.3,-5.55);wall(.22,3.4,-6.3,4.5);
 wall(8.7,.25,-1.95,6.3);wall(1,.25,5.85,6.3);wall(.18,5.6,2.25,9);wall(.18,5.6,5.35,9);
 for(const z of [-4.8,-2.84,-.87,1.1,3.05])wall(.11,.055,-6.26,z);
 function path(points,material=thin,closed=false){const vertices=points.map(p=>new THREE.Vector3(p[0],.052,p[1]));if(closed)vertices.push(vertices[0].clone());const geometry=new THREE.BufferGeometry().setFromPoints(vertices);group.add(new THREE.Line(geometry,material));}
 function rect(x,z,w,d,material=thin,r=.06){const points=[];for(const [cx,cz,start] of [[x+w/2-r,z+d/2-r,0],[x-w/2+r,z+d/2-r,Math.PI/2],[x-w/2+r,z-d/2+r,Math.PI],[x+w/2-r,z-d/2+r,Math.PI*1.5]])for(let i=0;i<=8;i++){const a=start+i/8*Math.PI/2;points.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]);}path(points,material,true);}
 path([[-6.26,-4.8],[-6.26,3.05]]);path([[-6.19,-4.8],[-6.19,3.05]],faint);
 // Upholstered L-sofa, rug, oval table, island, stools and kitchen countertop.
 rect(-1.9,-.55,4.28,1.65);rect(-3.35,.25,1.4,2.5);
 for(const x of [-3.24,-1.9,-.56]){rect(x,-.45,1.32,1.35,thin,.12);rect(x,-1.17,1.36,.4,faint,.08);}
 rect(-1.65,.8,6.2,4.25,faint,.025);
 const oval=[];for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;oval.push([-1.05+Math.cos(a)*.95,1.1+Math.sin(a)*.589]);}path(oval);
 rect(3.78,-2.5,3.78,1.3);rect(2.92,-2.5,2.05,1.23,faint,.015);
 for(const x of [4.42,5.25])rect(x,-1.6,.55,.46,thin,.1);
 rect(3.94,-5.57,4.38,.84);rect(4.45,-5.53,.59,.38,thin,.05);
 for(let x=1.5;x<6.1;x+=.71)path([[x,-5.99],[x,-5.15]],faint);
 rect(-1.85,5.83,3.12,.46);path([[2.38,6.3],[2.38,7.45]],faint);const doorArc=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI/2;doorArc.push([2.38+Math.cos(a)*1.15,6.3+Math.sin(a)*1.15]);}path(doorArc,faint);
 // Fine dimension extensions have no invented real-world measurements.
 path([[-6.3,-7.15],[6.3,-7.15]],faint);for(const x of [-6.3,6.3]){path([[x,-6.65],[x,-7.45]],faint);path([[x-.12,-7.03],[x+.12,-7.27]],thin);}
 path([[7.13,-6.3],[7.13,6.3]],faint);for(const z of [-6.3,6.3])path([[6.68,z],[7.4,z]],faint);
 if(typeof document!=='undefined'){
  for(const [text,x,z,w] of [['SALON',-1.9,3.85,2.8],['KUCHNIA',3.8,-4.05,2.4],['WEJŚCIE',3.8,9.25,1.9]]){
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#4d4941';context.font='500 42px Arial';context.textAlign='center';context.textBaseline='middle';context.fillText(text,128,32);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,transparent:false,alphaTest:.3,depthWrite:false});materials.push(material);
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w*64/256),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.065,z);group.add(mesh);
  }
 }
 return {group,materials};
}
