(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  const surfaces = [...document.querySelectorAll('main>section:not(.hero):not(.walk-intro):not(.about-hero):not(.space-gallery):not(.project-interlude):not(.quote-interlude):not(.about-contact):not(.shop-closing):not(.contact-closing)')];
  const buttons = [];
  const reveals = [...document.querySelectorAll('.home-heading,.course-card,.home-reviews-grid article,.contact-intro-new,.home-social>div,.founder-copy,.founder-photos,.team-member,.portfolio-entry,.gallery-card,.offer-section-heading,.offer-package,.offer-step,.shop-intro>*,.shop-catalog-heading,.shop-card,.product-summary-copy,.product-cover-column,.product-audience,.contact-intro,.project-inquiry fieldset,.about-contact-copy,.project-interlude-copy,.quote-interlude-copy')];
  const depths = [...document.querySelectorAll('.portfolio-entry,.shop-card .product-art')];
  document.querySelectorAll('.about-hero,.about-contact,.project-interlude,.quote-interlude,.shop-closing-image,.offer-package').forEach(frame => {
    const image = [...frame.children].find(child => child.tagName === 'IMG');
    if(image){frame.classList.add('motion-frame');image.classList.add('motion-image');}
  });
  document.querySelectorAll('.course-grid,.home-reviews-grid,.offer-packages,.shop-grid,.team-portraits').forEach(grid => [...grid.children].forEach((el,i) => el.style.setProperty('--reveal-delay',`${(i%4)*80}ms`)));
  surfaces.forEach(surface => {
    const lines = document.createElement('div');
    lines.className='motion-lines';lines.setAttribute('aria-hidden','true');surface.prepend(lines);
  });
  const active = new Set();
  let frame=0;
  function update(){
    frame=0;
    if(reduced.matches || document.hidden)return;
    active.forEach(el => {
      if(!surfaces.includes(el))return;
      const rect=el.getBoundingClientRect();
      el.style.setProperty('--line-drift',`${Math.max(-28,Math.min(28,(innerHeight/2-rect.top-rect.height/2)*.05)).toFixed(1)}px`);
    });
  }
  function schedule(){if(!frame && !reduced.matches && !document.hidden)frame=requestAnimationFrame(update);}
  function sync(){
    [...surfaces,...buttons].forEach(el=>{
      const moving=active.has(el)&&!reduced.matches&&!document.hidden;
      el.classList.toggle('motion-active',moving);
      el.classList.toggle('in-light',moving&&buttons.includes(el));
    });
    if(reduced.matches){
      reveals.forEach(el=>el.classList.add('motion-shown'));
      surfaces.forEach(el=>el.style.removeProperty('--line-drift'));
      depths.forEach(el=>{el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');});
    }
    schedule();
  }
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>{
        if(surfaces.includes(target)||buttons.includes(target)){
          if(isIntersecting)active.add(target);else active.delete(target);
        }else if(isIntersecting){target.classList.add('motion-shown');observer.unobserve(target);}
      });sync();
    },{rootMargin:'0px 0px -20px 0px',threshold:0});
    [...surfaces,...buttons].forEach(el=>observer.observe(el));
    reveals.forEach(el=>{if(!reduced.matches)el.classList.add('motion-reveal');observer.observe(el);});
  }
  depths.forEach(el=>el.classList.add('motion-depth'));
  [...buttons,...depths].forEach(el=>{
    let raf=0;
    el.addEventListener('pointermove',event=>{
      if(reduced.matches||!pointer.matches)return;
      const r=el.getBoundingClientRect();
      const x=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));
      const y=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
      cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
        if(reduced.matches)return;
        if(buttons.includes(el)){el.style.setProperty('--shadow-x',`${-x*6}px`);el.style.setProperty('--shadow-y',`${6-y*3}px`);}
        else{el.style.setProperty('--tilt-x',`${-y*1.5}deg`);el.style.setProperty('--tilt-y',`${x*1.5}deg`);}
      });
    });
    el.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);['--shadow-x','--shadow-y','--tilt-x','--tilt-y'].forEach(name=>el.style.removeProperty(name));});
  });
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
})();
