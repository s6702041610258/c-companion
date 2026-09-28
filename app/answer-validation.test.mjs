import test from 'node:test';
import assert from 'node:assert/strict';
import {retryValidatedAnswer} from './answer-validation.mjs';

test('a malformed model reply gets one fresh attempt before a valid cited answer is returned',async()=>{
 const calls=[];
 const answer=await retryValidatedAnswer(async attempt=>{
  calls.push(attempt);
  return attempt===0?'not JSON':'{"answer":"ตามหน้า 51","citations":[51],"in_scope":true}';
 },[51]);
 assert.deepEqual(calls,[0,1]);
 assert.equal(answer.answer,'ตามหน้า 51');
});
test('the retry never accepts a citation outside the supplied book pages',async()=>{
 let calls=0;
 await assert.rejects(retryValidatedAnswer(async()=>{
  calls++;
  return '{"answer":"ไม่มีหลักฐาน","citations":[999],"in_scope":true}';
 },[51]),/invalid_citation/);
 assert.equal(calls,2);
});
