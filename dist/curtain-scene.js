import * as THREE from 'three';
import {RectAreaLightUniformsLib} from './vendor/three/lights/RectAreaLightUniformsLib.js';
import {createCurtainGeometry,updateCurtainGeometry,createDiningDepthGeometry,ease} from './curtain-motion.js?v=natural-13';

// Photographic depth stage, with independently modelled linen curtains.
export async function createCurtainScene(){
 RectAreaLightUniformsLib.init();
 const scene=new THREE.Scene(),loader=new THREE.TextureLoader();
 const load=async(file,color=false)=>{const t=await loader.loadAsync(new URL('./assets/'+file,import.meta.url).href);t.anisotropy=8;if(color)t.colorSpace=THREE.SRGBColorSpace;return t;};
 const [photo,linen,normal]=await Promise.all([load('dining-v2.webp',true),load('interior/linen-color.webp',true),load('interior/linen-normal.webp')]);
 photo.wrapS=photo.wrapT=THREE.MirroredRepeatWrapping;
 const roomMaterial=new THREE.MeshBasicMaterial({map:photo,toneMapped:false,transparent:true,depthWrite:false});
 const room=new THREE.Mesh(createDiningDepthGeometry(),roomMaterial);scene.add(room);
 // Retain the scan's weave while removing its original dye.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(linen.image,0,0,512,512);const data=ctx.getImageData(0,0,512,512);
 for(let i=0;i<data.data.length;i+=4){const l=data.data[i]*.2126+data.data[i+1]*.7152+data.data[i+2]*.0722,v=Math.min(245,145+l*.65);data.data[i]=data.data[i+1]=data.data[i+2]=v;}ctx.putImageData(data,0,0);linen.dispose();
 const weave=new THREE.CanvasTexture(canvas);weave.colorSpace=THREE.SRGBColorSpace;
 for(const t of [weave,normal]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,9);t.anisotropy=8;}
 const cloth=new THREE.MeshPhysicalMaterial({map:weave,color:'#eee6d7',normalMap:normal,normalScale:new THREE.Vector2(.3,.3),roughness:.98,side:THREE.DoubleSide,sheen:.35,sheenColor:new THREE.Color('#ede2cf'),sheenRoughness:.9,transparent:true});
 cloth.forceSinglePass=true;
 const headingMaterial=cloth.clone();headingMaterial.color.set('#d9ceba');headingMaterial.sheen=.2;
 const curtains=new THREE.Group();curtains.position.set(-2.7,0,5.3);curtains.rotation.y=Math.PI/2;scene.add(curtains);
 const panels=[-1,1].map(side=>{const g=createCurtainGeometry();updateCurtainGeometry(g,side,0);const mesh=new THREE.Mesh(g,cloth);mesh.renderOrder=1;curtains.add(mesh);
  const top=new THREE.PlaneGeometry(1,1,192,4),hem=new THREE.PlaneGeometry(1,1,192,2);updateCurtainGeometry(top,side,0);updateCurtainGeometry(hem,side,0);const upper=new THREE.Mesh(top,headingMaterial),lower=new THREE.Mesh(hem,headingMaterial);upper.renderOrder=lower.renderOrder=2;curtains.add(upper,lower);return {g,side,top,hem};});
 scene.add(new THREE.HemisphereLight('#fff9ed','#b9b0a0',.7));
 const key=new THREE.RectAreaLight('#fff5e6',1.8,1.6,3);key.position.set(-.4,2,5.5);key.lookAt(-2.7,1.8,5.3);scene.add(key);
 const fill=new THREE.RectAreaLight('#dfe4e5',.5,2.5,3.4);fill.position.set(-1.1,2.1,2);fill.lookAt(-2.7,1.6,5.3);scene.add(fill);
 let priorOpening=-1;
 function band(target,source,from,to){const p=target.attributes.position,uv=target.attributes.uv,a=source.attributes.position;for(let i=0;i<p.count;i++){const u=uv.getX(i),v=from+(to-from)*uv.getY(i),column=Math.round(u*192),row=(1-v)*64,index=Math.floor(row)*193+column,next=Math.min(64,Math.ceil(row))*193+column,t=row-Math.floor(row);p.setXYZ(i,THREE.MathUtils.lerp(a.getX(index),a.getX(next),t),THREE.MathUtils.lerp(a.getY(index),a.getY(next),t),THREE.MathUtils.lerp(a.getZ(index),a.getZ(next),t)+.002);}p.needsUpdate=true;target.computeVertexNormals();target.computeBoundingSphere();}
 return {scene,update(opening,opacity,turn=1){
  room.visible=opacity>.001;roomMaterial.opacity=opacity;
  const clothVisible=ease((turn-.07)/.15),clothAlpha=clothVisible*(1-.09*opacity);curtains.visible=clothVisible>.001;cloth.opacity=clothAlpha;headingMaterial.opacity=clothVisible;
  if(Math.abs(opening-priorOpening)>.00001){for(const {g,side,top,hem} of panels){updateCurtainGeometry(g,side,opening);band(top,g,.965,1);band(hem,g,0,.018);}priorOpening=opening;}
 }};
}
