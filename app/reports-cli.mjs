import {DatabaseSync} from 'node:sqlite';
import {resolve} from 'node:path';
import {initReports} from './reports.mjs';
const db=new DatabaseSync(resolve(import.meta.dirname,'../data/tutor.db'));initReports(db);
const [command='list',id]=process.argv.slice(2);
if(command==='list')console.log(JSON.stringify(db.prepare("SELECT id,category,detail,status,created FROM reports ORDER BY created DESC LIMIT 100").all(),null,2));
else if(command==='show'&&id)console.log(JSON.stringify(db.prepare('SELECT id,category,detail,context,status,created FROM reports WHERE id=?').get(id)||null,null,2));
else if(command==='resolve'&&id)console.log(JSON.stringify({updated:db.prepare("UPDATE reports SET status='resolved' WHERE id=?").run(id).changes}));
else {console.error('Usage: node app/reports-cli.mjs list | show <id> | resolve <id>');process.exitCode=1}
db.close();
