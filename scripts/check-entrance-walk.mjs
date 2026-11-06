import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {FRAME_COUNT,HOLD_RATIO,frameAtProgress,approachFrame} from '../dist/wersja-2d/entrance-walk-motion.mjs';
assert.equal(FRAME_COUNT,721);
assert.equal(frameAtProgress(-1),0);assert.equal(frameAtProgress(0),0);
assert.equal(frameAtProgress(1-HOLD_RATIO),720);
assert.equal(frameAtProgress(.95),720,'Final hero holds before leaving the pinned stage');
assert.equal(frameAtProgress(2),720);
let previous=-1;
for(let i=0;i<=1000;i++){const f=frameAtProgress(i/1000);assert.ok(f>=previous);previous=f;}
const results=[];
for(const fps of [30,60,120]){
 let f=0;
 for(let i=0;i<fps/2;i++){const next=approachFrame(f,700,1/fps);assert.ok(next>=f&&next<=700);assert.ok(next-f<=110/fps+.0001,'Bound sudden wheel jumps');f=next;}
 results.push(f);
 for(let i=0;i<fps*4;i++){const next=approachFrame(f,0,1/fps);assert.ok(next<=f&&next>=0);f=next;}
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
const html=fs.readFileSync('dist/wersja-2d/index.html','utf8');
assert.ok(html.includes('walk-intro walk-static'),'Static fallback without JavaScript');
assert.ok(html.includes('walk-opening'));assert.ok(html.includes('Click to scroll'));
assert.ok(html.includes('Pomiń spacer'));assert.ok(!html.includes('<video'));
assert.equal((html.match(/id="hero-title"/g)||[]).length,1);
assert.ok(html.includes('entrance-walk.js?v=3'));
console.log('PASS: 721 complete full-resolution frames/profile, packed integrity, bounded forward/reverse motion at 30/60/120 fps, final hold, logo opening and static fallback.');
