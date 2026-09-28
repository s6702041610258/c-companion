import {test,expect} from '@playwright/test';

test('summarizes the beginning of a chat beyond the normal eight-message window',async({request,playwright,baseURL})=>{
 const created=await request.post('/api/chats',{data:{chapter:0,mode:'ask'}});
 const {id}=await created.json();
 const other=await request.post('/api/chats',{data:{chapter:0,mode:'ask'}});
 const {id:otherId}=await other.json();
 try{
  await request.post(`/api/chats/${otherId}/messages`,{data:{message:'ข้อมูลเฉพาะแชทอื่น'}});
  for(const message of ['ฉันสนใจอาร์เรย์ตั้งแต่เริ่มแชท','สวัสดี','คุณคือใคร','สวัสดี','คุณคือใคร','สวัสดี']){
   const response=await request.post(`/api/chats/${id}/messages`,{data:{message}});
   expect(response.ok()).toBe(true);
  }
  const response=await request.post(`/api/chats/${id}/messages`,{data:{message:'ช่วยสรุปเนื้อหาที่คุยกันตั้งแต่เริ่มแชท'}});
  expect(response.ok()).toBe(true);
  const result=await response.json();
  expect(result.content).toContain('สรุปจากบทสนทนา');
  expect(result.content).toContain('ฉันสนใจอาร์เรย์ตั้งแต่เริ่มแชท');
  expect(result.content).not.toContain('ข้อมูลเฉพาะแชทอื่น');
  expect(result.sources).toEqual([]);
  const outsider=await playwright.request.newContext({baseURL});
  try{
   const denied=await outsider.post('/api/chats/'+id+'/messages',{data:{message:'สรุปบทสนทนาทั้งหมด'}});
   expect(denied.status()).toBe(404);
  }finally{await outsider.dispose()}
 }finally{
  await request.delete(`/api/chats/${id}`);
  await request.delete(`/api/chats/${otherId}`);
 }
});

test('reported typos are routed correctly and original learner text is saved',async({request})=>{
 const created=await request.post('/api/chats',{data:{chapter:0,mode:'ask'}});
 const {id}=await created.json();
 try{
  const empty=await request.post('/api/chats/'+id+'/messages',{data:{message:'สรุปบทสนทนาทั้งหมด'}});
  expect((await empty.json()).content).toContain('ยังไม่มีบทสนทนา');
  for(const [message,expected] of [
   ['คุณ คุณ คุณทำอะไรได้บ้าว','ผมคือ C Companion'],
   ['ชั้นต้องการเรียนพาสาซี &#x20;','เริ่มเรียนภาษา C']
  ]){
   const response=await request.post('/api/chats/'+id+'/messages',{data:{message}});
   expect(response.ok()).toBe(true);
   const answer=await response.json();
   expect(answer.content).toContain(expected);expect(answer.sources).toEqual([]);
   const saved=await (await request.get('/api/chats/'+id)).json();
   expect(saved.messages.filter(m=>m.role==='user').at(-1).content).toBe(message);
  }
 }finally{await request.delete('/api/chats/'+id)}
});

test('understands noisy beginner requests without losing the original message',async({request})=>{
 const {id}=await (await request.post('/api/chats',{data:{chapter:0,mode:'ask'}})).json();
 try{
  for(const message of ['ชั้นต้องการเรียนพาสาซี”','ชั้นต้องการเรียนพาสาซี”กก']){
   const response=await request.post('/api/chats/'+id+'/messages',{data:{message}});
   expect(response.ok()).toBe(true);
   const result=await response.json();
   expect(result.content).toContain('เริ่มเรียนภาษา C');
   expect(result.sources).toEqual([]);
   const saved=await (await request.get('/api/chats/'+id)).json();
   expect(saved.messages.filter(m=>m.role==='user').at(-1).content).toBe(message);
  }
 }finally{await request.delete('/api/chats/'+id)}
});

test('semantic routing keeps C references, resolves follow-ups and asks when unclear',async({request})=>{
 const {id}=await (await request.post('/api/chats',{data:{chapter:0,mode:'ask'}})).json();
 try{
  for(const [message,expected,grounded] of [
   ['อยากหัดเขียนภาษาซี เริ่มตรงไหนดีงับ','เริ่มเรียนภาษา C',false],
   ['เริ่มจากศูนย์เลย','คำตอบทดสอบ',true],
   ['สวัสดี อยากเรียนภาษา C เรื่องลูป','คำตอบทดสอบ',true],
   ['int กับ float ต่างกันยังไง','คำตอบทดสอบ',true],
   ['แล้วแบบที่สองล่ะ','คำตอบทดสอบ',true],
   ['อันนั้นอะ','ยังไม่แน่ใจ',false],
   ['อยากเรียน Python','ช่วยติวภาษา C',false],
   ['ไม่อยากเรียน C ไม่ต้องสอน','ช่วยติวภาษา C',false],
   ['ช่วยรวบยอดสิ่งที่เราคุยไป','สรุปจากบทสนทนา',false]
  ]){
   const response=await request.post('/api/chats/'+id+'/messages',{data:{message}});
   expect(response.ok()).toBe(true);
   const result=await response.json();expect(result.content).toContain(expected);
   if(grounded)expect(result.sources.length).toBeGreaterThan(0);else expect(result.sources).toEqual([]);
  }
 }finally{await request.delete('/api/chats/'+id)}
});

test('invalid intent response asks for clarification without inventing an answer',async({request})=>{
 const {id}=await (await request.post('/api/chats',{data:{chapter:2,mode:'ask'}})).json();
 try{
  await request.post('/api/chats/'+id+'/messages',{data:{message:'int กับ float ต่างกันยังไง'}});
  const response=await request.post('/api/chats/'+id+'/messages',{data:{message:'ทดสอบระบบตีความเสีย'}});
  expect(response.ok()).toBe(true);const result=await response.json();
  expect(result.content).toContain('ยังไม่แน่ใจ');expect(result.sources).toEqual([]);
 }finally{await request.delete('/api/chats/'+id)}
});
