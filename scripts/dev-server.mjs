import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.CAPTURE_PORT??6004);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css; charset=utf-8'};
const server=createServer(async(req,res)=>{
 const send=(status,body,mime='text/plain')=>{res.writeHead(status,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(body);};
 if(req.method!=='GET'||req.headers.host!==`127.0.0.1:${port}`)return send(403,'Forbidden');
 let path;try{path=decodeURIComponent(new URL(req.url,`http://127.0.0.1:${port}`).pathname);}catch{return send(400,'Invalid request');}
 if(path==='/')path='/playground/index.html';
 const allowed=path.startsWith('/dist/')||path==='/playground/index.html'||path==='/playground/app.mjs'||path==='/playground/style.css';
 if(!allowed)return send(404,'Not found');
 const file=resolve(root,'.'+path);
 try{
 const actual=await realpath(file);if(!actual.startsWith(root+sep))return send(403,'Forbidden');
 if(path.startsWith('/dist/')&&!actual.startsWith(resolve(root,'dist')+sep))return send(403,'Forbidden');
 const mime=types[extname(actual)];if(!mime)return send(404,'Not found');
 send(200,await readFile(actual),mime);
 }catch{send(404,'Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Capture playground: http://127.0.0.1:${port}`));
