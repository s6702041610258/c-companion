const greeting='สวัสดีครับ 👋 ยินดีต้อนรับสู่ C Companion ถามเรื่องภาษา C จากหนังสือได้เลย เช่น ตัวแปร ลูป หรือพอยน์เตอร์ อยากเริ่มเรื่องไหนครับ?';
const introduction='ผมคือ C Companion เพื่อนติวภาษา C จากหนังสือที่แนบมา ช่วยอธิบายแนวคิดทีละขั้น ยกตัวอย่างโค้ด ฝึกโจทย์ และชี้หน้าหนังสือที่ใช้ตอบได้ครับ ลองถามว่า “พอยน์เตอร์คืออะไร” หรือเลือกบทเรียนที่สนใจได้เลย';

export function socialReply(text){
 const normalized=text.normalize('NFC')
  .replace(/&(?:#x20|#32|nbsp);?/gi,' ')
  .replace(/[\u200b-\u200d\ufeff]/g,'')
  .trim()
  .replace(/[\s!?.…\p{Extended_Pictographic}]+$/gu,'')
  .trim()
  .toLowerCase();
 if(/^(?:สวัสดี|หวัดดี|ฮัลโหล)(?:ครับ|ค่ะ|คะ|จ้า|จ๊ะ|นะครับ)?$|^(?:hello|hi|hey|ทักทาย)$|^ดี(?:ครับ|ค่ะ|คะ)$/.test(normalized))return greeting;
 if(/^(?:คุณคือใคร|บอทคือใคร|c companion คืออะไร)$/.test(normalized))return introduction;
 if(/^(?:(?:คุณ|เธอ|บอท|แชทบอท|เเชทบอท|chatbot|c companion)[\s\S]{0,65})?(?:ทำอะไรได้บ้าง|ทำไรได้บ้าง|ช่วยอะไรได้บ้าง)$/.test(normalized))return introduction;
 if(/^(?:คุณ|บอท|แชทบอท|เเชทบอท|chatbot|c companion)[\s\S]{0,50}เกี่ยวกับอะไร$/.test(normalized))return introduction;
 return null;
}
