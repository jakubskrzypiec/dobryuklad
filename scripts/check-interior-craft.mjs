import assert from 'node:assert/strict';import * as THREE from '../dist/vendor/three/three.module.min.js';
import {upholsteryGeometry,createBotanical,addCraftDetails,addUpholsteryWelt} from '../dist/interior-craft.js';
import {addCourtyardAndArt} from '../dist/interior-courtyard.js';
import {batchStaticInterior} from '../dist/interior-batching.js';
const scene=new THREE.Scene(),sofa=new THREE.Group();sofa.position.set(-1.9,0,-.55);scene.add(sofa);const material=new THREE.MeshPhysicalMaterial({color:'#cabba1'});
const mesh=(geometry,m,x,y,z,parent=scene)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
const box=(w,h,d,m,x,y,z,parent)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
const cylinder=(rt,rb,h,m,x,y,z,parent)=>mesh(new THREE.CylinderGeometry(rt,rb,h,32),m,x,y,z,parent);
const lathe=(points,m,x,y,z,parent)=>mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),32),m,x,y,z,parent);
const tube=(points,r,m,parent)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),24,r,6),m,0,0,0,parent);
for(const args of [[1.32,.3,1.35,false],[.78,.68,.21,true],[.55,.08,.46,false]]){const geometry=upholsteryGeometry(...args),o=mesh(geometry,material,0,0,0);addUpholsteryWelt(o,args[0],args[1],args[2],args[3],material);}
const botanical=createBotanical(scene,material);addCourtyardAndArt({scene,box,cylinder,tube,leafGeometry:botanical.leafGeometry,oak:material,bronze:material,dark:material,plaster:material});addCraftDetails({scene,sofa,box,cylinder,lathe,tube,linen:material,oak:material,metal:material,bronze:material,marble:material,paper:material,dark:material,plaster:material,texture:()=>null});
scene.updateMatrixWorld(true);
scene.traverse(o=>{if(o.geometry){for(const a of Object.values(o.geometry.attributes))for(const n of a.array)assert.ok(Number.isFinite(n),'nonfinite geometry '+o.geometry.type);o.geometry.computeBoundingSphere();assert.ok(Number.isFinite(o.geometry.boundingSphere.radius));}});
const countertop=scene.children.find(o=>o.geometry?.type==='ExtrudeGeometry'&&Math.abs(o.position.x-3.94)<.01);assert.ok(countertop);
const ray=new THREE.Raycaster(new THREE.Vector3(4.45,2,-5.53),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObject(countertop).length,0,'sink opening must remain clear');ray.ray.origin.x=3;assert.ok(ray.intersectObject(countertop).length>0,'counter slab must remain solid outside sink');
const beforeBounds=new THREE.Box3().setFromObject(scene),stats=batchStaticInterior(scene),afterBounds=new THREE.Box3().setFromObject(scene);assert.ok(stats.after<stats.before*.6,'static batching should cut mesh count');assert.ok(beforeBounds.min.distanceTo(afterBounds.min)<1e-5);assert.ok(beforeBounds.max.distanceTo(afterBounds.max)<1e-5);
console.log('PASS: all craft geometry finite, real sink opening, intact countertop, static batches preserve world bounds.');console.log(stats);
