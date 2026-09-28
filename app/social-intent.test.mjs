import {test} from 'node:test';
import assert from 'node:assert/strict';
import {socialReply} from './social-intent.mjs';

test('short greetings receive a friendly C tutor invitation',()=>{
 for(const text of ['สวัสดี','สวัสดีครับ 👋','หวัดดี','Hello!','hi']){
  const answer=socialReply(text);
  assert.match(answer,/C Companion/);
  assert.match(answer,/ภาษา C/);
 }
});

test('questions about the tutor receive its capabilities',()=>{
 for(const text of ['คุณคือเเชทบอทเกี่ยวกับอะไรทำอะไรได้บ้าง &#x20;','chatbot นี้ทำไรได้บ้าง','คุณคือใคร','ช่วยอะไรได้บ้าง']){
  assert.match(socialReply(text),/ผมคือ C Companion เพื่อนติวภาษา C/);
 }
});

test('a C question containing a greeting still follows the book answer path',()=>{
 for(const text of ['สวัสดี printf ใช้ยังไง','ภาษา C ทำอะไรได้บ้าง','ช่วยอธิบายพอยน์เตอร์ได้ไหม']){
  assert.equal(socialReply(text),null);
 }
});

test('recognizes reported typos, repeated pronouns, and polite capability questions',()=>{
 for(const text of ['คุณ คุณ คุณทำอะไรได้บ้าว','คุณทำอะไรได้บ้างครับ','แนะนำตัวหน่อย','บอทนี้ช่วยอะไรได้บ้างคะ'])assert.match(socialReply(text),/ผมคือ C Companion/);
});

test('welcomes a beginner even when Thai C language is misspelled',()=>{
 for(const text of ['ชั้นต้องการเรียนพาสาซี &#x20;','ผมอยากเรียนภาษาซี','อยากเริ่มเรียน C ครับ','ช่วยสอนภาษา C หน่อย'])assert.match(socialReply(text),/เริ่มเรียนภาษา C/);
 for(const text of ['อยากเรียน Python','ผมอยากเรียนภาษา C เรื่องพอยน์เตอร์','คุณช่วยอธิบายว่า printf ทำอะไรได้บ้าง'])assert.equal(socialReply(text),null);
});
