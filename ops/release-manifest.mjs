import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const version=JSON.parse(readFileSync('package.json','utf8')).version;
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const paths=execFileSync('git',['ls-files','-z']).toString('utf8').split('\0').filter(Boolean).sort();
const files={};
for(const path of paths)files[path]=createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceDigest=createHash('sha256');
for(const [path,hash] of Object.entries(files))sourceDigest.update(path+'\0'+hash+'\n');
console.log(JSON.stringify({version,commit,sourceDigest:sourceDigest.digest('hex'),files},null,2));
