import {getDb} from './data.js';

const posts='wsd_atlas_fan_posts';
const profiles='wsd_atlas_fan_profiles';
const postFields='id,nickname,message,created_at,status';
const googleUser=user=>user?.app_metadata?.provider==='google'||user?.app_metadata?.providers?.includes('google');
export function fanBoardLink(t,E){
 return `<section class="section fan-board-link" aria-labelledby="fan-board-link-title">
 <h2 id="fan-board-link-title">${E(t('fanTitle'))}</h2><p>${E(t('fanIntro'))}</p>
 <a class="btn" href="#fans">${E(t('fanOpen'))} →</a></section>`;
}

function postMarkup(row,t,E,review){
 return `<article class="card fan-post"><header>
 <strong>${E(row.nickname)}</strong>
 <time datetime="${E(row.created_at)}">${E(new Date(row.created_at).toLocaleDateString(document.documentElement.lang))}</time></header>
 <p>${E(row.message)}</p>${review?`<div class="admin-actions">
 ${row.status==='pending'?`<button type="button" class="btn btn-sm" data-id="${E(row.id)}" data-decision="published">${E(t('fanPublish'))}</button>`:''}
 <button type="button" class="btn btn-sm" data-id="${E(row.id)}" data-decision="hidden">${E(t('fanHide'))}</button></div>`:''}</article>`;
}

export async function renderFanBoard(root,{t,E},review){
 const status=root.querySelector('[role="status"]');
 try{
   const db=await getDb();
   const {data:{session}}=await db.auth.getSession();
   const {data:{user}}=session?await db.auth.getUser():{data:{user:null}};
   if(review && (!user||!(await db.rpc('wsd_atlas_is_google_admin')).data)){
     status.textContent=t('adminNoAccess');
     return;
   }
   if(!root.isConnected)return;
   const list=root.querySelector('[data-fan-posts]');
   const more=root.querySelector('[data-fan-more]');
   const type=root.querySelector('[data-fan-status]');
   let offset=0;
   async function load(){
     more.disabled=true;
     if(type)type.disabled=true;
     try{
       const {data,error}=await db.from(posts).select(postFields).eq('status',review?type.value:'published')
         .order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+19);
       if(error)throw error;
       list.insertAdjacentHTML('beforeend',data.map(row=>postMarkup(row,t,E,review)).join(''));
       offset+=data.length;
       more.hidden=data.length<20;
       status.textContent=offset?'':t('fanEmpty');
     }catch{
       status.textContent=t('fanUnavailable');
       more.hidden=false;
     }finally{
       more.disabled=false;
       if(type)type.disabled=false;
     }
   }
   function reset(){offset=0;list.replaceChildren();return load();}
   more.onclick=load;
   if(review){
     type.hidden=false;
     type.onchange=reset;
     list.onclick=async event=>{
       const button=event.target.closest('button[data-decision]');
       if(!button||button.disabled)return;
       const actions=button.closest('.admin-actions').querySelectorAll('button');
       actions.forEach(action=>action.disabled=true);
       try{
         const current=type.value;
         const {data,error}=await db.from(posts).update({status:button.dataset.decision}).eq('id',button.dataset.id)
           .eq('status',current).select('id');
         if(error||!data.length)throw error||new Error('Already moderated');
         await reset();
       }catch{status.textContent=t('fanUnavailable');actions.forEach(action=>action.disabled=false);}
     };
     await load();
     return;
   }
   await load();
   if(!root.isConnected)return;
   const composer=root.querySelector('[data-fan-composer]');
   if(!googleUser(user)){
     composer.innerHTML=`<button type="button" class="btn">${E(t('submissionLogin'))}</button><p role="status"></p>`;
     composer.querySelector('button').onclick=async event=>{
       const button=event.currentTarget;
       button.disabled=true;
       try{
         sessionStorage.setItem('atlas-submission-return','#fans');
         const options={redirectTo:location.origin+location.pathname+'?atlas-submissions=1'};
         if(user)options.queryParams={prompt:'select_account'};
         const {error}=await db.auth.signInWithOAuth({provider:'google',options});
         if(error)throw error;
       }catch{
         composer.querySelector('[role="status"]').textContent=t('submissionLoginFailed');
         button.disabled=false;
       }
     };
     return;
   }
   const {data:profile,error}=await db.from(profiles).select('nickname').eq('owner_id',user.id).maybeSingle();
   if(error)throw error;
   if(!root.isConnected)return;
   composer.innerHTML=`<form class="card admin-form fan-composer" method="post">
   <p>${E(t('fanPrivacy'))}</p>
   <label class="field">${E(t('fanNickname'))}<input name="nickname" maxlength="24" required value="${E(profile?.nickname)}"></label>
   <label class="field">${E(t('fanMessage'))}<textarea name="message" maxlength="1000" required></textarea></label>
   <div class="admin-actions"><button class="btn btn-primary" type="submit">${E(t('fanSend'))}</button>
   <button class="btn" type="button" data-fan-logout>${E(t('logout'))}</button></div><p role="status"></p></form>`;
   const form=composer.querySelector('form');
   const notice=form.querySelector('[role="status"]');
   form.querySelector('[data-fan-logout]').onclick=async()=>{
     const {error:logoutError}=await db.auth.signOut({scope:'local'});
     if(logoutError)notice.textContent=t('fanUnavailable');else location.reload();
   };
   form.onsubmit=async event=>{
     event.preventDefault();
     const controls=[...form.elements];
     const values=new FormData(form);
     const nickname=String(values.get('nickname')).trim();
     const message=String(values.get('message')).trim();
     if(!nickname||!message){notice.textContent=t('fanRequired');return;}
     controls.forEach(control=>control.disabled=true);
     try{
       const {error:sendError}=await db.rpc('wsd_atlas_submit_fan_post',{
         public_name:nickname,public_avatar:null,body:message
       });
       if(sendError)throw sendError;
       form.elements.message.value='';
       notice.textContent=t('fanSent');
     }catch{notice.textContent=t('fanUnavailable');}
     finally{controls.forEach(control=>control.disabled=false);}
   };
 }catch{status.textContent=t('fanUnavailable');}
}
