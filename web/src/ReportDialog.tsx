import {useRef,useState} from 'react';
import {Check,Flag,LoaderCircle,X} from 'lucide-react';
export type ReportTarget={chatId?:string,messageId?:number,question?:string};
export function ReportDialog({target,onClose,onSubmit}:{target:ReportTarget,onClose:()=>void,onSubmit:(data:unknown)=>Promise<{id:string}>}){
 const [category,setCategory]=useState(target.messageId?'answer':'website'),[detail,setDetail]=useState(''),[attach,setAttach]=useState(!!target.messageId),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');
 const requestKey=useRef(crypto.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)}));
 return <div className="modal-overlay"><section className="report-modal modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
 <header><h2 id="report-title"><Flag size={20}/> รายงานปัญหา</h2><button className="icon-button" aria-label="ปิดรายงานปัญหา" onClick={onClose}><X size={20}/></button></header>
 {receipt?<div className="report-success" role="status"><Check size={30}/><h3>บันทึกรายงานแล้ว</h3><p>ผู้ดูแลสามารถตรวจสอบปัญหานี้ได้จากระบบ</p><p>เลขรายงาน</p><code>{receipt}</code><p>ขณะนี้ยังไม่มีการแจ้งผลกลับอัตโนมัติ</p><button className="primary-button" onClick={onClose}>กลับไปเรียนต่อ</button></div>:
 <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{const result=await onSubmit({requestKey:requestKey.current,category,detail,...(attach?{chatId:target.chatId,messageId:target.messageId}:{})});setReceipt(result.id)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
 <p>บอกสิ่งที่พบ เพื่อช่วยให้เราปรับปรุงห้องเรียนนี้</p>
 <label htmlFor="report-category">ปัญหาเกี่ยวกับอะไร?</label><select id="report-category" value={category} disabled={busy} onChange={e=>setCategory(e.target.value)}><option value="answer">คำตอบไม่ถูกต้องหรือไม่ครบ</option><option value="search">ค้นหาไม่พบ / ไม่เข้าใจคำถาม</option><option value="reference">แหล่งอ้างอิงไม่ตรง</option><option value="website">หน้าเว็บหรือปุ่มใช้งานไม่ได้</option><option value="other">อื่น ๆ</option></select>
 <label htmlFor="report-detail">รายละเอียดที่พบ</label><textarea id="report-detail" required minLength={5} maxLength={2000} rows={4} disabled={busy} value={detail} onChange={e=>setDetail(e.target.value)} placeholder="เช่น พิมพ์ว่าพ้อยเตอร์แล้วค้นหาไม่พบ แต่พอยน์เตอร์ค้นหาได้"/><small>{detail.length} / 2,000 ตัวอักษร</small>
 {target.messageId&&<label className="report-attachment"><input type="checkbox" checked={attach} disabled={busy} onChange={e=>setAttach(e.target.checked)}/><span>แนบคำถาม คำตอบ และแหล่งอ้างอิงนี้<small>{target.question}</small></span></label>}
 <p className="report-privacy">รายงานส่งให้ผู้ดูแลเว็บและเก็บแยกจากประวัติแชท กรุณาอย่าใส่รหัสผ่านหรือข้อมูลส่วนตัว</p>
 {error&&<p role="alert" className="report-error">{error}</p>}
 <button className="primary-button" disabled={busy||detail.trim().length<5} type="submit">{busy?<><LoaderCircle size={17} className="spin"/> กำลังส่ง…</>:<>ส่งรายงาน <Flag size={16}/></>}</button>
 </form>}</section></div>;
}
