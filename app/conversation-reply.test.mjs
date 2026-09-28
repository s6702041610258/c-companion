import test from 'node:test';import assert from 'node:assert/strict';
import {routeConversation,parseIntent} from './conversation-router.mjs';
const response=(kind,reply,query='',confidence='high')=>JSON.stringify({kind,reply,query,confidence});
test('ambiguous banter receives a contextual reply in the same single model call',async()=>{
 const text='ผมคือคุณ';const reply='จะสลับบทบาทกันไหมครับ 😄 ลองตั้งคำถามภาษา C ให้ผมตอบสักข้อได้เลย';let calls=0;
 const r=await routeConversation({text,complete:async payload=>{calls++;assert.equal(payload.request,text);return response('smalltalk',reply)}});
 assert.equal(calls,1);assert.deepEqual(r,{kind:'reply',reply,query:''});
});
test('greetings use the model when available and a static reply only as fallback',async()=>{
 let calls=0;const reply='สวัสดีครับ วันนี้อยากคุยเรื่องอะไรดีครับ?';
 const r=await routeConversation({text:'สวัสดี',complete:async()=>{calls++;return response('greeting',reply)}});
 assert.equal(calls,1);assert.equal(r.reply,reply);
 const failed=await routeConversation({text:'สวัสดี',complete:async()=>{throw Error('offline')}});assert.match(failed.reply,/สวัสดี.*C Companion/);
});
test('clarification asks about the current discussion instead of resetting onboarding',async()=>{
 const history=[{role:'assistant',content:'ตัวอย่าง int x=1; int *p=&x; อ่านค่าด้วย *p'}];
 const reply='ติดตรง &x หรือ *p ครับ?';
 const r=await routeConversation({text:'งงอะ',history,complete:async p=>{assert.match(p.recentHistory[0].content,/\*p/);return response('clarify',reply,'','low')}});
 assert.equal(r.reply,reply);
});
test('empathy does not create a retrieval query or claim learner understanding',async()=>{
 const reply='พักก่อนได้ครับ ถ้าอยากลองต่อ เราค่อยทำทีละขั้นนะครับ';
 const r=await routeConversation({text:'ยากจัง ไม่เรียนแล้ว',complete:async()=>response('encouragement',reply)});assert.equal(r.reply,reply);assert.equal(r.query,'');
});
test('technical answers cannot use the conversational reply field',()=>{
 assert.throws(()=>parseIntent(response('c_question','int เก็บจำนวนเต็ม','int')));
 assert.deepEqual(parseIntent(response('c_question','','int')),{kind:'c_question',query:'int'});
 for(const reply of ['', 'x'.repeat(601),'คำตอบ ```c\nint x=1;\n```','อ้างอิงหน้า 999','อ่าน https://example.com','<script>alert(1)</script>'])assert.throws(()=>parseIntent(response('smalltalk',reply)),reply);
});
test('quiz social replies keep the exercise context without rewriting original text',async()=>{
 const text='ยากจังงง 😭';const quizContext=[{role:'assistant',content:'เขียนลูป for พิมพ์ 1 ถึง 5'}];
 const r=await routeConversation({text,mode:'quiz',quizContext,complete:async p=>{assert.equal(p.request,text);assert.equal(p.quizContext[0].content,quizContext[0].content);return response('encouragement','ค่อย ๆ ลองได้ครับ ลองเริ่มจากสิ่งที่เข้าใจก่อนก็ได้')}});assert.equal(r.kind,'reply');
});
