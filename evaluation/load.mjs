// Bounded live test: separate anonymous sessions, no private user data, no stress flood.
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.TUTOR_URL?.replace(/\/$/,'');if(!base)throw Error('Set TUTOR_URL');
const count=Number(process.env.LOAD_SESSIONS||6);assert.ok(Number.isInteger(count)&&count>=2&&count<=12,'Use 2–12 sessions');
const prompts=['int กับ float ต่างกันอย่างไร','ลูป for ทำงานอย่างไร','พอยน์เตอร์คืออะไร','struct ใช้รวมข้อมูลอย่างไร','scanf รับจำนวนเต็มอย่างไร','int a[3]={1,2,3}; a[2] มีค่าเท่าไร'];
const sessions=Array.from({length:count},(_,i)=>({index:i,cookie:'',chat:null,job:null}));
const report={sessions:count,started:new Date().toISOString(),results:[],healthMs:[],peakActive:0,peakWaiting:0};
async function request(s,path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{...(s.cookie?{Cookie:s.cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
 const cookie=r.headers.get('set-cookie');if(cookie)s.cookie=cookie.split(';')[0];return {status:r.status,data:await r.json()};
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));let sampling=true;let samplingError;
const health=await request({},'/api/health');assert.equal(health.status,200);assert.equal(health.data.queue.active+health.data.queue.waiting,0,'Wait until existing jobs finish before the bounded test');report.release=health.data.release;
const sampler=(async()=>{while(sampling){const t=performance.now();const h=await request({},'/api/health');assert.equal(h.status,200);report.healthMs.push(Math.round(performance.now()-t));report.peakActive=Math.max(report.peakActive,h.data.queue.active);report.peakWaiting=Math.max(report.peakWaiting,h.data.queue.waiting);await pause(500)}})().catch(e=>{samplingError=e});
let error;
try{
 await Promise.all(sessions.map(async(s)=>{
  const chat=await request(s,'/api/chats','POST',{mode:'ask'});assert.equal(chat.status,201);s.chat=chat.data.id;
 }));
 const outcomes=await Promise.allSettled(sessions.map(async s=>{
  const t=performance.now();const response=await request(s,`/api/chats/${s.chat}/messages`,'POST',{message:prompts[s.index%prompts.length],async:true,requestKey:randomUUID()});assert.equal(response.status,202);s.job=response.data.id;
  for(;;){
   const j=await request(s,'/api/jobs/'+s.job);assert.equal(j.status,200);
   if(j.data.status==='completed'){
    assert.ok(j.data.result.sources.length>0,'Missing grounded answer');
    const saved=await request(s,'/api/chats/'+s.chat);assert.equal(saved.data.messages.length,2);assert.equal(saved.data.messages[0].content,prompts[s.index%prompts.length]);
    report.results.push({index:s.index,elapsedMs:Math.round(performance.now()-t),answer:j.data.result.content,pages:j.data.result.sources.map(x=>x.page)});return;
   }
   assert.ok(['running','queued'].includes(j.data.status),j.data.error);assert.ok(performance.now()-t<90000,'90 second completion threshold exceeded');await pause(750);
  }
 }));
 const failed=outcomes.filter(r=>r.status==='rejected');if(failed.length)throw Error(failed.map(r=>r.reason.message).join('; '));
 assert.ok(report.peakActive<=2);const latencies=report.healthMs.toSorted((a,b)=>a-b);report.healthP95Ms=latencies[Math.ceil(latencies.length*.95)-1];assert.ok(report.healthP95Ms<1500,'Health p95 exceeded 1.5 seconds');
 report.completionMaxMs=Math.max(...report.results.map(r=>r.elapsedMs));report.pass=true;
}catch(e){report.pass=false;report.error=e.message;error=e}
finally{
 sampling=false;try{await sampler;if(samplingError)throw samplingError}catch(e){report.pass=false;report.error=e.message;error=e}
 report.cleanup=[];
 for(const s of sessions){if(!s.chat)continue;try{
  if(s.job){await request(s,'/api/jobs/'+s.job,'DELETE');for(let i=0;i<20;i++){const j=await request(s,'/api/jobs/'+s.job);if(!['queued','running'].includes(j.data.status))break;await pause(100)}}
  const r=await request(s,'/api/chats/'+s.chat,'DELETE');report.cleanup.push(r.status);if(r.status!==200){report.pass=false;error=Error('Test chat cleanup failed')}
 }catch(e){report.pass=false;error=e;report.cleanup.push('failed')}}
 if(process.env.EVALUATION_OUTPUT)writeFileSync(process.env.EVALUATION_OUTPUT,JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,results:report.results.map(({answer,...r})=>r),healthMs:undefined},null,2));
}
if(error)process.exitCode=1;
