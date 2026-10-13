import type {Metadata,Viewport} from 'next';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/noto-sans-thai/700.css';
import './globals.css';
import './immersive.css';
export const metadata:Metadata={icons:{icon:'/welcome/icon.svg'},title:'C Companion — แชทบอทช่วยเรียนภาษาซี',description:'แชทบอทช่วยเรียนการเขียนโปรแกรมภาษาซี สอบถามเนื้อหา เรียนรู้ทีละขั้นตอน และฝึกทำโจทย์ โดยใช้เนื้อหาจากหนังสือ 12 บทประกอบการตอบ ใช้งานผ่านเว็บหรือติดตั้งบนเครื่องได้'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#090d14'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body><noscript><style>{`.motion-control,.mode-controls{display:none}.mode-track{display:grid;overflow:visible}.mode-card{min-width:0}`}</style></noscript>{children}</body></html>}
