import {athletes,ekiden,nameSearch,officialAthleteName,parseTime,personalResults,specialtyPbs} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';

const storageKey='atlas-athlete-watch';
const readSaved=()=>{
 try{
   const value=JSON.parse(localStorage.getItem(storageKey));
   return new Set(Array.isArray(value)?value.filter(item=>typeof item==='string'):[]);
 }catch{return new Set();}
};
const saved=readSaved();
const comparison=new Set();
let event='5000m';

export function toggleWatched(name){
 const key=nameSearch(name);
 if(saved.delete(key))comparison.delete(key);
 else saved.add(key);
 try{localStorage.setItem(storageKey,JSON.stringify([...saved]));}catch{}
}

export function setCompared(name,checked){
 const key=nameSearch(name);
 if(!checked)comparison.delete(key);
 else if(saved.has(key)&&comparison.size<3)comparison.add(key);
}

const events=[['1500m','pb1500'],['5000m','pb5000'],['10000m','pb10000'],['ハーフマラソン','pbHalf'],['マラソン',null]];
const eventMatch=(row,value)=>recordLabel(row.event).replace(/\s/g,'')===value;
const dated=row=>String(row.date||row.year||'');
const byDate=(a,b)=>dated(b).localeCompare(dated(a));
const usable=row=>row.time&&Number.isFinite(parseTime(row.time));
const athleteHref=name=>'#athletes?name='+encodeURIComponent(name);

export function setWatchEvent(value){
 if(events.some(([key])=>key===value))event=value;
}

export function watchStar(name,t,E){
 const active=saved.has(nameSearch(name));
 return `<button class="btn btn-sm watch-star" type="button" data-watch-name="${E(name)}"
 aria-pressed="${active}" aria-label="${E(t('watchToggle',{name:officialAthleteName(name)}))}">${active?'★':'☆'}</button>`;
}

// Matched recent editions share the published course and leg distances.
// https://www.hakone-ekiden.jp/course/
// https://www.izumo-ekiden.jp/outline/
// https://daigaku-ekiden.com/about/index.html
const relayEditions={
 hak:{2025:[101,'2025-01-02','2025-01-03'],2026:[102,'2026-01-02','2026-01-03']},
 izu:{2025:[37,'2025-10-13'],2026:[38,'2026-10-12']},
 zen:{2025:[57,'2025-11-02'],2026:[58,'2026-11-01']}
};
const relayDistances={
 hak:[21.3,23.1,21.4,20.9,20.8,20.8,21.3,21.4,23.1,23],
 izu:[8,5.8,8.5,6.2,6.4,10.2],
 zen:[9.5,11.1,11.9,11.8,12.4,12.8,17.6,19.7]
};

function relayRows(selected,raceName){
 const keys=new Set(selected.map(row=>nameSearch(row.name)));
 const groups=new Map();
 for(const race of ekiden()){
   if(!['hak','izu','zen'].includes(race.race)||!race.source)continue;
   for(const leg of race.legs){
     const key=nameSearch(leg.name);
     if(!keys.has(key)||!leg.leg||!usable(leg))continue;
     const edition=relayEditions[race.race][race.year];
     const sameCourse=edition&&(!leg.km||Number(leg.km)===relayDistances[race.race][leg.leg-1]);
     const groupKey=`${race.race}:${sameCourse?'2025-26':race.year}:${leg.leg}`;
     const group=groups.get(groupKey)||{title:`${raceName(race.race)} · ${leg.leg}`,rows:new Map()};
     const rows=group.rows.get(key)||[];
     const date=edition?(race.race==='hak'&&leg.leg>5?edition[2]:edition[1]):race.date;
     rows.push({...leg,source:race.source,date,year:race.year,edition:race.edition||edition?.[0]});
     group.rows.set(key,rows);
     groups.set(groupKey,group);
   }
 }
 return [...groups.values()].filter(group=>group.rows.size>1);
}

