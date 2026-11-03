// Update the current Claude homepage in place; preserve the lower globe and all content.
const fs=require('node:fs'),path=require('node:path'),file=path.join(__dirname,'../dist/index.html');
let html=fs.readFileSync(file,'utf8');
if(!html.includes('class="planet-sequence"'))throw new Error('Expected current globe homepage');
html=html.replace(/<div class="planet-caption"[\s\S]*?<\/p><\/div>/g,'').replace(/<div class="planet-pin"[\s\S]*?<\/div><\/div>/g,'');
html=html.replace(/<div class="planet-chapters"[\s\S]*?<\/div>/,'<div class="planet-chapters" aria-hidden="true"><span class="is-current">01 / Ziemia</span><span>02 / Miasto</span><span>03 / Wnętrze</span></div>');
html=html.replace('Przewiń, aby zlecieć do Koszalina','Przewiń, aby wejść do wnętrza').replace('Wejście na stronę: przelot nad Koszalin','Od Ziemi przez miasto do wnętrza').replace('Jasna Ziemia w beżach, przelot przez chmury nad Koszalin i rysunek ulic miasta, który przechodzi w zdjęcie wnętrza','Jasna Ziemia, zbliżenie do koncepcyjnego miasta i płynne wejście do jasnego salonu').replace('Przygotowujemy mapę…','Przygotowujemy przestrzeń…');
html=html.replace(/<p class="planet-credit">[\s\S]*?<\/p>/,'<p class="planet-credit">Globus: Natural Earth</p>');
html=html.replace('Nocny globus w czerni i złocie','Jasny globus w beżach i taupe');
html=html.replace(/<img class="hero-photo"[^>]*>/,'<img class="hero-photo" src="assets/hero-daylight-v1.webp" width="1662" height="946" fetchpriority="high" alt="Koncepcyjny jasny salon z sofą z naturalnego lnu, jasnym dębem, kremowym kamieniem i miękkim światłem dziennym">');
html=html.replace(/planeta-dzien\.js\?v=[\w-]+/g,'planeta-dzien.js?v=city-home-3');
if(!html.includes('href="home-journey.css'))html=html.replace('</head>','<link rel="stylesheet" href="home-journey.css?v=city-home-3"></head>');
html=html.replace(/home-journey\.css\?v=[\w-]+/g,'home-journey.css?v=city-home-3');
html=html.replace('name="theme-color" content="#171511"','name="theme-color" content="#efe8de"');
fs.writeFileSync(file,html);console.log('Built globe → conceptual city → bright interior homepage.');
