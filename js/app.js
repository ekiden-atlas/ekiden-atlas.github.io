import {ATHLETE_SOCIAL_LINKS} from '../data/athlete-social-links.js';
import {OFFICIAL_LINK_GROUPS} from '../data/official-links.js';
import {t,language,setLanguage,translateStatic} from './i18n.js';
import {loadData,state,athletes,athlete,worldRankings,ekiden,schoolRecords,alltimeRankings,parseTime,formatPace,personalResults,specialtyPbs,sectionRecords,legHonors,athleteEkidenHonors,nameSearch,comparisonRankings} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';
import {DATA_SNAPSHOT} from '../data/roster.js';
import {renderAdminPage,detachAdmin} from './admin.js';
const app=document.querySelector('#app');
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=v=>{try{const u=new URL(String(v));return u.protocol==='https:'&&!u.username&&!u.password&&!/(?:^|\.)(github\.com|github\.io|githubusercontent\.com)$/.test(u.hostname)?u.href:null;}catch{return null;}};
const sourceLink=(url,label=t('viewSource'))=>{const href=validUrl(url);return href?`<a href="${E(href)}" target="_blank" rel="noopener noreferrer">${E(label)} ↗</a>`:'';};
const raceName=r=>t({hak:'introHak',izu:'introIzu',zen:'introZen'}[r]||'introHak');
const gradeName=n=>t({1:'first',2:'second',3:'third',4:'fourth'}[n]||'notRecorded');
function verifiedContext(name){
 const rows=comparisonRankings().filter(row=>row.name===name);
 return rows.length?`<div class="verified-context">${rows.map(row=>`<div>
 <small>${E(t(row.scope))} · ${E(row.asOf)}</small>
 <strong>${E(t('rankPosition',{rank:row.rank}))}</strong>${sourceLink(row.source)}</div>`).join('')}</div>`:'';
}
function toast(s){const x=document.querySelector('#toast');x.textContent=s;x.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>x.hidden=true,4700);}
function pageIntro(k,desc){return `<header class="page-intro"><div class="wrap"><span class="eyebrow">EKIDEN ATLAS · DATA</span><h1>${E(t(k))}</h1><p>${E(t(desc))}</p></div></header>`;}
function yearOption(years){return [...new Set(years)].filter(Boolean).sort((a,b)=>b-a).map(y=>`<option value="${E(y)}">${E(y)}</option>`).join('');}
function renderOfficialLinks(showUniversity){
 const groups=showUniversity?OFFICIAL_LINK_GROUPS:OFFICIAL_LINK_GROUPS.slice(0,2);
 return `<section class="section" aria-labelledby="official-links-title">
 <div class="section-head"><h2 id="official-links-title">${E(t('officialLinks'))}</h2>
 ${showUniversity?'':`<a class="btn btn-sm" href="#guide?official=1">${E(t('allOfficialLinks'))} →</a>`}</div>
 <div class="guide-grid">${groups.map(group=>`<div class="card">
 <h3>${E(t(group.title))}</h3>
 <ul class="official-link-list">${group.links.map(([label,url])=>`<li>${sourceLink(url,t(label))}</li>`).join('')}</ul>
 ${showUniversity?`<p class="micro">${sourceLink(group.source,t('viewSource'))}</p>`:''}
 </div>`).join('')}</div></section>`;
}
function renderHome(){const recent=ekiden().filter(x=>x.year===2026 && x.total).slice(0,3);return `<section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><span class="eyebrow">${E(t('heroEyebrow'))}</span><h1>${E(t('heroTitle'))}<span>${E(t('heroTitle2'))}</span></h1><p>${E(t('heroDesc'))}</p><div class="actions"><a class="btn btn-on-dark" href="#athletes">${E(t('heroAction'))} →</a><a class="btn btn-outline-dark" href="#archive">${E(t('heroAction2'))} ↗</a></div></div><div class="hero-art" aria-hidden="true"><strong>42.195</strong><small>RUN / CONNECT / REMEMBER</small></div></div></section><div class="wrap"><div class="statrow"><div><small>${E(t('heroStat1'))}</small><strong>${athletes().length}</strong></div><div><small>${E(t('heroStat2'))}</small><strong>03</strong></div><div><small>${E(t('heroStat3'))}</small><strong>${worldRankings().length}</strong></div></div><div class="intro-grid"><div class="intro-panel"><span class="eyebrow">THE CULTURE OF EKIDEN</span><h3>${E(t('introLabel'))}</h3><div class="accent-line"></div><p>${E(t('intro'))}</p><a class="btn btn-sm" href="#guide">${E(t('navGuide'))} →</a></div><div class="race-mini">${['Hak','Izu','Zen'].map((k,i)=>`<article><div class="index">0${i+1}</div><div><h4>${E(t('intro'+k))}</h4><p>${E(t('intro'+k+'Desc'))}</p></div></article>`).join('')}</div></div></div>
<section class="section soft-section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">RECENT RACES · 2026</span><h2>${E(t('latest'))}</h2><p>${E(t('latestDesc'))}</p></div><a class="btn btn-sm" href="#archive">${E(t('navEkiden'))} →</a></div><div class="results-mini">${recent.map(r=>`<article class="result-card"><span class="micro">${r.year} / ${E(raceName(r.race))}</span><div class="big">${E(r.total)}</div><p>${E(t('teamRank'))} · ${E(r.rank||t('notRecorded'))}</p>${sourceLink(r.source)}</article>`).join('')||`<p>${E(t('empty'))}</p>`}</div></div></section><div class="wrap">${renderOfficialLinks(false)}</div><div class="wrap statusbar">${E(t('sourceFallback'))} · ${E(DATA_SNAPSHOT)}</div>`;}
function athleteRows(rows){return rows.map(a=>`<tr><td><a href="#athletes?name=${encodeURIComponent(a.name)}">${E(a.name)}</a><span class="subline">${E(gradeName(a.grade))} · ${E(t({女:'female',男:'male'}[a.gender]||'notRecorded'))}</span></td><td class="mono">${E(a.pb1500||'—')}</td><td class="mono">${E(a.pb5000||'—')}</td><td class="mono">${E(a.pb10000||'—')}</td><td class="mono">${E(a.pbHalf||'—')}</td><td>${sourceLink(a.source_url)||E(t('sourceFallback'))}</td></tr>`).join('');}
let filter={q:'',grade:'all',gender:'all',metric:'pb5000'};
function renderAthleteTable(){const root=document.querySelector('#athlete-rows');if(!root)return;let rows=athletes().filter(a=>(!filter.q||nameSearch(a.name).includes(nameSearch(filter.q)))&&(filter.grade==='all'||String(a.grade)===filter.grade)&&(filter.gender==='all'||a.gender===filter.gender));rows.sort((a,b)=>parseTime(a[filter.metric])-parseTime(b[filter.metric]));root.innerHTML=athleteRows(rows)||`<tr><td colspan="6">${E(t('empty'))}</td></tr>`;document.querySelector('#athlete-count').textContent=String(rows.length);}
function renderAthleteSocialLinks(name){
 const match=Object.keys(ATHLETE_SOCIAL_LINKS).find(key=>nameSearch(key)===nameSearch(name));
 if(!match)return '';
 return `<div><h3>${E(t('athleteSocialLinks'))}</h3><ul class="official-link-list">
 ${ATHLETE_SOCIAL_LINKS[match].map(([platform,url,source])=>`<li>${sourceLink(url,platform)}
 <small>${sourceLink(source,t('accountSource',{platform}))}</small></li>`).join('')}
 </ul></div>`;
}
function profileDetail(name){
 const a=athlete(name)||{name};
 const basics=[['school','high_school'],['birthday','birthday'],['birthplace','birthplace'],['hometown','hometown'],['height','height_cm']];
const metrics=[['1500m','pb1500',1.5],['5000m','pb5000',5],['10000m','pb10000',10],['ハーフマラソン','pbHalf',21.0975]];const field=a.pb5000?'pb5000':a.pb10000?'pb10000':'pb1500';const valid=athletes().filter(x=>x.gender===a.gender&&Number.isFinite(parseTime(x[field]))).sort((x,y)=>parseTime(x[field])-parseTime(y[field]));const pos=valid.findIndex(x=>x.name===name)+1;const ranks=worldRankings(name);return `<div class="split" style="margin-top:22px"><article class="detail-panel"><span class="micro">ATHLETE PROFILE · ${E(t('snapshot'))}</span><h1>${E(name)}</h1><p>${E(gradeName(a.grade))} · ${E(t({女:'female',男:'male'}[a.gender]||'notRecorded'))}</p>${a.graduation_year?`<p>${E(t('graduated'))} · ${E(a.graduation_year)} ${sourceLink(a.graduation_source)}</p>`:''}${a.mainEvent?`<p>${E(t('event'))} · ${E(recordLabel(a.mainEvent))}</p>`:''}${basics.map(([label,key])=>`<div class="row-meta">${E(t(label))} · ${E(a[key]??t('notRecorded'))}${key==='height_cm'&&a[key]?' cm':''}</div>`).join('')}
 <div class="row-meta">${E(t('dataUpdated'))} · ${E(a.updated_at?.slice(0,10)||DATA_SNAPSHOT)} ${sourceLink(a.source_url)}</div>${renderAthleteSocialLinks(name)}<h3>${E(t('pb'))}</h3><div class="detail-grid">${metrics.map(([title,key,km])=>`<div><small>${E(title)} · PB</small><b class="mono">${E(a[key]||'—')}</b><small>${a[key]?E(t('pace')+' '+formatPace(a[key],km)):E(t('notRecorded'))}</small>${sourceLink(a._pbSources?.[key])}</div>`).join('')}</div>${specialtyPbs(name).map(r=>`<p>${E(recordLabel(r.event))} · PB <b>${E(r.time)}</b> ${sourceLink(r.source)}</p>`).join('')}<p class="titleline">${E(t('athleteMetric'))}</p><p>${E(t('internalSort'))}</p>${verifiedContext(name)}${pos?`<div class="rank-badge">${E(t('internalTag',{rank:pos,total:valid.length}))}</div><div class="progress-track"><i style="width:${Math.max(4,100*(valid.length-pos+1)/valid.length)}%"></i></div>`:`<p>${E(t('notRanked'))}</p>`}</article><article class="detail-panel"><h3>${E(t('globalTitle'))}</h3><p>${E(t('globalNote'))}</p>${ranks.length?ranks.map(r=>`<div class="card" style="margin-top:11px;padding:16px"><div class="card-top"><strong>${E(recordLabel(r.event_name))}</strong><span class="tag">${E(t('worldRank'))} ${E(r.world_rank??'—')}</span></div><p>${E(t('asiaRank'))} · ${E(r.asia_rank??t('notRecorded'))}<br>
 ${E(t('rankingPoints'))} · ${E(r.ranking_points??t('notRecorded'))}<br>
 ${E(t('rankingDate'))} · ${E(r.ranking_date)}</p>
 ${sourceLink(r.source_url,t('worldRankingSource'))} ${sourceLink(r.asia_source_url,t('asiaRankingSource'))}</div>`).join(''):`<p>${E(t('notRanked'))}</p>`}<p>${E(t('rankDisclosure'))}</p><p>${E(t('termWorldDesc'))}</p></article></div>`;}
