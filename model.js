export const normalize = s => s.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export const label = p => p.endsWith('-H1') ? `${p.slice(0,4)} · I półrocze` : p;
export const displayName = s => s.toLocaleLowerCase('pl').replace(/(^|[ -])\p{L}/gu, c=>c.toLocaleUpperCase('pl'));
export function ranking(rows, gender='all') {
  const list=rows.filter(r=>gender==='all'||r[1]===gender).map(([name,gender,count])=>({name,gender,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pl'));
  let rank=0,previous;
  return list.map((r,i)=>{if(r.count!==previous)rank=i+1;previous=r.count;return {...r,rank};});
}
export function series(data,name,gender,half=false) {
  return Object.keys(data.periods).filter(p=>p.endsWith('-H1')===half).sort().map(period=>{
    const rows=ranking(data.periods[period],gender), row=rows.find(r=>r.name===name);
    const total=rows.reduce((s,r)=>s+r.count,0);
    return {period,count:row?.count??null,rank:row?.rank??null,share:row?row.count/total*100:null};
  });
}
