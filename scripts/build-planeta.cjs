// Buduje dist/planeta.html z zatwierdzonej strony głównej: hero zostaje finałem sekwencji
// „Od planety do rzutu”. Standardowy dist/index.html pozostaje bez zmian.
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
if (html.includes('class="planet-sequence')) {
  console.log('index.html ma już nocne hero (build-noc.cjs) — planeta.html zostaje bez zmian.');
  process.exit(0);
}

const start = html.indexOf('<section class="hero hero-v3"');
const end = html.indexOf('</section>', start) + 10;
if (start < 0 || end < 10) throw new Error('Homepage hero missing');
const hero = html.slice(start, end).replace(' id="start"', '').replace('<h1 id="hero-title">', '<p class="planet-hero-eyebrow">Koszalin · Studio wnętrz</p><h1 id="hero-title">');

const captions = [
  ['0.12', '0.25', 'Każde z tych świateł<br>to czyjeś wnętrze.', 'Noc nad Europą. Miliony domów, każdy z własnym rytmem dnia.'],
  ['0.32', '0.45', 'Nasze zaczyna się<br>nad Bałtykiem.', 'Koszalin. Stąd projektujemy wnętrza w całej Polsce.'],
  ['0.6', '0.76', 'Z daleka — światła.<br>Z bliska — dom.', 'Projektujemy miejsca, w których jesteś u siebie.'],
]
  .map(([a, b, h, p]) => `<div class="planet-caption" data-from="${a}" data-to="${b}" aria-hidden="true"><h2>${h}</h2><p>${p}</p></div>`)
  .join('');

const section = `<div class="planet-sequence" id="start"><section class="planet-stage" aria-label="Noc nad Koszalinem — wejście na stronę Dobrego Układu">`
  + `<div class="planet-canvas" role="img" aria-label="Nocna Ziemia w czerni i złocie, przelot przez chmury nad Koszalin i światła miasta z wysokości, które przechodzą w zdjęcie wnętrza"></div>`
  + `<div class="planet-final">${hero}</div>`
  + `<div class="planet-intro"><p class="planet-eyebrow">Dobry Układ / Sandra Białkowska</p><h2>Każde wnętrze<br>zaczyna się od miejsca.</h2></div>`
  + captions
  + `<div class="planet-pin" aria-hidden="true"><div><strong>Koszalin</strong><span>54,19° N · 16,17° E</span></div></div>`
  + `<div class="planet-mist" aria-hidden="true"></div>`
  + `<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Noc</span><span>02 / Koszalin</span><span>03 / Miasto</span><span>04 / Wnętrze</span></div>`
  + `<div class="planet-guide"><span>Przewiń, aby zlecieć do Koszalina</span><progress max="1" value="0" aria-label="Postęp animacji wejścia"></progress></div>`
  + `<button class="planet-skip" type="button" hidden>Pomiń animację</button>`
  + `<p class="planet-loading" role="status">Przygotowujemy niebo…</p>`
  + `<a class="planet-classic" href="index.html">Klasyczny widok strony</a>`
  + `</section></div>`;

html = html.slice(0, start) + section + html.slice(end);
html = html
  .replace('<title>DOBRY UKŁAD — Przestrzeń ma znaczenie.</title>', '<title>DOBRY UKŁAD — Noc nad Koszalinem</title>')
  .replace('</head>', '<link rel="stylesheet" href="planeta.css?v=2"><script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js"}}</script></head>')
  .replace('</body>', '<script src="vendor/gsap/gsap.min.js" defer></script><script src="vendor/gsap/ScrollTrigger.min.js" defer></script><script type="module" src="planeta.js?v=2"></script></body>');

fs.writeFileSync(path.join(dist, 'planeta.html'), html);
console.log('Built planeta.html (planet intro variant).');
