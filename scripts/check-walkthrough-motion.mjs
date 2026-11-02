import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.min.js';
import {createInteriorTrack,advanceProgress} from '../dist/walkthrough-motion.js';
import {walkthroughPhases} from '../dist/walkthrough-timing.js';

const track=createInteriorTrack(),position=new THREE.Vector3(),rotation=new THREE.Quaternion();
let priorPosition,priorRotation,maxTranslation=0,maxTurn=0;
const obstacles=[['sofa',-4.17,.48,-1.52,1.5],['island',1.82,5.75,-3.23,-1.77],['coffee table',-2.08,-.02,.44,1.76]];
for(let i=0;i<=3000;i++){
 track.sample(i/3000,position,rotation);
 for(const [name,left,right,back,front] of obstacles)assert.ok(!(position.x>left&&position.x<right&&position.z>back&&position.z<front),'camera intersects '+name);
 assert.ok(position.x>-6.05&&position.x<6.05&&position.z>-5.2&&position.z<11.5);
 if(i){maxTranslation=Math.max(maxTranslation,position.distanceTo(priorPosition));maxTurn=Math.max(maxTurn,rotation.angleTo(priorRotation));}
 priorPosition=position.clone();priorRotation=rotation.clone();
}
// One equal scroll increment must never cause a sharp rotation or large movement.
assert.ok(maxTranslation<.025);assert.ok(maxTurn<.007);
track.sample(1,position,rotation);assert.ok(position.distanceTo(new THREE.Vector3(.15,1.42,5.2))<1e-8);
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
assert.equal(walkthroughPhases(.89).travel,1);assert.equal(walkthroughPhases(.95).hero,1);
console.log('PASS: clear route, bounded camera turns and translation, forward/reverse damping, 30/60/120 fps consistency, fixed 3D endpoint.');
console.log({maxTranslationPerStep:maxTranslation,maxRadiansPerStep:maxTurn,weightedTrackLength:track.length});
