import {test,expect} from '@playwright/test';

test('landing hydrates under hash-based CSP and demo tabs work with keyboard without calling AI',async({page,request})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')writes.push(r.url())});
 const response=await page.goto('/welcome/');const policy=response.headers()['content-security-policy'];const scriptPolicy=policy.split(';').find(s=>s.trim().startsWith('script-src'));
 const asset=await page.locator('script[src]').first().getAttribute('src');expect((await request.head(asset)).headers()['cache-control']).toContain('immutable');
 expect(scriptPolicy).toContain('sha256-');expect(scriptPolicy).not.toContain('unsafe-inline');expect(scriptPolicy).not.toContain('unsafe-eval');
 const tutor=page.getByRole('tab',{name:'ติวทีละขั้น'});await tutor.click();await expect(page.getByRole('tabpanel')).toContainText('i < 3');
 await page.keyboard.press('ArrowDown');await expect(page.getByRole('tab',{name:'ฝึกทำโจทย์'})).toBeFocused();await expect(page.getByRole('tabpanel')).toContainText('ส่งโค้ดที่ลองเขียน');
 await page.keyboard.press('Home');await expect(page.getByRole('tabpanel')).toContainText('บทที่ 4');
 expect(errors).toEqual([]);expect(writes).toEqual([]);
 const chat=await request.get('/');expect(chat.headers()['content-security-policy']).not.toContain('sha256-');
 await expect(page.getByRole('link',{name:'เริ่มเรียนภาษา C',exact:true})).toHaveAttribute('href','/');
 expect((await request.head('/manual.pdf')).ok()).toBe(true);expect((await request.head('/book.pdf')).ok()).toBe(true);
});

test('motion can be disabled mid-scroll, removing pinning while keeping every mode readable',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','on');await expect(page.locator('.pin-spacer')).toHaveCount(1);
 await page.locator('.quiz-card a').focus();await expect(page.locator('.quiz-card a')).toBeInViewport({ratio:.9});
 await page.getByRole('button',{name:'ลดการเคลื่อนไหว',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(page.locator('#dragon-scene canvas')).toHaveCount(0);
 for(const card of ['.ask-card','.tutor-card','.quiz-card']){await page.locator(card).scrollIntoViewIfNeeded();await expect(page.locator(card+' h3')).toBeInViewport()}
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-motion','off');
});

test('reduced motion never loads a WebGL scene and narrow mobile retains all content without overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('#dragon-scene canvas')).toHaveCount(0);await expect(page.locator('.pin-spacer')).toHaveCount(0);
 await page.getByRole('tab',{name:'ติวทีละขั้น'}).click();await expect(page.getByRole('tabpanel')).toContainText('printf');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.local-option').scrollIntoViewIfNeeded();await expect(page.getByRole('link',{name:'อ่านคู่มือติดตั้ง'})).toBeInViewport();
 await expect(page.locator('.chapter-item')).toHaveCount(12);
});

test('WebGL failure keeps the illustrated fallback, usable links and working examples',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).startsWith('webgl'))return null;return original.call(this,kind,...args)}});
 await page.goto('/welcome/');await expect(page.locator('html')).toHaveAttribute('data-motion','on');
 await page.getByRole('tab',{name:'ฝึกทำโจทย์'}).click();await expect(page.getByRole('tabpanel')).toContainText('คะแนน');
 await expect(page.locator('#dragon-scene canvas')).toHaveCount(0);await expect(page.locator('.scene-fallback')).toHaveCSS('opacity','1');
});

test('static landing remains readable and navigable with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{await page.goto('http://127.0.0.1:18080/welcome/');await expect(page.getByRole('heading',{level:1})).toContainText('curiosity');await expect(page.locator('.chapter-item')).toHaveCount(12);
 await page.locator('summary').filter({hasText:'ต้องเขียนภาษา C เป็นก่อนหรือไม่?'}).click();await expect(page.getByText('เริ่มจากพื้นฐานได้',{exact:false})).toBeVisible();
 await page.getByRole('link',{name:'เริ่มเรียนภาษา C',exact:true}).click();await expect(page).toHaveURL('http://127.0.0.1:18080/');
 }finally{await context.close()}
});

test('chat entry does not load the landing animation bundle',async({page})=>{
 const landing=[];page.on('request',r=>{if(r.url().includes('/welcome/'))landing.push(r.url())});await page.goto('/');await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toBeVisible();expect(landing).toEqual([]);
});

test('data-saving preference starts without motion and still allows an explicit opt-in',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));
 await page.goto('/welcome/');await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('#dragon-scene canvas')).toHaveCount(0);
 await page.getByRole('button',{name:'เปิดการเคลื่อนไหว',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-motion','on');
});
