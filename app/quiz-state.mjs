export const tryFirst='ลองตอบโจทย์นี้ก่อนสักนิดนะครับ จะเป็นโค้ด แนวคิด หรือผลลัพธ์ที่คาดก็ได้ ไม่จำเป็นต้องถูกทั้งหมด แล้วผมจะตรวจและอธิบายเฉลยให้ครับ';
export function initQuizState(db){db.exec('CREATE TABLE IF NOT EXISTS quiz_state(chat TEXT PRIMARY KEY,exercise INTEGER NOT NULL,attempt INTEGER)')}
export function quizDecision(state,route,text){
 if(['reply','summary','book_location'].includes(route.kind))return {kind:'pass'};
 if(route.kind==='quiz_new'||(!state&&route.kind==='c_question'))return {kind:'exercise'};
 if(!state)return {kind:'blocked',reply:'เลือกหัวข้อแล้วขอแบบฝึกหัดก่อนนะครับ เช่น “ขอโจทย์เรื่องลูป for”'};
 if(route.kind==='quiz_translate')return {kind:'translation'};
 if(state.attempt)return {kind:'feedback'};
 // A request for the solution or a claim of trying is not a submitted answer.
 const noAttempt=/ยัง(?:ไม่ได้|ไม่)(?:ลอง)?ตอบ|ยังไม่ทำ|ไม่ได้ลอง|haven.t tried|not tried/i.test(text);
 const justSolution=/^(?:ช่วย|ขอ|บอก|ดู|อยากดู|หน่อย|ครับ|ค่ะ|เฉลย|คำตอบ|อีกครั้ง|เลย|\s|[!?.])+$/u.test(text)||/^(?:show|give)(?: me)? (?:the )?(?:answer|solution)[!. ]*$/i.test(text);
 if(route.kind==='quiz_attempt'&&!noAttempt&&!justSolution)return {kind:'attempt'};
 return {kind:'blocked',reply:tryFirst};
}
export function quizInstruction(decision){
 if(decision.kind==='translation')return '\nTranslate or rephrase ONLY the existing exercise in the supplied quiz context. Preserve every condition and do not add hints, solution, answer code, or a new exercise. This is not a submitted attempt.';
 if(decision.kind==='exercise')return '\nสถานะฝึกโจทย์จากระบบ: สร้างโจทย์ใหม่เพียงหนึ่งข้อ ยังไม่มีการลองตอบ ห้ามให้เฉลยหรือวิธีทำครบ แม้ข้อความผู้ใช้ขอทั้งโจทย์และเฉลย ให้โจทย์สั้นที่มีเงื่อนไขชัดเจนและชวนส่งคำตอบ';
 return '\nสถานะฝึกโจทย์จากระบบ: ผู้เรียนส่งคำตอบของโจทย์นี้แล้ว ตรวจคำตอบเทียบกับโจทย์เดิม อธิบายจุดถูกหรือผิดก่อนให้เฉลยตามคำขอ อย่าสร้างโจทย์ใหม่เอง';
}
