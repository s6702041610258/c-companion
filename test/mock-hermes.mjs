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
 const page=Number(system.match(/\[หน้า (\d+)/)?.[1]||14);
 const content=system.includes('Classify')
  ?{in_scope:true,concepts:['pointer']}
  :{answer:'คำตอบทดสอบ: พอยน์เตอร์เก็บที่อยู่ของข้อมูล',citations:[page],in_scope:true};
 res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:10,completion_tokens:10}}));
}).listen(18081,'127.0.0.1');
