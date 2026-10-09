import {BotAvatar} from './BotAvatar';
import {preferredReplyLanguage,rememberReplyLanguage,type ReplyLanguage} from './ReplyLanguage';
import {ReportLink} from './ReportLink';
import {useSources,SourcesButton,SourcesPanel} from './SourcesPanel';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Markdown from 'react-markdown';
import {ArrowUp,ArrowUpRight,BookOpen,Check,ChevronRight,Code2,Compass,Copy,GraduationCap,History,LoaderCircle,Menu,MessageCircle,Plus,Search,Target,Trash2,X,PanelRightClose,ExternalLink,AlertCircle,RotateCcw,Sun,Moon} from 'lucide-react';
import '@fontsource/noto-sans-thai/400.css';
import '@fontsource/noto-sans-thai/500.css';
import '@fontsource/noto-sans-thai/600.css';
import '@fontsource/noto-sans-thai/700.css';
import './style.css';
import './theme.css';
import './conversation.css';
import './polish.css';
type Chapter={id:number,title:string,subtitle:string,start:number,end:number};
type Source={page:number,pdfPage:number,chapter:number,title:string,excerpt:string,before?:string,matchedText?:string,after?:string};
type Message={id?:number,role:'user'|'assistant',content:string,sources:Source[],replyLanguage?:ReplyLanguage};
type Chat={id:string,title:string,chapter:number,mode:Mode,replyLanguage?:ReplyLanguage};
type Mode='ask'|'tutor'|'quiz';
const base=location.pathname.startsWith('/c-tutor')?'/c-tutor/':'/';
async function api(path:string,options?:RequestInit){const r=await fetch(base+'api/'+path,{...options,headers:{'Content-Type':'application/json','X-Reply-Language':preferredReplyLanguage(),...options?.headers}});const data=await r.json();if(!r.ok)throw new Error(data.error||'เชื่อมต่อไม่สำเร็จ');return data}
const modes=[{id:'ask' as Mode,title:'ถามคำถาม',icon:MessageCircle},{id:'tutor' as Mode,title:'ติวทีละขั้น',icon:GraduationCap},{id:'quiz' as Mode,title:'ฝึกทำโจทย์',icon:Target}];
type Theme='light'|'dark';
const themeKey='c-companion-theme';
function preferredTheme():Theme{try{const saved=localStorage.getItem(themeKey);if(saved==='light'||saved==='dark')return saved}catch{}return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
const initialTheme=preferredTheme();
document.documentElement.dataset.theme=initialTheme;
function CodeBlock({children,...props}:React.ComponentProps<'pre'>){const [copied,setCopied]=useState(false);const ref=useRef<HTMLPreElement>(null);return <div className="code-wrap"><button className="copy-code" aria-label="คัดลอกโค้ด" onClick={async()=>{try{const text=ref.current?.textContent||'';if(navigator.clipboard)await navigator.clipboard.writeText(text);else {const el=document.createElement('textarea');el.value=text;document.body.append(el);el.select();document.execCommand('copy');el.remove()}setCopied(true);setTimeout(()=>setCopied(false),1800)}catch{setCopied(false)}}}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'คัดลอกแล้ว':'คัดลอก'}</button><pre ref={ref} {...props}>{children}</pre></div>}
function App(){
 const [theme,setTheme]=useState<Theme>(initialTheme);
 const [chapters,setChapters]=useState<Chapter[]>([]),[chats,setChats]=useState<Chat[]>([]),[progress,setProgress]=useState<number[]>([]);
 const [chapter,setChapter]=useState(0),[mode,setMode]=useState<Mode>('ask'),[chatId,setChatId]=useState<string|null>(null);
 const [messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState(''),[answerBusy,setBusy]=useState(false),[error,setError]=useState('');
 const [booting,setBooting]=useState(true),[configured,setConfigured]=useState(false),[sidebar,setSidebar]=useState(false),[library,setLibrary]=useState(false),[search,setSearch]=useState('');
 const [bookPage,setBookPage]=useState<number|null>(null),[deleting,setDeleting]=useState<Chat|'all'|null>(null);
 const [deletePending,setDeletePending]=useState(false),[deleteError,setDeleteError]=useState('');
 const end=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null),controller=useRef<AbortController|null>(null),sending=useRef(false);
 const [replyLanguage,setReplyLanguage]=useState<ReplyLanguage>(preferredReplyLanguage);
 const busy=answerBusy;
 const [queueStage,setQueueStage]=useState('');
 const pendingJob=useRef<string|null>(null);
 const references=useSources(messages,chatId);
 const selected=chapters.find(c=>c.id===chapter),label=selected?.title||'ทุกบทเรียน';
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0d1014':'#147d70')},[theme]);
 function toggleTheme(){setTheme(current=>{const next=current==='dark'?'light':'dark';try{localStorage.setItem(themeKey,next)}catch{}return next})}
 async function refresh(){const b=await api('bootstrap');setChapters(b.chapters);setChats(b.chats);setProgress(b.progress);setConfigured(b.configured)}
 useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setBooting(false));return ()=>controller.current?.abort()},[]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})},[messages,busy]);
 useEffect(()=>{function escape(e:KeyboardEvent){if(e.key==='Escape'){if(bookPage!==null)setBookPage(null);else if(library)setLibrary(false);else if(deleting){if(!deletePending)setDeleting(null)}else if(sidebar)setSidebar(false);else if(references.open)references.close()}}document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape)},[bookPage,library,deleting,deletePending,sidebar,references.open,references.close]);
 useEffect(()=>{
  const dialog=document.querySelector<HTMLElement>('.modal-overlay:last-of-type .modal');
  if(!dialog)return;
  const background=Array.from(document.querySelectorAll<HTMLElement>('.app > .main,.app > .sidebar'));background.forEach(e=>e.inert=true);
  const previous=document.activeElement as HTMLElement;
  const focusables=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,textarea,iframe,[tabindex="0"]'));
  const timer=setTimeout(()=>focusables()[0]?.focus(),0);
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const elements=focusables();const first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}};
  document.addEventListener('keydown',trap);
  return()=>{clearTimeout(timer);background.forEach(e=>e.inert=false);document.removeEventListener('keydown',trap);previous?.focus()};
 },[library,bookPage,deleting]);
 function reset(ch=chapter,nextMode=mode){if(busy)return;setChapter(ch);setMode(nextMode);setChatId(null);setMessages([]);setReplyLanguage(preferredReplyLanguage());setDraft('');setError('');setSidebar(false);setLibrary(false);setTimeout(()=>{if(!document.querySelector('.source-panel[role=dialog]:not([hidden])')&&!document.querySelector('.modal-overlay'))input.current?.focus()},50)}
 async function openChat(chat:Chat){if(busy)return;setError('');setBusy(true);try{const c=await api('chats/'+chat.id);setChatId(c.id);setChapter(c.chapter);setMode(c.mode);setReplyLanguage(c.replyLanguage||'th');setMessages(c.messages);setSidebar(false)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function send(value=draft){
  const text=value.trim();if(!text||sending.current||busy)return;
  controller.current=new AbortController();
  const signal=controller.current.signal;
  let createdChat=false,submitted=false;
  sending.current=true;setBusy(true);setError('');setDraft('');
  let id=chatId;const previous=messages;
  setMessages([...previous,{role:'user',content:text,sources:[]}]);
  try{
   if(!id){const c=await api('chats',{method:'POST',body:JSON.stringify({chapter,mode,replyLanguage}),signal:AbortSignal.timeout(15000)});id=c.id;createdChat=true;setChatId(id)}
   signal.throwIfAborted();
   const bytes=crypto.getRandomValues(new Uint8Array(16));const requestKey=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/,'$1-$2-$3-$4-$5');
   // Keep the submission response so cancellation can address the actual server job.
   let job=await api('chats/'+id+'/messages',{method:'POST',body:JSON.stringify({message:text,async:true,requestKey}),signal:AbortSignal.timeout(15000)});
   submitted=true;
   pendingJob.current=job.id;
   signal.throwIfAborted();
   let failedPolls=0;
   while(!['completed','failed','cancelled'].includes(job.status)){
    setQueueStage(replyLanguage==='en'?(job.status==='queued'?'Waiting in the queue…':'Reading and preparing your answer…'):(job.status==='queued'?'กำลังรอคิว ผู้ช่วยจะตอบให้อัตโนมัติ…':'กำลังอ่านเนื้อหาและเรียบเรียงคำอธิบาย…'));
    await new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new DOMException('Aborted','AbortError'));return}const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},1000);signal.addEventListener('abort',abort,{once:true})});
    try{job=await api('jobs/'+job.id,{signal});failedPolls=0}catch(e){if(signal.aborted||++failedPolls>=5)throw e;setQueueStage(replyLanguage==='en'?'Reconnecting. Your question is still being processed…':'กำลังเชื่อมต่ออีกครั้ง คำถามยังอยู่ในระบบ…')}
   }
   if(job.status!=='completed')throw new Error(job.error||'ยังตอบไม่ได้ กรุณาลองใหม่');
   const answer=job.result;
   if(answer.preferredLanguage==='th'||answer.preferredLanguage==='en'){
    setReplyLanguage(answer.preferredLanguage);
    if(answer.preferredLanguage!==replyLanguage){rememberReplyLanguage(answer.preferredLanguage)}
   }
   pendingJob.current=null;
   setMessages([...previous,{role:'user',content:text,sources:[]},answer]);
   await refresh().catch(()=>{});
  }catch(e){if(pendingJob.current)await api('jobs/'+pendingJob.current,{method:'DELETE'}).catch(()=>{});
   if(signal.aborted&&createdChat&&!submitted&&id){await api('chats/'+id,{method:'DELETE'}).catch(()=>{});setChatId(null)}
   setMessages(previous);setDraft(text);setError(signal.aborted||(e as Error).name==='AbortError'?(replyLanguage==='en'?'Answer cancelled. You can edit and resend your question.':'หยุดรอคำตอบแล้ว คุณแก้คำถามและส่งใหม่ได้'):(e as Error).message)}
  finally{sending.current=false;setBusy(false);controller.current=null;pendingJob.current=null;setQueueStage('');setTimeout(()=>{if(!document.querySelector('.source-panel[role=dialog]:not([hidden])')&&!document.querySelector('.modal-overlay'))input.current?.focus()},50)}
 }
 const suggestions=selected?['อธิบายเรื่อง'+selected.title+' แบบเข้าใจง่าย','ยกตัวอย่างโค้ดในบทที่ '+selected.id,'จุดที่มักสับสนในบทนี้คืออะไร']:['ตัวแปร int กับ float ต่างกันอย่างไร','ลูป for ทำงานอย่างไร อธิบายทีละขั้น','พอยน์เตอร์คืออะไร ช่วยยกตัวอย่าง'];
 return <div className="app">
  <a className="skip-link" href="#chat-main">ข้ามไปพื้นที่แชท</a>
  {sidebar&&<button className="sidebar-scrim" aria-label="ปิดเมนู" onClick={()=>setSidebar(false)}/>}
  <aside id="main-navigation" aria-label="เมนูหลัก" className={'sidebar '+(sidebar?'is-open':'')}>
   <a className="brand" href={base} aria-label="C Companion หน้าหลัก"><span className="brand-mark"><BotAvatar/></span><span>C Companion<small>เพื่อนติวภาษา C ของคุณ</small></span></a>
   <button className="new-chat" onClick={()=>reset(0)} disabled={busy}><Plus size={18}/>เริ่มบทสนทนาใหม่</button>
   <div className="nav-caption">พื้นที่การเรียนรู้</div>
   <button className={'nav-item '+(!library?'active':'')} onClick={()=>setLibrary(false)}><MessageCircle size={18}/>ห้องติว<span className="nav-dot"/></button>
   <button className="nav-item" onClick={()=>{setLibrary(true);setSidebar(false)}}><BookOpen size={18}/>บทเรียนทั้งหมด<span className="count">12</span></button>
   <div className="history-heading"><span><History size={15}/> บทสนทนาล่าสุด</span><span>{chats.length}</span></div>
   {chats.length>0&&<button className="clear-history" disabled={busy} onClick={()=>{setDeleteError('');setDeleting('all')}}><Trash2 size={14}/>ลบประวัติทั้งหมด</button>}
   <div className="history-list">{chats.length===0?<p className="history-empty">คำถามแรกของคุณ<br/>จะเริ่มเรื่องราวตรงนี้</p>:chats.slice(0,15).map(c=><div key={c.id} className={'history-row '+(c.id===chatId?'selected':'')}><button disabled={busy} onClick={()=>openChat(c)} title={c.title}>{c.title}</button><button className="delete-chat" aria-label={'ลบ '+c.title} disabled={busy} onClick={()=>{setDeleteError('');setDeleting(c)}}><Trash2 size={14}/></button></div>)}</div>
   <div className="sidebar-book"><div className="little-book"><span>C</span><i>COMPANION</i></div><div><strong>เรียนจากหนังสือเล่มเดียวกัน</strong><p>12 บท · 113 หน้า PDF</p><button onClick={()=>setBookPage(1)}>เปิดหนังสือ <ArrowUpRight size={14}/></button></div></div>
   <ReportLink className="nav-item report-nav" onClick={()=>setSidebar(false)}/><div className="sidebar-footer"><span className="avatar">C</span><div>พื้นที่เรียนรู้<small>ประวัติเก็บแยกในเบราว์เซอร์นี้</small></div><span className="version-badge">1.7.1</span></div>
  </aside>
  <main className="main" id="chat-main" tabIndex={-1}>
   <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="เปิดเมนู" aria-expanded={sidebar} aria-controls="main-navigation" onClick={()=>setSidebar(true)}><Menu size={20}/></button><span className="desktop-icon header-portrait"><BotAvatar/></span><span>ห้องติว</span><ChevronRight size={14}/><button onClick={()=>setLibrary(true)}>{label}</button></div><div className="topbar-actions"><SourcesButton panel={references}/><button className="book-button" aria-label="เปิดหนังสือ" onClick={()=>setBookPage(selected?selected.start+5:1)}><BookOpen size={16}/><span>เปิดหนังสือ</span></button><button className="theme-toggle" type="button" aria-label={theme==='dark'?'เปลี่ยนเป็นโหมดสว่าง':'เปลี่ยนเป็นโหมดมืด'} title={theme==='dark'?'เปลี่ยนเป็นโหมดสว่าง':'เปลี่ยนเป็นโหมดมืด'} onClick={toggleTheme}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}<span>{theme==='dark'?'โหมดสว่าง':'โหมดมืด'}</span></button></div></header>
   {booting?<div className="boot-loading"><LoaderCircle className="spin"/> กำลังเตรียมห้องเรียน...</div>:<div className={'workspace '+(references.open?'has-source':'')}>
    <section className="learning">
     <div className="chat-scroll">
      {messages.length===0?<div className="welcome">
       <div className="welcome-intro"><div className="welcome-copy">
        <div className="welcome-eyebrow"><span className="status-dot"/>{configured?'พร้อมเรียนรู้ไปด้วยกัน':'อ่านหนังสือได้ · รอเชื่อมต่อ AI'}</div>
        <h1>ภาษา C เข้าใจได้<br/><span>ทีละคำถาม ทีละก้าว</span></h1>
        <p className="welcome-description">ถามสิ่งที่สงสัย ลองเขียนโค้ด แล้วค่อย ๆ<br className="desktop-break"/> หาคำตอบจากหนังสือไปด้วยกัน</p>
       </div><div className="companion-scene" aria-hidden="true"><div className="scene-orbit"/><div className="scene-portrait"><BotAvatar/></div><span className="scene-icon scene-code"><Code2 size={24}/></span><span className="scene-icon scene-book"><BookOpen size={23}/></span><span className="scene-caption">C Companion</span></div></div>
       <div className="feature-study">
        <div className="study-copy"><span className="study-tag"><BookOpen size={15}/> หนังสือของห้องเรียนนี้</span><h2>{selected?selected.title:'จากบรรทัดแรก สู่ความเข้าใจ'}</h2><p>{selected?selected.subtitle:'ตัวแปร เงื่อนไข ลูป และอีกหลายเรื่องที่คุณทำได้'}</p><button onClick={()=>selected?send('ช่วยเริ่มติวบทที่ '+chapter+' แบบง่าย ๆ'):setLibrary(true)} disabled={busy}>{selected?'เริ่มเรียนบทนี้':'เลือกบทที่อยากเรียน'} <ArrowUpRight size={17}/></button></div>
        <div className="code-illustration" aria-label="ตัวอย่างโปรแกรม Hello World"><div className="editor-heading"><span/><span/><span/><small>hello.c</small></div><div className="sample-code"><div><i>1</i><b>#include</b> <em>&lt;stdio.h&gt;</em></div><div><i>2</i></div><div><i>3</i><b>int</b> main(<b>void</b>) {'{'}</div><div><i>4</i>　printf(<em>"Hello, learner!\n"</em>);</div><div><i>5</i>　<b>return</b> <strong>0</strong>;</div><div><i>6</i>{'}'}</div></div><div className="code-output"><span><Check size={13}/> ก้าวแรกของคุณ</span><code>Hello, learner!</code></div></div>
       </div>
       <div className="suggestion-heading"><span>เริ่มจากคำถามเล็ก ๆ ก็ได้</span></div>
       <div className="suggestions">{suggestions.map((q,i)=><button key={q} disabled={busy||!configured} onClick={()=>send(q)}><span className="suggestion-icon">{i===0?<Code2 size={19}/>:i===1?<RotateCcw size={18}/>:<Search size={18}/>}</span><span>{q}</span><ArrowUpRight size={15}/></button>)}</div>
       <div className="trust-note"><BookOpen size={14}/> ค้นจากหนังสือก่อนตอบ พร้อมแหล่งอ้างอิงให้เปิดอ่าน</div><p className="language-help">พิมพ์ “ตอบเป็นอังกฤษ” หรือ “ตอบเป็นไทย” เพื่อเปลี่ยนภาษาได้เลย</p>
      </div>:<div className="messages"><div className="conversation-context"><span><BookOpen size={14}/>{label}</span><span>{modes.find(m=>m.id===mode)?.title}</span><button disabled={busy} onClick={()=>reset()}>เริ่มใหม่ <Plus size={14}/></button></div>{messages.map((m,i)=><article key={i} className={'message '+m.role}><div className={'message-avatar '+m.role}>{m.role==='assistant'?<BotAvatar/>:<span>คุณ</span>}</div><div className="message-body">{m.role==='assistant'&&<div className="message-author">C Companion</div>}<div className="prose" lang={m.role==='assistant'?m.replyLanguage:undefined}><Markdown components={{pre:CodeBlock}}>{m.content}</Markdown></div>{m.sources?.length>0&&<div className="citation-list"><span>อ่านต่อในหนังสือ</span>{m.sources.map(s=><button key={s.page} onClick={()=>references.openSource(i,s.page)}><BookOpen size={13}/> หน้า {s.page}<ArrowUpRight size={12}/></button>)}</div>}{m.role==='assistant'&&m.id&&<ReportLink answer className="report-answer"/>}</div></article>)}{busy&&<div className="thinking" role="status"><span className="message-avatar assistant"><BotAvatar/></span><div><span className="thinking-dots"><i/><i/><i/></span><p>{queueStage||(replyLanguage==='en'?'Sending your question…':'กำลังส่งคำถาม…')}</p></div></div>}<div ref={end}/></div>}
     </div>
     <div className="composer-area">
      {error&&<div className="error-message" role="alert"><AlertCircle size={17}/><span>{error}</span><button aria-label="ปิดข้อความแจ้งเตือน" onClick={()=>setError('')}><X size={16}/></button></div>}
      <div className="mode-toolbar"><div className="mode-tabs" role="group" aria-label="รูปแบบการเรียน">{modes.map(m=><button key={m.id} aria-pressed={mode===m.id} disabled={busy} className={mode===m.id?'active':''} onClick={()=>{if(chatId)reset(chapter,m.id);else setMode(m.id)}}><m.icon size={16}/>{m.title}</button>)}</div><button className="chapter-selector" disabled={busy} onClick={()=>setLibrary(true)}><BookOpen size={14}/><span>{chapter?'บทที่ '+chapter:'ทุกบท'}</span><ChevronRight size={13}/></button></div>
      {mode==='quiz'&&<p className="mode-hint"><Target size={15}/>{replyLanguage==='en'?'Try the exercise first. Then I can review your answer and explain the solution.':'ลองตอบโจทย์ก่อน แล้วระบบจะตรวจคำตอบและอธิบายเฉลยหลังคุณส่งคำตอบ'}</p>}
      <form className={'composer '+(busy?'is-busy':'')} onSubmit={e=>{e.preventDefault();send()}}><label className="sr-only" htmlFor="question">คำถามภาษา C</label><textarea ref={input} id="question" rows={2} maxLength={3000} value={draft} disabled={busy||!configured} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}} placeholder={replyLanguage==='en'?(mode==='quiz'?'Choose a topic, e.g. give me a loop exercise':mode==='tutor'?'What would you like to learn step by step?':'Ask about C programming…'):mode==='quiz'?'อยากฝึกเรื่องไหน? เช่น ขอแบบฝึกหัดเรื่องลูป':mode==='tutor'?'เรื่องไหนที่ยังไม่เข้าใจ? เราจะค่อย ๆ เรียนไปด้วยกัน':'ถามเรื่องภาษา C ได้เลย เช่น ทำไมลูปนี้ถึงไม่หยุด...'}/><div className="composer-bottom"><span>{draft.length>2700?draft.length+'/3,000':(replyLanguage==='en'?'English replies · Book references':'อธิบายเป็นภาษาไทย · อ้างอิงจากหนังสือ')}</span>{answerBusy?<button type="button" className="stop-button" aria-label="หยุดรอคำตอบ" onClick={()=>controller.current?.abort()}><span/></button>:<button className="send-button" type="submit" disabled={busy||!draft.trim()||!configured} aria-label="ส่งคำถาม"><ArrowUp size={21}/></button>}</div></form>
      <p className="composer-note">AI อาจตอบคลาดเคลื่อน ตรวจสอบกับหนังสือก่อนนำไปใช้ <span>Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</span></p>
     </div>
    </section>
    <SourcesPanel panel={references} onBook={setBookPage}/>
   </div>}
  </main>
  {library&&<div className="modal-overlay" onClick={()=>setLibrary(false)}><section className="library modal" role="dialog" aria-modal="true" aria-labelledby="library-title" onClick={e=>e.stopPropagation()}><header><div><span className="modal-kicker">เลือกจุดเริ่มต้นของคุณ</span><h2 id="library-title">วันนี้อยากเรียนเรื่องอะไร?</h2></div><button className="icon-button" autoFocus aria-label="ปิดบทเรียน" onClick={()=>setLibrary(false)}><X/></button></header><p>เรียนตามลำดับ หรือเลือกเรื่องที่สงสัยได้เลย · เปิดเรียนแล้ว {progress.length} / 12 บท</p><label className="library-search"><Search size={18}/><input aria-label="ค้นหาบทเรียน" placeholder="ค้นหาบทเรียน เช่น ลูป พอยน์เตอร์" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="chapter-grid">{chapters.filter(c=>(c.title+c.subtitle+c.id).toLowerCase().includes(search.toLowerCase())).map(c=><button className={'chapter-card '+(c.id===chapter?'selected':'')} key={c.id} disabled={busy} onClick={()=>reset(c.id)}><span className="chapter-number">{String(c.id).padStart(2,'0')}</span><div><h3>{c.title}</h3><p>{c.subtitle}</p><small>หน้า {c.start}–{c.end}{progress.includes(c.id)&&' · เคยเปิดเรียน'}</small></div><ChevronRight size={18}/></button>)}</div><button className="all-chapters" disabled={busy} onClick={()=>reset(0)}>ถามได้จากทุกบทเรียน <ArrowUpRight size={16}/></button></section></div>}
  {bookPage!==null&&<div className="modal-overlay"><section className="book-modal modal" role="dialog" aria-modal="true" aria-label="หนังสือ C Companion"><header><div><BookOpen size={19}/><strong>C Companion</strong><span>PDF หน้า {bookPage}</span></div><div><a className="icon-button" href={base+'book.pdf#page='+bookPage} target="_blank" rel="noreferrer" aria-label="เปิด PDF ในแท็บใหม่"><ExternalLink size={18}/></a><button className="icon-button" autoFocus aria-label="ปิดหนังสือ" onClick={()=>setBookPage(null)}><X size={20}/></button></div></header><iframe title="หนังสือภาษา C" src={base+'book.pdf#page='+bookPage}/><div className="book-fallback"><span>หาก PDF แสดงไม่ครบหรือเป็นพื้นที่สีดำ</span><a href={base+'book.pdf#page='+bookPage} target="_blank" rel="noreferrer">เปิด PDF ในแท็บใหม่ <ExternalLink size={15}/></a></div></section></div>}
  {deleting&&<div className="modal-overlay"><section className="confirm modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" aria-busy={deletePending}><h2 id="delete-title">{deleting==='all'?'ลบประวัติทั้งหมด?':'ลบบทสนทนานี้?'}</h2><p id="delete-description">{deleting==='all'?'บทสนทนาทั้งหมดของคุณในเบราว์เซอร์นี้จะถูกลบ รวมถึงรายการที่ไม่ได้แสดงในแถบเมนู และไม่สามารถเรียกคืนผ่านหน้าเว็บได้':`“${deleting.title}” จะถูกลบออกจากประวัติ`}</p>{deleteError&&<p className="delete-error" role="alert">{deleteError}</p>}<div><button autoFocus disabled={deletePending} onClick={()=>setDeleting(null)}>เก็บไว้</button><button className="danger" disabled={deletePending} onClick={async()=>{setDeletePending(true);setDeleteError('');try{await api(deleting==='all'?'chats':'chats/'+deleting.id,{method:'DELETE'});if(deleting==='all'||chatId===deleting.id)reset();setChats(current=>deleting==='all'?[]:current.filter(c=>c.id!==deleting.id));setDeleting(null);await refresh()}catch(e){setDeleteError((e as Error).message)}finally{setDeletePending(false)}}}>{deletePending?'กำลังลบ…':deleting==='all'?'ยืนยันลบทั้งหมด':'ลบบทสนทนา'}</button></div></section></div>}

 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
