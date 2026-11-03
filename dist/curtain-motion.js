import * as THREE from './vendor/three/three.module.min.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
export function curtainPhases(p){return {expand:ease(p/.19),image:1-ease((p-.16)/.15),copy:1-ease((p-.08)/.13),turn:ease((p-.29)/.32),open:ease((p-.64)/.30),room:1-ease((p-.59)/.09),page:ease((p-.59)/.09)};}
// A sewn, pleated surface: gathers compress horizontally while each fold retains depth.
export function createCurtainGeometry(){return new THREE.PlaneGeometry(1,1,192,48);}
export function updateCurtainGeometry(geometry,side,opening){
 const p=geometry.attributes.position,uv=geometry.attributes.uv,width=THREE.MathUtils.lerp(3.46,.27,opening);
 for(let i=0;i<p.count;i++){
  const u=uv.getX(i),v=uv.getY(i),bottom=1-v,fold=Math.sin(u*Math.PI*24),secondary=Math.sin(u*Math.PI*48+.35);
  const x=side*(3.45-u*width),y=.035+v*3.68+.018*Math.cos(u*Math.PI*24)*bottom*bottom;
  const z=(.05+.014*bottom)*fold+.005*secondary+.012*Math.sin(v*5+u*7)*bottom+.025*Math.sin(v*Math.PI)*Math.sin(opening*Math.PI)*(1-u);
  p.setXYZ(i,x,y,z);
 }
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
}
export function curtainCamera(turn,aspect){
 const position=new THREE.Vector3(0,1.65,5.8).lerp(new THREE.Vector3(-2.03,1.72,.8),turn);
 const target=new THREE.Vector3(0,1.35,-.7).lerp(new THREE.Vector3(-4,1.72,.8),turn);
 const fov=aspect<.8?66:aspect>1.8?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(26))*1.8/aspect)):52;
 return {position,target,fov};
}
export function curtainOpening(open,aspect){const {fov}=curtainCamera(1,aspect),halfWidth=1.94*Math.tan(THREE.MathUtils.degToRad(fov/2))*aspect;return open*Math.min(1,(halfWidth+.35)/3.19);}
