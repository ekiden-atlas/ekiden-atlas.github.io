import {bindSiteLogout,siteLogoutMarkup} from './site-logout.js';
import {getDb} from './data.js';

const posts='wsd_atlas_fan_posts';
const postFields='id,nickname,message,created_at,status';
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
   if(review&&(await db.rpc('wsd_atlas_is_google_admin')).data!==true){
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
   }
   if(!review){
     const sessionArea=root.querySelector('[data-fan-session]');
     void db.auth.getSession().then(({data})=>{
       if(!sessionArea.isConnected||!data?.session)return;
       sessionArea.innerHTML=siteLogoutMarkup(t,E);
       bindSiteLogout(sessionArea,db,t,()=>sessionArea.replaceChildren());
     }).catch(()=>{});
     void renderGuestComposer(root.querySelector('[data-fan-composer]'),db,t,E);
   }
   await load();
 }catch{status.textContent=t('fanUnavailable');}
}

async function renderGuestComposer(root,db,t,E){
 try{
   const {data}=await db.rpc('wsd_atlas_guest_fan_posts_ready');
   if(!root.isConnected||data!==true)return;
   root.innerHTML=`<form class="card admin-form fan-composer">
   <p>${E(t('fanGuestPrivacy'))}</p>
   <label class="field">${E(t('fanNickname'))}<input name="nickname" maxlength="24" required></label>
   <label class="field">${E(t('fanMessage'))}<textarea name="message" maxlength="1000" required></textarea></label>
   <div><button class="btn btn-primary" type="submit">${E(t('fanSend'))}</button></div>
   <p role="status"></p></form>`;
   const form=root.querySelector('form');
   const button=form.querySelector('button');
   const status=form.querySelector('[role=status]');
   form.onsubmit=async event=>{
     event.preventDefault();
     if(button.disabled)return;
     const values=new FormData(form);
     const public_name=values.get('nickname').trim();
     const body=values.get('message').trim();
     if(!public_name||!body){status.textContent=t('fanRequired');return;}
     button.disabled=true;
     try{
       const {error}=await db.rpc('wsd_atlas_submit_guest_fan_post',{public_name,body});
       if(error)throw error;
       if(form.elements.message.value===values.get('message'))form.elements.message.value='';
       status.textContent=t('fanSent');
     }catch{status.textContent=t('fanUnavailable');}
     finally{button.disabled=false;}
   };
 }catch{
   // A temporarily unavailable submission endpoint does not affect public reading.
 }
}
