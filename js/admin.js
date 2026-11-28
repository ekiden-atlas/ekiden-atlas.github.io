import {submissionBadgeMarkup,watchSubmissionBadge} from './submission-badge.js';
import {OFFICIAL_LONG_DISTANCE_ROSTER} from '../data/official-club-roster.js';
import {KINDS,KIND_LABELS} from './admin-content-types.js';
import {bindFeedbackInbox} from './feedback.js';
import {raceFields,bindRelayLegs,racePayload} from './admin-result-forms.js';
import {meetLabel,recordLabel} from './record-names.js';
import {getDb,checkAdmin,state,loadData,athletes,ekiden,schoolRecords,alltimeRankings,personalResults,specialtyPbs,sectionRecords,worldRankings,worldRankKey,comparisonRankings,ekidenKey,alltimeKey,schoolKey} from './data.js';
let adminRoot=null,context=null,adminDb=null;
let tab='managed',current=null,prefill=null,submission=null,draftKind='result';
const longDistanceSources=new Set(OFFICIAL_LONG_DISTANCE_ROSTER.map(member=>member.source_url));
const fieldForm=kind=>['athlete','result','ekiden'].includes(kind);
const htmlspecialchars=x=>context.E(x);
const status=m=>{const x=adminRoot?.querySelector('#admin-status');if(x)x.textContent=m;};
export function detachAdmin(){adminRoot=null;context=null;adminDb=null;current=null;prefill=null;submission=null;}
export async function renderAdminPage(root,ctx){adminRoot=root;context=ctx;
 const {t,E}=ctx;
 try{
   const db=await getDb();
   const result=await checkAdmin(db);
   if(adminRoot!==root)return;
   if(!result.ok){
     root.innerHTML=`<p role="status">${E(t('adminNoAccess'))}</p>
     <a class="btn" href="#submissions">${E(t('submissionTitle'))}</a>`;
     return;
   }
   const params=new URLSearchParams(location.hash.split('?')[1]);
   const from=params.get('from');
   const returnToProfile=from?.startsWith('#athletes?')&&new URLSearchParams(from.slice(10)).has('name')?from:'';
   const submissionId=params.get('submission');
   const destination=params.get('kind');
   if(submissionId&&KINDS.includes(destination)&&/^[0-9a-f-]{36}$/i.test(submissionId)){
     const {data,error}=await db.from('wsd_atlas_other_submissions').select('title,body')
       .eq('id',submissionId).eq('status','pending').maybeSingle();
     if(adminRoot!==root)return;
     if(error||!data){
       root.innerHTML=`<p role="status">${E(t('submissionTargetMissing'))}</p><a href="#submissions?review">${E(t('submissionReview'))}</a>`;
       return;
     }
     submission=data;
     draftKind=destination;
     tab='managed';
   }
   if(params.has('result')){
     const id=params.get('result');
     if(id){
       prefill=sourceChoices('result').find(row=>row.key===id);
       if(!prefill){
         root.innerHTML=`<p role="status">${E(t('submissionTargetMissing'))}</p><a href="#admin?result">${E(t('adminDirectResult'))}</a>`;
         return;
       }
     }
     draftKind='result';
     tab='managed';
   }
   if(returnToProfile&&prefill){
     const {data:allowed,error}=await db.rpc('wsd_atlas_is_google_admin');
     if(adminRoot!==root)return;
     if(error||allowed!==true){
       root.textContent=t('adminNoAccess');
       return;
     }
   }
   if(prefill&&params.has('result')&&state.managed.some(row=>row.kind==='result'&&row.record_key===prefill.key)){
     current={kind:'result',record_key:prefill.key};
     prefill=null;
   }
   adminDb=db;
   root.innerHTML=`<h1>${E(t('adminTitle'))}</h1><p>${E(t('adminDesc'))}</p>
   <div class="admin-actions">
   ${returnToProfile?`<a class="btn" href="${E(returnToProfile)}">${E(t('profileResultBack'))}</a>`: ''}
   ${state.submissionsReady?`<a class="btn" href="#submissions?review">${E(t('submissionReview'))}${submissionBadgeMarkup}</a>`:''}
   <a class="btn" href="#fans?review">${E(t('fanReview'))}</a>
   <button class="btn" type="button" id="google-logout">${E(t('logout'))}</button></div>
   ${submission?`<details class="card" open><summary>${E(t('otherSubmission'))} · ${E(submission.title)}</summary>
   <p style="white-space:pre-wrap">${E(submission.body)}</p>
   <p>${E(t('submissionEditorHelp'))}</p><a href="#submissions?review">${E(t('submissionReview'))}</a></details>`:''}
   <p id="admin-status" role="status">${E(t('adminYes'))}</p>
   <details class="ekiden-help" id="feedback-inbox">
     <summary>${E(t('feedbackInbox'))}</summary>
     <p role="status"></p><div data-feedback-items></div>
     <button class="btn btn-sm" type="button" hidden>${E(t('feedbackMore'))}</button>
   </details><div id="admin-work"></div>`;
   watchSubmissionBadge(root,db,t);
   bindFeedbackInbox(root.querySelector('#feedback-inbox'),db,E);
   root.querySelector('#google-logout').addEventListener('click',async()=>{
     const {error}=await db.auth.signOut({scope:'local'});
     if(error){status(t('adminFailed'));return;}
     if(adminRoot===root)location.hash='#submissions';
   });
   showWork();
   if(params.get('action')==='delete')root.querySelector('#admin-delete:not(:disabled)')?.focus();
   else if(returnToProfile)root.querySelector('#admin-content-form input')?.focus();
 }catch{
   if(adminRoot===root)root.textContent=t('adminFailed');
 }
}
function tabsMarkup(){const {t,E}=context;const items=[['managed','adminTabManaged'],['rankings','adminTabRankings'],['audit','adminTabAudit']];return `<div class="admin-tabs" role="tablist">${items.map(([id,key])=>`<button role="tab" type="button" data-tab="${id}" aria-selected="${String(tab===id)}" class="${tab===id?'active':''}">${E(t(key))}</button>`).join('')}</div>`;}
function showWork(){if(!adminRoot)return;const {t,E}=context;const root=adminRoot.querySelector('#admin-work');root.innerHTML=`<div class="notice">${E(t('adminSyncNotice'))}</div>${tabsMarkup()}<div id="admin-panel"></div>`;root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.tab;showWork();}));if(tab==='managed')managedPane();if(tab==='rankings')rankPane();if(tab==='audit')auditPane();}
function selectedRecord(){return state.managed.find(x=>x.kind===current?.kind&&x.record_key===current?.record_key);}
function sourceChoices(kind){
 const entry=(key,label,payload,source='')=>({key,label,payload,source:source||''});
 const content=r=>Object.fromEntries(Object.entries(r).filter(([key])=>!key.startsWith('_')));
 if(kind==='athlete')return athletes().map(a=>{
   const {name,grade,gender,birthday,birthplace,hometown,middle_school,high_school,home_prefecture,height_cm,weight_kg,mainEvent,graduation_year,graduation_source,officialGrade,block,clubSource}=a;
   return entry(name,name,{name,grade,gender,birthday,birthplace,hometown,middle_school,high_school,home_prefecture,height_cm,weight_kg,mainEvent,graduation_year,graduation_source,officialGrade,block,clubSource},a.source_url||clubSource);
 });
 if(kind==='pb')return athletes().flatMap(a=>[['pb1500','1500m'],['pb5000','5000m'],['pb10000','10000m'],['pbHalf','Half Marathon']]
   .map(([field,label])=>entry(a.name+':'+label,a.name+' · '+recordLabel(label),{name:a.name,field,time:a[field]||''},a._pbSources?.[field])));
 if(kind==='ekiden')return ekiden().map(r=>entry(ekidenKey(r),r.year+' · '+(r.meet||context.t({hak:'introHak',izu:'introIzu',zen:'introZen',other:'otherEkiden'}[r.race])),content(r),r.source));
 if(kind==='school_record')return schoolRecords().map(r=>entry(schoolKey(r),recordLabel(r.event),content(r),r.source));
 if(kind==='alltime_rank')return alltimeRankings().map(r=>entry(alltimeKey(r),recordLabel(r.event)+' · '+r.rank+' · '+r.athlete,content(r),r.source));
 if(kind==='world_rank')return worldRankings().map(r=>entry(worldRankKey(r),[r.athlete_name,recordLabel(r.event_name),r.ranking_date].join(' · '),content(r),r.source_url));
 if(kind==='comparison_rank')return comparisonRankings().map(r=>entry(r.id,r.name+' · '+context.t(r.scope),content(r),r.source));
 if(kind==='result')return personalResults().map(r=>entry(r.id,[r.date||r.year,r.name,meetLabel(r.meet),recordLabel(r.event),r.time].join(' · '),content(r),r.source));
 if(kind==='specialty_pb')return specialtyPbs().map(r=>entry(r.id,r.name+' · '+recordLabel(r.event),content(r),r.source));
 if(kind==='section_record')return sectionRecords().map(r=>entry(r.id,[r.race,r.leg,r.name,r.year].join(' · '),content(r),r.source));
 return [];
}

