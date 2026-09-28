import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {recordModelUsage} from './model-usage.mjs';

test('records only aggregate model usage, including a failed completion',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE usage(scope TEXT,bucket TEXT,count INTEGER,PRIMARY KEY(scope,bucket))');
 const at=new Date('2026-09-26T12:00:00Z');
 recordModelUsage(db,'answer',{usage:{prompt_tokens:80,completion_tokens:20}},at);
 recordModelUsage(db,'answer',{hermes:{failed:true},usage:{prompt_tokens:10,completion_tokens:2}},at);
 recordModelUsage(db,'planner',{usage:{prompt_tokens:-1,completion_tokens:'4'}},at);
 recordModelUsage(db,'summary',{usage:{prompt_tokens:30,completion_tokens:12}},at);
 recordModelUsage(db,'intent',{usage:{prompt_tokens:20,completion_tokens:5}},at);
 const rows=db.prepare('SELECT scope,count FROM usage ORDER BY scope').all().map(row=>({...row}));
 assert.deepEqual(rows,[
  {scope:'answer_completion_tokens',count:22},
  {scope:'answer_prompt_tokens',count:90},
  {scope:'answer_requests',count:2},
  {scope:'intent_completion_tokens',count:5},
  {scope:'intent_prompt_tokens',count:20},
  {scope:'intent_requests',count:1},
  {scope:'planner_requests',count:1},
  {scope:'summary_completion_tokens',count:12},
  {scope:'summary_prompt_tokens',count:30},
  {scope:'summary_requests',count:1}
 ]);
 db.close();
});
