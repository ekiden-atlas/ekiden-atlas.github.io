const table='wsd_atlas_other_submissions';
const mimeTypes=[
 'image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export async function renderOtherSubmissions(root,{db,user,review,t,E}){
 const bucket=db.storage.from('atlas-submission-files');
 const query=db.from(table).select('id,author_id,folder,title,body,status').order('created_at',{ascending:false}).limit(100);
 const {data:rows,error}=await (review?query.eq('status','pending'):query.eq('author_id',user.id));
 if(error)throw error;
 if(!root.isConnected)return;
 const content=(row={})=>`<label class="field">${E(t('otherSubmissionTitle'))}<input name="title" maxlength="120" required value="${E(row.title||'')}"></label>
 <label class="field">${E(t('otherSubmissionBody'))}<textarea name="body" maxlength="4000" required>${E(row.body||'')}</textarea></label>`;
 root.innerHTML=`<h3>${E(t('otherSubmission'))}</h3><p role="status"></p>
 ${review?'':`<form class="card">${content()}
 <label class="field">${E(t('otherSubmissionFiles'))}<input name="files" type="file" accept="${mimeTypes.join(',')}" multiple></label>
 <button class="btn" type="submit">${E(t('submissionSend'))}</button></form>`}
 ${rows.map(row=>`<article class="card" data-id="${E(row.id)}"><p>${E(t('submissionStatus.'+row.status))}</p>
 <ul></ul>${review?`<form>${content(row)}
 <button class="btn" type="submit" value="accepted">${E(t('submissionReviewSubmit'))}</button>
 <button class="btn" type="submit" value="rejected" formnovalidate>${E(t('submissionReject'))}</button>
 </form>`:`<h4>${E(row.title)}</h4><p>${E(row.body)}</p>`}</article>`).join('')}`;
 const status=root.querySelector('[role=status]');
 const values=form=>({title:form.elements.title.value.trim(),body:form.elements.body.value.trim()});
 const bind=(form,save)=>{form.onsubmit=async event=>{
   event.preventDefault();
   const buttons=[...form.querySelectorAll('button')];
   buttons.forEach(button=>{button.disabled=true;});
   try{
     if(await save(event.submitter?.value)===false)return;
     await renderOtherSubmissions(root,{db,user,review,t,E});
     root.querySelector('[role=status]').textContent=t(review?'otherSubmissionReviewed':'submissionSent');
   }catch{status.textContent=t(review?'submissionReviewFailed':'submissionFailed');}
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
         if(error)throw error;
         uploaded.push(path);
       }
       const {error}=await db.from(table).insert({...values(form),folder});
       if(error)throw error;
     }catch(error){
       if(uploaded.length)await bucket.remove(uploaded);
       throw error;
     }
   });
 }
 await Promise.all(rows.map(async row=>{
   const article=root.querySelector(`[data-id="${row.id}"]`);
   if(review){
     const form=article.querySelector('form');
     bind(form,async decision=>{
       const changes=decision==='accepted'?values(form):{};
       const {data,error}=await db.from(table).update({...changes,status:decision})
         .eq('id',row.id).eq('status','pending').select('id').maybeSingle();
       if(error||!data)throw error||new Error('Already reviewed');
     });
   }
   const folder=`${row.author_id}/${row.folder}`;
   const {data,error}=await bucket.list(folder);
   const list=article.querySelector('ul');
   if(error){list.textContent=t('otherAttachmentFailed');return;}
   list.innerHTML=data.filter(file=>file.id).map(file=>`<li><button class="btn btn-sm" type="button" data-file="${E(file.name)}">${E(file.name)}</button></li>`).join('');
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
