import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
const root=resolve('public');const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw new Error('Invalid path');const data=await readFile(file);res.writeHead(200,{'Content-Type':`${mime[extname(file)]||'application/octet-stream'}; charset=utf-8`,'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
