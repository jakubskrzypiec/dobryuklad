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
 return {scene,root,update(growth){root.visible=true;root.scale.y=growth;}};
}
