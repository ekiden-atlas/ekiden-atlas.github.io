const fieldErrors = [
 ['source_url','submissionSourceInvalid'],
 ['requires_source','submissionSourceInvalid'],
 ['finish_rank','submissionRankInvalid'],
 ['race_date','submissionDateInvalid'],
 ['_mark_check','submissionMarkInvalid'],
 ['_title_check','submissionTextInvalid'],
 ['_body_check','submissionTextInvalid']
];

export function submissionErrorKey(error, fallback='submissionFailed'){
 const code=String(error?.code||'');
 const status=Number(error?.status||error?.statusCode||0);
 const message=String(error?.message||'');
 if(status===401||code==='PGRST301'||code==='PGRST303')return 'submissionSessionExpired';
 if(status===403||code==='42501')return 'submissionPermissionFailed';
 if(code==='40001')return 'submissionChanged';
 if(code==='23505')return 'submissionDuplicate';
 if(status===413)return 'submissionFileTooLarge';
 if(status===429)return 'submissionRateLimited';
 if(code==='57014'||/failed to fetch|networkerror|load failed|timed? ?out/i.test(message))
   return 'submissionConnectionFailed';
 if(['23502','23514','22007','22008','22003'].includes(code))
   return fieldErrors.find(([field])=>message.includes(field))?.[1]
     || (['22007','22008'].includes(code)?'submissionDateInvalid':fallback);
 return fallback;
}
