import React,{useId,useRef,useState,useEffect} from 'react';
import {Check,Copy,ChevronDown,ChevronUp} from 'lucide-react';

// Small C lexer: render text as React nodes, never interpret learner code as HTML.
function highlightC(text:string){
 const pattern=/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|^[ \t]*#[^\n]*|\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|_Bool|NULL)\b|\b(?:0[xX][\da-fA-F]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)[uUlLfF]*\b)/gm;
 const nodes:React.ReactNode[]=[];let last=0;
 for(const match of text.matchAll(pattern)){
  const index=match.index!;if(index>last)nodes.push(text.slice(last,index));
  const token=match[0],kind=token.startsWith('/')?'comment':/^["']/.test(token)?'string':token.trimStart().startsWith('#')?'directive':/^\d/.test(token)?'number':'keyword';
  nodes.push(<span key={index} className={'syntax-'+kind}>{token}</span>);last=index+token.length;
 }
 nodes.push(text.slice(last));return nodes;
}
export function CodeBlock({children}:React.ComponentProps<'pre'>){
 const id=useId(),pre=useRef<HTMLPreElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const [copied,setCopied]=useState(false),[error,setError]=useState(false),[expanded,setExpanded]=useState(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const child=React.Children.toArray(children)[0];
 const code=React.isValidElement<{className?:string,children?:React.ReactNode}>(child)?child:null;
 const text=typeof code?.props.children==='string'?code.props.children:'';
 const language=code?.props.className?.match(/language-([\w+-]+)/)?.[1]||'';
 const isC=['c','h'].includes(language.toLowerCase()),long=text.trimEnd().split('\n').length>14;
 async function copy(){try{
  const value=text||pre.current?.textContent||'';
  if(navigator.clipboard)await navigator.clipboard.writeText(value);
  else{const el=document.createElement('textarea');el.value=value;document.body.append(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw Error('copy')}
  setCopied(true);setError(false);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),1800);
 }catch{setError(true)}}
 return <div className={'code-wrap '+(long&&!expanded?'code-collapsed':'')}>
  <div className="code-toolbar"><span>{isC?'C':language||'โค้ด'}<small>ตัวอย่างสำหรับอ่านและคัดลอก</small></span><button className="copy-code" aria-label="คัดลอกโค้ด" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'คัดลอกแล้ว':'คัดลอก'}</button></div>
  <pre id={id} ref={pre} tabIndex={0} aria-label="ตัวอย่างโค้ด">{isC?<code className="language-c">{highlightC(text)}</code>:children}</pre>
  {long&&<button className="expand-code" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(!expanded)}>{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>} {expanded?'ย่อโค้ด':'ขยายดูโค้ดทั้งหมด'}</button>}
  {error&&<p className="copy-error" role="status">คัดลอกไม่สำเร็จ กรุณาเลือกข้อความในกล่องโค้ดแล้วคัดลอก</p>}
 </div>;
}
