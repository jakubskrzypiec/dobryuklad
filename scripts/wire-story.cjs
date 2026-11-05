// One-off wiring for the "Dzień i zmierzch" layer: idempotent edits of dist/index.html and hero-scroll.js.
const fs = require('fs'), path = require('path');
const dist = path.join(__dirname, '..', 'dist');
let h = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
function rep(a, b) { if (h.includes(b)) return; if (!h.includes(a)) throw new Error('missing: ' + a); h = h.replace(a, b); }
rep('<p>Wnętrze, w którym<br>jesteś u siebie.</p></div>', '<p>Wnętrze, w którym<br>jesteś u siebie.</p><div class="hero-actions"><a class="hero-button hero-button-solid" href="kontakt.html">Umów rozmowę</a><a class="hero-button hero-button-outline" href="portfolio.html">Zobacz portfolio</a></div></div>');
rep('<link rel="stylesheet" href="hero-scroll.css?v=5">', '<link rel="stylesheet" href="hero-scroll.css?v=6"><link rel="stylesheet" href="story.css?v=1">');
rep('<script src="hero-scroll.js?v=4" defer></script>', '<script src="hero-scroll.js?v=6" defer></script><script src="story.js?v=1" defer></script>');
rep('<dialog id="contact-dialog"', '<div class="sun-glow" aria-hidden="true"></div><div class="daylight" aria-hidden="true"><span class="daylight-time">07:12</span><div class="daylight-rail"><i></i></div></div>\n<dialog id="contact-dialog"');
fs.writeFileSync(path.join(dist, 'index.html'), h);
let j = fs.readFileSync(path.join(dist, 'hero-scroll.js'), 'utf8');
const a = 'const range = wrap.offsetHeight - innerHeight;';
if (j.includes(a)) j = j.replace(a, 'const range = wrap.offsetHeight - innerHeight * 1.5;   // the next section slides over the last half screen');
fs.writeFileSync(path.join(dist, 'hero-scroll.js'), j);
console.log('ok');
