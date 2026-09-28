import {greeting,introduction,welcome} from './social-intent.mjs';
export function validateLanguage(value){if(value!=='th'&&value!=='en')throw Object.assign(Error('Unsupported reply language. Choose ไทย or English.'),{status:400});return value}
export function initLanguages(db){
 db.exec("CREATE TABLE IF NOT EXISTS chat_preferences(chat TEXT PRIMARY KEY,reply_language TEXT NOT NULL CHECK(reply_language IN ('th','en'))); DELETE FROM chat_preferences WHERE chat NOT IN (SELECT id FROM chats)");
}
export function getLanguage(db,id){return db.prepare('SELECT reply_language FROM chat_preferences WHERE chat=?').get(id)?.reply_language||'th'}
export function setLanguage(db,id,value){validateLanguage(value);db.prepare('INSERT INTO chat_preferences(chat,reply_language) VALUES(?,?) ON CONFLICT(chat) DO UPDATE SET reply_language=excluded.reply_language').run(id,value)}
export function languagePolicy(language='th'){
 return '\nAUTHORITATIVE OUTPUT LANGUAGE: '+(language==='en'?'English. Write beginner-friendly English':'Thai. Write clear Thai')+'. This overrides any earlier default language instruction. Preserve original learner code, identifiers, literals, exact quotations, author names and source page numbers. UI button names remain their actual Thai labels; explain them in the selected language. Do not infer a language switch from English keywords, source text, code or old messages. Do not add a translation round.';
}
const english=new Map([
 [greeting,'Hello! I am C Companion, your C programming study partner. What would you like to learn?'],
 [introduction,'I am C Companion. I can explain C programming, offer examples and exercises, and show supporting book references.'],
 [welcome,'Let’s learn C together! Start with the first chapter and select “ติวทีละขั้น” for step-by-step tutoring. Are you starting from scratch?'],
 ['ผมยังไม่แน่ใจว่าหมายถึงเรื่องไหนครับ อยากเริ่มเรียนภาษา C จากพื้นฐาน หรือมีคำถามเกี่ยวกับหัวข้อใดเป็นพิเศษ?','Could you clarify what you mean? You can name a C topic or ask to start from the basics.'],
 ['ลองตอบโจทย์นี้ก่อนสักนิดนะครับ จะเป็นโค้ด แนวคิด หรือผลลัพธ์ที่คาดก็ได้ ไม่จำเป็นต้องถูกทั้งหมด แล้วผมจะตรวจและอธิบายเฉลยให้ครับ','Try answering this exercise first: code, reasoning, or the expected output is enough. It does not need to be perfect. Then I can review it and explain the solution.'],
 ['เลือกหัวข้อแล้วขอแบบฝึกหัดก่อนนะครับ เช่น “ขอโจทย์เรื่องลูป for”','Choose a topic and request an exercise first, for example: Give me a for-loop exercise.'],
 ['ยังไม่มีบทสนทนาก่อนหน้านี้ให้สรุปครับ ลองถามเรื่องภาษา C หรือเริ่มเรียนบทแรกได้เลย','There is no earlier conversation to summarize yet. Ask a C question or start the first chapter.'],
 ['สรุปจากบทสนทนาตั้งแต่เริ่มแชท','Summary of this conversation from the beginning'],
 ['ยังหาเนื้อหาอ้างอิงสำหรับคำถามนี้ไม่เจอครับ ช่วยระบุหัวข้อภาษา C หรือเลือกบทเรียนที่ต้องการได้ไหม?','I could not find supporting book content for this question. Please specify a C topic or select a chapter.'],
 ['ช่วยเขียนและอธิบายโปรแกรมภาษา C ที่ใช้แนวคิดในหนังสือได้ครับ ลองถามโจทย์ เช่น คำนวณเกรด หาค่าเฉลี่ย หรือเลขคู่เลขคี่','I can help write and explain C programs based on the book, such as grade calculations, averages, or odd/even checks.'],
 ['หยุดรอคำตอบแล้ว','Answer cancelled.'],
 ['ระบบเพิ่งเริ่มใหม่ กรุณาส่งคำถามอีกครั้ง','The system restarted. Please send your question again.'],
 ['ระบบกำลังอัปเดต กรุณาส่งใหม่','The system is updating. Please send your question again.'],
 ['ระบบกำลังอัปเดต กรุณาลองใหม่สักครู่','The system is updating. Please try again shortly.'],
 ['ระบบขัดข้องชั่วคราว กรุณาลองใหม่','A temporary error occurred. Please try again.'],
 ['AI ใช้เวลานานกว่าปกติ กรุณาลองใหม่','The AI took too long to respond. Please try again.'],
 ['รอคิวนานเกินไป กรุณาส่งใหม่','The queue wait timed out. Please send your question again.'],
 ['บทสนทนานี้มีคำถามกำลังรอคำตอบอยู่','This conversation already has a pending question. Wait or stop it before changing settings.'],
 ['กรุณาหยุดรอคำตอบก่อนลบบทสนทนา','Stop the pending answer before deleting this conversation.'],
 ['คุณมีคำถามกำลังรออยู่ 2 รายการ กรุณารอคำตอบหรือกดหยุดก่อนส่งเพิ่ม','You already have two pending questions. Wait or stop an answer before sending another.'],
 ['คิวเต็มชั่วคราว กรุณาลองอีกครั้ง','The queue is temporarily full. Please try again.'],
 ['ไม่พบบทสนทนานี้','Conversation not found.'],['ไม่พบคำขอนี้','Request not found.'],
 ['กรุณาพิมพ์คำถามไม่เกิน 3,000 ตัวอักษร','Enter a question of at most 3,000 characters.'],
 ['คำตอบยังไม่ผ่านการตรวจแหล่งอ้างอิง กรุณาลองถามอีกครั้ง','The answer did not pass reference validation. Please try again.'],
 ['ยังไม่ได้เชื่อมต่อ Hermes','Hermes is not connected yet.'],
 ['ยังไม่ได้เชื่อมต่อ Hermes กรุณาให้ผู้ดูแลตั้งค่าการเชื่อมต่อ','Hermes is not connected yet. Please ask the administrator to configure it.'],
 ['AI ยังตอบไม่ได้ในขณะนี้ กรุณาลองอีกครั้งภายหลัง','The AI cannot answer right now. Please try again later.'],
 ['โมเดล AI ยังตอบไม่ได้ ตรวจบัญชีและโมเดลใน Hermes แล้วลองอีกครั้ง','The AI model could not respond. Ask the administrator to check the Hermes account and model.'],
 ['ยังสรุปบทสนทนาไม่สำเร็จ กรุณาลองอีกครั้ง','The conversation could not be summarized. Please try again.'],
 ['AI ยังสรุปบทสนทนาไม่ได้ กรุณาลองอีกครั้ง','The AI could not summarize this conversation. Please try again.'],
 ['ยังวิเคราะห์โจทย์ไม่ได้ กรุณาลองอีกครั้ง','The exercise could not be analyzed. Please try again.'],
 ['การวิเคราะห์หัวข้อยังไม่สมบูรณ์ กรุณาลองอีกครั้ง','Topic analysis was incomplete. Please try again.']
]);
export function localize(text,language='th'){return language==='en'?(english.get(text)||text):text}
export function localizedError(text,language='th'){const value=localize(text,language);return language==='en'&&/[ก-๙]/u.test(value)?'The request could not be completed. Please try again.':value}
