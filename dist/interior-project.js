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
 const labels=createRoomLabels();scene.add(labels.group);
 return {scene,root,labels,update(growth,labelOpacity){root.visible=true;root.scale.y=growth;labels.group.visible=labelOpacity>.001;for(const material of labels.materials)material.opacity=labelOpacity;}};
}

export function createRoomLabels(){
 const group=new THREE.Group();group.name='Concept room labels';const materials=[];
 if(typeof document!=='undefined'){
  for(const [text,x,z,w] of [['SALON',-1.9,3.85,2.8],['KUCHNIA',3.8,-4.05,2.4],['WEJŚCIE',3.8,9.25,1.9]]){
   const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#4d4941';context.font='500 42px Arial';context.textAlign='center';context.textBaseline='middle';context.fillText(text,128,32);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,transparent:false,alphaTest:.3,depthWrite:false});materials.push(material);
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w*64/256),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.065,z);group.add(mesh);
  }
 }
 return {group,materials};
}
