// A bounded, cached service check. It does not generate answers or disclose provider details.
export function createConnectionCheck({base,key,request=fetch,now=Date.now}){
 let saved=null,pending=null;
 return async()=>{
  if(!base||!key)return {status:'unconfigured',checkedAt:null};
  if(saved&&now()-saved.time<30000)return saved.value;
  if(pending)return pending;
  pending=(async()=>{
   let status='unavailable';
   try{const response=await request(base+'/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(5000),redirect:'error'});status=response.ok?'reachable':'unavailable';await response.body?.cancel()}catch{}
   const value={status,checkedAt:new Date(now()).toISOString()};saved={time:now(),value};return value;
  })();
  try{return await pending}finally{pending=null}
 };
}
