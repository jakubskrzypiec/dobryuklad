const fs = require('node:fs');
const pages = ['index.html','o-nas.html','oferta.html','portfolio.html','projekty.html','realizacje.html','projekt.html','sklep.html','kontakt.html',...fs.readdirSync('dist').filter(n=>/^produkt-.*\.html$/.test(n))];
for(const page of pages){
 let html=fs.readFileSync(`dist/${page}`,'utf8');
 html=html.replace(/<script src="story\.js[^\"]*"[^>]*><\/script>/g,'').replace(/<link rel="stylesheet" href="home-atmosphere\.css[^\"]*">/g,'');
 html=html.replace(/<link href="https:\/\/fonts.googleapis.com\/css2\?family=Libre[^\"]*" rel="stylesheet">/g,'');
 html=html.replace(/(site-ui\.(?:css)|site-motion\.(?:css|js)|story\.css)\?v=[\w-]+/g,'$1?v=brief-2');
 // Keep the catalogue in the same navigation position as the approved map.
 html=html.replace(/(<a href="kontakt.html"[^>]*>Kontakt<\/a>)(<a href="sklep.html"[^>]*>Sklep dla architektów<\/a>)/g,'$2$1');
 if(page==='index.html'){
  html=html.replace(/<div class="studio-photo-placeholder[^\"]*"[\s\S]*?<\/div>\s*<\/div>/,'<figure class="studio-photo-placeholder" aria-label="Detal wnętrza, obraz koncepcyjny"><img class="studio-detail-photo" src="assets/about-contact-v2.webp" alt="Koncepcyjny detal wnętrza: miękka tkanina i naturalne światło" loading="lazy"><figcaption class="studio-detail-caption">Kadr koncepcyjny / materiały studia w przygotowaniu</figcaption></figure>');
  html=html.replace(/<a class="project-slide"([^>]*)>[\s\S]*?<\/a>/g,(match,attrs)=>{
   const n=+(attrs.match(/nr=(\d)/)||[])[1]||1;
   const src=['hero-v2.webp','dining-v2.webp','bathroom-v2.webp'][n-1];
   attrs=attrs.replace(/aria-label="[^\"]*"/,'aria-label="Kadr koncepcyjny '+n+' — otwórz galerię"');
   return `<a class="project-slide"${attrs}><img class="project-preview" src="assets/${src}" alt="Koncepcyjne wnętrze — ilustracja układu portfolio" loading="lazy"><span class="project-slot">Kadr koncepcyjny / 0${n}</span><span class="project-hover-logo"><img src="assets/logo-white.svg" alt="" width="622" height="394"></span><span class="project-index">0${n}</span></a>`;
  });
  html=html.replace('src="assets/portfolio-divider-v3.webp"','src="assets/about-hero-v2.webp"').replace('alt="Koncepcyjny przerywnik: światło i cień na neutralnej ścianie, otwarcie na wnętrze po prawej"','alt="Koncepcyjny detal: kamień, drewno i światło na grafitowej ścianie"');
  html=html.replace('Zobacz więcej<br>naszych projektów.','Estetyka, funkcja<br>i konsekwencja w detalu.');
  html=html.replace('src="assets/dining-v2.webp" width="1642" height="958" loading="lazy" alt="Koncepcyjna jadalnia z kamiennym stołem, miękkimi krzesłami i światłem wpadającym przez zasłony"','src="assets/shop-hero-v1.webp" width="1536" height="1024" loading="lazy" alt="Koncepcyjna kompozycja materiałów projektowych i biurka"');
  html=html.replace('DOBRY UKŁAD / PRZESTRZEŃ DLA CIEBIE','DOBRY UKŁAD / DLA ARCHITEKTÓW').replace('Dobre wnętrze to takie,<br> w którym jesteś u siebie.','To, czego nauczyła nas<br>praktyka, przekazujemy dalej.');
  html=html.replace(/<article class="course-card">[\s\S]*?<\/article>/g, (()=>{
   let i=0;const items=[['produkt-kurs-podstawowy.html','Kurs podstawowy pCon.planner','offer-functional-scope-v2.webp'],['produkt-kurs-zaawansowany.html','Kurs zaawansowany pCon.planner','offer-complete-workstation-v3.webp'],['produkt-poradnik-projektanta.html','Poradnik Projektanta','books-v2.webp']];
   return ()=>{const [href,title,img]=items[i++];return `<article class="course-card"><a href="${href}"><div class="course-photo"><img class="course-preview" src="assets/${img}" alt="${title} — ilustracja koncepcyjna" loading="lazy"></div><div class="course-caption"><span>0${i}</span><h3>${title}</h3></div></a></article>`;};
  })());
  if(!html.includes('<div class="home-offer-footer"><a class="home-cta" href="kontakt.html">')) html=html.replace('<div class="home-offer-footer">','<div class="home-offer-footer"><a class="home-cta" href="kontakt.html">Zapytaj o projekt</a>');
  const carousel=html.match(/<section class="home-section home-portfolio"[\s\S]*?<\/section>/)[0];
  fs.writeFileSync('scripts/templates/home-project-carousel.html',carousel+'\n');
 }
 if(page==='oferta.html'){
  let i=0;const photos=['offer-functional-scope-v2.webp','offer-complete-workstation-v3.webp','offer-supervision-scope-v2.webp'];
  html=html.replace(/<article class="offer-package">(?!<img)/g,()=>'<article class="offer-package"><img src="assets/'+photos[i++]+'" alt="Ilustracja koncepcyjna zakresu współpracy" loading="lazy">');
 }
 html=html.replace(/<link rel="stylesheet" href="site-ui\.css[^"]*">/g,'');
 html=html.replace('</head>','<link rel="stylesheet" href="site-ui.css?v=brief-2"></head>');
 fs.writeFileSync(`dist/${page}`,html);
}
console.log('Updated',pages.length,'pages');
