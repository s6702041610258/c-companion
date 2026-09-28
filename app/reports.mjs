import {randomUUID} from 'node:crypto';
export const categories=['answer','search','reference','website','other'];
export function initReports(db){db.exec("CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,owner TEXT NOT NULL,request_key TEXT NOT NULL,category TEXT NOT NULL,detail TEXT NOT NULL,context TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created TEXT NOT NULL,UNIQUE(owner,request_key));");}
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function createReport(db,owner,b){
 if(!b||typeof b!=='object'||!categories.includes(b.category)||typeof b.detail!=='string'||b.detail.trim().length<5||b.detail.length>2000||typeof b.requestKey!=='string'||!/^[-a-f0-9]{36}$/.test(b.requestKey))throw fail(400,'กรุณาเลือกประเภทและอธิบายปัญหา 5–2,000 ตัวอักษร');
 const existing=db.prepare('SELECT id FROM reports WHERE owner=? AND request_key=?').get(owner,b.requestKey);
 if(existing)return {id:existing.id};
 let context={};
 if(b.messageId!==undefined&&b.messageId!==null){
  if(!Number.isSafeInteger(b.messageId)||typeof b.chatId!=='string')throw fail(400,'ข้อมูลอ้างอิงไม่ถูกต้อง');
  const chat=db.prepare('SELECT id,chapter,mode FROM chats WHERE id=? AND owner=?').get(b.chatId,owner);
  if(!chat)throw fail(404,'ไม่พบบทสนทนานี้');
  const message=db.prepare("SELECT id,content,sources FROM messages WHERE id=? AND chat=? AND role='assistant'").get(b.messageId,chat.id);
  if(!message)throw fail(404,'ไม่พบคำตอบนี้');
  const question=db.prepare("SELECT content FROM messages WHERE chat=? AND id<? AND role='user' ORDER BY id DESC LIMIT 1").get(chat.id,message.id);
  context={chapter:chat.chapter,mode:chat.mode,question:question?.content||'',answer:message.content,sources:JSON.parse(message.sources||'[]')};
 }
 const id=randomUUID();
 db.prepare('INSERT INTO reports(id,owner,request_key,category,detail,context,created) VALUES(?,?,?,?,?,?,?)').run(id,owner,b.requestKey,b.category,b.detail.trim(),JSON.stringify(context),new Date().toISOString());
 return {id};
}
