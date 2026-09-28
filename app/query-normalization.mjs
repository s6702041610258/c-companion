// Normalize retrieval only; never rewrite learner text or code.
const groups=[
['พอยน์เตอร์','พอยเตอร์','พ้อยเตอร์','พ้อยน์เตอร์','พอยน์เตอ','พอยเตอ','พอยน์เตอร','พอนเตอร์','pointer','pointers','poiner','ponter'],
['ฟังก์ชัน','ฟังก์ชั่น','ฟังชั่น','ฟังชัน','ฟังชันก์','function','functions','funtion'],
['อาร์เรย์','อาเรย์','อาร์เร','อาเร','array','arrays','aray'],
['ลูป','ลุป','loop','loops'],
['ตัวแปร','ตัวเเปร','ตัวแปล','variable','variables'],
['ชนิดข้อมูล','ประเภทข้อมูล','datatype','datatypes','data type','data types','data-type','data-types'],
['สตริง','สตริงก์','string','strings'],
['พารามิเตอร์','พารามิเตอ','parameter','parameters']
];
const fold=s=>s.normalize('NFC').toLowerCase().replace(/[่้๊๋]/g,'');
export function normalizeQuery(query){
 const original=String(query);const folded=fold(original);
 const additions=groups.filter(group=>group.some(alias=>/[a-z]/i.test(alias)?new RegExp('\\b'+alias+'\\b','i').test(folded):folded.includes(fold(alias)))).map(g=>g[0]);
 return original+' '+additions.join(' ');
}
