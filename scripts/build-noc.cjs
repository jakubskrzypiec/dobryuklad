// Jednorazowa przebudowa strony głównej na wersję „noc”: hero z przelotem nad Koszalin
// (jak planeta.html), czarne tło z gwiazdami, przerywniki 3D (orbita projektów, globus z miastami).
// Treści i teksty sekcji pozostają bez zmian. Uruchom: node scripts/build-noc.cjs
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(path.join(dist, 'planeta.html'), 'utf8');
if (fs.readFileSync(indexPath, 'utf8').includes('class="noc-stars"')) {
  console.log('index.html jest już w wersji nocnej — nic do zrobienia.');
  process.exit(0);
}

const swap = (startMarker, replacement) => {
  const start = html.indexOf(startMarker);
  if (start < 0) throw new Error('Brak sekcji: ' + startMarker);
  const end = html.indexOf('</section>', start) + 10;
  html = html.slice(0, start) + replacement + html.slice(end);
};

// przerywnik portfolio → orbita kadrów wokół złotej planety
swap('<section class="project-interlude"', `<section class="orbit-interlude" aria-labelledby="interlude-title">`
  + `<div class="orbit-canvas" aria-hidden="true"></div>`
  + `<div class="orbit-copy"><p class="home-kicker">DOBRY UKŁAD / PORTFOLIO</p><h2 id="interlude-title">Zobacz więcej<br>naszych projektów.</h2><a class="home-cta home-cta-light" href="portfolio.html">Zobacz więcej projektów</a></div>`
  + `</section>`);

// cytat → globus z Koszalinem i miastami realizacji
const cities = ['Koszalin', 'Gdańsk', 'Szczecin', 'Poznań', 'Wrocław', 'Warszawa', 'Kraków'];
swap('<section class="quote-interlude"', `<section class="globe-interlude" id="quote-interlude" aria-labelledby="quote-title">`
  + `<div class="globe-canvas" role="img" aria-label="Globus z zaznaczonym Koszalinem, siedzibą studia, i miastami realizacji połączonymi złotymi łukami: ${cities.slice(1).join(', ')}"></div>`
  + `<div class="globe-labels" aria-hidden="true">${cities.map((c, i) => `<span data-city="${i}">${c}${i === 0 ? '<small>studio</small>' : ''}</span>`).join('')}</div>`
  + `<div class="globe-copy"><p class="home-kicker">DOBRY UKŁAD / PRZESTRZEŃ DLA CIEBIE</p><h2 id="quote-title">Dobre wnętrze to takie,<br> w którym jesteś u siebie.</h2>`
  + `<ul class="globe-cities">${cities.map((c, i) => `<li${i === 0 ? ' class="is-home"' : ''}>${c}${i === 0 ? ' — studio' : ''}</li>`).join('')}</ul>`
  + `<p class="globe-note">Miasta realizacji — lista do potwierdzenia przez studio.</p></div>`
  + `</section>`);

html = html
  .replace('<title>DOBRY UKŁAD — Noc nad Koszalinem</title>', '<title>DOBRY UKŁAD — Przestrzeń ma znaczenie.</title>')
  .replace('<body class="home-page">', '<body class="home-page noc"><canvas class="noc-stars" aria-hidden="true"></canvas>')
  .replace('<meta name="theme-color" content="#171511">', '<meta name="theme-color" content="#050403">')
  .replace('</head>', '<link rel="stylesheet" href="noc.css?v=1"></head>')
  .replace('</body>', '<script type="module" src="noc.js?v=1"></script></body>')
  .replace('<a class="planet-classic" href="index.html">Klasyczny widok strony</a>', '');

fs.writeFileSync(indexPath, html);
console.log('Built night homepage (index.html).');
