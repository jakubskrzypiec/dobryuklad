// Wires the shared UI layer into every page (idempotent):
// site-ui.css + story.js on all main pages, removes the home clock, offer images, contact-closing button, etc.
const fs = require('fs'), path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const pages = fs.readdirSync(dist).filter(f => f.endsWith('.html') &&
  !/^(noc|planeta|wejscie|wieczor)\.html$/.test(f));            // archived experiments are left alone
let n = 0;
for (const f of pages) {
  const p = path.join(dist, f);
  let h = fs.readFileSync(p, 'utf8'); const orig = h;
  // site-ui.css after the last stylesheet in <head>
  if (!h.includes('site-ui.css')) h = h.replace('</head>', '<link rel="stylesheet" href="site-ui.css?v=1"></head>');
  // Shared motion is wired by build-site-motion.cjs.
  h = h.replace(/<script src="story\.js[^"]*"[^>]*><\/script>/g, '');
  if (f === 'index.html') {
    h = h.replace(/<div class="daylight"[\s\S]*?<\/div><\/div>\s*/, '');           // clock
  }
  if (f === 'oferta.html') {
    h = h.replace('<a class="home-card-link" href="#proces">Poznaj proces projektowy</a>', '<a class="home-cta home-cta-outline" href="#proces">Poznaj proces projektowy</a>');
  }
  if (f === 'kontakt.html') {
    h = h.replace(/(<a )(href="mailto:dobryuklad\.koszalin@gmail\.com">dobryuklad\.koszalin@gmail\.com<\/a><\/div><\/section>)/, '$1class="home-cta" $2');
  }
  if (h !== orig) { fs.writeFileSync(p, h); n++; }
}
console.log('updated', n, 'of', pages.length);
