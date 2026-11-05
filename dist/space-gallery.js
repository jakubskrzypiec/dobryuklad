// Native carousel: no pinned scrolling, 3D scene or wheel interception.
const section=document.querySelector('.space-gallery');
if(section){
 const track=section.querySelector('.space-track'),cards=[...section.querySelectorAll('.space-card')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const controls=document.createElement('div');controls.className='space-carousel-controls';
 const dots=document.createElement('nav');dots.className='space-carousel-dots';dots.setAttribute('aria-label','Wybierz projekt');
 const pause=document.createElement('button');pause.type='button';pause.className='space-carousel-pause';
 let index=0,paused=false,hover=false,focused=false,active=false,timer=0,raf=0;
 const buttons=cards.map((card,i)=>{
  const button=document.createElement('button');button.type='button';button.className='space-carousel-dot';button.setAttribute('aria-label',`Projekt ${i+1} z ${cards.length}`);
  button.addEventListener('click',()=>{paused=true;go(i);sync();});dots.append(button);return button;
 });
 controls.append(dots,pause);track.after(controls);
 section.setAttribute('aria-roledescription','karuzela');
 function sync(){
  clearTimeout(timer);timer=0;pause.textContent=paused?'Wznów przewijanie':'Zatrzymaj przewijanie';pause.hidden=reduced.matches;
  buttons.forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
  section.dataset.carouselIndex=String(index+1);
  if(active&&!paused&&!hover&&!focused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>{go((index+1)%cards.length);sync();},6500);
 }
 function go(next){
  index=next;
  const left=cards[next].getBoundingClientRect().left-track.getBoundingClientRect().left+track.scrollLeft;
  track.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});
 }
 function update(){
  raf=0;const origin=track.getBoundingClientRect().left;
  const distances=cards.map(card=>Math.abs(card.getBoundingClientRect().left-origin));
  index=distances.indexOf(Math.min(...distances));sync();
 }
 track.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update);},{passive:true});
 track.addEventListener('pointerdown',()=>{paused=true;sync();});
 track.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){paused=true;sync();}},{passive:true});
 pause.addEventListener('click',()=>{paused=!paused;if(!paused){focused=false;hover=false;}sync();});
 section.addEventListener('pointerenter',()=>{hover=true;sync();});section.addEventListener('pointerleave',()=>{hover=false;sync();});
 section.addEventListener('focusin',()=>{focused=true;sync();});section.addEventListener('focusout',event=>{if(!section.contains(event.relatedTarget)){focused=false;sync();}});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{active=entries[0].isIntersecting;section.classList.toggle('is-active',active);sync();},{threshold:.1}).observe(section);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);addEventListener('resize',()=>{clearTimeout(timer);update();},{passive:true});
 sync();
}
