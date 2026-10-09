import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {clearChatHistory} from './chat-history.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE chats(id TEXT,owner TEXT); CREATE TABLE jobs(id TEXT,chat TEXT); CREATE TABLE job_languages(job TEXT); CREATE TABLE messages(chat TEXT); CREATE TABLE quiz_state(chat TEXT); CREATE TABLE chat_preferences(chat TEXT); CREATE TABLE progress(owner TEXT);');
 for(const owner of ['mine','other'])for(let i=0;i<61;i++){
  const id=owner+i;db.prepare('INSERT INTO chats VALUES(?,?)').run(id,owner);db.prepare('INSERT INTO jobs VALUES(?,?)').run(id,id);db.prepare('INSERT INTO job_languages VALUES(?)').run(id);
  for(const table of ['messages','quiz_state','chat_preferences'])db.prepare(`INSERT INTO ${table} VALUES(?)`).run(id);
 }
 db.exec("INSERT INTO progress VALUES('mine')");return db;
}
test('clear history removes every owned chat and its dependent rows, preserving other sessions and progress',()=>{
 const db=fixture();try{
  assert.deepEqual(clearChatHistory(db,'mine',()=>false),{ok:true,deleted:61});
  for(const table of ['chats','jobs','job_languages','messages','quiz_state','chat_preferences'])assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n,61);
  assert.equal(db.prepare("SELECT count(*) n FROM chats WHERE owner='mine'").get().n,0);
  assert.equal(db.prepare('SELECT count(*) n FROM progress').get().n,1);
  assert.deepEqual(clearChatHistory(db,'mine',()=>false),{ok:true,deleted:0});
 }finally{db.close()}
});
test('busy chat prevents the whole deletion, including previously selected chats',()=>{
 const db=fixture();try{assert.throws(()=>clearChatHistory(db,'mine',id=>id==='mine60'),{status:409});assert.equal(db.prepare('SELECT count(*) n FROM chats').get().n,122)}finally{db.close()}
});
test('database failure rolls back every removed row',()=>{
 const db=fixture();try{
  db.exec("CREATE TRIGGER fail_delete BEFORE DELETE ON chats WHEN OLD.id='mine1' BEGIN SELECT RAISE(ABORT,'test failure'); END");
  assert.throws(()=>clearChatHistory(db,'mine',()=>false),/test failure/);
  for(const table of ['chats','jobs','job_languages','messages','quiz_state','chat_preferences'])assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n,122);
 }finally{db.close()}
});
