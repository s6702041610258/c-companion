import test from 'node:test';
import assert from 'node:assert/strict';
import {isConversationSummary} from './conversation-intent.mjs';
import {summarizeConversation,transcriptChunks} from './conversation-summary.mjs';

test('routes conversation recap separately from a textbook topic summary',()=>{
 for(const q of ['ช่วยสรุปเนื้อหาที่คุยกันตั้งแต่เริ่มแชท','สรุปบทสนทนาทั้งหมด','ทบทวนสิ่งที่เรียนไปหน่อย','สรุบที่คุยกัน','summarize our chat'])assert.equal(isConversationSummary(q),true,q);
 for(const q of ['สรุปเรื่องพอยน์เตอร์','สรุปบทที่ 2','สรุปเนื้อหาภาษา C'])assert.equal(isConversationSummary(q),false,q);
});

test('empty conversation needs no model and does not invent a summary',async()=>{
 const result=await summarizeConversation([],'สรุปบทสนทนา',()=>{throw Error('must not call')});
 assert.match(result,/ยังไม่มีบทสนทนา/);
});

test('long conversations include every message through bounded chunks and merging',async()=>{
 const history=Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',content:'topic'+i+' '+('เนื้อหา '.repeat(2000))+' end'+i}));
 const chunks=transcriptChunks(history);
 assert.ok(chunks.length>1);
 assert.ok(chunks.every(c=>c.length<=16000));
 for(let i=0;i<12;i++){assert.ok(chunks.some(c=>c.includes('topic'+i)));assert.ok(chunks.some(c=>c.includes('end'+i)))}
 const calls=[];
 const result=await summarizeConversation(history,'สรุปบทสนทนา',async part=>{
  calls.push(part);
  const topics=[...new Set(part.material.match(/topic\d+/g)||[])];
  return JSON.stringify({summary:topics.join(' ')+' '+'.'.repeat(3500)});
 });
 assert.ok(calls.some(c=>c.phase==='merge'));
 assert.ok(calls.every(c=>c.material.length<=16000));
 for(let i=0;i<12;i++)assert.ok(result.includes('topic'+i));
});

test('invalid model output retries once and fails honestly if still invalid',async()=>{
 const history=[{role:'user',content:'ภาษา C คืออะไร'}];
 let calls=0;
 const result=await summarizeConversation(history,'สรุปบทสนทนา',async()=>++calls===1?'invalid':JSON.stringify({summary:'ผู้เรียนถามว่าภาษา C คืออะไร'}));
 assert.equal(calls,2);assert.match(result,/ผู้เรียนถาม/);
 await assert.rejects(summarizeConversation(history,'สรุปบทสนทนา',async()=>JSON.stringify({summary:'x'.repeat(6001)})),e=>e.status===502);
});

test('cancellation stops additional summary calls',async()=>{
 const abort=new AbortController();let calls=0;
 await assert.rejects(summarizeConversation([{role:'user',content:'x'.repeat(35000)}],'สรุปบทสนทนา',async()=>{
  calls++;abort.abort();return JSON.stringify({summary:'ย่อ'});
 },abort.signal),e=>e.name==='AbortError');
 assert.equal(calls,1);
});
