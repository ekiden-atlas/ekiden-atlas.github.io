import {SCHOOL_RESULTS} from '../data/school-results.js';
import {EKIDEN_RECORD_HONORS} from '../data/ekiden-honors.js';
import {VERIFIED_WORLD_RANKINGS} from '../data/world-ranking-snapshot.js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SUPABASE_SDK} from './config.js';
import {ROSTER} from '../data/roster.js';
import {RECENT_EKIDEN} from '../data/recent-ekiden.js';
import {VERIFIED_5000M,VERIFIED_SCHOOL_SOURCE,VERIFIED_STUDENT_SOURCE} from '../data/verified.js';
let supabasePromise;
export function getDb(){
  if(!supabasePromise)supabasePromise=Promise.race([import(SUPABASE_SDK),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK network timeout')),6000))]).then(m=>m.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})).catch(e=>{supabasePromise=null;throw e;});
  return supabasePromise;
}
export const state={profiles:[],rankings:[],legacyEdits:[],managed:[],managedReady:false,dbOnline:false,official:null,officialOnline:false};
async function safeSelect(db,table,columns,order){
 const rows=[];
 try {
   for(let start=0;;start+=500){
     const {data,error}=await db.from(table).select(columns).order(order).range(start,start+499);
     if(error)throw error;
     rows.push(...data);
     if(data.length<500)return {ok:true,rows};
   }
 } catch {return {ok:false,rows:[]};}
}
async function officialArchive(){try{
  // Local build artifact: public browser traffic never requests the original personal GitHub repository.
  const url=new URL('../data/official-records.json',import.meta.url);
  const r=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(6000)});
  if(!r.ok)throw new Error('Archive HTTP '+r.status);
  const data=await r.json();
  if(!Array.isArray(data.hakone)||!Array.isArray(data.rankings)||!Array.isArray(data.school))throw new Error('Invalid archive');
  if(!data.hakone.length && !data.otherEkiden?.length){state.officialOnline=false;return null;}
  state.officialOnline=true;return data;
}catch{state.officialOnline=false;return null;}}
export async function loadData(){
  const officialTask=officialArchive();
  try{
    const db=await getDb();
    const [a,b,c,d]=await Promise.all([
      safeSelect(db,'wsd_athlete_basic_profiles','athlete_name,birthday,birthplace,hometown,high_school,height_cm,source_url,updated_at','athlete_name'),
      safeSelect(db,'wsd_athlete_world_rankings','id,athlete_name,event_name,world_rank,asia_rank,ranking_points,ranking_date,source_url,rank_basis','id'),
      safeSelect(db,'wsd_open_archive_edits','id,entity_type,record_key,payload,is_deleted,updated_at','id'),
      safeSelect(db,'wsd_public_content','id,kind,record_key,payload,source_url,is_deleted,created_at,updated_at','id')
    ]);
    Object.assign(state,{profiles:a.rows,rankings:b.rows,legacyEdits:c.rows,managed:d.rows,managedReady:d.ok,dbOnline:a.ok||b.ok||c.ok});
  }catch{Object.assign(state,{dbOnline:false,profiles:[],rankings:[],legacyEdits:[],managed:[],managedReady:false});}
  state.official=await officialTask;
  return state;
}
export const nameSearch=name=>String(name??'').normalize('NFC').replace(/\s/g,'').toLowerCase();
function basicProfile(name){
 const exact=state.profiles.find(x=>x.athlete_name===name);
 const matches=state.profiles.filter(x=>nameSearch(x.athlete_name)===nameSearch(name));
 return exact||(matches.length===1?matches[0]:{});
}
function applyManaged(kind,records,keyFn,edits=state.managed){
  const items=new Map(records.map(x=>[keyFn(x),x]));
  edits.filter(x=>x.kind===kind).forEach(x=>{
    if(x.is_deleted){items.delete(x.record_key);return;}
    if(x.payload && typeof x.payload==='object' && !Array.isArray(x.payload)){
      items.set(x.record_key,{...(items.get(x.record_key)||{}),...x.payload,_recordKey:x.record_key,...(kind==='world_rank'||kind==='athlete'?{source_url:x.source_url}:{source:x.source_url}),_source:x.source_url,_updatedAt:x.updated_at,_managed:true});
    }
  });return [...items.values()];
}
export function athletes(){
 const extras=state.official?.athleteProfiles||[];
 const extraByName=new Map(extras.map(x=>[x.name,x]));
 const baseline=[...ROSTER.map(x=>({...x,...extraByName.get(x.name)})),
   ...extras.filter(x=>!ROSTER.some(row=>row.name===x.name))];
 const rosterNames=new Set(baseline.map(x=>nameSearch(x.name)));
 const profiles=state.profiles.filter(x=>!rosterNames.has(nameSearch(x.athlete_name)))
   .map(x=>({...x,name:x.athlete_name}));
 const rows=applyManaged('athlete',[...baseline.map(x=>({...x,...Object.fromEntries(Object.entries(basicProfile(x.name)).filter(([,value])=>value!=null&&value!==''))})),...profiles],x=>x.name);
 const byKey=new Map(rows.map(x=>[x.name,x]));
 state.managed.filter(x=>x.kind==='pb').forEach(r=>{
  const x=r.payload||{};const name=x.name,field=x.field;
  if(!name||!['pb1500','pb5000','pb10000','pbHalf'].includes(field)||!byKey.has(name))return;
  const old=byKey.get(name);old[field]=r.is_deleted?'':String(x.time||'');
  old._pbSources={...old._pbSources,[field]:r.is_deleted?null:r.source_url};
 });return [...byKey.values()];
}
export function athlete(name){return athletes().find(x=>x.name===name)||null;}
export const worldRankKey=x=>x._recordKey||[x.athlete_name,x.event_name,x.ranking_date].join(':');
export function worldRankings(name){
 // Earlier drafts used undated keys. Resolve those against the matching dated snapshot.
 const byKey=new Map(state.rankings.map(row=>[worldRankKey(row),row]));
 for(const snapshot of VERIFIED_WORLD_RANKINGS){
   const key=worldRankKey(snapshot);
   byKey.set(key,{...byKey.get(key),...snapshot});
 }
 const prior=[...byKey.values()];
 const edits=state.managed.filter(x=>x.kind==='world_rank');
 const overrides=edits.map(x=>{
   const old=prior.find(r=>[r.athlete_name,r.event_name].join(':')===x.record_key&&
     (!x.payload?.ranking_date||x.payload.ranking_date===r.ranking_date));
   return old?{...x,record_key:worldRankKey(old)}:x;
 });
 const rows=applyManaged('world_rank',prior,worldRankKey,overrides);
 return rows.filter(x=>x.ranking_date&&x.source_url&&(!name||nameSearch(x.athlete_name)===nameSearch(name)))
   .sort((a,b)=>String(b.ranking_date??'').localeCompare(String(a.ranking_date??''))||
     (a.world_rank??Infinity)-(b.world_rank??Infinity));
}
function legacyPatch(kind,list,keyFn){
 const edits=state.legacyEdits.filter(x=>x.entity_type===kind);
 const byKey=new Map(edits.map(x=>[x.record_key,x]));
 const seen=new Set();
 const rows=[];
 for(const row of list){
   const key=keyFn(row);
   const edit=byKey.get(key);
   seen.add(key);
   if(!edit?.is_deleted)rows.push({...row,...edit?.payload,_legacyKey:key});
 }
 for(const edit of edits){
   if(!seen.has(edit.record_key)&&edit.record_key.startsWith('new:')&&!edit.is_deleted&&edit.payload){
     rows.push({...edit.payload,_legacyKey:edit.record_key});
   }
 }
 return rows;
}
export const ekidenKey=row=>row._recordKey||row._legacyKey||'race:'+row.race+':'+row.year;
export const alltimeKey=row=>row._recordKey||row._legacyKey||'rank:'+row.gender+':'+row.event+':'+row.rank+':'+row.athlete;
const legacySchoolKey=row=>'school:'+row.gender+':'+row.event;
export const schoolKey=row=>row._recordKey||row._legacyKey||legacySchoolKey(row);
export function ekiden(){
 const old=state.official?
 [...(state.official.hakone||[]).map(x=>({...x,race:'hak'})),...(state.official.otherEkiden||[]).map(x=>({...x,race:x.type}))]:RECENT_EKIDEN;
 let rows=legacyPatch('ekiden',old,ekidenKey);
 rows=applyManaged('ekiden',rows,ekidenKey);
 return rows.filter(x=>x?.year && ['hak','izu','zen'].includes(x.race)).map(x=>({...x,legs:typeof x.legs_text==='string'?parseLegs(x.legs_text):x.legs||[]})).sort((a,b)=>b.year-a.year||['hak','izu','zen'].indexOf(a.race)-['hak','izu','zen'].indexOf(b.race));
}
function parseLegs(s){return s.split('\n').map(line=>line.split(/[｜|]/).map(x=>x.trim())).filter(x=>x.length>=4).map(([leg,name,km,time,rank])=>({leg:Number(leg),name,km:km||null,time,rank:rank?Number(rank):null}));}
export function schoolRecords(){
 const snapshot=state.official?.school||[];
 const counts=new Map();
 for(const row of snapshot){
   const key=legacySchoolKey(row);
   counts.set(key,(counts.get(key)||0)+1);
 }
 const rows=snapshot.map(row=>{
   const key=legacySchoolKey(row);
   return counts.get(key)>1?{...row,_recordKey:[key,row.athlete,row.date].join(':')}:row;
 });
 return applyManaged('school_record',legacyPatch('school_record',rows,legacySchoolKey),schoolKey);
}
export function alltimeRankings(){
 return applyManaged('alltime_rank',legacyPatch('alltime_rank',state.official?.rankings||[],alltimeKey),alltimeKey);
}
export function comparisonRankings(){
 const rows=Object.entries(VERIFIED_5000M).flatMap(([name,row])=>[
   {id:name+':school',name,scope:'schoolRankLabel',rank:row.schoolAllTime,asOf:row.asOf,source:VERIFIED_SCHOOL_SOURCE},
   {id:name+':student',name,scope:'studentSeasonLabel',rank:row.studentSeason,asOf:row.asOf,source:VERIFIED_STUDENT_SOURCE}
 ]);
 return applyManaged('comparison_rank',rows,row=>row.id)
   .filter(row=>['schoolRankLabel','studentSeasonLabel'].includes(row.scope));
}
function legacyResultKey(row){
 return 'ob:'+[row.name,row.date,row.meet,row.event,row.time].map(x=>String(x??'').trim()).join('|').slice(0,178);
}
export function personalResults(){
 const rows=new Map([...SCHOOL_RESULTS,...(state.official?.results||[])].map(r=>[r.id,r]));
 const legacy=new Map();
 for(const row of rows.values()){
   if(/^(?:workbook-|selected-|ob2026-)/.test(row.id)){
     const key=legacyResultKey(row);
     legacy.set(key,[...(legacy.get(key)||[]),row.id]);
   }
 }
 for(const edit of state.legacyEdits.filter(x=>x.entity_type==='ob_result')){
   const keys=legacy.get(edit.record_key)||[];
   if(edit.is_deleted){keys.forEach(key=>rows.delete(key));continue;}
   const payload=edit.payload;
   if(!payload||typeof payload!=='object')continue;
   if(!keys.length&&edit.record_key.startsWith('new:')&&payload.link)keys.push('legacy-'+edit.id);
   for(const id of keys){
     const {year,name,grade,meet,event,date,time,rank,status,stage,link}=payload;
     const fields=Object.fromEntries(Object.entries({year,name,grade,meet,event,date,time,rank,status,stage,source:link})
       .filter(([,value])=>value!==undefined));
     rows.set(id,{...rows.get(id),...fields,id,verification:'legacyEdit',updated_at:edit.updated_at});
   }
 }
 return applyManaged('result',[...rows.values()],x=>x.id)
   .filter(x=>x.id&&x.name&&x.event)
   .sort((a,b)=>Number(b.year)-Number(a.year)||String(b.date||'').localeCompare(String(a.date||'')));
}
export function specialtyPbs(name){
 return applyManaged('specialty_pb',state.official?.specialtyPb||[],x=>x.id)
   .filter(x=>!name||nameSearch(x.name)===nameSearch(name));
}
export function sectionRecords(){
 return applyManaged('section_record',state.official?.sectionRecords||[],x=>x.id);
}
export function legHonors(race,leg){
 if(!leg.name||!leg.time||!race.source)return [];
 const sameLeg=row=>row.race===race.race&&Number(row.year)===Number(race.year)&&
   Number(row.leg)===Number(leg.leg)&&nameSearch(row.name)===nameSearch(leg.name)&&row.time===leg.time;
 const record=EKIDEN_RECORD_HONORS.find(sameLeg);
 const japaneseBest=sectionRecords().find(row=>row.scope==='japanese'&&sameLeg(row));
 const honors=[];
 if(Number(leg.rank)===1){
   honors.push({kind:record?.sharedFirst?'legSharedAward':'legAward',source:record?.sharedFirst?record.source:race.source});
 }
 if(record)honors.push(record);
 if(japaneseBest)honors.push({kind:'legJapaneseBest',source:japaneseBest.source});
 return honors;
}
export function athleteEkidenHonors(name){
 const results=[];
 for(const race of ekiden()){
   for(const leg of race.legs){
     if(nameSearch(leg.name)!==nameSearch(name))continue;
     const honors=legHonors(race,leg);
     if(honors.length)results.push({race:race.race,year:race.year,leg:leg.leg,time:leg.time,honors});
   }
 }
 return results;
}
export function parseTime(s){if(!s)return Infinity;const parts=String(s).trim().split(':').map(Number);if(!parts.length||parts.some(n=>!Number.isFinite(n)))return Infinity;return parts.reduce((a,b)=>a*60+b,0);}
export function formatPace(s,km){const v=parseTime(s);if(!Number.isFinite(v))return null;const n=Math.round(v/km);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}/km`;}
export async function checkAdmin(db){
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return {ok:false,user:null};
 const providers=user.app_metadata?.providers||[];
 const hasGoogle=user.app_metadata?.provider==='google'||providers.includes('google');
 if(!hasGoogle)return {ok:false,user};
 const {data:row,error:e}=await db.from('wsd_community_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(!e && row)return {ok:true,user};
 // New site-specific grants are checked by a protected SQL function, not user_metadata.
 const {data:atlasAdmin,error:atlasError}=await db.rpc('wsd_atlas_is_google_admin');
 return {ok:!atlasError && atlasAdmin===true,user};
}
