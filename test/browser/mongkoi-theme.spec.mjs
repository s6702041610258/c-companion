import {test,expect} from '@playwright/test';

test('Mongkoi portraits load locally and midnight theme preserves the light palette and drafts',async({page})=>{
 const sceneRequests=[];page.on('request',r=>{if(r.url().includes('/models/')||r.url().includes('/welcome/_next/'))sceneRequests.push(r.url())});
 await page.goto('/chat/');
 const main=page.locator('.main'),input=page.getByRole('textbox',{name:'คำถามภาษา C'});
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const light=await main.evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 await expect(page.locator('.welcome-avatar img')).toHaveAttribute('src',/mongkoi-portrait.*\.webp/);
 expect(await page.locator('.welcome-avatar img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
 await input.fill('คำถามที่ยังไม่ได้ส่ง');
 await page.getByRole('button',{name:'เปลี่ยนเป็นโหมดมืด'}).click();
 await expect(main).toHaveCSS('background-color','rgb(9, 13, 20)');
 await expect(page.locator('.send-button')).toHaveCSS('background-color','rgb(201, 46, 37)');
 await expect(input).toHaveValue('คำถามที่ยังไม่ได้ส่ง');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.getByRole('button',{name:'เปลี่ยนเป็นโหมดสว่าง'}).click();
 expect(await main.evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}))).toEqual(light);
 expect(sceneRequests).toEqual([]);
});

test('mobile dark chat keeps Mongkoi, mode controls, composer and settings accessible',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/chat/');
 await page.getByRole('button',{name:'เปลี่ยนเป็นโหมดมืด'}).click();
 await expect(page.locator('.welcome-avatar img')).toBeVisible();
 await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toBeInViewport();
 await expect(page.getByRole('button',{name:'ฝึกทำโจทย์',exact:true})).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'เปิดเมนู',exact:true}).click();
 await expect(page.locator('.brand-mark img')).toBeVisible();
 await page.getByRole('button',{name:'การใช้งานและคู่มือ',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('dialog')).toHaveCSS('background-color','rgb(19, 23, 32)');
});
