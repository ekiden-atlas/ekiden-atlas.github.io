import {submissionErrorKey} from './submission-errors.js';
import {KIND_LABELS} from './admin-content-types.js';
const table='wsd_atlas_other_submissions';
const categories=['athlete','event','other'];
const mimeTypes=[
 'image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export async function renderOtherSubmissions(root,{db,user,review,admin,selfEdit,t,E,messageKey,returnLink}){
 const bucket=db.storage.from('atlas-submission-files');
 const read=categoryColumn=>{
   const query=db.from(table).select('id,author_id,folder,title,body,status'+
     (selfEdit?',revision':'')+(categoryColumn?',category':'')).order('created_at',{ascending:false}).limit(100);
   return review?query.eq('status','pending'):query.eq('author_id',user.id);
 };
 let categoryReady=true;
 let {data:rows,error}=await read(true);
 if(['42703','PGRST204'].includes(error?.code)){
   categoryReady=false;
   ({data:rows,error}=await read(false));
 }
 if(error)throw error;
 if(!root.isConnected)return;
 const categoryLabel=value=>t('otherCategory.'+(categories.includes(value)?value:'unspecified'));
 const content=(row={})=>`${categoryReady?`<label class="field">${E(t('otherCategoryLabel'))}
 <select name="category" ${row.id?'':'required'}>
 <option value="">${E(categoryLabel(null))}</option>
 ${categories.map(value=>`<option value="${value}" ${row.category===value?'selected':''}>${E(categoryLabel(value))}</option>`).join('')}
 </select></label>`:''}<label class="field">${E(t('otherSubmissionTitle'))}<input name="title" maxlength="120" required value="${E(row.title||'')}"></label>
 <label class="field">${E(t('otherSubmissionBody'))}<textarea name="body" maxlength="4000" required>${E(row.body||'')}</textarea></label>`;
 root.innerHTML=`<h3>${E(t('otherSubmission'))}</h3><p role="status">${messageKey?E(t(messageKey)):''}</p><div data-submission-return>${messageKey==='submissionSent'?returnLink||'':''}</div>
 ${review?'':`<form class="card">${content()}
 <label class="field">${E(t('otherSubmissionFiles'))}<input name="files" type="file" accept="${mimeTypes.join(',')}" multiple></label>
 <button class="btn" type="submit">${E(t('submissionSend'))}</button></form>`}
 ${rows.map(row=>{
 const canEdit=selfEdit&&!review&&row.status==='pending';
 return `<article class="card" data-id="${E(row.id)}"><p>${E(t('submissionStatus.'+row.status))} ${categoryReady?`<span class="tag">${E(categoryLabel(row.category))}</span>`:''}
 <span data-attachment-count hidden></span></p>
 <ul></ul>${review&&admin?`<label class="field">${E(t('submissionDestination'))}
 <select data-destination><option value="">${E(t('adminSelectType'))}</option>
 ${Object.entries(KIND_LABELS).map(([kind,label])=>`<option value="${kind}">${E(t(label))}</option>`).join('')}
 </select></label>
 <a class="btn btn-sm" data-content-editor hidden>${E(t('submissionOpenEditor'))}</a>`:""}${review?`
 <form>${content(row)}
 <button class="btn" type="submit" value="accepted">${E(t('submissionReviewSubmit'))}</button>
 <button class="btn" type="submit" value="rejected" formnovalidate>${E(t('submissionReject'))}</button>
 </form>`:canEdit?`<form>${content(row)}
 <button class="btn" type="submit" value="pending">${E(t('submissionSaveEdit'))}</button>
 <button class="btn" type="submit" value="withdrawn" formnovalidate>${E(t('submissionWithdraw'))}</button>
 </form>`:`<h4>${E(row.title)}</h4><p>${E(row.body)}</p>`}</article>`;}).join('')}`;
 const status=root.querySelector('[role=status]');
 const values=form=>({title:form.elements.title.value.trim(),body:form.elements.body.value.trim(),
   ...(categoryReady?{category:form.elements.category.value||null}:{})});
 const bind=(form,save)=>{form.onsubmit=async event=>{
   event.preventDefault();
   const buttons=[...form.querySelectorAll('button')];
   buttons.forEach(button=>{button.disabled=true;});
   try{
     status.textContent=t('submissionSending');
     if(await save(event.submitter?.value)===false){
       if(status.textContent===t('submissionSending'))status.textContent='';
       return;
     }
     const messageKey=review?'otherSubmissionReviewed':event.submitter?.value==='withdrawn'?'submissionStatus.withdrawn':event.submitter?.value==='pending'?'adminSaved':'submissionSent';
     if(messageKey==='submissionSent')form.reset();
     status.textContent=t(messageKey);
     if(messageKey==='submissionSent')root.querySelector('[data-submission-return]').innerHTML=returnLink||'';
     await renderOtherSubmissions(root,{db,user,review,admin,selfEdit,t,E,messageKey,returnLink}).catch(()=>{});
   }catch(error){status.textContent=t(submissionErrorKey(error,review?'submissionReviewFailed':'otherSubmissionFailed'));}
   finally{buttons.forEach(button=>{button.disabled=false;});}
 };};
 if(!review){
   const form=root.querySelector('form');
   bind(form,async()=>{
     const files=[...form.elements.files.files];
     if(files.length>5||files.some(file=>!mimeTypes.includes(file.type)||file.size>20971520)){
       status.textContent=t('otherSubmissionFiles');
       return false;
     }
     const folder=crypto.randomUUID();
     const uploaded=[];
     try{
       for(const file of files){
         const name=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
         const path=`${user.id}/${folder}/${uploaded.length+1}-${name}`;
         const {error}=await bucket.upload(path,file,{contentType:file.type});
         if(error)throw {uploadError:error,file:file.name};
         uploaded.push(path);
       }
       const {error}=await db.from(table).insert({...values(form),folder});
       if(error)throw error;
     }catch(error){
       if(uploaded.length)void bucket.remove(uploaded).then(()=>{},()=>{});
       if(error.uploadError){
         status.textContent=t(submissionErrorKey(error.uploadError,'submissionUploadFailed'),{file:error.file});
         return false;
       }
       throw error;
     }
   });
 }
 void Promise.allSettled(rows.map(async row=>{
   const article=root.querySelector(`[data-id="${row.id}"]`);
   if(review&&admin){
     const destination=article.querySelector('[data-destination]');
     const editor=article.querySelector('[data-content-editor]');
     destination.onchange=()=>{
       editor.hidden=!destination.value;
       if(destination.value)editor.href='#admin?'+new URLSearchParams({kind:destination.value,submission:row.id});
       else editor.removeAttribute('href');
     };
   }
   const edit=article.querySelector('form');
   if(edit){
     bind(edit,async decision=>{
       if(decision==='withdrawn'&&!confirm(t('submissionConfirmWithdraw')))return false;
       const changes=['accepted','pending'].includes(decision)?values(edit):{};
       const update=db.from(table).update({...changes,status:decision}).eq('id',row.id).eq('status','pending');
       if(selfEdit)update.eq('revision',row.revision);
       const {data,error}=await update.select('id').maybeSingle();
       if(error||!data)throw error||{code:'40001'};
     });
   }
   const folder=`${row.author_id}/${row.folder}`;
   const {data,error}=await bucket.list(folder);
   const list=article.querySelector('ul');
   if(error){list.textContent=t('otherAttachmentFailed');return;}
   const attachments=data.filter(file=>file.id);
   const count=article.querySelector('[data-attachment-count]');
   count.textContent=t('otherAttachmentCount',{count:attachments.length});
   count.classList.add('tag');
   count.hidden=false;
   list.innerHTML=attachments.map(file=>`<li><button class="btn btn-sm" type="button" data-file="${E(file.name)}">${E(file.name)}</button></li>`).join('');
   list.querySelectorAll('button').forEach(button=>{button.onclick=async()=>{
     const {data,error}=await bucket.download(`${folder}/${button.dataset.file}`);
     if(error){status.textContent=t('otherAttachmentFailed');return;}
     const url=URL.createObjectURL(data);
     const link=document.createElement('a');
     link.href=url;
     link.download=button.dataset.file;
     link.click();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
   };});
 }));
}
