import {writeFile,readFile} from 'node:fs/promises';
import {officialFacts} from './archive-facts.mjs';

const output=new URL('../data/official-records.json',import.meta.url);
const source=process.env.SOURCE_RECORDS_URL?.trim();
if(!source){
 console.log('SOURCE_RECORDS_URL is not configured. Using the checked-in historical snapshot.');
 process.exit(0);
}
let parsed;
try {
 if(new URL(source).protocol!=='https:')throw new Error();
 const response=await fetch(source,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error();
 const script=(await response.text()).trim();
 const marker='window.WSD_OFFICIAL_RECORDS=';
 const offset=script.indexOf(marker);
 if(offset<0)throw new Error();
 parsed=JSON.parse(script.slice(offset+marker.length).trim().replace(/;\s*$/,''));
} catch {
 throw new Error('Unable to read and parse the configured historical archive');
}
const snapshot=JSON.parse(await readFile(output,'utf8'));
const refreshed=officialFacts(parsed);
const key=row=>[row.type||'hak',row.year].join(':');
for(const category of ['hakone','otherEkiden','school','rankings']){
 if(refreshed[category].length<snapshot[category].length)throw new Error('Historical coverage decreased: '+category);
}
for(const category of ['hakone','otherEkiden']){
 const prior=new Map(snapshot[category].map(row=>[key(row),row]));
 const seen=new Set();
 refreshed[category]=refreshed[category].map(row=>{
   const old=prior.get(key(row));
   seen.add(key(row));
   const positions=new Map(old?.legs.map(leg=>[leg.leg,leg]));
   return {...old,...row,legs:row.legs.length?row.legs.map(leg=>{
     const previous=positions.get(leg.leg);
     return previous?.name===leg.name&&previous?.time===leg.time?{...previous,...leg}:leg;
   }):old?.legs||[]};
 });
 if([...prior.keys()].some(k=>!seen.has(k)))throw new Error('Historical edition missing: '+category);
}
const bundle={...snapshot,...refreshed,meta:{...snapshot.meta,refreshed:new Date().toISOString().slice(0,10)}};
await writeFile(output,JSON.stringify(bundle)+'\n','utf8');
console.log('Refreshed historical team and ranking data.');
