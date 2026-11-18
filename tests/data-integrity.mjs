import assert from 'node:assert/strict';
import {ROSTER} from '../data/roster.js';
import {RECENT_EKIDEN} from '../data/recent-ekiden.js';
import {state,athletes,athlete,ekiden,worldRankings,stories,parseTime,formatPace} from '../js/data.js';
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
