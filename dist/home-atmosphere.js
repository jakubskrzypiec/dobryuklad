/* Progressive 2D enhancement. Native scrolling; no continuous JS render loop. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const sections = [...document.querySelectorAll('.home-about,.home-offer,.home-shop,.home-contact,.home-social')];
  const buttons = [...document.querySelectorAll('.hero-button,.home-cta,.button')];
  const reveals = [...document.querySelectorAll('.home-heading,.course-card,.home-reviews-grid article,.contact-intro-new,.home-social>div,.project-interlude-copy,.quote-interlude-copy')];
  sections.forEach(section => {
    const lines = document.createElement('div');
    lines.className = 'atmosphere-lines';
    lines.setAttribute('aria-hidden','true');
    section.prepend(lines);
  });
  document.querySelectorAll('.home-offer-grid,.course-grid,.home-reviews-grid').forEach(grid => {
    [...grid.children].forEach((card,index) => card.style.setProperty('--reveal-delay', `${index * 90}ms`));
  });
  if (!('IntersectionObserver' in window)) return;
  const visibleSections = new Set();
  const visibleButtons = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (sections.includes(target)) {
        if (isIntersecting) visibleSections.add(target); else visibleSections.delete(target);
      } else if (buttons.includes(target)) {
        if (isIntersecting) visibleButtons.add(target); else visibleButtons.delete(target);
        target.classList.toggle('in-light', isIntersecting && !motion.matches && !document.hidden);
      } else if (isIntersecting) {
        target.classList.add('is-shown');
        observer.unobserve(target);
      }
    });
    schedule();
  }, {threshold:0, rootMargin:'0px 0px -30px 0px'});
  sections.forEach(section => observer.observe(section));
  buttons.forEach(button => observer.observe(button));
  reveals.forEach(element => {
    if (!motion.matches) element.classList.add('atmosphere-reveal');
    observer.observe(element);
  });
  let frame = 0;
  function schedule() {
    if (frame || motion.matches || document.hidden) return;
    frame = requestAnimationFrame(() => {
      visibleSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const offset = Math.max(-24, Math.min(24, (innerHeight / 2 - rect.top - rect.height / 2) * .045));
        section.style.setProperty('--line-drift',`${offset.toFixed(1)}px`);
      });
      frame = 0;
    });
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  buttons.forEach(button => {
    let pointerFrame = 0;
    button.addEventListener('pointermove',event => {
      if (motion.matches || !fine.matches) return;
      const rect = button.getBoundingClientRect();
      const x = Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
      const y = Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        button.style.setProperty('--shadow-x',`${(-x*6).toFixed(1)}px`);
        button.style.setProperty('--shadow-y',`${(6-y*3).toFixed(1)}px`);
      });
    });
    button.addEventListener('pointerleave',() => {
      cancelAnimationFrame(pointerFrame);
      button.style.removeProperty('--shadow-x');
      button.style.removeProperty('--shadow-y');
    });
  });
  function syncMotion() {
    buttons.forEach(button => button.classList.toggle('in-light',visibleButtons.has(button) && !motion.matches && !document.hidden));
    if (motion.matches) {
      reveals.forEach(element => element.classList.add('is-shown'));
      sections.forEach(section => section.style.removeProperty('--line-drift'));
      buttons.forEach(button => {
        button.style.removeProperty('--shadow-x');
        button.style.removeProperty('--shadow-y');
      });
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }
  motion.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);
})();
