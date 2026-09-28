import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {initLanguages,getLanguage,setLanguage,validateLanguage,languagePolicy,localize} from './language.mjs';
import {parseIntent,routeConversation} from './conversation-router.mjs';
test('language preference is additive and old positional chat writes still work',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE chats(id TEXT PRIMARY KEY,owner TEXT,title TEXT,chapter INTEGER,mode TEXT,created TEXT)');initLanguages(db);initLanguages(db);
 db.prepare('INSERT INTO chats VALUES(?,?,?,?,?,?)').run('old','owner','title',0,'ask','now');
 assert.equal(getLanguage(db,'old'),'th');setLanguage(db,'old','en');assert.equal(getLanguage(db,'old'),'en');assert.equal(getLanguage(db,'new'),'th');
 for(const value of ['auto','fr',null,{},'EN'])assert.throws(()=>validateLanguage(value));db.close();
});
test('validated once and persistent language directives keep answer language separate from preference',async()=>{
 for(const scope of ['once','chat']){
 const r=await routeConversation({text:'ตอบอังกฤษนะ',replyLanguage:'th',complete:async payload=>{assert.equal(payload.replyLanguage,'th');return JSON.stringify({kind:'capabilities',confidence:'high',query:'',reply:'I can answer in English.',language:{target:'en',scope}})}});
 assert.equal(r.replyLanguage,'en');assert.equal(r.preferredLanguage,scope==='chat'?'en':'th');
 }
 assert.throws(()=>parseIntent(JSON.stringify({kind:'capabilities',confidence:'high',query:'',reply:'Hello',language:{target:'fr',scope:'chat'}})));
});
test('English unavailable-model fallback and language policy are usable',async()=>{
 const r=await routeConversation({text:'สวัสดี',replyLanguage:'en'});assert.match(r.reply,/Hello/);assert.doesNotMatch(r.reply,/[ก-๙]/);
 assert.match(languagePolicy('en'),/English/);assert.equal(localize('หยุดรอคำตอบแล้ว','en'),'Answer cancelled.');
});
