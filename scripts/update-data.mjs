import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const cache = process.env.DATA_CACHE;
async function get(url) { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status}: ${url}`); return r.text(); }
export function csv(text) {
  const delimiter = text.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i=0; i<text.length; i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(c===delimiter && !quoted){row.push(cell.trim());cell='';}
    else if(c==='\n' && !quoted){row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else if(c!=='\r') cell+=c;
  }
  if(quoted) throw new Error('Unclosed CSV quote');
  row.push(cell.trim()); if(row.some(Boolean))rows.push(row);
  return rows;
}
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function parseRows(text, resource) {
  const rows = csv(text), head = rows[0].map(norm);
  const hasHeader = head.some(x=>x.startsWith('imie'));
  // The official CSV for H1 2020 has no header.
  const cols = hasHeader ? { name:head.findIndex(x=>x.startsWith('imie')), count:head.findIndex(x=>x.startsWith('liczba')), gender:head.findIndex(x=>x==='plec'), year:head.indexOf('rok') } : {name:0,count:1,gender:2,year:-1};
  if([cols.name,cols.count,cols.gender].some(x=>x<0))throw new Error(`Unknown schema: ${resource.id}`);
  const title=resource.attributes.title;
  const year=Number(title.match(/20\d{2}/)?.[0]);
  const half=/połowie/i.test(title);
  return rows.slice(hasHeader?1:0).map((r,i)=>{
    const name=r[cols.name]?.trim().toLocaleUpperCase('pl'), count=Number(r[cols.count]);
    const gender=/^(K|KOBIETA)$/.test(r[cols.gender])?'K':/^(M|MĘŻCZYZNA)$/.test(r[cols.gender])?'M':null;
    const y=cols.year>=0?Number(r[cols.year]):year;
    if(!name || !gender || !Number.isInteger(count) || count<1 || y<2000 || y>2100) throw new Error(`Invalid row ${resource.id}:${i+1}: ${r}`);
    return {period:`${y}${half?'-H1':''}`, name, gender, count};
  });
}
export async function update() {
  let resources;
  if(cache) resources=JSON.parse(await readFile(path.join(cache,'../selected.json'),'utf8'));
  else {
    resources=[]; let url='https://api.dane.gov.pl/1.4/datasets/219/resources?page=1&per_page=100';
    while(url){const page=JSON.parse(await get(url));resources.push(...page.data);url=page.links?.next;}
    const candidates=resources.filter(r=>/pierwsze/i.test(r.attributes.title)&&!/wojew|USC/i.test(r.attributes.title));
    const unique=new Map();
    for(const r of candidates){const key=r.attributes.title.trim();if(!unique.has(key)||r.attributes.format==='csv')unique.set(key,r);}
    resources=[...unique.values()].filter(r=>!/w 2019 r/.test(r.attributes.title)||/połowie/.test(r.attributes.title));
  }
  const periods=new Map(), sources=[];
  for(const r of resources) {
    const a=r.attributes, url=a.format==='csv'?a.file_url:a.csv_file_url;
    if(!url)throw new Error(`No CSV: ${r.id}`);
    const content=cache?await readFile(path.join(cache,`${r.id}.csv`),'utf8'):await get(url);
    const parsed=parseRows(content,r);
    for(const row of parsed){
      if(!periods.has(row.period))periods.set(row.period,new Map());
      const entries=periods.get(row.period), key=`${row.gender}:${row.name}`;
      if(entries.has(key))throw new Error(`Duplicate ${row.period}/${key}`);
      entries.set(key,[row.name,row.gender,row.count]);
    }
    sources.push({id:r.id,title:a.title,url,modified:a.modified,periods:[...new Set(parsed.map(x=>x.period))]});
  }
  const data={updated:new Date().toISOString().slice(0,10),dataset:'https://dane.gov.pl/pl/dataset/219,imiona-nadawane-dzieciom-w-polsce',sources,periods:Object.fromEntries([...periods].sort().map(([p,rows])=>[p,[...rows.values()].sort((a,b)=>b[2]-a[2]||a[0].localeCompare(b[0],'pl'))]))};
  for(const [p,rows] of Object.entries(data.periods))if(!rows.some(r=>r[1]==='K')||!rows.some(r=>r[1]==='M'))throw new Error(`Incomplete genders: ${p}`);
  if(Object.keys(data.periods).length<26)throw new Error('Incomplete history');
  await mkdir(path.join(root,'data'),{recursive:true});
  await writeFile(path.join(root,'data/names.json'),JSON.stringify(data));
  console.log(`Saved ${Object.keys(data.periods).length} periods, ${sources.length} sources, ${Object.values(data.periods).reduce((n,r)=>n+r.length,0)} rows.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await update();
