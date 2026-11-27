const {message}=require('./forms');
const {initAccountTabs}=require('./vpn-portal-sdk');
function initAccount(){
 const accountRoot=document.querySelector('.account-page');
 if(!accountRoot)return;
 window.__kuniAccountTabs=initAccountTabs(accountRoot,{defaultTab:'account'});
 for(const select of document.querySelectorAll('[data-demo-select]'))select.addEventListener('change',()=>{for(const panel of document.querySelectorAll('[data-demo-group="'+select.dataset.demoSelect+'"]'))panel.hidden=panel.dataset.demoState!==select.value;});
 document.querySelector('[data-edit-profile]')?.addEventListener('click',event=>{const form=document.querySelector('#profile-edit');form.hidden=!form.hidden;event.currentTarget.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)form.querySelector('input').focus();});
 for(const button of document.querySelectorAll('[data-account-action]'))button.addEventListener('click',()=>message(document.querySelector('[data-account-message]'),'Service unavailable: API is not connected. No data was sent.'));
 for(const button of document.querySelectorAll('[data-demo-retry]'))button.addEventListener('click',()=>{const select=document.querySelector('[data-demo-select="'+button.dataset.demoRetry+'"]');select.value='empty';select.dispatchEvent(new Event('change'));});
 document.querySelector('[data-preview-session]')?.addEventListener('click',()=>message(document.querySelector('[data-session-message]'),'Session expired. Please sign in again.'));
 document.querySelector('[data-signout]')?.addEventListener('click',()=>{if(window.confirm(require('./i18n').t('Sign out of your kuniVPN account?')))location.href='./login.html';});
}
module.exports={initAccount};
