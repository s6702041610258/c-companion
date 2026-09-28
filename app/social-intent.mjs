export const greeting='สวัสดีครับ 👋 ยินดีต้อนรับสู่ C Companion ถามเรื่องภาษา C จากหนังสือได้เลย เช่น ตัวแปร ลูป หรือพอยน์เตอร์ อยากเริ่มเรื่องไหนครับ?';
export const introduction='ผมคือ C Companion เพื่อนติวภาษา C จากหนังสือที่แนบมา ช่วยอธิบายแนวคิดทีละขั้น ยกตัวอย่างโค้ด ฝึกโจทย์ และชี้หน้าหนังสือที่ใช้ตอบได้ครับ ลองถามว่า “พอยน์เตอร์คืออะไร” หรือเลือกบทเรียนที่สนใจได้เลย';

import {normalizeIntentText} from './conversation-intent.mjs';
export const welcome='มาเริ่มเรียนภาษา C ด้วยกันครับ 👋 ถ้ายังไม่มีพื้นฐาน แนะนำเลือกบทเรียนแรก แล้วใช้โหมด “ติวทีละขั้น” ได้เลย หรือพิมพ์ว่า “ภาษา C คืออะไร” เพื่อเริ่มจากพื้นฐาน อยากเริ่มจากศูนย์หรือมีหัวข้อที่สนใจอยู่แล้วครับ?';

export function socialReply(text){
 const normalized=normalizeIntentText(text);
 if(/^(?:สวัสดี|หวัดดี|ฮัลโหล|ดี|hello|hi|hey|ทักทาย)$/.test(normalized))return greeting;
 if(/^(?:คุณคือใคร|บอทคือใคร|c companion คืออะไร|(?:ช่วย)?แนะนำตัว(?:เอง)?(?:หน่อย)?)$/.test(normalized))return introduction;
 const bot='(?:(?:คุณ|เธอ|บอท|แชทบอท|chatbot|c companion)(?:\\s*นี้)?\\s*)?';
 if(new RegExp('^'+bot+'(?:คือแชทบอทเกี่ยวกับอะไร)?(?:ทำอะไร|ทำไร|ช่วยอะไร)ได้บ้าง$').test(normalized))return introduction;
 if(new RegExp('^'+bot+'(?:คือ)?(?:แชทบอท)?เกี่ยวกับอะไร$').test(normalized))return introduction;
 const compact=normalized.replace(/\s+/g,'');
 if(/^(?:(?:ผม|ฉัน|ชั้น|เรา|หนู)(?:ต้องการ|อยาก)?|(?:ต้องการ|อยาก)|ช่วย)?(?:เริ่ม)?(?:เรียน|สอน)(?:ภาษา)?(?:ซี|c)(?:ตั้งแต่(?:เริ่ม|พื้นฐาน|ศูนย์)|เบื้องต้น|พื้นฐาน|หน่อย|เริ่มยังไง)?$/.test(compact))return welcome;
 return null;
}
