import {localizedError} from './language.mjs';
import {randomUUID} from 'node:crypto';
import {WorkQueue} from './work-queue.mjs';
export function createJobs(db,processMessage,{concurrency=2,capacity=100,queueTimeout=300000,answerTimeout=100000,ownerCapacity=2}={}){
 db.exec("CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,owner TEXT NOT NULL,chat TEXT NOT NULL,request_key TEXT NOT NULL,status TEXT NOT NULL,result TEXT,error TEXT,created TEXT NOT NULL,updated TEXT NOT NULL,UNIQUE(owner,request_key)); CREATE INDEX IF NOT EXISTS jobs_chat_status ON jobs(chat,status); CREATE INDEX IF NOT EXISTS jobs_owner_status ON jobs(owner,status);");
 db.exec("CREATE TABLE IF NOT EXISTS job_languages(job TEXT PRIMARY KEY,language TEXT NOT NULL); DELETE FROM job_languages WHERE job NOT IN (SELECT id FROM jobs)");
 db.prepare("UPDATE jobs SET status='failed',error=?,updated=? WHERE status IN ('queued','running')").run('ระบบเพิ่งเริ่มใหม่ กรุณาส่งคำถามอีกครั้ง',new Date().toISOString());
 const queue=new WorkQueue({concurrency,capacity}),controllers=new Map();let stopping=false;
 const busy=chat=>!!db.prepare("SELECT id FROM jobs WHERE chat=? AND status IN ('queued','running')").get(chat);
 const fail=(status,message)=>Object.assign(new Error(message),{status});
 function get(id,owner){const j=db.prepare('SELECT id,status,result,error FROM jobs WHERE id=? AND owner=?').get(id,owner);if(!j)throw fail(404,'ไม่พบคำขอนี้');return {...j,error:j.error?localizedError(j.error,db.prepare('SELECT language FROM job_languages WHERE job=?').get(id)?.language):j.error,result:j.result?JSON.parse(j.result):null}}
 function submit(owner,chat,text,requestKey){
  const existing=db.prepare('SELECT id FROM jobs WHERE owner=? AND request_key=?').get(owner,requestKey);
  if(existing){const original=db.prepare('SELECT chat FROM jobs WHERE id=?').get(existing.id);if(original.chat!==chat.id)throw fail(409,'รหัสคำขอนี้ใช้กับบทสนทนาอื่นแล้ว');return get(existing.id,owner);}
  if(stopping)throw fail(503,'ระบบกำลังอัปเดต กรุณาลองใหม่สักครู่');
  if(busy(chat.id))throw fail(409,'บทสนทนานี้มีคำถามกำลังรอคำตอบอยู่');
  if(db.prepare("SELECT count(*) n FROM jobs WHERE owner=? AND status IN ('queued','running')").get(owner).n>=ownerCapacity)throw fail(429,'คุณมีคำถามกำลังรออยู่ 2 รายการ กรุณารอคำตอบหรือกดหยุดก่อนส่งเพิ่ม');
  if(queue.waiting.length>=capacity)throw fail(503,'คิวเต็มชั่วคราว กรุณาลองอีกครั้ง');
  const id=randomUUID(),now=new Date().toISOString(),controller=new AbortController();
  let timer=setTimeout(()=>controller.abort(fail(504,'รอคิวนานเกินไป กรุณาส่งใหม่')),queueTimeout);
  db.prepare('INSERT INTO jobs(id,owner,chat,request_key,status,created,updated) VALUES(?,?,?,?,?,?,?)').run(id,owner,chat.id,requestKey,'queued',now,now);
  db.prepare('INSERT INTO job_languages(job,language) VALUES(?,?)').run(id,chat.replyLanguage||'th');
  controllers.set(id,controller);const started=Date.now();
  queue.run(()=>processMessage(chat,text,controller.signal),{signal:controller.signal,onStart:()=>{
   clearTimeout(timer);timer=setTimeout(()=>controller.abort(fail(504,'AI ใช้เวลานานกว่าปกติ กรุณาลองใหม่')),answerTimeout);
   db.prepare("UPDATE jobs SET status='running',updated=? WHERE id=?").run(new Date().toISOString(),id);
  }}).then(result=>{db.prepare("UPDATE jobs SET status='completed',result=?,updated=? WHERE id=?").run(JSON.stringify(result),new Date().toISOString(),id);console.log(JSON.stringify({event:'answer_completed',job:id,durationMs:Date.now()-started}))},error=>{
   const message=controller.signal.aborted?controller.signal.reason.message:(error.status?error.message:'ระบบขัดข้องชั่วคราว กรุณาลองใหม่');
   db.prepare("UPDATE jobs SET status=?,error=?,updated=? WHERE id=?").run(controller.signal.aborted&&controller.signal.reason.status!==504?'cancelled':'failed',localizedError(message,chat.replyLanguage),new Date().toISOString(),id);
   console.error(JSON.stringify({event:'answer_failed',job:id,status:controller.signal.reason?.status||error.status||500,durationMs:Date.now()-started}));
  }).finally(()=>{clearTimeout(timer);controllers.delete(id)});
  return get(id,owner);
 }
 function cancel(id,owner){get(id,owner);controllers.get(id)?.abort(new Error('หยุดรอคำตอบแล้ว'));return get(id,owner)}
 return {get,submit,cancel,busy,queue,shutdown(){stopping=true;for(const c of controllers.values())c.abort(new Error('ระบบกำลังอัปเดต กรุณาส่งใหม่'))},get pending(){return controllers.size}};
}
