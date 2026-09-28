const insert=`INSERT INTO usage(scope,bucket,count) VALUES(?,?,?)
 ON CONFLICT(scope,bucket) DO UPDATE SET count=count+excluded.count`;

export function recordModelUsage(db,phase,response,at=new Date()){
 if(!['planner','answer','summary'].includes(phase))throw Error('invalid usage phase');
 const bucket=at.toISOString().slice(0,10);
 const usage=response?.usage||{};
 const counters={[`${phase}_requests`]:1};
 for(const field of ['prompt_tokens','completion_tokens']){
  const value=usage[field];
  if(Number.isSafeInteger(value)&&value>=0)counters[`${phase}_${field}`]=value;
 }
 const statement=db.prepare(insert);
 for(const [scope,count] of Object.entries(counters))statement.run(scope,bucket,count);
}
