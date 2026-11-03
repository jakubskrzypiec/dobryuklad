import * as THREE from './vendor/three/three.module.min.js';
import {createCameraTrack,createInteriorTrack} from './walkthrough-motion.js?v=city-home-3';
export const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
export function homeJourneyPhases(p){return {world:Math.min(.66,p/.50*.66),room:ease((p-.45)/.10),travel:clamp((p-.50)/.33),photo:ease((p-.84)/.10),text:ease((p-.91)/.06),veil:.82*ease((p-.43)/.07)*(1-ease((p-.50)/.075))};}
export function createHomeEntryTrack(){
 const flight=createCameraTrack(new THREE.CubicBezierCurve3(...[[17,34,35],[8,18,27],[3.8,1.52,17],[3.8,1.52,9.3]].map(p=>new THREE.Vector3(...p))),new THREE.CubicBezierCurve3(...[[0,0,1],[3.8,0,5],[3.8,1.42,5],[3.8,1.42,3.8]].map(p=>new THREE.Vector3(...p))));
 const walking=createInteriorTrack();
 return {flight,walking,sample(t,position,quaternion){if(t<.56)flight.sample(ease(t/.56),position,quaternion);else walking.sample(ease((t-.56)/.44),position,quaternion);}};
}
