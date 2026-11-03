import * as THREE from './vendor/three/three.module.min.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
export function curtainPhases(p){return {expand:ease(p/.19),image:1-ease((p-.16)/.15),copy:1-ease((p-.08)/.13),turn:ease((p-.29)/.32),open:ease((p-.64)/.30),room:1-ease((p-.59)/.09),page:ease((p-.59)/.09)};}
// A sewn, pleated surface: gathers compress horizontally while each fold retains depth.
export function createCurtainGeometry(){return new THREE.PlaneGeometry(1,1,192,64);}
export function updateCurtainGeometry(geometry,side,opening){
 if(side===1&&!geometry.userData.windingCorrected){const index=geometry.index;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}index.needsUpdate=true;geometry.userData.windingCorrected=true;}
 const p=geometry.attributes.position,uv=geometry.attributes.uv,width=THREE.MathUtils.lerp(3.46,1.25,opening),anchor=3.45+1.25*opening;
 for(let i=0;i<p.count;i++){
  const u=uv.getX(i),v=uv.getY(i),bottom=1-v,phase=u*Math.PI*20+.2*Math.sin(u*Math.PI*6)+.08*Math.sin(v*Math.PI*2+u*3);
  const x=side*(anchor-u*width+.012*Math.sin(v*Math.PI)*Math.sin(u*Math.PI*3)),y=-3+v*8+.012*Math.sin(u*Math.PI*20+.5)*Math.pow(bottom,4);
  const z=(.075+.025*opening+.009*Math.sin(u*7))*(.8*Math.sin(phase)+.16*Math.sin(phase*2))+.014*Math.sin(v*4+u*5)*bottom;
  p.setXYZ(i,x,y,z);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
export function curtainCamera(turn,aspect){
 const position=new THREE.Vector3(0,1.65,5.8).lerp(new THREE.Vector3(-.45,1.7,5.3),turn);
 const target=new THREE.Vector3(0,1.65,2).lerp(new THREE.Vector3(-2.7,1.7,5.3),turn);
 const start=aspect>1642/958?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(26))*(1642/958)/aspect)):52;
 const end=aspect<.8?60:aspect>1.8?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(26))*1.8/aspect)):52;
 const fov=THREE.MathUtils.lerp(start,end,turn);
 return {position,target,fov};
}
export function curtainOpening(open,aspect){const {fov}=curtainCamera(1,aspect),halfWidth=2.25*Math.tan(THREE.MathUtils.degToRad(fov/2))*aspect;return open*Math.min(1,(halfWidth+.35)/3.46);}

// Camera-projected depth surface preserves the reference image at the start.
// Foreground floor has real parallax during the restrained half-metre camera move.
export function createDiningDepthGeometry(){
 const geometry=new THREE.PlaneGeometry(1,1,128,80),p=geometry.attributes.position,uv=geometry.attributes.uv,height=2*3.8*Math.tan(THREE.MathUtils.degToRad(26)),width=height*1642/958;
 for(let i=0;i<p.count;i++){const u=-.22+uv.getX(i)*1.44,v=-.1+uv.getY(i)*1.2,depth=3.8-1.05*ease((.45-v)/.45),scale=depth/3.8;uv.setXY(i,u,v);p.setXYZ(i,(u-.5)*width*scale,1.65+(v-.5)*height*scale,5.8-depth);}
 geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
