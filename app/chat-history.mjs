/** Delete only this session's chats, including ones outside the visible history list. */
export function clearChatHistory(db,owner,isBusy){
 db.exec('BEGIN');
 try{
  const chats=db.prepare('SELECT id FROM chats WHERE owner=?').all(owner);
  if(chats.some(chat=>isBusy(chat.id)))throw Object.assign(new Error('กรุณาหยุดรอคำตอบก่อนลบประวัติทั้งหมด'),{status:409});
  const languages=db.prepare('DELETE FROM job_languages WHERE job IN (SELECT id FROM jobs WHERE chat=?)');
  const statements=['chat_preferences','jobs','messages','quiz_state'].map(table=>db.prepare(`DELETE FROM ${table} WHERE chat=?`));
  const remove=db.prepare('DELETE FROM chats WHERE id=? AND owner=?');
  for(const chat of chats){languages.run(chat.id);for(const statement of statements)statement.run(chat.id);remove.run(chat.id,owner)}
  db.exec('COMMIT');return {ok:true,deleted:chats.length};
 }catch(error){db.exec('ROLLBACK');throw error}
}
