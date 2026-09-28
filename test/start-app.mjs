import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const dir=resolve('test-results/browser-data');
mkdirSync(dir,{recursive:true});
process.env.TUTOR_DB=resolve(dir,'tutor.db');
process.env.APP_PORT='18080';
process.env.HERMES_BASE_URL='http://127.0.0.1:18081/v1';
process.env.HERMES_API_KEY='mock-only';
await import('../app/server.mjs');
