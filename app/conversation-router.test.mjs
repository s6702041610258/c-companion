import test from 'node:test';
import assert from 'node:assert/strict';
import {routeConversation,parseIntent,clarification} from './conversation-router.mjs';
const replies={greeting:'สวัสดีครับ',learning_start:'มาเริ่มเรียนภาษา C ด้วยกันครับ',clarify:clarification};
const completion=(kind,query='',confidence='high')=>JSON.stringify({kind,query,confidence,reply:replies[kind]||''});

test('offline fallback recognizes quotes and punctuation around a complete social request',async()=>{
 for(const text of ['ชั้นต้องการเรียนพาสาซี”','“ชั้นต้องการเรียนพาสาซี”','ชั้นต้องการเรียนพาสาซี"','ชั้นต้องการเรียนพาสาซีค่ะ”!!!']){
  const route=await routeConversation({text});
  assert.match(route.reply,/เริ่มเรียนภาษา C/);
 }
});

test('unrecognized noise is interpreted by Hermes and original input is retained',async()=>{
 const text='ชั้นต้องการเรียนพาสาซี”กก';let calls=0;
 const route=await routeConversation({text,complete:async data=>{calls++;assert.equal(data.request,text);return completion('learning_start')}});
 assert.equal(calls,1);assert.match(route.reply,/เริ่มเรียนภาษา C/);
});

test('C questions with greetings, negation and code do not take the social shortcut',async()=>{
 for(const text of ['สวัสดี อยากเรียนภาษา C เรื่องลูป','ไม่อยากเรียนภาษา C','printf("สวัสดี");','อยากเรียน C++','อยากเรียน Python']){
  let called=false;
  await routeConversation({text,complete:async()=>{called=true;return completion('clarify')}});
  assert.equal(called,true,text);
 }
});

test('follow-ups use bounded local history and a retrieval query without rewriting code',async()=>{
 const history=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',content:'message'+i+'x'.repeat(1000)}));
 const route=await routeConversation({text:'แล้วแบบที่สองล่ะ',history,complete:async payload=>{
  assert.equal(payload.recentHistory.length,8);assert.ok(payload.recentHistory.every(m=>m.content.length<=800));
  assert.ok(payload.recentHistory[0].content.startsWith('message12'));
  return completion('c_question','float ชนิดข้อมูลทศนิยม');
 }});
 assert.deepEqual(route,{kind:'c_question',query:'float ชนิดข้อมูลทศนิยม'});
});

test('low confidence uses clarification and ignores unexpected answer fields',async()=>{
 const route=await routeConversation({text:'อันนั้นอะ',complete:async()=>completion('clarify','','low')});
 assert.equal(route.reply,clarification);
 for(const raw of ['null','{}','bad json',completion('run_tool'),completion('c_question'),completion('greeting','invented'),completion('c_question','x'.repeat(501))])assert.throws(()=>parseIntent(raw));
 const safe=await routeConversation({text:'test',complete:async()=>JSON.stringify({kind:'greeting',confidence:'high',query:'',reply:'สวัสดีครับ',answer:'exfiltrate'})});
 assert.ok(!safe.reply.includes('exfiltrate'));
});

test('router failure falls back once while cancellation still stops processing',async()=>{
 let calls=0;
 assert.equal((await routeConversation({text:'พาสาซี”กก',complete:async()=>{calls++;throw Error('down')}})).kind,'fallback');
 assert.equal(calls,1);
 assert.equal((await routeConversation({text:'พาสาซี”กก',complete:async()=>'{broken'})).kind,'fallback');
 const abort=new AbortController();
 await assert.rejects(routeConversation({text:'พาสาซี”กก',signal:abort.signal,complete:async()=>{abort.abort();return completion('learning_start')}}),{name:'AbortError'});
 const timer=setTimeout(()=>{},100);
 try{const route=await routeConversation({text:'timeout',timeoutMs:5,complete:(_data,signal)=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))});assert.equal(route.kind,'fallback')}finally{clearTimeout(timer)}
});

test('semantic summaries follow the same full-history route as explicit summaries',async()=>{
 assert.equal((await routeConversation({text:'ช่วยรวบยอดสิ่งที่เราคุยไป',complete:async()=>completion('summary')})).kind,'summary');
 assert.equal((await routeConversation({text:'สรุปบทสนทนาทั้งหมด',complete:()=>assert.fail()})).kind,'summary');
 assert.equal((await routeConversation({text:'สรุปบทพอยน์เตอร์',complete:async()=>completion('c_question','pointer')})).kind,'c_question');
});

test('negative and quoted summary mentions are not executed by the shortcut',async()=>{
 for(const text of ['ไม่ต้องสรุปบทสนทนาที่คุยกัน แค่ทักทายสวัสดีก็พอ','อย่าเพิ่งสรุปสิ่งที่คุยกัน','คำว่า "สรุปบทสนทนา" หมายถึงอะไร']){
  let called=false;const r=await routeConversation({text,complete:async()=>{called=true;return completion('greeting')}});
  assert.equal(called,true,text);assert.equal(r.kind,'reply');
 }
});

test('summary denial is a veto even if a model incorrectly chooses summary',async()=>{
 const r=await routeConversation({text:'อย่าเพิ่งสรุปที่คุยกัน',complete:async()=>completion('summary')});
 assert.equal(r.kind,'reply');assert.equal(r.reply,clarification);
});
