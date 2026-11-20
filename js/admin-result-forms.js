import {athletes,personalResults,resultGrade} from './data.js';
const relayTypes={hak:'introHak',izu:'introIzu',zen:'introZen',other:'otherEkiden'};
const statuses={student:'student',OB:'alumni',highSchool:'highSchool',middleSchool:'middleSchool'};

export function raceFields(kind,payload,{t,E}){
 const field=(name,label,value='',attributes='')=>
   `<label class="field">${E(t(label))}<input name="${name}" value="${E(value)}" ${attributes}></label>`;
 if(kind==='athlete')return `${field('name','profile',payload.name,payload.name?'readonly':'required maxlength="120"')}
 ${field('mainEvent','event',payload.mainEvent,'maxlength="80"')}
 ${field('middle_school','middleSchoolProfile',payload.middle_school,'maxlength="120"')}
 ${field('home_prefecture','homePrefecture',payload.home_prefecture,'maxlength="30"')}
 ${field('high_school','school',payload.high_school,'maxlength="120"')}
 ${field('grade','filterGrade',payload.grade,'type="number" min="1" max="4"')}
 <label class="field">${E(t('filterGender'))}<select name="gender"><option value="">${E(t('notRecorded'))}</option>
 ${[['男','male'],['女','female']].map(([value,key])=>`<option value="${value}" ${payload.gender===value?'selected':''}>${E(t(key))}</option>`).join('')}</select></label>
 ${field('birthday','birthday',payload.birthday,'maxlength="20"')}
 ${field('birthplace','birthplace',payload.birthplace,'maxlength="120"')}
 ${field('hometown','hometown',payload.hometown,'maxlength="120"')}
 ${field('height_cm','height',payload.height_cm,'type="number" min="1" max="300"')}
 ${field('weight_kg','weight',payload.weight_kg,'type="number" min="1" max="500" step="0.1"')}`;
 const options=values=>[...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}))
   .map(value=>`<option value="${E(value)}"></option>`).join('');
 const names=`<datalist id="admin-athlete-options">${options(athletes().map(row=>row.name))}</datalist>`;
 const date=field('date','date',payload.date||payload.year,'required inputmode="numeric" placeholder="YYYY-MM-DD"');
 if(kind==='result')return `${date}
 ${field('meet','meet',payload.meet,'required maxlength="240"')}
 ${field('name','profile',payload.name,'required maxlength="120" list="admin-athlete-options"')}${names}
 ${field('event','event',payload.event,'required maxlength="80" list="admin-event-options"')}
 <datalist id="admin-event-options">${options([...personalResults().map(row=>row.event),
 '100m','200m','400m','800m','1500m','5000m','10000m','100mH','110mH','400mH','3000mSC',
 '4×100mR','4×400mR','走高跳','棒高跳','走幅跳','三段跳','砲丸投','円盤投','ハンマー投','やり投','七種競技','十種競技'])}</datalist>
 ${field('time','resultMark',payload.time,'required maxlength="30"')}
 ${field('rank','rank',payload.rank,'maxlength="30"')}
 ${field('stage','adminRaceStage',payload.stage,'maxlength="100"')}
 <label class="field">${E(t('resultStatus'))}<select name="status"><option value="">${E(t('notRecorded'))}</option>
 ${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${payload.status===value?'selected':''}>${E(t(label))}</option>`).join('')}</select></label>
 ${field('gradeAtRace','filterGrade',resultGrade(payload),'type="number" min="1" max="4"')}
 <label><input name="pb" type="checkbox" ${payload.pb?'checked':''}> PB</label>`;
 const leg=(row={},index='')=>`<fieldset class="admin-race-leg" data-leg-index="${index}">
 ${field('leg','section',row.leg,'required type="number" min="1" max="99"')}
 ${field('runner','profile',row.name,'maxlength="120" list="admin-athlete-options"')}
 ${field('split','resultMark',row.time,'maxlength="30"')}
 ${field('km','adminLegDistance',row.km,'maxlength="20"')}
 ${field('legRank','legRank',row.rank,'type="number" min="1"')}
 <button type="button" class="btn btn-sm" data-remove-leg>${E(t('adminRemoveLeg'))}</button></fieldset>`;
 return `<label class="field">${E(t('adminRaceSeries'))}<select name="race" required>
 ${Object.entries(relayTypes).map(([value,label])=>`<option value="${value}" ${payload.race===value?'selected':''}>${E(t(label))}</option>`).join('')}</select></label>
 ${date}${field('meet','meet',payload.meet,'maxlength="240"')}${names}
 ${field('total','time',payload.total,'maxlength="30"')}
 ${field('rank','teamRank',payload.rank,'maxlength="30"')}
 <fieldset class="admin-race-legs"><legend>${E(t('adminLegResults'))}</legend>
 <div id="admin-leg-rows">${(payload.legs||[]).map(leg).join('')}</div>
 <button type="button" class="btn btn-sm" id="admin-add-leg">${E(t('adminAddLeg'))}</button>
 <template id="admin-leg-template">${leg()}</template></fieldset>`;
}

export function bindRelayLegs(form){
 const list=form.querySelector('#admin-leg-rows');
 form.querySelector('#admin-add-leg').onclick=()=>{
   list.append(form.querySelector('#admin-leg-template').content.cloneNode(true));
   list.lastElementChild.querySelector('input').focus();
 };
 list.onclick=event=>{
   if(event.target.closest('[data-remove-leg]')){
     event.target.closest('[data-leg-index]').remove();
     form.querySelector('#admin-add-leg').focus();
   }
 };
}

export function racePayload(kind,form,base){
 const fields=new FormData(form);
 const value=key=>String(fields.get(key)||'').trim();
 if(kind==='athlete'){
   const name=value('name');
   if(!name)return null;
   return {...base,name,...Object.fromEntries(['mainEvent','middle_school','high_school','home_prefecture','gender','birthday','birthplace','hometown'].map(key=>[key,value(key)||null])),
     grade:Number(value('grade'))||null,height_cm:Number(value('height_cm'))||null,weight_kg:Number(value('weight_kg'))||null};
 }
 const date=value('date');
 if(date!==base.date){
   if(!/^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(date))return null;
   if(date.length===10&&new Date(date).toISOString().slice(0,10)!==date)return null;
 }
 const year=date===base.date&&base.year?Number(base.year):Number(date.slice(0,4));
 if(!year)return null;
 const payload={...base,date,year,meet:value('meet')||null};
 if(kind==='result'){
   const {name,event,time}=Object.fromEntries(['name','event','time'].map(key=>[key,value(key)]));
   if(!name||!event||!time||!payload.meet)return null;
   return {...payload,name,event,time,rank:value('rank')||null,stage:value('stage')||null,status:value('status')||null,
     gradeAtRace:Number(value('gradeAtRace'))||null,grade:Number(value('gradeAtRace'))||null,pb:fields.has('pb')};
 }
 const legs=[...form.querySelectorAll('[data-leg-index]')].map(row=>{
   const get=key=>row.querySelector(`[name="${key}"]`).value.trim();
   const previous=row.dataset.legIndex===''?{}:base.legs?.[Number(row.dataset.legIndex)];
   return {...previous,leg:Number(get('leg')),name:get('runner'),time:get('split'),
     km:get('km')||null,rank:Number(get('legRank'))||null};
 });
 const race=value('race');
 if(!Object.hasOwn(relayTypes,race)||(race==='other'&&!payload.meet)||new Set(legs.map(row=>row.leg)).size!==legs.length)return null;
 if(base.race&&(base.race!==race||Number(base.year)!==year))return null;
 return {...payload,race,total:value('total')||null,rank:value('rank')||null,legs_text:null,legs:legs.sort((a,b)=>a.leg-b.leg)};
}
