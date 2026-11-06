const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../dist/wersja-2d/index.html');
let html = fs.readFileSync(file, 'utf8');
const hero = `<section class="walk-intro walk-static" id="start" aria-labelledby="hero-title"><div class="hero hero-v3 walk-stage">
  <img class="hero-photo" src="assets/entrance-upstairs-v3/hero-final.webp" width="1920" height="1080" fetchpriority="high" alt="Salon wypoczynkowy na piętrze — końcowy kadr spaceru przez dom"><canvas class="walk-canvas" aria-hidden="true"></canvas>
  <div class="walk-opening"><img src="assets/logo-white.svg" width="622" height="394" alt="DOBRY UKŁAD — Sandra Białkowska"><button class="walk-start" type="button"><span>Click to scroll</span></button></div>
  <div class="hero-left"><h1 id="hero-title">Przestrzeń<br>ma znaczenie.</h1><p class="hero-statement">Projektujemy wnętrza, w których estetyka, funkcja i detal tworzą spójną całość.</p><div class="hero-actions"><a class="hero-button hero-button-solid" href="portfolio.html">Zobacz portfolio</a><a class="hero-button hero-button-outline" href="kontakt.html">Porozmawiajmy</a></div></div>
  <button class="walk-skip" type="button">Pomiń spacer</button>
</div></section>`;
html = html.replace(/<section class="walk-intro[\s\S]*?<\/section>(?=\s*<section class="home-section home-about")/,hero);
html = html.replace(/<link rel="preload" as="image" href="assets\/entrance-[^"]+">/, '<link rel="preload" as="image" href="assets/entrance-upstairs-v3/opening.webp">');
html = html.replace(/entrance-walk\.css\?v=\d+/g, 'entrance-walk.css?v=3').replace(/entrance-walk\.js\?v=\d+/g, 'entrance-walk.js?v=3');
fs.writeFileSync(file, html);
