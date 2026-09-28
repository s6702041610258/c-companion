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
