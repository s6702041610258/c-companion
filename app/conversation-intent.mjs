// Normalize only a copy for routing; the learner's original text is preserved.
export function normalizeIntentText(text){
 return text.normalize('NFC').replace(/&(?:#x20|#32|nbsp);?/gi,' ')
  .replace(/[\u200b-\u200d\ufeff]/g,'').replace(/เเ/g,'แ')
  .replace(/พาสา|ภาสา/g,'ภาษา').replace(/บ้าว/g,'บ้าง')
  .replace(/^[\s"'“”‘’«»]+|[\s"'“”‘’«»!?.…\p{Extended_Pictographic}]+$/gu,'').trim().toLowerCase()
  .replace(/(?:นะครับ|นะคะ|ครับ|ค่ะ|คะ|ค้าบ|จ้า|จ๊ะ)\s*$/u,'').trim()
  .replace(/^(?:คุณ\s+)+คุณ/,'คุณ');
}

export function declinesSummary(text){
 return /(?:ไม่(?:ต้อง|เอา|อยาก|ขอ)|อย่า(?:เพิ่ง)?|ห้าม)\s*(?:เพิ่ง|ช่วย)?\s*(?:สรุป|ทบทวน|สรุบ)|(?:do\s+not|don't|don’t|never)\s+(?:summari[sz]e|recap)/i.test(text);
}
export function isConversationSummary(text){
 if(declinesSummary(text)||/["'“”‘’]|คำว่า|หมายถึง|แปลว่า/.test(text))return false;
 const s=normalizeIntentText(text);
 // A summary of a named C topic still belongs to book retrieval.
 return /สรุป|ทบทวน|สรุบ|summari[sz]e|recap/i.test(s)
  && /บทสนทนา|(?:คุย|พูด|ถาม|เรียน)(?:.*)(?:กัน|ไป|มา|ก่อนหน้า)|ตั้งแต่(?:เริ่ม|ต้น)(?:แช[ทต]|คุย|สนทนา)|conversation|(?:our|this)\s+chat/i.test(s);
}
