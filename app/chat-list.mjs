export function listChats(db,owner,{query='',cursor=''}={}){
 const search=String(query).trim().slice(0,100);let after=null;
 if(cursor){try{after=JSON.parse(Buffer.from(cursor,'base64url').toString());if(typeof after.created!=='string'||typeof after.id!=='string')throw Error()}catch{throw Object.assign(Error('รายการประวัติไม่ถูกต้อง กรุณาค้นหาใหม่'),{status:400})}}
 const rows=db.prepare(`SELECT c.id,c.title,c.chapter,c.mode,c.created FROM chats c
 WHERE c.owner=? AND EXISTS (SELECT 1 FROM messages m WHERE m.chat=c.id)
 AND (?='' OR instr(lower(c.title),lower(?))>0)
 ${after?'AND (c.created<? OR (c.created=? AND c.id<?))':''}
 ORDER BY c.created DESC,c.id DESC LIMIT 31`).all(owner,search,search,...(after?[after.created,after.created,after.id]:[]));
 const chats=rows.slice(0,30),last=chats.at(-1);
 return {chats,nextCursor:rows.length>30?Buffer.from(JSON.stringify({created:last.created,id:last.id})).toString('base64url'):null};
}
