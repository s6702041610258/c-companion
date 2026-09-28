import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';

test('different sessions cannot read, delete, submit, report, or cancel another learners data',async({request,playwright,baseURL})=>{
 const outsider=await playwright.request.newContext({baseURL});
 const {id}=await (await request.post('/api/chats',{data:{chapter:2,mode:'ask'}})).json();
 try{
  const answer=await (await request.post(`/api/chats/${id}/messages`,{data:{message:'int กับ float ต่างกันยังไง'}})).json();
  expect((await outsider.get('/api/bootstrap')).ok()).toBe(true);
  expect((await (await outsider.get('/api/bootstrap')).json()).chats.some(c=>c.id===id)).toBe(false);
  for(const [method,url,data] of [
   ['get',`/api/chats/${id}`],['delete',`/api/chats/${id}`],
   ['post',`/api/chats/${id}/messages`,{message:'สรุปบทสนทนา'}],
   ['post','/api/reports',{category:'answer',detail:'ทดสอบข้อมูลที่ไม่ใช่ของตน',requestKey:randomUUID(),chatId:id,messageId:answer.id}]
  ])expect((await outsider[method](url,{data})).status()).toBe(404);
  const j=await (await request.post(`/api/chats/${id}/messages`,{data:{message:'พอยน์เตอร์ รอทดสอบ',async:true,requestKey:randomUUID()}})).json();
  expect((await outsider.get('/api/jobs/'+j.id)).status()).toBe(404);
  expect((await outsider.delete('/api/jobs/'+j.id)).status()).toBe(404);
  expect(['queued','running']).toContain((await (await request.get('/api/jobs/'+j.id)).json()).status);
  await request.delete('/api/jobs/'+j.id);
  await expect.poll(async()=>(await (await request.get('/api/jobs/'+j.id)).json()).status).toBe('cancelled');
  expect((await request.get('/api/chats/'+id)).ok()).toBe(true);
 }finally{await request.delete('/api/chats/'+id);await outsider.dispose()}
});

test('mutation rejects cross-site, null and malformed origins even without browser CORS',async({request})=>{
 for(const headers of [{Origin:'https://evil.example'},{Origin:'null'},{Origin:'not-a-url'},{'Sec-Fetch-Site':'cross-site'}]){
  expect((await request.post('/api/chats',{headers,data:{mode:'ask'}})).status()).toBe(403);
 }
});

test('session and response headers and input boundaries protect the HTTP interface',async({request})=>{
 const r=await request.get('/api/bootstrap');
 expect(r.headers()['set-cookie']).toMatch(/ct_session=[a-f0-9]{48};.*HttpOnly; SameSite=Strict/);
 expect(r.headers()['content-security-policy']).toContain("script-src 'self'");
 expect(r.headers()['cache-control']).toBe('no-store');
 expect(r.headers()['x-content-type-options']).toBe('nosniff');
 for(const body of ['null','[]','{bad'])expect((await request.post('/api/chats',{headers:{'Content-Type':'application/json'},data:body})).status()).toBe(400);
 expect((await request.post('/api/chats',{headers:{'Content-Type':'text/plain'},data:'{}'})).status()).toBe(415);
 expect((await request.post('/api/chats',{data:{mode:'unknown'}})).status()).toBe(400);
 for(const path of ['/.env','/app/server.mjs','/data/tutor.db','/%2e%2e/.env'])expect((await request.get(path)).status()).not.toBe(200);
});

test('chat creation is bounded and returns Retry-After without blocking reads or cleanup',async({request})=>{
 const ids=[];let blocked;
 try{
  for(let i=0;i<31;i++){const r=await request.post('/api/chats',{data:{mode:'ask'}});if(r.status()===429){blocked=r;break}expect(r.status()).toBe(201);ids.push((await r.json()).id)}
  expect(blocked?.status()).toBe(429);expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);
  expect((await request.get('/api/bootstrap')).ok()).toBe(true);
 }finally{for(const id of ids)expect((await request.delete('/api/chats/'+id)).status()).toBe(200)}
});

test('untrusted learner Markdown cannot execute scripts or javascript links',async({page})=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill('พอยน์เตอร์ <script>window.__xss=1</script> <img src=x onerror="window.__xss=1"> [link](javascript:alert(1))');
 await page.getByRole('button',{name:'ส่งคำถาม',exact:true}).click();
 await expect(page.locator('article.assistant')).toHaveCount(1);
 expect(await page.evaluate(()=>window.__xss)).toBeUndefined();
 await expect(page.locator('.prose script,.prose img')).toHaveCount(0);
 for(const href of await page.locator('.prose a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')||'')))expect(href).not.toMatch(/^javascript:/i);
});
