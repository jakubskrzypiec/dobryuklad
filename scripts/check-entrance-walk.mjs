import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {FRAME_COUNT,HOLD_RATIO,CROP_BOTTOM,frameAtProgress,advanceFrame} from '../dist/wersja-2d/entrance-walk-motion.mjs';
assert.equal(FRAME_COUNT,721);
assert.equal(frameAtProgress(-1),0);assert.equal(frameAtProgress(0),0);
assert.equal(frameAtProgress(1-HOLD_RATIO),720);
assert.equal(frameAtProgress(.95),720,'Final hero holds before leaving the pinned stage');
assert.equal(frameAtProgress(2),720);
assert.equal((1-HOLD_RATIO)*9,7,'Preserve seven screen heights for the film');
assert.equal(HOLD_RATIO*9,2,'Double the final hero hold to two screen heights');
assert.equal(CROP_BOTTOM,76);
let previous=-1;
for(let i=0;i<=1000;i++){const f=frameAtProgress(i/1000);assert.ok(f>=previous);previous=f;}
const results=[];
for(const fps of [30,60,120]){
 let f=0,velocity=0;
 for(let i=0;i<fps/2;i++){const next=advanceFrame(f,velocity,700,1/fps);assert.ok(next.position>=f&&next.position<=700);assert.ok(Math.abs(next.velocity)<=125);assert.ok(Math.abs(next.velocity-velocity)<=700/fps+.0001,'Bound acceleration at wheel events');f=next.position;velocity=next.velocity;}
 results.push(f);
 for(let i=0;i<fps*4;i++){const next=advanceFrame(f,velocity,0,1/fps);assert.ok(next.position>=0&&next.position<=721);f=next.position;velocity=next.velocity;}
 assert.equal(f,0,'Reverse scroll settles exactly');
}
assert.ok(Math.max(...results)-Math.min(...results)<.01,'Speed bound is refresh-rate independent');
function dimensions(buffer,offset){
 const chunk=buffer.toString('ascii',offset+12,offset+16);
 if(chunk==='VP8 ')return [buffer.readUInt16LE(offset+26)&0x3fff,buffer.readUInt16LE(offset+28)&0x3fff];
 if(chunk==='VP8X')return [buffer.readUIntLE(offset+24,3)+1,buffer.readUIntLE(offset+27,3)+1];
 if(chunk==='VP8L'){const bits=buffer.readUInt32LE(offset+21);return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
 throw new Error(`Unexpected image chunk: ${chunk}`);
}
for(const profile of ['desktop','mobile']){
 const root=`dist/wersja-2d/assets/entrance-upstairs-v3/${profile}`;
 const manifest=JSON.parse(fs.readFileSync(`${root}/index.json`,'utf8'));
 assert.equal(manifest.frameCount,FRAME_COUNT);assert.equal(manifest.fps,24);
 assert.equal(manifest.height,1080);assert.equal(manifest.width,profile==='desktop'?1920:608);
 assert.equal(manifest.packs.length,16,'Packed requests replace hundreds of individual downloads');
 let count=0;
 for(const pack of manifest.packs){
  assert.equal(pack.first,count);assert.equal(pack.offsets.length,pack.count+1);
  const bytes=fs.readFileSync(path.join(root,pack.file));assert.equal(bytes.length,pack.offsets.at(-1));
  for(let n=0;n<pack.count;n++){
   const offset=pack.offsets[n],length=pack.offsets[n+1]-offset;
   assert.equal(bytes.toString('ascii',offset,offset+4),'RIFF');assert.equal(bytes.toString('ascii',offset+8,offset+12),'WEBP');
   assert.equal(bytes.readUInt32LE(offset+4)+8,length,'Each packed image is complete');
   assert.deepEqual(dimensions(bytes,offset),[manifest.width,manifest.height],'Retain actual source resolution');
   count++;
  }
 }
 assert.equal(count,FRAME_COUNT);
}
const html=fs.readFileSync('dist/wersja-spacer/index.html','utf8');
const staticHTML=fs.readFileSync('dist/wersja-statyczna/index.html','utf8');
assert.ok(staticHTML.includes('src="assets/real-projects/dom-nowoczesny-01.webp"'),'Static hero uses the selected authentic studio image');
assert.ok(staticHTML.includes('href="assets/real-projects/dom-nowoczesny-01.webp"'),'Preload selected dark hero');
assert.ok(!staticHTML.includes('class="walk-canvas"'),'Static 2D must remain free of scroll canvas');
assert.ok(!staticHTML.includes('<video'),'Static 2D must remain free of video');
const rootHTML=fs.readFileSync('dist/index.html','utf8');
assert.ok(rootHTML.includes('<base href="./wersja-2d/">'),'Main URL loads the published 2D site assets');
assert.ok(rootHTML.includes('assets/real-projects/dom-nowoczesny-01.webp'),'Main URL serves the selected authentic studio hero');
assert.ok(!rootHTML.includes('<canvas class="walk-canvas"'),'The new static homepage does not load the archived film');
assert.ok(!rootHTML.includes('entrance-walk.js?v=12'),'The film controller remains in the separate archive');
assert.ok(!rootHTML.includes('hero-scroll.js'),'Do not serve previous MP4 intro on main URL');
assert.ok(rootHTML.includes('href="/dobryuklad/#main"'),'Skip navigation stays on main URL');
assert.ok(rootHTML.includes('href="#projekty"'),'Keep navigation to the real project gallery');

assert.ok(html.includes('walk-intro walk-static'),'Static fallback without JavaScript');
assert.ok(html.includes('walk-opening'));assert.ok(html.includes('Scroll down'));
assert.ok(html.includes('walk-socials'));assert.ok(html.includes('walk-hero-actions'));
assert.ok(html.includes('Pomiń spacer'));assert.ok(!html.includes('<video'));
const walkJS=fs.readFileSync('dist/wersja-2d/entrance-walk.js','utf8');
assert.ok(walkJS.includes('function nearestFrame('),'Use decoded-neighbour rendering instead of freezing on missing frames');
assert.ok(walkJS.includes('Math.min(Math.abs(index - current), Math.abs(index - target))'),'Keep decoded frames near both playback and scroll target');
assert.ok(walkJS.includes('current = next.position;'),'Playhead advances independently of image decoding');
assert.ok(!walkJS.includes('else velocity = 0;'),'Do not stall scrolling on a missed exact frame');
assert.equal((html.match(/id="hero-title"/g)||[]).length,1);
assert.ok(html.includes('entrance-walk.js?v=12'));
assert.ok(walkJS.includes('function settleScroll()'), 'Camera must stop at the final scroll position');
assert.ok(walkJS.includes('duration: 200'), 'Ease out across 200ms instead of abruptly stopping');
assert.ok(walkJS.includes('const tangent = Math.sign(delta)'), 'Preserve incoming camera velocity');
assert.ok(walkJS.includes('settle = null; // A new scroll gesture'), 'New scrolling cancels idle braking');
assert.ok(!walkJS.includes('current = target;\n    velocity = 0;\n    previous = 0;'), 'No sudden snap when scrolling stops');
assert.ok(walkJS.includes('scrollIdleTimer = setTimeout(settleScroll, 85)'), 'Settle promptly without changing in-motion easing');
assert.ok(walkJS.includes('clearTimeout(scrollIdleTimer); scrollIdleTimer = 0;'), 'Prevent stale idle timers on reload');
for(const name of ['opening-crop.webp','hero-final-crop.webp']){
 const image=fs.readFileSync(`dist/wersja-2d/assets/entrance-upstairs-v3/${name}`);
 assert.deepEqual(dimensions(image,0),[1920,1080-CROP_BOTTOM],'Posters match the crop used by the canvas');
}
console.log('PASS: 721 complete full-resolution frames/profile, packed integrity, bounded forward/reverse motion at 30/60/120 fps, final hold, logo opening and static fallback.');
