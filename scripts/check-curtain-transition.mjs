import assert from 'node:assert/strict';
import {curtainPhases,curtainCamera,curtainOpening,createCurtainGeometry,updateCurtainGeometry,createDiningDepthGeometry} from '../dist/curtain-motion.js';
for(const side of [-1,1]){
 const geometry=createCurtainGeometry();let previousWidth=Infinity;
 for(let i=0;i<=100;i++){
  updateCurtainGeometry(geometry,side,i/100);geometry.computeBoundingBox();const box=geometry.boundingBox,width=box.max.x-box.min.x;
  assert.ok(width<=previousWidth+.00001);previousWidth=width;
  assert.ok(box.min.y>=-3.02&&box.max.y<5.02);assert.ok(side<0?box.min.x>=-4.72:box.max.x<=4.72);
  for(const a of [geometry.attributes.position,geometry.attributes.normal])assert.ok(a.array.every(Number.isFinite));
  const normals=geometry.attributes.normal;for(let j=0;j<normals.count;j++)assert.ok(normals.getZ(j)>0,'both mirrored panels must face into the room');
 }
 assert.ok(previousWidth>1.2&&previousWidth<1.3,'gathered linen retains its physical bulk');updateCurtainGeometry(geometry,side,0);geometry.computeBoundingBox();assert.ok(geometry.boundingBox.max.x-geometry.boundingBox.min.x>3.45);geometry.dispose();
}
let previous=curtainPhases(0);
for(let i=1;i<=1000;i++){
 const phase=curtainPhases(i/1000);for(const [name,value] of Object.entries(phase)){assert.ok(value>=0&&value<=1);assert.ok(Math.abs(value-previous[name])<.025);}
 if(phase.open>0)assert.equal(phase.turn,1,'turn must finish before opening fabric');
 for(const aspect of [.44,1.75,2.5]){const camera=curtainCamera(phase.turn,aspect);assert.ok(camera.position.x>-4&&camera.position.y>1.6);assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(Math.hypot(camera.position.x,camera.position.y-1.65,camera.position.z-5.8)<.68,'keep photographic parallax within the supported camera envelope');}
 previous=phase;
}
assert.equal(curtainPhases(0).image,1);assert.equal(curtainPhases(1).open,1);assert.equal(curtainPhases(1).room,0);
for(const aspect of [.35,.44,1,1.75,2.5,4]){const {fov}=curtainCamera(1,aspect),halfWidth=2.25*Math.tan(fov*Math.PI/360)*aspect,opening=curtainOpening(1,aspect);assert.ok(-.01+3.46*opening>halfWidth+.3,'panels must clear the whole viewport');assert.ok(3.46*curtainOpening(.2,aspect)<halfWidth,'fabric must remain visible during the first fifth of opening, including on phones');}
const depth=createDiningDepthGeometry(),vertices=depth.attributes.position,uv=depth.attributes.uv,h=2*3.8*Math.tan(26*Math.PI/180),w=h*1642/958;
for(let i=0;i<vertices.count;i++){const distance=5.8-vertices.getZ(i);assert.ok(Math.abs(vertices.getX(i)/distance-(uv.getX(i)-.5)*w/3.8)<.000001);assert.ok(Math.abs((vertices.getY(i)-1.65)/distance-(uv.getY(i)-.5)*h/3.8)<.000001,'photographic projection must align with the original image');}
depth.dispose();
console.log('PASS: finite pleated fabric and normals, anchored compression, reversible opening, turn before reveal and safe camera path.');
