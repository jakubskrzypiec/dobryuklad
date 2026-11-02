import * as THREE from 'three';
import {RoomEnvironment} from './vendor/three/RoomEnvironment.js';
import {createInterior} from './interior-model.js';
import {EffectComposer} from './vendor/three/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/three/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/three/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/three/postprocessing/OutputPass.js';

const sequence=document.querySelector('.walkthrough-sequence'),stage=document.querySelector('.walkthrough-stage'),container=document.querySelector('.walkthrough-canvas'),status=document.querySelector('.walkthrough-loading'),header=document.querySelector('.header'),skip=document.querySelector('.walkthrough-skip'),progress=document.querySelector('.walkthrough-guide progress');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,scene,camera,composer,ao,raf=0,target=0,current=0,last=0,visible=true,ready=false,range=1,origin=0;
const route=new THREE.CatmullRomCurve3([[0,1.65,9.8],[0,1.65,6.2],[0,1.65,3.5],[-.55,1.65,.9],[-.6,1.65,-2.3],[-.35,1.65,-4.5]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.15);
const gaze=new THREE.CatmullRomCurve3([[0,1.45,-.5],[0,1.45,-1.5],[.1,1.4,-3],[1.5,1.35,-4],[3.2,1.2,-2.2],[3.65,1.15,-.5]].map(p=>new THREE.Vector3(...p)),false,'catmullrom',.15);
function scrollState(){if(!ready)return;const p=THREE.MathUtils.clamp((scrollY-origin)/range,0,1);target=reduce.matches ? .35 : p;progress.value=p;const offset=Math.min(0,sequence.getBoundingClientRect().bottom-stage.clientHeight);header.style.transform=reduce.matches||offset===0?'':'translateY('+offset.toFixed(2)+'px)';header.inert=!reduce.matches&&sequence.getBoundingClientRect().bottom<40;request();}
function resize(){if(!ready)return;origin=sequence.getBoundingClientRect().top+scrollY;range=Math.max(1,sequence.offsetHeight-stage.clientHeight);const ratio=Math.min(devicePixelRatio,innerWidth<760?1:1.25);renderer.setPixelRatio(ratio);renderer.setSize(stage.clientWidth,stage.clientHeight);if(composer){composer.setPixelRatio(ratio);composer.setSize(stage.clientWidth,stage.clientHeight);ao.enabled=innerWidth>=760;}camera.aspect=stage.clientWidth/stage.clientHeight;camera.fov=innerWidth<760?82:57;camera.updateProjectionMatrix();scrollState();}
function render(time){raf=0;if(!ready||!visible||document.hidden)return;const dt=Math.min((time-last)/1000||.016,.05);last=time;current=reduce.matches?target:current+(target-current)*(1-Math.exp(-dt*9));if(Math.abs(target-current)<.0003)current=target;camera.position.copy(route.getPointAt(current));camera.lookAt(gaze.getPointAt(current));if(composer)composer.render();else renderer.render(scene,camera);stage.dataset.cameraProgress=current.toFixed(4);stage.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(3)).join(',');if(current!==target)request();}
function request(){if(ready&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
function mode(){if(!ready)return;document.body.classList.toggle('walkthrough-active',!reduce.matches);skip.hidden=reduce.matches;resize();}
function fail(){ready=false;document.body.classList.remove('walkthrough-active','walkthrough-ready');header.style.removeProperty('transform');header.inert=false;skip.hidden=true;status.textContent='Otwórz klasyczny widok strony, jeśli podgląd 3D nie jest dostępny.';status.hidden=false;}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 renderer.domElement.setAttribute('aria-hidden','true');container.append(renderer.domElement);camera=new THREE.PerspectiveCamera(57,1,.06,90);
 const interior=await createInterior();scene=interior.scene;
 const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();const env=pmrem.fromScene(environment,.04);scene.environment=env.texture;scene.environmentIntensity=.38;environment.dispose();pmrem.dispose();
 composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:2}));composer.addPass(new RenderPass(scene,camera));ao=new SSAOPass(scene,camera,stage.clientWidth,stage.clientHeight,16);ao.kernelRadius=.55;ao.minDistance=.001;ao.maxDistance=.07;composer.addPass(ao);composer.addPass(new OutputPass());
 renderer.shadowMap.needsUpdate=true;ready=true;current=target=reduce.matches ? .35 : 0;document.body.classList.add('walkthrough-ready');status.hidden=true;mode();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request();}},{rootMargin:'150px'}).observe(stage);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
}catch(error){console.error('Interior preview could not start:',error);fail();}
skip.addEventListener('click',()=>scrollTo({top:origin+sequence.offsetHeight,behavior:'instant'}));
addEventListener('scroll',scrollState,{passive:true});addEventListener('resize',resize,{passive:true});addEventListener('pageshow',resize);document.addEventListener('visibilitychange',()=>{last=0;request();});reduce.addEventListener('change',mode);
