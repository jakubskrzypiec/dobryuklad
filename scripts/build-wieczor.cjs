// Buduje dist/wieczor.html: strona główna z kinowym wejściem „Wieczór” (skany 3D, światło prowadzone
// scrollem) i nowym hero w scenie 3D. Pozostałe sekcje strony bez zmian.
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '../dist');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
let start = html.indexOf('<div class="planet-sequence');
if (start < 0) start = html.indexOf('<section class="hero hero-v3"');
const end = html.indexOf('<section class="home-section home-about"', start);
if (start < 0 || end < 0) throw new Error('Brak hero lub sekcji O nas');

const captions = [
  ['0.14', '0.3', '01 / Materiał', 'Każda faktura inaczej<br>przyjmuje światło.', 'Ceramika, kamień i drewno — dobieramy je tak, by pracowały razem.'],
  ['0.34', '0.5', '02 / Detal', 'Mosiądz,<br>który łapie wieczór.', 'To detale sprawiają, że wnętrze jest naprawdę twoje.'],
  ['0.54', '0.7', '03 / Proporcje', 'Każda rzecz<br>na swoim miejscu.', 'Układ, skala i rytm. Tak powstaje spokój.'],
].map(([a, b, step, h, p]) => `<div class="wz-caption" data-from="${a}" data-to="${b}" aria-hidden="true"><p class="wz-step">${step}</p><h2>${h}</h2><p>${p}</p></div>`).join('');

const hero = `<div class="wz-hero"><p class="wz-hero-eyebrow">Studio projektowania wnętrz · Koszalin</p>`
  + `<h1 id="hero-title">Przestrzeń<br>ma znaczenie.</h1>`
  + `<p class="hero-statement">Projektujemy wnętrza, w których estetyka, funkcja i detal tworzą spójną całość.</p>`
  + `<div class="hero-actions"><a class="hero-button hero-button-solid" href="portfolio.html">Zobacz portfolio</a><a class="hero-button hero-button-outline" href="kontakt.html">Porozmawiajmy</a></div>`
  + `<ul class="wz-hero-scope"><li>Projekt funkcjonalny</li><li>Projekt kompleksowy</li><li>Nadzór autorski</li></ul></div>`;

const section = `<div class="wz-sequence" id="start"><section class="wz-stage" aria-labelledby="hero-title">`
  + `<div class="wz-canvas" role="img" aria-label="Ciemne wnętrze wieczorem: smuga światła z okna przesuwa się po komodzie z orzecha, ceramicznych wazach, mosiężnych świecznikach i skórzanym fotelu, aż wnętrze rozświetla się ciepłym światłem"></div>`
  + `<div class="wz-loader" role="status"><b>00</b><span>Zapalamy światło</span></div>`
  + `<div class="wz-intro"><p class="wz-eyebrow">Dobry Układ / Sandra Białkowska</p><h2>Dobre wnętrze<br>zaczyna się od światła.</h2><p>Przewiń — poprowadzimy je przez wnętrze.</p></div>`
  + captions + hero
  + `<p class="wz-credit">Skany 3D: <a href="https://polyhaven.com" target="_blank" rel="noopener">Poly Haven</a> (CC0)</p>`
  + `<div class="wz-guide"><span>Przewiń, aby poprowadzić światło</span><progress max="1" value="0" aria-label="Postęp animacji wejścia"></progress></div>`
  + `<button class="wz-skip" type="button" hidden>Pomiń animację</button>`
  + `</section></div>`;
html = html.slice(0, start) + section + html.slice(end);
html = html
  .replace(/<link rel="stylesheet" href="planeta(-dzien)?\.css[^"]*">/g, '')
  .replace(/<script type="module" src="planeta(-dzien)?\.js[^"]*"><\/script>/g, '')
  .replace('</head>', '<link rel="stylesheet" href="wieczor.css?v=1"></head>')
  .replace('</body>', '<script type="module" src="wieczor.js?v=1"></script></body>');
if (!html.includes('type="importmap"')) html = html.replace('</head>', '<script type="importmap">{"imports":{"three":"./vendor/three/three.module.min.js"}}</script></head>');
if (!html.includes('vendor/gsap/gsap.min.js')) html = html.replace('</body>', '<script src="vendor/gsap/gsap.min.js" defer></script><script src="vendor/gsap/ScrollTrigger.min.js" defer></script></body>');
fs.writeFileSync(path.join(dist, 'wieczor.html'), html);
console.log('Built wieczor.html.');
