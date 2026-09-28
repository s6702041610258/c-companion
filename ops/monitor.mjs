import {mkdirSync,writeFileSync,readdirSync,statSync,statfsSync} from 'node:fs';
const stateDir=process.env.MONITOR_STATE_DIR||'/state';mkdirSync(stateDir,{recursive:true});
async function check(){
 const issues=[];let app;
 try{const r=await fetch(process.env.MONITOR_APP_URL||'http://app:8080/api/health',{signal:AbortSignal.timeout(10000)});app=await r.json();if(!r.ok||!app.ok)issues.push('app_health');if(!app.configured)issues.push('model_configuration');if(app.recentFailures>=3)issues.push('answer_failures')}catch{issues.push('app_unreachable')}
 try{const url=(process.env.HERMES_BASE_URL||'').replace(/\/$/,'');const r=await fetch(url+'/models',{headers:{Authorization:'Bearer '+process.env.HERMES_API_KEY},signal:AbortSignal.timeout(15000)});if(!r.ok)issues.push('hermes_unavailable')}catch{issues.push('hermes_unreachable')}
 try{const backups=readdirSync('/backups').filter(n=>n.endsWith('.db')).sort();const last=backups.at(-1);if(!last||Date.now()-statSync('/backups/'+last).mtimeMs>8*3600000)issues.push('backup_stale');const disk=statfsSync('/backups');if(disk.bavail/disk.blocks<0.1)issues.push('disk_low')}catch{issues.push('backup_unavailable')}
 const status={checked:new Date().toISOString(),ok:issues.length===0,issues,queue:app?.queue||null};
 writeFileSync(stateDir+'/status.json',JSON.stringify(status));
 console.log(JSON.stringify({event:'monitor_check',...status}));
}
do{await check();if(process.argv.includes('--once'))break;await new Promise(r=>setTimeout(r,60000))}while(true)
