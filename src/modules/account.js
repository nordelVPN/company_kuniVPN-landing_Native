const {message}=require('./forms');
function initAccount(){
 const tabs=[...document.querySelectorAll('[data-tab]')];
 const activate=tab=>{for(const item of tabs){const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!active;}};
 for(const tab of tabs){tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{let i=tabs.indexOf(tab);if(event.key==='ArrowRight'||event.key==='ArrowDown')i=(i+1)%tabs.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')i=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=tabs.length-1;else return;event.preventDefault();activate(tabs[i]);tabs[i].focus();});}
 for(const button of document.querySelectorAll('[data-open-tab]'))button.addEventListener('click',()=>{const tab=tabs.find(item=>item.dataset.tab===button.dataset.openTab);if(tab){activate(tab);tab.focus();}});
 for(const select of document.querySelectorAll('[data-demo-select]'))select.addEventListener('change',()=>{for(const panel of document.querySelectorAll('[data-demo-group="'+select.dataset.demoSelect+'"]'))panel.hidden=panel.dataset.demoState!==select.value;});
 document.querySelector('[data-edit-profile]')?.addEventListener('click',event=>{const form=document.querySelector('#profile-edit');form.hidden=!form.hidden;event.currentTarget.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden)form.querySelector('input').focus();});
 for(const button of document.querySelectorAll('[data-account-action]'))button.addEventListener('click',()=>message(document.querySelector('[data-account-message]'),'Service unavailable: API is not connected. No data was sent.'));
 for(const button of document.querySelectorAll('[data-demo-retry]'))button.addEventListener('click',()=>{const select=document.querySelector('[data-demo-select="'+button.dataset.demoRetry+'"]');select.value='empty';select.dispatchEvent(new Event('change'));});
 document.querySelector('[data-preview-session]')?.addEventListener('click',()=>message(document.querySelector('[data-session-message]'),'Demo: session expired. Sign in again.'));
 document.querySelector('[data-signout]')?.addEventListener('click',()=>{if(window.confirm(require('./i18n').t('Leave the local prototype? No real session exists.')))location.href='./index.html#login';});
}
module.exports={initAccount};
