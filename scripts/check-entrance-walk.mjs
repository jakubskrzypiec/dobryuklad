import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FRAME_COUNT,HOLD_RATIO,frameAtProgress,approachFrame} from '../dist/wersja-2d/entrance-walk-motion.mjs';
assert.equal(FRAME_COUNT,481);
assert.equal(frameAtProgress(-1),0);
assert.equal(frameAtProgress(0),0);
assert.equal(frameAtProgress(1-HOLD_RATIO),480);
assert.equal(frameAtProgress(.95),480,'The final hero holds before leaving the pinned stage');
assert.equal(frameAtProgress(2),480);
let previous=-1;
for(let i=0;i<=1000;i++){const f=frameAtProgress(i/1000);assert.ok(f>=previous);previous=f;}
const results=[];
for(const fps of [30,60,120]){
 let f=0;
 for(let i=0;i<fps/2;i++){const next=approachFrame(f,400,1/fps);assert.ok(next>=f&&next<=400);f=next;}
 results.push(f);
 for(let i=0;i<fps;i++){const next=approachFrame(f,0,1/fps);assert.ok(next<=f&&next>=0);f=next;}
 assert.equal(f,0,'Reverse scroll settles exactly');
}
assert.ok(Math.max(...results)-Math.min(...results)<.01,'Damping is independent of refresh rate');
for(const size of ['desktop','mobile']){
 const files=fs.readdirSync(`dist/wersja-2d/assets/entrance-walk/${size}`);
 assert.equal(files.length,FRAME_COUNT);
 for(let i=0;i<FRAME_COUNT;i++)assert.ok(files.includes(`frame-${String(i).padStart(4,'0')}.webp`));
}
const html=fs.readFileSync('dist/wersja-2d/index.html','utf8');
assert.ok(html.includes('walk-intro walk-static'),'Static fallback works without JavaScript');
assert.ok(html.includes('Pomiń spacer'));
assert.ok(!html.includes('<video'),'No autoplay or seek-based video player');
assert.equal((html.match(/id="hero-title"/g)||[]).length,1,'One persistent sales heading');
assert.ok(html.includes('entrance-walk.js?v=1'));
console.log('PASS: 481 complete frames per size, monotonic forward/reverse motion, 30/60/120 fps damping, final hero hold and static fallback.');
