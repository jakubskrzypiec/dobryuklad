import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve('dist/wersja-2d');
const source=JSON.parse(fs.readFileSync('references/client-materials-20261125.json','utf8'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'client-projects-data.js'),'utf8'),context);
const projects=context.window.CLIENT_PROJECTS;
assert.equal(projects.length,13);assert.equal(new Set(projects.map(p=>p.id)).size,13);
assert.equal(projects.reduce((n,p)=>n+p.images.length,0),347);
assert.equal(source.team.length,10);
for(const p of projects){
 assert.ok(p.images.length>0,p.title);
 const groups=new Set(p.images.map(f=>f.src.split('/')[2]));assert.equal(groups.size,1,'Never mix investment folders');
 assert.equal(new Set(p.images.map(f=>f.src)).size,p.images.length);
}
for(const f of [...source.team,...projects.flatMap(p=>p.images)]){
 assert.match(f.src,/^assets\/client\/(team|project-\d{2})\/[a-z0-9-]+\.webp$/);
 const b=fs.readFileSync(path.join(root,f.src));assert.ok(b.length>1000);assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.equal(b.readUInt32LE(4)+8,b.length,'Complete image file');
 assert.ok(f.width>0&&f.height>0&&f.width<=2400&&f.height<=2400);
}
const about=fs.readFileSync(path.join(root,'o-nas.html'),'utf8');
assert.equal((about.match(/class="team-member"/g)||[]).length,8);
assert.equal((about.match(/<figcaption>/g)||[]).length,8);
assert.ok(!/photo-slot|team-credits|slot-center/.test(about),'No invented names or team placeholders');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((home.match(/class="project-slide client-project-slide"/g)||[]).length,12);
assert.ok(!home.includes('studio-photo-placeholder'));
const gallery=fs.readFileSync(path.join(root,'projekty.html'),'utf8');
assert.equal((gallery.match(/class="gallery-card client-gallery-card"/g)||[]).length,13);
for(const p of projects)assert.ok(gallery.includes('projekt.html?id='+p.id));
assert.ok(!gallery.includes('data-gallery-style'),'No inferred style classifications');
assert.ok(!fs.readFileSync(path.join(root,'realizacje.html'),'utf8').includes('class="gallery-card'),'No visualizations passed off as completed interiors');
for(const n of ['index','o-nas','portfolio','projekty','realizacje','projekt']){
 const html=fs.readFileSync(`dist/${n}.html`,'utf8');assert.ok(html.includes('<base href="./wersja-2d/">'));
 assert.ok(html.includes('client-materials.css?v=20261125'));
}
assert.ok(!/download_url|oaiusercontent|[?&]sig=/.test(JSON.stringify(source)),'No signed access links published');
console.log('PASS: 13 separate project galleries, 347 intact visualization files, 10 team photos, 8 named portraits, root routes and original walkthrough retained.');
