// Normalize only a copy for routing; the learner's original text is preserved.
export function normalizeIntentText(text){
 return text.normalize('NFC').replace(/&(?:#x20|#32|nbsp);?/gi,' ')
  .replace(/[\u200b-\u200d\ufeff]/g,'').replace(/เเ/g,'แ')
  .replace(/พาสา|ภาสา/g,'ภาษา').replace(/บ้าว/g,'บ้าง')
  .replace(/^[\s"'“”‘’«»]+|[\s"'“”‘’«»!?.…\p{Extended_Pictographic}]+$/gu,'').trim().toLowerCase()
  .replace(/(?:นะครับ|นะคะ|ครับ|ค่ะ|คะ|ค้าบ|จ้า|จ๊ะ)\s*$/u,'').trim()
  .replace(/^(?:คุณ\s+)+คุณ/,'คุณ');
}

export function isConversationSummary(text){
 const s=normalizeIntentText(text);
 // A summary of a named C topic still belongs to book retrieval.
 return /สรุป|ทบทวน|สรุบ|summari[sz]e|recap/i.test(s)
  && /บทสนทนา|(?:คุย|พูด|ถาม|เรียน)(?:.*)(?:กัน|ไป|มา|ก่อนหน้า)|ตั้งแต่(?:เริ่ม|ต้น)(?:แช[ทต]|คุย|สนทนา)|conversation|(?:our|this)\s+chat/i.test(s);
}
