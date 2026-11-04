// Wersja nocna strony głównej: nocna kula z Europą pełną świateł → ciemna mapa Koszalina
// → ciepły błysk → ciemne hero; cała strona w czerni, brązie i beżu na tle z rozmytych świateł.
// Uruchamiane na stronie głównej po build-home-koszalin.cjs (idempotentnie).
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../dist/index.html');
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('class="planet-sequence"')) throw new Error('Brak sekwencji z kulą');

html = html
  .replace(/<link rel="stylesheet" href="(planeta-dzien|home-journey|tlo|koszalin)\.css[^"]*">/g, '')
  .replace(/<script type="module" src="(planeta-koszalin|planeta-dzien|planeta-noc|tlo|tlo-noc)\.js[^"]*"><\/script>/g, '')
  .replace(/<link rel="stylesheet" href="(noc-strona|noc-koszalin)\.css[^"]*">/g, '')
  .replace('</head>', '<link rel="stylesheet" href="koszalin.css?v=2"><link rel="stylesheet" href="tlo.css?v=2"><link rel="stylesheet" href="noc-strona.css?v=1"><link rel="stylesheet" href="noc-koszalin.css?v=1"></head>')
  .replace('</body>', '<script type="module" src="planeta-noc.js?v=1"></script><script type="module" src="tlo-noc.js?v=1"></script></body>')
  .replace(/<body class="home-page[^"]*">/, '<body class="home-page noc">')
  .replace(/name="theme-color" content="[^"]*"/, 'name="theme-color" content="#060605"')
  .replace(/<img class="hero-photo"[^>]*>/, '<img class="hero-photo" src="assets/hero-v2.webp" width="2400" height="1400" fetchpriority="high" alt="Koncepcyjne wnętrze wieczorem: duża sofa, ciemne drewno, kamienna wyspa i ciepłe światło">')
  .replace(/<h2>Każdy z tych domów<br>to czyjeś wnętrze\.<\/h2><p>[^<]*<\/p>/, '<h2>Każde z tych świateł<br>to czyjeś wnętrze.</h2><p>Noc nad Europą. Miliony domów, każdy z własnym rytmem dnia.</p>')
  .replace(/aria-label="Jasna Ziemia obraca się[^"]*"/, 'aria-label="Nocna Ziemia w czerni i złocie z Europą pełną świateł, kamera zjeżdża nad Koszalin na ciemnej mapie z Bałtykiem i jeziorem Jamno, a potem ciepły błysk odsłania wnętrze"');
fs.writeFileSync(file, html);
console.log('Built night homepage.');