function managedPane(){
 const {t,E}=context;
 const area=adminRoot.querySelector('#admin-panel');
 const deployed=state.managedReady;
 const chosen=selectedRecord();
 const kind=chosen?.kind||draftKind;
 const structured=fieldForm(kind);
 const templates=sourceChoices(kind);
 const base=structured?templates.find(row=>row.key===chosen?.record_key)||prefill:null;
 const value=chosen||{kind,record_key:prefill?.key||'',payload:{},source_url:prefill?.source||'',is_deleted:false};
 const payload={...value.payload,...base?.payload};
 const officialProfiles=kind==='athlete'?templates.filter(row=>longDistanceSources.has(row.payload.clubSource)):[];
 const savedRows=state.managed.filter(row=>row.kind===kind);
area.innerHTML=`${!deployed?`<div class="notice"><strong>${E(t('adminMigration'))}</strong><p>${E(t('adminMigrationHelp'))}</p></div>`:''}<div class="split"><div><div class="card-top"><h3>${E(t('adminEditedRecords'))}</h3><button id="admin-new" class="btn btn-sm" type="button" ${deployed?'':'disabled'}>${E(t('adminCreate'))}</button></div><div class="admin-list">${savedRows.map(x=>`<button type="button" data-edit-kind="${E(x.kind)}" data-edit-key="${E(x.record_key)}">${E(t(KIND_LABELS[x.kind]||'adminSelectType'))} / ${E(x.record_key)} ${x.is_deleted?'· '+E(t('adminDeleted')):''}</button>`).join('')||`<p class="empty">${E(t('empty'))}</p>`}</div>${officialProfiles.length?`<h3>${E(t('adminOfficialRoster'))} · ${officialProfiles.length}</h3>
 <div class="admin-list">${officialProfiles.map(profile=>`<button type="button" data-profile-key="${E(profile.key)}">${E(profile.label)} · ${E(profile.payload.block)}</button>`).join('')}</div>`:''}</div><div><form id="admin-content-form" class="admin-form"><label class="field">${E(t('adminSelectType'))}<select name="kind" required ${chosen?'disabled':''}>${KINDS.map(k=>`<option value="${k}" ${value.kind===k?'selected':''}>${E(t(KIND_LABELS[k]||'adminSelectType'))}</option>`).join('')}</select></label>${!chosen?`<label class="field">${E(t('adminUseBase'))}<select id="admin-base-chooser"><option value="">${E(t('adminPickBase'))}</option>${templates.map((r,i)=>`<option value="${i}" ${r.key===prefill?.key?'selected':''}>${E(r.label)}</option>`).join('')}</select></label>`:''}${structured?'':`<label class="field">${E(t('adminKey'))}<input name="record_key" value="${E(value.record_key)}" required minlength="2" maxlength="180" ${chosen?'readonly':''}></label>`}<label class="field">${E(t(structured?'adminOfficialSource':'adminSource'))}<input name="source_url" type="url" required pattern="${kind==='result'?'https?':'https'}://.*" value="${E(value.source_url)}" placeholder="https://…"></label>${structured?raceFields(kind,payload,context):`<label class="field">${E(t('adminPayload'))}<textarea name="payload" required spellcheck="false">${E(JSON.stringify(value.payload,null,2))}</textarea></label>`}<div class="admin-actions"><button class="btn btn-primary" type="submit" ${deployed?'':'disabled'}>${E(t(kind==='result'?'adminPublishResult':'adminSave'))}</button><button class="btn btn-danger" type="button" id="admin-delete" ${deployed&&(chosen||prefill?.source)&&!value.is_deleted?'':'disabled'}>${E(t('adminDelete'))}</button><button class="btn" type="button" id="admin-restore" ${deployed&&chosen&&value.is_deleted?'':'disabled'}>${E(t('adminRestore'))}</button><button class="btn" type="button" id="admin-cancel">${E(t('adminCancel'))}</button></div><p id="admin-form-msg" role="status"></p></form></div></div>`;
area.querySelector('#admin-new')?.addEventListener('click',()=>{current=null;prefill=null;managedPane();});
area.querySelector('select[name=kind]')?.addEventListener('change',e=>{draftKind=e.target.value;current=null;prefill=null;managedPane();});
area.querySelector('#admin-base-chooser')?.addEventListener('change',e=>{const item=e.target.value===''?null:templates[Number(e.target.value)];
if(structured){prefill=item;managedPane();return;}
if(!item)return;const form=area.querySelector('#admin-content-form');form.querySelector('[name=record_key]').value=item.key;form.querySelector('[name=payload]').value=JSON.stringify(item.payload,null,2);form.querySelector('[name=source_url]').value=item.source;});
area.querySelectorAll('[data-profile-key]').forEach(button=>button.onclick=()=>{
 const profile=officialProfiles.find(row=>row.key===button.dataset.profileKey);
 const saved=savedRows.find(row=>row.record_key===profile.key);
 current=saved?{kind,record_key:profile.key}:null;
 prefill=saved?null:profile;
 managedPane();
 area.querySelector('form input').focus();
});
area.querySelectorAll('[data-edit-kind]').forEach(btn=>btn.addEventListener('click',()=>{prefill=null;current={kind:btn.dataset.editKind,record_key:btn.dataset.editKey};managedPane();}));
area.querySelector('#admin-cancel')?.addEventListener('click',()=>{current=null;prefill=null;managedPane();});
const form=area.querySelector('#admin-content-form');
if(kind==='ekiden')bindRelayLegs(form);
form.addEventListener('submit',event=>saveContent(event,payload));
area.querySelector('#admin-delete')?.addEventListener('click',()=>setDeleted(true));
area.querySelector('#admin-restore')?.addEventListener('click',()=>setDeleted(false));
}
async function saveContent(event,base){
 event.preventDefault();
 const {t}=context;
 if(!state.managedReady||!adminDb)return;
 const form=event.currentTarget;
 const fields=new FormData(form);
 const kind=current?.kind||String(fields.get('kind'));
 const source_url=String(fields.get('source_url')).trim();
 if(!(kind==='result'?/^https?:\/\/[^\s]+$/i:/^https:\/\/[^\s]+$/i).test(source_url)){status(t(kind==='result'?'adminInvalidResultUrl':'adminInvalidUrl'));return;}
 let payload;
 if(fieldForm(kind)){
   payload=racePayload(kind,form,base);
   if(!payload){status(t(kind==='athlete'?'adminFailed':'adminRaceInvalid'));return;}
 }else{
   try{payload=JSON.parse(fields.get('payload'));}
   catch{status(t('adminInvalidJson'));return;}
   if(!payload||Array.isArray(payload)||typeof payload!=='object'){status(t('adminInvalidJson'));return;}
 }
 let record_key=current?.record_key||(fieldForm(kind)?prefill?.key:String(fields.get('record_key')).trim());
 if(!record_key&&kind==='ekiden'&&payload.race!=='other'){
   if(ekiden().some(row=>row.race===payload.race&&Number(row.year)===payload.year)){
     status(t('adminRelayExists'));return;
   }
   record_key=ekidenKey(payload);
   if(state.managed.some(row=>row.kind===kind&&row.record_key===record_key)){
     status(t('adminRelayExists'));return;
   }
 }
 if(!record_key&&kind==='athlete'){
   if(athletes().some(row=>row.name.replace(/\s/g,'')===payload.name.replace(/\s/g,''))){status(t('adminUseBase'));return;}
   record_key=payload.name;
 }
 if(!record_key&&(kind==='result'||kind==='ekiden')){
   form.dataset.recordKey ||= kind+'-'+crypto.randomUUID();
   record_key=form.dataset.recordKey;
 }
 if(!KINDS.includes(kind)||!record_key||record_key.length<2||record_key.length>180){status(t('adminFailed'));return;}
 if(['result','section_record','specialty_pb','comparison_rank'].includes(kind))payload.id=record_key;
 const button=form.querySelector('[type=submit]');
 if(button.disabled)return;
 button.disabled=true;
 try{
   const {error}=await adminDb.from('wsd_public_content').upsert({kind,record_key,payload,source_url,is_deleted:false},{onConflict:'kind,record_key'});
   if(error)throw error;
   await loadData();
   if(!form.isConnected)return;
   current={kind,record_key};
   prefill=null;
   managedPane();
   status(t(kind==='result'?'adminResultPublished':'adminSaved'));
 }catch{if(form.isConnected)status(t('adminFailed'));}
 finally{button.disabled=false;}
}
async function setDeleted(value){
 const {t}=context;
 const root=adminRoot;
 const saved=selectedRecord();
 const original=!saved&&draftKind==='result'?prefill:null;
 const button=root.querySelector(value?'#admin-delete':'#admin-restore');
 if(!state.managedReady||!adminDb||button.disabled||(!saved&&(!value||!original?.source)))return;
 if(value&&!confirm(t('adminConfirmDelete')))return;
 const db=adminDb;
 button.disabled=true;
 try{
   let write;
   if(saved){
     write=db.from('wsd_public_content').update({is_deleted:value})
       .eq('kind',saved.kind).eq('record_key',saved.record_key).eq('updated_at',saved.updated_at);
   }else{
     write=db.from('wsd_public_content').insert({
       kind:'result',record_key:original.key,payload:original.payload,source_url:original.source,is_deleted:true
     });
   }
   const {data,error}=await write.select('record_key').maybeSingle();
   if(error||!data)throw error||new Error('Result changed');
   await loadData();
   if(adminRoot!==root)return;
   if(original){current={kind:'result',record_key:original.key};prefill=null;}
   managedPane();
   status(t('adminSaved'));
 }catch{if(adminRoot===root)status(t('adminFailed'));}
 finally{button.disabled=false;}
}
function rankPane(){const {t,E}=context;const area=adminRoot.querySelector('#admin-panel');area.innerHTML=`<div class="notice">${E(t('adminRankingsHint'))}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>${E(t('profile'))}</th><th>${E(t('schoolRecords'))}</th><th>${E(t('worldRank'))}</th><th>${E(t('asiaRank'))}</th><th>${E(t('rankingPoints'))}</th><th>${E(t('rankingDate'))}</th><th>${E(t('source'))}</th></tr></thead><tbody>${worldRankings().map(x=>`<tr><td>${E(x.athlete_name)}</td><td>${E(recordLabel(x.event_name))}</td><td>${E(x.world_rank??'—')}</td><td>${E(x.asia_rank??'—')}</td><td>${E(x.ranking_points??'—')}</td><td>${E(x.ranking_date)}</td><td>${context.sourceLink(x.source_url,t('worldRankingSource'))} ${context.sourceLink(x.asia_source_url,t('asiaRankingSource'))}</td></tr>`).join('')}</tbody></table></div>`;}
async function auditPane(){
 const {t,E}=context;
 const db=adminDb;
 const area=adminRoot.querySelector('#admin-panel');
 area.textContent=t('loading');
 const {data,error}=await db.from('wsd_public_audit')
   .select('id,kind,record_key,action,actor_id,changed_at,before_data,after_data')
   .order('id',{ascending:false}).limit(60);
 if(!area.isConnected)return;
 if(error){area.textContent=t('adminFailed');return;}

 const seen=new Set();
 const recoverable=new Map();
 area.innerHTML=(data||[]).map(entry=>{
   const {before_data:before,after_data:after}=entry;
   const key=JSON.stringify([entry.kind,entry.record_key]);
   if(!seen.has(key)&&entry.action==='UPDATE'&&before?.id&&before.id===after?.id&&after.updated_at&&
      before.kind===after.kind&&before.record_key===after.record_key&&KINDS.includes(entry.kind)){
     recoverable.set(String(entry.id),entry);
   }
   seen.add(key);
   return `<article class="audit-item"><div class="card-top"><strong>${E(KIND_LABELS[entry.kind]?t(KIND_LABELS[entry.kind]):entry.kind)} / ${E(entry.record_key)}</strong><span>${E(entry.action)} · ${E(entry.changed_at)}</span></div>
   <p>${E(t('adminActor'))} · ${E(entry.actor_id||'—')}</p>
   <details><summary>${E(t('adminBefore'))} / ${E(t('adminAfter'))}</summary>
   <p>${E(t('adminBefore'))}</p><pre>${E(JSON.stringify(before,null,2))}</pre>
   <p>${E(t('adminAfter'))}</p><pre>${E(JSON.stringify(after,null,2))}</pre>
   ${recoverable.has(String(entry.id))?`<button class="btn btn-sm" type="button" data-restore-audit="${E(entry.id)}">${E(t('adminUndoLastEdit'))}</button>`:''}
   </details></article>`;
 }).join('')||`<p>${E(t('adminNoHistory'))}</p>`;

 for(const button of area.querySelectorAll('[data-restore-audit]')){
   button.onclick=async()=>{
     const entry=recoverable.get(button.dataset.restoreAudit);
     const {payload,source_url,is_deleted}=entry.before_data;
     if(!confirm(t('adminConfirmUndoEdit',{record:entry.record_key})))return;
     button.disabled=true;
     try{
       const {data:restored,error:restoreError}=await db.from('wsd_public_content')
         .update({payload,source_url,is_deleted})
         .eq('id',entry.after_data.id).eq('kind',entry.kind).eq('record_key',entry.record_key)
         .eq('updated_at',entry.after_data.updated_at).select('id').maybeSingle();
       if(restoreError)throw restoreError;
       if(restored)await loadData();
       if(!area.isConnected)return;
       status(t(restored?'adminUndoEditDone':'adminUndoEditStale'));
       await auditPane();
     }catch{
       if(area.isConnected)status(t('adminFailed'));
     }finally{button.disabled=false;}
   };
 }
}
