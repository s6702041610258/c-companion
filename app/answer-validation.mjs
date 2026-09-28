import {validateAnswer} from './retrieval.mjs';

export async function retryValidatedAnswer(generate,allowed,onInvalid=()=>{}){
 let lastError;
 for(let attempt=0;attempt<2;attempt++){
  const raw=await generate(attempt);
  try{
   if(typeof raw!=='string')throw new Error('invalid_model_format');
   return validateAnswer(raw,allowed);
  }
  catch(error){lastError=error;onInvalid(error,attempt)}
 }
 throw lastError;
}
