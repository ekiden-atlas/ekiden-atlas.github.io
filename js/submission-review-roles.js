export async function readReviewRoles(db,kind,rows){
 const roles=new Map();
 for(let offset=0;offset<rows.length;offset+=100){
   const {data,error}=await db.rpc('wsd_atlas_review_roles',{
     p_kind:kind,p_ids:rows.slice(offset,offset+100).map(row=>row.id)
   });
   if(error?.code==='PGRST202')return roles;
   if(error)throw error;
   for(const row of data)roles.set(row.submission_id,row.reviewer_role);
 }
 return roles;
}

export function reviewRoleBadge(role,t,E){
 const key=role==='deputy'?'submissionReviewedByDeputy':role==='main'?'submissionReviewedByMain':'submissionReviewRoleUnknown';
 return `<span class="tag">${E(t(key))}</span>`;
}
