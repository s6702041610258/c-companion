export class WorkQueue{
 constructor({concurrency=2,capacity=100}={}){this.concurrency=concurrency;this.capacity=capacity;this.active=0;this.waiting=[]}
 run(task,{signal,onStart=()=>{}}={}){
  if(signal?.aborted)return Promise.reject(signal.reason);
  if(this.waiting.length>=this.capacity)return Promise.reject(Object.assign(new Error('คิวเต็มชั่วคราว กรุณาลองอีกครั้ง'),{status:503}));
  return new Promise((resolve,reject)=>{
   const item={task,resolve,reject,signal,onStart,abort:null};
   item.abort=()=>{const i=this.waiting.indexOf(item);if(i>=0){this.waiting.splice(i,1);reject(signal.reason)}};
   signal?.addEventListener('abort',item.abort,{once:true});this.waiting.push(item);this.drain();
  });
 }
 drain(){while(this.active<this.concurrency&&this.waiting.length){const x=this.waiting.shift();x.signal?.removeEventListener('abort',x.abort);if(x.signal?.aborted){x.reject(x.signal.reason);continue}this.active++;Promise.resolve().then(()=>{x.onStart();return x.task()}).then(x.resolve,x.reject).finally(()=>{this.active--;this.drain()})}}
}
