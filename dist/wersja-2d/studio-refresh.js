(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const banners=[...document.querySelectorAll('.hero:not(.walk-stage),.about-hero,.project-interlude,.quote-interlude,.about-contact,.shop-closing-image,.shop-editorial,.contact-closing,.offer-process-invite')];
 const active=new Set();
 banners.forEach(banner=>{
  banner.classList.add('studio-banner');
  const shadow=document.createElement('div');shadow.className='studio-leaf-shadow';shadow.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='assets/shadow.webp';image.alt='';image.loading='lazy';shadow.append(image);banner.append(shadow);
 });
 function sync(){banners.forEach(banner=>banner.classList.toggle('is-shadow-active',active.has(banner)&&!reduced.matches&&!document.hidden));}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>{if(isIntersecting)active.add(target);else active.delete(target);});sync();});banners.forEach(banner=>observer.observe(banner));}
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
})();
