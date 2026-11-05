/* Approved brief: shared editorial motion, one reveal per element. Hero film is independent. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('.home-heading,.home-about-copy,.studio-photo-placeholder,.home-offer-card,.course-card,.home-reviews-grid article,.founder-copy,.founder-photos,.team-member,.portfolio-entry,.gallery-card,.offer-section-heading,.offer-package,.offer-step,.shop-intro>*,.shop-card,.product-summary-copy,.product-cover-column,.product-audience,.contact-intro,.project-inquiry fieldset,.project-interlude-copy,.quote-interlude-copy')];
  if (preference.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.add('motion-shown');
      observer.unobserve(target);
    });
  }, {threshold:0, rootMargin:'0px 0px -32px 0px'});
  targets.forEach(el => { el.classList.add('motion-reveal'); observer.observe(el); });
  const showAll = () => {
    if (!preference.matches) return;
    observer.disconnect();
    targets.forEach(el => el.classList.add('motion-shown'));
  };
  preference.addEventListener('change', showAll);
  document.querySelectorAll('.course-grid,.home-offer-grid,.home-reviews-grid,.offer-packages,.shop-grid,.team-portraits').forEach(grid => {
    [...grid.children].forEach((el,i) => el.style.setProperty('--reveal-delay', `${(i % 4) * 65}ms`));
  });
})();
