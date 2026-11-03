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
// A short lounge-side arc returns smoothly to the matched photographic hero.
const route=new THREE.CatmullRomCurve3([[3.5,1.52,4.7],[.8,1.48,3.9],[-2.5,1.48,3.3],[-4.7,1.5,2.8],[-4.9,1.49,4.3],[-2.7,1.45,5.0],[.15,1.42,5.2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.3);
const gaze=new THREE.CatmullRomCurve3([[1.3,1.15,-1.6],[-.6,1,-.7],[-1.1,.98,-.4],[-1,.98,-.35],[-1,1,-.5],[-.3,1.2,-1.4],[0,1.4,-2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.3);
return createCameraTrack(route,gaze);

}

// Match object-fit:cover to the final 3D projection on portrait and ultrawide screens.
export function matchedHeroFov(aspect,referenceAspect=1662/946,baseFov=52){return aspect>referenceAspect?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov)*.5)*referenceAspect/aspect)):baseFov;}

// Stable, zero-roll descent from the same floor plan into the first walking pose.
export function createProjectIntroTrack(aspect){
 const height=Math.max(18.6,12.9/aspect)/(2*Math.tan(THREE.MathUtils.degToRad(45)*.5))*(aspect<.8?1.2:1.5);
 const centre=aspect<.8?2.5:1.4;
 const route=new THREE.CatmullRomCurve3([[0,height,centre+.7],[0,17,4.2],[1.8,9,5],[3.5,3.7,4.9],[3.5,1.52,4.7]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.2);
 const gaze=new THREE.CatmullRomCurve3([[0,0,centre],[0,0,1],[1.8,.5,0],[2,1,-1.6],[1.3,1.15,-1.6]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.2);
 const euler=new THREE.Euler(0,0,0,'YXZ');
 return {height,sample(t,position,quaternion){position.copy(route.getPoint(t));const target=gaze.getPoint(t),dx=target.x-position.x,dy=target.y-position.y,dz=target.z-position.z,horizontal=Math.hypot(dx,dz);euler.set(Math.atan2(dy,horizontal),horizontal<1e-6?0:Math.atan2(-dx,-dz),0,'YXZ');quaternion.setFromEuler(euler);}};
}
