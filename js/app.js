import {HAKONE_GUIDE_SOURCE} from '../data/hakone-2027-athlete-guide.js';
import {athleteGuide,matchesAthleteSearch} from './athlete-search.js';
import {renderGrowthChart,renderEkidenRankChart} from './analysis-charts.js';
import {renderWatchPage,watchStar,toggleWatched,setCompared,setWatchEvent} from './athlete-watch.js';
import {CLUB_DIARIES} from '../data/club-diaries.js';
import {fanBoardLink,renderFanBoard} from './fan-board.js';
import {bindFeedback} from './feedback.js';
import {OFFICIAL_LONG_DISTANCE_SOURCE,OFFICIAL_LONG_DISTANCE_ROSTER} from '../data/official-club-roster.js';
import {renderSubmissions} from './submissions.js';
import {ATHLETE_HIGHLIGHTS} from '../data/athlete-highlights.js';
import {COMPETITIONS} from '../data/competition-schedule.js';
import {ATHLETE_MEDIA} from '../data/athlete-media.js';
import {ATHLETE_SOCIAL_LINKS} from '../data/athlete-social-links.js';
import {OFFICIAL_LINK_GROUPS} from '../data/official-links.js';
import {t,language,setLanguage,translateStatic} from './i18n.js';
import {loadData,state,athletes,athlete,worldRankings,ekiden,schoolRecords,alltimeRankings,parseTime,formatPace,personalResults,resultGrade,specialtyPbs,sectionRecords,legHonors,athleteEkidenHonors,nameSearch,officialAthleteName,comparisonRankings} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';
import {DATA_SNAPSHOT} from '../data/roster.js';
import {renderAdminPage,detachAdmin} from './admin.js';
const app=document.querySelector('#app');
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=v=>{try{const u=new URL(String(v));return u.protocol==='https:'&&!u.username&&!u.password&&!/(?:^|\.)(github\.com|github\.io|githubusercontent\.com)$/.test(u.hostname)?u.href:null;}catch{return null;}};
const sourceLink=(url,label=t('viewSource'))=>{const href=validUrl(url);return href?`<a href="${E(href)}" target="_blank" rel="noopener noreferrer">${E(label)} ↗</a>`:'';};
const raceName=r=>t({hak:'introHak',izu:'introIzu',zen:'introZen',other:'otherEkiden'}[r]||'introHak');
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
const clubDiary='https://waseda-ac.jp/diary/';
const featuredDiaryIds=new Set([1689,1688,1687,1685,1670,1666]);
function renderDiaryList(entries,labels){
 return `<ul class="official-link-list">${entries.map(([date,author,id])=>`<li>
 <time datetime="${E(date)}">${E(date)}</time> · ${sourceLink(clubDiary+'detail/'+id,labels?author:t('clubDiaryRead',{date}))}</li>`).join('')}</ul>`;
}
function renderClubDiary(){
 return `<section class="section club-diary" aria-labelledby="club-diary-title">
 <div class="section-head"><div><h2 id="club-diary-title">${E(t('clubDiaryTitle'))}</h2>
 <p>${E(t('clubDiaryDesc'))}</p></div></div>
 <div class="card">${renderDiaryList(CLUB_DIARIES.filter(([, ,id])=>featuredDiaryIds.has(id)),true)}
 ${sourceLink(clubDiary+'category/1',t('clubDiaryAll'))}</div></section>`;
}
function renderAthleteDiaries(name){
 const entries=CLUB_DIARIES.filter(([,author])=>nameSearch(author)===nameSearch(name));
 if(!entries.length)return '';
 return `<section class="section club-diary" aria-labelledby="athlete-diary-title">
 <h2 id="athlete-diary-title">${E(t('clubDiaryTitle'))}</h2>
 <div class="card">${renderDiaryList(entries,false)}</div></section>`;
}
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
const ekidenSeason=[
 {race:'izu',key:'Izu',source:'https://www.izumo-ekiden.jp/outline/index.html'},
 {race:'zen',key:'Zen',source:'https://daigaku-ekiden.com/about/index.html'},
 {race:'hak',key:'Hak',source:'https://www.hakone-ekiden.jp/about/'}
];
const raceArchiveLink=(race,year)=>`#archive?race=${encodeURIComponent(race)}${year?`&year=${encodeURIComponent(year)}`:''}`;
function ekidenTerms(){
 return `<dl class="ekiden-terms">${['Leg','Handoff','Award'].map(term=>`<div>
 <dt>${E(t('ekidenTerm'+term))}</dt><dd>${E(t('ekidenTerm'+term+'Desc'))}</dd></div>`).join('')}</dl>`;
}
function renderEkidenIntro(){
 return `<section class="section ekiden-intro" aria-labelledby="ekiden-intro-title">
 <div class="section-head"><div><h2 id="ekiden-intro-title" tabindex="-1">${E(t('introLabel'))}</h2><p>${E(t('intro'))}</p></div></div>
 <ol class="ekiden-season">${ekidenSeason.map(({race,key,source})=>`<li>
 <span class="season-month">${E(t('intro'+key+'Month'))}</span>
 <h3>${E(raceName(race))}</h3><p>${E(t('intro'+key+'Desc'))}</p>
 <p>${E(t('intro'+key+'Watch'))}</p>
 <a class="btn btn-sm" href="${raceArchiveLink(race)}">${E(t('raceResultsLink',{race:raceName(race)}))} →</a>
 <div class="season-source">${sourceLink(source,t('officialWebsite'))}</div>
 </li>`).join('')}</ol>
 <details class="ekiden-help"><summary>${E(t('ekidenGlossary'))}</summary>${ekidenTerms()}</details>
 <div class="actions"><button class="btn" id="home-next-meet" type="button">${E(t('homeNextMeet'))} ↓</button></div></section>`;
}
function competitionHref(meet){
 return `#schedule?meet=${encodeURIComponent(meet.id)}`;
}
function competitionDate(meet){
 return meet.end?`${meet.start} – ${meet.end}`:meet.start;
}
function competitionCards(events){
 return events.map(meet=>`<article class="result-card">
 <div class="card-top"><time datetime="${E(meet.start)}">${E(competitionDate(meet))}</time>
 <span class="tag">${E(t(meet.phase))}</span></div>
 <h3><a href="${competitionHref(meet)}">${E(meet.title)} →</a></h3>
 ${meet.venue?`<p>${E(meet.venue)}</p>`:''}
 ${language()==='zh'?`<p>${E(t(meet.intro))}</p>`:''}</article>`).join('');
}
function competitionCalendar(){
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const results=personalResults();
 const relays=ekiden();
 return COMPETITIONS.map(meet=>{
   const relay=meet.race?relays.find(row=>row.race===meet.race&&String(row.year)===meet.start.slice(0,4)):null;
   const marks=meet.resultMeet?results.filter(row=>meetLabel(row.meet)===meet.resultMeet&&row.date>=meet.start&&row.date<=(meet.end||meet.start)):[];
   const phase=(relay?.legs?.length||marks.length)?'scheduleResults':
     (meet.end||meet.start)<today?'scheduleAwaitingResults':meet.entryStatus||'scheduleDateOnly';
   return {...meet,relay,marks,phase};
 });
}
function renderCompetitionList(home=false){
 const calendar=competitionCalendar();
 const next=calendar.filter(meet=>['scheduleDateOnly','entriesAnnounced','entriesProvisional','entriesFinal'].includes(meet.phase)).sort((a,b)=>a.start.localeCompare(b.start));
 const past=calendar.filter(meet=>!next.includes(meet)).sort((a,b)=>b.start.localeCompare(a.start));
 return `<section class="wrap section schedule-list" aria-labelledby="schedule-heading">
 <div class="section-head"><h2 id="schedule-heading" tabindex="-1">${E(t('scheduleUpcoming'))}</h2>
 ${home?`<a class="btn btn-sm" href="#schedule">${E(t('navSchedule'))} →</a>`:''}</div>
 <div class="results-mini">${competitionCards(home?next.slice(0,3):next)||`<p>${E(t('scheduleNoUpcoming'))}</p>`}</div>
 <div class="section-head schedule-past"><h2>${E(t('schedulePast'))}</h2></div>
 <div class="results-mini">${competitionCards(home?past.slice(0,2):past)||`<p>${E(t('empty'))}</p>`}</div>
 ${home&&language()==='zh'?`<div class="actions"><a class="btn" href="#athletes">${E(t('homeMeetAthletes'))} →</a></div>`:''}</section>`;
}
function competitionAthlete(name){
 const match=athlete(name) || athletes().find(row=>nameSearch(row.name)===nameSearch(name));
 return match?`<a href="#athletes?name=${encodeURIComponent(match.name)}">${E(officialAthleteName(name))}</a>`:E(officialAthleteName(name));
}
function renderCompetitionDetail(meet){
 const marks=meet.relay?.legs?.length?meet.relay.legs.map(leg=>({
   name:leg.name,event:`${t('section')} ${leg.leg}`,time:leg.time,rank:leg.rank,source:meet.relay.source
 })):meet.marks;
 const headings=['profile','event','resultMark','rank','source'];
 return `<header class="page-intro"><div class="wrap">
 <a href="#schedule">← ${E(t('navSchedule'))}</a><h1>${E(meet.title)}</h1>
 <p>${E(competitionDate(meet))}${meet.venue?` · ${E(meet.venue)}`:''}</p>
 ${language()==='zh'?`<p>${E(t(meet.intro))}</p>`:''}
 ${sourceLink(meet.source,t('scheduleOfficial'))}</div></header>
 <div class="wrap section schedule-detail">
 ${meet.liveLinks?.length?`<section aria-labelledby="schedule-live-title"><h2 id="schedule-live-title">${E(t('scheduleLive'))}</h2>
 <div class="actions">${meet.liveLinks.map(([label,url])=>sourceLink(url,t(label))).join('')}</div>
 <p>${E(t('scheduleLiveNote'))} ${sourceLink(meet.liveSource)}</p></section>`:''}
 <section aria-labelledby="schedule-entry-title"><div class="section-head"><h2 id="schedule-entry-title">${E(t(meet.entryHeading||'scheduleEntries'))}</h2></div>
 ${meet.entries?.length?`${meet.entryStatus?`<p><span class="tag">${E(t(meet.entryStatus))}</span> ${sourceLink(meet.entrySource)}</p>`:''}
 ${meet.entries.map(entry=>`<article class="card schedule-entry"><h3>${E(entry.title?t(entry.title,{count:entry.athletes.length+(entry.reserves?.length||0)}):recordLabel(entry.event))}</h3>
 ${entry.published?`<p>${E(t('scheduleEntryPublished',{date:entry.published}))} · ${sourceLink(entry.source)}</p>`:''}
 ${entry.start?`<p>${E(t('scheduleStartTime',{time:entry.start}))}</p>`:''}
 <ul class="schedule-athletes">${entry.athletes.map((name,index)=>`<li>${entry.orderedLegs?`${E(t('scheduleEntryLeg',{leg:index+1}))} · `:''}${competitionAthlete(name)}</li>`).join('')}</ul>
 ${entry.reserves?.length?`<h4>${E(t('scheduleEntryReserves'))}</h4>
 <ul class="schedule-athletes">${entry.reserves.map(name=>`<li>${competitionAthlete(name)}</li>`).join('')}</ul>`:''}</article>`).join('')}`
 :`<p>${E(t(marks.length?'scheduleEntriesUnarchived':'scheduleEntriesAwaiting'))}</p>`}</section>
 <section aria-labelledby="schedule-results-title"><div class="section-head"><h2 id="schedule-results-title">${E(t('scheduleResults'))}</h2>
 ${meet.relay?`<a class="btn btn-sm" href="${raceArchiveLink(meet.race,meet.relay.year)}">${E(t('navEkiden'))} →</a>`:''}</div>
 ${meet.relay?.total?`<p>${E(t('teamRank'))} ${E(meet.relay.rank??'—')} · ${E(t('time'))} ${E(meet.relay.total)}</p>`:''}
 ${marks.length?`<div class="table-wrap"><table class="data-table"><thead><tr>${headings.map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody>${marks.map(row=>`<tr><td>${competitionAthlete(row.name)}</td>
 <td>${E(recordLabel(row.event))}${row.stage?`<span class="subline">${E(recordLabel(row.stage))}</span>`:''}</td>
 <td class="mono">${E(row.time||'—')}${row.pb?' · PB':''}</td><td>${E(row.rank??'—')}</td><td>${sourceLink(row.source)}</td></tr>`).join('')}
 </tbody></table></div>`:`<p>${E(t('scheduleAwaitingResults'))}</p>`}</section></div>`;
}
function renderSchedule(){
 const id=new URLSearchParams(location.hash.split('?')[1]).get('meet');
 const meet=id&&competitionCalendar().find(row=>row.id===id);
 if(meet)return renderCompetitionDetail(meet);
 return pageIntro('navSchedule','scheduleDescription')+(id?`<p class="wrap note">${E(t('scheduleMeetMissing'))}</p>`:'')+renderCompetitionList();
}
function renderHome(){
 const beginner=language()==='zh';
 const calendarOrder=['hak','izu','zen'];
 const recent=ekiden().filter(row=>row.total&&calendarOrder.includes(row.race))
   .sort((a,b)=>b.year-a.year||calendarOrder.indexOf(b.race)-calendarOrder.indexOf(a.race)).slice(0,3);
 return `<section class="hero home-hero ${beginner?'home-hero-guide':'home-hero-results'}">
 <div class="wrap hero-inner"><div class="hero-copy"><h1>${E(t('heroTitle'))}</h1><p>${E(t('heroDesc'))}</p>
 <div class="actions">${beginner
   ?`<button class="btn btn-on-dark" id="ekiden-start" type="button">${E(t('heroAction'))} ↓</button>
     <a class="btn btn-outline-dark" href="#schedule">${E(t('navSchedule'))} →</a>
     <a class="btn btn-outline-dark" href="#athletes">${E(t('navAthletes'))} →</a>`
   :`<a class="btn btn-on-dark" href="#schedule">${E(t('navSchedule'))} →</a>
     <a class="btn btn-outline-dark" href="#archive">${E(t('navEkiden'))} →</a>
     <a class="btn btn-outline-dark" href="#athletes">${E(t('navAthletes'))} →</a>`}</div></div></div></section>
 ${beginner?`<div class="wrap">${renderEkidenIntro()}</div>`:''}
 ${renderCompetitionList(true)}
 <section class="section ${beginner?'soft-section':''}" aria-labelledby="latest-heading"><div class="wrap">
 <div class="section-head"><h2 id="latest-heading">${E(t('latest'))}</h2><a class="btn btn-sm" href="#archive">${E(t('navEkiden'))} →</a></div>
 <div class="results-mini">${recent.map(r=>`<article class="result-card">
 <h3><a href="${raceArchiveLink(r.race,r.year)}">${E(t('raceEditionLink',{race:raceName(r.race),year:r.year}))} →</a></h3>
 <div class="big">${E(r.total)}</div><p>${E(t('teamRank'))} · ${E(r.rank??t('notRecorded'))}</p>${sourceLink(r.source)}
 </article>`).join('')||`<p>${E(t(dataLoaded?'empty':'historyBusy'))}</p>`}</div></div></section>
 <section class="wrap section" aria-labelledby="club-intro-title">
 <div class="section-head"><h2 id="club-intro-title">${E(t('clubIntroTitle'))}</h2></div>
 <div class="intro-panel"><p>${E(t('clubIntroBody'))}</p>
 <div class="actions"><a class="btn btn-sm" href="#athletes">${E(t('navAthletes'))}</a>
 ${sourceLink('https://waseda-ac.jp/team/member/block/3',t('clubIntroSource'))}
 ${sourceLink('https://waseda-ac.jp/recruit/',t('clubIntroCoachSource'))}</div></div>
 </section>
 <div class="wrap">${fanBoardLink(t,E)}${renderClubDiary()}${renderOfficialLinks(false)}</div><div class="wrap statusbar">${E(t('sourceFallback'))} · ${E(DATA_SNAPSHOT)}</div>`;
}
const rosterDivision=a=>a.graduation_year?'alumni':a.officialGrade==='大学院'?'graduate':String(a.grade??'');
function rosterDivisionLabel(a){
 const division=rosterDivision(a);
 return division==='alumni'?t('alumni'):division==='graduate'?t('graduateStudent'):gradeName(a.grade);
}
const blocks={'短距離':'blockSprint','中距離':'blockMiddle','長距離':'blockLong','ハードル':'blockHurdles','跳躍':'blockJumps','投擲':'blockThrows','混成':'blockCombined'};
function rosterSources(athlete){
 const links=[...new Set(Object.values(athlete._pbSources||{}))].map(url=>sourceLink(url)).filter(Boolean);
 return links.length?links.join('<br>'):sourceLink(athlete.source_url)||E(t('sourceFallback'));
}
function athleteRows(rows){return rows.map(a=>`<tr><td><a href="#athletes?name=${encodeURIComponent(a.name)}">${E(officialAthleteName(a.name))}</a> ${watchStar(a.name,t,E)}<span class="subline">${blocks[a.block]?`${E(t(blocks[a.block]))} · `:''}${E(rosterDivisionLabel(a))} · ${E(t({女:'female',男:'male'}[a.gender]||'notRecorded'))}</span></td><td class="mono">${E(a.pb1500||'—')}</td><td class="mono">${E(a.pb5000||'—')}</td><td class="mono">${E(a.pb10000||'—')}</td><td class="mono">${E(a.pbHalf||'—')}</td><td>${rosterSources(a)}</td></tr>`).join('');}
const longDistanceRosterNames=new Set(OFFICIAL_LONG_DISTANCE_ROSTER.map(member=>nameSearch(member.name)));
let filter={q:'',grade:'all',gender:'all',metric:'pb5000'};
function renderAthleteTable(){
 const studentBody=document.querySelector('#athlete-rows');
 if(!studentBody)return;
 const query=filter.q;
 const rows=athletes().filter(a=>(!query||matchesAthleteSearch(a.name,query))&&
   (filter.grade==='all'||rosterDivision(a)===filter.grade)&&(filter.gender==='all'||a.gender===filter.gender));
 rows.sort((a,b)=>parseTime(a[filter.metric])-parseTime(b[filter.metric]));
 const students=rows.filter(a=>rosterDivision(a)!=='alumni'&&longDistanceRosterNames.has(nameSearch(a.name)));
 const alumni=rows.filter(a=>rosterDivision(a)==='alumni');
 for(const [prefix,body,entries] of [['athlete',studentBody,students],['ob',document.querySelector('#ob-rows'),alumni]]){
   document.querySelector(`#${prefix}-section`).hidden=!entries.length;
   document.querySelector(`#${prefix}-count`).textContent=String(entries.length);
   body.innerHTML=athleteRows(entries);
 }
 const empty=document.querySelector('#athlete-empty');
 const hasVisibleRows=students.length+alumni.length>0;
 empty.textContent=hasVisibleRows?'':t('empty');
 empty.hidden=hasVisibleRows;
 const watch=document.querySelector('#roster-watch-link');
 const watchSlot=document.querySelector(students.length?'#athlete-roster-actions':alumni.length?'#ob-roster-actions':'#empty-roster-actions');
 if(watch.parentElement!==watchSlot)watchSlot.append(watch);
}
function rosterWatchLink(){
 return `<a id="roster-watch-link" class="btn btn-primary" href="#athletes?watch=1"><span aria-hidden="true">★</span> ${E(t('watchTitle'))}</a>`;
}
function rosterSection(prefix,title){
 const columns=[t('profile'),'1500m · PB','5000m · PB','10000m · PB','ハーフマラソン · PB',t('source')];
 return `<section id="${prefix}-section" class="roster-section" aria-labelledby="${prefix}-title" hidden>
 <div class="section-head"><h2 id="${prefix}-title">${E(t(title))}</h2>
 <div id="${prefix}-roster-actions" class="roster-heading-actions"><span id="${prefix}-count" class="micro"></span>
 ${prefix==='athlete'?rosterWatchLink():''}</div></div>
 <div class="table-wrap"><table class="data-table" aria-labelledby="${prefix}-title"><thead><tr>
 ${columns.map(column=>`<th scope="col">${E(column)}</th>`).join('')}
 </tr></thead><tbody id="${prefix}-rows"></tbody></table></div></section>`;
}
function renderAthleteMedia(name){
 const normalized=nameSearch(name);
 const items=ATHLETE_MEDIA.filter(row=>row.athletes.some(athlete=>nameSearch(athlete)===normalized)&&validUrl(row.url));
 const locale=language()==='zh'?0:1;
 return `<section class="section athlete-media" aria-labelledby="athlete-media-title">
 <h2 id="athlete-media-title">${E(t('athleteMediaTitle'))}</h2>
 ${items.length?`<ul class="athlete-media-list">${items.map(row=>`<li class="card">
 <span class="tag">${E(t('athleteMedia'+row.kind))}</span> ${row.paid?`<span class="tag">${E(t('athleteMediaPaid'))}</span>`:''}
 <h3>${sourceLink(row.url,row.title[locale])}</h3>
 <dl><dt>${E(t('athleteMediaPublisher'))}</dt><dd>${E(row.publisher[locale])}</dd>
 <dt>${E(t('athleteMediaDate'))}</dt><dd><time datetime="${E(row.date)}">${E(row.date)}</time></dd>
 <dt>${E(t('meet'))}</dt><dd>${E(row.meet?.[locale]||t('athleteMediaGeneral'))}</dd></dl></li>`).join('')}</ul>`
 :`<p>${E(t('athleteMediaEmpty'))}</p>`}</section>`;
}
function renderAthleteSocialLinks(name){
 const match=Object.keys(ATHLETE_SOCIAL_LINKS).find(key=>nameSearch(key)===nameSearch(name));
 if(!match)return '';
 return `<div><h3>${E(t('athleteSocialLinks'))}</h3><ul class="official-link-list">
 ${ATHLETE_SOCIAL_LINKS[match].map(([platform,url,source])=>`<li>${sourceLink(url,platform)}
 <small>${sourceLink(source,t('accountSource',{platform}))}</small></li>`).join('')}
 </ul></div>`;
}
function renderAthleteHighlights(name,records){
 const picks=ATHLETE_HIGHLIGHTS[name];
 if(!picks)return '';
 const races=ekiden();
 const cards=picks.map(pick=>{
   if(typeof pick==='string'){
     const row=records.find(record=>record.id===pick);
     if(!row?.time||!validUrl(row.source))return '';
     const rank=row.rank?t(row.japaneseRank?'highlightOverallRank':'rankPosition',{rank:row.rank}):'';
     const japaneseRank=row.japaneseRank?t('japaneseResultRank',{rank:row.japaneseRank}):'';
     return `<li><strong>${E(meetLabel(row.meet))}</strong><span class="row-meta">
     ${E([row.date||row.year,recordLabel(row.event),recordLabel(row.stage),rank,japaneseRank].filter(Boolean).join(' · '))}</span>
     <b class="mono">${E(row.time)}</b>${row.pb?' · PB':''} ${sourceLink(row.source)}</li>`;
   }
   const [race,year,leg]=pick;
   const edition=races.find(row=>row.race===race&&Number(row.year)===year);
   const result=edition?.legs.find(row=>Number(row.leg)===leg&&nameSearch(row.name)===nameSearch(name));
   if(!result?.time||!validUrl(edition.source))return '';
   return `<li><strong><a href="${raceArchiveLink(race,year)}">${E(t('raceEditionLink',{race:raceName(race),year}))}</a></strong>
   <span class="row-meta">${E(t('scheduleEntryLeg',{leg}))}${result.rank?` · ${E(t('highlightLegRank',{rank:result.rank}))}`:''}</span>
   <b class="mono">${E(result.time)}</b> ${sourceLink(edition.source)}
   ${honorBadges(legHonors(edition,result))}</li>`;
 }).filter(Boolean);
 return cards.length?`<section class="athlete-highlights" aria-labelledby="athlete-highlights-title">
 <h2 id="athlete-highlights-title">${E(t('athleteHighlights'))}</h2>
 <ul>${cards.join('')}</ul></section>`:'';
}
function profileDetail(name,records){
 const a=athlete(name)||{name};
 const reading=athleteGuide(name)?.[1];
 const basics=[['middleSchoolProfile','middle_school'],['school','high_school'],['birthday','birthday'],['birthplace','birthplace'],['hometown','hometown'],['homePrefecture','home_prefecture'],['height','height_cm','cm'],['weight','weight_kg','kg']];
 const metrics=[['1500m','pb1500',1.5],['5000m','pb5000',5],['10000m','pb10000',10],['ハーフマラソン','pbHalf',21.0975]]
   .map(([title,key,km])=>({title,time:a[key],km,source:a._pbSources?.[key]}));
 const marathon=records.filter(row=>row.pb&&recordLabel(row.event)==='マラソン'&&validUrl(row.source)&&Number.isFinite(parseTime(row.time)))
   .sort((left,right)=>parseTime(left.time)-parseTime(right.time))[0];
 if(marathon)metrics.push({title:t('marathonPb'),time:marathon.time,km:42.195,source:marathon.source});
 const field=a.pb5000?'pb5000':a.pb10000?'pb10000':'pb1500';const valid=athletes().filter(x=>x.gender===a.gender&&Number.isFinite(parseTime(x[field]))).sort((x,y)=>parseTime(x[field])-parseTime(y[field]));const pos=valid.findIndex(x=>x.name===name)+1;const ranks=worldRankings(name);return `<div class="split" style="margin-top:22px"><article class="detail-panel"><span class="micro">ATHLETE PROFILE · ${E(t('snapshot'))}</span><h1>${E(officialAthleteName(name))}</h1>${reading?`<p class="athlete-reading"><span lang="ja">${E(reading)}</span></p>`:''}<p>${E(rosterDivisionLabel(a))} · ${E(t({女:'female',男:'male'}[a.gender]||'notRecorded'))}</p>${a.graduation_year?`<p>${E(t('graduated'))} · ${E(a.graduation_year)} ${sourceLink(a.graduation_source)}</p>`:''}${blocks[a.block]?`<p>${E(t(blocks[a.block]))} ${sourceLink(a.clubSource)}</p>`:''}${a.mainEvent?`<p>${E(t('event'))} · ${E(recordLabel(a.mainEvent))}</p>`:''}${basics.map(([label,key,unit])=>`<div class="row-meta">${E(t(label))} · ${E(a[key]??t('notRecorded'))}${a[key]&&unit?' '+unit:''} ${a[key]?sourceLink(a._profileSources?.[key]):''}</div>`).join('')}
 <div class="row-meta">${E(t('dataUpdated'))} · ${E(a.updated_at?.slice(0,10)||DATA_SNAPSHOT)} ${sourceLink(a.source_url)}</div>${renderAthleteHighlights(name,records)}${renderAthleteSocialLinks(name)}<h3>${E(t('pb'))}</h3><div class="detail-grid">${metrics.map(({title,time,km,source})=>`<div><small>${E(title)} · PB</small><b class="mono">${E(time||'—')}</b><small>${time?E(t('pace')+' '+formatPace(time,km)):E(t('notRecorded'))}</small>${sourceLink(source)}</div>`).join('')}</div>${specialtyPbs(name).map(r=>`<p>${E(recordLabel(r.event))} · PB <b>${E(r.time)}</b> ${sourceLink(r.source)}</p>`).join('')}<p class="titleline">${E(t('athleteMetric'))}</p><p>${E(t('internalSort'))}</p>${verifiedContext(name)}${pos?`<div class="rank-badge">${E(t('internalTag',{rank:pos,total:valid.length}))}</div><div class="progress-track"><i style="width:${Math.max(4,100*(valid.length-pos+1)/valid.length)}%"></i></div>`:`<p>${E(t('notRanked'))}</p>`}</article><article class="detail-panel"><h3>${E(t('globalTitle'))}</h3><p>${E(t('globalNote'))}</p>${ranks.length?ranks.map(r=>`<div class="card" style="margin-top:11px;padding:16px"><div class="card-top"><strong>${E(recordLabel(r.event_name))}</strong><span class="tag">${E(t('worldRank'))} ${E(r.world_rank??'—')}</span></div><p>${E(t('asiaRank'))} · ${E(r.asia_rank??t('notRecorded'))}<br>
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
 </tr></thead><tbody>${rows.map(row=>`<tr><td>${E(row.year)}</td><td><a href="${raceArchiveLink(row.race,row.year)}">${E(raceName(row.race))}</a></td>
 <td>${E(row.leg)}</td><td class="mono">${E(row.time)}</td><td>${honorBadges(row.honors)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function athleteRaceEntries(name){
 const key=nameSearch(name);
 const entries=ekiden().flatMap(race=>race.legs.filter(leg=>leg.name&&nameSearch(leg.name)===key).map(leg=>({race,leg,source:race.source})));
 for(const [type,year,leg,rank] of athleteGuide(name)?.[2]||[]){
   if(entries.some(entry=>entry.race.race===type&&Number(entry.race.year)===year))continue;
   entries.push({race:{race:type,year},leg:{leg,rank},source:HAKONE_GUIDE_SOURCE});
 }
 return entries.sort((a,b)=>b.race.year-a.race.year||['zen','izu','hak'].indexOf(a.race.race)-['zen','izu','hak'].indexOf(b.race.race));
}
function renderAthleteEkiden(entries){
 if(!entries.length)return '';
 return `<section class="section"><h2>${E(t('navEkiden'))}</h2>
 <div class="table-wrap"><table class="data-table"><thead><tr>
 ${['years','meet','section','resultMark','legRank','source'].map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}
 </tr></thead><tbody>${entries.map(({race,leg,source})=>`<tr><td>${E(race.year)}</td>
 <td><a href="${raceArchiveLink(race.race,race.year)}">${E(race.meet?meetLabel(race.meet):raceName(race.race))}</a></td>
 <td>${E(leg.leg??'—')}</td><td class="mono">${E(leg.time||'—')}</td><td>${E(leg.rank??'—')}</td><td>${sourceLink(source)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function renderAthletes(){
 const params=new URLSearchParams(location.hash.split('?')[1]||'');
 if(params.has('watch'))return `<section id="athlete-watch" class="wrap section">${renderWatchPage({t,E,sourceLink,raceName})}</section>`;
 const name=params.get('name');
 const watchLink=`<a class="btn btn-sm" href="#athletes?watch=1">${E(t('watchTitle'))} →</a>`;
 if(name){
 const matches=athletes().filter(row=>nameSearch(row.name)===nameSearch(name));
 const known=athlete(name)||(matches.length===1?matches[0]:null);
 const canonical=known?.name||name;
 const records=athleteResultRows(canonical);
 const honors=athleteEkidenHonors(canonical);
 const raceEntries=athleteRaceEntries(canonical);
 return `<section class="wrap section"><a class="btn btn-sm" href="#athletes">← ${E(t('navAthletes'))}</a> ${known?watchStar(canonical,t,E):''} ${watchLink}
 ${known||records.length||honors.length?profileDetail(canonical,records):`<p role="status">${E(t(dataLoaded?'empty':'loading'))}</p>`}
 ${renderGrowthChart(canonical,records,{t,E,sourceLink})}
 ${known||records.length||honors.length?renderAthleteMedia(canonical)+renderAthleteDiaries(officialAthleteName(canonical)):''}
 ${renderAthleteHonors(honors)}
 ${renderAthleteEkiden(raceEntries)}
 ${known||records.length||honors.length?`<section class="section"><h2>${E(t('athleteResults'))}</h2>${resultPanel(records,false)}</section>`:''}
 </section>`;
 }
 return pageIntro('navTitleAthletes','athletesDesc')+`<div class="wrap section"><div class="filterbar"><label class="field">${E(t('search'))}<input id="filter-q" type="search" value="${E(filter.q)}" placeholder="${E(t('searchPlace'))}"></label><label class="field">${E(t('filterRosterDivision'))}<select id="filter-grade"><option value="all">${E(t('all'))}</option>${[1,2,3,4].map(n=>`<option value="${n}" ${filter.grade===String(n)?'selected':''}>${E(gradeName(n))}</option>`).join('')}<option value="graduate" ${filter.grade==='graduate'?'selected':''}>${E(t('graduateStudent'))}</option><option value="alumni" ${filter.grade==='alumni'?'selected':''}>${E(t('alumni'))}</option></select></label><label class="field">${E(t('filterGender'))}<select id="filter-gender"><option value="all">${E(t('all'))}</option><option value="男">${E(t('male'))}</option><option value="女">${E(t('female'))}</option></select></label><label class="field">${E(t('filterEvent'))}<select id="filter-metric">${[['pb5000','5000m'],['pb10000','10000m'],['pb1500','1500m'],['pbHalf','ハーフマラソン']].map(([v,l])=>`<option value="${v}" ${filter.metric===v?'selected':''}>${l}</option>`).join('')}</select></label></div><p>${E(t('athleteRosterBasis'))} ${sourceLink(OFFICIAL_LONG_DISTANCE_SOURCE)}</p>${rosterSection('athlete','currentClubAthletes')}${rosterSection('ob','alumni')}<p id="athlete-empty" role="status" hidden></p><div id="empty-roster-actions"></div><div class="note">${E(t('sourceFallback'))} · ${E(t('rankDisclosure'))}</div></div>`;}
function renderSectionRecords(){
 const records=sectionRecords().filter(row=>raceFilters.race==='all'||row.race===raceFilters.race);
 if(!records.length)return '';
 const headers=['navEkiden','section','profile','affiliation','years','resultMark','scope','previousMark','source'];
 return `<details class="race-detail"><summary>${E(t('sectionRecords'))}</summary><div class="inside table-wrap"><table class="data-table">
 <thead><tr>${headers.map(key=>`<th>${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody>${records.map(r=>`<tr><td>${E(raceName(r.race))}</td><td>${E(r.leg)}</td>
 <td>${E(r.name)}</td><td>${E(r.unit||'—')}</td><td>${E(r.year)}</td><td>${E(r.time)}</td>
 <td>${E(t(r.scope==='japanese'?'japaneseScope':r.scope==='school'?'hakoneWasedaScope':'meetScope'))}</td>
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
function resultDivision(row){
 const grade=resultGrade(row);
 if(row.status==='OB')return 'OB / OG';
 if(row.status==='student')return grade?gradeName(grade):t('resultGradeUnknown');
 if(['middleSchool','highSchool'].includes(row.status)){
   const school=t(row.status);
   return grade?t('schoolResultGrade',{school,grade:gradeName(grade)}):school;
 }
 return t('notRecorded');
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
 <label class="field">${E(t('resultStatus'))}<select id="result-status"><option value="">${E(t('all'))}</option><option value="middleSchool">${E(t('middleSchool'))}</option><option value="highSchool">${E(t('highSchool'))}</option><option value="student">${E(t('student'))}</option><option value="OB">OB / OG</option></select></label>
 <label class="field">${E(t('filterGrade'))}<select id="result-grade"><option value="">${E(t('all'))}</option>${[1,2,3,4].map(grade=>`<option value="${grade}">${E(gradeName(grade))}</option>`).join('')}</select></label>
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
 const grade=document.querySelector('#result-grade').value;
 const meet=document.querySelector('#result-meet').value;
 const event=document.querySelector('#result-event').value;
 const group=document.querySelector('#result-group').value;
 const groups=new Map();
 const matching=records.filter(r=>(!event||recordLabel(r.event)===event)&&(!meet||meetLabel(r.meet)===meet)&&(!year||String(r.year)===year)&&(!status||r.status===status)&&(!grade||resultGrade(r)===grade)&&
   (!q||matchesAthleteSearch(r.name,q)||[r.meet,r.meetAlias,r.event,r.unit,meetLabel(r.meet),recordLabel(r.event),r.location,recordLabel(r.location)].some(value=>nameSearch(value).includes(q))));
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
 ${isProfile?'':`<td><a href="#athletes?name=${encodeURIComponent(r.name)}">${E(officialAthleteName(r.name))}</a></td>`}
 <td>${E(r.date||r.year||'—')}</td><td>${E(meetLabel(r.meet))}<span class="subline">${E([r.location,r.unit].filter(Boolean).map(recordLabel).join(' · '))}</span></td>
 <td>${E(recordLabel(r.event))}<span class="subline">${E(recordLabel(r.stage))}</span></td><td class="mono">${E(r.time||'—')}${r.pb?' · PB':''}</td>
 <td>${E(({冠军:'1',亚军:'2',季军:'3'})[r.rank]??r.rank??'—')}${r.japaneseRank?`<span class="subline">${E(t('japaneseResultRank',{rank:r.japaneseRank}))}</span>`:''}</td>
 <td>${E(resultDivision(r))}</td>
 <td>${E(t(r._managed?'resultManaged':labels[r.verification]||'resultLegacy'))}
 <span class="subline">${E(String(r._updatedAt||r.updated_at||state.official?.meta?.fetched||DATA_SNAPSHOT).slice(0,10))}</span>
 ${sourceLink(r.source)}${state.submissionsReady?`<div><a href="#submissions?result=${encodeURIComponent(r.id)}">${E(t('submissionCorrection'))}</a></div>`:''}${r.gradeSource?`<div>${sourceLink(r.gradeSource,t('gradeSource'))}</div>`:''}</td></tr>`;}).join('')||`<tr><td colspan="${colspan}">${E(t(records.length||state.officialOnline?'empty':'historyFailed'))}</td></tr>`;
 document.querySelector('#result-count').textContent=t('resultCount',{start:rows.length?start+1:0,end:Math.min(start+resultsPageSize,rows.length),total:rows.length});
 document.querySelector('#result-prev').disabled=!resultsPage;
 document.querySelector('#result-next').disabled=start+resultsPageSize>=rows.length;
}
let raceFilters={race:'all',year:'all',decade:'all'};
const raceDecade=year=>Math.floor(year/10)*10;
function racesInScope(){
 return ekiden().filter(row=>(raceFilters.race==='all'||row.race===raceFilters.race)&&
   (raceFilters.decade==='all'||String(raceDecade(row.year))===raceFilters.decade));
}
let previousArchiveHash;
function applyArchiveRoute(tab){
 if(tab!=='ekiden'){
   previousArchiveHash=undefined;
   return;
 }
 if(previousArchiveHash===location.hash)return;
 previousArchiveHash=location.hash;
 const params=new URLSearchParams(location.hash.split('?')[1]);
 const race=params.get('race');
 const year=params.get('year');
 raceFilters.decade='all';
 raceFilters.race=race==='other'||ekidenSeason.some(row=>row.race===race)?race:'all';
 raceFilters.year=ekiden().some(row=>(raceFilters.race==='all'||row.race===raceFilters.race)&&String(row.year)===year)?year:'all';
}
function renderRaceDetails(r,rankChart){
 return `${rankChart}<div class="table-wrap"><table class="data-table"><thead><tr><th>${E(t('section'))}</th><th>${E(t('profile'))}</th><th>${E(t('time'))}</th><th>${E(t('legRank'))}</th><th>km</th><th>${E(t('handoffRank'))}</th><th>${E(t('ekidenHonors'))}</th></tr></thead><tbody>${(r.legs||[]).map(l=>`<tr><td>${E(l.leg)}</td><td>${l.name?competitionAthlete(l.name):'—'}</td><td class="mono">${E(l.time)}</td><td>${E(l.rank??'—')}</td><td>${E(l.km??'—')}</td><td>${E(l.team_position??'—')}</td><td>${honorBadges(legHonors(r,l))||'—'}</td></tr>`).join('')||`<tr><td colspan="7">${E(t('notRecorded'))}</td></tr>`}</tbody></table></div><p>${[r.date,r.distance,r.reason||r.status,r.source_format_note].filter(Boolean).map(value=>E(value==='途中棄権'?t('raceDidNotFinish'):recordLabel(value))).join(' · ')}</p>${r.out||r.back?`<p>${E(t('outbound'))} ${E(r.out??'—')} (${E(r.out_rank??'—')}) / ${E(t('returnLeg'))} ${E(r.back??'—')} (${E(r.back_rank??'—')})</p>`:''}<p>${sourceLink(r.source)}</p>`;
}
function renderRaceList(){
 const root=document.querySelector('#race-results');
 if(!root)return;
 const rows=racesInScope().filter(row=>raceFilters.year==='all'||String(row.year)===raceFilters.year);
 const targeted=raceFilters.race!=='all'&&raceFilters.year!=='all';
 root.innerHTML=rows.map(r=>{
   const rankChart=renderEkidenRankChart(r,{t,E});
   const open=Boolean(rankChart)||targeted;
   return `<details class="race-detail"${open?' open':''}><summary><div><span class="micro">${E(r.year)} / ${E(r.meet?meetLabel(r.meet):raceName(r.race))}</span><br><strong>${E(t('teamRank'))} ${E(r.rank??'—')} · ${E(t('time'))} ${E(r.total||'—')}</strong></div><span>⌄</span></summary>
   <div class="inside">${open?renderRaceDetails(r,rankChart):''}</div></details>`;
 }).join('')||`<p class="empty">${E(t('empty'))}</p>`;
 root.querySelectorAll('.race-detail').forEach((details,index)=>{
   if(details.open)return;
   const inside=details.querySelector('.inside');
   details.addEventListener('toggle',function populate(){
     if(!details.open)return;
     inside.innerHTML=renderRaceDetails(rows[index],'');
     details.removeEventListener('toggle',populate);
   });
 });
}
function renderRaceFilters(){
 const years=racesInScope().map(row=>row.year);
 const decades=raceFilters.race==='hak'?[...new Set(ekiden().filter(row=>row.race==='hak').map(row=>raceDecade(row.year)))].sort((a,b)=>b-a):[];
 return `<label class="field">${E(t('filterRace'))}<select id="race-type">
 <option value="all">${E(t('all'))}</option>
 ${['hak','izu','zen','other'].map(race=>`<option value="${race}" ${race===raceFilters.race?'selected':''}>${E(raceName(race))}</option>`).join('')}</select></label>
 ${decades.length?`<label class="field">${E(t('raceDecade'))}<select id="race-decade">
 <option value="all">${E(t('all'))}</option>
 ${decades.map(decade=>`<option value="${decade}" ${String(decade)===raceFilters.decade?'selected':''}>${decade}–${decade+9}</option>`).join('')}</select></label>`:''}
 <label class="field">${E(t('filterYear'))}<select id="race-year">
 <option value="all">${E(t('all'))}</option>${yearOption(years)}</select></label>`;
}
const archiveTabs=[['ekiden','navEkiden','#archive'],['school','schoolRecords','#archive/school'],['alltime','allTime','#archive/alltime'],['charts','archiveCharts','#archive/charts']];
const rankingFilters={
 school:{gender:'all',event:'',name:''},
 alltime:{gender:'all',event:'',name:''}
};
function archiveTab(path){
 if(path==='history'||path==='archive/alltime')return 'alltime';
 if(path==='archive/school')return 'school';
 if(path==='archive/charts')return 'charts';
 if(['archive','archive/ekiden','ekiden'].includes(path))return 'ekiden';
 return null;
}
function renderArchiveCharts(){
 const races=ekiden().map(race=>{
   const plot=renderEkidenRankChart(race,{t,E});
   return plot?`<article class="card"><h2><a href="${raceArchiveLink(race.race,race.year)}">${E(race.year)} ${E(raceName(race.race))}</a></h2>
   ${plot}${sourceLink(race.source)}</article>`:'';
 }).join('');
 return races?`<div class="analysis-chart-grid">${races}</div>`:`<p>${E(t('empty'))}</p>`;
}
function renderArchive(tab){
 const tabs=`<nav class="archive-tabs" aria-label="${E(t('navArchive'))}">
 ${archiveTabs.map(([id,label,href])=>`<a href="${href}" ${tab===id?'aria-current="page"':''}>${E(t(label))}</a>`).join('')}</nav>`;
 if(tab==='charts')return pageIntro('archiveCharts','archiveChartsDesc')+
   `<section class="wrap section archive-section">${tabs}${renderArchiveCharts()}</section>`;
 const controls=tab==='ekiden'?renderRaceFilters():renderRankingFilters(tab);
 const beginner=language()==='zh';
 const records=tab==='ekiden'?`<div id="section-records">${renderSectionRecords()}</div>`:'';

 return pageIntro('navArchive','archiveDesc')+`<section class="wrap section archive-section">
 ${tabs}${tab==='ekiden'&&beginner?`<details class="ekiden-help archive-ekiden-help">
 <summary>${E(t('ekidenGlossary'))}</summary>${ekidenTerms()}</details>`:''}<p class="micro">${E(t('lastChecked'))} · ${E(state.official?.meta?.refreshed||state.official?.meta?.fetched||DATA_SNAPSHOT)}
 ${tab==='ekiden'?'':sourceLink('https://waseda-ac.jp/record/')}</p>
 <div class="filterbar">${controls}</div>
 ${tab==='ekiden'
   ?`${beginner?'':records}<div id="race-results" class="race-grid"></div><p class="note">${E(t('historyNote'))}</p>${beginner?records:''}`
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
   (!filter.event||recordLabel(row.event)===filter.event)&&matchesAthleteSearch(row.athlete,filter.name));
 host.innerHTML=`<div class="table-wrap"><table class="data-table">
 <thead><tr>${headers.map(key=>`<th scope="col">${E(t(key))}</th>`).join('')}</tr></thead>
 <tbody>${rows.map(row=>`<tr>${hasRank?`<td>${E(row.rank??'—')}</td>`:''}
 <td>${E(row.athlete)}</td><td>${E(recordLabel(row.event))}</td><td class="mono">${E(row.performance)}</td>
 <td>${E(row.date||row.year||'—')}</td><td>${sourceLink(row.source)}</td></tr>`).join('')||
 `<tr><td colspan="${headers.length}">${E(t(state.officialOnline?'empty':'historyFailed'))}</td></tr>`}</tbody></table></div>`;
}
function renderGuide(){const keys=['PB','Leg','Student','World','Team','Source'];return pageIntro('aboutTitle','guideIntro')+`<section class="wrap section"><div class="guide-grid">${keys.map(k=>`<article class="card"><span class="micro">GLOSSARY / ${E(k.toUpperCase())}</span><h3>${E(t('term'+k))}</h3><p>${E(t('term'+k+'Desc'))}</p></article>`).join('')}</div><article class="intro-panel" style="margin-top:20px"><h3>${E(t('legalTitle'))}</h3><p>${E(t('independent'))}</p><p>${E(t('legalNote'))}</p><p>${sourceLink('https://waseda-ac.jp/record/',t('sourceLabel'))}</p></article>${fanBoardLink(t,E)}${renderClubDiary()}${renderOfficialLinks(true)}</section>`;}
async function render(){detachAdmin();const path=decodeURIComponent((location.hash.slice(1).split('?')[0]||'home'));const tab=archiveTab(path);const current=tab?'archive':['home','athletes','results','schedule','guide','admin','submissions','fans'].includes(path)?path:'home';document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===current));document.querySelector('#mobile-nav').hidden=true;document.querySelector('#menu-btn').setAttribute('aria-expanded','false');document.documentElement.lang=language()==='ja'?'ja':'zh-CN';translateStatic(document);document.querySelectorAll('[data-submission-link]').forEach(link=>{link.hidden=!state.submissionsReady;});if(!dataLoaded&&['results','archive','schedule','submissions'].includes(current)){app.innerHTML=`<p class="wrap section" role="status">${E(t('historyBusy'))}</p>`;return;}if(current==='fans'){
 const review=new URLSearchParams(location.hash.split('?')[1]).has('review');
 app.innerHTML=pageIntro(review?'fanReview':'fanTitle','fanIntro')+`<section class="wrap section fan-board" id="fan-board">
 ${review?`<label class="field">${E(t('fanReviewStatus'))}<select data-fan-status hidden>
 <option value="pending">${E(t('fanPending'))}</option><option value="published">${E(t('fanPublished'))}</option></select></label>`:'<div data-fan-composer></div>'}
 <p role="status">${E(t('loading'))}</p><div class="fan-posts" data-fan-posts></div>
 <button class="btn" type="button" data-fan-more hidden>${E(t('feedbackMore'))}</button></section>`;
 await renderFanBoard(document.querySelector('#fan-board'),{t,E},review);
 return;
}if(current==='submissions'){
 app.innerHTML=pageIntro('submissionTitle','submissionIntro')+`<section class="wrap section" id="submission-root"><p role="status">${E(t('loading'))}</p></section>`;
 await renderSubmissions(document.querySelector('#submission-root'),{t,E,sourceLink});
 return;
}if(current==='home')app.innerHTML=renderHome();if(current==='athletes')app.innerHTML=renderAthletes();if(current==='schedule')app.innerHTML=renderSchedule();if(current==='results'){app.innerHTML=renderResults();updateResults();}applyArchiveRoute(tab);if(current==='archive')app.innerHTML=renderArchive(tab);if(current==='guide'){
 app.innerHTML=renderGuide();
 if(new URLSearchParams(location.hash.split('?')[1]).has('official')){
   document.querySelector('#official-links-title').scrollIntoView();
 }
}if(current==='admin'){app.innerHTML=`<section class="wrap section" id="admin-root"><p>${E(t('adminLoading'))}</p></section>`;await renderAdminPage(document.querySelector('#admin-root'),{t,E,sourceLink,toast});return;}
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
 }else if(tab!=='charts'){
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
document.addEventListener('change',e=>{const id=e.target?.id,v=e.target?.value;if(['result-year','result-status','result-grade','result-meet','result-event','result-group'].includes(id))updateResults(true);if(id==='filter-grade')filter.grade=v;if(id==='filter-gender')filter.gender=v;if(id==='filter-metric')filter.metric=v;if(id?.startsWith('filter-'))renderAthleteTable();if(id==='race-type'||id==='race-decade'){
 if(id==='race-type'){
   raceFilters.race=v;
   raceFilters.decade='all';
   document.querySelector('#section-records').innerHTML=renderSectionRecords();
 }else raceFilters.decade=v;
 raceFilters.year='all';
 const controls=e.target.closest('.filterbar');
 controls.innerHTML=renderRaceFilters();
 controls.querySelector('#'+id)?.focus();
}
if(id==='race-year')raceFilters.year=v;
if(['race-type','race-decade','race-year'].includes(id))renderRaceList();
if(id==='history-gender'||id==='history-event'){
 const tab=archiveTab(location.hash.slice(1).split('?')[0]);
 rankingFilters[tab][id==='history-gender'?'gender':'event']=v;
 historyTable(tab);
}
});
window.addEventListener('hashchange',event=>{
 render();
 if(event.newURL.includes('#athletes?name=')||event.oldURL.includes('#athletes?name=')||event.newURL.includes('#archive?race=')||event.newURL.includes('#schedule')||event.newURL.includes('#fans')){
   window.scrollTo({top:0,behavior:'instant'});
 }
});
chooseLanguage(language());
loadData().finally(()=>{
 const url=new URL(location.href);
 if(url.searchParams.get('atlas-submissions')==='1'){
   const destination=sessionStorage.getItem('atlas-submission-return');
   sessionStorage.removeItem('atlas-submission-return');
   url.searchParams.delete('atlas-submissions');
   url.hash=destination==='#fans'||destination?.startsWith('#submissions')?destination:'#submissions';
   history.replaceState(history.state,'',url);
 }
 dataLoaded=true;
 render();
});

function refreshWatch(selector){
 const panel=document.querySelector('#athlete-watch');
 if(!panel)return;
 panel.innerHTML=renderWatchPage({t,E,sourceLink,raceName});
 (panel.querySelector(selector)||panel.querySelector('a'))?.focus({preventScroll:true});
}
document.addEventListener('change',event=>{
 const input=event.target;
 if(input.matches('[data-compare-name]')){
   setCompared(input.dataset.compareName,input.checked);
   refreshWatch(`[data-compare-name="${CSS.escape(input.dataset.compareName)}"]`);
 }
 if(input.id==='watch-event'){
   setWatchEvent(input.value);
   refreshWatch('#watch-event');
 }
});
document.addEventListener('click',e=>{
 const button=e.target.closest('button');
 const id=button?.id;
 if(button?.dataset.watchName){
   toggleWatched(button.dataset.watchName);
   if(button.closest('#athlete-watch'))refreshWatch('[data-watch-name]');
   else{
     const replacement=document.createElement('template');
     replacement.innerHTML=watchStar(button.dataset.watchName,t,E);
     const star=replacement.content.firstElementChild;
     button.replaceWith(star);
     star.focus({preventScroll:true});
   }
 }
 if(id==='result-prev'||id==='result-next'){
   resultsPage+=id==='result-next'?1:-1;
   updateResults();
 }
 if(id==='ekiden-start')document.querySelector('#ekiden-intro-title').focus();
 if(id==='home-next-meet')document.querySelector('#schedule-heading').focus();
});

bindFeedback(document.querySelector('#feedback-form'));
