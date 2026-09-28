import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {retrieve} from '../app/retrieval.mjs';
import {overviewContexts} from '../app/overview.mjs';

const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url)));
const cases=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url)));
const covered=new Set(cases.map(item=>item.chapter).filter(Boolean));
assert.deepEqual([...covered].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i+1));

let failures=0;
for(const item of cases){
 const found=overviewContexts(pages,item.question,retrieve(pages,item.question));
 try{
  if(item.outOfScope){assert.equal(found.length,0,'out-of-scope question retrieved book pages')}
  else{
   assert.ok(found.some(page=>item.pages.includes(page.page)),`missing expected book page among ${found.map(page=>page.page)}`);
   if(item.firstPage)assert.equal(found[0]?.page,item.firstPage,'wrong strongest evidence');
  }
  console.log(`PASS ${item.id}`);
 }catch(error){failures++;console.error(`FAIL ${item.id}: ${error.message}`)}
}
console.log(`${cases.length-failures}/${cases.length} retrieval cases passed`);
if(failures)process.exitCode=1;
