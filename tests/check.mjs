import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
const dir=resolve(import.meta.dirname,'..');
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.document={documentElement:{lang:'zh-CN'}};
const {ROSTER,FEATURED}=await import('../data/roster.js');
const {RECENT_EKIDEN}=await import('../data/recent-ekiden.js');
const {t,setLanguage}=await import('../js/i18n.js');
const {parseTime,formatPace}=await import('../js/data.js');
assert.equal(ROSTER.length,48);
assert.equal(new Set(ROSTER.map(x=>x.name)).size,48);
assert.equal(FEATURED.length,6);
assert.ok(FEATURED.every(x=>ROSTER.some(a=>a.name===x)));
assert.ok(RECENT_EKIDEN.length>=6);
assert.ok(RECENT_EKIDEN.every(r=>r.source.startsWith('https://')&&r.legs.every(l=>l.leg&&l.name&&l.time)));
assert.equal(parseTime('13:17.19'),797.19);
assert.equal(formatPace('13:20.00',5),'2:40/km');
const keys=['navHome','navAthletes','navResults','navArchive','archiveDesc','resultPrimary','resultCount','sectionRecords','adminTypeComparison','navEkiden','navHistory','navGuide','navAdmin','independent','adminMigration','adminSyncNotice','worldRank','adminNoAccess','adminDelete','historyFailed','notRanked'];
for(const lang of ['zh','ja']){setLanguage(lang);for(const key of keys)assert.notEqual(t(key),key,`${key} absent: ${lang}`);}
setLanguage('zh');
assert.equal(t('resultLegacy'),'旧站快照 · 已复核');
assert.equal(t('resultWorkbook'),'旧站历史档案 · 已复核');
setLanguage('ja');
assert.equal(t('resultLegacy'),'旧サイトの記録 · 確認済み');
assert.equal(t('resultWorkbook'),'旧サイトの歴史資料 · 確認済み');
const paths=[];function walk(p){for(const name of readdirSync(p,{withFileTypes:true})){const q=join(p,name.name);if(name.isDirectory())walk(q);else if(!q.endsWith('package-lock.json'))paths.push(q);}}walk(dir);
const sources=paths.filter(x=>/\.(?:js|html|css|svg|json)$/.test(x)).map(x=>[x,readFileSync(x,'utf8')]);
for(const [f,s] of sources){assert.ok(!/sb_secret_[A-Za-z0-9]{8}|service.role\s*[:=]|SUPABASE_SERVICE_ROLE_KEY|waseda-ac\.jp\/diary\/detail\/\d+/.test(s),`Sensitive or excluded material in ${f}`);}
assert.ok(!readFileSync(join(dir,'index.html'),'utf8').includes('<img '));
for(const [f,content] of sources){assert.ok(!/THIS-PRIVATE-USERNAME/i.test(content),`GitHub owner exposed in ${f}`);}
for(const relative of ['docs/DEPLOY.md','README.md'])assert.ok(!/THIS-PRIVATE-USERNAME/i.test(readFileSync(join(dir,relative),'utf8')),'Private account leaked in deployment docs');
assert.ok(readFileSync(join(dir,'sql/optional-managed-content.sql'),'utf8').includes('ENABLE ROW LEVEL SECURITY'));
console.log('PASS: roster, races, bilingual essentials, time parsing, no secrets or copied media, RLS migration present.');
