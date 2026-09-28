import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';

test('provider failure and invalid citations preserve history and recover without restart',async({request})=>{
 const {id}=await (await request.post('/api/chats',{data:{mode:'ask'}})).json();
 try{
  for(const message of ['พอยน์เตอร์ จำลองเซิร์ฟเวอร์ล้ม','พอยน์เตอร์ จำลองอ้างอิงผิด']){
   const r=await request.post(`/api/chats/${id}/messages`,{data:{message}});expect(r.status()).toBe(502);expect(await r.text()).not.toContain('private-provider-error-secret');
   expect((await (await request.get('/api/chats/'+id)).json()).messages).toEqual([]);
  }
  const retry=await request.post(`/api/chats/${id}/messages`,{data:{message:'พอยน์เตอร์คืออะไร'}});expect(retry.status()).toBe(200);
  expect((await (await request.get('/api/chats/'+id)).json()).messages).toHaveLength(2);
 }finally{await request.delete('/api/chats/'+id)}
});

test('20 concurrent sessions keep responses separate while health stays responsive',async({playwright,baseURL})=>{
 const clients=await Promise.all(Array.from({length:20},()=>playwright.request.newContext({baseURL})));const chats=[];let peak=0;const healthMs=[];let sampling=true;
 const sample=(async()=>{while(sampling){const t=performance.now();const h=await clients[0].get('/api/health');healthMs.push(performance.now()-t);const state=await h.json();peak=Math.max(peak,state.queue.active);expect(h.status()).toBe(200);await new Promise(r=>setTimeout(r,40))}})();
 try{
  await Promise.all(clients.map(async(client,i)=>{
   const {id}=await (await client.post('/api/chats',{data:{mode:'ask'}})).json();chats[i]=id;
   const key=randomUUID();const send=()=>client.post(`/api/chats/${id}/messages`,{data:{message:'พอยน์เตอร์ load-case-'+i,requestKey:key,async:true}});
   const first=await send();const job=await first.json();expect(first.status()).toBe(202);
   expect((await (await send()).json()).id).toBe(job.id);
   await expect.poll(async()=>(await (await client.get('/api/jobs/'+job.id)).json()).status,{timeout:15000}).toBe('completed');
   const messages=(await (await client.get('/api/chats/'+id)).json()).messages;expect(messages).toHaveLength(2);expect(messages[1].content).toBe('คำตอบสำหรับ load-case-'+i);
  }));
  expect(peak).toBe(2);expect(Math.max(...healthMs)).toBeLessThan(1500);
  console.log(JSON.stringify({scenario:'20-session-local-http',peakWorkers:peak,healthMaxMs:Math.round(Math.max(...healthMs)),healthSamples:healthMs.length}));
 }finally{sampling=false;await sample;for(const [i,client] of clients.entries()){if(chats[i])await client.delete('/api/chats/'+chats[i]);await client.dispose()}}
});
