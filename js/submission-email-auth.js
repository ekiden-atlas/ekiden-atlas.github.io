export function renderEmailAuth(root,{db,t,E,recovering,onLogin,onRecovered}){
 let mode=recovering?'recovery':'login';
 function draw(){
   const password=mode!=='forgot';
   root.innerHTML=`<form class="card admin-form" method="post">
   <h3>${E(t('emailAuth.'+mode))}</h3>
   ${recovering?'':`<label class="field">${E(t('emailAuth.email'))}<input type="email" name="email" autocomplete="email" required></label>`}
   ${password?`<label class="field">${E(t('emailAuth.password'))}<input type="password" name="password" autocomplete="${mode==='login'?'current-password':'new-password'}" ${mode==='login'?'':'minlength="8"'} required></label>`:''}
   <div class="admin-actions"><button class="btn btn-primary" type="submit">${E(t('emailAuth.'+mode))}</button>
   ${recovering?'':['login','signup','forgot'].filter(item=>item!==mode).map(item=>`<button class="btn btn-sm" type="button" data-mode="${item}">${E(t('emailAuth.'+item))}</button>`).join('')}</div>
   <p role="status"></p></form>`;
   const form=root.querySelector('form');
   const status=form.querySelector('[role=status]');
   const submit=form.querySelector('[type=submit]');
   for(const button of form.querySelectorAll('[data-mode]')){
     button.onclick=()=>{
       const email=form.elements.email.value;
       mode=button.dataset.mode;
       draw();
       root.querySelector('[name=email]').value=email;
     };
   }
   form.onsubmit=async event=>{
     event.preventDefault();
     if(submit.disabled)return;
     const values=new FormData(form);
     const email=String(values.get('email')||'').trim();
     const password=values.get('password');
     const buttons=[...form.querySelectorAll('button')];
     buttons.forEach(button=>button.disabled=true);
     try{
       const redirect=location.origin+location.pathname+'?atlas-submissions=1';
       if(mode==='login'){
         const {error}=await db.auth.signInWithPassword({email,password});
         if(error)throw error;
         if(root.isConnected)await onLogin();
       }else if(mode==='signup'){
         const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
         if(error)throw error;
         if(data?.session)await db.auth.signOut({scope:'local'});
         status.textContent=t('emailAuth.checkInbox');
       }else if(mode==='forgot'){
         const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:redirect});
         if(error)throw error;
         status.textContent=t('emailAuth.resetSent');
       }else{
         const {error}=await db.auth.updateUser({password});
         if(error)throw error;
         await onRecovered();
       }
     }catch(error){
       status.textContent=t(error?.code==='email_not_confirmed'?'emailAuth.checkInbox':'emailAuth.failed');
     }finally{
       if(form.elements.password)form.elements.password.value='';
       buttons.forEach(button=>button.disabled=false);
     }
   };
 }
 draw();
}
