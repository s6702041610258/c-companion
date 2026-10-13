import {useEffect,useState} from 'react';
import {BookOpen,RefreshCw,X} from 'lucide-react';
export function SettingsPanel({base,onClose}:{base:string,onClose:()=>void}){
 const [status,setStatus]=useState('checking'),[checkedAt,setCheckedAt]=useState<string|null>(null),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setStatus('checking');setCheckedAt(null);
  fetch(base+'api/connection',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();setStatus(data.status);setCheckedAt(data.checkedAt)}).catch(()=>{if(!controller.signal.aborted)setStatus('unavailable')});
  return()=>controller.abort();
 },[base,retry]);
 const labels:Record<string,string>={checking:'กำลังตรวจการเชื่อมต่อ…',reachable:'เชื่อมต่อบริการ AI ได้',unconfigured:'ยังไม่ได้ตั้งค่าบริการ AI',unavailable:'ยังเชื่อมต่อบริการ AI ไม่สำเร็จ'};
 return <div className="modal-overlay" onClick={onClose}><section className="settings modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e=>e.stopPropagation()}>
  <header><div><span className="modal-kicker">C Companion · 1.15.0</span><h2 id="settings-title">การใช้งานและคู่มือ</h2></div><button className="icon-button" aria-label="ปิดการใช้งานและคู่มือ" onClick={onClose}><X size={20}/></button></header><p className="language-help">พิมพ์ “ตอบเป็นอังกฤษ” หรือ “ตอบเป็นไทย” เพื่อเปลี่ยนภาษาคำตอบ</p>
  <div className={'connection-card '+status}><h3>การเชื่อมต่อ AI</h3><p role="status">{labels[status]||labels.unavailable}</p><p className="settings-detail">ตรวจการเข้าถึงบริการเท่านั้น การตอบคำถามยังขึ้นอยู่กับโมเดลและสิทธิ์ของบัญชีที่ตั้งไว้</p>{checkedAt&&<small>ตรวจเมื่อ {new Date(checkedAt).toLocaleTimeString('th-TH')} · ใช้ผลตรวจเดิมได้ไม่เกิน 30 วินาที</small>}<button disabled={status==='checking'} onClick={()=>setRetry(v=>v+1)}><RefreshCw size={15}/>ตรวจอีกครั้ง</button></div>
  <h3>ใช้งานผ่านเว็บหรือติดตั้งบนเครื่อง</h3><p>ใช้งานได้โดยไม่ต้องสมัครสมาชิก ระบบบันทึกประวัติบนเครื่องที่ให้บริการ และแยกการเข้าถึงตามเบราว์เซอร์ที่ใช้ ไม่มีการเชื่อมประวัติข้ามเครื่องอัตโนมัติ การล้างคุกกี้หรือเปลี่ยนเบราว์เซอร์อาจทำให้เข้าไม่ถึงประวัติเดิม หากติดตั้งเอง ประวัติจะอยู่บนเครื่องที่ติดตั้ง ส่วนการส่งคำถามไปยัง AI ขึ้นอยู่กับบริการที่ตั้งค่าไว้</p>
  <a className="landing-link" href={base+'welcome/'}>ดูข้อมูลระบบและตัวอย่างการใช้งาน</a>
  <a className="manual-link" href={base+'manual.pdf'} target="_blank" rel="noreferrer"><BookOpen size={18}/><span>เปิดคู่มือการใช้งานและติดตั้ง<small>PDF · เปิดอ่านหรือดาวน์โหลดได้</small></span></a>
 </section></div>;
}
