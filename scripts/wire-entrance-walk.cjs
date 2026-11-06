const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist/wersja-2d');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
if (!html.includes('class="walk-intro')) {
  html = html.replace('<section class="hero hero-v3" id="start" aria-labelledby="hero-title">', '<section class="walk-intro walk-static" id="start" aria-labelledby="hero-title"><div class="hero hero-v3 walk-stage">');
  html = html.replace(/<img class="hero-photo"[^>]+>/, '<img class="hero-photo" src="assets/entrance-walk/hero-final.webp" width="1920" height="1080" fetchpriority="high" alt="Salon z jasną sofą, czarnym stolikiem i dużym oknem — końcowy kadr spaceru"><canvas class="walk-canvas" aria-hidden="true"></canvas>');
  html = html.replace(/(<\/div>\s*)<\/section>(\s*<section class="home-section home-about")/, '$1<div class="walk-footer"><div class="walk-guide"><span data-walk-label>Przewiń, aby wejść do wnętrza</span><div class="walk-progress" aria-hidden="true"><span></span></div></div><button class="walk-skip" type="button">Pomiń spacer</button></div></div></section>$2');
  html = html.replace('href="assets/studio-hero-v2.webp"', 'href="assets/entrance-walk/desktop/frame-0000.webp"');
  html = html.replace('</head>', '<link rel="stylesheet" href="entrance-walk.css?v=1"></head>');
  html = html.replace('</body>', '<script type="module" src="entrance-walk.js?v=1"></script></body>');
}
fs.writeFileSync(file, html);
