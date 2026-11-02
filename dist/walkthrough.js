import * as THREE from 'three';
import {createInterior} from './interior-scene.js';
import {walkthroughPhases,HERO_STOP} from './walkthrough-timing.js';
import {EffectComposer} from './vendor/three/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/three/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/three/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/three/postprocessing/OutputPass.js';

const sequence=document.querySelector('.walkthrough-sequence'),stage=sequence.querySelector('.walkthrough-stage'),container=stage.querySelector('.walkthrough-canvas'),final=stage.querySelector('.walkthrough-final'),status=stage.querySelector('.walkthrough-loading'),header=document.querySelector('.header'),skip=stage.querySelector('.walkthrough-skip'),progress=stage.querySelector('progress');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,scene,camera,composer,ao,raf=0,target=0,current=0,last=0,visible=true,ready=false,range=1,origin=0;
const route=new THREE.CatmullRomCurve3([[3.8,1.62,11.0],[3.8,1.6,8.8],[3.75,1.55,6.6],[2.25,1.48,4.7],[.15,1.42,5.2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.12);
const gaze=new THREE.CatmullRomCurve3([[3.8,1.4,-2],[3.5,1.4,-2.4],[1.8,1.4,-2.5],[.4,1.4,-2.1],[0,1.4,-2]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.12);
function revealHero(alpha){
 stage.style.setProperty('--hero-reveal',alpha.toFixed(4));stage.style.setProperty('--tour-ui',Math.max(0,1-alpha*2).toFixed(4));
 stage.querySelector('.walkthrough-classic').inert=alpha>.4;
 const usable=alpha>=.995;final.inert=!usable;final.setAttribute('aria-hidden',String(!usable));
 stage.classList.toggle('is-hero',usable);container.setAttribute('aria-hidden',String(usable));skip.hidden=!ready||reduce.matches||alpha>.4;
}
function staticHero(){
 const wasVisible=document.body.classList.contains('walkthrough-active')&&stage.getBoundingClientRect().top<=0&&stage.getBoundingClientRect().bottom>0;
 document.body.classList.remove('walkthrough-active');revealHero(1);skip.hidden=true;status.hidden=true;
 header.style.removeProperty('transform');header.inert=false;stage.dataset.phase='hero';
 if(wasVisible)scrollTo({top:origin,behavior:'instant'});
}
function scrollState(){
 if(!ready||reduce.matches)return;
 target=THREE.MathUtils.clamp((scrollY-origin)/range,0,1);progress.value=target;
 const offset=Math.min(0,sequence.getBoundingClientRect().bottom-stage.clientHeight);
 header.style.transform=offset===0?'':'translateY('+offset.toFixed(2)+'px)';header.inert=sequence.getBoundingClientRect().bottom<40;
 request();
}
function resize(){
 if(!ready)return;
 origin=sequence.getBoundingClientRect().top+scrollY;range=Math.max(1,sequence.offsetHeight-stage.clientHeight);
 const mobile=innerWidth<760,ratio=Math.min(devicePixelRatio,mobile?1.25:1.75);
 renderer.setPixelRatio(ratio);renderer.setSize(stage.clientWidth,stage.clientHeight);composer.setPixelRatio(ratio);composer.setSize(stage.clientWidth,stage.clientHeight);ao.enabled=!mobile;
 camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();scrollState();
}
function render(time){
 raf=0;if(!ready||!visible||document.hidden||reduce.matches)return;
 const dt=Math.min((time-last)/1000||.016,.05);last=time;current+=(target-current)*(1-Math.exp(-dt*10));if(Math.abs(target-current)<.0002)current=target;
 const phase=walkthroughPhases(current);camera.position.copy(route.getPointAt(phase.travel));camera.lookAt(gaze.getPointAt(phase.travel));
 camera.fov=THREE.MathUtils.lerp(innerWidth<760?78:60,52,phase.travel);camera.updateProjectionMatrix();
 revealHero(phase.hero);
 // Once the photograph is fully opaque the GPU no longer renders the hidden scene.
 if(phase.hero<.999)composer.render();
 stage.dataset.cameraProgress=current.toFixed(4);stage.dataset.cameraTravel=phase.travel.toFixed(4);stage.dataset.heroOpacity=phase.hero.toFixed(4);stage.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(3)).join(',');stage.dataset.phase=phase.hold?'hero':phase.hero>0?'blend':'walk';
 if(current!==target)request();
}
function request(){if(ready&&visible&&!document.hidden&&!reduce.matches&&!raf)raf=requestAnimationFrame(render);}
function mode(){if(reduce.matches){if(raf)cancelAnimationFrame(raf);raf=0;staticHero();}else if(ready){document.body.classList.add('walkthrough-active');resize();}else boot();}
function fail(error){ready=false;if(raf)cancelAnimationFrame(raf);raf=0;staticHero();if(error)console.error('Interior preview could not start:',error);}
let booting=false;
async function boot(){
 if(booting||ready)return;if(reduce.matches){staticHero();return;}booting=true;
 try{
  // Decode the exact final photograph before showing the 3D entry.
  await final.querySelector('.hero-photo').decode().catch(()=>{});
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');container.replaceChildren(renderer.domElement);
  camera=new THREE.PerspectiveCamera(60,1,.06,70);const interior=await createInterior();scene=interior.scene;
  // Capture the actual room for coloured, rough reflections instead of a white studio preset.
  const capture=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType}),cube=new THREE.CubeCamera(.1,60,capture);cube.position.copy(interior.capturePosition);renderer.shadowMap.needsUpdate=true;cube.update(renderer,scene);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromCubemap(capture.texture);scene.environment=environment.texture;scene.environmentIntensity=.6;capture.dispose();pmrem.dispose();
  composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4}));composer.addPass(new RenderPass(scene,camera));ao=new SSAOPass(scene,camera,stage.clientWidth,stage.clientHeight,24);ao.kernelRadius=.34;ao.minDistance=.0003;ao.maxDistance=.03;composer.addPass(ao);composer.addPass(new OutputPass());
  ready=true;current=target=0;status.hidden=true;mode();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request();}},{rootMargin:'120px'}).observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
 }catch(error){fail(error);}finally{booting=false;}
}
skip.addEventListener('click',()=>{if(!ready)return;current=target=HERO_STOP;scrollTo({top:origin+range*HERO_STOP,behavior:'instant'});request();});
final.addEventListener('focusin',()=>{if(ready&&!reduce.matches&&current<.81){current=target=HERO_STOP;scrollTo({top:origin+range*HERO_STOP,behavior:'instant'});request();}});
addEventListener('scroll',scrollState,{passive:true});addEventListener('resize',resize,{passive:true});addEventListener('pageshow',resize);document.addEventListener('visibilitychange',()=>{last=0;request();});reduce.addEventListener('change',mode);
await boot();
