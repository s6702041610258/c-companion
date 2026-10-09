import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {listChats} from './chat-list.mjs';
test('history pagination covers tied dates, literal search, hidden empty chats and owner boundaries',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE chats(id TEXT,owner TEXT,title TEXT,chapter INTEGER,mode TEXT,created TEXT);CREATE TABLE messages(chat TEXT)');
 try{
  for(let i=0;i<67;i++){const id=String(i).padStart(3,'0');db.prepare('INSERT INTO chats VALUES(?,?,?,?,?,?)').run(id,'a',i===0?'printf 100%':'ลูป '+i,0,'ask','2026-10-09T00:00:00.000Z');db.prepare('INSERT INTO messages VALUES(?)').run(id)}
  db.prepare('INSERT INTO chats VALUES(?,?,?,?,?,?)').run('foreign','b','ลูป',0,'ask','2026-10-10');db.prepare('INSERT INTO messages VALUES(?)').run('foreign');
  db.prepare('INSERT INTO chats VALUES(?,?,?,?,?,?)').run('empty','a','ลูป',0,'ask','2026-10-10');
  let cursor='',ids=[];do{const p=listChats(db,'a',{cursor});ids.push(...p.chats.map(c=>c.id));cursor=p.nextCursor}while(cursor);
  assert.equal(ids.length,67);assert.equal(new Set(ids).size,67);assert.equal(ids[0],'066');assert.equal(ids.at(-1),'000');
  assert.equal(listChats(db,'a',{query:'%'}).chats.length,1);assert.equal(listChats(db,'a',{query:'PRINTF'}).chats[0].id,'000');
  assert.equal(listChats(db,'b').chats[0].id,'foreign');assert.throws(()=>listChats(db,'a',{cursor:'invalid'}),{status:400});
 }finally{db.close()}
});
