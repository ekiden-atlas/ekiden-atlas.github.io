import {submissionErrorKey} from './submission-errors.js';
import {submissionBadgeMarkup,watchSubmissionBadge} from './submission-badge.js';
import {renderOtherSubmissions} from './other-submissions.js';
import {OFFICIAL_LONG_DISTANCE_ROSTER} from '../data/official-club-roster.js';
import {getDb,personalResults,state,loadData,athletes,nameSearch,officialAthleteName} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';

const table='wsd_atlas_result_submissions';
const fields='id,target_key,athlete_name,meet,event,race_date,mark,source_url,status';

function adminLinks(t,E,review,admin){
 return `<div class="admin-actions">
 <a href="${review?'#submissions':'#submissions?review'}">${E(t(review?'submissionTitle':'submissionReview'))}${review?'':submissionBadgeMarkup}</a>
 ${admin?`<a href="#admin">${E(t('navAdmin'))}</a>`:''}</div>`;
}

function athletePicker(t,E){
 const names=new Map(athletes().map(({name})=>[nameSearch(name),name]));
 const options=OFFICIAL_LONG_DISTANCE_ROSTER.map(({name})=>names.get(nameSearch(name))??name)
   .sort((a,b)=>officialAthleteName(a).localeCompare(officialAthleteName(b),'ja'))
   .map(name=>`<option value="${E(name)}">${E(officialAthleteName(name))}</option>`).join('');
 return `<label class="field"><span id="submission-athlete-label">${E(t('submissionAthlete'))}</span>
 <select name="athlete_name" aria-labelledby="submission-athlete-label" required>
 <option value="" disabled selected>${E(t('submissionChooseAthlete'))}</option>${options}</select></label>`;
}

