import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
const root=resolve(process.argv[2]??''),site=await realpath(join(root,'site')),port=6005;
await mkdir(join(root,'results'),{recursive:true});
createServer(async(req,res)=>{
 const send=(status,body,type='text/plain')=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(body);};
 if(req.headers.host!==`127.0.0.1:${port}`)return send(403,'Forbidden');
 if(req.method==='POST'&&req.url==='/results'){
  if(req.headers['x-consumer-check']!=='1'||req.headers.origin!==`http://127.0.0.1:${port}`)return send(403,'Forbidden');
  let body='',length=0;for await(const chunk of req){length+=chunk.length;if(length>16384)return send(413,'Too large');body+=chunk;}
  try{const report=JSON.parse(body);await writeFile(join(root,'results',randomUUID()+'.json'),JSON.stringify(report,null,2));return send(200,'saved');}catch{return send(400,'Invalid report');}
 }
 if(req.method!=='GET')return send(405,'Method not allowed');
 try{const path=new URL(req.url,`http://127.0.0.1:${port}`).pathname;const file=await realpath(join(site,path==='/'?'index.html':decodeURIComponent(path)));if(!file.startsWith(site+sep)||! /\.(js|html)$/.test(file))return send(404,'Not found');return send(200,await readFile(file),file.endsWith('.html')?'text/html;charset=utf-8':'text/javascript');}catch{return send(404,'Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Framework consumer checks: http://127.0.0.1:${port}`));
