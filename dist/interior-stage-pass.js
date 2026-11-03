import * as THREE from 'three';
import {Pass,FullScreenQuad} from './vendor/three/postprocessing/Pass.js';
// The clay and material renders share geometry and camera; only surface/light changes dissolve.
export class InteriorStagePass extends Pass{
 constructor(projectScene,interiorScene,camera){
  super();this.needsSwap=false;this.projectScene=projectScene;this.interiorScene=interiorScene;this.camera=camera;this.mix=0;
  this.clayTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});this.roomTarget=this.clayTarget.clone();
  this.quad=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:{clay:{value:this.clayTarget.texture},room:{value:this.roomTarget.texture},blend:{value:0}},vertexShader:'varying vec2 uvScene;void main(){uvScene=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D clay;uniform sampler2D room;uniform float blend;varying vec2 uvScene;void main(){vec3 a=sqrt(max(texture2D(clay,uvScene).rgb,vec3(0.0)));vec3 b=sqrt(max(texture2D(room,uvScene).rgb,vec3(0.0)));vec3 c=mix(a,b,blend);gl_FragColor=vec4(c*c,1.0);}',depthTest:false,depthWrite:false}));
 }
 setSize(w,h){this.clayTarget.setSize(w,h);this.roomTarget.setSize(w,h);}
 render(renderer,writeBuffer,readBuffer){
  const destination=this.renderToScreen?null:readBuffer;
  if(this.mix<=.0001||this.mix>=.9999){renderer.setRenderTarget(destination);renderer.clear();renderer.render(this.mix<=.0001?this.projectScene:this.interiorScene,this.camera);return;}
  renderer.setRenderTarget(this.clayTarget);renderer.clear();renderer.render(this.projectScene,this.camera);
  renderer.setRenderTarget(this.roomTarget);renderer.clear();renderer.render(this.interiorScene,this.camera);
  this.quad.material.uniforms.blend.value=this.mix;renderer.setRenderTarget(destination);renderer.clear();this.quad.render(renderer);
 }
 dispose(){this.clayTarget.dispose();this.roomTarget.dispose();this.quad.material.dispose();this.quad.dispose();}
}
