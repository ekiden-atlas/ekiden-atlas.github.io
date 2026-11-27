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
   await load();
 }catch{status.textContent=t('fanUnavailable');}
}