export async function renderSubmissions(root,{t,E,sourceLink,messageKey}){
 const params=new URLSearchParams(location.hash.split('?')[1]);
 const results=personalResults();
 const target=params.has('result')?results.find(row=>row.id===params.get('result')):null;
 const history=params.has('history');
 const review=history||params.has('review');
 const from=params.get('from')||'';
 const returnLink=/^#(?:home|athletes|results|schedule|guide|archive|fans)(?:\?|$)/.test(from)
   ?`<p><a class="btn" href="${E(from)}">${E(t('submissionReturn'))}</a></p>`:'';
 const successLink=messageKey==='submissionSent'?returnLink:'';
 const say=key=>{root.innerHTML=`<p role="status">${E(t(key))}</p>`;};
 try{
   if(!state.submissionsReady){say('submissionUnavailable');return;}
   const db=await getDb();
   const {data:{user}}=await db.auth.getUser();
   if(!root.isConnected)return;
   const admin=user&&(await db.rpc('wsd_atlas_is_google_admin')).data===true;
   const canReview=admin||Boolean(user&&(await db.rpc('wsd_atlas_can_review')).data===true);
   const canSubmit=user?.app_metadata?.provider==='google'||user?.app_metadata?.providers?.includes('google');
   if(!user||(!review&&!canSubmit)){
     root.innerHTML=`${user?`<p>${E(t('submissionGoogleRequired'))}</p>`:''}
     <button class="btn" type="button">${E(t(user?'submissionSwitchGoogle':'submissionLogin'))}</button>
     ${canReview?adminLinks(t,E,false,admin):''}
     <p role="status"></p>`;
     watchSubmissionBadge(root,db,t);
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
   if((history&&!admin)||(review&&!canReview)){say('submissionReviewDenied');return;}
   if(params.has('result')&&!target){say('submissionTargetMissing');return;}
   const [edits,details,attachments,sourceOption]=await Promise.all([
     db.rpc('wsd_atlas_submitter_edits_ready'),
     db.rpc('wsd_atlas_submission_details_ready'),
     db.rpc('wsd_atlas_attachment_submissions_ready'),
     db.rpc('wsd_atlas_optional_submission_source_ready')
   ]);
   const selfEdit=edits.data===true;
   const detailsReady=details.data===true;
   const upgraded=attachments.data===true;
   const optionalSource=upgraded&&sourceOption.data===true;
   const selectedFields=fields+(selfEdit?',revision':'')+(detailsReady?',finish_rank,race_division':'');
   const query=()=>db.from(table).select(selectedFields).order('created_at',{ascending:false});
   let rows;
   if(review){
     const pending=new Map();
     const pageSize=100;
     for(let offset=0;;offset+=pageSize){
       const queue=query();
       const {data,error}=await (history?queue.in('status',['published','rejected']):queue.eq('status','pending')).order('id').range(offset,offset+pageSize-1);
       if(error)throw error;
       if(!root.isConnected)return;
       for(const row of data)pending.set(row.id,row);
       if(data.length<pageSize)break;
     }
     rows=[...pending.values()];
   }else{
     const {data,error}=await query().eq('author_id',user.id).limit(100);
     if(error)throw error;
     rows=data;
   }
   if(!root.isConnected)return;
   const resultsById=new Map(results.map(row=>[row.id,row]));
   const input=(key,name,type,max,value='',readOnly=false,required=true)=>`<label class="field">${E(t(key))}<input name="${name}" type="${type}" maxlength="${max}" value="${E(value??'')}" ${required?'required':''} ${readOnly?'readonly':''}></label>`;
   const divisions=['m1','m2','m3','h1','h2','h3','u1','u2','u3','u4'];
   const divisionLabels=t('submissionDivisionOptions').split('|');
   const divisionLabel=value=>divisionLabels[divisions.indexOf(value)];
   const detailFields=(rank,division)=>detailsReady?`
     <label class="field">${E(t('submissionOptionalRank'))}<input name="finish_rank" type="number" min="1" max="2147483647" step="1" value="${E(rank??'')}"></label>
     <label class="field">${E(t('resultStatus'))}<select name="race_division">
     <option value="">${E(t('notRecorded'))}</option>
     ${divisions.map(value=>`<option value="${value}" ${value===division?'selected':''}>${E(divisionLabel(value))}</option>`).join('')}
     </select></label>`:'';
   function formValues(form){
     const values=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
     if(detailsReady&&'finish_rank' in values){
       values.finish_rank=values.finish_rank?Number(values.finish_rank):null;
       values.race_division=values.race_division||null;
     }
     if(optionalSource&&'source_url' in values)values.source_url=values.source_url||null;
     return values;
   }
   const renderRow=row=>{
     const original=row.target_key&&resultsById.get(row.target_key);
     const current=original?`${original.name} · ${meetLabel(original.meet)} · ${recordLabel(original.event)} · ${original.time}`:'';
     const canEdit=selfEdit&&!review&&canSubmit&&row.status==='pending';
     return `<article class="card"><h3>${E(original?.name||row.athlete_name)} · ${E(meetLabel(original?.meet||row.meet))}</h3>
     <p>${E(t(row.target_key?'submissionCorrection':'submissionNew'))} · ${E(t('submissionStatus.'+row.status))}</p>
     ${review&&!admin&&row.target_key?`<p>${E(t('submissionCorrectionAdminOnly'))}</p>`:''}
     ${row.target_key?`<p>${E(t('submissionCurrent'))} · ${E(current||t('submissionTargetMissing'))}</p>`:''}
     <p>${E([row.race_date,recordLabel(original?.event||row.event),row.mark,row.finish_rank?`${t('rank')} ${row.finish_rank}`:'',divisionLabel(row.race_division)].filter(Boolean).join(' · '))} ${sourceLink(row.source_url)}</p>
     ${(review&&!history)||canEdit?`<form data-review-form data-id="${E(row.id)}">
     ${upgraded||canEdit?`<div class="submission-edit">
       ${!row.target_key?[
         input('submissionAthlete','athlete_name','text',120,row.athlete_name),
         input('meet','meet','text',240,row.meet),
         input('event','event','text',80,row.event),
         input('date','race_date','date',10,row.race_date)
       ].join(''):''}
       ${input('resultMark','mark','text',20,row.mark)}
       ${detailFields(row.finish_rank,row.race_division)}
       ${input(optionalSource&&!review?'submissionOptionalSource':'source','source_url','url',600,row.source_url,false,review||!optionalSource)}
     </div>`:''}
     ${canEdit?`<button class="btn btn-sm" type="submit" value="pending">${E(t('submissionSaveEdit'))}</button>
     <button class="btn btn-sm" type="submit" value="withdrawn" formnovalidate>${E(t('submissionWithdraw'))}</button>`:`
     <button class="btn btn-sm" type="submit" value="published" ${row.target_key&&(!original||!admin)?'disabled':''}>${E(t(upgraded?'submissionReviewSubmit':'submissionPublish'))}</button>
     <button class="btn btn-sm" type="submit" value="rejected" formnovalidate>${E(t('submissionReject'))}</button>`}</form>`:''}</article>`;
   };
   let listing;
   if(review){
     const groups=new Map();
     for(const row of rows){
       const name=officialAthleteName(resultsById.get(row.target_key)?.name||row.athlete_name);
       const key=nameSearch(name);
       if(!groups.has(key))groups.set(key,{name,rows:[]});
       groups.get(key).rows.push(row);
     }
     listing=[...groups.values()].map(({name,rows:entries})=>`<section class="submission-list">
     <h3 class="submission-group-title">${E(name)} <span class="tag">${E(t(history?'submissionAthleteReviewed':'submissionAthletePending',{count:entries.length}))}</span></h3>
     ${entries.map(renderRow).join('')}</section>`).join('');
   }else listing=rows.map(renderRow).join('');
   root.innerHTML=`
   <div class="section-head"><h2>${E(t(history?'submissionReviewHistory':review?'submissionReview':'submissionMine'))}</h2>
   ${canReview?adminLinks(t,E,review,admin):''}</div>
   ${review&&admin?`<p><a class="btn" href="${history?'#submissions?review':'#submissions?review&history'}">${E(t(history?'submissionReview':'submissionReviewHistory'))}</a></p>`:''}
   ${!review&&admin?`<div class="card">
     <h3>${E(t(target?'adminDirectCorrection':'adminDirectResult'))}</h3>
     <p>${E(t('adminDirectResultHelp'))}</p>
     <a class="btn btn-primary" href="#admin?result=${encodeURIComponent(target?.id||'')}">${E(t(target?'adminDirectCorrection':'adminDirectResult'))}</a>
   </div>`:''}
   ${!review&&canSubmit&&!admin?`<form class="card submission-form">
     <h3>${E(t(target?'submissionCorrection':'submissionNew'))}</h3>
     ${target?`<p>${E([target.date,meetLabel(target.meet),recordLabel(target.event),target.time].filter(Boolean).join(' · '))}</p>`:''}
     ${target?input('submissionAthlete','athlete_name','text',120,target.name,true):athletePicker(t,E)}
     ${input('meet','meet','text',240,meetLabel(target?.meet),Boolean(target))}
     ${input('event','event','text',80,recordLabel(target?.event),Boolean(target))}
     ${!target?input('date','race_date','date',10):''}
     ${input('resultMark','mark','text',20,target?.time)}
     ${detailFields()}
     ${input(optionalSource?'submissionOptionalSource':'source','source_url','url',600,'',false,!optionalSource)}
     <button class="btn" type="submit">${E(t('submissionSend'))}</button>
   </form>`:''}
   <p role="status">${messageKey?E(t(messageKey)):''}</p>
   <div data-submission-return>${successLink}</div>
   <div class="submission-list">${listing||`<p>${E(t('empty'))}</p>`}</div>
   ${upgraded&&!target?'<section data-other-submissions></section>':''}`;
   watchSubmissionBadge(root,db,t);
   const status=root.querySelector('[role=status]');
   const form=root.querySelector('.submission-form');
   if(form)form.onsubmit=async event=>{
     event.preventDefault();
     const button=form.querySelector('button');
     if(button.disabled)return;
     button.disabled=true;
     status.textContent=t('submissionSending');
     try{
       const values=formValues(form);
       const {error}=await db.from(table).insert({...values,target_key:target?.id||null});
       if(error)throw error;
     }catch(error){
       status.textContent=t(submissionErrorKey(error));
       button.disabled=false;
       return;
     }
     form.reset();
     status.textContent=t('submissionSent');
     root.querySelector('[data-submission-return]').innerHTML=returnLink;
     await renderSubmissions(root,{t,E,sourceLink,messageKey:'submissionSent'});
     button.disabled=false;
   };
   root.querySelectorAll('[data-review-form]').forEach(form=>{form.onsubmit=async event=>{
     event.preventDefault();
     const decision=event.submitter?.value;
     if(review&&decision==='published'&&!admin&&rows.find(row=>row.id===form.dataset.id)?.target_key)return;
     if(!(review?['published','rejected']:['pending','withdrawn']).includes(decision))return;
     if(decision==='withdrawn'&&!confirm(t('submissionConfirmWithdraw')))return;
     const row=rows.find(item=>item.id===form.dataset.id);
     const version=state.managed.find(item=>item.kind==='result'&&item.record_key===row.target_key)?.updated_at||null;
     const buttons=form.querySelectorAll('button:not(:disabled)');
     buttons.forEach(item=>{item.disabled=true;});
     try{
       const changes=(upgraded&&decision==='published')||decision==='pending'
         ?formValues(form):{};
       const update=db.from(table).update({...changes,status:decision,...(review?{expected_version:version}:{})})
         .eq('id',row.id).eq('status','pending');
       if(selfEdit)update.eq('revision',row.revision);
       const {data,error}=await update.select('id').maybeSingle();
       if(error||!data)throw error||{code:'40001'};
       await loadData();
       await renderSubmissions(root,{t,E,sourceLink});
     }catch(error){status.textContent=t(submissionErrorKey(error,'submissionReviewFailed'));}
     finally{buttons.forEach(item=>{item.disabled=false;});}
   };});
   const other=root.querySelector('[data-other-submissions]');
   if(other)await renderOtherSubmissions(other,{db,user,review,history,admin,selfEdit,t,E,returnLink}).catch(()=>{
     other.textContent=t('submissionUnavailable');
   });
 }catch{if(!messageKey)say('submissionUnavailable');}
}
