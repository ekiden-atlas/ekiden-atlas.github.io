// One-time or manual snapshot extraction from a reviewed local checkout of the old site.
// The inline 2025, graduate and relay blocks use JS literals and a data-building loop.
// Inspect those blocks before using this script. CI only uses the JSON parser in build-archive.mjs.
import fs from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {facts,publicSource,officialFacts} from './archive-facts.mjs';

if(!process.argv[2]||!/^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]||'')){
  throw new Error('Usage: node scripts/import-legacy-snapshot.mjs <reviewed checkout> <snapshot date>');
}
const file=name=>fs.readFileSync(join(process.argv[2],name),'utf8');
const html=file('index.html');
const views=file('archive-views.js');
function json(source,name){
  const match=source.match(new RegExp('const '+name+'=(.*);$','m'));
  if(!match)throw new Error('Missing legacy data block: '+name);
  return JSON.parse(match[1]);
}
function literalBlock(source,start,end,expression){
  const from=source.indexOf(start);
  const to=source.indexOf(end,from+start.length);
  if(from<0||to<0)throw new Error('Missing legacy data block: '+expression);
  return vm.runInNewContext(source.slice(from,to)+'\n'+expression,Object.create(null),
    {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}});
}
const p={
  roster:json(html,'BASE_ATHLETES'),annual:json(html,'ANNUAL_2026'),
  special:json(html,'SPECIALTY_RESULTS_2026'),latest:json(html,'LATEST_RESULTS_2026'),
  ob:json(views,'OB_RESULTS_2026'),recent:json(html,'RACES'),
  official:JSON.parse(file('waseda-records-data.js').split('window.WSD_OFFICIAL_RECORDS=')[1].trim().replace(/;$/,'')),
  workbook:JSON.parse(gunzipSync(Buffer.from(file('archive-2024-2025-data.js').match(/"([A-Za-z0-9+/=]+)"/)[1],'base64'))),
  selected:literalBlock(html,'const SRC={\n hak:','const full=e=>','({RESULTS,RELAYS,SRC})')
};
const extracted=literalBlock(html,'const EKIDEN_ARCHIVE=','function ekidenSeconds','EKIDEN_ARCHIVE');
const basic=['year','name','grade','gradeAtRace','gender','meet','event','date','precision','time','rank','status','stage','unit','location','pb'];
const row=(id, verification, v)=>({id,verification,...facts(v,basic),source:publicSource(v.link||v.source)});
const archive=p.workbook.map(([year,name,grade,meet,event,date,time,rank,status,link,stage],index)=>row('workbook-'+index,'workbook',{year,name,grade,meet,event,date,time,rank,status,link,stage}));
const selected=p.selected.RESULTS.map((v,i)=>row('selected-'+i,'cited',{...v,year:2025,meet:v.event,event:v.metric,status:'student'}));
const annual=p.annual.map(v=>row('annual-'+v.id,'legacy',{...v,year:Number(v.year),status:'student'}));
const ob=p.ob.map(v=>row(v.id,'cited',v));
const latest=p.latest.map((v,i)=>row('latest-'+i,'cited',{...v,year:2026,meet:v.event,event:v.distance,source:v.official||v.source,status:'student'}));
const normalized=value=>String(value??'').replace(/\s/g,'');
const resultKey=r=>[r.name,r.date,r.event,r.time,r.rank].map(normalized).join('|');
// These two legacy blocks independently list the same Seven Hills Run finish.
const supplemental=new Map(latest.map(r=>[resultKey(r),r]));
for(const result of annual){
  const match=result.date&&supplemental.get(resultKey(result));
  if(match){
    result.meetAlias=result.meet;
    Object.assign(result,{meet:match.meet,location:match.location,source:match.source,verification:match.verification});
    supplemental.delete(resultKey(result));
  }
}
const specialty=Object.entries(p.special).flatMap(([name,v])=>v.races.map((r,i)=>row('special-'+i,'cited',{...r,year:2026,name,meet:r.event,event:v.main,status:'student'})));
const specialtyPb=[];
for(const [name,v] of Object.entries(p.special)){
  for(const [event,time] of [[v.main,v.pb],...v.otherPB]){
    specialtyPb.push({id:'special-pb-'+specialtyPb.length,name,event,time,source:publicSource(v.pbSource)});
  }
}
for(const athlete of p.roster){
  for(const [field,event] of [['pb3000','3000m'],['pb3000sc','3000mSC']]){
    if(athlete[field]&&!specialtyPb.some(row=>row.name===athlete.name&&row.event===event&&row.time===athlete[field])){
      specialtyPb.push({id:'roster-pb-'+p.roster.indexOf(athlete)+'-'+field,name:athlete.name,event,time:athlete[field]});
    }
  }
}
const bios=json(html,'WSD_BIO_INITIAL');
const graduates=literalBlock(views,'const GRADUATES_2026=','const grad2026Keys=','GRADUATES_2026');
const athleteProfiles=p.roster.map(athlete=>{
  const [birthday,birthplace,high_school]=bios[athlete.name]||[];
  return {...facts(athlete,['name','historical','asOf','mainEvent','highlight']),
    birthday,birthplace,high_school};
});
for(const graduate of graduates){
  const details={graduation_year:graduate.schoolYear,graduation_source:publicSource(graduate.source)};
  const matching=athleteProfiles.find(row=>row.name===graduate.name);
  if(matching)Object.assign(matching,details);
  else athleteProfiles.push({name:graduate.name,...details});
}
const race2024=json(views,'EKIDEN_2024');
const records=officialFacts(p.official);
for(const race of [...records.hakone,...records.otherEkiden]){
  const type=race.type||'hak';
  const recent=race.year===2026?p.recent[type]:race.year===2025?p.selected.RELAYS[type]:race.year===2024?race2024.find(x=>x.key===type):null;
  if(recent){
    race.date=recent.date;
    if(recent.distance)race.distance=recent.distance;
    if(!race.legs.length)race.legs=recent.legs.map(([name,km,time,rank],i)=>({leg:i+1,name,km,time,rank}));
    if(type!=='hak' && race.year===2026)race.legs.forEach((leg,i)=>leg.team_position=extracted[type].positions[i]);
  }
}
const sectionRecords=Object.entries(extracted).flatMap(([race,entry])=>[
  ...entry.rows.map(([leg,time,name,unit,year,previous,previousHolder])=>({
    id:race+'-'+leg,race,leg,time,name,unit,year:Number(year),previous,previousHolder,
    source:publicSource(entry.sources[race==='zen'?2:0][1])
  })),
  ...(entry.japaneseBest?[{
    id:race+'-japanese-best',race,leg:entry.japaneseBest.section,name:entry.japaneseBest.name,
    time:entry.japaneseBest.time,previous:entry.japaneseBest.prior,year:2026,scope:'japanese',source:publicSource(entry.sources[1][1])
  }]:[])
]);
const results=[...annual,...archive,...selected,...ob,...supplemental.values(),...specialty];
const primary=[{
  id:'primary-wa-7190594-10230007-64',verification:'primary',year:2024,name:'佐々木 哲',
  date:'2024-03-30',meet:'World Athletics Cross Country Championships Belgrade 24',
  event:'U20 8km',time:'26:03',rank:64,
  source:'https://worldathletics.org/competition/calendar-results/results/7190594?eventId=10230007'
},
  {"id":"primary-wa-7204187-honda","verification":"primary","year":2026,"name":"本田 桜二郎","grade":1,"gender":"男","meet":"コペンハーゲン2026世界ロードランニング選手権大会","event":"1マイル","date":"2026-09-19","precision":"日","time":"3:57.50","rank":16,"status":"student","stage":"決勝","location":"デンマーク・コペンハーゲン","unit":"早稲田大学","pb":true,"source":"https://worldathletics.org/competitions/world-athletics-road-running-championships/copenhagen26/results/men/road-mile/final/result"},
  {"id":"primary-wa-7204187-suzuki","verification":"primary","year":2026,"name":"鈴木 琉胤","grade":2,"gender":"男","meet":"コペンハーゲン2026世界ロードランニング選手権大会","event":"5km","date":"2026-09-19","precision":"日","time":"13:38","rank":28,"status":"student","stage":"決勝","location":"デンマーク・コペンハーゲン","unit":"早稲田大学","pb":true,"source":"https://worldathletics.org/competitions/world-athletics-road-running-championships/copenhagen26/results/men/5-kilometres/final/result"},
  {"id":"primary-wa-7204187-mashiko","verification":"primary","year":2026,"name":"増子 陽太","grade":1,"gender":"男","meet":"コペンハーゲン2026世界ロードランニング選手権大会","event":"5km","date":"2026-09-19","precision":"日","time":"13:50","rank":40,"status":"student","stage":"決勝","location":"デンマーク・コペンハーゲン","unit":"早稲田大学","pb":true,"source":"https://worldathletics.org/competitions/world-athletics-road-running-championships/copenhagen26/results/men/5-kilometres/final/result"}
];
const snapshot={...records,results:[...results,...primary],athleteProfiles,specialtyPb,sectionRecords,
  meta:{fetched:process.argv[3],completeHakone:true}};
const lines=Object.entries(snapshot).map(([key,value])=>{
  const content=Array.isArray(value)?'[\n'+value.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ]':JSON.stringify(value);
  return '  '+JSON.stringify(key)+': '+content;
});
fs.writeFileSync(new URL('../data/official-records.json',import.meta.url),'{\n'+lines.join(',\n')+'\n}\n');
console.log('Snapshot written. Personal rows:',snapshot.results.length,'athlete entries:',athleteProfiles.length,
  'static profiles:',Object.keys(bios).length,'specialty PBs:',specialtyPb.length);

