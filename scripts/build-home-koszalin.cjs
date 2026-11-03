// Strona główna: jasna kula → Koszalin jak zwykła mapa → biały błysk → jasne hero ze zdjęciem.
// Do tego żywe tło 3D (beż i brąz) pod całą stroną. Uruchamiane na bieżącym index.html (idempotentnie).
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../dist/index.html');
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('class="planet-sequence"')) throw new Error('Brak sekwencji z kulą');

html = html.replace(/<div class="planet-caption"[\s\S]*?<\/p><\/div>/g, '')
  .replace(/<div class="planet-pin"[\s\S]*?<\/div><\/div>/g, '')
  .replace(/<div class="planet-maplabels"[^>]*><\/div>/g, '');

const captions = [
  ['0.12', '0.25', 'side', '', 'Każdy z tych domów<br>to czyjeś wnętrze.', 'Europa z góry. Miliony domów, każdy z własnym rytmem dnia.'],
  ['0.3', '0.43', 'side', '', 'Nasze zaczyna się<br>nad Bałtykiem.', 'Pomorze Środkowe, kilka kilometrów od morza.'],
  ['0.5', '0.63', 'center', 'Dobry Układ · Koszalin', 'Poznaj naszą pracownię<br>w Koszalinie.', 'Tu powstają projekty, rysunki i pierwsze szkice każdego wnętrza.'],
  ['0.65', '0.77', 'center', 'Od rozmowy do realizacji', 'Stąd projektujemy wnętrza<br>w całej Polsce.', 'Od pierwszej rozmowy po nadzór autorski na budowie.'],
].map(([a, b, pos, eye, h, p]) => `<div class="planet-caption is-${pos}" data-from="${a}" data-to="${b}" aria-hidden="true">${eye ? `<p class="planet-caption-eyebrow">${eye}</p>` : ''}<h2>${h}</h2><p>${p}</p></div>`).join('');
const extra = captions
  + '<div class="planet-pin" aria-hidden="true"><div><strong>Koszalin</strong><span>54,19° N · 16,17° E</span></div></div>'
  + '<div class="planet-maplabels" aria-hidden="true"></div>';
html = html.replace('<div class="planet-mist" aria-hidden="true">', extra + '<div class="planet-mist" aria-hidden="true">');

html = html.replace(/<div class="planet-chapters"[\s\S]*?<\/div>/, '<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Ziemia</span><span>02 / Bałtyk</span><span>03 / Koszalin</span><span>04 / Wnętrze</span></div>')
  .replace(/Przewiń, aby wejść do wnętrza|Przewiń, aby zlecieć do Koszalina/, 'Przewiń, aby poznać naszą pracownię')
  .replace(/aria-label="Jasna Ziemia, zbliżenie do koncepcyjnego miasta i płynne wejście do jasnego salonu"/, 'aria-label="Jasna Ziemia obraca się w stronę Polski, kamera zjeżdża nad Koszalin pokazany na mapie z morzem i jeziorem Jamno, a potem obraz przechodzi w jasne wnętrze"')
  .replace('Od Ziemi przez miasto do wnętrza', 'Od Ziemi przez Koszalin do wnętrza')
  .replace(/<p class="planet-credit">[\s\S]*?<\/p>/, '<p class="planet-credit">Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · granice: Natural Earth</p>')
  .replace(/planeta-dzien\.js\?v=[\w-]+|planeta-koszalin\.js\?v=[\w-]+/, 'planeta-koszalin.js?v=1');
if (!html.includes('koszalin.css')) html = html.replace('</head>', '<link rel="stylesheet" href="koszalin.css?v=1"><link rel="stylesheet" href="tlo.css?v=1"></head>');
if (!html.includes('class="tlo-3d"')) html = html.replace('<body class="home-page">', '<body class="home-page"><canvas class="tlo-3d" aria-hidden="true"></canvas>');
if (!html.includes('tlo.js')) html = html.replace('</body>', '<script type="module" src="tlo.js?v=1"></script></body>');
fs.writeFileSync(file, html);
console.log('Built homepage: globe → Koszalin map → white flash → light hero, with 3D background.');
