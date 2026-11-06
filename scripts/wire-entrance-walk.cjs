const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../dist/wersja-2d/index.html');
let html = fs.readFileSync(file, 'utf8');
const hero = `<section class="walk-intro walk-static" id="start" aria-labelledby="hero-title"><div class="hero hero-v3 walk-stage">
  <img class="hero-photo" src="assets/entrance-upstairs-v3/hero-final-crop.webp" width="1920" height="1004" fetchpriority="high" alt="Salon wypoczynkowy na piętrze — końcowy kadr spaceru przez dom"><canvas class="walk-canvas" aria-hidden="true"></canvas>
  <div class="walk-opening"><img src="assets/logo-white.svg" width="622" height="394" alt="DOBRY UKŁAD — Sandra Białkowska"><p class="walk-intro-line">Wnętrza zaprojektowane wokół Ciebie.</p><button class="walk-start" type="button"><span>Scroll down</span></button><nav class="walk-socials" aria-label="Dobry Układ w social media"><a href="https://www.instagram.com/dobry.uklad/" target="_blank" rel="noopener noreferrer" aria-label="Instagram — Dobry Układ"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg><span>Instagram</span></a><a href="https://www.facebook.com/DobryUkladSandraBialkowska" target="_blank" rel="noopener noreferrer" aria-label="Facebook — Dobry Układ"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.8 22v-8.8h3l.5-3.5h-3.5V7.5c0-1 .3-1.7 1.8-1.7H17V2.7c-.7-.1-1.5-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3v2.9H7.5v3.5h2.8V22z"/></svg><span>Facebook</span></a></nav></div>
  <div class="hero-left"><h1 id="hero-title">Przestrzeń<br>ma znaczenie.</h1><p class="hero-statement">Projektujemy wnętrza, w których estetyka, funkcja i detal tworzą spójną całość.</p></div><div class="hero-actions walk-hero-actions"><a class="hero-button hero-button-solid" href="portfolio.html">Zobacz portfolio</a><a class="hero-button hero-button-outline" href="kontakt.html">Porozmawiajmy</a></div>
  <button class="walk-skip" type="button">Pomiń spacer</button>
</div></section>`;
html = html.replace(/<section class="walk-intro[\s\S]*?<\/section>(?=\s*<section class="home-section home-about")/,hero);
html = html.replace(/<link rel="preload" as="image" href="assets\/entrance-[^"]+">/, '<link rel="preload" as="image" href="assets/entrance-upstairs-v3/opening-crop.webp">');
html = html.replace(/entrance-walk\.css\?v=\d+/g, 'entrance-walk.css?v=4').replace(/entrance-walk\.js\?v=\d+/g, 'entrance-walk.js?v=4');
fs.writeFileSync(file, html);
