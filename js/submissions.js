import {SPOLIVE_EKIDEN_ROSTER} from '../data/spolive-ekiden-roster.js';
import {getDb,personalResults,state,loadData,athletes,nameSearch,officialAthleteName} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';

const table='wsd_atlas_result_submissions';
const fields='id,target_key,athlete_name,meet,event,race_date,mark,source_url,status';

function adminLinks(t,E,review){
 return `<div class="admin-actions">
 <a href="${review?'#submissions':'#submissions?review'}">${E(t(review?'submissionTitle':'submissionReview'))}</a>
 <a href="#admin">${E(t('navAdmin'))}</a></div>`;
}

function athletePicker(t,E){
 const names=new Map(athletes().map(({name})=>[nameSearch(name),name]));
 const options=SPOLIVE_EKIDEN_ROSTER.map(name=>names.get(nameSearch(name))??name)
   .sort((a,b)=>officialAthleteName(a).localeCompare(officialAthleteName(b),'ja'))
   .map(name=>`<option value="${E(name)}">${E(officialAthleteName(name))}</option>`).join('');
 return `<label class="field"><span id="submission-athlete-label">${E(t('submissionAthlete'))}</span>
 <select name="athlete_name" aria-labelledby="submission-athlete-label" required>
 <option value="" disabled selected>${E(t('submissionChooseAthlete'))}</option>${options}</select></label>`;
}

export async function renderSubmissions(root,{t,E,sourceLink}){
 const params=new URLSearchParams(location.hash.split('?')[1]);
 const results=personalResults();
 const target=params.has('result')?results.find(row=>row.id===params.get('result')):null;
 const review=params.has('review');
 const say=key=>{root.innerHTML=`<p role="status">${E(t(key))}</p>`;};
 try{
   if(!state.submissionsReady){say('submissionUnavailable');return;}
   const db=await getDb();
   const {data:{user}}=await db.auth.getUser();
   if(!root.isConnected)return;
   const admin=user&&(await db.rpc('wsd_atlas_is_google_admin')).data===true;
   const canSubmit=user?.app_metadata?.provider==='google'||user?.app_metadata?.providers?.includes('google');
   if(!user||(!review&&!canSubmit)){
     root.innerHTML=`${user?`<p>${E(t('submissionGoogleRequired'))}</p>`:''}
     <button class="btn" type="button">${E(t(user?'submissionSwitchGoogle':'submissionLogin'))}</button>
     ${admin?adminLinks(t,E,false):''}
     <p role="status"></p>`;
     const button=root.querySelector('button');
     button.onclick=async()=>{
       button.disabled=true;
       try{
         sessionStorage.setItem('atlas-submission-return',location.hash);
         const options={redirectTo:location.origin+location.pathname+'?atlas-submissions=1'};
         if(user)options.queryParams={prompt:'select_account'};
         const {error}=await db.auth.signInWithOAuth({provider:'google',options});
         if(error)throw error;
       }catch{
         root.querySelector('[role=status]').textContent=t('submissionLoginFailed');
         button.disabled=false;
       }
     };
     return;
   }
   if(review&&!admin){say('submissionReviewDenied');return;}
   if(params.has('result')&&!target){say('submissionTargetMissing');return;}
   const query=db.from(table).select(fields).order('created_at',{ascending:false}).limit(100);
   const {data:rows,error}=await (review?query.eq('status','pending'):query.eq('author_id',user.id));
   if(error)throw error;
   if(!root.isConnected)return;
   const input=(key,name,type,max,value='',readOnly=false)=>`<label class="field">${E(t(key))}<input name="${name}" type="${type}" maxlength="${max}" value="${E(value)}" required ${readOnly?'readonly':''}></label>`;
   root.innerHTML=`
   <div class="section-head"><h2>${E(t(review?'submissionReview':'submissionMine'))}</h2>
   ${admin?adminLinks(t,E,review):''}</div>
   ${!review&&canSubmit?`<form class="card submission-form">
     <h3>${E(t(target?'submissionCorrection':'submissionNew'))}</h3>
     ${target?`<p>${E([target.date,meetLabel(target.meet),recordLabel(target.event),target.time].filter(Boolean).join(' · '))}</p>`:''}
     ${target?input('submissionAthlete','athlete_name','text',120,target.name,true):athletePicker(t,E)}
     ${input('meet','meet','text',240,meetLabel(target?.meet),Boolean(target))}
     ${input('event','event','text',80,recordLabel(target?.event),Boolean(target))}
     ${!target?input('date','race_date','date',10):''}
     ${input('resultMark','mark','text',20)}
     ${input('source','source_url','url',600)}
     <button class="btn" type="submit">${E(t('submissionSend'))}</button>
   </form>`:''}
   <p role="status"></p>
   <div class="submission-list">${rows.map(row=>{
     const original=row.target_key&&results.find(result=>result.id===row.target_key);
     const current=original?`${original.name} · ${meetLabel(original.meet)} · ${recordLabel(original.event)} · ${original.time}`:'';
     return `<article class="card"><h3>${E(original?.name||row.athlete_name)} · ${E(meetLabel(original?.meet||row.meet))}</h3>
     <p>${E(t(row.target_key?'submissionCorrection':'submissionNew'))} · ${E(t('submissionStatus.'+row.status))}</p>
     ${row.target_key?`<p>${E(t('submissionCurrent'))} · ${E(current||t('submissionTargetMissing'))}</p>`:''}
     <p>${E([row.race_date,recordLabel(original?.event||row.event),row.mark].filter(Boolean).join(' · '))} ${sourceLink(row.source_url)}</p>
     ${review?`<button class="btn btn-sm" type="button" data-id="${E(row.id)}" data-decision="published" ${row.target_key&&!original?'disabled':''}>${E(t('submissionPublish'))}</button>
     <button class="btn btn-sm" type="button" data-id="${E(row.id)}" data-decision="rejected">${E(t('submissionReject'))}</button>`:''}</article>`;
   }).join('')||`<p>${E(t('empty'))}</p>`}</div>`;
   const status=root.querySelector('[role=status]');
   const form=root.querySelector('form');
   if(form)form.onsubmit=async event=>{
     event.preventDefault();
     const button=form.querySelector('button');
     button.disabled=true;
     try{
       const values=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
       const {error}=await db.from(table).insert({...values,target_key:target?.id||null});
       if(error)throw error;
       await renderSubmissions(root,{t,E,sourceLink});
       const message=root.querySelector('[role=status]');
       if(message)message.textContent=t('submissionSent');
     }catch{status.textContent=t('submissionFailed');}
     finally{button.disabled=false;}
   };
   root.querySelectorAll('[data-decision]').forEach(button=>{button.onclick=async()=>{
     const row=rows.find(item=>item.id===button.dataset.id);
     const version=state.managed.find(item=>item.kind==='result'&&item.record_key===row.target_key)?.updated_at||null;
     const buttons=button.closest('article').querySelectorAll('button:not(:disabled)');
     buttons.forEach(item=>{item.disabled=true;});
     try{
       const {data,error}=await db.from(table).update({status:button.dataset.decision,expected_version:version})
         .eq('id',row.id).eq('status','pending').select('id').maybeSingle();
       if(error||!data)throw error||new Error('Already reviewed');
       await loadData();
       await renderSubmissions(root,{t,E,sourceLink});
     }catch{status.textContent=t('submissionReviewFailed');}
     finally{buttons.forEach(item=>{item.disabled=false;});}
   };});
 }catch{say('submissionUnavailable');}
}
