import {chapters} from './curriculum.mjs';

const wordPattern=/[\p{L}\p{M}\p{N}_]+/gu;
const pageQuestion=/(?:หน้าไหน|หน้าใด|หน้าอะไร|หน้าที่เท่า(?:ไร|ไหร่)|มาจากหน้า|อยู่หน้า|ปรากฏในหน้า|\b(?:which|what)\s+page\b|\bwhere\s+in\s+the\s+book\b)/i;
const clean=text=>text.replace(/\s+/g,' ').trim();

function tokens(text){
 const result=[];
 for(const match of text.matchAll(wordPattern)){
  const start=match.index,end=start+match[0].length;
  const previous=result.at(-1);
  if(previous&&/^[\u200b-\u200d\ufeff]+$/.test(text.slice(previous.end,start))){
   previous.word+=match[0].normalize('NFKC').toLowerCase();
   previous.end=end;
  }else result.push({word:match[0].normalize('NFKC').toLowerCase(),start,end});
 }
 return result;
}

function phraseFromQuestion(message,explicit){
 const quoted=[/“([^”]{2,500})”/g,/"([^"]{2,500})"/g,/‘([^’]{2,500})’/g,/'([^']{2,500})'/g,/`([^`]{2,500})`/g]
  .flatMap(pattern=>[...message.matchAll(pattern)].map(match=>match[1]))
  .filter(value=>tokens(value).length>=2)
  .sort((a,b)=>tokens(b).length-tokens(a).length);
 if(quoted.length)return quoted[0];
 if(explicit){
  const englishBody=message.replace(/^(?:what|which)\s+page(?:\s+(?:in|of)\s+the\s+book)?\s+(?:(?:does|is|contains|has)\s+)?/i,'')
   .replace(/\s+(?:appear|occur|come)\s+(?:on|in|from)(?:\s+the\s+book)?\??$/i,'').replace(/[?？]+$/,'').trim();
  const latinRuns=[...englishBody.matchAll(/[A-Za-z][A-Za-z0-9_\s,.;:()\/\-–—]*[A-Za-z0-9_]|[A-Za-z]+/g)]
   .map(match=>match[0].trim()).sort((a,b)=>tokens(b).length-tokens(a).length);
  if(latinRuns.length)return latinRuns[0];
  const stripped=message.replace(/^.*?(?:คำว่า|คำนี้|ประโยคว่า|ประโยคนี้|ข้อความว่า|ข้อความนี้|วลีว่า|วลีนี้)\s*/s,'')
   .replace(/\s*(?:อยู่|มาจาก|ปรากฏ)?\s*(?:ในหนังสือ)?\s*(?:หน้าไหน|หน้าใด|หน้าอะไร|หน้าที่เท่า(?:ไร|ไหร่)).*$/s,'').trim();
  return stripped&&stripped!==message?stripped:'';
 }
 const bare=message.trim();
 if(/[?？]/.test(bare)||/^(?:what|how|why|when|where|which|explain|define|describe|write|show)\b/i.test(bare))return '';
 if(/[\p{Script=Thai}]/u.test(bare))return '';
 return tokens(bare).length>=4?bare:'';
}

function firstMatch(page,queryTokens){
 const words=tokens(page.text);
 for(let i=0;i<=words.length-queryTokens.length;i++){
  if(words[i].word!==queryTokens[0])continue;
  if(!queryTokens.every((word,j)=>words[i+j].word===word))continue;
  const start=words[i].start,end=words[i+queryTokens.length-1].end;
  return {
   page:page.page,pdfPage:page.pdfPage,chapter:page.chapter,
   before:clean(page.text.slice(Math.max(0,start-145),start)),
   matchedText:clean(page.text.slice(start,end)),
   after:clean(page.text.slice(end,Math.min(page.text.length,end+230)))
  };
 }
 return null;
}

export function findBookLocation(pages,message,{chapter=0}={}){
 // A location request always searches the whole book; a selected lesson must not hide the source.
 void chapter;
 const explicit=pageQuestion.test(message);
 const query=phraseFromQuestion(message,explicit);
 if(!query)return explicit?{status:'needs_quote',query:'',matches:[]}:null;
 const words=tokens(query).map(token=>token.word);
 if(!words.length||query.length>500)return explicit?{status:'needs_quote',query:'',matches:[]}:null;
 const matches=pages.map(page=>firstMatch(page,words)).filter(Boolean);
 if(!explicit&&!matches.length)return null;
 return {status:matches.length>6?'ambiguous':matches.length?'found':'not_found',query,matches};
}

export function locationReply(result,language='th'){
 if(result.status!=='found'){
  const english=language==='en';
  const answer=result.status==='needs_quote'
   ?english?'Please paste the word or sentence whose page you want to find.':'กรุณาวางคำหรือประโยคที่ต้องการค้นหาหน้าในหนังสือครับ'
   :result.status==='ambiguous'
    ?english?`This short phrase appears on ${result.matches.length} pages. Please paste a longer sentence so I can identify the right passage.`:`ข้อความสั้นนี้พบใน ${result.matches.length} หน้า กรุณาวางประโยคที่ยาวขึ้นเพื่อระบุตำแหน่งให้ชัดครับ`
    :english?'I could not find that exact wording in the extracted book text. Please check the spelling or paste a longer passage.':'ไม่พบข้อความนี้ในข้อความที่ดึงจากหนังสือ กรุณาตรวจคำสะกดหรือวางประโยคที่ยาวขึ้นครับ';
  return {answer,sources:[],citations:[],inScope:false};
 }
 const locations=result.matches.map(m=>language==='en'
  ?`printed page ${m.page} (PDF page ${m.pdfPage})`
  :`หนังสือหน้า ${m.page} (PDF หน้า ${m.pdfPage})`).join(language==='en'?', ':' และ ');
 const answer=language==='en'
  ?`I found that wording on ${locations}. Open the source panel to see the matching passage and the original book page.`
  :`พบข้อความนี้ใน${locations} ครับ เปิดแหล่งอ้างอิงเพื่อดูช่วงข้อความที่ตรงกันและหน้าหนังสือจริงได้`;
 const sources=result.matches.map(m=>({
  page:m.page,pdfPage:m.pdfPage,chapter:m.chapter,title:chapters[m.chapter-1].title,
  excerpt:clean([m.before,m.matchedText,m.after].join(' ')),
  before:m.before,matchedText:m.matchedText,after:m.after
 }));
 return {answer,sources,citations:result.matches.map(m=>m.page),inScope:true};
}
