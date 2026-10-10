'use client';
import {useState} from 'react';
import {BookOpen,MessageCircle,GraduationCap,Target,ArrowUp,Check,ChevronRight} from 'lucide-react';
import {DragonMark} from './DragonMark';
const examples=[
 {label:'ถามคำถาม',icon:MessageCircle,prompt:'if กับ else อยู่บทไหนครับ?',reply:<>อยู่ใน <strong>บทที่ 4 เรื่องการตัดสินใจ</strong> หนังสือหน้า 32–42 ครับ เริ่มจาก <code>if</code> สำหรับตรวจเงื่อนไข แล้วใช้ <code>else</code> เมื่อเงื่อนไขไม่เป็นจริง</>,code:null,foot:'ตอบให้ตรงกับสิ่งที่ถาม แล้วค่อยเรียนต่อ',reference:'บทที่ 4 · หน้า 32–42',page:37},
 {label:'ติวทีละขั้น',icon:GraduationCap,prompt:'ช่วยสอนลูป for แบบเริ่มจากศูนย์หน่อย',reply:<>ลองเริ่มจากการนับ 1 ถึง 3 ครับ ลูปนี้กำหนดค่าเริ่มต้น ตรวจเงื่อนไข และเพิ่มค่าทีละ 1<br/><br/><strong>ลองคิดดู: ถ้าเปลี่ยนเป็น i &lt; 3 จะพิมพ์กี่ครั้ง?</strong></>,code:'for (int i = 1; i <= 3; i++) {\n    printf("%d\\n", i);\n}',foot:'ค่อย ๆ เข้าใจเหตุผลของแต่ละบรรทัด',reference:'บทที่ 5 · หน้า 43–49',page:48},
 {label:'ฝึกทำโจทย์',icon:Target,prompt:'ขอโจทย์ฝึกเรื่องเงื่อนไขหนึ่งข้อครับ',reply:<>ลองเขียนโปรแกรมรับคะแนน 0–100 แล้วแสดง <code>Pass</code> เมื่อคะแนนตั้งแต่ 50 ขึ้นไป และ <code>Try again</code> เมื่อคะแนนต่ำกว่า 50<br/><br/><strong>ส่งโค้ดที่ลองเขียนมาได้เลย แล้วเรามาตรวจด้วยกัน</strong></>,code:null,foot:'ลองตอบก่อน รับคำแนะนำ แล้วจึงทบทวนเฉลย',reference:'บทที่ 4 · หน้า 32–42',page:37}
];
export function Demo(){
 const [selected,setSelected]=useState(0);const example=examples[selected];
 return <div className="demo-shell">
  <div className="demo-bar"><span><i/><i/><i/></span><span>C Companion / ห้องติว</span><span className="demo-badge">ตัวอย่างการสนทนา</span></div>
  <div className="demo-layout"><div className="demo-sidebar"><span className="demo-brand"><DragonMark/>C Companion</span><p>อยากเรียนแบบไหน?</p><div role="tablist" aria-label="ตัวอย่างโหมดการเรียน">{examples.map((e,i)=><button key={e.label} id={'demo-tab-'+i} role="tab" aria-selected={selected===i} aria-controls="demo-panel" tabIndex={selected===i?0:-1} onClick={()=>setSelected(i)} onKeyDown={event=>{let next=i;if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%3;else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;event.preventDefault();setSelected(next);document.getElementById('demo-tab-'+next)?.focus()}}><e.icon size={18}/>{e.label}<ChevronRight size={15}/></button>)}</div><div className="demo-sidebar-bottom"><BookOpen size={18}/><span>เรียนจากหนังสือ<br/><b>12 บทภาษา C</b></span></div></div>
   <div className="demo-conversation" id="demo-panel" role="tabpanel" aria-labelledby={'demo-tab-'+selected} tabIndex={0}>
    <div className="demo-user">{example.prompt}</div>
    <div className="demo-answer"><div className="demo-avatar"><DragonMark/></div><div><strong className="demo-author">C Companion</strong><p>{example.reply}</p>{example.code&&<pre><span>C</span><code>{example.code}</code></pre>}<a href={'/book.pdf#page='+example.page} target="_blank" rel="noreferrer"><BookOpen size={14}/>{example.reference}</a></div></div>
    <div className="demo-composer"><span>มีคำถามของคุณเองแล้ว?</span><a href="/chat/" aria-label="ไปห้องแชทเพื่อถามคำถาม"><ArrowUp size={20}/></a></div>
    <p className="demo-foot"><Check size={14}/>{example.foot}</p>
   </div>
  </div>
 </div>;
}
