export const submissionBadgeMarkup='<span class="submission-badge" data-submission-badge role="status" hidden></span>';

export function watchSubmissionBadge(root,db,t){
 const badge=root.querySelector('[data-submission-badge]');
 if(!badge)return;
 const active=()=>badge.isConnected&&root.contains(badge);
 const countPending=table=>db.from(table).select('id',{count:'exact',head:true}).eq('status','pending');
 async function refresh(){
   if(!active())return;
   try{
     if(document.visibilityState==='hidden')return;
     const {data:reviewer}=await db.rpc('wsd_atlas_can_review');
     const admin=reviewer===true||(await db.rpc('wsd_atlas_is_google_admin')).data===true;
     if(!active()||admin!==true){badge.hidden=true;return;}
     const counts=await Promise.all([
       countPending('wsd_atlas_result_submissions'),
       countPending('wsd_atlas_other_submissions')
     ]);
     if(!active())return;
     if(counts.some(result=>result.error||result.count==null)){badge.hidden=true;return;}
     const count=counts.reduce((sum,result)=>sum+result.count,0);
     const label=count?t('submissionPendingBadge',{count}):'';
     if(badge.textContent!==label)badge.textContent=label;
     badge.hidden=!count;
   }catch{
     badge.hidden=true;
   }finally{
     if(active())setTimeout(refresh,30000);
   }
 }
 refresh();
}
