const fs=require('node:fs');
const root='dist/wersja-2d';
const metadata=JSON.parse(fs.readFileSync(`${root}/assets/studio-refresh-images.json`,'utf8'));
const roles={hero:'studio-hero-v2.webp',header:'studio-subpage-v2.webp',projects:'studio-projects-v2.webp',contact:'studio-contact-v2.webp'};
const descriptions={hero:'Koncepcyjny salon z jasną sofą, ciemnym drewnem i grafitowym kominkiem',header:'Koncepcyjny detal wnętrza z grafitowym kamieniem, ciemnym drewnem i jasnym przejściem',projects:'Koncepcyjna jadalnia z ciemnym stołem i tapicerowanymi krzesłami w odcieniu taupe',contact:'Koncepcyjny kącik wypoczynkowy z fotelem taupe i ciemną zabudową'};
function image(role,classes){const file=roles[role],m=metadata[file];return `<img class="${classes}" src="assets/${file}" width="${m.width}" height="${m.height}" loading="lazy" alt="${descriptions[role]}">`;}
for(const page of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
 let html=fs.readFileSync(`${root}/${page}`,'utf8');
 html=html.replace(/<body class="([^"]*)"/,(_,classes)=>`<body class="${classes.split(' ').filter(name=>name!=='studio-refresh').join(' ')} studio-refresh"`);
 html=html.replace(/<div class="hero-foliage-scene"[\s\S]*?<\/div>\s*<\/div>/g,'');
 html=html.replace(/<div class="(?:hero-canopy|about-shadows|project-interlude-shadows|quote-interlude-shadows)"[^>]*>[\s\S]*?<\/div>/g,'');
 html=html.replace(/<img class="studio-banner-photo"[^>]*>/g,'');
 if(page==='projekt.html')html=html.replace(/<section class="project-white-hero"[^>]*>[\s\S]*?<\/section>/,block=>block.replace('class="project-white-hero"','class="about-hero project-detail-hero"').replace(/(<section[^>]*>)/,`$1${image('header','about-hero-photo').replace('loading="lazy"','fetchpriority="high"')}`).replace('<div>','<div class="about-hero-copy">').replace(/<span class="project-opening-slot">[\s\S]*?<\/span>/,''));
 html=html.replace(/<img\b[^>]*>/g,tag=>{
  const classes=(tag.match(/class="([^"]*)"/)?.[1]||'').split(/\s+/);let role;
  if(classes.includes('hero-photo'))role='hero';
  else if(classes.includes('about-hero-photo'))role='header';
  else if(classes.includes('project-interlude-photo'))role='projects';
  else if(classes.includes('quote-interlude-photo')||classes.includes('about-contact-photo'))role='contact';
  else if(page==='sklep.html'&&/src="assets\/(?:books-v2|studio-contact-v2)\.webp"/.test(tag))role='contact';
  if(!role)return tag;
  const file=roles[role],m=metadata[file];
  return tag.replace(/src="[^"]*"/,`src="assets/${file}"`).replace(/width="\d+"/,`width="${m.width}"`).replace(/height="\d+"/,`height="${m.height}"`).replace(/alt="[^"]*"/,`alt="${descriptions[role]}"`);
 });
 html=html.replace(/(<link rel="preload" as="image" href=")[^"]+("[^>]*>)/g,`$1assets/${roles.hero}$2`);
 html=html.replace(/<article class="offer-package"[^>]*>[\s\S]*?<\/article>/g,block=>block.replace(/<img\b[^>]*>/g,'').replace(/(<a class="package-contact"[^>]*>)[\s\S]*?<\/a>/g,'$1Zapytaj o projekt</a>').replace(/aria-label="Porozmawiajmy/g,'aria-label="Zapytaj o projekt'));
 html=html.replace(/<span[^>]*>\s*[⟶→↗↑⇢]+\s*<\/span>/g,'');
 html=html.replace(/(<section class="contact-closing"[^>]*>)/,`$1${image('contact','studio-banner-photo')}`);
 html=html.replace(/(<aside class="shop-editorial"[^>]*>)/,`$1${image('projects','studio-banner-photo')}`);
 html=html.replace(/(<div class="offer-process-invite"[^>]*>)/,`$1${image('projects','studio-banner-photo')}`);
 html=html.replace(/<link rel="stylesheet" href="studio-refresh\.css[^\"]*">/g,'').replace(/<script src="studio-refresh\.js[^\"]*"[^>]*><\/script>/g,'');
 html=html.replace('</head>','<link rel="stylesheet" href="studio-refresh.css?v=palette-2"></head>');
 html=html.replace('</body>','<script src="studio-refresh.js?v=palette-2" defer></script></body>');
 fs.writeFileSync(`${root}/${page}`,html);
}
let motion=fs.readFileSync(`${root}/site-motion.js`,'utf8');
motion=motion.replace(/const buttons = \[[^;]+;/,'const buttons = [];');
motion=motion.replace("'.offer-package,.portfolio-entry,.shop-card .product-art'","'.portfolio-entry,.shop-card .product-art'");
fs.writeFileSync(`${root}/site-motion.js`,motion);
fs.writeFileSync(`${root}/VERSION.txt`,'DOBRY UKŁAD — edytowana wersja 2D\nBaza: a85332c\nNaturalna paleta materiałów, nowe kadry, proste przyciski i płaska oferta.\n');
console.log('Updated all 16 pages in the separate 2D version.');
