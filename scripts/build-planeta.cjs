// Buduje dist/planeta.html z zatwierdzonej strony głównej: hero zostaje finałem sekwencji
// „Od planety do rzutu”. Standardowy dist/index.html pozostaje bez zmian.
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const start = html.indexOf('<section class="hero hero-v3"');
const end = html.indexOf('</section>', start) + 10;
if (start < 0 || end < 10) throw new Error('Homepage hero missing');
const hero = html.slice(start, end).replace(' id="start"', '');

const captions = [
  ['0.24', '0.37', 'dark', 'Najpierw<br>poznajemy miejsce.', 'Światło, otoczenie i rytm codzienności. Od tego zaczyna się każdy projekt.'],
  ['0.44', '0.58', 'dark', 'Potem rysujemy<br>układ.', 'Funkcja, proporcje i ruch w przestrzeni — zanim pojawi się pierwszy materiał.'],
  ['0.635', '0.73', 'dark', 'Przestrzeń nabiera<br>wymiaru.', 'Makieta pokazuje skalę, światło i relacje między strefami.'],
  ['0.765', '0.85', 'light', 'Materiał, światło,<br>detal.', 'Aż powstaje miejsce, w którym jesteś u siebie.'],
]
  .map(([a, b, tone, h, p]) => `<div class="planet-caption" data-from="${a}" data-to="${b}" data-tone="${tone}" aria-hidden="true"><h2>${h}</h2><p>${p}</p></div>`)
  .join('');

const section = `<div class="planet-sequence" id="start"><section class="planet-stage" aria-label="Od planety do rzutu — wejście na stronę Dobrego Układu">`
  + `<div class="planet-canvas" role="img" aria-label="Globus z gliny przybliża się do Koszalina, mapa z poziomicami zamienia się w rzut mieszkania, a rzut w makietę i gotowe wnętrze"></div>`
  + `<div class="planet-final">${hero}</div>`
  + `<div class="planet-intro"><p class="planet-eyebrow">Dobry Układ / Sandra Białkowska</p><h2>Każde wnętrze<br>zaczyna się od miejsca.</h2></div>`
  + captions
  + `<div class="planet-pin" aria-hidden="true"><div><strong>Koszalin</strong><span>54,19° N · 16,17° E</span></div></div>`
  + `<div class="planet-dim" data-dim="w" aria-hidden="true"><span>12,00</span></div><div class="planet-dim" data-dim="h" aria-hidden="true"><span>8,00</span></div>`
  + `<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Miejsce</span><span>02 / Układ</span><span>03 / Bryła</span><span>04 / Wnętrze</span></div>`
  + `<div class="planet-guide"><span>Przewiń, aby zbliżyć się do miejsca</span><progress max="1" value="0" aria-label="Postęp animacji wejścia"></progress></div>`
  + `<button class="planet-skip" type="button" hidden>Pomiń animację</button>`
  + `<p class="planet-loading" role="status">Przygotowujemy mapę…</p>`
  + `<a class="planet-classic" href="index.html">Klasyczny widok strony</a>`
  + `</section></div>`;

html = html.slice(0, start) + section + html.slice(end);
html = html
  .replace('<title>DOBRY UKŁAD — Przestrzeń ma znaczenie.</title>', '<title>DOBRY UKŁAD — Od planety do rzutu</title>')
  .replace('</head>', '<link rel="stylesheet" href="planeta.css?v=1"><script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js"}}</script></head>')
  .replace('</body>', '<script src="vendor/gsap/gsap.min.js" defer></script><script src="vendor/gsap/ScrollTrigger.min.js" defer></script><script type="module" src="planeta.js?v=1"></script></body>');

fs.writeFileSync(path.join(dist, 'planeta.html'), html);
console.log('Built planeta.html (planet intro variant).');
