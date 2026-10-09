import {test,expect} from '@playwright/test';

const chat={id:'11111111-1111-4111-8111-111111111111',title:'บทสนทนาทดสอบหน้าจอ',chapter:0,mode:'ask',created:'2026-10-09T10:00:00.000Z'};
async function fixture(page,messages){
 await page.route('**/api/bootstrap',r=>r.fulfill({json:{chapters:[],chats:[chat],progress:[],configured:true}}));
 await page.route('**/api/chats?*',r=>r.fulfill({json:{chats:[chat],nextCursor:null}}));
 await page.route('**/api/chats/'+chat.id,r=>r.fulfill({json:{...chat,messages}}));
 await page.goto('/');await page.getByRole('button',{name:chat.title,exact:true}).click();
 await expect(page.locator('.message').first()).toBeVisible();
}

test('mode changes preserve drafts and history; clicking the active mode never clears a chat',async({page})=>{
 await fixture(page,[{role:'user',content:'สวัสดี',sources:[]},{role:'assistant',content:'มาเรียนภาษา C กันครับ',sources:[]}]);
 const input=page.getByRole('textbox',{name:'คำถามภาษา C'});await input.fill('ข้อความที่ยังไม่ได้ส่ง');
 await page.getByRole('button',{name:'ถามคำถาม',exact:true}).click();await expect(page.locator('.message')).toHaveCount(2);
 await page.getByRole('button',{name:'ติวทีละขั้น',exact:true}).click();await expect(page.getByRole('alertdialog')).toBeVisible();
 await page.getByRole('button',{name:'คุยต่อโหมดเดิม'}).click();await expect(input).toHaveValue('ข้อความที่ยังไม่ได้ส่ง');await expect(page.locator('.message')).toHaveCount(2);
 await page.getByRole('button',{name:'ติวทีละขั้น',exact:true}).click();await page.getByRole('button',{name:'เริ่มโหมดใหม่'}).click();
 await expect(page.locator('.welcome')).toBeVisible();await expect(input).toHaveValue('ข้อความที่ยังไม่ได้ส่ง');await expect(page.getByRole('button',{name:'ติวทีละขั้น',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.getByRole('button',{name:chat.title,exact:true})).toBeVisible();
});

test('long code expands, copies original text and does not interpret HTML',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const text='#include <stdio.h>\nint main(void) {\n'+Array.from({length:20},(_,i)=>`    printf("<img src=x onerror=alert(1)> ${i}\\n");`).join('\n')+'\n    return 0;\n}\n';
 await fixture(page,[{role:'assistant',content:'ตัวอย่าง\n\n```c\n'+text+'```',sources:[]}]);
 await expect(page.locator('.syntax-keyword').first()).toHaveText('int');await expect(page.locator('.code-wrap img')).toHaveCount(0);
 await page.getByRole('button',{name:'คัดลอกโค้ด',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(text);
 const pre=page.locator('.code-wrap pre');const height=await pre.evaluate(e=>e.clientHeight);
 await page.getByRole('button',{name:'ขยายดูโค้ดทั้งหมด'}).click();expect(await pre.evaluate(e=>e.clientHeight)).toBeGreaterThan(height);
 await page.getByRole('button',{name:'ย่อโค้ด',exact:true}).click();expect(await pre.evaluate(e=>e.clientHeight)).toBe(height);
});

test('reading older messages stays in place when an answer arrives; latest button resumes following',async({page})=>{
 const messages=Array.from({length:14},(_,i)=>({role:i%2?'assistant':'user',content:('ข้อความสำหรับอ่านย้อนหลัง '+i+'\n\n').repeat(6),sources:[]}));
 await fixture(page,messages);
 let respond;const gate=new Promise(resolve=>respond=resolve);
 await page.route('**/api/chats/'+chat.id+'/messages',async r=>{await gate;await r.fulfill({json:{id:'job',status:'completed',result:{role:'assistant',content:'คำตอบใหม่สำหรับทดสอบ',sources:[{chapter:4,page:32,pdfPage:37,title:'เงื่อนไข',excerpt:'if else'}]}}})});
 await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill('คำถามใหม่');await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await page.getByRole('button',{name:'หยุดรอคำตอบ'}).waitFor();
 await page.locator('.chat-scroll').evaluate(e=>{e.scrollTop=120;e.dispatchEvent(new Event('scroll'))});
 await expect(page.getByRole('button',{name:'กลับไปข้อความล่าสุด'})).toBeVisible();respond();
 await expect(page.getByRole('button',{name:'มีคำตอบใหม่ · ไปด้านล่าง'})).toBeVisible();
 await expect(page.locator('#reference-panel')).toBeHidden();
 await expect.poll(()=>page.locator('.chat-scroll').evaluate(e=>Math.round(e.scrollTop))).toBe(120);
 await page.getByRole('button',{name:'มีคำตอบใหม่ · ไปด้านล่าง'}).click();await expect(page.getByText('คำตอบใหม่สำหรับทดสอบ',{exact:true})).toBeVisible();
 await expect(page.locator('.jump-latest')).toHaveCount(0);
});

test('mobile composer grows for pasted code, stays bounded and resets after clearing',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.goto('/');const input=page.getByRole('textbox',{name:'คำถามภาษา C'});const initial=await input.evaluate(e=>e.clientHeight);
 await input.fill('int value = 1;\n'.repeat(30));const grown=await input.evaluate(e=>e.clientHeight);expect(grown).toBeGreaterThan(initial);expect(grown).toBeLessThanOrEqual(160);
 await expect(page.getByRole('button',{name:'ส่งคำถาม'})).toBeInViewport();await input.fill('');expect(await input.evaluate(e=>e.clientHeight)).toBe(initial);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('history API only returns owned non-empty conversations and searches titles literally',async({request,playwright,baseURL})=>{
 const other=await playwright.request.newContext({baseURL});
 const create=async(r,title)=>{const {id}=await (await r.post('/api/chats',{data:{mode:'ask'}})).json();await r.post(`/api/chats/${id}/messages`,{data:{message:title}});return id};
 try{const owned=await create(request,'สวัสดี 100%'),foreign=await create(other,'สวัสดี 100%');const response=await (await request.get('/api/chats?q=%25')).json();expect(response.chats.map(c=>c.id)).toEqual([owned]);expect(response.chats.some(c=>c.id===foreign)).toBe(false);expect((await request.get('/api/chats?cursor=invalid')).status()).toBe(400)}
 finally{await request.delete('/api/chats');await other.delete('/api/chats');await other.dispose()}
});

test('settings report service failure honestly and provide the shipped PDF manual',async({page})=>{
 await page.route('**/api/connection',r=>r.fulfill({json:{status:'unavailable',checkedAt:new Date().toISOString()}}));
 await page.goto('/');await page.getByRole('button',{name:'การใช้งานและคู่มือ',exact:true}).click();const modal=page.getByRole('dialog',{name:'การใช้งานและคู่มือ'});
 await expect(modal).toContainText('ยังเชื่อมต่อบริการ AI ไม่สำเร็จ');await expect(modal.getByRole('link',{name:/เปิดคู่มือ/})).toHaveAttribute('href','/manual.pdf');
 const pdf=await page.request.head('/manual.pdf');expect(pdf.ok()).toBe(true);expect(pdf.headers()['content-type']).toBe('application/pdf');
 await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect(page.getByRole('button',{name:'การใช้งานและคู่มือ',exact:true})).toBeFocused();
});
