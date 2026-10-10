import {cp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await cp('landing/out','dist/welcome',{recursive:true});
// Next's static hydration scripts are allowed by exact hashes, not unsafe-inline.
const html=await readFile('dist/welcome/index.html','utf8');
const hashes=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>"'sha256-"+createHash('sha256').update(m[1]).digest('base64')+"'");
await writeFile('dist/welcome/csp-hashes.json',JSON.stringify([...new Set(hashes)]));
console.log('Landing exported with',hashes.length,'hashed hydration scripts');
