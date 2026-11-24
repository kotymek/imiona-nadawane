import {normalize,label,displayName,ranking,series} from './model.js';
const $=s=>document.querySelector(s), fmt=n=>n.toLocaleString('pl-PL'), pct=n=>n>0&&n<0.01?'<0,01%':`${n.toLocaleString('pl-PL',{maximumFractionDigits:2})}%`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,period,gender='K',page=0,selected,allNames=[],pageSize=25;
const params=new URLSearchParams(location.search);
const dialog=$('#detail');
function syncURL(){
  const q=new URLSearchParams({rok:period,plec:gender});
  if($('#search').value)q.set('szukaj',$('#search').value);
  if(selected){q.set('imie',selected.name);q.set('imiePlec',selected.gender);q.set('wykres',$('#chart-period').value);q.set('miara',$('#metric').value);}
  history.replaceState(null,'',`${location.pathname}?${q}${location.hash}`);
}
function render(){
  const rows=ranking(data.periods[period],gender),total=rows.reduce((n,r)=>n+r.count,0),query=normalize($('#search').value.trim());
  let visible=rows.filter(r=>normalize(r.name).includes(query));
  if(query){const present=new Set(rows.map(r=>`${r.gender}:${r.name}`));visible.push(...allNames.filter(r=>(gender==='all'||r.gender===gender)&&normalize(r.name).includes(query)&&!present.has(`${r.gender}:${r.name}`)).map(r=>({...r,count:null,rank:null})));}
  const sort=$('#sort').value;
  if(sort==='alpha')visible.sort((a,b)=>a.name.localeCompare(b.name,'pl')||a.gender.localeCompare(b.gender));
  if(sort==='rare')visible.sort((a,b)=>(a.count??Infinity)-(b.count??Infinity)||a.name.localeCompare(b.name,'pl'));
  page=Math.max(0,Math.min(page,Math.ceil(visible.length/pageSize)-1));
  const slice=visible.slice(page*pageSize,(page+1)*pageSize),max=rows[0]?.count||1;
  $('#names-body').innerHTML=slice.length?slice.map(r=>`<tr><td>${r.rank===null?'—':r.rank<=3?`<span class="rank-top">${r.rank}</span>`:fmt(r.rank)}</td><td><button class="name-button" data-name="${esc(r.name)}" data-sex="${r.gender}">${esc(displayName(r.name))}</button>${r.count===null?'<div class="hint">Brak wpisu w tym okresie</div>':''}</td><td class="gender-cell"><span class="gender-tag">${r.gender==='K'?'żeńskie':'męskie'}</span></td><td class="number">${r.count===null?'—':`<strong>${fmt(r.count)}</strong>`}</td><td class="share-cell"><div class="share"><div class="bar"><i style="width:${r.count===null?0:r.count/max*100}%"></i></div><span>${r.count===null?'—':pct(r.count/total*100)}</span></div></td><td class="number"><button class="chart-button" data-name="${esc(r.name)}" data-sex="${r.gender}" aria-label="Zobacz historię: ${esc(displayName(r.name))}, imię ${r.gender==='K'?'żeńskie':'męskie'}">Wykres</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Nie znaleziono imienia. Spróbuj krótszego zapisu lub wybierz „Wszystkie”.</td></tr>';
  $('#heading-year').textContent=label(period);
  $('#result-count').textContent=`${fmt(visible.length)} ${query?'wyników wyszukiwania':'imion w zestawieniu'}`;
  $('#page-info').textContent=visible.length?`${fmt(page*pageSize+1)}–${fmt(Math.min((page+1)*pageSize,visible.length))} z ${fmt(visible.length)}`:'Brak wyników';
  $('#prev').disabled=page===0;$('#next').disabled=(page+1)*pageSize>=visible.length;
  $('#period-note').hidden=!period.endsWith('-H1');
  $('#stat-leader').textContent=rows[0]?displayName(rows[0].name):'—';
  $('#stat-leader-label').textContent=`lider${rows.length>1&&rows[1].count===rows[0].count?' (ex aequo)':''} · ${label(period)}`;
  document.querySelectorAll('[data-gender]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gender===gender)));
  syncURL();
}
function pointDescription(p){return `${label(p.period)}: ${p.count===null?'brak wpisu w źródle':`${fmt(p.count)} nadań · miejsce ${fmt(p.rank)} · udział ${pct(p.share)}`}`;}
function renderChart(){
  const points=series(data,selected.name,selected.gender,$('#chart-period').value==='half');
  const metric=$('#metric').value,valid=points.filter(p=>p[metric]!==null),isRank=metric==='rank';
  $('#detail-title').textContent=displayName(selected.name);$('#detail-gender').textContent=`IMIĘ ${selected.gender==='K'?'ŻEŃSKIE':'MĘSKIE'}`;
  const best=points.filter(p=>p.count!==null).sort((a,b)=>b.count-a.count)[0];
  $('#chart-summary').textContent=best?`Najwięcej nadań: ${fmt(best.count)} · ${label(best.period)}. ${isRank?'Miejsce 1 jest na górze wykresu.':$('#chart-period').value==='half'?'Każdy punkt obejmuje styczeń–czerwiec.':'Każdy punkt obejmuje pełny rok.'}`:'Brak wpisów dla tego imienia w wybranym rodzaju okresu.';
  $('#history-body').innerHTML=points.map(p=>`<tr><td>${label(p.period)}</td><td class="number">${p.count===null?'brak wpisu':fmt(p.count)}</td><td class="number">${p.rank===null?'—':fmt(p.rank)}</td><td class="number">${p.share===null?'—':pct(p.share)}</td></tr>`).join('');
  $('#point-info').textContent=valid.length?pointDescription(valid.at(-1)):'';
  const w=740,h=300,left=62,right=20,top=28,bottom=42,plotH=h-top-bottom;
  const max=Math.max(isRank?5:5,...valid.map(p=>p[metric]))*(isRank?1:1.08);
  const min=isRank?1:0;
  const x=i=>left+i*(w-left-right)/Math.max(1,points.length-1),y=v=>isRank?top+(v-min)/(max-min)*plotH:top+plotH-(v-min)/(max-min)*plotH;
  const value=v=>metric==='share'?`${v.toLocaleString('pl-PL',{maximumFractionDigits:1})}%`:fmt(Math.round(v));
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="group" aria-label="Wykres popularności imienia ${esc(displayName(selected.name))}"><title>${esc(displayName(selected.name))} — ${$('#metric').selectedOptions[0].textContent}</title>`;
  for(let i=0;i<=4;i++){const v=min+(max-min)*i/4,yy=y(v);svg+=`<line x1="${left}" x2="${w-right}" y1="${yy}" y2="${yy}" stroke="#dce1d5"/><text x="${left-10}" y="${yy+4}" text-anchor="end">${value(v)}</text>`;}
  const step=points.length>15?5:1;
  points.forEach((p,i)=>{if(i%step===0||i===points.length-1)svg+=`<text x="${x(i)}" y="${h-12}" text-anchor="middle">${p.period.slice(0,4)}</text>`;});
  let path='',pen=false;
  points.forEach((p,i)=>{if(p[metric]===null){pen=false;return;}path+=`${pen?'L':'M'}${x(i)},${y(p[metric])} `;pen=true;});
  svg+=`<path d="${path}" fill="none" stroke="#294f42" stroke-width="2.5" stroke-linejoin="round"/>`;
  points.forEach((p,i)=>{if(p[metric]!==null)svg+=`<circle cx="${x(i)}" cy="${y(p[metric])}" r="5" fill="#294f42" tabindex="0" role="img" aria-label="${esc(pointDescription(p))}" data-point="${i}"><title>${esc(pointDescription(p))}</title></circle>`;});
  svg+='</svg>';
  $('#chart').innerHTML=svg;
  $('#chart').querySelectorAll('[data-point]').forEach(el=>{const show=()=>{$('#point-info').textContent=pointDescription(points[Number(el.dataset.point)]);};el.addEventListener('pointerenter',show);el.addEventListener('focus',show);el.addEventListener('click',show);});
  syncURL();
}
function openDetail(name,sex,fromURL=false){
  selected={name,gender:sex};
  if(!fromURL)$('#chart-period').value=period.endsWith('-H1')?'half':'full';
  renderChart();if(!dialog.open)dialog.showModal();
}
async function init(){
  const response=await fetch(new URL('data/names.json',import.meta.url));if(!response.ok)throw new Error(`HTTP ${response.status}`);data=await response.json();
  const periods=Object.keys(data.periods).sort().reverse(),full=periods.filter(p=>!p.endsWith('-H1'));
  period=periods.includes(params.get('rok'))?params.get('rok'):full[0];gender=['K','M','all'].includes(params.get('plec'))?params.get('plec'):'K';
  $('#period').innerHTML=`<optgroup label="Pełne lata">${full.map(p=>`<option value="${p}">${p}</option>`).join('')}</optgroup><optgroup label="Pierwsze półrocza">${periods.filter(p=>p.endsWith('-H1')).map(p=>`<option value="${p}">${label(p)}</option>`).join('')}</optgroup>`;
  $('#period').value=period;$('#search').value=params.get('szukaj')||'';
  const unique=new Map();for(const rows of Object.values(data.periods))for(const [name,sex] of rows)unique.set(`${sex}:${name}`,{name,gender:sex});allNames=[...unique.values()];
  $('#stat-years').textContent=fmt(full.length);$('#stat-names').textContent=fmt(new Set(allNames.map(r=>r.name)).size);$('#latest-year').textContent=periods[0].slice(0,4);
  $('#updated').textContent=`Dane pobrano: ${data.updated}. Zakres: ${full.at(-1)}–${full[0]} (pełne lata). Poniżej wszystkie wykorzystane pliki CSV.`;
  $('#source-list').innerHTML=data.sources.toSorted((a,b)=>a.title.localeCompare(b.title,'pl')).map(s=>`<li><a href="${esc(s.url)}">${esc(s.title)}</a></li>`).join('');
  $('#search').addEventListener('input',()=>{page=0;render();});$('#period').addEventListener('change',()=>{period=$('#period').value;page=0;render();});$('#sort').addEventListener('change',()=>{page=0;render();});
  document.querySelectorAll('[data-gender]').forEach(b=>b.addEventListener('click',()=>{gender=b.dataset.gender;page=0;render();}));
  $('#names-body').addEventListener('click',e=>{const b=e.target.closest('[data-name]');if(b)openDetail(b.dataset.name,b.dataset.sex);});
  for(const [id,delta] of [['prev',-1],['next',1]])$(`#${id}`).addEventListener('click',()=>{page+=delta;render();$('#ranking').scrollIntoView({block:'start'});});
  $('#metric').addEventListener('change',renderChart);$('#chart-period').addEventListener('change',renderChart);
  $('#close-detail').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{selected=null;syncURL();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  $('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#copy-link').textContent='Skopiowano';}catch{$('#copy-link').textContent='Skopiuj adres z paska';}setTimeout(()=>$('#copy-link').textContent='Kopiuj link',2200);});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!dialog.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});
  render();
  const requested=params.get('imie')?.toLocaleUpperCase('pl'),sex=params.get('imiePlec');
  if(allNames.some(r=>r.name===requested&&r.gender===sex)){
    $('#chart-period').value=params.get('wykres')==='half'?'half':'full';$('#metric').value=['count','share','rank'].includes(params.get('miara'))?params.get('miara'):'count';openDetail(requested,sex,true);
  }
}
init().catch(error=>{console.error(error);$('#names-body').innerHTML='<tr><td colspan="6" class="empty">Nie udało się wczytać danych. <button type="button" id="retry">Spróbuj ponownie</button></td></tr>';$('#result-count').textContent='Błąd wczytywania danych';$('#retry').addEventListener('click',()=>location.reload());});
