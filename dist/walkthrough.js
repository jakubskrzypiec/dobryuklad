import * as THREE from 'three';
import {createInterior} from './interior-scene.js?v=corridor-9';
import {walkthroughPhases,HERO_STOP} from './walkthrough-timing.js?v=corridor-9';
import {createInteriorTrack,createProjectIntroTrack,advanceProgress,matchedHeroFov} from './walkthrough-motion.js?v=corridor-9';
import {EffectComposer} from './vendor/three/postprocessing/EffectComposer.js';
import {createProjectStage} from './interior-project.js?v=corridor-9';
import {InteriorStagePass} from './interior-stage-pass.js?v=corridor-9';
import {SSAOPass} from './vendor/three/postprocessing/SSAOPass.js';
import {LightProbeGenerator} from './vendor/three/lights/LightProbeGenerator.js';
import {OutputPass} from './vendor/three/postprocessing/OutputPass.js';

const sequence=document.querySelector('.walkthrough-sequence'),stage=sequence.querySelector('.walkthrough-stage'),container=stage.querySelector('.walkthrough-canvas'),final=stage.querySelector('.walkthrough-final'),status=stage.querySelector('.walkthrough-loading'),header=document.querySelector('.header'),skip=stage.querySelector('.walkthrough-skip'),progress=stage.querySelector('progress');
const captureHero=new URLSearchParams(location.search).get('capture')==='hero';if(captureHero)document.body.classList.add('walkthrough-capture');
const photograph=stage.querySelector('.walkthrough-photograph');let photoReady=false;
const chapters=[...stage.querySelectorAll('.walkthrough-chapters span')],guideLabel=stage.querySelector('.walkthrough-guide span');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let frameAverage=16.7;
let project,stagePass,introTrack;
let renderer,scene,camera,composer,ao,raf=0,target=0,current=0,last=0,visible=true,ready=false,range=1,origin=0;
const cameraTrack=createInteriorTrack(),motion={value:0,velocity:0};
function revealHero(alpha){
 stage.style.setProperty('--hero-reveal',alpha.toFixed(4));stage.style.setProperty('--tour-ui',Math.max(0,1-alpha*2).toFixed(4));
 stage.querySelector('.walkthrough-classic').inert=alpha>.4;
 const usable=alpha>=.995;final.inert=!usable;final.setAttribute('aria-hidden',String(!usable));
 stage.classList.toggle('is-hero',usable);container.setAttribute('aria-hidden',String(usable));skip.hidden=!ready||reduce.matches||alpha>.4;
}
function staticHero(){
 const wasVisible=document.body.classList.contains('walkthrough-active')&&stage.getBoundingClientRect().top<=0&&stage.getBoundingClientRect().bottom>0;
 document.body.classList.remove('walkthrough-active','walkthrough-design');revealHero(1);stage.style.setProperty('--photo-reveal','1');skip.hidden=true;status.hidden=true;
 header.style.removeProperty('transform');header.inert=false;stage.dataset.phase='hero';
 if(ready){current=target=motion.value=1;motion.velocity=0;resize();request();}
 if(wasVisible)scrollTo({top:origin,behavior:'instant'});
}
function scrollState(){
 if(!ready||reduce.matches||captureHero)return;
 target=THREE.MathUtils.clamp((scrollY-origin)/range,0,1);progress.value=target;
 const offset=Math.min(0,sequence.getBoundingClientRect().bottom-stage.clientHeight);
 header.style.transform=offset===0?'':'translateY('+offset.toFixed(2)+'px)';header.inert=sequence.getBoundingClientRect().bottom<40;
 request();
}
function resize(){
 if(!ready)return;
 origin=sequence.getBoundingClientRect().top+scrollY;range=Math.max(1,sequence.offsetHeight-stage.clientHeight);
 const mobile=innerWidth<760,ratio=Math.min(devicePixelRatio,mobile?1.25:1.75,Math.sqrt(2560*1440/(stage.clientWidth*stage.clientHeight)));
 renderer.setPixelRatio(ratio);renderer.setSize(stage.clientWidth,stage.clientHeight);composer.setPixelRatio(ratio);composer.setSize(stage.clientWidth,stage.clientHeight);ao.enabled=!mobile;
 camera.aspect=stage.clientWidth/stage.clientHeight;introTrack=createProjectIntroTrack(camera.aspect);camera.updateProjectionMatrix();scrollState();
}
function render(time){
 raf=0;if(!ready||!visible||document.hidden)return;
 const elapsed=time-last;if(last&&elapsed<250)frameAverage=frameAverage*.9+elapsed*.1;const dt=Math.min(elapsed/1000||.016,.05);last=time;current=advanceProgress(motion,target,dt);
 const phase=walkthroughPhases(current),startFov=innerWidth<760?78:60;
 if(phase.intro<1){introTrack.sample(phase.intro,camera.position,camera.quaternion);camera.fov=THREE.MathUtils.lerp(45,startFov,phase.intro);}else{cameraTrack.sample(phase.travel,camera.position,camera.quaternion);camera.fov=THREE.MathUtils.lerp(startFov,matchedHeroFov(camera.aspect),phase.travel);}camera.updateProjectionMatrix();
 stage.style.setProperty('--scene-shade',phase.materials.toFixed(4));project.update(phase.growth);stagePass.mix=phase.materials;ao.scene=phase.materials<.999?project.scene:scene;ao.enabled=innerWidth>=760&&phase.growth>.06;
 document.body.classList.toggle('walkthrough-design',phase.materials<.5&&!captureHero);
 const chapter=phase.photo>0?'effect':phase.materials>.001?'visualization':'project';for(const label of chapters)label.classList.toggle('is-current',label.dataset.chapter===chapter);
 guideLabel.textContent=phase.photo>0?'Przewiń do efektu końcowego':phase.intro<1?'Przewiń, aby wejść do wnętrza':'Przewiń, aby przejść przez wnętrze';
 revealHero(phase.hero);stage.style.setProperty('--photo-reveal',photoReady?phase.photo.toFixed(4):'0');
 // After the camera stops, scroll gradually reveals the matched photographic rendering.
 renderer.info.reset();if(captureHero||!photoReady||phase.photo<.999)composer.render();stage.dataset.drawCalls=renderer.info.render.calls;stage.dataset.frameMs=frameAverage.toFixed(1);
 stage.dataset.cameraProgress=current.toFixed(4);stage.dataset.cameraTravel=phase.travel.toFixed(4);stage.dataset.heroOpacity=phase.hero.toFixed(4);stage.dataset.photoOpacity=(photoReady?phase.photo:0).toFixed(4);stage.dataset.cameraPosition=camera.position.toArray().map(n=>n.toFixed(3)).join(',');stage.dataset.phase=phase.hold?'hero':phase.photo>0?'blend':phase.materials<.001?'project':phase.materials<1?'materials':'walk';stage.dataset.cameraIntro=phase.intro.toFixed(4);stage.dataset.designGrowth=phase.growth.toFixed(4);stage.dataset.materials=phase.materials.toFixed(4);
 if(current!==target)request();
}
function request(){if(ready&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
function mode(){if(reduce.matches||captureHero){if(raf)cancelAnimationFrame(raf);raf=0;staticHero();}else if(ready){document.body.classList.add('walkthrough-active');resize();}else boot();}
function fail(error){ready=false;if(raf)cancelAnimationFrame(raf);raf=0;staticHero();if(error)console.error('Interior preview could not start:',error);}
let booting=false;
async function boot(){
 if(booting||ready)return;booting=true;
 try{
  await photograph.decode().then(()=>{photoReady=true;}).catch(()=>{});
  if(reduce.matches&&!captureHero){staticHero();return;}
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.info.autoReset=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.24;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');container.replaceChildren(renderer.domElement);
  camera=new THREE.PerspectiveCamera(60,1,.06,70);const interior=await createInterior();scene=interior.scene;stage.dataset.meshes=JSON.stringify(scene.userData.meshStats);
  // Seed the room with measured sky radiance, then capture local reflections and diffuse bounce.
  const pmrem=new THREE.PMREMGenerator(renderer);let skyEnvironment;
  if(interior.landscape){skyEnvironment=pmrem.fromEquirectangular(interior.landscape);scene.environment=skyEnvironment.texture;scene.environmentIntensity=.14;scene.environmentRotation.y=1.3;}
  const capture=new THREE.WebGLCubeRenderTarget(innerWidth<760?256:512,{type:THREE.HalfFloatType}),cube=new THREE.CubeCamera(.1,60,capture);cube.position.copy(interior.capturePosition);renderer.shadowMap.needsUpdate=true;cube.update(renderer,scene);
  const bounce=await LightProbeGenerator.fromCubeRenderTarget(renderer,capture);if(bounce.sh.coefficients.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z))){bounce.intensity=.28;scene.add(bounce);}
  const environment=pmrem.fromCubemap(capture.texture);scene.environment=environment.texture;scene.environmentIntensity=.75;scene.environmentRotation.set(0,0,0);capture.dispose();skyEnvironment?.dispose();pmrem.dispose();
  composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4}));project=createProjectStage(scene);stagePass=new InteriorStagePass(project.scene,scene,camera);composer.addPass(stagePass);ao=new SSAOPass(scene,camera,stage.clientWidth,stage.clientHeight,24);ao.kernelRadius=.34;ao.minDistance=.0003;ao.maxDistance=.03;composer.addPass(ao);composer.addPass(new OutputPass());
  ready=true;current=target=motion.value=0;motion.velocity=0;status.hidden=true;mode();
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;request();}},{rootMargin:'120px'}).observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
 }catch(error){fail(error);}finally{booting=false;}
}
skip.addEventListener('click',()=>{if(!ready)return;current=target=motion.value=HERO_STOP;motion.velocity=0;scrollTo({top:origin+range*HERO_STOP,behavior:'instant'});request();});
final.addEventListener('focusin',()=>{if(ready&&!reduce.matches&&current<.95){current=target=motion.value=HERO_STOP;motion.velocity=0;scrollTo({top:origin+range*HERO_STOP,behavior:'instant'});request();}});
addEventListener('scroll',scrollState,{passive:true});addEventListener('resize',resize,{passive:true});addEventListener('pageshow',resize);document.addEventListener('visibilitychange',()=>{last=0;request();});reduce.addEventListener('change',mode);
await boot();
