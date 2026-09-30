import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {BookOpen,Check,ExternalLink,PanelRightClose,PanelRightOpen} from 'lucide-react';

type Source={page:number,pdfPage:number,chapter:number,title:string,excerpt:string,before?:string,matchedText?:string,after?:string};
type Message={role:'user'|'assistant',content:string,sources:Source[]};
type PanelState={index:number,page:number,open:boolean,seen:number};
export function useSources(messages:Message[],chatId:string|null){
 const key=chatId||'new';
 const [saved,setSaved]=useState<Record<string,PanelState>>({});
 const latest=messages.reduce((found,m,i)=>m.sources?.length?i:found,-1);
 const fallback:PanelState={index:latest,page:messages[latest]?.sources[0]?.page||0,open:true,seen:latest};
 const state=saved[key]||fallback;
 const group=messages[state.index]?.sources?.length?messages[state.index].sources:messages[latest]?.sources||[];
 const source=group.find(s=>s.page===state.page)||group[0]||null;
 const open=!!source&&state.open;
 const update=(change:Partial<PanelState>)=>setSaved(prev=>({...prev,[key]:{...(prev[key]||fallback),...change}}));
 useEffect(()=>{if(latest>=0)setSaved(prev=>!prev[key]||latest>prev[key].seen?{...prev,[key]:{index:latest,page:messages[latest].sources[0].page,open:true,seen:latest}}:prev)},[key,latest]);
 const toggleRef=useRef<HTMLButtonElement>(null);
 const close=()=>{update({open:false});requestAnimationFrame(()=>toggleRef.current?.focus({preventScroll:true}))};
 return {
  source,group,open,available:latest>=0,unread:latest>state.seen,
  scrollKey:key+':'+state.index+':'+(source?.page||0),toggleRef,
  question:messages[state.index-1]?.role==='user'?messages[state.index-1].content:'',
  close,
  toggle:()=>open?close():update({open:true}),
  selectPage:(page:number)=>update({page}),
  openSource:(index:number,page:number)=>update({index,page,open:true,seen:Math.max(state.seen,index)}),
  showLatest:()=>update({index:latest,page:messages[latest]?.sources[0]?.page||0,seen:latest,open:true})
 };
}
type Controller=ReturnType<typeof useSources>;
export function SourcesButton({panel}:{panel:Controller}){
 return <button ref={panel.toggleRef} className={'sources-toggle '+(panel.open?'active':'')} aria-label={panel.open?'ย่อแหล่งอ้างอิง':'เปิดแหล่งอ้างอิง'} aria-expanded={panel.open} aria-controls="reference-panel" disabled={!panel.available} title={panel.available?'แหล่งอ้างอิงของคำตอบ':'แหล่งอ้างอิงจะแสดงเมื่อได้รับคำตอบ'} onClick={panel.toggle}><PanelRightOpen size={17}/><span>แหล่งอ้างอิง</span>{panel.available&&<span className="source-count">{panel.group.length}</span>}{panel.unread&&<span className="source-unread" role="status" aria-label="มีแหล่งอ้างอิงจากคำตอบใหม่"/>}</button>;
}
export function SourcesPanel({panel,onBook}:{panel:Controller,onBook:(page:number)=>void}){
 const scroll=useRef<HTMLDivElement>(null),container=useRef<HTMLElement>(null);
 const positions=useRef(new Map<string,number>());
 const gesture=useRef<{x:number,y:number}|null>(null);
 const [compact,setCompact]=useState(()=>window.matchMedia('(max-width:1000px)').matches);
 useEffect(()=>{const mq=window.matchMedia('(max-width:1000px)');const fn=()=>setCompact(mq.matches);mq.addEventListener('change',fn);return()=>mq.removeEventListener('change',fn)},[]);
 useLayoutEffect(()=>{if(panel.open&&scroll.current)scroll.current.scrollTop=positions.current.get(panel.scrollKey)||0},[panel.open,panel.scrollKey]);
 useEffect(()=>{
  if(!compact||!panel.open)return;
  container.current?.querySelector<HTMLButtonElement>('.source-close')?.focus({preventScroll:true});
  const trap=(e:KeyboardEvent)=>{
   if(e.key!=='Tab'||document.querySelector('.modal-overlay'))return;
   const items=Array.from(container.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]')||[]);
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  };
  document.addEventListener('keydown',trap);return()=>document.removeEventListener('keydown',trap);
 },[compact,panel.open]);
 if(!panel.source)return null;
 const source=panel.source;
 return <>
  {compact&&panel.open&&<button className="source-scrim" tabIndex={-1} aria-label="ย่อแผงอ้างอิง" onClick={panel.close}/>}
  <aside id="reference-panel" ref={container} className="source-panel" hidden={!panel.open} role={compact?'dialog':undefined} aria-modal={compact?true:undefined} aria-labelledby="reference-heading">
   <header onTouchStart={e=>{if(compact){const t=e.touches[0];gesture.current={x:t.clientX,y:t.clientY}}}} onTouchEnd={e=>{const start=gesture.current;gesture.current=null;const t=e.changedTouches[0];if(start&&t.clientX-start.x>70&&Math.abs(t.clientY-start.y)<50)panel.close()}}>
    <span id="reference-heading"><BookOpen size={17}/> แหล่งอ้างอิง</span><button className="icon-button source-close" aria-label="ย่อแผงอ้างอิง" onClick={panel.close}><PanelRightClose size={19}/></button>
   </header>
   <div className="source-scroll" ref={scroll} onScroll={e=>{if(panel.open)positions.current.set(panel.scrollKey,e.currentTarget.scrollTop)}}>
    <div className="source-content">
     {panel.unread&&<button className="new-reference" onClick={panel.showLatest}>มีอ้างอิงจากคำตอบใหม่ <span>เปิดดู</span></button>}
     <p className="source-question" title={panel.question}>อ้างอิงสำหรับ: {panel.question||'คำตอบที่เลือก'}</p>
     <nav className="source-page-tabs" aria-label="หน้าอ้างอิงของคำตอบ">{panel.group.map(s=><button key={s.page} aria-pressed={source.page===s.page} onClick={()=>panel.selectPage(s.page)}>หน้า {s.page}</button>)}</nav>
     <span className="source-label">จากหนังสือ C Companion</span><h2>{source.title}</h2><div className="page-pill">บทที่ {source.chapter} <span/> หน้า {source.page}</div><blockquote>{source.matchedText?<>{source.before} <mark>{source.matchedText}</mark> {source.after}</>:<>{source.excerpt}…</>}</blockquote>
     <p className="source-help">ข้อความต้นฉบับจากหน้าที่ใช้ตอบ เปิดหนังสือเพื่ออ่านเนื้อหาและตัวอย่างครบถ้วน</p><button className="primary-button" onClick={()=>onBook(source.pdfPage)}>เปิดหน้าที่ {source.page} <ExternalLink size={15}/></button><div className="source-footer"><Check size={15}/> เลขหน้าอ้างอิงผ่านการตรวจสอบ</div>
    </div>
   </div>
  </aside>
 </>;
}
