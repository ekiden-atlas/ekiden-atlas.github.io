import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SUPABASE_SDK} from './config.js';
import {ROSTER,FEATURED} from '../data/roster.js';
import {RECENT_EKIDEN} from '../data/recent-ekiden.js';
let supabasePromise;
export function getDb(){
  if(!supabasePromise)supabasePromise=Promise.race([import(SUPABASE_SDK),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK network timeout')),6000))]).then(m=>m.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})).catch(e=>{supabasePromise=null;throw e;});
  return supabasePromise;
}
export const state={profiles:[],rankings:[],legacyEdits:[],managed:[],managedReady:false,dbOnline:false,official:null,officialOnline:false};
async function safeSelect(db,table,columns='*',limit=1000){try{const {data,error}=await db.from(table).select(columns).limit(limit);if(error)throw error;return {ok:true,rows:data||[]};}catch{return {ok:false,rows:[]};}}
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
      safeSelect(db,'wsd_athlete_basic_profiles','athlete_name,birthday,birthplace,hometown,high_school,height_cm,source_url,updated_at'),
      safeSelect(db,'wsd_athlete_world_rankings','id,athlete_name,event_name,world_rank,asia_rank,ranking_points,ranking_date,source_url,rank_basis',500),
      safeSelect(db,'wsd_open_archive_edits','id,entity_type,record_key,payload,is_deleted,updated_at',1000),
      safeSelect(db,'wsd_public_content','id,kind,record_key,payload,source_url,is_deleted,created_at,updated_at',1000)
    ]);
    Object.assign(state,{profiles:a.rows,rankings:b.rows,legacyEdits:c.rows,managed:d.rows,managedReady:d.ok,dbOnline:a.ok||b.ok||c.ok});
  }catch{Object.assign(state,{dbOnline:false,profiles:[],rankings:[],legacyEdits:[],managed:[],managedReady:false});}
  state.official=await officialTask;
  return state;
}
export function byName(name){return state.profiles.find(x=>x.athlete_name===name)||{};}
function applyManaged(kind,records,keyFn){
  const items=new Map(records.map(x=>[keyFn(x),x]));
  state.managed.filter(x=>x.kind===kind).forEach(x=>{
    if(x.is_deleted){items.delete(x.record_key);return;}
    if(x.payload && typeof x.payload==='object' && !Array.isArray(x.payload)){
      items.set(x.record_key,{...(items.get(x.record_key)||{}),...x.payload,_source:x.source_url,_updatedAt:x.updated_at,_managed:true});
    }
  });return [...items.values()];
}
export function athletes(){
 let rows=applyManaged('athlete',ROSTER.map(x=>({...x})),x=>x.name);
 const byKey=new Map(rows.map(x=>[x.name,x]));
 state.managed.filter(x=>x.kind==='pb').forEach(r=>{
  const x=r.payload||{};const name=x.name,field=x.field;
  if(!name||!['pb1500','pb5000','pb10000','pbHalf'].includes(field)||!byKey.has(name))return;
  const old=byKey.get(name);old[field]=r.is_deleted?'':String(x.time||'');
  old._pbSource=r.source_url;old._pbUpdated=r.updated_at;
 });return [...byKey.values()];
}
export function athlete(name){return athletes().find(x=>x.name===name)||null;}
export function getFeatured(){return FEATURED.filter(x=>athletes().some(a=>a.name===x));}
export function worldRankings(name){return applyManaged('world_rank',state.rankings,x=>x.athlete_name+':'+x.event_name).filter(x=>!name||x.athlete_name===name).sort((a,b)=>(a.world_rank??999999)-(b.world_rank??999999));}
function legacyPatch(kind,list,keyFn){
 const byKey=new Map(list.map(x=>[keyFn(x),{...x}]));
 state.legacyEdits.filter(x=>x.entity_type===kind).forEach(e=>{
   if(e.is_deleted){byKey.delete(e.record_key);return;}
   if(e.payload&&typeof e.payload==='object'){
     if(byKey.has(e.record_key))byKey.set(e.record_key,{...byKey.get(e.record_key),...e.payload});
     else if(e.record_key.startsWith('new:'))byKey.set(e.record_key,{...e.payload});
   }
 });return [...byKey.values()];
}
export function ekiden(){
 const old=state.official?
 [...(state.official.hakone||[]).map(x=>({...x,race:'hak'})),...(state.official.otherEkiden||[]).map(x=>({...x,race:x.type}))]:RECENT_EKIDEN;
 let rows=legacyPatch('ekiden',old,x=>'race:'+x.race+':'+x.year);
 rows=applyManaged('ekiden',rows,x=>'race:'+x.race+':'+x.year);
 return rows.filter(x=>x?.year && ['hak','izu','zen'].includes(x.race)).map(x=>({...x,legs:typeof x.legs_text==='string'?parseLegs(x.legs_text):x.legs||[]})).sort((a,b)=>b.year-a.year||['hak','izu','zen'].indexOf(a.race)-['hak','izu','zen'].indexOf(b.race));
}
function parseLegs(s){return s.split('\n').map(line=>line.split(/[｜|]/).map(x=>x.trim())).filter(x=>x.length>=4).map(([leg,name,km,time,rank])=>({leg:Number(leg),name,km:km||null,time,rank:rank?Number(rank):null}));}
export function schoolRecords(){const old=state.official?.school||[];return applyManaged('school_record',legacyPatch('school_record',old,x=>'school:'+x.gender+':'+x.event),x=>'school:'+x.gender+':'+x.event);}
export function alltimeRankings(){const old=state.official?.rankings||[];return applyManaged('alltime_rank',legacyPatch('alltime_rank',old,x=>'rank:'+x.gender+':'+x.event+':'+x.rank+':'+x.athlete),x=>'rank:'+x.gender+':'+x.event+':'+x.rank+':'+x.athlete);}
export function stories(){return applyManaged('story',FEATURED.map((name,index)=>({name,index})),x=>x.name).sort((a,b)=>(a.index??100)-(b.index??100));}
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
