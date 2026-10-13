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
 const chat=await request.get('/chat/');expect(chat.headers()['content-security-policy']).not.toContain('sha256-');
 await expect(page.locator('.hero').getByRole('link',{name:'เริ่มคุยกับ C Companion',exact:true})).toHaveAttribute('href','/chat/');
 expect((await request.head('/manual.pdf')).ok()).toBe(true);expect((await request.head('/book.pdf')).ok()).toBe(true);
});

test('native mode gallery stays controllable without trapping page scroll and motion can be disabled',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','on');await expect(page.locator('.pin-spacer')).toHaveCount(0);
 await page.getByRole('button',{name:'ฝึกทำโจทย์',exact:true}).click();
 await expect(page.locator('.quiz-card h3')).toBeInViewport();
 await page.getByRole('button',{name:'โหมดก่อนหน้า'}).click();
 await expect(page.locator('.tutor-card h3')).toBeInViewport();
 await page.locator('.quiz-card a').focus();await expect(page.locator('.quiz-card a')).toBeInViewport({ratio:.9});
 await page.getByRole('button',{name:'ลดการเคลื่อนไหว',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('.pin-spacer')).toHaveCount(0);await expect(page.locator('#learning-scene canvas')).toHaveCount(0);
 for(const card of ['.ask-card','.tutor-card','.quiz-card']){await page.locator(card).scrollIntoViewIfNeeded();await expect(page.locator(card+' h3')).toBeInViewport()}
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-motion','off');
});

test('reduced motion never loads a WebGL scene and narrow mobile retains all content without overflow',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('#learning-scene canvas')).toHaveCount(0);await expect(page.locator('.pin-spacer')).toHaveCount(0);
 await page.getByRole('tab',{name:'ติวทีละขั้น'}).click();await expect(page.getByRole('tabpanel')).toContainText('printf');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.local-option').scrollIntoViewIfNeeded();await expect(page.getByRole('link',{name:'อ่านคู่มือติดตั้ง'})).toBeInViewport();
 await expect(page.locator('.chapter-item')).toHaveCount(12);
});

test('WebGL failure keeps the illustrated fallback, usable links and working examples',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).startsWith('webgl'))return null;return original.call(this,kind,...args)}});
 await page.goto('/welcome/');await expect(page.locator('html')).toHaveAttribute('data-motion','on');
 await page.getByRole('tab',{name:'ฝึกทำโจทย์'}).click();await expect(page.getByRole('tabpanel')).toContainText('คะแนน');
 await expect(page.locator('#learning-scene canvas')).toHaveCount(0);await expect(page.locator('.scene-fallback')).toHaveCSS('opacity','1');
});

test('static landing remains readable and navigable with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{await page.goto('http://127.0.0.1:18080/welcome/');await expect(page.getByRole('heading',{level:1})).toContainText('COMPANION');await expect(page.locator('.chapter-item')).toHaveCount(12);
 await page.locator('summary').filter({hasText:'ต้องเขียนภาษา C เป็นก่อนหรือไม่?'}).click();await expect(page.getByText('เริ่มจากพื้นฐานได้',{exact:false})).toBeVisible();
 await page.locator('.hero').getByRole('link',{name:'เริ่มคุยกับ C Companion',exact:true}).click();await expect(page).toHaveURL('http://127.0.0.1:18080/chat/');
 }finally{await context.close()}
});

test('chat entry does not load the landing animation bundle',async({page})=>{
 const landing=[];page.on('request',r=>{if(r.url().includes('/welcome/'))landing.push(r.url())});await page.goto('/chat/');await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toBeVisible();expect(landing).toEqual([]);
});

test('data-saving preference starts without motion and still allows an explicit opt-in',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));
 await page.goto('/welcome/');await expect(page.locator('html')).toHaveAttribute('data-motion','off');await expect(page.locator('#learning-scene canvas')).toHaveCount(0);
 await page.getByRole('button',{name:'เปิดการเคลื่อนไหว',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-motion','on');
});


test('home always opens Welcome before entering chat, including returning visitors',async({page,request})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const path of ['/','/index.html','/c-tutor/','/c-tutor']){
  const response=await request.get(path,{maxRedirects:0});
  expect(response.status()).toBe(302);expect(response.headers().location).toBe('/welcome/');expect(response.headers()['cache-control']).toBe('no-store');
 }
 await page.goto('/');await expect(page).toHaveURL(/\/welcome\/$/);
 await expect(page).toHaveTitle('C Companion — เปลี่ยนคำถาม ให้เป็นความเข้าใจ');
 await page.locator('.hero').getByRole('link',{name:'เริ่มคุยกับ C Companion',exact:true}).click();
 await expect(page).toHaveURL(/\/chat\/$/);await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toBeVisible();
 await expect(page).toHaveTitle('C Companion — เปลี่ยนคำถาม ให้เป็นความเข้าใจ');
 await expect(page.locator('link[rel=icon]')).toHaveAttribute('href','/welcome/icon.svg');
 expect((await request.get('/welcome/icon.svg')).headers()['content-type']).toBe('image/svg+xml');
 await page.reload();await expect(page.getByRole('textbox',{name:'คำถามภาษา C'})).toBeVisible();
 await page.getByRole('link',{name:'C Companion หน้าหลัก',exact:true}).click();await expect(page).toHaveURL(/\/welcome\/$/);
 await page.goto('/');await expect(page).toHaveURL(/\/welcome\/$/);
});


