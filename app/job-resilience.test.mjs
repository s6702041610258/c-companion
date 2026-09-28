import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import {createJobs} from './jobs.mjs';
const waitUntil=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await delay(5)}throw Error('condition timed out')};
const slow=async(_chat,_text,signal)=>{await delay(1000,null,{signal});return {content:'late'}};
test('one session cannot monopolize all workers and waiting slots',async()=>{
 const db=new DatabaseSync(':memory:');const jobs=createJobs(db,slow);
 try{
  jobs.submit('owner-a',{id:'a1'},'q','1');jobs.submit('owner-a',{id:'a2'},'q','2');
  assert.throws(()=>jobs.submit('owner-a',{id:'a3'},'q','3'),e=>e.status===429);
  assert.ok(jobs.submit('owner-b',{id:'b1'},'q','4').id);
 }finally{jobs.shutdown();await waitUntil(()=>!jobs.pending);db.close()}
});
test('AI deadline is a failure visible to health monitoring and frees capacity',async()=>{
 const db=new DatabaseSync(':memory:');const jobs=createJobs(db,slow,{concurrency:1,answerTimeout:25});
 try{
  const j=jobs.submit('a',{id:'c'},'q','1');await waitUntil(()=>!jobs.pending);
  assert.equal(jobs.get(j.id,'a').status,'failed');assert.match(jobs.get(j.id,'a').error,/AI.*นาน/);assert.equal(jobs.queue.active,0);
 }finally{jobs.shutdown();await waitUntil(()=>!jobs.pending);db.close()}
});
test('waiting deadline never calls provider and is reported separately from cancellation',async()=>{
 const db=new DatabaseSync(':memory:');let calls=0;
 const jobs=createJobs(db,async(...args)=>{calls++;return slow(...args)},{concurrency:1,queueTimeout:20});
 try{
  jobs.submit('a',{id:'c1'},'q','1');const waiting=jobs.submit('b',{id:'c2'},'q','2');
  await waitUntil(()=>jobs.get(waiting.id,'b').status!=='queued');assert.equal(jobs.get(waiting.id,'b').status,'failed');assert.match(jobs.get(waiting.id,'b').error,/คิว/);assert.equal(calls,1);
 }finally{jobs.shutdown();await waitUntil(()=>!jobs.pending);db.close()}
});
test('manual cancellation remains cancelled and retries work without restarting server',async()=>{
 const db=new DatabaseSync(':memory:');let calls=0;
 const jobs=createJobs(db,async(...args)=>++calls===1?slow(...args):{content:'recovered'},{concurrency:1});
 try{
  const j=jobs.submit('a',{id:'c'},'q','1');await delay(5);jobs.cancel(j.id,'a');await waitUntil(()=>!jobs.pending);
  assert.equal(jobs.get(j.id,'a').status,'cancelled');const next=jobs.submit('a',{id:'c'},'q','2');await waitUntil(()=>!jobs.pending);assert.equal(jobs.get(next.id,'a').result.content,'recovered');
 }finally{jobs.shutdown();await waitUntil(()=>!jobs.pending);db.close()}
});
