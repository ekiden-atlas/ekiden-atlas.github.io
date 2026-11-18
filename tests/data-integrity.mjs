import assert from 'node:assert/strict';
import {ROSTER} from '../data/roster.js';
import {RECENT_EKIDEN} from '../data/recent-ekiden.js';
import {state,athletes,athlete,ekiden,worldRankings,personalResults,specialtyPbs,sectionRecords,schoolRecords,alltimeRankings,parseTime,formatPace} from '../js/data.js';
assert.equal(ROSTER.length,48);
assert.equal(athletes().length,48);
assert.ok(RECENT_EKIDEN.some(x=>x.race==='hak'&&x.year===2026));
assert.ok(RECENT_EKIDEN.some(x=>x.race==='izu'&&x.year===2026));
assert.ok(RECENT_EKIDEN.some(x=>x.race==='zen'&&x.year===2026));
assert.equal(parseTime('13:17.19'),797.19);
assert.equal(formatPace('13:17.19',5),'2:39/km');
const source='https://example.com/results';
state.legacyEdits=[{entity_type:'ekiden',record_key:'race:izu:2026',payload:{rank:9},is_deleted:false}];
assert.equal(ekiden().find(x=>x.race==='izu'&&x.year===2026).rank,9,'Old shared overlay should be honored');
state.legacyEdits=[];
state.managed=[
 {kind:'athlete',record_key:'山口 竣平',payload:{grade:4},source_url:source,is_deleted:false},
 {kind:'pb',record_key:'山口 竣平:5000m',payload:{name:'山口 竣平',field:'pb5000',time:'13:11.11'},source_url:source,is_deleted:false},
 {kind:'ekiden',record_key:'race:izu:2026',payload:{rank:2},source_url:source,is_deleted:false},
 {kind:'world_rank',record_key:'山口 竣平:5000m',payload:{athlete_name:'山口 竣平',event_name:'5000m',world_rank:150,ranking_date:'2026-11-10'},source_url:source,is_deleted:false}
];
assert.equal(athlete('山口 竣平').grade,4);
assert.equal(athlete('山口 竣平').pb5000,'13:11.11');
assert.equal(ekiden().find(x=>x.race==='izu'&&x.year===2026).rank,2);
assert.equal(worldRankings('山口 竣平')[0].world_rank,150);
state.managed=[{kind:'athlete',record_key:'山口 竣平',payload:{},is_deleted:true},{kind:'ekiden',record_key:'race:izu:2026',payload:{},is_deleted:true}];
assert.equal(athlete('山口 竣平'),null,'Deleted athlete should not be displayed');
assert.ok(!ekiden().some(x=>x.race==='izu'&&x.year===2026),'Deleted race should not be displayed');
console.log('PASS: shared archive overlays, editable data overlays, ranking context, soft deletes.');

const {readFileSync}=await import('node:fs');
state.legacyEdits=[];
state.managed=[];
state.official=JSON.parse(readFileSync(new URL('../data/official-records.json',import.meta.url)));
assert.ok(ekiden().filter(x=>x.race==='hak').length>=102);
assert.ok(ekiden().filter(x=>x.race!=='hak').length>=8);
assert.ok(ekiden().flatMap(x=>x.legs).length>=966);
assert.ok(schoolRecords().length>=66);
assert.ok(alltimeRankings().length>=497);
assert.equal(sectionRecords().length,15);
assert.equal(specialtyPbs().length,4);
assert.equal(athletes().length,50);
assert.equal(athlete('佐々木 哲').high_school,'佐久長聖高等学校');
const rows=personalResults();
assert.equal(rows.length,580);
assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
for(const [year,count] of [[2024,210],[2025,179],[2026,191]]){
 assert.equal(rows.filter(row=>row.year===year).length,count);
}
assert.ok(rows.some(row=>row.verification==='primary'&&row.rank===64&&row.time==='26:03'));
assert.equal(rows.filter(row=>row.status==='OB').length,state.official.results.filter(row=>row.status==='OB').length);
const legacy=rows.find(row=>row.id==='ob2026-1');
const record_key='ob:'+[legacy.name,legacy.date,legacy.meet,legacy.event,legacy.time].join('|').slice(0,178);
state.legacyEdits=[{entity_type:'ob_result',record_key,payload:{rank:7}}];
assert.equal(personalResults().find(row=>row.id===legacy.id).rank,7);
state.managed=[{kind:'result',record_key:legacy.id,payload:{rank:8},source_url:source}];
assert.equal(personalResults().find(row=>row.id===legacy.id).rank,8);
state.managed[0].is_deleted=true;
assert.ok(!personalResults().some(row=>row.id===legacy.id));
state.managed=[];
state.rankings=[{athlete_name:'山口 竣平',event_name:'5000m',ranking_date:'2025-10-02',source_url:source},
 {athlete_name:'山口 竣平',event_name:'5000m',ranking_date:'2026-11-18',source_url:source}];
