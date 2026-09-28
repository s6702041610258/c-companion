import {DatabaseSync} from 'node:sqlite';

const db=new DatabaseSync(process.env.TUTOR_DB||'/app/data/tutor.db',{readOnly:true});
try{
 const days=Number(process.argv[2]||7);
 if(!Number.isInteger(days)||days<1||days>90)throw Error('Choose 1–90 days');
 const rows=db.prepare('SELECT bucket,scope,count FROM usage WHERE bucket>=? ORDER BY bucket DESC,scope').all(new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10));
 console.log(JSON.stringify({days,rows,note:'Provider-reported tokens; this is not a bill or a hard budget limit.'}));
}finally{db.close()}
