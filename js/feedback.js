import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
import {t,language} from './i18n.js';

const feedbackTable='wsd_atlas_feedback';

export function bindFeedback(form){
 const message=form.querySelector('textarea');
 const button=form.querySelector('button');
 const status=form.querySelector('[role="status"]');
 form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(button.disabled)return;
   const value=message.value.trim();
   if(!value){status.textContent=t('feedbackRequired');message.focus();return;}
   button.disabled=true;
   message.readOnly=true;
   status.textContent=t('loading');
   try{
     const response=await fetch(SUPABASE_URL+'/rest/v1/'+feedbackTable,{
       method:'POST',
       credentials:'omit',
       headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
       body:JSON.stringify({message:value})
     });
     if(!response.ok)throw new Error('Feedback request failed');
     form.reset();
     status.textContent=t('feedbackSent');
   }catch{
     status.textContent=t('feedbackError');
   }finally{
     message.readOnly=false;
     button.disabled=false;
   }
 });
 button.disabled=false;
}

export function bindFeedbackInbox(details,db,escape){
 const area=details.querySelector('[data-feedback-items]');
 const more=details.querySelector('button');
 const status=details.querySelector('[role="status"]');
 const pageSize=30;
 let offset=0;
 async function load(){
   more.disabled=true;
   status.textContent=t('loading');
   try{
     const {data,error}=await db.from(feedbackTable).select('id,created_at,message')
       .order('created_at',{ascending:false}).order('id',{ascending:false})
       .range(offset,offset+pageSize);
     if(error)throw error;
     const rows=data.slice(0,pageSize);
     const formatter=new Intl.DateTimeFormat(language()==='zh'?'zh-CN':'ja-JP',{dateStyle:'medium',timeStyle:'short'});
     area.insertAdjacentHTML('beforeend',rows.map(row=>`<article class="audit-item">
       <time datetime="${escape(row.created_at)}">${escape(formatter.format(new Date(row.created_at)))}</time>
       <p class="feedback-message">${escape(row.message)}</p>
     </article>`).join(''));
     offset+=rows.length;
     status.textContent=offset?'':t('feedbackInboxEmpty');
     more.hidden=data.length<=pageSize;
   }catch{
     status.textContent=t('feedbackInboxError');
     more.hidden=false;
   }finally{
     more.disabled=false;
   }
 }
 details.addEventListener('toggle',()=>{if(details.open && !offset && !more.disabled)load();});
 more.addEventListener('click',load);
}