assert.equal(worldRankings('山口竣平').filter(row=>row.event_name==='5000m').length,3);
assert.equal(worldRankings('山口竣平')[0].ranking_date,'2026-11-18');
console.log('PASS: legacy archive coverage, dated ranks, and precedence of personal-result overrides.');

assert.equal(rows.filter(row=>row.date==='2026-11-15'&&row.time==='44:12').length,1);
const tied=schoolRecords().filter(row=>row.gender==='男'&&row.event==='400m');
assert.equal(tied.length,2);
assert.ok(tied.every(row=>row.performance==='45.71'));

const {meetLabel,recordLabel}=await import('../js/record-names.js');
assert.equal(meetLabel('第253回东海大学长距离竞技会'),'第253回東海大学長距離競技会');
assert.equal(meetLabel('第58回全日本大学驿传'),'第58回全日本大学駅伝対校選手権大会');
assert.equal(meetLabel('Zevenheuvelenloop（Seven Hills Run）'),'ナイメーヘン15kmロードレース（セブンヒルズラン）');
assert.equal(recordLabel('荷兰·奈梅亨'),'オランダ・ナイメーヘン');
assert.equal(recordLabel('男子10000m第6组'),'男子10000m第6組');
assert.equal(recordLabel('5000m预赛第1组'),'5000m予選第1組');
assert.equal(recordLabel('半程马拉松'),recordLabel('ハーフマラソン'));
assert.notEqual(recordLabel('5000m'),recordLabel('5km'));
for(const row of rows){
 const name=meetLabel(row.meet);
 assert.doesNotMatch(name,/[A-Za-z]{3,}|[马驿竞长锦联选东稻]/u,row.id);
 assert.doesNotMatch(recordLabel(row.event)+recordLabel(row.stage),/[马驿竞预决组级纪录晋]/u,row.id);
}
console.log('PASS: Japanese labels across the personal results snapshot, with event scopes preserved.');

state.rankings=[{athlete_name:'本田 桜二郎',event_name:'1500m',ranking_date:'2026-11-10',world_rank:163,source_url:source}];
const official=worldRankings('本田桜二郎').find(row=>row.event_name==='1500m');
assert.equal(official.world_rank,164);
assert.equal(official.asia_rank,7);
assert.equal(official.ranking_points,1135);
assert.match(official.asia_source_url,/region=asia/);
state.rankings=[];
assert.equal(worldRankings().length,12);
assert.ok(worldRankings().every(row=>row.asia_rank>0&&row.ranking_points>0&&row.ranking_date==='2026-11-10'));
console.log('PASS: dated World Athletics Asia rankings, points and offline fallback.');

const copenhagen=rows.filter(row=>row.id.startsWith("primary-wa-7204187-"));
assert.deepEqual(copenhagen.map(row=>[row.name,row.event,row.time,row.rank]),[
  ["本田 桜二郎", "1マイル", "3:57.50", 16],
  ["鈴木 琉胤", "5km", "13:38", 28],
  ["増子 陽太", "5km", "13:50", 40]
]);
assert.ok(copenhagen.every(row=>row.date==="2026-09-19"&&row.pb&&row.verification==="primary"));
const {athleteEkidenHonors}=await import('../js/data.js');
const honorsAt=(name,race,leg)=>athleteEkidenHonors(name)
 .find(row=>row.race===race&&row.year===2026&&row.leg===leg)?.honors.map(honor=>honor.kind);
assert.deepEqual(honorsAt('鈴木琉胤','izu',3),['legNewRecord']);
assert.deepEqual(honorsAt('増子 陽太','zen',2),['legSharedAward','legNewRecord']);
assert.deepEqual(honorsAt('工藤 慎作','zen',8),['legAward','legJapaneseBest']);
assert.deepEqual(honorsAt('本田 桜二郎','izu',2),['legAward']);
assert.equal(honorsAt('山口 竣平','zen',7),undefined);
console.log('PASS: section winners, tied winners, course records and Japanese bests.');
