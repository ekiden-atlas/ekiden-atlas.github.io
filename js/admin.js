import {getDb,checkAdmin,state,loadData,athletes,ekiden,schoolRecords,alltimeRankings,personalResults,specialtyPbs,sectionRecords,worldRankings,worldRankKey,comparisonRankings,ekidenKey,alltimeKey,schoolKey} from './data.js';
let listener=null;
let adminRoot=null,context=null,adminDb=null,adminUser=null;
let tab='managed',current=null,draftKind='athlete';
const KINDS=['athlete','pb','specialty_pb','result','ekiden','section_record','school_record','alltime_rank','world_rank','comparison_rank'];
const KIND_LABELS={athlete:'adminTypeAthlete',pb:'adminTypePb',specialty_pb:'adminTypeSpecialtyPb',result:'adminTypeResult',section_record:'adminTypeSectionRecord',ekiden:'adminTypeEkiden',school_record:'adminTypeSchool',alltime_rank:'adminTypeAlltime',world_rank:'adminTypeWorld',comparison_rank:'adminTypeComparison'};
const htmlspecialchars=x=>context.E(x);
const status=m=>{const x=adminRoot?.querySelector('#admin-status');if(x)x.textContent=m;};
export function detachAdmin(){adminRoot=null;context=null;adminDb=null;adminUser=null;current=null;if(listener){listener.data?.subscription?.unsubscribe();listener=null;}}
export async function renderAdminPage(root,ctx){adminRoot=root;context=ctx;
 const {t,E}=ctx;root.innerHTML=`<div class="intro-panel"><p>${E(t('adminLoginHint'))}</p><button class="btn btn-primary" type="button" id="google-login">${E(t('loginGoogle'))}</button><button class="btn" type="button" id="google-logout" hidden>${E(t('logout'))}</button><p id="admin-status" role="status">${E(t('adminLoading'))}</p></div><div id="admin-work" hidden></div>`;
 root.querySelector('#google-login').addEventListener('click',login);
 root.querySelector('#google-logout').addEventListener('click',async()=>{await adminDb?.auth.signOut();location.hash='#home';});
 try{adminDb=await getDb(); const result=await checkAdmin(adminDb);if(!adminRoot||adminRoot!==root)return;
   if(!result.user){status(t('adminLoginHint'));return;}
   root.querySelector('#google-login').hidden=true;root.querySelector('#google-logout').hidden=false;
   if(!result.ok){status(t('adminNoAccess'));return;}
   adminUser=result.user;status(t('adminYes'));root.querySelector('#admin-work').hidden=false;showWork();
 }catch{status(t('adminFailed'));}
}
async function login(){try{const db=adminDb||await getDb();const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname+'#admin'}});if(error)throw error;}catch{status(context.t('adminFailed'));}}
function tabsMarkup(){const {t,E}=context;const items=[['managed','adminTabManaged'],['rankings','adminTabRankings'],['members','adminTabMembers'],['audit','adminTabAudit']];return `<div class="admin-tabs" role="tablist">${items.map(([id,key])=>`<button role="tab" type="button" data-tab="${id}" aria-selected="${String(tab===id)}" class="${tab===id?'active':''}">${E(t(key))}</button>`).join('')}</div>`;}
function showWork(){if(!adminRoot)return;const {t,E}=context;const root=adminRoot.querySelector('#admin-work');root.innerHTML=`<div class="notice">${E(t('adminSyncNotice'))}</div>${tabsMarkup()}<div id="admin-panel"></div>`;root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{tab=btn.dataset.tab;showWork();}));if(tab==='managed')managedPane();if(tab==='rankings')rankPane();if(tab==='members')membersPane();if(tab==='audit')auditPane();}
function selectedRecord(){return state.managed.find(x=>x.kind===current?.kind&&x.record_key===current?.record_key);}
function sourceChoices(kind){
 const entry=(key,label,payload,source='')=>({key,label,payload,source:source||''});
 const content=r=>Object.fromEntries(Object.entries(r).filter(([key])=>!key.startsWith('_')));
 if(kind==='athlete')return athletes().map(a=>{
   const {name,grade,gender,birthday,birthplace,hometown,high_school,height_cm,mainEvent,graduation_year,graduation_source}=a;
   return entry(name,name,{name,grade,gender,birthday,birthplace,hometown,high_school,height_cm,mainEvent,graduation_year,graduation_source},a.source_url);
 });
 if(kind==='pb')return athletes().flatMap(a=>[['pb1500','1500m'],['pb5000','5000m'],['pb10000','10000m'],['pbHalf','Half Marathon']]
   .map(([field,label])=>entry(a.name+':'+label,a.name+' · '+label,{name:a.name,field,time:a[field]||''},a._pbSources?.[field])));
 if(kind==='ekiden')return ekiden().map(r=>entry(ekidenKey(r),r.year+' · '+r.race,content(r),r.source));
 if(kind==='school_record')return schoolRecords().map(r=>entry(schoolKey(r),r.event,content(r),r.source));
 if(kind==='alltime_rank')return alltimeRankings().map(r=>entry(alltimeKey(r),r.event+' · '+r.rank+' · '+r.athlete,content(r),r.source));
 if(kind==='world_rank')return worldRankings().map(r=>entry(worldRankKey(r),[r.athlete_name,r.event_name,r.ranking_date].join(' · '),content(r),r.source_url));
 if(kind==='comparison_rank')return comparisonRankings().map(r=>entry(r.id,r.name+' · '+context.t(r.scope),content(r),r.source));
 if(kind==='result')return personalResults().map(r=>entry(r.id,[r.date||r.year,r.name,r.meet,r.event,r.time].join(' · '),content(r),r.source));
 if(kind==='specialty_pb')return specialtyPbs().map(r=>entry(r.id,r.name+' · '+r.event,content(r),r.source));
 if(kind==='section_record')return sectionRecords().map(r=>entry(r.id,[r.race,r.leg,r.name,r.year].join(' · '),content(r),r.source));
 return [];
}

