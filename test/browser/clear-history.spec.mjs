import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';

test('bulk delete is session scoped, rejects cross-site writes and refuses active jobs',async({request,playwright,baseURL})=>{
 const other=await playwright.request.newContext({baseURL});
 const create=async r=>(await (await r.post('/api/chats',{data:{mode:'ask'}})).json()).id;
 const a=await create(request),b=await create(request),foreign=await create(other);
 try{
  expect((await request.delete('/api/chats',{headers:{Origin:'https://evil.example'}})).status()).toBe(403);
  const job=await (await request.post(`/api/chats/${b}/messages`,{data:{message:'พอยน์เตอร์ รอทดสอบ',async:true,requestKey:randomUUID()}})).json();
  expect((await request.delete('/api/chats')).status()).toBe(409);
  expect((await request.get('/api/chats/'+a)).ok()).toBe(true);
  await request.delete('/api/jobs/'+job.id);
  await expect.poll(async()=>(await request.delete('/api/chats')).status()).toBe(200);
  expect((await request.get('/api/chats/'+a)).status()).toBe(404);
  expect((await request.get('/api/chats/'+b)).status()).toBe(404);
  expect((await other.get('/api/chats/'+foreign)).ok()).toBe(true);
 }finally{await request.delete('/api/chats');await other.delete('/api/chats');await other.dispose()}
});

test('mobile clear history can be cancelled, retains errors and removes the current conversation after confirmation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const {id}=await (await page.request.post('/api/chats',{data:{mode:'ask'}})).json();
 await page.request.post(`/api/chats/${id}/messages`,{data:{message:'สวัสดี'}});
 await page.reload();await page.getByRole('button',{name:'เปิดเมนู',exact:true}).click();
 await page.locator('.history-row>button').first().click();
 await expect(page.locator('.message.assistant')).toBeVisible();
 await page.getByRole('button',{name:'เปิดเมนู',exact:true}).click();
 await page.getByRole('button',{name:'ลบประวัติทั้งหมด',exact:true}).click();
 await expect(page.getByRole('button',{name:'เก็บไว้',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'เก็บไว้',exact:true}).click();
 await expect(page.locator('.history-row')).toHaveCount(1);
 await page.getByRole('button',{name:'ลบประวัติทั้งหมด',exact:true}).click();
 await page.route('**/api/chats',route=>route.request().method()==='DELETE'?route.fulfill({status:503,json:{error:'ทดสอบการเชื่อมต่อขัดข้อง'}}):route.continue(),{times:1});
 await page.getByRole('button',{name:'ยืนยันลบทั้งหมด',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toContainText('ทดสอบการเชื่อมต่อขัดข้อง');
 await expect(page.locator('.history-row')).toHaveCount(1);
 await page.getByRole('button',{name:'ยืนยันลบทั้งหมด',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toHaveCount(0);
 await expect(page.locator('.welcome')).toBeVisible();
 await expect(page.locator('.message')).toHaveCount(0);
 await page.reload();await page.getByRole('button',{name:'เปิดเมนู',exact:true}).click();
 await expect(page.locator('.history-row')).toHaveCount(0);
});
