const {resetForm,cancelForm}=require('./forms');
function initCheckout(){
 const dialog=document.querySelector('#checkout');if(!dialog)return;
 const select=dialog.querySelector('[data-plan]');const form=dialog.querySelector('form');
 let opener;let closing;let savedOverflow='';let active=false;
 const update=()=>{
  for(const panel of dialog.querySelectorAll('[data-plan-summary]'))panel.hidden=panel.dataset.planSummary!==select.value;
  dialog.dataset.planId=select.value;
  for(const button of document.querySelectorAll('[data-open-checkout]')){
   const selected=button.dataset.openCheckout===select.value;
   button.setAttribute('aria-pressed',String(selected));button.closest('[data-plan-card]')?.classList.toggle('is-selected',selected);
  }
 };
 const restore=()=>{active=false;cancelForm(form);if(closing){window.clearTimeout(closing);closing=null;}dialog.classList.remove('is-visible');document.body.style.overflow=savedOverflow;opener?.focus();};
 const close=()=>{
  if(!dialog.open||closing)return;cancelForm(form);dialog.classList.remove('is-visible');
  closing=window.setTimeout(()=>{closing=null;dialog.close();},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:200);
 };
 for(const button of document.querySelectorAll('[data-open-checkout]'))button.addEventListener('click',()=>{
  if(closing){window.clearTimeout(closing);closing=null;}
  if(!dialog.open&&active){document.body.style.overflow=savedOverflow;active=false;}
  opener=button;select.value=button.dataset.openCheckout;update();resetForm(form);
  if(!dialog.open){savedOverflow=document.body.style.overflow;active=true;document.body.style.overflow='hidden';dialog.showModal();}
  window.requestAnimationFrame(()=>{if(dialog.open)dialog.classList.add('is-visible');});dialog.querySelector('[data-close-dialog]').focus();
 });
 select.addEventListener('change',()=>{resetForm(form);update();});
 // The initial list has no product recommendation or selected offer.
 for(const panel of dialog.querySelectorAll('[data-plan-summary]'))panel.hidden=panel.dataset.planSummary!==select.value;
 dialog.addEventListener('close',()=>{if(!dialog.open)restore();});
 dialog.querySelector('[data-close-dialog]').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
 dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...dialog.querySelectorAll('button,input,select,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
}
module.exports={initCheckout};
