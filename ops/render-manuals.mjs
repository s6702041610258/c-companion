import {chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:1});
 for(const [source,target] of [
 ['docs/manuals/C-Companion-User-Guide-TH.html','คู่มือการใช้งานและติดตั้งแชทบอท.pdf'],
 ['docs/manuals/C-Companion-Visual-Guide-TH.html','docs/manuals/C-Companion-Visual-Guide-TH.pdf']]){
  await page.goto(pathToFileURL(resolve(source)).href);
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  const overflow=await page.locator('.page').evaluateAll(pages=>pages.flatMap((p,i)=>{
   const footer=p.querySelector('.folio');const content=p.querySelector('.content');
   const cut=footer&&content&&content.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-8;
   return cut||p.scrollHeight>p.clientHeight+1?[i+1]:[];
  }));
  if(overflow.length)throw new Error(`${source}: content overlaps footer on pages ${overflow}`);
  await page.pdf({path:target,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  console.log(`Rendered ${target}`);
 }
 await page.goto(pathToFileURL(resolve('docs/images/c-companion-quick-start.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await page.locator('.infographic').screenshot({path:'docs/images/c-companion-quick-start.png'});
}finally{await browser.close()}
