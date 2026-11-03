import * as THREE from 'three';
import {advanceProgress} from './walkthrough-motion.js?v=corridor-9';
import {curtainPhases,curtainCamera,curtainOpening} from './curtain-motion.js?v=corridor-9';
import {createCurtainScene} from './curtain-scene.js?v=corridor-9';

const sequence=document.querySelector('.curtain-sequence'),stage=sequence?.querySelector('.curtain-stage'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,interior,camera,ready=false,booting=false,visible=false,raf=0,last=0,target=0,range=1,origin=0;
const motion={value:0,velocity:0};
function request(){if(ready&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
function scrollState(){if(!ready||reduce.matches)return;origin=sequence.getBoundingClientRect().top+scrollY;range=Math.max(1,sequence.offsetHeight-stage.clientHeight);target=THREE.MathUtils.clamp((scrollY-origin)/range,0,1);request();}
function resize(){if(!ready)return;origin=sequence.getBoundingClientRect().top+scrollY;range=Math.max(1,sequence.offsetHeight-stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.25:1.5));renderer.setSize(stage.clientWidth,stage.clientHeight);scrollState();}
function render(time){
 raf=0;if(!ready||!visible||document.hidden||reduce.matches)return;
 const dt=Math.min((time-last)/1000||.016,.05);last=time;const p=advanceProgress(motion,target,dt),phase=curtainPhases(p),pose=curtainCamera(phase.turn,camera.aspect);
 camera.position.copy(pose.position);camera.lookAt(pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();interior.update(curtainOpening(phase.open,camera.aspect),phase.room);
 stage.style.setProperty('--curtain-expand',phase.expand.toFixed(5));stage.style.setProperty('--curtain-image',phase.image.toFixed(5));stage.style.setProperty('--curtain-copy',phase.copy.toFixed(5));stage.style.setProperty('--curtain-room',phase.room.toFixed(5));stage.style.setProperty('--curtain-page',phase.page.toFixed(5));stage.querySelector('.curtain-skip').hidden=p>.95;
 stage.dataset.progress=p.toFixed(4);stage.dataset.open=phase.open.toFixed(4);stage.dataset.turn=phase.turn.toFixed(4);
 renderer.render(interior.scene,camera);if(p!==target)request();
}
function fallback(){ready=false;cancelAnimationFrame(raf);raf=0;sequence.classList.remove('curtain-ready');stage.style.cssText='';renderer?.dispose();stage.querySelector('.curtain-canvas').replaceChildren();motion.value=motion.velocity=target=0;}
async function boot(){
 if(ready||booting||reduce.matches)return;booting=true;
 try{
  const photo=stage.querySelector('.quote-interlude-photo');await photo.decode();
  interior=await createCurtainScene();if(reduce.matches)return;renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'default'});renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');stage.querySelector('.curtain-canvas').append(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});
  camera=new THREE.PerspectiveCamera(52,1,.05,35);ready=true;sequence.classList.add('curtain-ready');resize();
 }catch(error){fallback();console.error('Curtain transition unavailable:',error);}finally{booting=false;}
}
if(sequence){
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;boot();request();}},{rootMargin:'800px'}).observe(sequence);
 addEventListener('scroll',scrollState,{passive:true});addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{last=0;request();});
 new ResizeObserver(()=>{if(ready)resize();}).observe(document.querySelector('main'));
 reduce.addEventListener('change',()=>{if(reduce.matches)fallback();else boot();});
 stage.querySelector('.curtain-skip').addEventListener('click',()=>{if(ready){motion.value=target=1;motion.velocity=0;scrollTo({top:origin+range,behavior:'instant'});request();}});
 sequence.nextElementSibling.addEventListener('focusin',()=>{if(ready&&motion.value<.96){motion.value=target=1;motion.velocity=0;scrollTo({top:origin+range,behavior:'instant'});request();}});
}
