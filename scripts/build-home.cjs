// Strona główna: nocne intro nad Koszalin kończy się klasycznym hero ze zdjęciem,
// a cytat „Dobre wnętrze…” stoi przy złotej nocnej planecie z miastami.
// Reszta strony bez zmian. Uruchom raz na klasycznym index.html: node scripts/build-home.cjs
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (html.includes('class="planet-sequence')) {
  console.log('index.html ma już intro i globus — nic do zrobienia.');
  process.exit(0);
}
const cut = (marker) => {
  const s = html.indexOf(marker);
  if (s < 0) throw new Error('Brak sekcji: ' + marker);
  return [s, html.indexOf('</section>', s) + 10];
};

// ---- intro: przelot nocą, finał = klasyczne hero ----
let [s, e] = cut('<section class="hero hero-v3"');
const hero = html.slice(s, e).replace(' id="start"', '');
const captions = [
  ['0.12', '0.25', 'Każdy z tych domów<br>to czyjeś wnętrze.', 'Europa z góry. Miliony domów, każdy z własnym rytmem dnia.'],
  ['0.32', '0.45', 'Nasze zaczyna się<br>nad Bałtykiem.', 'Koszalin. Stąd projektujemy wnętrza w całej Polsce.'],
  ['0.6', '0.76', 'Z daleka — plan miasta.<br>Z bliska — dom.', 'Projektujemy miejsca, w których jesteś u siebie.'],
].map(([a, b, h, p]) => `<div class="planet-caption" data-from="${a}" data-to="${b}" aria-hidden="true"><h2>${h}</h2><p>${p}</p></div>`).join('');
html = html.slice(0, s)
  + `<div class="planet-sequence" id="start"><section class="planet-stage" aria-label="Wejście na stronę: przelot nad Koszalin">`
  + `<div class="planet-canvas" role="img" aria-label="Jasna Ziemia w beżach, przelot przez chmury nad Koszalin i rysunek ulic miasta, który przechodzi w zdjęcie wnętrza"></div>`
  + `<div class="planet-final">${hero}</div>`
  + `<div class="planet-intro"><p class="planet-eyebrow">Dobry Układ / Sandra Białkowska</p><h2>Każde wnętrze<br>zaczyna się od miejsca.</h2></div>`
  + captions
  + `<div class="planet-mist" aria-hidden="true"></div>`
  + `<div class="planet-pin" aria-hidden="true"><div><strong>Koszalin</strong><span>54,19° N · 16,17° E</span></div></div>`
  + `<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Ziemia</span><span>02 / Koszalin</span><span>03 / Miasto</span><span>04 / Wnętrze</span></div>`
  + `<div class="planet-guide"><span>Przewiń, aby zlecieć do Koszalina</span><progress max="1" value="0" aria-label="Postęp animacji wejścia"></progress></div>`
  + `<button class="planet-skip" type="button" hidden>Pomiń animację</button>`
  + `<p class="planet-loading" role="status">Przygotowujemy mapę…</p>`
  + `</section></div>`
  + html.slice(e);

// ---- cytat przy złotej planecie ----
[s, e] = cut('<section class="quote-interlude"');
const cities = ['Koszalin', 'Gdańsk', 'Poznań', 'Warszawa', 'Wrocław', 'Kraków'];
html = html.slice(0, s)
  + `<section class="globe-interlude" id="quote-interlude" aria-labelledby="quote-title">`
  + `<div class="globe-canvas" role="img" aria-label="Nocny globus w czerni i złocie z granicami państw; zaznaczony Koszalin, siedziba studia, oraz ${cities.slice(1).join(', ')}"></div>`
  + `<div class="globe-labels" aria-hidden="true">${cities.map((c, i) => `<span data-city="${i}">${c}${i === 0 ? '<small>studio</small>' : ''}</span>`).join('')}</div>`
  + `<div class="globe-copy"><p class="home-kicker">DOBRY UKŁAD / PRZESTRZEŃ DLA CIEBIE</p><h2 id="quote-title">Dobre wnętrze to takie,<br> w którym jesteś u siebie.</h2></div>`
  + `</section>`
  + html.slice(e);

html = html
  .replace('<link rel="preload" as="image" href="assets/hero-v2.webp">', '')
  .replace('</head>', '<link rel="stylesheet" href="planeta.css?v=4"><link rel="stylesheet" href="planeta-dzien.css?v=2"><link rel="stylesheet" href="globus.css?v=1"><script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js"}}</script></head>')
  .replace('</body>', '<script src="vendor/gsap/gsap.min.js" defer></script><script src="vendor/gsap/ScrollTrigger.min.js" defer></script><script type="module" src="planeta-dzien.js?v=2"></script><script type="module" src="globus.js?v=1"></script></body>');
fs.writeFileSync(indexPath, html);
console.log('Built homepage with night intro and globe interlude.');
