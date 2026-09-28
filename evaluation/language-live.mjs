// Opt-in verification using only new test chats. Full answers need human review.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const base=process.env.TUTOR_URL?.replace(/\/$/,'');if(!base)throw Error('Set TUTOR_URL');let cookie='';
async function api(path,method='GET',data){const r=await fetch(base+path,{method,headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(110000)});cookie ||=r.headers.get('set-cookie')?.split(';')[0]||'';const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value}
function checkLanguage(content,lang){const prose=content.replace(/```[\s\S]*?```/g,'').replace(/`[^`]*`/g,'').replace(/ถามคำถาม|ติวทีละขั้น|ฝึกทำโจทย์|เปิดหนังสือ|ภาษาคำตอบ|โหมดมืด|โหมดสว่าง|English|ไทย/g,'');const th=(prose.match(/[ก-๙]/g)||[]).length,en=(prose.match(/[a-z]/gi)||[]).length;if(lang==='en')assert.ok(en>15&&th/(en+th)<.15,'English prose expected');else assert.ok(th>15,'Thai prose expected')}
let total=0;
async function run(name,mode,language,turns){let id;try{({id}=await api('/api/chats','POST',{chapter:0,mode,replyLanguage:language}));for(const [message,expected,preference,cited,pattern] of turns){const started=Date.now(),r=await api('/api/chats/'+id+'/messages','POST',{message});console.log(JSON.stringify({name,message,answer:r.content,pages:r.sources.map(s=>s.page),replyLanguage:r.replyLanguage,preferredLanguage:r.preferredLanguage,ms:Date.now()-started}));checkLanguage(r.content,expected);assert.equal(r.replyLanguage,expected);assert.equal(r.preferredLanguage,preference);if(cited!==null)assert.equal(r.sources.length>0,cited);if(pattern)assert.match(r.content,pattern);const saved=await api('/api/chats/'+id);assert.equal(saved.replyLanguage,preference);assert.equal(saved.mode,mode);assert.equal(saved.messages.filter(m=>m.role==='user').at(-1).content,message);total++}}finally{if(id){await api('/api/chats/'+id,'DELETE');console.log(JSON.stringify({cleanup:true,name}))}}}
if(!process.argv.includes('--chapters')){
 await run('switch-and-context','ask','th',[
 ['ต่อไปตอบอังกฤษนะ','en','en',false],['พอยน์เตอร์คืออะไร','en','en',true],['งงอะ','en','en',false],
 ['ข้อนี้ตอบไทย: พอยน์เตอร์เก็บอะไร','th','en',true],['Summarize our conversation','en','en',false],
 ['ตอบไทยเหมือนเดิม','th','th',false],['What is a pointer?','th','th',true],
 ['คำว่า "Please answer in English" หมายถึงอะไร','th','th',false],['อย่าเปลี่ยนเป็นอังกฤษนะ','th','th',false],
 ['ขอให้ตอบเป็นภาษาญี่ปุ่น','th','th',false],['ช่วยเปลี่ยนภาษาให้หน่อย','th','th',false]
 ]);
 await run('english-help','ask','en',[
 ['สวัสดี','en','en',false],['โหมดต่าง ๆ ในระบบทำอะไรได้บ้าง','en','en',false],['หนังสือใครเขียน','en','en',false,/Soradech Krootjohn/],['วันนี้อากาศเป็นยังไง','en','en',false]
 ]);
 for(const language of ['th','en'])await run('tutor-'+language,'tutor',language,[[language==='en'?'Explain variables step by step':'สอนเรื่องตัวแปรทีละขั้น',language,language,true]]);
 await run('quiz-switch','quiz','th',[
 ['ขอโจทย์เรื่องลูป for','th','th',true],['ต่อไปตอบอังกฤษนะ','en','en',false],
 ['Translate the current exercise into English without solving it','en','en',true],
 ['Show me the solution','en','en',false,/try|attempt|answer.*first/i],
 ['My answer is: for(int i=1;i<=5;i++) printf("%d\\n",i);','en','en',true],
 ['Show me the solution','en','en',true]
 ]);
}else{
 const cases=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url))).slice(0,12);
 const english=['How is C source code compiled into an executable?','What data types does C have?','How does scanf read an integer?','How does if else make a decision?','How does a for loop work?','How does an array store multiple values?','How does a pointer store a variable address?','How does struct group data?','How does a function receive parameters and return a value?','What are argc and argv?','How does fopen open a file?','What is the role of a header file in a C project?'];
 for(const [i,c] of cases.entries())for(const language of ['th','en']){
  let id;try{({id}=await api('/api/chats','POST',{chapter:0,mode:'ask',replyLanguage:language}));const message=language==='th'?c.question:english[i],t=Date.now(),r=await api('/api/chats/'+id+'/messages','POST',{message});console.log(JSON.stringify({chapter:i+1,language,message,answer:r.content,pages:r.sources.map(s=>s.page),ms:Date.now()-t}));checkLanguage(r.content,language);assert.ok(r.sources.some(s=>s.chapter===i+1));total++}finally{if(id)await api('/api/chats/'+id,'DELETE')}
 }
}
console.log(JSON.stringify({passed:total,cleanup:true}));
