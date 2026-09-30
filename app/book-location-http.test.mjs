import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

async function freePort(){
 const server=createServer();
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 const port=server.address().port;
 server.close();
 await once(server,'close');
 return port;
}

test('the HTTP chat locates a copied quote and persists verifiable source evidence without Hermes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'c-companion-location-'));
 const port=await freePort();
 const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{
  env:{...process.env,APP_PORT:String(port),TUTOR_DB:join(dir,'tutor.db'),HERMES_BASE_URL:'',HERMES_API_KEY:''},
  stdio:'ignore'
 });
 try{
  let ready=false;
  for(let i=0;i<50;i++){
   try{const response=await fetch(base+'/api/health');if(response.ok){ready=true;break}}catch{}
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert.ok(ready,'server became ready');
  const chatResponse=await fetch(base+'/api/chats',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'ask',chapter:7})});
  assert.equal(chatResponse.status,201);
  const cookie=chatResponse.headers.get('set-cookie')?.split(';')[0];
  const {id}=await chatResponse.json();
  const post=message=>fetch(base+`/api/chats/${id}/messages`,{
   method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},
   body:JSON.stringify({message})
  });
  const found=await post('คำว่า In this phase, the intermediate assembly อยู่หน้าไหน');
  assert.equal(found.status,200);
  const reply=await found.json();
  assert.match(reply.content,/หน้า 4/);
  assert.deepEqual(reply.sources.map(s=>[s.page,s.pdfPage]),[[4,9]]);
  assert.match(reply.sources[0].matchedText,/In this phase, the intermediate assembly/);
  const persisted=await fetch(base+`/api/chats/${id}`,{headers:{Cookie:cookie}}).then(r=>r.json());
  assert.deepEqual(persisted.messages.at(-1).sources,reply.sources);
  const absent=await post('คำว่า In this phase the purple elephant compiler อยู่หน้าไหน');
  assert.equal(absent.status,200);
  assert.deepEqual((await absent.json()).sources,[]);
 }finally{
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}
  await rm(dir,{recursive:true,force:true});
 }
});
