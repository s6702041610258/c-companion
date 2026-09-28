import {normalizeQuery} from './query-normalization.mjs';
import {chapters} from './curriculum.mjs';
const dictionary=[
['โครงสร้างโปรแกรม','program main compilation'],['โครงสร้างของโปรแกรม','program main compilation'],['ไฟล์ต้นฉบับ','source compilation linking'],['คอมไพเลอร์','compiler compilation'],['แปลภาษา','compiler compilation'],['ลิงก์','linking linker'],
['ตัวแปร','variable identifier assignment'],['ชนิดข้อมูล','type int float double char'],['จำนวนเต็ม','int integer'],['ทศนิยม','float double precision'],
['แสดงผล','printf output'],['พิมพ์','printf output'],['รับค่า','scanf input'],['รับข้อมูล','scanf input'],['ลูป','loop for while iteration'],['วนซ้ำ','loop for while iteration'],['ทำซ้ำ','loop for while iteration'],
['เงื่อนไข','if else switch condition selection'],['อาร์เรย์','array index'],['อาเรย์','array index'],['พอยน์เตอร์','pointer address indirection'],['พอยเตอร์','pointer address'],
['สตริง','string char'],['ข้อความ','string'],['ฟังก์ชัน','function parameter return'],['ฟังชัน','function'],['ไฟล์','file stream fopen'],['โครงสร้าง','struct structure'],['ผังงาน','flowchart'],['คอมไพล','compiler compilation'],['หน่วยความจำ','memory address pointer'],['ตัวดำเนินการ','operator'],['โปรเจกต์','project header'],['ค่าคงที่','constant macro'],['ภาษา','language'],['พารามิเตอร์','parameter argument'],['คืนค่า','return function'],['ตำแหน่ง','address index'],['บวก','addition operator'],['ลบ','subtraction operator'],['หาร','division operator'],['คูณ','multiplication operator']
];
export function terms(query){
 let s=normalizeQuery(query).toLowerCase();
 const matched=dictionary.filter(([th])=>s.includes(th)&&!(th==='โครงสร้าง'&&/โครงสร้าง(?:ของ)?โปรแกรม/.test(s)&&!/\bstruct\b/i.test(s)));
 for(const [th,en] of matched)if(th!=='ภาษา'||matched.length===1)s+=' '+en;
 return [...new Set(s.match(/[a-z_][a-z_0-9]*/g)||[])].filter(x=>!['the','what','how','is','a','an','c','me','please','explain','data','types','datatype','datatypes'].includes(x));
}
function pageAnchors(query,needles){
 const hints=[];
 const add=page=>{if(!hints.includes(page))hints.push(page)};
 if(needles.length)for(const match of query.matchAll(/หน้า\s*(\d{1,3})/g))add(Number(match[1]));
 if(/\b(?:int|short|long|char|float|double)\s+[a-z_]\w*\s*\[\s*\d+\s*\]|(?:อาร์เรย์|อาเรย์|array)[^\n]*\[[^\]]+\]/i.test(query))add(51);
 if(/\b(?:argc|argv)\b/i.test(query)){add(85);add(86)}
 // A named for loop is more specific than generic loop/printf vocabulary.
 if(/\bfor\s*\(|(?:ลูป|คำสั่ง|loop|statement|iteration)\s*for\b|\bfor\s+(?:loop|statement|iteration)\b/i.test(query))add(46);
 if(/(?:sizeof\s*\(|ขนาด|ไบต์|\bbytes?\b)/i.test(query)&&/\b(?:int|short|long|char|float|double)\b/i.test(query))add(15);
 if(/\bint\b/i.test(query)&&/\bfloat\b/i.test(query)&&/(?:ต่าง|เปรียบเทียบ|compare|difference)/i.test(query))add(15);
 return hints;
}
export function retrieve(pages, query, chapter=0, history=''){
 const ts=terms(query), prior=terms(history);
 const needles=ts.length?ts:prior;
 const anchors=pageAnchors(query,ts);
 return pages.filter(p=>p.page<=107&&(!chapter||p.chapter===chapter)).map(p=>{
 const content=p.text.toLowerCase();let score=0;for(const t of needles){const re=new RegExp('\\b'+t+'\\b','g');score+=Math.min((content.match(re)||[]).length,8)*(t.length>3?1.4:1);}
 const anchor=anchors.indexOf(p.page);if(anchor>=0)score+=80-anchor;
 if(chapter)score+=0.5;
 return {...p,score};
 }).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
}
export function contexts(pages){return pages.map(p=>'[หน้า '+p.page+' | บท '+p.chapter+']\n'+p.text.slice(0,5500)).join('\n\n');}
export function validateAnswer(raw, allowed){
 let text=raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/,'').replace(/\x60\x60\x60$/,'');
 let result;try{result=JSON.parse(text)}catch{throw new Error('invalid_model_format')}
 if(typeof result.answer!=='string'||!result.answer.trim()||!Array.isArray(result.citations))throw new Error('invalid_model_format');
 if(!result.citations.every(p=>Number.isInteger(p)&&allowed.includes(p)))throw new Error('invalid_citation');
 if(result.in_scope!==false&&result.citations.length===0)throw new Error('missing_citation');
 return {answer:result.answer.slice(0,16000),citations:[...new Set(result.citations)],inScope:result.in_scope!==false};
}