function honorBadges(honors){
 return honors.map(honor=>`<span class="tag">${sourceLink(honor.source,t(honor.kind))||E(t(honor.kind))}</span>`).join(' ');
}
function renderAthleteHonors(rows){
 if(!rows.length)return '';
 return `<section class="section"><h2>${E(t('ekidenHonors'))}</h2>
 <p>${E(t('ekidenHonorsNote'))}</p>
 <div class="table-wrap"><table class="data-table"><thead><tr>
 ${['years','meet','section','resultMark','ekidenHonors'].map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}
 </tr></thead><tbody>${rows.map(row=>`<tr><td>${E(row.year)}</td><td>${E(raceName(row.race))}</td>
 <td>${E(row.leg)}</td><td class="mono">${E(row.time)}</td><td>${honorBadges(row.honors)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function renderAthletes(){const params=new URLSearchParams(location.hash.split('?')[1]||'');const name=params.get('name');if(name){
 const matches=athletes().filter(row=>nameSearch(row.name)===nameSearch(name));
 const known=athlete(name)||(matches.length===1?matches[0]:null);
 const canonical=known?.name||name;
 const records=athleteResultRows(canonical);
 const honors=athleteEkidenHonors(canonical);
 return `<section class="wrap section"><a class="btn btn-sm" href="#athletes">← ${E(t('navAthletes'))}</a>
 ${known||records.length||honors.length?profileDetail(canonical):`<p role="status">${E(t(dataLoaded?'empty':'loading'))}</p>`}
 ${renderAthleteHonors(honors)}
 ${known||records.length||honors.length?`<section class="section"><h2>${E(t('athleteResults'))}</h2>${resultPanel(records,false)}</section>`:''}
 </section>`;
 }
 return pageIntro('navTitleAthletes','athletesDesc')+`<div class="wrap section"><div class="filterbar"><label class="field">${E(t('search'))}<input id="filter-q" type="search" value="${E(filter.q)}" placeholder="${E(t('searchPlace'))}"></label><label class="field">${E(t('filterGrade'))}<select id="filter-grade"><option value="all">${E(t('all'))}</option>${[1,2,3,4].map(n=>`<option value="${n}" ${filter.grade===String(n)?'selected':''}>${E(gradeName(n))}</option>`).join('')}</select></label><label class="field">${E(t('filterGender'))}<select id="filter-gender"><option value="all">${E(t('all'))}</option><option value="男">${E(t('male'))}</option><option value="女">${E(t('female'))}</option></select></label><label class="field">${E(t('filterEvent'))}<select id="filter-metric">${[['pb5000','5000m'],['pb10000','10000m'],['pb1500','1500m'],['pbHalf','ハーフマラソン']].map(([v,l])=>`<option value="${v}" ${filter.metric===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="card-top" style="margin-bottom:12px"><span class="micro">${E(t('snapshot'))} · <span id="athlete-count">${athletes().length}</span></span><span class="micro">${E(DATA_SNAPSHOT)}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>${E(t('profile'))}</th><th>1500m · PB</th><th>5000m · PB</th><th>10000m · PB</th><th>ハーフマラソン · PB</th><th>${E(t('source'))}</th></tr></thead><tbody id="athlete-rows"></tbody></table></div><div class="note">${E(t('sourceFallback'))} · ${E(t('rankDisclosure'))}</div></div>`;}
function renderSectionRecords(){
 const records=sectionRecords().filter(row=>raceFilters.race==='all'||row.race===raceFilters.race);
 if(!records.length)return '';
 const headers=['navEkiden','section','profile','affiliation','years','resultMark','scope','previousMark','source'];
 return `<details class="race-detail"><summary>${E(t('sectionRecords'))}</summary><div class="inside table-wrap"><table class="data-table">
 <thead><tr>${headers.map(key=>`<th>${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody>${records.map(r=>`<tr><td>${E(raceName(r.race))}</td><td>${E(r.leg)}</td>
 <td>${E(r.name)}</td><td>${E(r.unit||'—')}</td><td>${E(r.year)}</td><td>${E(r.time)}</td>
 <td>${E(t(r.scope==='japanese'?'japaneseScope':'meetScope'))}</td>
 <td>${E([r.previous,r.previousHolder].filter(Boolean).join(' · ')||'—')}</td><td>${sourceLink(r.source)}</td></tr>`).join('')||`<tr><td colspan="9">${E(t('empty'))}</td></tr>`}</tbody></table></div></details>`;
}
const resultsPageSize=50;
let resultsPage=0;
let dataLoaded=false;
function athleteResultRows(name){
 return personalResults().filter(row=>nameSearch(row.name)===nameSearch(name));
}
function renderResults(){
 const params=new URLSearchParams(location.hash.split('?')[1]||'');
 return pageIntro('navResults','resultsDesc')+`<section class="wrap section">
 ${resultPanel(personalResults(),true,params.get('name')||'')}</section>`;
}
function resultPanel(records,showAthlete,name=''){
 const names=[...new Set(records.map(row=>row.name))].sort((a,b)=>a.localeCompare(b,'ja'));
 const meets=[...new Set(records.map(row=>meetLabel(row.meet)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
 const events=[...new Set(records.map(row=>recordLabel(row.event)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));
 const headers=[...(showAthlete?['profile']:[]),'date','meet','event','resultMark','rank','resultStatus','source'];
 resultsPage=0;
 return `<div class="filterbar results-filters">
 ${showAthlete?`<label class="field">${E(t('resultSearch'))}<input id="result-q" type="search" list="result-names" value="${E(name)}"></label>
 <datalist id="result-names">${names.map(value=>`<option value="${E(value)}"></option>`).join('')}</datalist>`:''}
 <label class="field">${E(t('filterYear'))}<select id="result-year"><option value="">${E(t('all'))}</option>${yearOption(records.map(row=>row.year))}</select></label>
 <label class="field">${E(t('meet'))}<select id="result-meet"><option value="">${E(t('all'))}</option>
 ${meets.map(value=>`<option value="${E(value)}">${E(value)}</option>`).join('')}</select></label>
 <label class="field">${E(t('event'))}<select id="result-event"><option value="">${E(t('all'))}</option>
 ${events.map(value=>`<option value="${E(value)}">${E(value)}</option>`).join('')}</select></label>
 <label class="field">${E(t('groupResults'))}<select id="result-group">
 <option value="year">${E(t('years'))}</option><option value="meet">${E(t('meet'))}</option></select></label>
 <label class="field">${E(t('resultStatus'))}<select id="result-status"><option value="">${E(t('all'))}</option><option value="student">${E(t('student'))}</option><option value="OB">OB / OG</option></select></label>
 </div>${showAthlete?`<p>${E(t('resultsMatching'))}</p>`:''}
 <p id="result-count" role="status"></p><div class="table-wrap"><table class="data-table">
 <thead><tr>${headers.map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody id="result-rows">${!dataLoaded?`<tr><td colspan="${headers.length}">${E(t('loading'))}</td></tr>`:''}</tbody></table></div><div class="actions">
 <button id="result-prev" class="btn" type="button" disabled>${E(t('previousPage'))}</button>
 <button id="result-next" class="btn" type="button" disabled>${E(t('nextPage'))}</button></div>`;
}
function updateResults(reset=false){
 const root=document.querySelector('#result-rows');
 if(!root)return;
 if(reset)resultsPage=0;
 const name=new URLSearchParams(location.hash.split('?')[1]||'').get('name');
 const isProfile=location.hash.split('?')[0]==='#athletes'&&Boolean(name);
 const records=isProfile?athleteResultRows(name):personalResults();
 const q=nameSearch(document.querySelector('#result-q')?.value);
 const year=document.querySelector('#result-year').value;
 const status=document.querySelector('#result-status').value;
 const meet=document.querySelector('#result-meet').value;
 const event=document.querySelector('#result-event').value;
 const group=document.querySelector('#result-group').value;
 const groups=new Map();
 const matching=records.filter(r=>(!event||recordLabel(r.event)===event)&&(!meet||meetLabel(r.meet)===meet)&&(!year||String(r.year)===year)&&(!status||r.status===status)&&
   (!q||[r.name,r.meet,r.meetAlias,r.event,meetLabel(r.meet),recordLabel(r.event),r.location,recordLabel(r.location)].some(value=>nameSearch(value).includes(q))));
 for(const row of matching){
   const key=(group==='meet'?meetLabel(row.meet):String(row.year||''))||t('notRecorded');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push({row,key});
 }
 const rows=[...groups.values()].flat();
 const colspan=isProfile?7:8;
 let currentGroup;
 const start=resultsPage*resultsPageSize;
 const labels={primary:'resultPrimary',legacy:'resultLegacy',workbook:'resultWorkbook',cited:'resultCited',legacyEdit:'resultLegacyEdit'};
 root.innerHTML=rows.slice(start,start+resultsPageSize).map(({row:r,key})=>{
 const heading=key===currentGroup?'':`<tr class="result-group-heading"><td colspan="${colspan}"><strong>${E(key)}</strong> · ${groups.get(key).length}</td></tr>`;
 currentGroup=key;
 return heading+`<tr>
 ${isProfile?'':`<td><a href="#athletes?name=${encodeURIComponent(r.name)}">${E(r.name)}</a><span class="subline">${r.gradeAtRace||r.grade?E(gradeName(r.gradeAtRace||r.grade)):''}</span></td>`}
 <td>${E(r.date||r.year||'—')}</td><td>${E(meetLabel(r.meet))}<span class="subline">${E([r.location,r.unit].filter(Boolean).map(recordLabel).join(' · '))}</span></td>
 <td>${E(recordLabel(r.event))}<span class="subline">${E(recordLabel(r.stage))}</span></td><td class="mono">${E(r.time||'—')}${r.pb?' · PB':''}</td>
 <td>${E(({冠军:'1',亚军:'2',季军:'3'})[r.rank]??r.rank??'—')}</td>
 <td>${E(r.status==='OB'?'OB / OG':t(r.status==='student'?'student':'notRecorded'))}</td>
 <td>${E(t(r._managed?'resultManaged':labels[r.verification]||'resultLegacy'))}
 <span class="subline">${E(String(r._updatedAt||r.updated_at||state.official?.meta?.fetched||DATA_SNAPSHOT).slice(0,10))}</span>
 ${sourceLink(r.source)}</td></tr>`;}).join('')||`<tr><td colspan="${colspan}">${E(t(state.officialOnline?'empty':'historyFailed'))}</td></tr>`;
 document.querySelector('#result-count').textContent=t('resultCount',{start:rows.length?start+1:0,end:Math.min(start+resultsPageSize,rows.length),total:rows.length});
 document.querySelector('#result-prev').disabled=!resultsPage;
 document.querySelector('#result-next').disabled=start+resultsPageSize>=rows.length;
}
let raceFilters={race:'all',year:'all'};
function renderRaceList(){const root=document.querySelector('#race-results');if(!root)return;const rows=ekiden().filter(x=>(raceFilters.race==='all'||x.race===raceFilters.race)&&(raceFilters.year==='all'||String(x.year)===raceFilters.year));root.innerHTML=rows.map(r=>`<details class="race-detail"><summary><div><span class="micro">${E(r.year)} / ${E(raceName(r.race))}</span><br><strong>${E(t('teamRank'))} ${E(r.rank??'—')} · ${E(t('time'))} ${E(r.total||'—')}</strong></div><span>⌄</span></summary><div class="inside"><div class="table-wrap"><table class="data-table"><thead><tr><th>${E(t('section'))}</th><th>${E(t('profile'))}</th><th>${E(t('time'))}</th><th>${E(t('legRank'))}</th><th>km</th><th>${E(t('handoffRank'))}</th><th>${E(t('ekidenHonors'))}</th></tr></thead><tbody>${(r.legs||[]).map(l=>`<tr><td>${E(l.leg)}</td><td>${E(l.name)}</td><td class="mono">${E(l.time)}</td><td>${E(l.rank??'—')}</td><td>${E(l.km??'—')}</td><td>${E(l.team_position??'—')}</td><td>${honorBadges(legHonors(r,l))||'—'}</td></tr>`).join('')||`<tr><td colspan="7">${E(t('notRecorded'))}</td></tr>`}</tbody></table></div><p>${[r.date,r.distance,r.reason||r.status,r.source_format_note].filter(Boolean).map(value=>E(recordLabel(value))).join(' · ')}</p>${r.out||r.back?`<p>${E(t('outbound'))} ${E(r.out??'—')} (${E(r.out_rank??'—')}) / ${E(t('returnLeg'))} ${E(r.back??'—')} (${E(r.back_rank??'—')})</p>`:''}<p>${sourceLink(r.source)}</p></div></details>`).join('')||`<p class="empty">${E(t('empty'))}</p>`;}
function renderRaceFilters(){
 const years=ekiden().filter(row=>raceFilters.race==='all'||row.race===raceFilters.race).map(row=>row.year);
 return `<label class="field">${E(t('filterRace'))}<select id="race-type">
 <option value="all">${E(t('all'))}</option>
 ${['hak','izu','zen'].map(race=>`<option value="${race}">${E(raceName(race))}</option>`).join('')}</select></label>
 <label class="field">${E(t('filterYear'))}<select id="race-year">
 <option value="all">${E(t('all'))}</option>${yearOption(years)}</select></label>`;
}
const archiveTabs=[['ekiden','navEkiden','#archive'],['school','schoolRecords','#archive/school'],['alltime','allTime','#archive/alltime']];
const rankingFilters={
 school:{gender:'all',event:'',name:''},
 alltime:{gender:'all',event:'',name:''}
};
function archiveTab(path){
 if(path==='history'||path==='archive/alltime')return 'alltime';
 if(path==='archive/school')return 'school';
 if(['archive','archive/ekiden','ekiden'].includes(path))return 'ekiden';
 return null;
}
function renderArchive(tab){
 const tabs=`<nav class="archive-tabs" aria-label="${E(t('navArchive'))}">
 ${archiveTabs.map(([id,label,href])=>`<a href="${href}" ${tab===id?'aria-current="page"':''}>${E(t(label))}</a>`).join('')}</nav>`;
 const controls=tab==='ekiden'?renderRaceFilters():renderRankingFilters(tab);
 return pageIntro('navArchive','archiveDesc')+`<section class="wrap section archive-section">
 ${tabs}<p class="micro">${E(t('lastChecked'))} · ${E(state.official?.meta?.refreshed||state.official?.meta?.fetched||DATA_SNAPSHOT)}
 ${tab==='ekiden'?'':sourceLink('https://waseda-ac.jp/record/')}</p>
 <div class="filterbar">${controls}</div>
 ${tab==='ekiden'
   ?`<div id="race-results" class="race-grid"></div><p class="note">${E(t('historyNote'))}</p><div id="section-records">${renderSectionRecords()}</div>`
   :'<div id="history-results"></div>'}</section>`;
}
function rankingRows(tab){
 return tab==='school'?schoolRecords():alltimeRankings();
}
function renderRankingFilters(tab){
 const filter=rankingFilters[tab];
 const events=[...new Set(rankingRows(tab).map(row=>recordLabel(row.event)).filter(Boolean))];
 return `<label class="field">${E(t('event'))}<select id="history-event"><option value="">${E(t('all'))}</option>
 ${events.map(event=>`<option value="${E(event)}">${E(event)}</option>`).join('')}</select></label>
 <label class="field">${E(t('filterGender'))}<select id="history-gender">
 <option value="all">${E(t('all'))}</option><option value="男">${E(t('male'))}</option><option value="女">${E(t('female'))}</option></select></label>
 ${tab==='alltime'?`<label class="field">${E(t('search'))}<input id="history-search" type="search" value="${E(filter.name)}"></label>`:''}`;
}
function historyTable(tab){
 const host=document.querySelector('#history-results');
 if(!host)return;
 const filter=rankingFilters[tab];
 const hasRank=tab==='alltime';
 const headers=[...(hasRank?['rank']:[]),'profile','event','resultMark',hasRank?'years':'date','source'];
 const rows=rankingRows(tab).filter(row=>(filter.gender==='all'||row.gender===filter.gender)&&
   (!filter.event||recordLabel(row.event)===filter.event)&&nameSearch(row.athlete).includes(nameSearch(filter.name)));
 host.innerHTML=`<div class="table-wrap"><table class="data-table">
 <thead><tr>${headers.map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody>${rows.map(row=>`<tr>${hasRank?`<td>${E(row.rank??'—')}</td>`:''}
 <td>${E(row.athlete)}</td><td>${E(recordLabel(row.event))}</td><td class="mono">${E(row.performance)}</td>
 <td>${E(row.date||row.year||'—')}</td><td>${sourceLink(row.source)}</td></tr>`).join('')||
 `<tr><td colspan="${headers.length}">${E(t(state.officialOnline?'empty':'historyFailed'))}</td></tr>`}</tbody></table></div>`;
}
function renderGuide(){const keys=['PB','Leg','Student','World','Team','Source'];return pageIntro('aboutTitle','guideIntro')+`<section class="wrap section"><div class="guide-grid">${keys.map(k=>`<article class="card"><span class="micro">GLOSSARY / ${E(k.toUpperCase())}</span><h3>${E(t('term'+k))}</h3><p>${E(t('term'+k+'Desc'))}</p></article>`).join('')}</div><article class="intro-panel" style="margin-top:20px"><h3>${E(t('legalTitle'))}</h3><p>${E(t('independent'))}</p><p>${E(t('legalNote'))}</p><p>${sourceLink('https://waseda-ac.jp/record/',t('sourceLabel'))}</p></article>${renderOfficialLinks(true)}</section>`;}
async function render(){detachAdmin();const path=decodeURIComponent((location.hash.slice(1).split('?')[0]||'home'));const tab=archiveTab(path);const current=tab?'archive':['home','athletes','results','guide','admin'].includes(path)?path:'home';document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===current));document.querySelector('#mobile-nav').hidden=true;document.querySelector('#menu-btn').setAttribute('aria-expanded','false');document.documentElement.lang=language()==='ja'?'ja':'zh-CN';translateStatic(document);if(!dataLoaded&&['results','archive'].includes(current)){app.innerHTML=`<p class="wrap section" role="status">${E(t('historyBusy'))}</p>`;return;}if(current==='home')app.innerHTML=renderHome();if(current==='athletes')app.innerHTML=renderAthletes();if(current==='results'){app.innerHTML=renderResults();updateResults();}if(current==='archive')app.innerHTML=renderArchive(tab);if(current==='guide'){
 app.innerHTML=renderGuide();
 if(new URLSearchParams(location.hash.split('?')[1]).has('official')){
   document.querySelector('#official-links-title').scrollIntoView();
 }
}if(current==='admin'){app.innerHTML=pageIntro('adminTitle','adminDesc')+`<section class="wrap section" id="admin-root"><p>${E(t('adminLoading'))}</p></section>`;await renderAdminPage(document.querySelector('#admin-root'),{t,E,sourceLink,toast});return;}
if(!state.dbOnline&&state.official)app.insertAdjacentHTML('beforeend',`<p class="wrap statusbar" role="status">${E(t('databaseUnavailable'))}</p>`);
if(current==='athletes'){
 const gender=document.querySelector('#filter-gender');
 if(gender){gender.value=filter.gender;renderAthleteTable();}
 else if(dataLoaded)updateResults();
}
if(current==='archive'){
 if(tab==='ekiden'){
   document.querySelector('#race-type').value=raceFilters.race;
   document.querySelector('#race-year').value=raceFilters.year;
   renderRaceList();
 }else{
   document.querySelector('#history-gender').value=rankingFilters[tab].gender;
   document.querySelector('#history-event').value=rankingFilters[tab].event;
   historyTable(tab);
 }
}
}
document.querySelector('#lang-zh').addEventListener('click',()=>chooseLanguage('zh'));
document.querySelector('#lang-ja').addEventListener('click',()=>chooseLanguage('ja'));
function chooseLanguage(v){setLanguage(v);document.querySelector('#lang-zh').setAttribute('aria-pressed',String(v==='zh'));document.querySelector('#lang-ja').setAttribute('aria-pressed',String(v==='ja'));render();}
document.querySelector('#menu-btn').addEventListener('click',()=>{const n=document.querySelector('#mobile-nav');n.hidden=!n.hidden;document.querySelector('#menu-btn').setAttribute('aria-expanded',String(!n.hidden));});
document.addEventListener('input',e=>{if(e.target?.id==='result-q')updateResults(true);if(e.target?.id==='filter-q'){filter.q=e.target.value;renderAthleteTable();}if(e.target?.id==='history-search'){rankingFilters.alltime.name=e.target.value;historyTable('alltime');}});
document.addEventListener('change',e=>{const id=e.target?.id,v=e.target?.value;if(['result-year','result-status','result-meet','result-event','result-group'].includes(id))updateResults(true);if(id==='filter-grade')filter.grade=v;if(id==='filter-gender')filter.gender=v;if(id==='filter-metric')filter.metric=v;if(id?.startsWith('filter-'))renderAthleteTable();if(id==='race-type'){
 raceFilters.race=v;
 raceFilters.year='all';
 const controls=e.target.closest('.filterbar');
 controls.innerHTML=renderRaceFilters();
 controls.querySelector('#race-type').value=v;
 controls.querySelector('#race-type').focus();
 document.querySelector('#section-records').innerHTML=renderSectionRecords();
}
if(id==='race-year')raceFilters.year=v;
if(id==='race-type'||id==='race-year')renderRaceList();
if(id==='history-gender'||id==='history-event'){
 const tab=archiveTab(location.hash.slice(1).split('?')[0]);
 rankingFilters[tab][id==='history-gender'?'gender':'event']=v;
 historyTable(tab);
}
});
window.addEventListener('hashchange',event=>{
 render();
 if(event.newURL.includes('#athletes?name=')||event.oldURL.includes('#athletes?name=')){
   window.scrollTo({top:0,behavior:'instant'});
 }
});
chooseLanguage(language());
loadData().finally(()=>{dataLoaded=true;render();});

document.addEventListener('click',e=>{const id=e.target.closest('button')?.id;if(id==='result-prev'||id==='result-next'){resultsPage+=id==='result-next'?1:-1;updateResults();}});
