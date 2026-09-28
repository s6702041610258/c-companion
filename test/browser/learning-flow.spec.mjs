import {test,expect} from '@playwright/test';

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
