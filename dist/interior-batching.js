import * as THREE from './vendor/three/three.module.min.js';
import {mergeGeometries} from './vendor/three/BufferGeometryUtils.js';
// Bake world transforms into static batches. Materials, UVs and shadow behavior stay intact.
export function batchStaticInterior(scene){
 scene.updateMatrixWorld(true);const groups=new Map();let before=0,removed=0,created=0;
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;before++;
  if(mesh.isInstancedMesh||mesh.children.length||Array.isArray(mesh.material)||mesh.material.transparent)return;
  const signature=Object.keys(mesh.geometry.attributes).sort().join(','),key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,signature].join('|');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 });
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const geometries=meshes.map(mesh=>{const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);g.clearGroups();return g;});
  const geometry=mergeGeometries(geometries,false);for(const g of geometries)g.dispose();if(!geometry)continue;
  geometry.computeBoundingSphere();const batch=new THREE.Mesh(geometry,meshes[0].material);batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;batch.name='Static interior / '+meshes.length+' parts';scene.add(batch);
  for(const mesh of meshes)mesh.removeFromParent();removed+=meshes.length;created++;
 }
 const stats={before,after:before-removed+created,batches:created};scene.userData.meshStats=stats;return stats;
}
