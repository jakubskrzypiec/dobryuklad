const fs=require('node:fs');
const pages=['index.html','o-nas.html','oferta.html','portfolio.html','projekty.html','realizacje.html','projekt.html','sklep.html','kontakt.html',...fs.readdirSync('dist').filter(name=>/^produkt-.*\.html$/.test(name))];
const gallery=fs.readFileSync("scripts/templates/home-project-carousel.html","utf8").trim();
for(const page of pages){
 let html=fs.readFileSync(`dist/${page}`,'utf8');
 html=html.replace(/<body class="([^"]*)"/,(_,classes)=>`<body class="${classes.split(' ').filter(c=>c!=='motion-site').join(' ')} motion-site"`);
 html=html.replace(/<link rel="stylesheet" href="(?:site-motion|experience)\.css[^\"]*">/g,'').replace(/<script src="(?:site-motion\.js|experience\.js|vendor\/lenis\.min\.js)[^\"]*"[^>]*><\/script>/g,'');
 html=html.replace('</head>','<link rel="stylesheet" href="site-motion.css?v=1"><link rel="stylesheet" href="experience.css?v=1"></head>');
 html=html.replace('</body>','<script src="site-motion.js?v=1" defer></script><script src="vendor/lenis.min.js" defer></script><script src="experience.js?v=1" defer></script></body>');
 if(page==='index.html'){
  html=html.replace(/<script src="home-atmosphere\.js[^\"]*"><\/script>/,'');
  html=html.replace(/<section class="home-section home-portfolio"[\s\S]*?<\/section>/,gallery);
  html=html.replace(/<section class="space-gallery"[\s\S]*?<div id="portfolio-exit" tabindex="-1"><\/div>/,gallery);
  html=html.replace(/<link rel="stylesheet" href="space-gallery\.css[^\"]*">/g,'');
  html=html.replace(/<script[^>]*src="space-gallery\.js[^\"]*"[^>]*><\/script>/g,'');
 }
 if(page==='kontakt.html'){
  html=html.replace('src="assets/shop-hero-v1.webp"','src="assets/about-hero-v2.webp"');
  html=html.replace('alt="Spokojny kadr biurka z książkami i ołówkami"','alt="Koncepcyjne wnętrze z kamieniem, grafitową ścianą i światłem z okna"');
 }
 fs.writeFileSync(`dist/${page}`,html);
}
console.log(`Shared motion and experience layer added to ${pages.length} studio pages; experiments left separate.`);