export function renderWatchPage({t,E,sourceLink,raceName}){
 const watched=athletes().filter(row=>saved.has(nameSearch(row.name)));
 const selected=watched.filter(row=>comparison.has(nameSearch(row.name)));
 const year=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Tokyo',year:'numeric'}).format(new Date()));
 const value=(row,relay=false)=>row?.time?`<strong class="mono">${E(row.time)}</strong>
 <span class="subline">${E(relay?(row.edition?t('watchEdition',{year:row.year,edition:row.edition}):row.year):meetLabel(row.meet))}</span>
 <span class="subline">${E(dated(row)||t('watchUnknownDate'))} · ${sourceLink(row.source)||E(t('watchUnknownSource'))}</span>`:'—';
 const rows=selected.length>=2?personalResults():[];
 const [,pbField]=events.find(([key])=>key===event);
 const columns=selected.map(athlete=>{
   const key=nameSearch(athlete.name);
   const marks=rows.filter(row=>nameSearch(row.name)===key&&eventMatch(row,event)&&usable(row)).sort(byDate);
   const specialized=pbField?null:specialtyPbs(athlete.name).find(row=>eventMatch(row,event)&&usable(row));
   const racePb=marks.filter(row=>row.pb).sort((a,b)=>parseTime(a.time)-parseTime(b.time))[0];
   const time=(pbField?athlete[pbField]:specialized?.time)||racePb?.time;
   const pbMatch=marks.find(row=>row.time===time&&row.pb)||marks.find(row=>row.time===time&&row.source);
   const pb=time?{...specialized,...pbMatch,time,source:pbMatch?.source||(pbField?athlete._pbSources?.[pbField]:specialized?.source)}:null;
   const best=marks.filter(row=>Number(dated(row).slice(0,4))===year).sort((a,b)=>parseTime(a.time)-parseTime(b.time))[0];
   const recent=[...new Map(marks.filter(row=>dated(row)).map(row=>[[dated(row),meetLabel(row.meet),row.time].join('|'),row])).values()].slice(0,3);
   return {pb,best,recent};
 });
 const table=(caption,body)=>`<div class="table-wrap watch-table"><table class="data-table"><caption>${E(caption)}</caption>
 <thead><tr><th scope="col">${E(t('event'))}</th>${selected.map(row=>`<th scope="col"><a href="${athleteHref(row.name)}">${E(officialAthleteName(row.name))}</a></th>`).join('')}</tr></thead>
 <tbody>${body}</tbody></table></div>`;
 const row=(label,cells)=>`<tr><th scope="row">${E(label)}</th>${cells.map(cell=>`<td>${cell}</td>`).join('')}</tr>`;
 const relays=selected.length>=2?relayRows(selected,raceName):[];
 return `<a class="btn btn-sm" href="#athletes">← ${E(t('navAthletes'))}</a>
 <h1>${E(t('watchTitle'))}</h1><p>${E(t('watchIntro'))}</p>
 ${watched.length?`<ul class="watch-list">${watched.map(athlete=>{
   const checked=comparison.has(nameSearch(athlete.name));
   return `<li><a href="${athleteHref(athlete.name)}">${E(officialAthleteName(athlete.name))}</a>
   ${watchStar(athlete.name,t,E)} <label><input type="checkbox" data-compare-name="${E(athlete.name)}" aria-label="${E(t('watchCompare')+' '+officialAthleteName(athlete.name))}" ${checked?'checked':selected.length>=3?'disabled':''}> ${E(t('watchCompare'))}</label></li>`;
 }).join('')}</ul>`:`<p>${E(t('watchEmpty'))}</p>`}
 ${selected.length>=2?`<label class="field watch-event">${E(t('event'))}<select id="watch-event">${events.map(([key])=>`<option value="${E(key)}" ${event===key?'selected':''}>${E(key)}</option>`).join('')}</select></label>
 ${table(t('watchComparison'),row(t('pb'),columns.map(c=>value(c.pb)))+row(t('watchSeason',{year}),columns.map(c=>value(c.best)))+
 row(t('watchRecent'),columns.map(c=>c.recent.length?`<ul>${c.recent.map(r=>`<li>${value(r)}</li>`).join('')}</ul>`:'—')))}
 <h2>${E(t('watchRelay'))}</h2><p>${E(t('watchRelayNote'))}</p>
 ${relays.length?table(t('watchRelay'),relays.map(group=>row(group.title,selected.map(athlete=>{
   const marks=group.rows.get(nameSearch(athlete.name))||[];
   return marks.length?`<ul>${marks.map(mark=>`<li>${value(mark,true)}</li>`).join('')}</ul>`:'—';
 }))).join('')):`<p>${E(t('watchRelayEmpty'))}</p>`}`:''}`;
}
