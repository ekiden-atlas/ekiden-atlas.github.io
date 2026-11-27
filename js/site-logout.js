export function bindSiteLogout(root,db,t,onLogout){
 const button=root.querySelector('[data-site-logout]');
 if(!button)return;
 button.onclick=async()=>{
   if(button.disabled)return;
   button.disabled=true;
   try{
     const {error}=await db.auth.signOut({scope:'local'});
     if(error)throw error;
     if(button.isConnected)await onLogout();
   }catch{
     if(button.isConnected)root.querySelector('[data-logout-status]').textContent=t('siteLogoutFailed');
   }finally{button.disabled=false;}
 };
}

export function siteLogoutMarkup(t,E){
 return `<button class="btn btn-sm" type="button" data-site-logout>${E(t('logout'))}</button>
 <span role="status" data-logout-status></span>`;
}
