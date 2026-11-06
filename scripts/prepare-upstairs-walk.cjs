const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const source = process.argv[2];
if(!source || !fs.existsSync(source))throw new Error('Pass the local source MP4 as the first argument.');
const target = path.resolve(__dirname,'../dist/wersja-2d/assets/entrance-upstairs-v3');
const scratch = path.resolve(__dirname,'../../../work/upstairs-frames-v3');
fs.mkdirSync(target,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
const run = args => {const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('FFmpeg failed');};
const profiles={desktop:{width:1920,height:1080,filter:'null',quality:86},mobile:{width:608,height:1080,filter:'crop=608:1080:(iw-608)/2:0',quality:86}};
for(const [name,profile] of Object.entries(profiles)){
 const temp=path.join(scratch,name),out=path.join(target,name);fs.mkdirSync(temp,{recursive:true});fs.mkdirSync(out,{recursive:true});
 run(['-i',source,'-map','0:v:0','-an','-vf',profile.filter,'-c:v','libwebp','-quality',String(profile.quality),'-compression_level','4','-start_number','0','-y',path.join(temp,'frame-%04d.webp')]);
 const files=fs.readdirSync(temp).filter(f=>/^frame-\d{4}\.webp$/.test(f)).sort();
 if(files.length!==721)throw new Error(`Expected 721 frames, got ${files.length}`);
 const manifest={version:3,frameCount:files.length,fps:24,width:profile.width,height:profile.height,packSize:48,packs:[]};
 for(let first=0;first<files.length;first+=manifest.packSize){
  const buffers=files.slice(first,first+manifest.packSize).map(file=>fs.readFileSync(path.join(temp,file)));
  const offsets=[0];buffers.forEach(buffer=>offsets.push(offsets.at(-1)+buffer.length));
  const file=`frames-${String(manifest.packs.length).padStart(2,'0')}.bin`;
  fs.writeFileSync(path.join(out,file),Buffer.concat(buffers));
  manifest.packs.push({file,first,count:buffers.length,offsets});
 }
 fs.writeFileSync(path.join(out,'index.json'),JSON.stringify(manifest));
 console.log(`${name}: ${files.length} frames, ${manifest.packs.length} packs, ${profile.width}x${profile.height}`);
}
run(['-i',source,'-vf','select=eq(n\\,0)','-frames:v','1','-c:v','libwebp','-quality','92','-y',path.join(target,'opening.webp')]);
run(['-i',source,'-vf','select=eq(n\\,720)','-frames:v','1','-c:v','libwebp','-quality','94','-y',path.join(target,'hero-final.webp')]);
run(['-i',source,'-vf','select=eq(n\\,0),crop=1920:1004:0:0','-frames:v','1','-c:v','libwebp','-quality','94','-y',path.join(target,'opening-crop.webp')]);
run(['-i',source,'-vf','select=eq(n\\,720),crop=1920:1004:0:0','-frames:v','1','-c:v','libwebp','-quality','94','-y',path.join(target,'hero-final-crop.webp')]);
