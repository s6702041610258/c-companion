import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const base=process.env.TUTOR_URL?.replace(/\/$/,'');
if(!base)throw Error('Set TUTOR_URL to the C Companion website before running live evaluation.');
const cases=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url)));
const codeCases=[
 {id:'code-grade',question:'เขียนโปรแกรมภาษา C รับคะแนน 0 ถึง 100 แล้วแสดงเกรด A B C D F พร้อมตรวจคะแนนนอกช่วง',codeRequired:true},
 {id:'code-parity',question:'เขียนโปรแกรมภาษา C รับจำนวนเต็มแล้วบอกว่าเป็นเลขคู่หรือเลขคี่',codeRequired:true}
];
const chosen=process.argv.includes('--code')?codeCases:process.argv.includes('--all')?cases:cases.filter(item=>item.id.startsWith('chapter-'));
let cookie='';

async function request(path,method='GET',payload){
 const response=await fetch(base+path,{
  method,
  headers:{...(cookie?{Cookie:cookie}:{}),...(payload?{'Content-Type':'application/json'}:{})},
  body:payload?JSON.stringify(payload):undefined,
  signal:AbortSignal.timeout(125000)
 });
 if(!cookie){const header=response.headers.get('set-cookie');if(header)cookie=header.split(';',1)[0]}
 return {status:response.status,data:await response.json()};
}

let failures=0;
for(const item of chosen){
 let chatId;
 try{
  const created=await request('/api/chats','POST',{chapter:0,mode:'ask'});
  if(created.status!==201||!created.data.id)throw Error('cannot create test chat');
  chatId=created.data.id;
  const response=await request(`/api/chats/${chatId}/messages`,'POST',{message:item.question});
  if(response.status!==200)throw Error(`answer request returned ${response.status}: ${response.data.error||'unknown'}`);
  const answer=response.data.content||'';
  const sources=response.data.sources||[];
  if(!answer.trim())throw Error('empty answer');
  if(item.outOfScope||item.noCitationExpected){if(sources.length)throw Error('answer cited a page that does not support the requested fact')}
  else{
   if(item.requiredPage&&!sources.some(source=>source.page===item.requiredPage))throw Error(`missing required page ${item.requiredPage}; cited ${sources.map(source=>source.page)}`);
   if(item.codeRequired){
    if(!sources.some(source=>[3,4].includes(source.chapter)))throw Error(`code answer missing input/selection citations; cited ${sources.map(source=>source.chapter)}`);
    const code=answer.match(/```c\s*\n([\s\S]*?)\n```/i)?.[1];
    if(!code)throw Error('missing fenced C program');
    if(!/\bint\s+main\s*\(/.test(code))throw Error('missing main function');
    const compile=spawnSync('clang',['-x','c','-std=c11','-fsyntax-only','-'],{input:code,encoding:'utf8'});
    if(compile.error)throw Error(`cannot check C syntax: ${compile.error.message}`);
    if(compile.status!==0)throw Error(`C syntax failed: ${compile.stderr.slice(0,350)}`);
   }else if(!sources.some(source=>source.chapter===item.chapter))throw Error(`missing expected chapter; cited ${sources.map(source=>source.page)}`);
   if(/ยังไม่พบเนื้อหา|หนังสือไม่มี|ไม่มีในหนังสือ/.test(answer))throw Error('false missing-content answer');
  }
  console.log(`PASS ${item.id} pages=${sources.map(source=>source.page).join(',')}`);
  if(process.argv.includes('--show-answers'))console.log(`ANSWER ${item.id}: ${answer.replace(/\s+/g,' ').slice(0,1800)}`);
 }catch(error){failures++;console.error(`FAIL ${item.id}: ${error.message}`)}
 finally{
  if(chatId){try{const deleted=await request(`/api/chats/${chatId}`,'DELETE');if(deleted.status!==200)console.error(`WARN ${item.id}: test chat was not deleted`)}catch{console.error(`WARN ${item.id}: test chat cleanup failed`)}}
 }
}
console.log(`${chosen.length-failures}/${chosen.length} live cases passed`);
if(failures)process.exitCode=1;
