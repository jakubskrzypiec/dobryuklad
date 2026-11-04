import assert from 'node:assert/strict';
import {portfolioCameraAt,projectPanels,panelDepth,walkStops,portfolioPanelAt,dampPortfolioProgress} from '../dist/portfolio-walk-motion.js';
let previous=portfolioCameraAt(0);
for(let i=1;i<=4000;i++){
 const camera=portfolioCameraAt(i/4000);
 for(const value of [camera.x,camera.z,camera.yaw])assert.ok(Number.isFinite(value));
 assert.ok(camera.z<=previous.z+1e-8,'Camera must never move backwards');
 assert.ok(Math.abs(camera.x)<=220.00001,'Camera must stay in the clear gallery aisle');
 assert.ok(Math.abs(camera.yaw)<=Math.PI/2,'No spin past the project wall');
 assert.ok(Math.hypot(camera.x-previous.x,camera.z-previous.z)<5,'No position jumps');
 assert.ok(Math.abs(camera.yaw-previous.yaw)<.007,'No rotation jumps');
 previous=camera;
}
for(const [p,index] of [[.28,0],[.61,1],[.95,2]]){
 const camera=portfolioCameraAt(p),panel=projectPanels[index];
 const dx=panel.x-camera.x,dz=panel.z-camera.z;
 const localX=Math.cos(camera.yaw)*dx-Math.sin(camera.yaw)*dz;
 assert.ok(Math.abs(localX)<1e-8,'Held view must look directly at the correct project');
 assert.ok(panelDepth(camera,panel)>700,'Keep a safe distance from project surfaces');
 assert.equal(camera.project,index);
}
for(const stop of walkStops.slice(1,-1)){
 const a=portfolioCameraAt(stop.p-1e-7),b=portfolioCameraAt(stop.p+1e-7);
 assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.00001,'Continuous position at every stage boundary');
 assert.ok(Math.abs(a.yaw-b.yaw)<.000001,'Continuous turn at every stage boundary');
}
const values=[];
for(const fps of [30,60,120]){
 let p=0;
 for(let frame=0;frame<fps;frame++){
  const next=dampPortfolioProgress(p,1,1/fps);assert.ok(next>=p&&next<=1);p=next;
 }
 values.push(p);
}
assert.ok(Math.max(...values)-Math.min(...values)<1e-10,'Damping must be frame-rate independent');
assert.equal(portfolioCameraAt(1).project,2);
for(let i=0;i<=4000;i++){
 const p=i/4000,panels=projectPanels.map((_,index)=>portfolioPanelAt(p,index));
 assert.ok(panels.filter(panel=>panel.opacity>0).length<=1,'Never preview another project');
 for(const panel of panels){assert.ok(panel.opacity>=0&&panel.opacity<=1);assert.ok(panel.scale>=.68&&panel.scale<=1);}
}
assert.ok(projectPanels.every((_,index)=>portfolioPanelAt(0,index).opacity===0),'Start with no projects visible');
for(const [p,index] of [[.28,0],[.61,1],[.95,2]])assert.equal(portfolioPanelAt(p,index).opacity,1);
console.log('PASS: forward route, closer left/right/left views, hidden entry, one project at a time, continuous stops and 30/60/120 fps damping.');
