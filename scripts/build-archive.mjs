import {writeFile,readFile} from 'node:fs/promises';
const output=new URL('../data/official-records.json',import.meta.url);
const source=process.env.SOURCE_RECORDS_URL?.trim();
if(!source){
 console.log('SOURCE_RECORDS_URL is not configured; retaining the curated local snapshot.');
 process.exit(0);
}
if(!source.startsWith('https://'))throw new Error('Historical source URL must use HTTPS');
const response=await fetch(source,{signal:AbortSignal.timeout(25000)});
if(!response.ok)throw new Error('Historical source HTTP status: '+response.status);
const script=(await response.text()).trim();
const marker='window.WSD_OFFICIAL_RECORDS=';
if(!script.startsWith('/*') && !script.startsWith(marker))throw new Error('Unexpected source format');
const offset=script.indexOf(marker);
if(offset<0)throw new Error('Structured records marker not found');
const raw=script.slice(offset+marker.length).trim().replace(/;\s*$/,'');
const parsed=JSON.parse(raw);
for(const key of ['hakone','otherEkiden','school','rankings']){
 if(!Array.isArray(parsed[key]))throw new Error('Missing archive category: '+key);
}
if(parsed.hakone.length<100 || parsed.rankings.length<400)throw new Error('Historical data unexpectedly incomplete; aborting deploy');
// Allowlist only structured factual fields. No names, paths or URLs from source repository metadata.
function pick(x,fields){return Object.fromEntries(fields.filter(k=>Object.hasOwn(x,k)).map(k=>[k,x[k]]));}
function link(x){return typeof x==='string'&&/^https:\/\/(?:waseda-ac\.jp|www\.waseda\.jp|www\.hakone-ekiden\.jp)\//.test(x)?x:null;}
const leg=(x)=>pick(x,['leg','name','time','rank','km']);
function race(x){const v=pick(x,['year','type','edition','rank','total','out','back','out_rank','back_rank','status','reason','note','source_format_note']);v.source=link(x.source);v.legs=Array.isArray(x.legs)?x.legs.map(leg):[];return v;}
function score(x){const v=pick(x,['gender','event','performance','athlete','date','rank','year']);if(link(x.source))v.source=link(x.source);return v;}
const bundle={
 hakone:parsed.hakone.map(race),
 otherEkiden:parsed.otherEkiden.map(race),
 school:parsed.school.map(score),
 rankings:parsed.rankings.map(score),
 meta:{fetched:new Date().toISOString().slice(0,10),completeHakone:true}
};
const out=JSON.stringify(bundle);
if(/THIS-PRIVATE-USERNAME/i.test(out))throw new Error('Potential original account leak in generated public archive');
await writeFile(output,out+'\n','utf8');
console.log('Generated historical records:', bundle.hakone.length,'Hakone editions,',bundle.school.length,'school records,',bundle.rankings.length,'rank entries');
