import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {resolveResources} from '../../dist/resources/resolve.js';
import {createOperation} from '../../dist/lifecycle/operation.js';
const entry=url=>[{resourceRef:'r1',kind:'image',url,dependsOn:[]}];
async function serve(handler){const server=createServer(handler);server.listen(0,'127.0.0.1');await once(server,'listening');return {server,origin:`http://127.0.0.1:${server.address().port}`};}
async function close(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
async function resolve(url,base,options={}){const op=createOperation('prepare',{timeoutMs:2000});try{return await resolveResources(entry(url),base,options,op);}finally{op.close();}}
test('real HTTP: default deny makes no request; allowed fetch resolves; redirects never reach target',{timeout:5000},async()=>{
 const requests=[],destinationRequests=[];
 const destination=await serve((req,res)=>{destinationRequests.push(req.url);res.end('destination');});
 const source=await serve((req,res)=>{
  requests.push(req.url);
  if(req.url==='/redirect'){res.writeHead(302,{Location:destination.origin+'/target'});res.end();}
  else if(req.url==='/missing'){res.writeHead(404);res.end('private response body');}
  else{res.writeHead(200,{'Content-Type':'image/png'});res.end('synthetic bytes');}
 });
 try{
  await assert.rejects(resolve('/ok',source.origin),{code:'NETWORK_DISABLED'});assert.deepEqual(requests,[]);
  const bytes=await resolve('/ok',source.origin,{network:'same-origin'});assert.equal(await bytes.get('r1').text(),'synthetic bytes');bytes.dispose();
  await assert.rejects(resolve('/redirect',source.origin,{network:'same-origin'}),{code:'RESOURCE_FAILED'});
  await assert.rejects(resolve('/missing',source.origin,{network:'same-origin'}),e=>e.code==='RESOURCE_FAILED'&&!JSON.stringify(e).includes('private')&&!e.cause);
  await assert.rejects(resolve(destination.origin+'/cross',source.origin,{network:'same-origin'}),{code:'NETWORK_DISABLED'});
  assert.deepEqual(requests,['/ok','/redirect','/missing']);assert.deepEqual(destinationRequests,[]);
  const allowed=await resolve(destination.origin+'/allowed',source.origin,{network:{origins:[destination.origin]}});assert.equal(await allowed.get('r1').text(),'destination');allowed.dispose();
  assert.deepEqual(destinationRequests,['/allowed']);
 }finally{await close(source.server);await close(destination.server);}
});
test('real HTTP: aborting an in-flight response rejects and allows a later independent resolution',{timeout:5000},async()=>{
 let arrived;const started=new Promise(r=>{arrived=r;});
 const {server,origin}=await serve((req,res)=>{if(req.url==='/slow'){res.writeHead(200,{'Content-Type':'image/png'});res.write('prefix');arrived();}else res.end('next');});
 const controller=new AbortController(),op=createOperation('prepare',{signal:controller.signal});
 try{
  const result=resolveResources(entry('/slow'),origin,{network:'same-origin'},op);await started;controller.abort();await assert.rejects(result,{code:'ABORTED'});await op.drained();
  const next=await resolve('/next',origin,{network:'same-origin'});assert.equal(await next.get('r1').text(),'next');next.dispose();
 }finally{op.close();await close(server);}
});
