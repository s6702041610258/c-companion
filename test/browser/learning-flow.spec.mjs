import {test,expect} from '@playwright/test';

test('greets learners and explains the tutor without pretending to cite the book',async({page})=>{
 await page.goto('/');
 const question=page.getByRole('textbox',{name:'คำถามภาษา C'});
 await question.fill('สวัสดี');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText(/สวัสดีครับ.*C Companion/)).toBeVisible();
 await expect(page.getByRole('button',{name:/หน้า \d+/})).toHaveCount(0);
 await question.fill('คุณคือเเชทบอทเกี่ยวกับอะไรทำอะไรได้บ้าง &#x20;');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText(/ผมคือ C Companion เพื่อนติวภาษา C/)).toBeVisible();
 await expect(page.getByRole('button',{name:/หน้า \d+/})).toHaveCount(0);
 await question.fill('สวัสดี printf ใช้ยังไง');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText('คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล')).toBeVisible();
 await expect(page.getByRole('button',{name:/หน้า \d+/}).first()).toBeVisible();
});

test('learner receives a cited answer and reports a problem',async({page})=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill('พอยน์เตอร์คืออะไร');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText('คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล')).toBeVisible();
 await expect(page.getByRole('button',{name:/หน้า \d+/}).first()).toBeVisible();
 await page.getByRole('button',{name:'รายงานปัญหาคำตอบนี้'}).click();
 const dialog=page.getByRole('dialog',{name:'รายงานปัญหา'});
 await dialog.getByRole('textbox',{name:'รายละเอียดที่พบ'}).fill('ทดสอบการส่งรายงานจากหน้าเว็บ');
 await dialog.getByRole('button',{name:/ส่งรายงาน/}).click();
 await expect(dialog.getByText('บันทึกรายงานแล้ว')).toBeVisible();
});

test('mobile learner can close and reopen sources',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill('พอยน์เตอร์คืออะไร');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText('คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล')).toBeVisible();
 const sources=page.getByRole('dialog',{name:'แหล่งอ้างอิง'});
 await expect(sources).toBeVisible();
 await sources.getByRole('button',{name:'ย่อแผงอ้างอิง'}).click();
 await expect(sources).toBeHidden();
 await page.getByRole('button',{name:'เปิดแหล่งอ้างอิง'}).click();
 await expect(sources).toBeVisible();
});

test('learner can cancel a delayed answer',async({page})=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill('พอยน์เตอร์ รอทดสอบ');
 await page.getByRole('button',{name:'ส่งคำถาม'}).click();
 await expect(page.getByText('กำลังอ่านเนื้อหาและเรียบเรียงคำอธิบาย…')).toBeVisible();
 await page.getByRole('button',{name:'หยุดรอคำตอบ'}).click();
 await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toHaveValue('พอยน์เตอร์ รอทดสอบ');
 await expect(page.getByRole('alert')).toContainText('หยุดรอคำตอบแล้ว');
 await page.reload();
 await expect(page.locator('.history-list').getByRole('button',{name:'บทสนทนาใหม่',exact:true})).toHaveCount(0);
});

test('quiz mode explains when the learner will see the solution',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'ฝึกทำโจทย์'}).click();
 await expect(page.getByText('ลองตอบโจทย์ก่อน แล้วระบบจะตรวจคำตอบและอธิบายเฉลยหลังคุณส่งคำตอบ')).toBeVisible();
});

test('book dialog offers a visible PDF fallback',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('.topbar-actions .book-button').click();
 const dialog=page.getByRole('dialog',{name:'หนังสือ C Companion'});
 const fallback=dialog.locator('.book-fallback').getByRole('link',{name:/เปิด PDF ในแท็บใหม่/});
 await expect(fallback).toBeVisible();
 await expect(fallback).toHaveAttribute('href',/book\.pdf#page=1$/);
 const response=await page.request.get('/book.pdf',{headers:{Range:'bytes=0-3'}});
 expect(response.status()).toBe(206);
 expect((await response.body()).toString()).toBe('%PDF');
});

test('reading theme follows the system and remembers a manual choice',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.setViewportSize({width:320,height:740});
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.getByRole('button',{name:'เปลี่ยนเป็นโหมดสว่าง'})).toBeVisible();
 expect(await page.locator('.main').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(13, 16, 20)');
 await page.getByRole('button',{name:'เปลี่ยนเป็นโหมดสว่าง'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await expect(page.getByRole('button',{name:'เปลี่ยนเป็นโหมดมืด'})).toBeVisible();
 expect(await page.locator('.main').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(252, 253, 252)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('stop during chat creation prevents an AI job and restores the draft',async({page})=>{
 await page.goto('/');let submitted=0;
 page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/messages'))submitted++});
 await page.route('**/api/chats',async route=>{if(route.request().method()!=='POST')return route.continue();const response=await route.fetch();await new Promise(r=>setTimeout(r,750));await route.fulfill({response})});
 const input=page.getByRole('textbox',{name:'คำถามภาษา C'});const text='พอยน์เตอร์ รอทดสอบ';
 await input.fill(text);await page.getByRole('button',{name:'ส่งคำถาม',exact:true}).click();
 await page.getByRole('button',{name:'หยุดรอคำตอบ',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('หยุดรอคำตอบแล้ว');
 await expect(input).toHaveValue(text);expect(submitted).toBe(0);
 await page.reload();await expect(page.locator('.history-list').getByRole('button',{name:'บทสนทนาใหม่',exact:true})).toHaveCount(0);
});

test('stop while the job receipt is delayed cancels the actual server job',async({page})=>{
 await page.goto('/');let jobId='';
 await page.route('**/api/chats/*/messages',async route=>{const response=await route.fetch();jobId=(await response.json()).id;await new Promise(r=>setTimeout(r,750));await route.fulfill({response})});
 const text='พอยน์เตอร์ รอทดสอบ';await page.getByRole('textbox',{name:'คำถามภาษา C'}).fill(text);
 await page.getByRole('button',{name:'ส่งคำถาม',exact:true}).click();
 await expect.poll(()=>jobId).not.toBe('');
 await page.getByRole('button',{name:'หยุดรอคำตอบ',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('หยุดรอคำตอบแล้ว');
 await expect.poll(async()=>(await (await page.request.get('/api/jobs/'+jobId)).json()).status).toBe('cancelled');
 await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toHaveValue(text);
});
