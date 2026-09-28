import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {initQuizState,quizDecision,tryFirst} from './quiz-state.mjs';
test('only a real attempt kind unlocks feedback, new questions reset and social turns preserve state',()=>{
 const state={exercise:1,attempt:null};
 for(const kind of ['quiz_solution','quiz_hint','c_question','fallback'])assert.equal(quizDecision(state,{kind},'ขอเฉลย').reply,tryFirst);
 assert.equal(quizDecision(state,{kind:'quiz_attempt'},'ยังไม่ตอบ ขอเฉลยเลย').kind,'blocked');
 assert.equal(quizDecision(state,{kind:'quiz_attempt'},'ขอเฉลย').kind,'blocked');
 assert.equal(quizDecision(state,{kind:'quiz_attempt'},'ผลลัพธ์คือ 1 2 3').kind,'attempt');
 assert.equal(quizDecision({...state,attempt:2},{kind:'quiz_solution'},'เฉลย').kind,'feedback');
 assert.equal(quizDecision({...state,attempt:2},{kind:'quiz_new'},'ขอโจทย์ใหม่').kind,'exercise');
 assert.equal(quizDecision(state,{kind:'reply'},'สวัสดี').kind,'pass');
});
test('quiz state is additive, keyed per chat, and survives a new database reader',()=>{
 const dir=mkdtempSync(join(tmpdir(),'quiz-state-'));const path=join(dir,'test.db');
 try{
  let db=new DatabaseSync(path);initQuizState(db);initQuizState(db);
  db.prepare('INSERT INTO quiz_state VALUES(?,?,?)').run('one',5,8);db.close();
  db=new DatabaseSync(path);initQuizState(db);
  assert.equal(db.prepare('SELECT attempt FROM quiz_state WHERE chat=?').get('one').attempt,8);
  assert.equal(db.prepare('SELECT * FROM quiz_state WHERE chat=?').get('two'),undefined);db.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
