import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,realpath,readdir} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.CAPTURE_VISUAL_PORT??6007);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const origin=`http://127.0.0.1:${port}`;
const evidence=join(root,'output','visual-acceptance',randomUUID());
await mkdir(evidence,{recursive:true});
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes={};
async function inventory(directory){
  for(const entry of await readdir(join(root,directory),{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory())await inventory(path);
    else if(entry.isFile())hashes[path]=sha256(await readFile(join(root,path)));
  }
}
for(const directory of ['src','dist'])await inventory(directory);
for(const path of ['test/browser/visual-acceptance.html','test/browser/visual-acceptance.mjs','scripts/visual-acceptance-server.mjs','package.json','package-lock.json'])hashes[path]=sha256(await readFile(join(root,path)));
await writeFile(join(evidence,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),origin,hashes,scope:'authored static HTML fixture; actual screen comparison recorded separately'},null,2));
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html; charset=utf-8'};
const imageNames=new Set(['default','highResolution']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const runs=new Set();

createServer(async(req,res)=>{
  const send=(status,body,type='text/plain')=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(body);};
  const json=value=>send(200,JSON.stringify(value),'application/json');
  if(req.headers.host!==`127.0.0.1:${port}`)return send(403,'Forbidden');
  let path;try{path=decodeURIComponent(new URL(req.url,origin).pathname);}catch{return send(400,'Invalid path');}
  if(req.method==='POST'&&['/results','/reviews'].includes(path)){
    if(req.headers.origin!==origin||req.headers['x-visual-acceptance']!=='1'||req.headers['content-type']!=='application/json')return send(403,'Forbidden');
    let body='',length=0;
    try{
      for await(const chunk of req){length+=chunk.length;if(length>32_000_000)return send(413,'Too large');body+=chunk;}
      const data=JSON.parse(body);
      if(path==='/reviews'){
        if(!uuid.test(data.runId)||!runs.has(data.runId)||!['pending','pass','failed'].includes(data.status))return send(400,'Invalid review');
        const directory=join(evidence,data.runId);
        await writeFile(join(directory,`screen-review-${randomUUID()}.json`),JSON.stringify({...data,recordedAt:new Date().toISOString()},null,2));
        return json({directory});
      }
      if(!data.report||typeof data.report!=='object'||!data.images||typeof data.images!=='object')return send(400,'Invalid report');
      const id=randomUUID(),directory=join(evidence,id),decoded=[];
      for(const [name,value] of Object.entries(data.images)){
        if(!imageNames.has(name)||typeof value!=='string'||!/^data:image\/png;base64,[a-zA-Z0-9+/]+={0,2}$/.test(value))return send(400,'Invalid image');
        const bytes=Buffer.from(value.slice('data:image/png;base64,'.length),'base64');
        if(bytes.length<8||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return send(400,'Invalid PNG');
        decoded.push({name,bytes});
      }
      await mkdir(directory);
      for(const {name,bytes} of decoded)await writeFile(join(directory,name+'.png'),bytes);
      await writeFile(join(directory,'report.json'),JSON.stringify({...data.report,artifacts:decoded.map(({name,bytes})=>({file:name+'.png',sha256:sha256(bytes)}))},null,2));
      runs.add(id);return json({id,directory});
    }catch{return send(400,'Invalid evidence payload');}
  }
  if(req.method!=='GET')return send(405,'Method not allowed');
  if(path==='/manifest')return send(200,await readFile(join(evidence,'manifest.json')),'application/json');
  const relative=path==='/'?'test/browser/visual-acceptance.html':path==='/visual-acceptance.mjs'?'test/browser/visual-acceptance.mjs':path.startsWith('/dist/')?path.slice(1):null;
  if(!relative)return send(404,'Not found');
  try{
    const file=await realpath(resolve(root,relative));
    if(!file.startsWith(root+sep)||(path.startsWith('/dist/')&&!file.startsWith(join(root,'dist')+sep)))return send(403,'Forbidden');
    const type=types[extname(file)];if(!type)return send(404,'Not found');
    return send(200,await readFile(file),type);
  }catch{return send(404,'Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Visual acceptance: ${origin}\nEvidence: ${evidence}`));
