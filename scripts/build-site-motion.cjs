const fs=require('node:fs');
const pages=['index.html','o-nas.html','oferta.html','portfolio.html','projekty.html','realizacje.html','projekt.html','sklep.html','kontakt.html',...fs.readdirSync('dist').filter(name=>/^produkt-.*\.html$/.test(name))];
const examples=[
 ['hero-daylight-v1.webp','Jasny salon','Światło i naturalne materiały','Koncepcyjny jasny salon z kremową sofą, kamieniem i dębem'],
 ['hero-v2.webp','W ciepłym świetle','Drewno, kamień i miękkie formy','Koncepcyjny salon z sofą, drewnem i kamienną wyspą'],
 ['dining-v2.webp','Wokół stołu','Przestrzeń do spotkań','Koncepcyjna jadalnia z kamiennym stołem i tapicerowanymi krzesłami'],
 ['bathroom-v2.webp','Chwila spokoju','Detal i proporcje','Koncepcyjna łazienka w neutralnych kolorach']
];
const gallery=`<section class="space-gallery" id="portfolio" aria-labelledby="portfolio-title"><div class="space-stage"><div class="space-stars" aria-hidden="true"></div><div class="space-heading"><div><p class="home-kicker">02 / WYBRANE PROJEKTY</p><h2 id="portfolio-title">Wybrane projekty.</h2></div><a href="portfolio.html">Zobacz portfolio</a></div><div class="space-track" aria-label="Koncepcyjne wnętrza">${examples.map(([image,title,description,alt],i)=>`<figure class="space-card"><a class="space-image-link" href="portfolio.html" aria-label="${title} — przejdź do portfolio"><img src="assets/${image}" loading="lazy" decoding="async" width="1662" height="946" alt="${alt}"></a><figcaption><strong>${String(i+1).padStart(2,'0')} / ${title}</strong><span>${description}</span></figcaption></figure>`).join('')}</div><div class="space-footer"><p>Obrazy koncepcyjne. Docelowo: projekty i realizacje studia.</p><a href="#portfolio-exit">Przejdź dalej</a></div><div class="space-progress" aria-hidden="true"></div></div></section><div id="portfolio-exit" tabindex="-1"></div>`;
for(const page of pages){
 let html=fs.readFileSync(`dist/${page}`,'utf8');
 html=html.replace(/<body class="([^"]*)"/,(_,classes)=>`<body class="${classes.split(' ').filter(c=>c!=='motion-site').join(' ')} motion-site"`);
 html=html.replace(/<link rel="stylesheet" href="site-motion\.css[^\"]*">/g,'').replace(/<script src="site-motion\.js[^\"]*"[^>]*><\/script>/g,'');
 html=html.replace('</head>','<link rel="stylesheet" href="site-motion.css?v=1"></head>');
 html=html.replace('</body>','<script src="site-motion.js?v=1" defer></script></body>');
 if(page==='index.html'){
  html=html.replace(/<script src="home-atmosphere\.js[^\"]*"><\/script>/,'');
  html=html.replace(/<section class="home-section home-portfolio"[\s\S]*?<\/section>/,gallery);
  html=html.replace(/<section class="space-gallery"[\s\S]*?<div id="portfolio-exit" tabindex="-1"><\/div>/,gallery);
  if(!html.includes('href="space-gallery.css'))html=html.replace('</head>','<link rel="stylesheet" href="space-gallery.css?v=1"></head>');
  if(!html.includes('src="space-gallery.js'))html=html.replace('</body>','<script src="space-gallery.js?v=1" defer></script></body>');
 }
 if(page==='kontakt.html'){
  html=html.replace('src="assets/shop-hero-v1.webp"','src="assets/about-hero-v2.webp"');
  html=html.replace('alt="Spokojny kadr biurka z książkami i ołówkami"','alt="Koncepcyjne wnętrze z kamieniem, grafitową ścianą i światłem z okna"');
 }
 fs.writeFileSync(`dist/${page}`,html);
}
console.log(`Shared motion added to ${pages.length} studio pages; experiments left separate.`);
