/* Filters and galleries for studio-supplied visualizations. */
(() => {
  const skip = document.querySelector('a.skip');
  if (skip) skip.href = location.pathname + location.search + '#main';
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l');
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const buttons = [...gallery.querySelectorAll('[data-gallery-filter]')];
    const search = gallery.querySelector('[data-gallery-search]');
    const cards = [...gallery.querySelectorAll('.gallery-card')];
    const grid = gallery.querySelector('.gallery-grid');
    let category = 'all';
    function update() {
      const query = normalize(search?.value.trim() || '');
      let visible = 0;
      cards.forEach(card => {
        card.hidden = !((category === 'all' || card.dataset.category === category) && (!query || normalize(card.dataset.search || '').includes(query)));
        if (!card.hidden) visible++;
      });
      grid.classList.toggle('is-filtered', category !== 'all' || !!query);
      gallery.querySelector('[data-gallery-empty]').hidden = visible > 0;
      gallery.querySelector('[data-gallery-result]').textContent = `${visible} ${visible === 1 ? 'projekt' : visible >= 2 && visible <= 4 ? 'projekty' : 'projektów'}`;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.galleryFilter;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      update();
    }));
    search?.addEventListener('input', update);
    update();
  });
  const heading = document.querySelector('[data-detail-title]');
  if (!heading) return;
  const projects = window.CLIENT_PROJECTS || [];
  const params = new URLSearchParams(location.search);
  const legacy = Number(params.get('nr') || 1) - 1;
  const project = params.get('typ') === 'realizacje' ? null : params.has('id') ? projects.find(p => p.id === params.get('id')) : projects[legacy];
  const gallery = document.querySelector('[data-project-images]');
  if (!project) {
    heading.textContent = 'Projekt niedostępny';
    document.querySelector('[data-project-name]').textContent = 'Poznaj pozostałe projekty.';
    document.querySelector('[data-project-description]').textContent = 'Wybierz inwestycję z aktualnej galerii studia DOBRY UKŁAD.';
    document.querySelector('.project-metadata').hidden = true;
    document.querySelector('[data-detail-prev]').hidden = true;
    document.querySelector('[data-detail-next]').hidden = true;
    return;
  }
  document.title = project.title + ' — DOBRY UKŁAD';
  heading.textContent = project.title;
  document.querySelector('[data-detail-subtitle]').textContent = 'Wizualizacje projektu / ' + project.location;
  document.querySelector('[data-project-name]').textContent = project.title;
  document.querySelector('[data-project-type]').textContent = project.category === 'domy' ? 'Dom' : project.category === 'apartamenty' ? 'Apartament' : 'Gabinet kosmetyczny';
  document.querySelector('[data-project-location]').textContent = project.location;
  const position = projects.indexOf(project);
  document.querySelector('[data-detail-prev]').href = 'projekt.html?id=' + projects[(position + projects.length - 1) % projects.length].id;
  document.querySelector('[data-detail-next]').href = 'projekt.html?id=' + projects[(position + 1) % projects.length].id;
  const fragment = document.createDocumentFragment();
  project.images.forEach((frame, index) => {
    const figure = document.createElement('figure');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Powiększ wizualizację ${index + 1} — ${project.title}`);
    const img = document.createElement('img');
    Object.assign(img, {src: frame.src, width: frame.width, height: frame.height, alt: `${project.title} — wizualizacja ${index + 1}`, loading: 'lazy', decoding: 'async'});
    button.append(img);
    const caption = document.createElement('figcaption');
    caption.textContent = `Wizualizacja ${String(index + 1).padStart(2, '0')} / ${String(project.images.length).padStart(2, '0')}`;
    figure.append(button, caption);
    fragment.append(figure);
    button.addEventListener('click', () => open(index));
  });
  gallery.append(fragment);
  const dialog = document.querySelector('.client-lightbox');
  const preview = dialog.querySelector('img');
  let current = 0, priorOverflow = '';
  function show(index) {
    current = (index + project.images.length) % project.images.length;
    preview.src = project.images[current].src;
    preview.alt = `${project.title} — wizualizacja ${current + 1}`;
    dialog.querySelector('[data-lightbox-count]').textContent = `${current + 1} / ${project.images.length}`;
  }
  function open(index) {
    show(index);
    priorOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
  }
  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(current - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => show(current + 1));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.documentElement.style.overflow = priorOverflow; });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
})();
