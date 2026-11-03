import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {createInteriorTrack,advanceProgress,matchedHeroFov} from '../dist/walkthrough-motion.js';
import {walkthroughPhases} from '../dist/walkthrough-timing.js';

const track=createInteriorTrack(),position=new THREE.Vector3(),rotation=new THREE.Quaternion();
let priorPosition,priorRotation,maxTranslation=0,maxTurn=0;
const obstacles=[['sofa',-4.17,.48,-1.52,1.5],['island',1.82,5.75,-3.23,-1.77],['coffee table',-2.08,-.02,.44,1.76],['art console',-3.42,-.28,5.59,6.08]];
for(let i=0;i<=3000;i++){
 track.sample(i/3000,position,rotation);
 for(const [name,left,right,back,front] of obstacles)assert.ok(!(position.x>left&&position.x<right&&position.z>back&&position.z<front),'camera intersects '+name);
 assert.ok(position.x>-6.05&&position.x<6.05&&position.z>-5.2&&position.z<11.5);
 if(position.z>6.05)assert.ok(position.x>2.6&&position.x<5.0,'camera must pass through the actual corridor opening');
 if(i){maxTranslation=Math.max(maxTranslation,position.distanceTo(priorPosition));maxTurn=Math.max(maxTurn,rotation.angleTo(priorRotation));assert.ok(position.x<=priorPosition.x+.000001&&position.z<=priorPosition.z+.000001,'entry must head directly to the hero, without orbiting or reversing');}
 assert.ok(position.x>=.149&&position.z>=5.199,'stay in front of the sofa for the whole approach');
 priorPosition=position.clone();priorRotation=rotation.clone();
}
// One equal scroll increment must never cause a sharp rotation or large movement.
assert.ok(maxTranslation<.025);assert.ok(maxTurn<.007);
track.sample(1,position,rotation);assert.ok(position.distanceTo(new THREE.Vector3(.15,1.42,5.2))<1e-8);
track.sample(0,position,rotation);assert.ok(position.distanceTo(new THREE.Vector3(3.8,1.52,9.3))<1e-8,'walk begins inside the entrance corridor');
for(const fps of [30,60,120]){
 const state={value:0,velocity:0};let prior=0;
 for(let i=0;i<fps*8;i++){const next=advanceProgress(state,1,1/fps);assert.ok(next>=prior&&next<=1);assert.ok((next-prior)*fps<=.201);prior=next;}
 assert.equal(state.value,1);
 for(let i=0;i<fps*8;i++){const next=advanceProgress(state,0,1/fps);assert.ok(next<=prior&&next>=0);prior=next;}
 assert.equal(state.value,0);
}
const settled=[];
for(const fps of [30,60,120]){const state={value:0,velocity:0};for(let i=0;i<fps*2;i++)advanceProgress(state,.3,1/fps);settled.push(state.value);}
assert.ok(Math.max(...settled)-Math.min(...settled)<.002);
assert.equal(walkthroughPhases(.72).travel,1);assert.equal(walkthroughPhases(.75).photo,0);assert.equal(walkthroughPhases(.93).photo,1);assert.equal(walkthroughPhases(.96).hero,1);
assert.ok(walkthroughPhases(.83).photo>0&&walkthroughPhases(.83).photo<1);assert.equal(walkthroughPhases(.83).hero,0);
for(const aspect of [.44,1,1662/946,2.5]){const fov=matchedHeroFov(aspect),expected=Math.tan(THREE.MathUtils.degToRad(52)*.5)*Math.min(1,(1662/946)/aspect);assert.ok(Math.abs(Math.tan(THREE.MathUtils.degToRad(fov)*.5)-expected)<1e-9);}
console.log('PASS: clear route, bounded camera turns and translation, forward/reverse damping, 30/60/120 fps consistency, fixed 3D endpoint.');
console.log({maxTranslationPerStep:maxTranslation,maxRadiansPerStep:maxTurn,weightedTrackLength:track.length});
