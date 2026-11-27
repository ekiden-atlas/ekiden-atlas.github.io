// Public Turnstile site key for the shared Supabase authentication project.
const turnstileSiteKey='0x4AAAAAAGDgynZSRsn9qQq2';
let turnstilePromise;
function loadTurnstile(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 if(!turnstilePromise)turnstilePromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.onload=()=>window.turnstile?resolve(window.turnstile):reject(new Error('Turnstile unavailable'));
   script.onerror=()=>{script.remove();reject(new Error('Turnstile unavailable'));};
   document.head.append(script);
 }).catch(error=>{turnstilePromise=null;throw error;});
 return turnstilePromise;
}

export function renderEmailAuth(root,{db,t,E,recovering,onLogin,onRecovered}){
 let mode=recovering?'recovery':'login';
 let widget=null;
 function draw(){
   if(widget!==null){window.turnstile.remove(widget);widget=null;}
   const password=mode!=='forgot';
   root.innerHTML=`<form class="card admin-form" method="post">
   <h3>${E(t('emailAuth.'+mode))}</h3>
   ${recovering?'':`<label class="field">${E(t('emailAuth.email'))}<input type="email" name="email" autocomplete="email" required></label>`}
   ${password?`<label class="field">${E(t('emailAuth.password'))}<input type="password" name="password" autocomplete="${mode==='login'?'current-password':'new-password'}" ${mode==='login'?'':'minlength="8"'} required></label>`:''}
   ${recovering?'':'<div data-email-captcha></div>'}
   <div class="admin-actions"><button class="btn btn-primary" type="submit" ${recovering?'':'disabled'}>${E(t('emailAuth.'+mode))}</button>
   ${recovering?'':['login','signup','forgot'].filter(item=>item!==mode).map(item=>`<button class="btn btn-sm" type="button" data-mode="${item}">${E(t('emailAuth.'+item))}</button>`).join('')}</div>
   <p role="status"></p></form>`;
   const form=root.querySelector('form');
   const status=form.querySelector('[role=status]');
   const submit=form.querySelector('[type=submit]');
   let token='';
   let sending=false;
   if(!recovering){
     const container=form.querySelector('[data-email-captcha]');
     const unavailable=()=>{
       token='';
       submit.disabled=true;
       status.textContent=t('emailAuth.captchaFailed');
     };
     void loadTurnstile().then(api=>{
       if(!container.isConnected)return;
       widget=api.render(container,{
         sitekey:turnstileSiteKey,size:'flexible',
         callback:value=>{token=value;submit.disabled=sending;},
         'expired-callback':()=>{token='';submit.disabled=true;},
         'error-callback':unavailable
       });
     }).catch(unavailable);
   }
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
     if(submit.disabled||(!recovering&&!token))return;
     sending=true;
     const values=new FormData(form);
     const email=String(values.get('email')||'').trim();
     const password=values.get('password');
     const buttons=[...form.querySelectorAll('button')];
     buttons.forEach(button=>button.disabled=true);
     try{
       const captchaToken=token;
       const redirect=location.origin+location.pathname+'?atlas-submissions=1';
       if(mode==='login'){
         const {error}=await db.auth.signInWithPassword({email,password,options:{captchaToken}});
         if(error)throw error;
         if(root.isConnected)await onLogin();
       }else if(mode==='signup'){
         const {data,error}=await db.auth.signUp({email,password,options:{emailRedirectTo:redirect,captchaToken}});
         if(error)throw error;
         if(data?.session)await db.auth.signOut({scope:'local'});
         status.textContent=t('emailAuth.checkInbox');
       }else if(mode==='forgot'){
         const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:redirect,captchaToken});
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
       sending=false;
       buttons.forEach(button=>button.disabled=false);
       if(!recovering){
         token='';
         submit.disabled=true;
         if(form.isConnected&&widget!==null)window.turnstile.reset(widget);
       }
     }
   };
 }
 draw();
}
