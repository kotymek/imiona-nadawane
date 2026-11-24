import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.startsWith('/imiona-nadawane/'))pathname=pathname.slice('/imiona-nadawane'.length);const file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);if(!file.startsWith(root)||pathname.includes('/.')){res.writeHead(403).end();return;}const body=await readFile(file);res.writeHead(200,{'Content-Type':`${mime[path.extname(file)]||'text/plain'}; charset=utf-8`});res.end(body);}catch{res.writeHead(404).end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/imiona-nadawane/'));
