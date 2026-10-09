import {useEffect,useRef,useState} from 'react';
import {Search,Trash2} from 'lucide-react';
type Chat={id:string,title:string,chapter:number,mode:'ask'|'tutor'|'quiz',created?:string};
type Page={chats:Chat[],nextCursor:string|null};
export function HistoryList({initial,active,busy,onOpen,onDelete,base}:{initial:Chat[],active:string|null,busy:boolean,onOpen:(chat:Chat)=>void,onDelete:(chat:Chat)=>void,base:string}){
 const [query,setQuery]=useState(''),[page,setPage]=useState<Page>({chats:initial,nextCursor:null}),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const controller=useRef<AbortController|null>(null),generation=useRef(0);
 useEffect(()=>{
  controller.current?.abort();const seq=++generation.current;setLoading(true);setError('');
  if(!query)setPage({chats:initial,nextCursor:null});else setPage({chats:[],nextCursor:null});
  const timer=setTimeout(()=>{void load('',false,seq)},query?250:0);
  return()=>{clearTimeout(timer);controller.current?.abort()};
 },[query,initial,retry]);
 async function load(cursor:string,append:boolean,seq=generation.current){
  controller.current?.abort();const request=new AbortController();controller.current=request;setLoading(true);setError('');
  try{const r=await fetch(base+'api/chats?'+new URLSearchParams({q:query,cursor}),{signal:request.signal});if(!r.ok)throw Error();const data:Page=await r.json();if(seq!==generation.current)return;
   setPage(current=>({chats:append?[...current.chats,...data.chats.filter(c=>!current.chats.some(old=>old.id===c.id))]:data.chats,nextCursor:data.nextCursor}));
  }catch{if(!request.signal.aborted&&seq===generation.current)setError('โหลดประวัติไม่สำเร็จ')}
  finally{if(!request.signal.aborted&&seq===generation.current)setLoading(false)}
 }
 function day(created?:string){if(!created)return 'บทสนทนา';const d=new Date(created);if(Number.isNaN(d.getTime()))return 'บทสนทนา';const today=new Date(),yesterday=new Date();yesterday.setDate(today.getDate()-1);return d.toDateString()===today.toDateString()?'วันนี้':d.toDateString()===yesterday.toDateString()?'เมื่อวาน':d.toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})}
 return <><label className="history-search"><Search size={16}/><input aria-label="ค้นหาประวัติ" placeholder="ค้นหาชื่อบทสนทนา" maxLength={100} value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <div className="history-list" aria-busy={loading}>{page.chats.map((c,i)=><div key={c.id}>{(i===0||day(page.chats[i-1].created)!==day(c.created))&&<p className="history-day">{day(c.created)}</p>}<div className={'history-row '+(c.id===active?'selected':'')}><button disabled={busy} onClick={()=>onOpen(c)} title={c.title}>{c.title}</button><button className="delete-chat" aria-label={'ลบ '+c.title} disabled={busy} onClick={()=>onDelete(c)}><Trash2 size={14}/></button></div></div>)}
   {!loading&&!error&&!page.chats.length&&<p className="history-empty">{query?'ไม่พบชื่อบทสนทนาที่ค้นหา':'คำถามแรกของคุณจะปรากฏที่นี่'}</p>}
   {error&&<p className="history-error" role="status">{error} <button onClick={()=>page.nextCursor?load(page.nextCursor,true):setRetry(v=>v+1)}>ลองใหม่</button></p>}
   {loading&&<p className="history-empty" role="status">กำลังโหลดประวัติ…</p>}
   {page.nextCursor&&!loading&&<button className="history-more" onClick={()=>load(page.nextCursor!,true)}>ดูบทสนทนาเก่ากว่านี้</button>}
  </div></>;
}
