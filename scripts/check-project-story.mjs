import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {createProjectStage,createFloorPlan} from '../dist/interior-project.js';
import {createProjectIntroTrack,createInteriorTrack} from '../dist/walkthrough-motion.js';
import {walkthroughPhases} from '../dist/walkthrough-timing.js';
const original=new THREE.Scene(),material=new THREE.MeshStandardMaterial({color:'#654321'});
const wall=new THREE.Mesh(new THREE.BoxGeometry(12,.2,.3),material);original.add(wall);
const roof=wall.clone();roof.userData.ceiling=true;original.add(roof);
const outdoor=wall.clone();outdoor.userData.exterior=true;original.add(outdoor);
original.add(new THREE.DirectionalLight());
const stage=createProjectStage(original);assert.equal(stage.root.children.length,1);assert.equal(wall.material,material);assert.notEqual(stage.root.children[0].material,material);
stage.update(0,1);assert.equal(stage.root.visible,false);assert.equal(stage.plan.group.visible,true);
stage.update(1,0);assert.equal(stage.root.scale.y,1);assert.equal(stage.plan.group.visible,false);assert.equal(original.children.length,4);
const plan=createFloorPlan();plan.group.traverse(o=>{if(o.geometry)for(const a of Object.values(o.geometry.attributes))for(const n of a.array)assert.ok(Number.isFinite(n));});
const walking=createInteriorTrack(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),startPosition=new THREE.Vector3(),startRotation=new THREE.Quaternion();walking.sample(0,startPosition,startRotation);
for(const aspect of [.44,1,1.757,2.5]){
 const intro=createProjectIntroTrack(aspect);let previous;
 for(let i=0;i<=1200;i++){
  intro.sample(i/1200,position,rotation);assert.ok(position.toArray().every(Number.isFinite));assert.ok(rotation.toArray().every(Number.isFinite));assert.ok(position.y>=1.5);
  if(previous)assert.ok(rotation.angleTo(previous)<.018,'intro rotation discontinuity');previous=rotation.clone();
 }
 assert.ok(position.distanceTo(startPosition)<1e-8);assert.ok(rotation.angleTo(startRotation)<1e-6,'intro and walk must meet with identical orientation');
 intro.sample(0,position,rotation);const direction=new THREE.Vector3(0,0,-1).applyQuaternion(rotation);assert.ok(direction.distanceTo(new THREE.Vector3(0,-1,0))<1e-8);
 for(let p=.216;p<.325;p+=.001){const phase=walkthroughPhases(p);intro.sample(phase.intro,position,rotation);assert.ok(position.y<6.2&&position.z<6.1,'material scene must start below the ceiling');}
}
assert.equal(walkthroughPhases(0).growth,0);assert.equal(walkthroughPhases(0).materials,0);assert.equal(walkthroughPhases(.18).growth,1);assert.equal(walkthroughPhases(.33).intro,1);assert.equal(walkthroughPhases(.33).materials,1);
for(let p=0;p<=1;p+=.001){const phase=walkthroughPhases(p);if(phase.photo>0)assert.equal(phase.travel,1);if(phase.materials>0)assert.equal(phase.growth,1);}
console.log('PASS: exact floor-plan/clay hierarchy, finite linework, zero-roll descent, seamless intro/walk pose, safe material handoff, responsive framing and stage order.');
