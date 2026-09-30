import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findBookLocation,locationReply} from './book-location.mjs';

const pages=JSON.parse(readFileSync(new URL('../book/index.json',import.meta.url),'utf8'));

test('a copied phrase locates the printed page and PDF page without AI',()=>{
 const result=findBookLocation(pages,'In this phase, the intermediate assembly');
 assert.equal(result?.status,'found');
 assert.deepEqual(result.matches.map(m=>[m.page,m.pdfPage]),[[4,9]]);
 assert.match(result.matches[0].matchedText,/In this phase, the intermediate assembly/i);
 assert.match(result.matches[0].after,/instruction \(hello\.s\)/);
});

test('Thai page question tolerates quotation marks and PDF line spacing',()=>{
 const result=findBookLocation(pages,'คำว่า “In this phase, the intermediate\nassembly” มาจากหน้าไหน');
 assert.deepEqual(result.matches.map(m=>m.page),[4]);
 assert.equal(result.query,'In this phase, the intermediate\nassembly');
});

test('location search ignores the selected chapter and matches copied punctuation variants',()=>{
 const result=findBookLocation(pages,'ประโยค In this phase the intermediate assembly อยู่หน้าไหน',{chapter:7});
 assert.deepEqual(result.matches.map(m=>m.page),[4]);
});

test('an absent quote never fabricates a page citation',()=>{
 const result=findBookLocation(pages,'คำว่า In this phase the purple elephant compiler อยู่หน้าไหน');
 assert.equal(result.status,'not_found');
 assert.deepEqual(locationReply(result,'th').sources,[]);
});

test('normal C questions still use the tutor route',()=>{
 assert.equal(findBookLocation(pages,'In C, what is a pointer?'),null);
 assert.equal(findBookLocation(pages,'อธิบายอาร์เรย์ในภาษา C'),null);
});

test('a common short word asks for more context instead of claiming one page',()=>{
 const result=findBookLocation(pages,'คำว่า the อยู่หน้าไหน');
 assert.equal(result.status,'ambiguous');
 assert.deepEqual(locationReply(result,'th').sources,[]);
});

test('verified location reply supplies the exact matching source excerpt',()=>{
 const result=findBookLocation(pages,'ประโยค In this phase, the intermediate assembly อยู่หน้าไหน');
 const reply=locationReply(result,'th');
 assert.match(reply.answer,/หน้า 4/);
 assert.match(reply.answer,/PDF หน้า 9/);
 assert.equal(reply.sources[0].page,4);
 assert.equal(reply.sources[0].matchedText.includes('In this phase, the intermediate assembly'),true);
 assert.equal(reply.sources[0].pdfPage,9);
});

test('an English page question names the same verified passage',()=>{
 const result=findBookLocation(pages,'Which page contains “In this phase, the intermediate assembly”?');
 assert.deepEqual(result.matches.map(m=>m.page),[4]);
 assert.match(locationReply(result,'en').answer,/printed page 4 \(PDF page 9\)/);
});

test('copied phrases from every chapter locate the expected printed page',()=>{
 const examples=[
  [1,'Tell what the characteristics of low-level language are'],
  [10,'Create an executable file using a C'],
  [23,'print data of each data type to computer screen'],
  [32,'Write a program using if-else statement to classify given items'],
  [43,'iterative statement to perform repeated operations'],
  [50,'operate on array of data'],
  [56,'difference between value of pointer variable'],
  [67,'Create a user-defined data type'],
  [75,'function that receives a list of parameter'],
  [85,'receive command line arguments'],
  [91,'open a file for reading'],
  [104,'header file and its implementation']
 ];
 for(const [page,phrase] of examples){
  const result=findBookLocation(pages,`คำว่า ${phrase} อยู่หน้าไหน`);
  assert.deepEqual(result.matches.map(match=>match.page),[page],phrase);
 }
});
