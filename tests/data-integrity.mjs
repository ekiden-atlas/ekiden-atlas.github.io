import {VERIFIED_ALLTIME_TIES} from '../data/alltime-ranking-ties.js';
import assert from 'node:assert/strict';
import {VERIFIED_ROSTER_PROFILES} from '../data/roster-verified-profiles.js';
import {EARLIER_ATHLETE_RESULTS,EARLIER_SPECIALTY_PBS} from '../data/earlier-athlete-results.js';
import {ROSTER} from '../data/roster.js';
import {OFFICIAL_CLUB_ROSTER} from '../data/official-club-roster.js';
import {ADDITIONAL_RESULTS_2026} from '../data/race-date-audit-2026.js';
import {RECENT_EKIDEN} from '../data/recent-ekiden.js';
import {state,athletes,athlete,ekiden,worldRankings,personalResults,resultGrade,specialtyPbs,sectionRecords,schoolRecords,alltimeRankings,parseTime,formatPace,nameSearch} from '../js/data.js';
assert.equal(ROSTER.length,50);
assert.equal(OFFICIAL_CLUB_ROSTER.length,129);
assert.equal(new Set(OFFICIAL_CLUB_ROSTER.map(row=>row.block)).size,7);
assert.equal(new Set(athletes().map(row=>nameSearch(row.name))).size,athletes().length);
assert.deepEqual(athletes().filter(row=>row.clubSource).map(row=>row.clubSource).sort(),OFFICIAL_CLUB_ROSTER.map(row=>row.source_url).sort());
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
const historicalRaces=ekiden();
for(const [race,count] of [['izu',30],['zen',32]]){
 const rows=historicalRaces.filter(row=>row.race===race);
 assert.ok(rows.length>=count);
 assert.equal(new Set(rows.map(row=>row.year)).size,rows.length);
}
assert.equal(historicalRaces.find(row=>row.race==='izu'&&row.year===2010)?.total,'2:10:05');
assert.equal(historicalRaces.find(row=>row.race==='zen'&&row.year===2003)?.status,'途中棄権');
assert.ok(ekiden().flatMap(x=>x.legs).length>=966);
assert.ok(schoolRecords().length>=66);
const auditedRankings=alltimeRankings();
assert.ok(auditedRankings.length>=497);
for(const tie of VERIFIED_ALLTIME_TIES){
 const group=auditedRankings.filter(row=>row.gender===tie.gender&&row.event===tie.event&&row.rank===tie.rank);
 assert.ok(group.length>=2, tie.athlete);
 assert.equal(group.find(row=>row.athlete===tie.athlete)?.performance,tie.performance);
}

const roadRanks=auditedRankings.filter(row=>row.gender==='男'&&row.event==='5km');
assert.deepEqual(roadRanks.map(row=>row.rank),[1,2,2,4,5,6,6,8,9,9,9]);
assert.deepEqual(roadRanks.filter(row=>row.rank===2).map(row=>[row.athlete,row.performance]),
 [['鈴木 琉胤','13分38秒'],['吉倉 ナヤブ直希','13分38秒']]);
