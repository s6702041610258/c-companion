// Short burst protection for database writes; this is not an AI usage quota.
export function createWriteGuard({now=Date.now,windowMs=60000,limits={chat:{owner:30,global:300},report:{owner:5,global:50}}}={}){
 let window=-1;const counts=new Map();
 return function check(kind,owner){
  const time=now(),bucket=Math.floor(time/windowMs);
  if(bucket!==window){counts.clear();window=bucket}
  const limit=limits[kind];if(!limit)throw Error('Unknown write category');
  const keys=[kind+':all',kind+':'+owner],caps=[limit.global,limit.owner];
  if(keys.some((key,i)=>(counts.get(key)||0)>=caps[i]))throw Object.assign(new Error('ส่งคำขอติดกันมากเกินไป กรุณารอสักครู่แล้วลองใหม่'),{status:429,retryAfter:Math.max(1,Math.ceil(((bucket+1)*windowMs-time)/1000))});
  for(const key of keys)counts.set(key,(counts.get(key)||0)+1);
 };
}
