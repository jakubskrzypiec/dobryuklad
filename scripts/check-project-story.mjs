import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {createProjectStage} from '../dist/interior-project.js';
import {createProjectIntroTrack,createInteriorTrack} from '../dist/walkthrough-motion.js';
import {walkthroughPhases} from '../dist/walkthrough-timing.js';
const original=new THREE.Scene(),material=new THREE.MeshStandardMaterial({color:'#654321'});
const wall=new THREE.Mesh(new THREE.BoxGeometry(12,.2,.3),material);original.add(wall);
const roof=wall.clone();roof.userData.ceiling=true;original.add(roof);
const outdoor=wall.clone();outdoor.userData.exterior=true;original.add(outdoor);
original.add(new THREE.DirectionalLight());
const stage=createProjectStage(original);assert.equal(stage.root.children.length,1);assert.equal(wall.material,material);assert.notEqual(stage.root.children[0].material,material);
stage.update(.72);assert.equal(stage.root.visible,true);assert.equal(stage.root.scale.y,.72);assert.equal(stage.scene.getObjectByName('Concept room labels'),undefined);assert.equal(stage.scene.getObjectByName('Concept floor plan — same interior'),undefined);
stage.update(1);assert.equal(stage.root.scale.y,1);assert.equal(original.children.length,4);
const walking=createInteriorTrack(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),startPosition=new THREE.Vector3(),startRotation=new THREE.Quaternion();walking.sample(0,startPosition,startRotation);
for(const aspect of [.44,1,1.757,2.5]){
 const intro=createProjectIntroTrack(aspect);let previous;
 for(let i=0;i<=1200;i++){
  intro.sample(i/1200,position,rotation);assert.ok(position.toArray().every(Number.isFinite));assert.ok(rotation.toArray().every(Number.isFinite));assert.ok(position.y>=1.5);
  if(previous)assert.ok(rotation.angleTo(previous)<.018,'intro rotation discontinuity');previous=rotation.clone();
 }
 assert.ok(position.distanceTo(startPosition)<1e-8);assert.ok(rotation.angleTo(startRotation)<1e-6,'intro and walk must meet with identical orientation');
 intro.sample(0,position,rotation);const direction=new THREE.Vector3(0,0,-1).applyQuaternion(rotation);assert.ok(direction.y<-.999&&Math.hypot(direction.x,direction.z)<.04,'start from the raised model with a slight aerial angle');
 for(let p=.201;p<.34;p+=.001){const phase=walkthroughPhases(p);intro.sample(phase.intro,position,rotation);assert.ok(position.y<3.5&&position.z>6.6&&position.x>2.5&&position.x<5.1,'material handoff must be below the corridor ceiling and between its walls');}
}
assert.equal(walkthroughPhases(0).growth,.72);assert.equal(walkthroughPhases(0).materials,0);assert.equal(walkthroughPhases(.18).growth,1);assert.equal(walkthroughPhases(.35).intro,1);assert.equal(walkthroughPhases(.35).materials,1);
for(let p=0;p<=1;p+=.001){const phase=walkthroughPhases(p);if(phase.photo>0)assert.equal(phase.travel,1);if(phase.materials>0)assert.equal(phase.growth,1);}
assert.ok(walking.length<18&&walking.length>5,'direct corridor approach must not include the old sofa circuit');
for(const aspect of [.44,1.757,2.5]){
 const intro=createProjectIntroTrack(aspect),a=new THREE.Vector3(),b=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
 for(const p of [.27,.34,.72]){const left=walkthroughPhases(p-.00001),right=walkthroughPhases(p+.00001);if(left.intro<1)intro.sample(left.intro,a,qa);else walking.sample(left.travel,a,qa);if(right.intro<1)intro.sample(right.intro,b,qb);else walking.sample(right.travel,b,qb);assert.ok(a.distanceTo(b)<.003&&qa.angleTo(qb)<.003,'no pose jump at timeline joins');}
}
console.log('PASS: raised 3D opening without labels, direct corridor-to-hero approach, zero-roll descent, seamless joins, responsive framing, safe material handoff and stage order.');
