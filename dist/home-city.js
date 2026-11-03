import * as THREE from './vendor/three/three.module.min.js';
// Conceptual neighbourhood, deliberately unrelated to the previous Koszalin street plan.
export function addHomeCity(scene){
 const group=new THREE.Group();group.name='Conceptual city approach';scene.add(group);
 const plaster=new THREE.MeshStandardMaterial({color:'#dbd3c6',roughness:.96}),roof=new THREE.MeshStandardMaterial({color:'#b9b1a4',roughness:.92}),glass=new THREE.MeshPhysicalMaterial({color:'#8f9d9d',metalness:.18,roughness:.38}),stone=new THREE.MeshStandardMaterial({color:'#c9c1b5',roughness:.95}),street=new THREE.MeshStandardMaterial({color:'#a9a69d',roughness:1});
 const box=(w,h,d,m,x,y,z,parent=group)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 box(160,.18,170,stone,0,-.23,0);box(150,.025,8,street,0,-.12,24);box(8,.026,150,street,23,-.12,0);
 const dummy=new THREE.Object3D(),windows=[];
 for(const [x,z,w,d,h] of [[-25,24,13,13,9],[-25,2,12,14,13],[-26,-23,15,12,10],[23,-23,13,12,12],[26,0,12,14,9],[30,42,16,13,10],[-26,48,12,14,8],[3,49,14,12,8],[-4,-28,16,12,10],[-50,2,14,17,15],[49,-24,13,16,16],[49,23,15,12,12]]){
  box(w,h,d,plaster,x,h/2,z);box(w+.35,.24,d+.35,roof,x,h+.12,z);box(w-.7,.08,d-.7,stone,x,h+.28,z);
  for(let y=1.6;y<h-1;y+=2.8)for(let dx=-w/2+1.6;dx<w/2-1;dx+=2.6)windows.push([x+dx,y,z+d/2+.012]);
  box(w+1,.025,d+1,roof,x,-.1,z);
 }
 const win=new THREE.InstancedMesh(new THREE.BoxGeometry(1.2,1.7,.025),glass,windows.length);windows.forEach((p,i)=>{dummy.position.set(...p);dummy.updateMatrix();win.setMatrixAt(i,dummy.matrix);});group.add(win);
 // The destination is the existing room: its real corridor opens onto this plaza.
 const entrance=new THREE.Group();entrance.name='Entrance to the hero room';scene.add(entrance);
 box(.24,3.7,.4,stone,2.25,1.85,11.8,entrance);box(.24,3.7,.4,stone,5.35,1.85,11.8,entrance);box(3.34,.65,.4,plaster,3.8,4.025,11.8,entrance);box(4.1,.16,2.4,roof,3.8,3.75,12.1,entrance);
 for(const x of [-3.65,-.8]){box(2.34,3.3,.12,stone,x,2.25,6.49,entrance);box(2.08,3.04,.025,glass,x,2.25,6.57,entrance);box(2.55,.1,.44,roof,x,.58,6.55,entrance);box(.045,3.03,.025,roof,x,2.25,6.59,entrance);}
 return {group,entrance};
}
