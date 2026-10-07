import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

async function listen(server){server.listen(0,'127.0.0.1');await once(server,'listening');return server.address().port}

test('chat interprets chapter, page, and explanation intent before looking up quoted text',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'c-companion-flowchart-'));
 const prompts=[];
 const mock=createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  const {messages}=JSON.parse(raw),system=messages[0].content;
  let result;
  if(system.startsWith('Conversation intent:')){
   const input=JSON.parse(messages.at(-1).content);
   if(input.request.includes('อธิบาย'))result={kind:'c_question',confidence:'high',query:'if else',reply:''};
   else result={kind:'book_location',confidence:'high',query:'if else',reply:'',locationTarget:input.request.includes('หน้าไหน')?'page':'chapter'};
  }else{
   prompts.push(system);
   result={answer:'if else ใช้เลือกทำงานตามเงื่อนไข',citations:[Number(system.match(/\[หน้า (\d+)/)?.[1])],in_scope:true};
  }
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(result)}}]}));
 });
 const mockPort=await listen(mock);
 const reservation=createServer();const port=await listen(reservation);await new Promise(r=>reservation.close(r));
 const base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env:{...process.env,APP_PORT:String(port),TUTOR_DB:join(dir,'tutor.db'),HERMES_BASE_URL:`http://127.0.0.1:${mockPort}`,HERMES_API_KEY:'test-only'},stdio:'ignore'});
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}
  assert.ok(ready);
  for(const [mode,message,expected] of [
   ['ask','“if else” อยู่บทไหน',/บทที่ 4/],
   ['tutor','“if else” อยู่หน้าไหน',/หน้า 32/],
   ['ask','อธิบาย “if else”',/ใช้เลือกทำงานตามเงื่อนไข/],
   ['quiz','“if else” อยู่บทไหน',/บทที่ 4/]
  ]){
   const created=await fetch(base+'/api/chats',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chapter:message.includes('อธิบาย')?0:7,mode})});
   const cookie=created.headers.get('set-cookie').split(';')[0],{id}=await created.json();
   const response=await fetch(base+`/api/chats/${id}/messages`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({message})});
   assert.equal(response.status,200);
   const reply=await response.json();assert.match(reply.content,expected);
   const persisted=await fetch(base+`/api/chats/${id}`,{headers:{Cookie:cookie}}).then(r=>r.json());
   assert.equal(persisted.chapter,message.includes('อธิบาย')?0:7);assert.equal(persisted.messages[0].content,message);
   assert.deepEqual(persisted.messages.at(-1).sources,reply.sources);
  }
  assert.equal(prompts.length,1,'only the explanation calls the answer model');
 }finally{
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}
  await new Promise(r=>mock.close(r));await rm(dir,{recursive:true,force:true});
 }
});
