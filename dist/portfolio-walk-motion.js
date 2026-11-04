export const projectPanels=[{x:-980,z:-1200,rotation:90},{x:980,z:-2600,rotation:-90},{x:-980,z:-4000,rotation:90}];
const turn=Math.atan2(760,160);
export const walkStops=[
 {p:0,x:0,z:450,yaw:.12},{p:.08,x:0,z:180,yaw:.15},
 {p:.24,x:-220,z:-1040,yaw:turn},{p:.33,x:-220,z:-1040,yaw:turn},
 {p:.46,x:0,z:-1960,yaw:0},{p:.57,x:220,z:-2440,yaw:-turn},
 {p:.66,x:220,z:-2440,yaw:-turn},{p:.78,x:0,z:-3320,yaw:0},
 {p:.89,x:-220,z:-3840,yaw:turn},{p:1,x:-220,z:-3840,yaw:turn}
];
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>n*n*n*(n*(n*6-15)+10);
export function portfolioCameraAt(progress){
 const p=clamp(progress);let index=1;
 while(index<walkStops.length-1&&walkStops[index].p<p)index++;
 const a=walkStops[index-1],b=walkStops[index],t=ease(clamp((p-a.p)/(b.p-a.p)));
 return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+(b.yaw-a.yaw)*t,project:p<.41?0:p<.74?1:2};
}
export function panelDepth(camera,panel){
 const dx=panel.x-camera.x,dz=panel.z-camera.z;
 return -(Math.sin(camera.yaw)*dx+Math.cos(camera.yaw)*dz);
}
export function dampPortfolioProgress(current,target,dt){
 return current+(target-current)*(1-Math.exp(-10*Math.max(0,Math.min(.05,dt))));
}
// Disjoint reveal windows: future projects cannot be previewed along the aisle.
export function portfolioPanelAt(p,index){
 const [start,full,out,end]=[[.10,.20,.33,.39],[.44,.54,.66,.72],[.77,.87,1,1]][index];
 const approach=ease(clamp((p-start)/(full-start)));
 const opacity=approach*(end===1?1:1-ease(clamp((p-out)/(end-out))));
 return {opacity,scale:.68+.32*approach};
}
