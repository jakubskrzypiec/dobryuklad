import * as THREE from './vendor/three/three.module.min.js';
// Parameterize the entire camera pose by translation AND rotation. This allocates
// scroll distance to turns instead of letting the view whip around at a waypoint.
export function createCameraTrack(route,gaze,samples=1600){
 const poses=[],probe=new THREE.PerspectiveCamera(),up=new THREE.Vector3(0,1,0);let total=0;
 for(let i=0;i<=samples;i++){
  const t=i/samples,position=route.getPoint(t),target=gaze.getPoint(t);probe.position.copy(position);probe.up.copy(up);probe.lookAt(target);
  const quaternion=probe.quaternion.clone();
  if(i){const prev=poses[i-1];total+=position.distanceTo(prev.position)+3.6*quaternion.angleTo(prev.quaternion);}
  poses.push({position,quaternion,distance:total});
 }
 return {length:total,sample(progress,position,quaternion){
  const distance=THREE.MathUtils.clamp(progress,0,1)*total;let lo=0,hi=samples;
  while(lo<hi){const mid=(lo+hi)>>1;if(poses[mid].distance<distance)lo=mid+1;else hi=mid;}
  const b=poses[lo],a=poses[Math.max(0,lo-1)],mix=b.distance===a.distance?0:(distance-a.distance)/(b.distance-a.distance);
  position.copy(a.position).lerp(b.position,mix);quaternion.copy(a.quaternion).slerp(b.quaternion,mix);
 }};
}
// Critically damped motion with a speed limit, stable across frame rates.
export function advanceProgress(state,target,dt){
 const previous=state.value,smoothTime=.38,maxSpeed=.20,omega=2/smoothTime;
 const x=omega*dt,decay=1/(1+x+.48*x*x+.235*x*x*x);
 const delta=THREE.MathUtils.clamp(state.value-target,-maxSpeed*smoothTime,maxSpeed*smoothTime);
 const goal=state.value-delta,temp=(state.velocity+omega*delta)*dt;
 state.velocity=(state.velocity-omega*temp)*decay;state.value=goal+(delta+temp)*decay;
 if((target-previous>0)===(state.value>target)){state.value=target;state.velocity=0;}
 if(Math.abs(target-state.value)<.00002&&Math.abs(state.velocity)<.0001){state.value=target;state.velocity=0;}
 return state.value;
}

export function createInteriorTrack(){
// Slow entry, a window-side arc, a look back across the lounge, then the final hero.
const route=new THREE.CatmullRomCurve3([[3.8,1.62,11],[3.8,1.6,8.5],[3.8,1.57,6.6],[3.5,1.52,4.7],[1.2,1.48,3.55],[-2.0,1.48,3.35],[-4.9,1.5,2.9],[-5.05,1.54,-.5],[-4.8,1.55,-3.35],[-2,1.53,-3.5],[.65,1.51,-3.35],[.85,1.47,-.25],[1.15,1.44,2.65],[.15,1.42,5.2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.3);
const gaze=new THREE.CatmullRomCurve3([[3.8,1.4,-2],[3.6,1.4,-2],[2.7,1.35,-2.1],[1.3,1.15,-1.6],[-.6,1,-.7],[-1.1,.95,-.4],[-1,.95,-.35],[-.5,1.05,-.6],[-.5,1.05,-.6],[-.5,1.05,-.6],[-.5,1.05,-.6],[-1,1,-.1],[.25,1.2,-2],[0,1.4,-2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.3);
return createCameraTrack(route,gaze);

}
