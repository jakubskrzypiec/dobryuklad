import {portfolioCameraAt,projectPanels,panelDepth,dampPortfolioProgress,portfolioPanelAt} from './portfolio-walk-motion.js?v=clean-3';
const section=document.querySelector('.space-gallery');
if(section){
 const track=section.querySelector('.space-track'),stars=section.querySelector('.space-stars');
 const cards=[...section.querySelectorAll('.space-card')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const world=document.createElement('div');world.className='space-world';
 cards.forEach(card=>world.append(card));track.append(world);
 for(const name of ['walk-floor']){
  const plane=document.createElement('div');plane.className=name;plane.setAttribute('aria-hidden','true');world.prepend(plane);
 }
 const current=document.createElement('div');current.className='space-current';current.setAttribute('aria-live','polite');current.setAttribute('aria-atomic','true');
 const title=document.createElement('strong'),description=document.createElement('span');current.append(title,description);track.after(current);
 let seed=41;
 const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<22;i++){
  const star=document.createElement('i');star.className='space-star';
  star.style.cssText=`--x:${random()*100}%;--y:${random()*100}%;--s:${i%9===0?2:1}px;--alpha:${.2+random()*.4};--duration:${4+random()*6}s;--delay:${-random()*10}s`;stars.append(star);
 }
 cards.forEach((card,i)=>{
  const panel=projectPanels[i];card.style.setProperty('--panel-x',`${panel.x}px`);card.style.setProperty('--panel-z',`${panel.z}px`);card.style.setProperty('--panel-angle',`${panel.rotation}deg`);
 });
 let active=false,raf=0,range=0,start=0,lens=700,shown=-1,smoothed=null,lastTime=0;
 const clamp=n=>Math.max(0,Math.min(1,n));
 function render(now=performance.now()){
  raf=0;if(reduced.matches||!section.classList.contains('is-walk'))return;
  const target=clamp((scrollY-start)/range),dt=lastTime?(now-lastTime)/1000:1/60;lastTime=now;
  smoothed=smoothed===null?target:dampPortfolioProgress(smoothed,target,dt);
  if(Math.abs(target-smoothed)<.00003)smoothed=target;
  const p=smoothed,camera=portfolioCameraAt(p);
  world.style.transform=`translateZ(${lens}px) rotateY(${-camera.yaw}rad) translate3d(${-camera.x}px,0,${-camera.z}px)`;
  let visibility=0;
  cards.forEach((card,i)=>{
   const depth=panelDepth(camera,projectPanels[i]),reveal=portfolioPanelAt(p,i);
   const opacity=reveal.opacity*clamp((depth-460)/230);visibility=Math.max(visibility,opacity);
   card.style.setProperty('--panel-opacity',opacity.toFixed(4));
   card.style.setProperty('--panel-scale',reveal.scale.toFixed(4));
   card.style.setProperty('--panel-hit',opacity>.7?'auto':'none');
  });
  current.style.setProperty('--caption-opacity',visibility.toFixed(4));
  section.style.setProperty('--space-progress',p.toFixed(5));section.dataset.spaceProgress=p.toFixed(3);
  section.dataset.walkCamera=`${camera.x.toFixed(2)},${camera.z.toFixed(2)},${camera.yaw.toFixed(3)}`;
  if(visibility>.5&&camera.project!==shown){shown=camera.project;title.textContent=cards[shown].querySelector('figcaption strong').textContent;description.textContent=cards[shown].querySelector('figcaption>span').textContent;}
  if(active&&smoothed!==target)schedule();
 }
 function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(render);}
 function measure(){
  section.classList.toggle('is-keyboard',track.contains(document.activeElement));
  const enabled=!reduced.matches&&innerHeight>=(innerWidth<=760?760:700)&&'IntersectionObserver' in window&&CSS.supports('transform-style','preserve-3d');
  section.classList.toggle('is-scroll',enabled);section.classList.toggle('is-walk',enabled);
  if(!enabled){section.style.removeProperty('--space-height');return;}
  lens=Math.min(track.clientWidth*.88,track.clientHeight*1.3);track.style.perspective=`${lens}px`;
  range=innerHeight*(innerWidth<=760?3.7:4.1);section.style.setProperty('--space-height',`${innerHeight+range}px`);
  start=section.getBoundingClientRect().top+scrollY;smoothed=null;lastTime=0;render();
 }
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);if(active)schedule();});observer.observe(section);}
 addEventListener('scroll',()=>{if(active)schedule();},{passive:true});addEventListener('resize',measure,{passive:true});
 reduced.addEventListener('change',()=>{measure();section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);});
 document.addEventListener('visibilitychange',()=>{section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);if(!document.hidden)schedule();});
 track.addEventListener('focusin',event=>{section.classList.add('is-keyboard');event.target.closest('.space-card')?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});});
 track.addEventListener('focusout',event=>{if(!track.contains(event.relatedTarget)){section.classList.remove('is-keyboard');track.scrollLeft=0;schedule();}});
 measure();document.fonts?.ready.then(measure);
}
