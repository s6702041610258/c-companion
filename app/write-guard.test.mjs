import test from 'node:test';import assert from 'node:assert/strict';import {createWriteGuard} from './write-guard.mjs';
test('write burst protection isolates sessions, returns retry delay, and recovers',()=>{
 let now=0;const check=createWriteGuard({now:()=>now,limits:{chat:{owner:2,global:4}}});
 check('chat','a');check('chat','a');assert.throws(()=>check('chat','a'),e=>e.status===429&&e.retryAfter===60);check('chat','b');
 now=60000;check('chat','a');
});
test('rotating anonymous cookies does not evade global database write protection',()=>{
 const check=createWriteGuard({limits:{chat:{owner:2,global:3}}});
 for(let i=0;i<3;i++)check('chat',String(i));assert.throws(()=>check('chat','new-cookie'),e=>e.status===429);
});
