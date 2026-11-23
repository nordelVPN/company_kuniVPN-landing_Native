const {t}=require('./i18n');
const message=(element,key)=>{if(!element)return;element.dataset.i18n=key;element.textContent=t(key);};
const controllers=new WeakMap();
function resetForm(form){form?.reset();}
function cancelForm(form){controllers.get(form)?.cancel();}
function initForms(){
 for(const button of document.querySelectorAll('[data-password]'))button.addEventListener('click',()=>{
  const input=document.getElementById(button.dataset.password);const show=input.type==='password';input.type=show?'text':'password';button.setAttribute('aria-pressed',String(show));message(button.querySelector('[data-password-label]')||button,show?'Скрыть':'Показать');button.dataset.i18nAriaLabel=show?'Скрыть':'Показать';button.setAttribute('aria-label',t(show?'Скрыть':'Показать'));
 });
 for(const form of document.querySelectorAll('[data-form]')){
  let attempted=false;let generation=0;
  const button=form.querySelector('[type="submit"]');
  const release=()=>{form.removeAttribute('aria-busy');if(button)button.disabled=form.dataset.form==='reset'&&form.dataset.tokenValid!=='true';};
  const inputs=[...form.querySelectorAll('input[required]')];
  const status=form.querySelector('[data-form-message]');
  const reset=()=>{attempted=false;generation++;release();message(status,'');for(const input of inputs){input.removeAttribute('aria-invalid');message(document.getElementById(input.id+'-error'),'');if(input.type==='text'&&input.hasAttribute('minlength'))input.type='password';}for(const control of form.querySelectorAll('[data-password]')){control.setAttribute('aria-pressed','false');message(control.querySelector('[data-password-label]')||control,'Показать');control.dataset.i18nAriaLabel='Показать';control.setAttribute('aria-label',t('Показать'));}};
  controllers.set(form,{cancel:()=>{generation++;release();message(status,'');}});
  form.addEventListener('reset',reset);
  const validate=input=>{
   let key='';
   if(input.dataset.confirm&&input.value!==document.getElementById(input.dataset.confirm).value)key='Passwords do not match.';
   else if(!input.validity.valid)key=input.type==='email'?'Enter a valid email address.':input.type==='password'?'Use at least 8 characters for this demo.':'Complete this field.';
   input.setAttribute('aria-invalid',String(Boolean(key)));
   message(document.getElementById(input.id+'-error'),key);return !key;
  };
  for(const input of inputs)input.addEventListener('input',()=>{
   message(status,'');if(attempted){validate(input);for(const other of inputs)if(other.dataset.confirm===input.id)validate(other);}
  });
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(form.getAttribute('aria-busy')==='true')return;attempted=true;const valid=inputs.map(validate).every(Boolean);
   if(!valid){message(status,'Check the highlighted fields.');inputs.find(input=>input.getAttribute('aria-invalid')==='true')?.focus();return;}
   if(form.dataset.form==='reset'&&form.dataset.tokenValid!=='true'){message(status,'This token cannot be verified. Request a new link.');return;}
   const operation=++generation;button.disabled=true;form.setAttribute('aria-busy','true');message(status,'Loading…');
   await new Promise(resolve=>window.setTimeout(resolve,300));
   if(operation!==generation)return;
   message(status,'Service unavailable: API is not connected. No data was sent.');release();
  });
 }
 const token=new URLSearchParams(location.search).get('token');
 if(token!==null&&document.querySelector('[data-reset]')){
  document.querySelector('[data-recovery]').hidden=true;document.querySelector('[data-reset]').hidden=false;
  const form=document.querySelector('[data-form="reset"]');form.dataset.tokenValid=String(token==='demo');
  message(document.querySelector('[data-token-state]'),token==='demo'?'Demo token. No password will be changed.':token==='expired'?'Demo: token expired. Request a new link.':'This token cannot be verified. Request a new link.');
  for(const input of form.querySelectorAll('input'))input.disabled=token!=='demo';
  form.querySelector('[type="submit"]').disabled=token!=='demo';
 }
 for(const button of document.querySelectorAll('[data-preview-recovery]'))button.addEventListener('click',()=>message(document.querySelector('[data-recovery-preview]'),button.dataset.previewRecovery==='confirmation'?'Demo confirmation. No email was sent.':'Demo retry. Submit the form to preview service unavailability.'));
}
module.exports={initForms,message,resetForm,cancelForm};
