import { readdir,readFile } from 'node:fs/promises';
import { join,resolve,dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(d=>d.isDirectory()?walk(join(dir,d.name)):[join(dir,d.name)]))).flat();}
const files=[...await walk('public'),...await walk('scripts'),...await walk('tests')];
let count=0;
for(const file of files){
 if(/\.(js|mjs)$/.test(file)){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);count++;}
 if(file.endsWith('.html')){const text=await readFile(file,'utf8');for(const match of text.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){if(/^(https?:|#)/.test(match[1])||match[1].endsWith('/'))continue;await readFile(resolve(dirname(file),match[1]));}}
}
for(const file of ['package.json','firebase.json','firestore.indexes.json'])JSON.parse(await readFile(file,'utf8'));
console.log(`PASS: ${count} JavaScript files parsed; local HTML links and JSON checked.`);
