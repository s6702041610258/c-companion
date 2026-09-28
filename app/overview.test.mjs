import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {retrieve} from './retrieval.mjs';import {overviewContexts,isOverview,overviewPolicy} from './overview.mjs';
const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url)));
for(const q of ['ตัวแปรในภาษา C มีอะไรบ้างครับ','ชนิดข้อมูลในภาษา C','ตัวแปรมีกี่ประเภท']){
test('overview includes data-type table: '+q,()=>{const refs=overviewContexts(pages,q,retrieve(pages,q));assert.ok(refs.some(p=>p.page===15));const text=refs.map(p=>p.text).join(' ');for(const type of ['char','short','int','long','float','double','unsigned'])assert.ok(text.includes(type))});
}
for(const q of ['datatype ทั้งหมดในภาษา C มีอะไรบ้างครับ','datatype คืออะไร','datatype ในภาษาซี มีอะไรบ้าง','data types ใน C มีอะไรบ้าง']){
test('datatype wording retrieves the book table: '+q,()=>{const refs=overviewContexts(pages,q,retrieve(pages,q));assert.equal(refs[0]?.page,15);assert.ok(refs.some(p=>p.text.includes('Built-in data types in C language')))});
}
test('specific request is not widened',()=>{const q='printf ใช้งานอย่างไร';const refs=retrieve(pages,q);assert.deepEqual(overviewContexts(pages,q,refs),refs)});
test('overview never crosses selected chapter boundary',()=>{const q='ตัวแปรมีอะไรบ้าง';const refs=overviewContexts(pages,q,retrieve(pages,q,2),2);assert.ok(refs.every(p=>p.chapter===2));assert.ok(refs.length<=8);assert.equal(new Set(refs.map(p=>p.page)).size,refs.length)});
test('type table includes reviewed portability note',()=>assert.ok(overviewPolicy('ชนิดข้อมูล',pages.filter(p=>p.page===15)).includes('implementation')));
