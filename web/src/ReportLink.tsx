import {Mail} from 'lucide-react';

const recipient='s6702041610258@email.kmutnb.ac.th';
export function ReportLink({answer=false,className,onClick}:{answer?:boolean,className?:string,onClick?:()=>void}){
 const subject=answer?'C Companion — รายงานปัญหาคำตอบ':'C Companion — รายงานปัญหาการใช้งาน';
 const body=answer?'ปัญหาที่พบในคำตอบ:\r\n\r\nคำถามหรือภาพหน้าจอที่ต้องการแนบ (ถ้ามี):\r\n':'ปัญหาที่พบ:\r\n\r\nขั้นตอนที่ทำให้พบปัญหา:\r\n';
 return <a className={className} href={`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} title={`เปิดแอปอีเมลเพื่อส่งถึง ${recipient}`} onClick={onClick}><Mail size={answer?13:17}/>{answer?'รายงานปัญหาคำตอบนี้':'รายงานปัญหา'}</a>;
}
