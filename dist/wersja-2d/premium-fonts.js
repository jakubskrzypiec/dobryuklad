(() => {
  const fonts = ['Inter','Cormorant Garamond','Bodoni Moda','Libre Baskerville','Tenor Sans','Marcellus','DM Serif Display','EB Garamond','Libre Caslon Display','Jost','Manrope'];
  const key = 'dobryuklad-premium-font';
  function apply(font) {
    if (!fonts.includes(font)) font = 'Bodoni Moda';
    document.documentElement.style.setProperty('--premium-heading-weight', font === 'Inter' ? '600' : '400');
    document.documentElement.style.setProperty('--premium-heading', `'${font}', ${['Inter','Tenor Sans','Jost','Manrope'].includes(font) ? 'Arial,sans-serif' : 'Georgia,serif'}`);
    try { localStorage.setItem(key, font); } catch (_) {}
    return font;
  }
  let selected = 'Bodoni Moda';
  try {
    if (localStorage.getItem('dobryuklad-font-direction') !== 'bodoni-background-v1') {
      localStorage.setItem(key, 'Bodoni Moda');
      localStorage.setItem('dobryuklad-font-direction', 'bodoni-background-v1');
    }
    selected = localStorage.getItem(key) || selected;
  } catch (_) {}
  selected = apply(selected);
  const control = document.querySelector('[data-font-control]');
  if (control) {
    fonts.forEach((font,index) => { const option = document.createElement('option');option.value=font;option.textContent=`${String(index+1).padStart(2,'0')} / ${font}`;control.append(option); });
    control.value = selected;
    control.addEventListener('change', () => apply(control.value));
  }
})();
