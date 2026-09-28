export function isOverview(query){return /มีอะไรบ้าง|มีชนิดไหน|กี่ชนิด|กี่ประเภท|ชนิดข้อมูล|ประเภทข้อมูล|ประเภทของ|สรุป.*(ชนิด|ประเภท|ทั้งหมด)|\b(data[- ]?types?|datatypes?|types|kinds|overview)\b/i.test(query)}
export function overviewContexts(pages,query,refs,chapter=0){
 if(!isOverview(query)||!refs.length)return refs;
 const result=[];const add=p=>{if(p&&(!chapter||p.chapter===chapter)&&!result.some(r=>r.page===p.page))result.push(p)};
 // Include the continuation of the strongest sections: tables frequently follow the definition.
 for(const p of refs.slice(0,2)){
  add(p);
  const next=pages.find(r=>r.page===p.page+1&&r.chapter===p.chapter);
  const prev=pages.find(r=>r.page===p.page-1&&r.chapter===p.chapter);
  add(next);add(prev);
 }
 for(const p of refs)add(p);
 return result.slice(0,8);
}
export function overviewPolicy(query,refs){
 let policy='';
 if(isOverview(query))policy+='\\nคำถามภาพรวม: อธิบายว่ากำลังแบ่งตามเกณฑ์ใด เช่น ชนิดข้อมูลของตัวแปร ไม่ใช่ชื่อตัวแปร ตรวจตารางและหน้าต่อเนื่องที่แนบแล้วสรุปรายการสำคัญให้ครบตามหลักฐาน จัดเป็นกลุ่มและ bullet list พร้อมความหมายสั้น ไม่สรุปจากตัวอย่างเพียงสองรายการ ไม่อ้างว่าเป็นรายการทั้งหมดของภาษา C ถ้าครอบคลุมแค่หนังสือ ยกตัวอย่างประกาศตัวแปรที่ใช้บ่อย ไม่จำเป็นต้องแสดงทุกชนิดในโค้ด คำถามมีอะไรบ้างต้องได้รับรายการ ไม่ตอบเพียงนิยามหรือถามกลับแทน';
 if(refs.some(p=>p.page===15))policy+='\\nหมายเหตุบรรณาธิการที่ตรวจสอบแล้ว แยกจากต้นฉบับหน้า15: ตารางขนาดไบต์ในหนังสือไม่ใช่ค่าที่ใช้ได้ทุกระบบ โดยเฉพาะ long long ที่ตารางระบุ4ไม่ควรสอนเป็นค่าตายตัว ขนาดและช่วงขึ้นกับ implementation ภายใต้ขั้นต่ำของมาตรฐาน ใช้ sizeof กับระบบจริงเมื่อต้องการขนาด char มี sizeof เท่ากับ1 แต่ plain char อาจ signed หรือ unsigned ตาม implementation; long double มีความแม่นยำอย่างน้อยเท่ากับ double แต่อาจเท่ากันได้ ไม่รับประกันว่ามากกว่าบนทุกระบบ; unsigned เก็บค่าศูนย์และบวก ใช้กับชนิดจำนวนเต็ม ไม่ใช่ float/double ถ้าไม่ถามขนาดไม่ต้องแจกแจงตัวเลขขนาด ให้หมายเหตุสั้นว่าขนาดขึ้นกับระบบ หากกล่าวถึงหมายเหตุนี้อย่าอ้างว่าเป็นข้อความที่ถูกต้องในหนังสือ แหล่งตรวจสอบเพิ่มเติม WG14 C11 N1570 sections 5.2.4.2.1,6.2.5,6.5.3.4 https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf';
 return policy;
}
