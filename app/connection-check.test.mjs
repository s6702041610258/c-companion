import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConnectionCheck} from './connection-check.mjs';
test('connection check coalesces requests, caches for 30 seconds and never returns provider details',async()=>{
 let calls=0,now=0;const check=createConnectionCheck({base:'https://provider.example/v1',key:'test-secret',now:()=>now,request:async(url,options)=>{calls++;assert.equal(url,'https://provider.example/v1/models');assert.equal(options.redirect,'error');return new Response('{}')}});
 const results=await Promise.all([check(),check(),check()]);assert.equal(calls,1);assert.equal(results[0].status,'reachable');assert.deepEqual(Object.keys(results[0]),['status','checkedAt']);
 now=29000;await check();assert.equal(calls,1);now=30000;await check();assert.equal(calls,2);
});
test('configuration alone does not imply a reachable service',async()=>{
 const missing=createConnectionCheck({base:'',key:'',request:()=>{throw Error('must not fetch')}});assert.equal((await missing()).status,'unconfigured');
 const failure=createConnectionCheck({base:'https://provider.example',key:'secret',request:async()=>{throw Error('private connection detail')}});assert.equal((await failure()).status,'unavailable');
 const denied=createConnectionCheck({base:'https://provider.example',key:'secret',request:async()=>new Response('',{status:401})});assert.equal((await denied()).status,'unavailable');
});
