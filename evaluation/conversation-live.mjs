// Opt-in: creates only its own test chats and deletes them after verification.
import assert from 'node:assert/strict';
const base=process.env.TUTOR_URL?.replace(/\/$/,'');
if(!base)throw Error('Set TUTOR_URL to the authorized test website.');
let cookie='';
async function api(path,method='GET',data){
 const r=await fetch(base+path,{method,headers:{...(cookie?{cookie}:{}),...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(110000)});
 if(!cookie&&r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
 const result=await r.json();assert.ok(r.ok,'HTTP '+r.status);return result;
}
const scenarios=[
 {name:'natural-conversation',turns:[
  ['ผมคือคุณ',/บทบาท|สลับ|หมายถึง|ถ้า|ลอง/,false],
  ['ผมคือคุณ หมายถึงอะไร',/ผู้พูด|อีกฝ่าย|หมาย|บริบท|ตัวตน/,false],
  ['ยากจัง ไม่เรียนแล้ว',/พัก|เข้าใจ|ไม่เป็นไร|หยุด/,false],
  ['เอาไว้ก่อนนะวันนี้สมองตัน',/พัก|เข้าใจ|ได้เลย|พร้อม|วัน/,false]
 ]},
 {name:'contextual-clarification',turns:[
  ['งงอะ',/ไหน|อะไร|เรื่อง|หมายถึง/,false],
  ['สวัสดี พอยน์เตอร์คืออะไร',/พอยน์เตอร์|pointer/i,true,7],
  ['งงอะ',/พอยน์เตอร์|pointer|ที่อยู่|ตัวแปร|\*|&/i,false],
  ['ช่วยอธิบายพอยน์เตอร์อีกทีแบบง่าย ๆ',/พอยน์เตอร์|pointer/i,true,7]
 ]},
 {name:'quiz-conversation',mode:'quiz',turns:[
  ['ขอโจทย์เรื่องลูป for',/for|ลูป/,true,5],
  ['ยากจัง ไม่เรียนแล้ว',/พัก|เข้าใจ|ไม่เป็นไร|หยุด/,false],
  ['เฉลยให้หน่อยในรูปแบบคุยเล่น',/ลองตอบ/,false]
 ]},
 {name:'noise-and-onboarding',turns:[
  ['ชั้นต้องการเรียนพาสาซี”',/ภาษา\s*C|ภาษาซี/i,false],
  ['ชั้นต้องการเรียนพาสาซี”กก',/ภาษา\s*C|ภาษาซี/i,false],
  ['อยากหัดเขียนภาษาซี เริ่มตรงไหนดีงับ',/เริ่ม|พื้นฐาน|โปรแกรม/,'onboarding',1],
  ['เริ่มจากศูนย์เลย',/ภาษา\s*C|main/i,true,1]
 ]},
 {name:'C-follow-up-and-summary',turns:[
  ['int กับ float ต่างกันยังไง',/int.*float|float.*int/is,true,2],
  ['แล้วแบบที่สองล่ะ',/float/i,true,2],
  ['สวัสดี อยากเรียนภาษา C เรื่องลูป',/for|while|ลูป/i,true,5],
  ['ขอบคุณมากเลยงับ',/ยินดี/,false],
  ['คุณคือใคร',/C Companion/,false],
  ['สวัสดี',/สวัสดี/,false],
  ['ช่วยรวบยอดสิ่งที่เราคุยไป',/สรุปจากบทสนทนา.*int.*float/is,false]
 ]},
 {name:'clarify-and-scope',turns:[
  ['อันนั้นอะ',/ไหน|อะไร|หมายถึง|ระบุ|ชี้/,false],
  ['อยากเรียน Python',/ภาษา\s*C/i,false],
  ['ไม่อยากเรียน C ไม่ต้องสอน',/พัก|หยุด|ไม่เป็นไร|ได้เลย|เข้าใจ|ไม่ต้อง/i,false]
 ]}
];
let failures=0;
for(const scenario of scenarios){
 let id;
 try{
  ({id}=await api('/api/chats','POST',{chapter:0,mode:scenario.mode||'ask'}));
  for(const [message,pattern,grounded,chapter] of scenario.turns){
   const started=Date.now();const result=await api('/api/chats/'+id+'/messages','POST',{message});
   assert.match(result.content,pattern);
   if(grounded==='onboarding'&&!result.sources.length)assert.match(result.content,/เริ่มเรียนภาษา C/);
   else if(grounded){assert.ok(result.sources.length);if(chapter)assert.ok(result.sources.some(s=>s.chapter===chapter))}
   else assert.deepEqual(result.sources,[]);
   const saved=await api('/api/chats/'+id);assert.equal(saved.messages.filter(m=>m.role==='user').at(-1).content,message);
   console.log(JSON.stringify({scenario:scenario.name,message,answer:result.content,pages:result.sources.map(s=>s.page),ms:Date.now()-started,pass:true}));
  }
 }catch(error){failures++;console.error(JSON.stringify({scenario:scenario.name,pass:false,error:error.message}))}
 finally{if(id){await api('/api/chats/'+id,'DELETE');console.log(JSON.stringify({scenario:scenario.name,cleanup:true}))}}
}
process.exitCode=failures?1:0;
