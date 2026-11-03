// Strona główna „od nocy do dnia”: nocny przelot nad Koszalin (intro) kończy się jasnym hero,
// dalej oryginalna jasna strona z dopracowanym ruchem i jasnym globusem miast realizacji.
// Treści sekcji pozostają bez zmian. Uruchom raz na klasycznym index.html: node scripts/build-dzien.cjs
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (html.includes('class="day-hero"')) {
  console.log('index.html jest już w wersji „od nocy do dnia” — nic do zrobienia.');
  process.exit(0);
}

const cut = (startMarker) => {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error('Brak sekcji: ' + startMarker);
  const end = html.indexOf('</section>', start) + 10;
  return [start, end];
};

// ---- jasne hero: domknięcie przelotu ----
const hero = `<section class="day-hero" aria-labelledby="hero-title">`
  + `<div class="day-hero-copy">`
  + `<p class="day-eyebrow" data-hero-bit>Studio projektowania wnętrz · Koszalin</p>`
  + `<h1 id="hero-title" data-hero-bit>Przestrzeń<br>ma znaczenie.</h1>`
  + `<p class="day-statement" data-hero-bit>Projektujemy wnętrza, w których estetyka, funkcja i detal tworzą spójną całość.</p>`
  + `<div class="day-actions" data-hero-bit><a class="day-btn day-btn-solid" href="portfolio.html">Zobacz portfolio</a><a class="day-btn day-btn-outline" href="kontakt.html">Porozmawiajmy</a></div>`
  + `<ul class="day-scope" data-hero-bit><li>Projekt funkcjonalny</li><li>Projekt kompleksowy</li><li>Nadzór autorski</li></ul>`
  + `</div>`
  + `<div class="day-hero-media" data-hero-bit>`
  + `<figure class="day-photo-main"><img src="assets/interior-hero-courtyard-v1.webp" width="1662" height="946" alt="Koncepcyjny salon w dziennym świetle: jasna sofa, orzechowa zabudowa i kamienna wyspa" fetchpriority="high"></figure>`
  + `<figure class="day-photo-detail"><img src="assets/offer-functional-v1.webp" width="1122" height="1402" alt="Koncepcyjne przejście z holu do salonu z orzechowym portalem" loading="lazy"></figure>`
  + `<p class="day-photo-note">Wizualizacje koncepcyjne</p>`
  + `</div>`
  + `</section>`;

const captions = [
  ['0.12', '0.25', 'Każde z tych świateł<br>to czyjeś wnętrze.', 'Noc nad Europą. Miliony domów, każdy z własnym rytmem dnia.'],
  ['0.32', '0.45', 'Nasze zaczyna się<br>nad Bałtykiem.', 'Koszalin. Stąd projektujemy wnętrza w całej Polsce.'],
  ['0.6', '0.76', 'Z daleka — światła.<br>Z bliska — dom.', 'Projektujemy miejsca, w których jesteś u siebie.'],
]
  .map(([a, b, h, p]) => `<div class="planet-caption" data-from="${a}" data-to="${b}" aria-hidden="true"><h2>${h}</h2><p>${p}</p></div>`)
  .join('');

const sequence = `<div class="planet-sequence planet-to-day" id="start"><section class="planet-stage" aria-label="Wejście na stronę: noc nad Koszalinem przechodzi w jasne wnętrze">`
  + `<div class="planet-canvas" role="img" aria-label="Nocna Ziemia w czerni i złocie, przelot przez chmury nad Koszalin i światła miasta, które rozjaśniają się w dzienne wnętrze"></div>`
  + `<div class="planet-final">${hero}</div>`
  + `<div class="planet-intro"><p class="planet-eyebrow">Dobry Układ / Sandra Białkowska</p><h2>Każde wnętrze<br>zaczyna się od miejsca.</h2></div>`
  + captions
  + `<div class="planet-mist" aria-hidden="true"></div>`
  + `<div class="planet-pin" aria-hidden="true"><div><strong>Koszalin</strong><span>54,19° N · 16,17° E</span></div></div>`
  + `<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Noc</span><span>02 / Koszalin</span><span>03 / Miasto</span><span>04 / Wnętrze</span></div>`
  + `<div class="planet-guide"><span>Przewiń, aby zlecieć do Koszalina</span><progress max="1" value="0" aria-label="Postęp animacji wejścia"></progress></div>`
  + `<button class="planet-skip" type="button" hidden>Pomiń animację</button>`
  + `<p class="planet-loading" role="status">Przygotowujemy niebo…</p>`
  + `</section></div>`;

let [s, e] = cut('<section class="hero hero-v3"');
html = html.slice(0, s) + sequence + html.slice(e);

// ---- cytat → jasny globus z miastami realizacji (cytat bez zmian) ----
const cities = ['Koszalin', 'Gdańsk', 'Szczecin', 'Poznań', 'Wrocław', 'Warszawa', 'Kraków'];
[s, e] = cut('<section class="quote-interlude"');
html = html.slice(0, s)
  + `<section class="globe-interlude" id="quote-interlude" aria-labelledby="quote-title">`
  + `<div class="globe-canvas" role="img" aria-label="Globus z zaznaczonym Koszalinem, siedzibą studia, i miastami realizacji połączonymi złotymi łukami: ${cities.slice(1).join(', ')}"></div>`
  + `<div class="globe-labels" aria-hidden="true">${cities.map((c, i) => `<span data-city="${i}">${c}${i === 0 ? '<small>studio</small>' : ''}</span>`).join('')}</div>`
  + `<div class="globe-copy"><p class="home-kicker">DOBRY UKŁAD / PRZESTRZEŃ DLA CIEBIE</p><h2 id="quote-title">Dobre wnętrze to takie,<br> w którym jesteś u siebie.</h2>`
  + `<ul class="globe-cities">${cities.map((c, i) => `<li${i === 0 ? ' class="is-home"' : ''}>${c}${i === 0 ? ' — studio' : ''}</li>`).join('')}</ul>`
  + `<p class="globe-note">Miasta realizacji — lista do potwierdzenia przez studio.</p></div>`
  + `</section>`
  + html.slice(e);

html = html
  .replace('<body class="home-page">', '<body class="home-page dzien">')
  .replace('<link rel="preload" as="image" href="assets/hero-v2.webp">', '<link rel="preload" as="image" href="assets/interior-hero-courtyard-v1.webp">')
  .replace('</head>', '<link rel="stylesheet" href="planeta.css?v=3"><link rel="stylesheet" href="dzien.css?v=1"><script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js"}}</script></head>')
  .replace('</body>', '<script src="vendor/gsap/gsap.min.js" defer></script><script src="vendor/gsap/ScrollTrigger.min.js" defer></script><script type="module" src="planeta.js?v=3"></script><script type="module" src="dzien.js?v=1"></script></body>');

fs.writeFileSync(indexPath, html);
console.log('Built day homepage (index.html).');