test('learning journey explains each step and mobile gallery changes with its controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/welcome/');
 await page.getByRole('button',{name:'โหมดถัดไป'}).click();await expect(page.locator('.tutor-card h3')).toBeInViewport();
 await page.getByRole('button',{name:'ฝึกทำโจทย์',exact:true}).click();await expect(page.locator('.quiz-card h3')).toBeInViewport();
 await page.locator('.quiz-card a').click();await expect(page.getByRole('tab',{name:'ฝึกทำโจทย์'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'ถามคำถาม',exact:true}).click();await expect(page.locator('.ask-card h3')).toBeInViewport();
 await page.getByRole('button',{name:/ค้นเนื้อหาที่เกี่ยวข้อง/}).click();await expect(page.locator('#journey-detail')).toContainText('ไม่ได้ค้นเว็บทั่วไป');
 await page.getByRole('button',{name:/อธิบายตามโหมดที่เลือก/}).focus();await page.keyboard.press('Enter');await expect(page.locator('#journey-detail')).toContainText('บริการ AI');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('oversized brand fits narrow and desktop screens and chat opens without scene loading',async({page})=>{
 await page.route('**/*',route=>{const r=route.request();if(r.resourceType()==='script'&&r.url().includes('/welcome/_next/'))return route.abort();return route.continue()});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/welcome/');
  await expect(page.getByRole('heading',{name:'C COMPANION',exact:true})).toBeVisible();
  const bounds=await page.locator('#hero-title').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.site-header .header-cta')).toBeInViewport();
 }
 await page.locator('.site-header .header-cta').click();await expect(page).toHaveURL(/\/chat\/$/);
});

test('motion control does not cover hero actions on desktop or mobile',async({page})=>{
 for(const width of [320,390,1440]){
 await page.setViewportSize({width,height:844});await page.goto('/welcome/');
 const toggle=await page.locator('.motion-control').boundingBox();
 for(const link of await page.locator('.hero-actions a').all()){
  const rect=await link.boundingBox();expect(rect.x+rect.width<=toggle.x||rect.x>=toggle.x+toggle.width||rect.y+rect.height<=toggle.y||rect.y>=toggle.y+toggle.height).toBe(true);
 }
 }
});

test('cinematic scroll holds the scene, changes chapters and releases to ordinary content',async({page})=>{
 test.setTimeout(60000);
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','on');
 await expect(page.locator('.hero')).toHaveCSS('position','sticky');
 await expect(page.locator('.scene-meter b')).toHaveText('01 / 03');
 await page.evaluate(()=>scrollTo({top:900,behavior:'instant'}));
 await expect(page.locator('.scene-meter b')).toHaveText('02 / 03');
 await expect(page.locator('[data-scene-caption="1"]')).toHaveCSS('opacity','1');
 await expect(page.locator('.scene-enter')).toBeInViewport();
 await expect(page.locator('.hero-content')).toHaveCSS('visibility','hidden');
 await page.evaluate(()=>scrollTo({top:1750,behavior:'instant'}));
 await expect(page.locator('.scene-meter b')).toHaveText('03 / 03');
 await expect(page.locator('[data-scene-caption="2"]')).toHaveCSS('opacity','1',{timeout:15000});
 await page.getByRole('link',{name:'เปิดโลกการเรียนรู้',exact:true}).click();await expect(page.locator('#intro-title')).toBeInViewport({timeout:15000});
 await page.getByRole('button',{name:'ลดการเคลื่อนไหว',exact:true}).click();
 await expect(page.locator('.hero')).toHaveCSS('position','relative');
 await expect(page.locator('.hero-content')).toHaveCSS('visibility','visible');
});

test('short laptop opening keeps the primary and secondary actions above the footer',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/welcome/');
 await expect(page.locator('html')).toHaveAttribute('data-motion','on');
 const footer=await page.locator('.hero-bottom').boundingBox();
 for(const link of await page.locator('.hero-actions a').all()){
  await expect(link).toBeInViewport({ratio:1});const rect=await link.boundingBox();expect(rect.y+rect.height).toBeLessThan(footer.y);
 }
});

test('Mongkoi model loads in a full-viewport scene and cleans up when motion stops',async({page,request})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
 const model=await request.get('/welcome/models/mongkoi-giraffe.glb');expect(model.ok()).toBe(true);
 const bytes=await model.body();expect(bytes.toString('ascii',0,4)).toBe('glTF');
 const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 expect(gltf.nodes.some(n=>n.name==='Thai chest embroidery')).toBe(true);expect(gltf.nodes.some(n=>n.name==='Cube')).toBe(false);
 const textureLoaded=page.waitForResponse(r=>r.url().endsWith('/library-texture-1.jpg')&&r.ok());
 const textureErrors=[];page.on('console',m=>{if(m.type()==='error'&&m.text().includes('texture'))textureErrors.push(m.text())});
 await page.goto('/welcome/');await textureLoaded;await expect(page.locator('#learning-scene')).toHaveClass('scene-ready',{timeout:20000});
 expect(textureErrors).toEqual([]);
 const hero=await page.locator('.hero').boundingBox(),canvas=await page.locator('#learning-scene canvas').boundingBox();
 expect(canvas.width).toBe(hero.width);expect(canvas.height).toBe(hero.height);
 await page.getByRole('button',{name:'ลดการเคลื่อนไหว',exact:true}).click();
 await expect(page.locator('#learning-scene canvas')).toHaveCount(0);await expect(page.locator('.scene-fallback')).toHaveCSS('opacity','1');
});

test('missing mascot model retains the portrait and usable landing',async({page})=>{
 await page.route('**/models/mongkoi-giraffe.glb',route=>route.abort());
 await page.goto('/welcome/');await expect(page.locator('html')).toHaveAttribute('data-motion','on');
 await expect(page.locator('.mongkoi-fallback')).toBeVisible();
 await page.getByRole('tab',{name:'ติวทีละขั้น'}).click();await expect(page.getByRole('tabpanel')).toContainText('i < 3');
 await expect(page.locator('.scene-fallback')).toHaveCSS('opacity','1');
});
