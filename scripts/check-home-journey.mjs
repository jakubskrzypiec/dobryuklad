import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {createHomeEntryTrack,homeJourneyPhases} from '../dist/home-journey-motion.js';
import {addHomeCity} from '../dist/home-city.js';
const cityScene=new THREE.Scene();addHomeCity(cityScene);cityScene.updateMatrixWorld(true);const solids=[];cityScene.traverse(mesh=>{if(mesh.isMesh&&!mesh.isInstancedMesh)solids.push(new THREE.Box3().setFromObject(mesh).expandByScalar(.08));});
const track=createHomeEntryTrack(),pos=new THREE.Vector3(),q=new THREE.Quaternion();let last,lastQ;
for(let i=0;i<=4000;i++){const t=i/4000;track.sample(t,pos,q);assert.ok(pos.toArray().every(Number.isFinite)&&q.toArray().every(Number.isFinite));assert.ok(pos.y>=1.419);for(const box of solids)assert.ok(!box.containsPoint(pos),'flight must clear the city buildings and entrance canopy');if(pos.z>6&&pos.z<11.9)assert.ok(pos.x>2.6&&pos.x<5.0&&pos.y<3.5,'enter through the actual corridor opening below its ceiling');if(last){assert.ok(last.distanceTo(pos)<.08);assert.ok(lastQ.angleTo(q)<.015);}last=pos.clone();lastQ=q.clone();}
assert.ok(pos.distanceTo(new THREE.Vector3(.15,1.42,5.2))<1e-8);
const a=new THREE.Vector3(),b=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();track.sample(.56-.000001,a,qa);track.sample(.56+.000001,b,qb);assert.ok(a.distanceTo(b)<.0001&&qa.angleTo(qb)<.0001,'flight and interior must meet with the same pose');
for(let p=0;p<=1;p+=.001){const phase=homeJourneyPhases(p);for(const value of Object.values(phase))assert.ok(value>=0&&value<=1);if(phase.photo>0)assert.equal(phase.travel,1,'finish the camera movement before dissolving to the photo');}
console.log('PASS: continuous city-to-corridor pose, safe door clearance, bounded motion, matched hero endpoint, photo after camera stop.');
