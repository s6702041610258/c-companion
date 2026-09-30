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

test('chat retrieves the complete flowchart section across chapter selection and persists citations',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'c-companion-flowchart-'));
 const prompts=[];
 const mock=createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;
  const {messages}=JSON.parse(raw),system=messages[0].content;
  let result;
  if(system.startsWith('Conversation intent:')){
   // Deliberately noisy routing hint reproduces the lost-evidence path.
   result={kind:'c_question',confidence:'high',query:'Flowchart C language program input output variable int function return pointer array process',reply:''};
  }else{
   prompts.push(system);
   const complete=[5,6,7].every(p=>system.includes(`[หน้า ${p} | บท 1]`));
   result=complete?{answer:'Flowchart แสดงขั้นตอนการทำงาน มี Process, Decision, Terminator และ Flow Line',citations:[5,6,7],in_scope:true}:{answer:'ข้อมูลที่ค้นพบไม่พอ',citations:[],in_scope:false};
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
  for(const [chapter,mode,replyLanguage] of [[0,'ask','th'],[1,'ask','th'],[2,'ask','th'],[5,'tutor','en']]){
   const created=await fetch(base+'/api/chats',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chapter,mode,replyLanguage})});
   assert.equal(created.status,201);
   const cookie=created.headers.get('set-cookie').split(';')[0],{id}=await created.json();
   const response=await fetch(base+`/api/chats/${id}/messages`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({message:'Flowchart คือไรมีอะไรบ้าง'})});
   assert.equal(response.status,200);
   const reply=await response.json();
   assert.deepEqual(reply.sources.map(s=>[s.page,s.pdfPage]),[[5,10],[6,11],[7,12]]);
   if(chapter===2)assert.match(reply.content,/อยู่นอกบทที่ 2/);
   if(chapter===5)assert.match(reply.content,/outside selected chapter 5/);
   if(chapter<=1)assert.doesNotMatch(reply.content,/อยู่นอกบท|outside selected/);
   const persisted=await fetch(base+`/api/chats/${id}`,{headers:{Cookie:cookie}}).then(r=>r.json());
   assert.equal(persisted.chapter,chapter);
   assert.equal(persisted.messages[0].content,'Flowchart คือไรมีอะไรบ้าง');
   assert.deepEqual(persisted.messages.at(-1).sources,reply.sources);
  }
  assert.equal(prompts.length,4);
 }finally{
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}
  await new Promise(r=>mock.close(r));await rm(dir,{recursive:true,force:true});
 }
});
