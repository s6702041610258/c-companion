import {socialReply} from '../app/social-intent.mjs';
import http from 'node:http';

http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 if(req.url==='/v1/models')return res.end(JSON.stringify({data:[{id:'mock-only'}]}));
 if(req.url!=='/v1/chat/completions'){res.statusCode=404;return res.end('{}')}
 let raw='';for await(const chunk of req)raw+=chunk;
 const body=JSON.parse(raw);
 const system=String(body.messages?.[0]?.content||'');
 const english=system.includes('AUTHORITATIVE OUTPUT LANGUAGE: English');
 const last=String(body.messages?.at(-1)?.content||'');
 if(last.includes('รอทดสอบ'))await new Promise(resolve=>setTimeout(resolve,4000));
 if(system.startsWith('Conversation intent:')){
  const input=JSON.parse(last);let kind='c_question',query=input.request,reply=socialReply(input.request)||'';if(reply){kind='smalltalk';query=''}
  if(input.request==='ชั้นต้องการเรียนพาสาซี”กก'||input.request==='อยากหัดเขียนภาษาซี เริ่มตรงไหนดีงับ'){kind='learning_start';query=''}
  if(input.request==='งงงงง'||input.request==='อันนั้นอะ'){kind='clarify';query=''}
  if(input.request==='อยากเรียน Python'||input.request==='ไม่อยากเรียน C ไม่ต้องสอน'){kind='out_of_scope';query=''}
  if(input.request==='แล้วแบบที่สองล่ะ'){
   if(!input.recentHistory.some(m=>m.role==='user'&&m.content.includes('int กับ float')))throw Error('follow-up history missing');
   query='float ชนิดข้อมูลทศนิยม';
  }
  if(input.request==='เริ่มจากศูนย์เลย')query='ภาษา C โครงสร้างโปรแกรมเบื้องต้น';
  if(input.request==='ช่วยรวบยอดสิ่งที่เราคุยไป'){kind='summary';query=''}
  if(input.request.startsWith('ไม่ต้องสรุป')){kind='greeting';query=''}
  if(input.mode==='quiz'){
   if(/ขอโจทย์/.test(input.request)){kind='quiz_new';query='for loop'}
   else if(input.request.startsWith('คำตอบของผมคือ')){if(!input.quizContext?.some(m=>m.role==='assistant'))throw Error('missing current exercise');kind='quiz_attempt';query='for loop'}
   else if(input.request.includes('เฉลย')){kind='quiz_solution';query='for loop'}
   else if(input.request==='ขอบคุณ'){kind='thanks';query=''}
  }
  const conversation={
   'โหมดต่าง ๆ ในระบบทำอะไรได้บ้าง ต่างกันยังไง':['capabilities','ถามคำถาม: ตอบตรงเรื่อง ติวทีละขั้น: ให้คำใบ้และถามกลับ ฝึกทำโจทย์: ลองตอบก่อนแล้วตรวจคำตอบครับ'],
   'หนังสือที่ใช้ใครเขียน':['capabilities','หนังสือ C Companion เขียนโดย Soradech Krootjohn ตามหน้าปก ส่วนผู้พัฒนาเว็บคือ Mongkol Jadsakul ครับ'],
   'เปลี่ยนเป็นโหมดติวทีละขั้นให้หน่อย':['capabilities','กดติวทีละขั้นเหนือช่องพิมพ์ได้เลยครับ การเปลี่ยนโหมดจะเริ่มแชทใหม่ แชทเดิมยังอยู่ในประวัติ ผมกดแทนไม่ได้ครับ'],
   'ผมคือคุณ':['smalltalk','จะสลับบทบาทกันไหมครับ 😄 ลองตั้งคำถามภาษา C ให้ผมตอบสักข้อได้เลย'],
   'ผมคือคุณ หมายถึงอะไร':['smalltalk','ตามตัวอักษรคือผู้พูดบอกว่าตัวเองเป็นอีกฝ่ายครับ คุณหมายถึงประโยคนี้ในบริบทไหน?'],
   'งงอะ':['clarify',input.recentHistory.length?'ติดตรงที่อยู่ของตัวแปร หรือส่วนที่ใช้พอยน์เตอร์ครับ?':'หมายถึงคำตอบไหนหรือหัวข้ออะไรครับ?'],
   'ยากจัง ไม่เรียนแล้ว':['encouragement','พักก่อนได้ครับ ถ้าอยากลองต่อ เราค่อยทำทีละขั้นนะครับ'],
   'เฉลยให้หน่อยในรูปแบบคุยเล่น':['quiz_solution','']
  };
  if(conversation[input.request]){[kind,reply]=conversation[input.request];query=kind==='quiz_solution'?'for loop':''}
  if(['greeting','capabilities','learning_start','thanks','clarify','out_of_scope'].includes(kind)&&!reply){
   reply={greeting:'สวัสดีครับ 👋',capabilities:'ผมคือ C Companion เพื่อนติวภาษา C',learning_start:'มาเริ่มเรียนภาษา C ด้วยกันครับ',thanks:'ยินดีครับ',clarify:'ผมยังไม่แน่ใจว่าหมายถึงส่วนไหนครับ?',out_of_scope:'ผมช่วยติวภาษา C จากหนังสือได้ครับ'}[kind];
  }
  let language;
  if(input.request==='ต่อไปตอบอังกฤษนะ'){kind='language_change';query='';reply='';language={target:'en',scope:'chat'}}
  if(input.request==='ตอบไทยเหมือนเดิม'){kind='language_change';query='';reply='';language={target:'th',scope:'chat'}}
  if(input.request==='ข้อนี้ตอบอังกฤษ: พอยน์เตอร์คืออะไร'){kind='c_question';query='pointer';reply='';language={target:'en',scope:'once'}}
  if(input.request==='ตอบอังกฤษนะ รอทดสอบ'){kind='language_change';query='';reply='';language={target:'en',scope:'chat'}}
  if(input.request==='Give me a for-loop exercise'){kind='quiz_new';query='for loop';reply=''}
  if(input.request==='Show me the solution'){kind='quiz_solution';query='for loop';reply=''}
  if(input.request==='Translate the current exercise into English'){kind='quiz_translate';query='for loop';reply='';language={target:'en',scope:'once'}}
  if(input.request==='Summarize our conversation'){kind='summary';query='';reply=''}
  if((english||input.replyLanguage==='en')&&reply&&!language)reply='Hello! I can help you learn C programming.';
  let locationTarget;
  if(input.request.includes('อยู่หน้าไหน')){kind='book_location';query='In this phase, the intermediate assembly';reply='';locationTarget='page'}
  if(input.request.includes('อยู่บทไหน')){kind='book_location';query='if else';reply='';locationTarget='chapter'}
  const content=input.request==='ทดสอบระบบตีความเสีย' ?'invalid json':JSON.stringify({kind,query,reply,language,locationTarget,confidence:'high'});
  return res.end(JSON.stringify({choices:[{message:{content}}],usage:{prompt_tokens:10,completion_tokens:10}}));
 }
 if(last.includes('จำลองเซิร์ฟเวอร์ล้ม')){res.statusCode=503;return res.end(JSON.stringify({error:'private-provider-error-secret'}))}
 if(last.includes('จำลองอ้างอิงผิด'))return res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'bad',citations:[999],in_scope:true})}}]}));
 if(last.includes('load-case-'))await new Promise(r=>setTimeout(r,125));
 const page=Number(system.match(/\[หน้า (\d+)/)?.[1]||14);
 const content=system.startsWith('Conversation summary:')
  ?{summary:(english?'Test summary of this conversation: ':'สรุปทดสอบจากประวัติที่ส่งจริง: ')+JSON.parse(last).material.slice(0,5000)}
  :system.includes('Classify')
  ?{in_scope:true,concepts:['pointers']}
  :{answer:last.includes('load-case-')?'คำตอบสำหรับ '+last.match(/load-case-\d+/)[0]:(english?'Test answer: a pointer stores the address of data.':'คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล'),citations:[page],in_scope:true};
 res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:10,completion_tokens:10}}));
}).listen(18081,'127.0.0.1');
