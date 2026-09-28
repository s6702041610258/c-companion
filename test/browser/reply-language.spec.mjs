import {test,expect} from '@playwright/test';
async function chat(request,language='th',mode='ask'){return (await (await request.post('/api/chats',{data:{chapter:0,mode,replyLanguage:language}})).json()).id}
async function send(request,id,message,extra={}){const r=await request.post(`/api/chats/${id}/messages`,{data:{message,...extra}});expect(r.ok()).toBe(true);return r.json()}
test('language settings persist, validate and respect ownership',async({request,playwright,baseURL})=>{
 const id=await chat(request);const other=await playwright.request.newContext({baseURL});
 try{
  expect((await other.patch('/api/chats/'+id,{data:{replyLanguage:'en'}})).status()).toBe(404);
  expect((await request.patch('/api/chats/'+id,{data:{replyLanguage:'fr'}})).status()).toBe(400);
  expect((await request.patch('/api/chats/'+id,{data:{replyLanguage:'en'}})).ok()).toBe(true);
  const r=await send(request,id,'พอยน์เตอร์คืออะไร');expect(r.content).toContain('Test answer');expect(r.sources.length).toBeGreaterThan(0);
  expect((await (await request.get('/api/chats/'+id)).json()).replyLanguage).toBe('en');
 }finally{await request.delete('/api/chats/'+id);await other.dispose()}
});
test('persistent and once-only commands preserve mode and quiz attempt gate',async({request})=>{
 const id=await chat(request,'th','quiz');
 try{
  await send(request,id,'ขอโจทย์เรื่องลูป for');
  const language=await send(request,id,'ต่อไปตอบอังกฤษนะ');expect(language.preferredLanguage).toBe('en');
  const translated=await send(request,id,'Translate the current exercise into English');expect(translated.sources.length).toBeGreaterThan(0);
  expect((await send(request,id,'Show me the solution')).content).toContain('Try answering');
  await send(request,id,'ตอบไทยเหมือนเดิม');
  const once=await send(request,id,'ข้อนี้ตอบอังกฤษ: พอยน์เตอร์คืออะไร');expect(once.replyLanguage).toBe('en');expect(once.preferredLanguage).toBe('th');
  const saved=await (await request.get('/api/chats/'+id)).json();expect(saved.mode).toBe('quiz');expect(saved.replyLanguage).toBe('th');
 }finally{await request.delete('/api/chats/'+id)}
});
test('cancelled language commands do not commit and busy chats reject setting changes',async({request})=>{
 const id=await chat(request);
 try{
  const job=await send(request,id,'ตอบอังกฤษนะ รอทดสอบ',{async:true});
  expect((await request.patch('/api/chats/'+id,{data:{replyLanguage:'en'}})).status()).toBe(409);
  await request.delete('/api/jobs/'+job.id);
  await expect.poll(async()=> (await (await request.get('/api/jobs/'+job.id)).json()).status).toBe('cancelled');
  const saved=await (await request.get('/api/chats/'+id)).json();expect(saved.replyLanguage).toBe('th');expect(saved.messages).toHaveLength(0);
 }finally{await request.delete('/api/chats/'+id)}
});
test('English summary, clarification and provider error are localized',async({request})=>{
 const id=await chat(request,'en');
 try{
  expect((await send(request,id,'สรุปบทสนทนาทั้งหมด')).content).toContain('There is no earlier');
  expect((await send(request,id,'ทดสอบระบบตีความเสีย')).content).toContain('Could you clarify');
  const failed=await request.post('/api/chats/'+id+'/messages',{data:{message:'pointer จำลองเซิร์ฟเวอร์ล้ม'}});expect(failed.status()).toBe(502);expect((await failed.json()).error).not.toMatch(/[ก-๙]/);
  expect((await send(request,id,'Summarize our conversation')).content).toContain('Summary of this conversation');
 }finally{await request.delete('/api/chats/'+id)}
});
test('mobile language picker keeps the same chat, draft and saved preference',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const group=page.getByRole('group',{name:'ภาษาคำตอบ / Reply language'});
 await group.getByRole('button',{name:'English',exact:true}).click();
 const field=page.getByRole('textbox',{name:'คำถามภาษา C'});await field.fill('พอยน์เตอร์คืออะไร');await page.getByRole('button',{name:'ส่งคำถาม',exact:true}).click();
 await expect(page.locator('article.assistant .prose')).toContainText('Test answer');
 const sources=page.getByRole('dialog',{name:'แหล่งอ้างอิง'});await sources.getByRole('button',{name:'ย่อแผงอ้างอิง'}).click();
 await field.fill('draft remains');await group.getByRole('button',{name:'ไทย',exact:true}).click();await expect(field).toHaveValue('draft remains');await expect(page.locator('article.assistant')).toHaveCount(1);
 await page.reload();await page.getByRole('button',{name:'เปิดเมนู',exact:true}).click();await page.locator('.history-list').getByRole('button',{name:'พอยน์เตอร์คืออะไร',exact:true}).click();
 await expect(group.getByRole('button',{name:'ไทย',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('article.assistant')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
