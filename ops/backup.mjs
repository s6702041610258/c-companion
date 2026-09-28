import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync,readdirSync,statSync,unlinkSync,writeFileSync,renameSync,chmodSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir=process.env.BACKUP_DIR||'/backups';
export async function snapshot(source='/data/tutor.db',destination=dir){
 mkdirSync(destination,{recursive:true,mode:0o700});
 const name='tutor-'+new Date().toISOString().replace(/[:.]/g,'-')+'.db',path=destination+'/'+name,temp=path+'.partial';
 const db=new DatabaseSync(source,{readOnly:true});try{await backup(db,temp)}finally{db.close()}
 const check=new DatabaseSync(temp,{readOnly:true});const counts={};
 try{
  const integrity=check.prepare('PRAGMA integrity_check').get();if(Object.values(integrity)[0]!=='ok')throw Error('Backup integrity failed');
  for(const {name:table} of check.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()){if(!/^[a-z_]+$/.test(table))continue;counts[table]=check.prepare('SELECT count(*) AS n FROM '+table).get().n}
 }finally{check.close()}
 for(const suffix of ['-shm','-wal']){try{unlinkSync(temp+suffix)}catch(error){if(error.code!=='ENOENT')throw error}}
 chmodSync(temp,0o600);renameSync(temp,path);
 const sha256=createHash('sha256').update(readFileSync(path)).digest('hex');
 writeFileSync(path+'.json',JSON.stringify({created:new Date().toISOString(),sha256,counts}),{mode:0o600});
 const old=readdirSync(destination).filter(n=>/^tutor-.*\.db$/.test(n)).sort().reverse().slice(28);for(const n of old){unlinkSync(destination+'/'+n);if(readdirSync(destination).includes(n+'.json'))unlinkSync(destination+'/'+n+'.json')}
 console.log(JSON.stringify({event:'backup_complete',file:name,bytes:statSync(path).size}));return path;
}
if(process.argv[1]?.endsWith('/backup.mjs')){
 do{let waitMs=6*60*60*1000;try{await snapshot()}catch(e){waitMs=60000;console.error(JSON.stringify({event:'backup_failed',error:e.code||e.name}));if(process.argv.includes('--once'))process.exit(1)}if(process.argv.includes('--once'))break;await new Promise(r=>setTimeout(r,waitMs))}while(true)
}
