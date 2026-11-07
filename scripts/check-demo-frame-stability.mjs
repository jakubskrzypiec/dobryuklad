import assert from 'node:assert/strict';
import { chooseBufferedFrame, frameStepBudget } from '../dist/pokaz-spaceru/frame-stability.mjs';
const all = new Map(Array.from({length:721}, (_,i)=>[i,true]));
assert.equal(chooseBufferedFrame(all, 0, 600, 3), 3, 'Cannot teleport forward');
assert.equal(chooseBufferedFrame(all, 600, 0, 3), 597, 'Cannot teleport backward');
assert.equal(chooseBufferedFrame(all, 24, 24, 3), -1, 'No redundant redraw');
assert.equal(chooseBufferedFrame(new Map([[0,true],[9,true]]), 0, 200, 3), -1, 'Missing frames stay on last good image');
assert.equal(chooseBufferedFrame(new Map([[0,true],[3,true],[8,true]]), 0, 200, 3), 3, 'Resume smoothly when nearby frame arrives');
assert.equal(chooseBufferedFrame(new Map([[0,true],[1,true],[8,true]]), 0, 200, 3), 1, 'Do not jump to distant buffered frame');
assert.equal(frameStepBudget(1/60), 3);
assert.equal(frameStepBudget(1/120), 2);
assert.equal(frameStepBudget(1/30), 6);
let rendered=0;
for(let i=0;i<300;i++){
  const next=chooseBufferedFrame(all,rendered,720,frameStepBudget(1/60));
  assert.ok(next>rendered && next-rendered<=3);
  rendered=next;
  if(rendered===720)break;
}
assert.equal(rendered,720);
while(rendered>0){
  const next=chooseBufferedFrame(all,rendered,0,frameStepBudget(1/60));
  assert.ok(next<rendered && rendered-next<=3);
  rendered=next;
}
assert.equal(rendered,0);
console.log('PASS: no visual frame teleporting, missing-image jumps, or reverse jitter');