function managedPane(){const {t,E}=context;const area=adminRoot.querySelector('#admin-panel');const deployed=state.managedReady;const chosen=selectedRecord();const templates=sourceChoices(chosen?.kind||draftKind);const value=chosen||{kind:current?.kind||draftKind,record_key:current?.record_key||'',payload:{},source_url:'',is_deleted:false};
area.innerHTML=`${!deployed?`<div class="notice"><strong>${E(t('adminMigration'))}</strong><p>${E(t('adminMigrationHelp'))}</p></div>`:''}<div class="split"><div><div class="card-top"><h3>${E(t('adminRecords'))}</h3><button id="admin-new" class="btn btn-sm" type="button" ${deployed?'':'disabled'}>${E(t('adminCreate'))}</button></div><div class="admin-list">${state.managed.map(x=>`<button type="button" data-edit-kind="${E(x.kind)}" data-edit-key="${E(x.record_key)}">${E(t(KIND_LABELS[x.kind]||'adminSelectType'))} / ${E(x.record_key)} ${x.is_deleted?'· '+E(t('adminDeleted')):''}</button>`).join('')||`<p class="empty">${E(t('empty'))}</p>`}</div></div><div><form id="admin-content-form" class="admin-form">${!chosen?`<label class="field">${E(t('adminUseBase'))}<select id="admin-base-chooser"><option value="">${E(t('adminPickBase'))}</option>${templates.map((r,i)=>`<option value="${i}">${E(r.label)}</option>`).join('')}</select></label>`:''}<label class="field">${E(t('adminSelectType'))}<select name="kind" required ${chosen?'disabled':''}>${KINDS.map(k=>`<option value="${k}" ${value.kind===k?'selected':''}>${E(t(KIND_LABELS[k]||'adminSelectType'))}</option>`).join('')}</select></label><label class="field">${E(t('adminKey'))}<input name="record_key" value="${E(value.record_key)}" required minlength="2" maxlength="180" ${chosen?'readonly':''}></label><label class="field">${E(t('adminSource'))}<input name="source_url" type="url" required pattern="https://.*" value="${E(value.source_url)}" placeholder="https://…"></label><label class="field">${E(t('adminPayload'))}<textarea name="payload" required spellcheck="false">${E(JSON.stringify(value.payload,null,2))}</textarea></label><div class="admin-actions"><button class="btn btn-primary" type="submit" ${deployed?'':'disabled'}>${E(t('adminSave'))}</button><button class="btn btn-danger" type="button" id="admin-delete" ${deployed&&chosen&&!value.is_deleted?'':'disabled'}>${E(t('adminDelete'))}</button><button class="btn" type="button" id="admin-restore" ${deployed&&chosen&&value.is_deleted?'':'disabled'}>${E(t('adminRestore'))}</button><button class="btn" type="button" id="admin-cancel">${E(t('adminCancel'))}</button></div><p id="admin-form-msg" role="status"></p></form></div></div>`;
area.querySelector('#admin-new')?.addEventListener('click',()=>{current=null;managedPane();});
area.querySelector('select[name=kind]')?.addEventListener('change',e=>{draftKind=e.target.value;current=null;managedPane();});
area.querySelector('#admin-base-chooser')?.addEventListener('change',e=>{const item=templates[Number(e.target.value)];if(!e.target.value||!item)return;const form=area.querySelector('#admin-content-form');form.querySelector('[name=record_key]').value=item.key;form.querySelector('[name=payload]').value=JSON.stringify(item.payload,null,2);form.querySelector('[name=source_url]').value=item.source;});
area.querySelectorAll('[data-edit-kind]').forEach(btn=>btn.addEventListener('click',()=>{current={kind:btn.dataset.editKind,record_key:btn.dataset.editKey};managedPane();}));
area.querySelector('#admin-cancel')?.addEventListener('click',()=>{current=null;managedPane();});
area.querySelector('#admin-content-form')?.addEventListener('submit',saveContent);
area.querySelector('#admin-delete')?.addEventListener('click',()=>setDeleted(true));
area.querySelector('#admin-restore')?.addEventListener('click',()=>setDeleted(false));
}
async function saveContent(e){e.preventDefault();const {t}=context;if(!state.managedReady)return;const form=e.currentTarget;const f=new FormData(form);let payload;try{payload=JSON.parse(f.get('payload'));if(!payload||Array.isArray(payload)||typeof payload!=='object')throw Error();}catch{status(t('adminInvalidJson'));return;}
const kind=current?.kind||String(f.get('kind')),record_key=current?.record_key||String(f.get('record_key')).trim(),source_url=String(f.get('source_url')).trim();if(!/^https:\/\/[^\s]+$/i.test(source_url)){status(t('adminInvalidUrl'));return;}
if(!KINDS.includes(kind)||record_key.length<2||record_key.length>180){status(t('adminFailed'));return;}
if(['result','section_record','specialty_pb','comparison_rank'].includes(kind))payload.id=record_key;
try{const {error}=await adminDb.from('wsd_public_content').upsert({kind,record_key,payload,source_url,is_deleted:false},{onConflict:'kind,record_key'});if(error)throw error;await loadData();current={kind,record_key};managedPane();status(t('adminSaved'));}catch{status(t('adminFailed'));}}
async function setDeleted(value){const {t}=context;if(!current||!state.managedReady)return;if(value&&!confirm(t('adminConfirmDelete')))return;
try{const {error}=await adminDb.from('wsd_public_content').update({is_deleted:value}).eq('kind',current.kind).eq('record_key',current.record_key);if(error)throw error;await loadData();managedPane();status(t('adminSaved'));}catch{status(t('adminFailed'));}}
function rankPane(){const {t,E}=context;const area=adminRoot.querySelector('#admin-panel');area.innerHTML=`<div class="notice">${E(t('adminRankingsHint'))}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>${E(t('profile'))}</th><th>${E(t('schoolRecords'))}</th><th>${E(t('worldRank'))}</th><th>${E(t('rankingDate'))}</th><th>${E(t('source'))}</th></tr></thead><tbody>${state.rankings.map(x=>`<tr><td>${E(x.athlete_name)}</td><td>${E(x.event_name)}</td><td>${E(x.world_rank??'—')}</td><td>${E(x.ranking_date)}</td><td>${context.sourceLink(x.source_url)}</td></tr>`).join('')}</tbody></table></div>`;}
async function membersPane(){const {t,E}=context;const area=adminRoot.querySelector('#admin-panel');area.innerHTML=`<div class="notice">${E(t('adminInviteHint'))}</div><form id="member-form" class="filterbar"><label class="field">${E(t('adminEmail'))}<input type="email" name="email" required autocomplete="off" placeholder="runner@example.com"></label><button type="submit" class="btn btn-primary">${E(t('adminInvite'))}</button></form><p id="member-msg" role="status"></p><h3>${E(t('adminMembers'))}</h3><div id="member-list">${E(t('loading'))}</div>`;
const display=area.querySelector('#member-list');const {data,error}=await adminDb.rpc('wsd_public_list_admins');if(!adminRoot||!display.isConnected)return;
if(error){display.textContent=t('adminInviteNotReady');area.querySelector('#member-form button').disabled=true;return;}
display.innerHTML=(data||[]).map(x=>`<div class="card-top" style="background:white;border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:8px"><div><strong>${E(x.email)}</strong><small class="subline">${E(x.created_at?.slice(0,10)||'')} · ${E(t(x.scope==='shared'?'adminSharedScope':'adminNewScope'))}</small></div>${x.scope==='atlas'&&x.user_id!==adminUser.id?`<button type="button" class="btn btn-sm btn-danger" data-revoke="${E(x.user_id)}">${E(t('adminDelete'))}</button>`:''}</div>`).join('')||E(t('empty'));
area.querySelector('#member-form').addEventListener('submit',async e=>{e.preventDefault();const email=String(new FormData(e.currentTarget).get('email')).trim();const {data:result,error:err}=await adminDb.rpc('wsd_public_grant_admin_by_email',{p_email:email});area.querySelector('#member-msg').textContent=err?t('adminFailed'):result==='granted'?t('adminSaved'):t('adminInviteHint');if(!err&&result==='granted')membersPane();});
area.querySelectorAll('[data-revoke]').forEach(btn=>btn.addEventListener('click',async()=>{if(!confirm(t('adminConfirmDelete')))return;const {error:err}=await adminDb.rpc('wsd_public_revoke_admin',{p_user_id:btn.dataset.revoke});area.querySelector('#member-msg').textContent=err?t('adminFailed'):t('adminSaved');if(!err)membersPane();}));}
async function auditPane(){const {t,E}=context;const area=adminRoot.querySelector('#admin-panel');area.textContent=t('loading');const {data,error}=await adminDb.from('wsd_public_audit').select('id,kind,record_key,action,actor_id,changed_at,before_data,after_data').order('changed_at',{ascending:false}).limit(60);
if(!adminRoot||!area.isConnected)return;if(error){area.textContent=t('adminMigration');return;}
area.innerHTML=(data||[]).map(x=>`<article class="audit-item"><div class="card-top"><strong>${E(x.kind)} / ${E(x.record_key)}</strong><span>${E(x.action)} · ${E(x.changed_at)}</span></div><p>${E(t('adminActor'))}: ${E(x.actor_id)}</p><details><summary>${E(t('adminBefore'))} / ${E(t('adminAfter'))}</summary><p>${E(t('adminBefore'))}</p><pre>${E(JSON.stringify(x.before_data,null,2))}</pre><p>${E(t('adminAfter'))}</p><pre>${E(JSON.stringify(x.after_data,null,2))}</pre></details></article>`).join('')||`<p>${E(t('adminNoHistory'))}</p>`;}
