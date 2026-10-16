import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fontData} from '../test/browser/font-fixture.mjs';

// Only authored fixtures and built files are exposed. Both origins bind loopback.
const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.CAPTURE_RESOURCE_PORT??6006),assetPort=port+1;
if(!Number.isInteger(port)||port<1024||assetPort>65535)throw Error('Invalid port');
const origin=`http://127.0.0.1:${port}`,assetOrigin=`http://127.0.0.1:${assetPort}`;
const batchId=randomUUID(),directory=join(root,'output/research/resource-acceptance',batchId);
await mkdir(directory,{recursive:true});
const runs=new Map(),font=Buffer.from(fontData.split(',')[1],'base64');
const cases=new Set(['same-origin','resolver-deny','deny','origin-denied','origin-allowed','cors-blocked',
 'cssom-cross-origin','missing','invalid-image','redirect','abort','csp-connect-blocked','svg-image-rejected','inline-svg-rejected','svg-isolation']);
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html; charset=utf-8'};
const assetPath=/^\/assets\/([a-f0-9-]{36})\/(image\.png|background\.png|font\.ttf|style\.css|asset\.svg)$/;
const probePath=/^\/probe\/([a-f0-9-]{36})\/([a-z0-9-]+)$/;
function csp(kind){
 const connect=kind==='csp-connect-blocked'?"'self'":`'self' ${assetOrigin}`;
 return `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' ${assetOrigin}; img-src 'self' data: blob: ${assetOrigin}; font-src 'self' data: ${assetOrigin}; connect-src ${connect}; frame-src 'self' blob:; base-uri 'none'; object-src 'none'`;
}
async function body(req){
 let text='',length=0;for await(const chunk of req){length+=chunk.length;if(length>2_000_000)throw Error('Too large');text+=chunk;}
 return JSON.parse(text);
}
function ledger(run,req,path,serverOrigin){
 const record={path,origin:serverOrigin,phase:run.phase,method:req.method,closed:false};
 run.requests.push(record);return record;
}
async function handler(req,res,serverOrigin){
 const send=(status,data,mime='text/plain',headers={})=>{
  res.writeHead(status,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store',...headers});res.end(data);
 };
 if(req.headers.host!==new URL(serverOrigin).host)return send(403,'Forbidden');
 let path,url;try{url=new URL(req.url,serverOrigin);path=decodeURIComponent(url.pathname);}catch{return send(400,'Invalid request');}
 try{
  // A probe intentionally remains reachable; it detects hidden engine/SVG requests.
  const probe=path.match(probePath);
  if(probe){const run=runs.get(probe[1]);if(!run)return send(404,'Not found');ledger(run,req,path,serverOrigin);return send(200,run.image,'image/png',{'Access-Control-Allow-Origin':'*'});}
  const asset=path.match(assetPath);
  if(asset){
   const run=runs.get(asset[1]);if(!run)return send(404,'Not found');
   const record=ledger(run,req,path,serverOrigin),name=asset[2];
   const headers=run.kind==='cors-blocked'?{}:{'Access-Control-Allow-Origin':'*'};
   if(run.phase==='capture'&&name==='image.png'){
    if(run.kind==='missing')return send(404,'Synthetic missing resource');
    if(run.kind==='invalid-image')return send(200,'Synthetic invalid bytes','image/png',headers);
    if(run.kind==='redirect')return send(302,'','text/plain',{Location:`${assetOrigin}/probe/${run.id}/redirect-target`,...headers});
    if(run.kind==='abort'){
     res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store',...headers});res.write(run.image.subarray(0,8));
     const timer=setTimeout(()=>res.end(run.image.subarray(8)),20_000);
     res.on('close',()=>{record.closed=true;clearTimeout(timer);});return;
    }
   }
   if(name==='style.css')return send(200,`@font-face{font-family:"Comins Resource Fixture";src:url("${origin}/assets/${run.id}/font.ttf")} #fixture{font-family:"Comins Resource Fixture",monospace;background-image:url("${origin}/assets/${run.id}/background.png");background-repeat:no-repeat} #fixture::before{content:"";display:block;width:8px;height:8px;background-image:url("${origin}/assets/${run.id}/background.png")}`,'text/css',headers);
   if(name==='font.ttf')return send(200,font,'font/ttf',headers);
   if(name==='asset.svg')return send(200,`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/><script>parent.postMessage({type:'resource-svg-active',run:'${run.id}'},'*')</script><image href="${assetOrigin}/probe/${run.id}/source-svg" width="1" height="1"/></svg>`,'image/svg+xml',headers);
   return send(200,run.image,'image/png',headers);
  }
  if(serverOrigin!==origin)return send(404,'Not found');
  if(req.method==='POST'){
   if(req.headers.origin!==origin||req.headers['x-resource-check']!=='1')return send(403,'Forbidden');
   const input=await body(req);
   if(path==='/api/runs'){
    if(!cases.has(input.kind)||!Array.isArray(input.image)||!input.image.length||input.image.length>100_000||input.image.some(n=>!Number.isInteger(n)||n<0||n>255))return send(400,'Invalid fixture');
    const run={id:randomUUID(),kind:input.kind,image:Buffer.from(input.image),phase:'setup',requests:[],svg:undefined};runs.set(run.id,run);
    return send(200,JSON.stringify({id:run.id,kind:run.kind,origin,assetOrigin,batchId}),'application/json');
   }
   const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})\/(phase|svg|save)$/),run=match&&runs.get(match[1]);
   if(!run)return send(404,'Not found');
   if(match[2]==='phase'){
    if(!['setup','capture','recovery','isolation','control'].includes(input.phase))return send(400,'Invalid phase');run.phase=input.phase;
   }else if(match[2]==='svg'){
    if(typeof input.svg!=='string'||input.svg.length>1_000_000)return send(400,'Invalid SVG');run.svg=input.svg;
    await writeFile(join(directory,`${run.id}.svg`),run.svg);
   }else{
    if(!input.report||typeof input.report!=='object')return send(400,'Invalid report');
    const report={...input.report,id:run.id,kind:run.kind,requests:run.requests,batchId};
    await writeFile(join(directory,`${run.id}.json`),JSON.stringify(report,null,2));
   }
   return send(200,'{}','application/json');
  }
  if(req.method!=='GET')return send(405,'Method not allowed');
  const api=path.match(/^\/api\/runs\/([a-f0-9-]{36})$/);
  if(api){const run=runs.get(api[1]);return run?send(200,JSON.stringify({id:run.id,kind:run.kind,origin,assetOrigin,phase:run.phase,requests:run.requests}),'application/json'):send(404,'Not found');}
  const svg=path.match(/^\/svg\/([a-f0-9-]{36})\/(safe|control)\.svg$/);
  if(svg){
   const run=runs.get(svg[1]);if(!run)return send(404,'Not found');
   if(svg[2]==='safe')return run.svg?send(200,run.svg,'image/svg+xml'):send(404,'Not found');
   // No CSP on these documents. The sandbox limits the control to authored data.
   return send(200,`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><script>parent.postMessage({type:'resource-svg-active',run:'${run.id}'},'*');fetch('${assetOrigin}/probe/${run.id}/control-script')</script><rect width="40" height="20" fill="red"/></svg>`,'image/svg+xml');
  }
  let file;
  if(path==='/'||path==='/runner')file=join(root,'test/browser/resource-acceptance.html');
  else if(path==='/resource-acceptance.mjs')file=join(root,'test/browser/resource-acceptance.mjs');
  else if(path==='/font-fixture.mjs')file=join(root,'test/browser/font-fixture.mjs');
  else if(path.startsWith('/dist/')){
   file=await realpath(resolve(root,'.'+path));if(!file.startsWith(join(root,'dist')+sep))return send(403,'Forbidden');
  }else return send(404,'Not found');
  const mime=types[extname(file)];if(!mime)return send(404,'Not found');
  const run=runs.get(url.searchParams.get('run'));return send(200,await readFile(file),mime,{'Content-Security-Policy':csp(run?.kind)});
 }catch{return send(400,'Invalid request');}
}
const servers=[createServer((req,res)=>void handler(req,res,origin)),createServer((req,res)=>void handler(req,res,assetOrigin))];
for(const [index,server] of servers.entries())await new Promise((accept,reject)=>{server.once('error',reject);server.listen(index?assetPort:port,'127.0.0.1',accept);});
console.log(`Resource acceptance: ${origin}/ | loopback asset origin: ${assetOrigin} | evidence: output/research/resource-acceptance/${batchId}`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{for(const server of servers){server.closeAllConnections();server.close();}});
