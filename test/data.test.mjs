import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalize,ranking,series } from '../model.js';
import { csv,parseRows } from '../scripts/update-data.mjs';
const data=JSON.parse(await readFile(new URL('../data/names.json',import.meta.url),'utf8'));
test('complete annual history, distinct half-years and unique positive rows',()=>{
  for(let y=2000;y<=2025;y++)assert.ok(data.periods[y]);
  for(let y=2019;y<=2026;y++)assert.ok(data.periods[`${y}-H1`]);
  for(const rows of Object.values(data.periods)){const keys=new Set();for(const [name,sex,n] of rows){assert.ok(name);assert.ok(['K','M'].includes(sex));assert.ok(Number.isInteger(n)&&n>0);assert.ok(!keys.has(`${sex}:${name}`));keys.add(`${sex}:${name}`);}}
});
test('official reference values and ties',()=>{
  const r=ranking(data.periods['2020'],'K');assert.deepEqual(r.filter(x=>x.rank===1).map(x=>[x.name,x.count]),[['JULIA',7351],['ZUZANNA',7351]]);assert.equal(r[2].rank,3);
  assert.equal(ranking(data.periods['2025'],'M')[0].count,5772);
  assert.equal(ranking(data.periods['2026-H1'],'K')[0].count,2166);
});
test('accent-independent search preserves separate spellings',()=>{assert.equal(normalize('Łucja'),'lucja');assert.equal(normalize('ŻÓŁĆ'),'zolc');});
test('missing names are null and half-years never enter annual chart',()=>{
  const result=series(data,'NOT A NAME','K');assert.equal(result.length,26);assert.ok(result.every(r=>r.count===null&&!r.period.includes('H1')));
  assert.equal(series(data,'ZOFIA','K',true).length,8);
  const p=series(data,'ZOFIA','K').find(r=>r.period==='2025');assert.equal(p.count,4415);assert.equal(p.rank,1);assert.ok(p.share>0&&p.share<100);
});
test('CSV formats, quoted values and headerless 2020 retain first row',()=>{
  assert.deepEqual(csv('a;b\n"x;y";"z"\n'),[['a','b'],['x;y','z']]);
  const r=parseRows('ANTONI,4037,M\nJAN,3823,M',{id:'26012',attributes:{title:'Imiona w I połowie 2020 r.'}});assert.equal(r[0].name,'ANTONI');assert.equal(r[0].period,'2020-H1');
  assert.equal(data.periods['2020-H1'].find(r=>r[0]==='ANTONI'&&r[1]==='M')[2],4037);
});
