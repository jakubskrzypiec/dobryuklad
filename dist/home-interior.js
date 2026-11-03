import * as THREE from 'three';
import {createInterior} from './interior-scene.js?v=city-home-3';
import {createHomeEntryTrack,homeJourneyPhases,ease} from './home-journey-motion.js?v=city-home-3';
import {matchedHeroFov} from './walkthrough-motion.js?v=city-home-3';
import {addHomeCity} from './home-city.js?v=city-home-3';

export function createHomeInterior(stage){
 const host=document.createElement('div');host.className='planet-room';host.setAttribute('aria-hidden','true');stage.querySelector('.planet-canvas').after(host);
 let renderer,scene,camera,city,ready=false,failed=false,preparing;
 const track=createHomeEntryTrack();
 async function prepare(){
  if(preparing)return preparing;
  preparing=(async()=>{try{
   const interior=await createInterior({daylight:true});scene=interior.scene;scene.background=new THREE.Color('#eee9df');scene.fog=new THREE.Fog('#eee9df',28,95);city=addHomeCity(scene);
   renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
   renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
   if(interior.landscape){const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(interior.landscape);scene.environment=environment.texture;scene.environmentIntensity=.85;pmrem.dispose();interior.landscape.dispose();}
   scene.add(new THREE.HemisphereLight('#fff9ed','#c4b6a1',.34));camera=new THREE.PerspectiveCamera(52,1,.05,220);resize();track.sample(0,camera.position,camera.quaternion);renderer.shadowMap.needsUpdate=true;await renderer.compileAsync(scene,camera);ready=true;stage.dataset.interiorReady='true';
   renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;ready=false;host.style.opacity='0';stage.dataset.interiorReady='fallback';});
  }catch(error){failed=true;stage.dataset.interiorReady='fallback';console.error('City-to-interior transition unavailable:',error);}})();return preparing;
 }
 function resize(){if(!renderer||!camera)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<760?1.15:1.5,Math.sqrt(1920*1080/(w*h))));renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function render(p){
  const phase=homeJourneyPhases(p);if(!ready)return false;
  host.style.opacity=phase.room.toFixed(4);if(phase.room<.001||phase.photo>.999)return true;
  track.sample(phase.travel,camera.position,camera.quaternion);camera.fov=THREE.MathUtils.lerp(innerWidth<760?68:56,matchedHeroFov(camera.aspect),ease((phase.travel-.56)/.44));camera.updateProjectionMatrix();city.group.visible=phase.travel<.58;city.entrance.visible=phase.travel<.75;renderer.render(scene,camera);
  stage.dataset.roomCamera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');stage.dataset.roomTravel=phase.travel.toFixed(4);return true;
 }
 return {prepare,resize,render,get ready(){return ready;},get failed(){return failed;}};
}
