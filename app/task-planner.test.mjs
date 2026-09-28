import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {needsTaskPlan,parsePlan,taskContexts} from './task-planner.mjs';
const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url)));
test('applied requests trigger concept planning',()=>{for(const q of ['เขียนโค้ดคำนวณเกรด','เขียนโค้ดหาเลขคู่เลขคี่','เขียนโปรแกรมแปลงอุณหภูมิ','write a C program to find an average'])assert.equal(needsTaskPlan(q),true)});
test('grade plan retrieves actual selection and IO concepts',()=>{const refs=taskContexts(pages,parsePlan('{"in_scope":true,"concepts":["selection","input","output"]}'));assert.ok(refs.some(p=>p.chapter===4));assert.ok(refs.some(p=>p.chapter===3))});
test('parity plan contains actual modulo explanation',()=>{const refs=taskContexts(pages,parsePlan('{"in_scope":true,"concepts":["remainder","selection","input","output"]}'));assert.ok(refs.some(p=>/remainder|modulus/i.test(p.text)));assert.ok(refs.some(p=>p.chapter===4))});
test('planner cannot name arbitrary topics',()=>assert.throws(()=>parsePlan('{"in_scope":true,"concepts":["shell"]}')));
test('planner requires concepts for in-scope result',()=>assert.throws(()=>parsePlan('{"in_scope":true,"concepts":[]}')));
test('selected chapter restriction retained',()=>{const refs=taskContexts(pages,{concepts:['remainder','selection','input']},4);assert.ok(refs.length);assert.ok(refs.every(p=>p.chapter===4))});

test('compilation explanations are not forced into applied planning',()=>{assert.equal(needsTaskPlan('ภาษา C จากไฟล์ต้นฉบับกลายเป็นโปรแกรมที่ทำงานได้อย่างไร'),false)});
test('quoting what a page says is not a request to write a program',()=>{
 assert.equal(needsTaskPlan('หนังสือหน้า 15 เขียนว่า long long ขนาด 4 bytes ใช้ได้กับทุกเครื่องไหม'),false);
 assert.equal(needsTaskPlan('ในตารางเขียนว่า int ใช้เก็บอะไร'),false);
});

test('planning a code question preserves the directly matched array-bound page',()=>{
 const plan={concepts:['arrays','output']};
 const refs=taskContexts(pages,plan,0,'int a[3] = {1,2,3}; printf("%d", a[3]); โค้ดนี้พิมพ์ 0 แน่นอนใช่ไหม');
 assert.equal(refs[0].page,51);
});
