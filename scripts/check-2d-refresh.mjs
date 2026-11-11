import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist/wersja-2d'),pages=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
assert.equal(pages.length,16);
for(const page of pages){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert.equal((html.match(/href="studio-refresh\.css/g)||[]).length,1,`${page}: shared stylesheet`);
 assert.equal((html.match(/src="studio-refresh\.js/g)||[]).length,1,`${page}: leaf animation`);
 const imageTags=[...html.matchAll(/<img\b[^>]*>/g)].map(match=>match[0]);
 const headers=imageTags.filter(tag=>/class="about-hero-photo"/.test(tag));
 if(page!=='index.html'){assert.equal(headers.length,1,`${page}: shared hero exists`);assert.ok(headers[0].includes('assets/premium-subpage.webp'),`${page}: identical hero image`);}
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const reference=match[1];if(/^(?:https?:|mailto:|tel:|#|data:)/.test(reference))continue;
  const file=reference.split(/[?#]/)[0];if(file)assert.ok(fs.existsSync(path.resolve(root,file)),`${page}: missing ${file}`);
 }
 for(const match of html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g))assert.ok(!/[⟶→↗]/.test(match[0]),`${page}: no arrow decoration on buttons`);
}
const offer=fs.readFileSync(path.join(root,'oferta.html'),'utf8');
const cards=[...offer.matchAll(/<article class="offer-package"[\s\S]*?<\/article>/g)];assert.equal(cards.length,3);
cards.forEach(card=>assert.ok(!card[0].includes('<img'),'Offer cards contain type, not old illustrations'));
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(home.includes('assets/real-projects/dom-nowoczesny-01.webp'));assert.ok(home.includes('editorial-project-grid'),'Real project grid is present');
assert.equal((home.match(/data-project-open=/g)||[]).length,4,'Four editorial project views');
assert.ok(home.includes('Wizualizacje: Dobry Układ'),'Retain studio attribution for the original project imagery');
console.log('PASS: all 16 pages linked, identical subpage heroes, new homepage hero, real studio project grid, flat offer and no button arrows.');
