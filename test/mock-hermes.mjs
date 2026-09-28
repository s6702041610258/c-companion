import http from 'node:http';

http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 if(req.url==='/v1/models')return res.end(JSON.stringify({data:[{id:'mock-only'}]}));
 if(req.url!=='/v1/chat/completions'){res.statusCode=404;return res.end('{}')}
 let raw='';for await(const chunk of req)raw+=chunk;
 const body=JSON.parse(raw);
 const system=String(body.messages?.[0]?.content||'');
 const last=String(body.messages?.at(-1)?.content||'');
 if(last.includes('รอทดสอบ'))await new Promise(resolve=>setTimeout(resolve,4000));
 if(system.startsWith('Conversation intent:')){
  const input=JSON.parse(last);let kind='c_question',query=input.request;
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
  const content=input.request==='ทดสอบระบบตีความเสีย'?'invalid json':JSON.stringify({kind,query,confidence:'high'});
  return res.end(JSON.stringify({choices:[{message:{content}}],usage:{prompt_tokens:10,completion_tokens:10}}));
 }
 const page=Number(system.match(/\[หน้า (\d+)/)?.[1]||14);
 const content=system.startsWith('Conversation summary:')
  ?{summary:'สรุปทดสอบจากประวัติที่ส่งจริง: '+JSON.parse(last).material.slice(0,5000)}
  :system.includes('Classify')
  ?{in_scope:true,concepts:['pointers']}
  :{answer:'คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล',citations:[page],in_scope:true};
 res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:10,completion_tokens:10}}));
}).listen(18081,'127.0.0.1');
