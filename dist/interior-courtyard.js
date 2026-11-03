import * as THREE from './vendor/three/three.module.min.js';
export function addCourtyardAndArt({scene,box,cylinder,tube,leafGeometry,oak,bronze,dark,plaster}){
 const existingExterior=new Set(scene.children);
 const stone=new THREE.MeshStandardMaterial({color:'#bcb8a9',roughness:.92}),wall=new THREE.MeshStandardMaterial({color:'#c9c5b7',roughness:.96}),soil=new THREE.MeshStandardMaterial({color:'#46483b',roughness:1});
 // A finite garden, with perspective and parallax, replaces the forest photograph.
 box(12,.12,29,stone,-12.2,-.13,-.5);box(.22,2.65,29,wall,-16.8,1.25,-.5);box(10.6,2.65,.22,wall,-11.6,1.25,-14.8);box(10.6,2.65,.22,wall,-11.6,1.25,13.8);
 const joints=new THREE.MeshStandardMaterial({color:'#8f9185',roughness:1});
 for(let z=-14;z<14;z+=1.4)box(10.2,.002,.007,joints,-11.6,-.065,z);
 for(let x=-16;x<-6.6;x+=1.7)box(.007,.002,28,joints,x,-.065,-.5);
 box(1.45,.48,22,stone,-15.6,.18,-.5,scene,.025);box(1.3,.025,21.8,soil,-15.6,.43,-.5);
 let seed=7201;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 const foliageMaterial=new THREE.MeshStandardMaterial({color:'#727c62',roughness:.98,side:THREE.DoubleSide}),bark=new THREE.MeshStandardMaterial({color:'#6c6857',roughness:1}),dummy=new THREE.Object3D();
 for(const [tx,tz] of [[-12.5,-11.2],[-13.2,-4.0],[-12.5,4.5]]){
  cylinder(.65,.52,.58,stone,tx,.22,tz);cylinder(.58,.58,.02,soil,tx,.52,tz);
  tube([[tx,.5,tz],[tx+.04,1.3,tz-.04],[tx-.02,2.15,tz+.03],[tx+.12,2.85,tz]],.035,bark);
  const leaves=new THREE.InstancedMesh(leafGeometry,foliageMaterial,520);let index=0;
  for(let b=0;b<8;b++){
   const a=b*2.4,tip=new THREE.Vector3(tx+Math.cos(a)*(.65+rand()*.3),2.1+rand()*1.05,tz+Math.sin(a)*(.65+rand()*.3));
   tube([[tx,1.6,tz],[(tx+tip.x)*.5,2.0,(tz+tip.z)*.5],tip.toArray()],.012,bark);
   for(let j=0;j<65;j++){const angle=rand()*6.283,r=Math.sqrt(rand())*.45;dummy.position.set(tip.x+Math.cos(angle)*r,tip.y+(rand()-.5)*.55,tip.z+Math.sin(angle)*r);dummy.scale.set(.8+rand()*.6,1.1+rand()*.8,1);dummy.rotation.set(rand()*2.3,rand()*6.28,rand()*3);dummy.updateMatrix();leaves.setMatrixAt(index,dummy.matrix);leaves.setColorAt(index++,new THREE.Color().setHSL(.19+rand()*.06,.11+rand()*.15,.26+rand()*.13));}
  }leaves.castShadow=false;scene.add(leaves);
 }
 // Quiet low vegetation in the distant raised bed, deliberately clear of the glass.
 const grasses=new THREE.InstancedMesh(new THREE.ConeGeometry(.065,.45,4),foliageMaterial,180);
 for(let i=0;i<180;i++){dummy.position.set(-15.8+rand()*.65,.62,-11+rand()*21);dummy.scale.set(.6+rand(),.55+rand(),.6+rand());dummy.rotation.set(0,rand()*6.28,0);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix);}scene.add(grasses);
 for(const object of scene.children)if(!existingExterior.has(object))object.userData.exterior=true;
 // Sculptural diptych on the wall opposite the sofa; every layer is physical geometry.
 const paper=new THREE.MeshStandardMaterial({color:'#ded8c9',roughness:1}),relief=new THREE.MeshStandardMaterial({color:'#afa593',roughness:1});
 for(const [x,flip] of [[-2.52,false],[-1.18,true]]){
  box(1.12,1.58,.055,dark,x,1.88,6.12,scene,.006);box(1.065,1.525,.012,paper,x,1.88,6.081);
  const arch=new THREE.Shape();arch.moveTo(-.29,-.49);arch.lineTo(.29,-.49);arch.lineTo(.29,.2);arch.absarc(0,.2,.29,0,Math.PI,false);arch.closePath();
  const panel=new THREE.Mesh(new THREE.ExtrudeGeometry(arch,{depth:.018,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:40}),relief);panel.rotation.y=Math.PI;panel.rotation.z=flip?Math.PI:0;panel.position.set(x+(flip?.1:-.1),1.88,6.065);panel.castShadow=panel.receiveShadow=true;scene.add(panel);
  const disk=new THREE.Mesh(new THREE.CylinderGeometry(.135,.135,.014,64),paper);disk.rotation.x=Math.PI/2;disk.position.set(x+(flip?-.25:.25),2.22,6.031);disk.castShadow=disk.receiveShadow=true;scene.add(disk);
 }
 box(3.12,.075,.46,oak,-1.85,.74,5.83,scene,.012);box(2.95,.48,.35,oak,-1.85,.465,5.85,scene,.009);box(2.86,.12,.28,dark,-1.85,.16,5.86);
 cylinder(.12,.09,.23,plaster,-2.85,.89,5.82);box(.35,.04,.24,plaster,-.9,.798,5.82,scene,.004);box(.29,.03,.22,dark,-.87,.833,5.82,scene,.003);
}
