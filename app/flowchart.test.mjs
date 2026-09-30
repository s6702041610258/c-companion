import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retrieve,evidenceChapter} from './retrieval.mjs';
import {overviewContexts} from './overview.mjs';
import {taskContexts} from './task-planner.mjs';
const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url)));
for(const query of ['Flowchart คือไรมีอะไรบ้าง','ผังงานมีสัญลักษณ์อะไรบ้าง','flow chart symbols','flow-chart symbols','โฟลว์ชาร์ต คืออะไร','Flowchart คือไรมีอะไรบ้าง\nC language program input output variable int function return pointer array process']){
 test('flowchart definition and complete symbol table: '+query,()=>{
  const refs=retrieve(pages,query);
  for(const page of [5,6,7])assert.ok(refs.some(p=>p.page===page),'missing printed page '+page);
  assert.equal(refs[0].page,5);
  const expanded=overviewContexts(pages,query,refs);
  assert.ok(expanded.find(p=>p.page===6).text.includes('Terminator'));
  assert.ok(expanded.find(p=>p.page===7).text.includes('Flow Line'));
 });
}
test('chapter filter cannot manufacture matches for an absent topic',()=>{
 assert.deepEqual(retrieve(pages,'Flowchart คือไรมีอะไรบ้าง',2),[]);
 assert.deepEqual(retrieve(pages,'unknownwordnotinbook',5),[]);
 assert.ok(retrieve(pages,'อธิบาย',5).length,'generic chapter browsing still works');
});
test('algorithm planning retains the symbol table alongside the definition',()=>{
 const refs=taskContexts(pages,{concepts:['algorithms','output']},0,'เขียนโปรแกรมและอธิบาย Flowchart');
 for(const page of [5,6,7])assert.ok(refs.some(p=>p.page===page),'missing printed page '+page);
});

test('answer layer widens only explicit textbook evidence and retains ordinary chapter selection',()=>{
 for(const chapter of [2,5,12])assert.equal(evidenceChapter(pages,'Flowchart คือไรมีอะไรบ้าง',chapter),0);
 assert.equal(evidenceChapter(pages,'Flowchart คือไรมีอะไรบ้าง',1),1);
 assert.equal(evidenceChapter(pages,'อธิบาย',5),5);
 assert.equal(evidenceChapter(pages,'input output program language variable function',5),5);
 assert.equal(evidenceChapter(pages,'unknownwordnotinbook',5),5);
});
