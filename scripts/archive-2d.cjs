// Self-contained copy of the version requested from the chat screenshot.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const commit='a85332c',destination='dist/wersja-2d',pending=['index.html'],seen=new Set();
if(fs.existsSync(path.join(destination,'studio-refresh.css')))throw Error('The 2D copy is now an edited working version. Do not overwrite it with the original archive.');
function enqueue(reference,source){
 if(!reference||/^(?:https?:|data:|mailto:|tel:|#|\/\/)/i.test(reference))return;
 const clean=reference.split(/[?#]/)[0];if(!clean)return;
 const file=path.posix.normalize(path.posix.join(path.posix.dirname(source),clean));
 if(file.startsWith('../')||file.startsWith('/'))throw Error(`Unexpected archive reference: ${file}`);
 if(!seen.has(file))pending.push(file);
}
while(pending.length){
 const file=pending.shift();if(seen.has(file))continue;seen.add(file);
 const bytes=cp.execFileSync('git',['show',`${commit}:dist/${file}`],{maxBuffer:30*1024*1024});
 const output=path.join(destination,file);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);
 if(!/\.(?:html|css|js)$/.test(file))continue;
 const source=bytes.toString('utf8');
 if(file.endsWith('.html'))for(const match of source.matchAll(/(?:src|href)="([^"]+)"/g))enqueue(match[1],file);
 if(file.endsWith('.css'))for(const match of source.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g))enqueue(match[1],file);
 if(file.endsWith('.js'))for(const match of source.matchAll(/(?:from\s*|import\s*\(|import\s+)['"]([^'"]+)['"]/g))enqueue(match[1],file);
}
fs.writeFileSync(path.join(destination,'VERSION.txt'),`DOBRY UKŁAD — wersja 2D ze screena\nCommit: ${commit}\nBiałe kafelki, logo po najechaniu, nieskończona pętla.\n`);
console.log(`Archived ${seen.size} files from ${commit} at ${destination}`);
