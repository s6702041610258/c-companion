import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {retrieve,validateAnswer} from './retrieval.mjs';
const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url)));
test('printed pages map to PDF pages',()=>{assert.equal(pages.length,107);assert.equal(pages[0].pdfPage,6);assert.equal(pages.at(-1).pdfPage,112)});
for(const [q,chapter] of [['ลูป for ทำงานยังไง',5],['พอยน์เตอร์คืออะไร',7],['printf ใช้ยังไง',3],['struct คืออะไร',8],['fopen อ่านไฟล์',11],['ฟังก์ชันคืนค่า',9]])test('retrieval '+q,()=>assert.ok(retrieve(pages,q).some(p=>p.chapter===chapter)));
test('chapter selection stays in chapter',()=>assert.ok(retrieve(pages,'อธิบาย',5).every(p=>p.chapter===5)));
test('unrelated terms have no retrieval',()=>assert.equal(retrieve(pages,'ราคาทองวันนี้').length,0));
test('reject fabricated citations',()=>assert.throws(()=>validateAnswer('{"answer":"test","citations":[999],"in_scope":true}',[1])));
test('reject missing citations for claims',()=>assert.throws(()=>validateAnswer('{"answer":"test","citations":[],"in_scope":true}',[1])));
test('allow honest abstention',()=>assert.equal(validateAnswer('{"answer":"ไม่พบ","citations":[],"in_scope":false}',[1]).inScope,false));

test('source to executable retrieves compilation chapter',()=>assert.ok(retrieve(pages,'ภาษา C จากไฟล์ต้นฉบับกลายเป็นโปรแกรมที่ทำงานได้อย่างไร',1).some(p=>p.page===4)));
test('partial array initializer retrieves the book example without choosing a chapter',()=>{
 for(const question of ['int a[5] = {75, 25}; ค่า a[4] เป็นเท่าไร เพราะอะไร','อาร์เรย์ int a[5] = {75, 25}; ค่า a[4] เป็นเท่าไร'])
  assert.ok(retrieve(pages,question).some(p=>p.page===51),question);
});
test('array bound question retrieves the array index explanation',()=>assert.ok(retrieve(pages,'int a[3] = {1,2,3}; อ่าน a[3] ได้ไหม').some(p=>p.page===51)));
test('basic type sizes retrieve the textbook table',()=>{
 for(const question of ['sizeof(int) เท่ากับ 4 ไบต์ทุกเครื่องใช่ไหม','หนังสือหน้า 15 เขียนว่า long long ขนาด 4 bytes ใช้ได้กับทุกเครื่องไหม'])
  assert.ok(retrieve(pages,question).some(p=>p.page===15),question);
});
test('int versus float comparison starts with the actual type table',()=>{
 for(const question of ['int กับ float ต่างกันอย่างไร','เปรียบเทียบ int และ float']){
  assert.equal(retrieve(pages,question)[0]?.page,15,question);
 }
});
