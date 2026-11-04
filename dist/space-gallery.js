(() => {
  const section=document.querySelector('.space-gallery');if(!section)return;
  const stage=section.querySelector('.space-stage'),track=section.querySelector('.space-track'),stars=section.querySelector('.space-stars');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let seed=41;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<85;i++){
    const star=document.createElement('i');star.className='space-star';
    star.style.cssText=`--x:${random()*100}%;--y:${random()*100}%;--s:${i%9===0?2:1}px;--alpha:${.2+random()*.5};--duration:${4+random()*6}s;--delay:${-random()*10}s`;
    stars.append(star);
  }
  let active=false,raf=0,distance=0,range=0,start=0;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function render(){
    raf=0;if(reduced.matches||!section.classList.contains('is-scroll'))return;
    const p=clamp((scrollY-start)/range);
    const travel=clamp((p-.08)/.84);
    section.style.setProperty('--space-progress',p.toFixed(5));
    section.style.setProperty('--space-entry',clamp(p/.08).toFixed(5));
    section.style.setProperty('--space-x',`${(-distance*travel).toFixed(2)}px`);
    section.dataset.spaceProgress=p.toFixed(3);
  }
  function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(render);}
  function measure(){
    section.classList.toggle('is-keyboard',track.contains(document.activeElement));
    const enabled=!reduced.matches&&innerHeight>=(innerWidth<=760?760:700)&&'IntersectionObserver' in window;
    section.classList.toggle('is-scroll',enabled);
    if(!enabled){section.style.removeProperty('--space-height');return;}
    distance=Math.max(0,track.scrollWidth-track.clientWidth);
    range=Math.max(innerHeight*1.5,distance*.9);
    section.style.setProperty('--space-height',`${innerHeight+range}px`);
    start=section.getBoundingClientRect().top+scrollY;
    render();
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      active=entries[0].isIntersecting;section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);if(active)schedule();
    });observer.observe(section);
  }
  addEventListener('scroll',()=>{if(active)schedule();},{passive:true});
  addEventListener('resize',measure,{passive:true});
  reduced.addEventListener('change',()=>{measure();section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);});
  document.addEventListener('visibilitychange',()=>{section.classList.toggle('is-active',active&&!reduced.matches&&!document.hidden);if(!document.hidden)schedule();});
  // Focusing a project restores a native horizontal scroller, so Tab never lands off-screen.
  track.addEventListener('focusin',event=>{
    section.classList.add('is-keyboard');
    event.target.closest('.space-card')?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
  });
  track.addEventListener('focusout',event=>{if(!track.contains(event.relatedTarget)){section.classList.remove('is-keyboard');track.scrollLeft=0;schedule();}});
  measure();document.fonts?.ready.then(measure);
})();
