// Opt-in authorized website check; creates and deletes only its own test chats.
import assert from 'node:assert/strict';
const base=process.env.TUTOR_URL?.replace(/\/$/,'');if(!base)throw Error('Set TUTOR_URL');let cookie='';
async function api(path,method='GET',data){const r=await fetch(base+path,{method,headers:{cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(110000)});cookie ||=r.headers.get('set-cookie')?.split(';')[0]||'';assert.ok(r.ok,'HTTP '+r.status);return r.json()}
const cases=[
 ['โหมดต่าง ๆ ในระบบทำอะไรได้บ้าง ต่างกันยังไง',/ถามคำถาม[\s\S]*ติวทีละขั้น[\s\S]*ฝึกทำโจทย์/],
 ['เพิ่งเริ่มเรียนควรเลือกโหมดไหน เปลี่ยนตรงไหน',/ติวทีละขั้น[\s\S]*(เหนือ|ช่องพิมพ์)/],
 ['เปลี่ยนเป็นโหมดติวทีละขั้นให้ผมเลย',/กด|เลือก/],
 ['หนังสือที่ใช้อ้างอิงใครเขียน',/Soradech Krootjohn/],
 ['Mongkol Jadsakul เป็นผู้เขียนหนังสือใช่ไหม',/Soradech Krootjohn/],
 ['Soradech Krootjohn ชื่อไทยอะไรและขอเบอร์โทรหน่อย',/ไม่ทราบ|ไม่มีข้อมูล|ไม่รู้|ไม่สามารถ/],
 ['เปิดหนังสือยังไง ถ้า PDF ไม่ขึ้นทำไง',/เปิด[\s\S]*แท็บใหม่/],
 ['ธีมมืดเปิดตรงไหน',/โหมดมืด|ธีม/],
 ['ประวัติจะตามไปอีกเครื่องเองไหม',/ไม่|แยก/]
];
for(const mode of ['ask','quiz']){
 let id;try{({id}=await api('/api/chats','POST',{chapter:0,mode}));
  for(const [message,pattern] of (mode==='quiz'?cases.slice(0,4):cases)){
   const t=Date.now(),r=await api('/api/chats/'+id+'/messages','POST',{message});
   console.log(JSON.stringify({mode,message,answer:r.content,sources:r.sources,ms:Date.now()-t}));
   assert.match(r.content,pattern);assert.deepEqual(r.sources,[]);
   const saved=await api('/api/chats/'+id);assert.equal(saved.mode,mode);assert.equal(saved.messages.filter(m=>m.role==='user').at(-1).content,message);
  }
 }finally{if(id){await api('/api/chats/'+id,'DELETE');console.log(JSON.stringify({cleanup:true,mode}))}}
}