assert.equal(sectionRecords().filter(row=>row.race!=='hak').length,15);
for(const school of [true,false]){
 const rows=sectionRecords().filter(row=>row.race==='hak'&&(row.scope==='school')===school);
 assert.deepEqual(rows.map(row=>row.leg),[1,2,3,4,5,6,7,8,9,10]);
}
assert.equal(specialtyPbs().length,4+EARLIER_SPECIALTY_PBS.length);
assert.equal(specialtyPbs("広瀬 夏希").find(row=>row.event==="5000mW")?.time,"22:51.61");
assert.equal(athlete("髙久 拓己").pb5000,"14:31.56");
assert.equal(new Set(athletes().map(row=>nameSearch(row.name))).size,athletes().length);
assert.deepEqual(athletes().filter(row=>row.clubSource).map(row=>row.clubSource).sort(),OFFICIAL_CLUB_ROSTER.map(row=>row.source_url).sort());
assert.equal(athlete('佐々木 哲').high_school,'佐久長聖高等学校');
const rows=personalResults();
assert.equal(rows.length,1014+EARLIER_ATHLETE_RESULTS.length+ADDITIONAL_RESULTS_2026.length);
assert.equal(new Set(EARLIER_ATHLETE_RESULTS.map(row=>nameSearch(row.name))).size,18);
assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
for(const [year,count] of [[2023,60],[2024,348],[2025,262],[2026,248+ADDITIONAL_RESULTS_2026.length]]){
 assert.equal(rows.filter(row=>row.year===year).length,count+EARLIER_ATHLETE_RESULTS.filter(row=>row.year===year).length);
}
const results2026=rows.filter(row=>row.year===2026);
assert.ok(results2026.every(row=>/^2026-\d{2}-\d{2}$/.test(row.date)&&row.source?.startsWith('https://')));
assert.equal(results2026.find(row=>row.id==='annual-71').rank,43);
assert.equal(results2026.find(row=>row.id==='annual-66').date,'2026-08-09');
assert.equal(results2026.find(row=>row.id==='annual-24').time,'3:59.6');
for(const [name,profile] of Object.entries(VERIFIED_ROSTER_PROFILES)){
 assert.ok(Object.keys(profile._pbSources).length>=2);
 const results=rows.filter(row=>row.name.replace(/\s/g,'')===name.replace(/\s/g,''));
 for(const status of name==='高舘 友杜'?['student','highSchool']:['student','highSchool','middleSchool']){
   assert.ok(results.some(row=>row.status===status&&resultGrade(row)&&row.source),name+' '+status);
 }
}
assert.equal(athlete('高舘 友杜').pb1500,'3:53.3');
assert.equal(athlete('若狭 奏汰').pb1500,'');
const resultById=id=>rows.find(row=>row.id===id);
const chitoseRows=rows.filter(row=>row.meet==='ホクレン・ディスタンスチャレンジ2026 第1戦 千歳大会');
assert.ok(chitoseRows.every(row=>row.date==='2026-07-04'&&row.verification==='primary'&&row.source.endsWith('chitoseResult.pdf')));
assert.deepEqual(chitoseRows.map(row=>[row.time,row.rank,resultGrade(row)]),[
 ['13:17.19',5,'3'],['13:37.61',13,'3'],['13:32.61',6,'1'],['4:36.13',5,'2'],['4:36.51',6,'3']
]);
assert.deepEqual(rows.filter(row=>row.meet==='第37回ゴールデンゲームズ・イン・のべおか')
 .map(row=>[row.name,row.time,row.rank,row.stage,row.date,resultGrade(row),row.verification]),[
 ['山口 竣平','13:29.72',5,'男子5000m A組','2026-05-04','3','primary'],
 ['増子 陽太','13:20.35',9,'男子5000m B組','2026-05-04','1','primary'],
 ['本田 桜二郎','13:47.83',14,'男子5000m A組','2026-05-04','1','primary'],
 ['新妻 遼己','13:55.60',18,'男子5000m A組','2026-05-04','1','primary']
]);
const kudoRows=rows.filter(row=>row.name.replace(/\s/g,'')==='工藤慎作'&&row.status==='student');
assert.equal(kudoRows.filter(row=>resultGrade(row)==='1').length,9);
assert.equal(kudoRows.filter(row=>resultGrade(row)==='2').length,12);
assert.deepEqual(
 ['annual-1','annual-171','annual-2','annual-3','annual-4'].map(resultById).map(row=>[row.date,row.time,row.rank,resultGrade(row)]),
 [['2026-03-01','2:07:34',20,'3'],['2026-01-02','1:09:46',3,'3'],['2026-05-04','13:31',1,'4'],
  ['2026-05-24','13:38.67',5,'4'],['2026-06-21','28:27',8,'4']]
);
const kudoTrackPb=kudoRows.filter(row=>row.event==='10000m'&&row.pb);
assert.equal(kudoTrackPb.length,1);
const {date,time,rank,stage}=kudoTrackPb[0];
assert.deepEqual([date,time,rank,stage,resultGrade(kudoTrackPb[0])],['2023-04-22','28:31.87',12,'9組','1']);
assert.equal(kudoTrackPb[0].time,athlete('工藤 慎作').pb10000);
for(const [id,time,rank,grade] of [
 ['2020-chiba-ekiden','15:09',2,'1'],['2021-chiba-ekiden','23:47',1,'2'],
 ['2022-chiba-ekiden','23:59',1,'3'],['2023-prefecture-ekiden','24:17',4,'3'],
 ['2019-chiba-rookie-ekiden','9:19',null,'2']
]){
 const row=resultById('school-kudo-'+id);
 assert.deepEqual([row.time,row.rank,resultGrade(row)],[time,rank,grade]);
}
assert.equal(resultById('annual-1').japaneseRank,5);
assert.equal(resultGrade(resultById('annual-25')),'1');
assert.equal(resultGrade(resultById('annual-9')),'4');
assert.equal(resultById('annual-51').status,'highSchool');
assert.equal(resultGrade(resultById('school-suzuki-2022-ekiden')),'1');
assert.equal(resultGrade({status:'OB',grade:4}),'');
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

const schoolRows=rows.filter(row=>['middleSchool','highSchool'].includes(row.status));
assert.equal(schoolRows.length,216+EARLIER_ATHLETE_RESULTS.filter(row=>['middleSchool','highSchool'].includes(row.status)).length);
assert.equal(schoolRows.filter(row=>row.status==='middleSchool').length,51+EARLIER_ATHLETE_RESULTS.filter(row=>row.status==='middleSchool').length);
assert.ok(schoolRows.every(row=>row.unit&&(row.source||row.gradeSource).startsWith('https://')));
assert.equal(schoolRows.find(row=>row.id==='school-kudo-2019-3000').rank,10);
assert.equal(schoolRows.find(row=>row.id==='school-suzuki-2021-zenchu').time,'8:35.54');
assert.equal(schoolRows.find(row=>row.id==='school-kudo-2019-funabashi').rank,null);

assert.deepEqual(schoolRows.filter(row=>row.id.startsWith('school-yamaguchi-2022-nittai-'))
 .map(row=>[row.date,row.stage,row.time,row.rank,resultGrade(row)]),
 [['2022-11-26','25組','13:57.79',2,'2'],['2022-04-24','12組','14:14.56',3,'2']]);
