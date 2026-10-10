import type {Metadata,Viewport} from 'next';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/noto-sans-thai/700.css';
import './globals.css';
export const metadata:Metadata={icons:{icon:'/welcome/icon.svg'},title:'C Companion — เปลี่ยนคำถาม ให้เป็นความเข้าใจ',description:'เพื่อนติวภาษา C บนเว็บ ถามคำถาม เรียนทีละขั้น และฝึกทำโจทย์ พร้อมเปิดอ่านแหล่งอ้างอิงจากหนังสือ 12 บท ใช้บนเว็บหรือติดตั้งเองได้'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#070d12'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="th"><body><noscript><style>{`.motion-control{display:none}`}</style></noscript>{children}</body></html>}
