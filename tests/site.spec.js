const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.beforeEach(async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+' '+r.status());});page._errors=errors;
});
test.afterEach(async({page})=>{expect(page._errors).toEqual([]);});
for(const prefix of ['', '/preview']){
 test(prefix+' checkout: four plans, focus, close, keyboard and language',async({page})=>{
  await page.goto(prefix+'/index.html');const dialog=page.locator('#checkout');const ids=['trial','monthly','quarterly','yearly'];const prices=['1','7','15','55'];
  for(let i=0;i<ids.length;i++){
   const trigger=page.locator('[data-open-checkout="'+ids[i]+'"]');await trigger.click();
   await expect(dialog).toBeVisible();await expect(dialog).toHaveAttribute('data-plan-id',ids[i]);
   await expect(dialog.locator('[data-plan-summary="'+ids[i]+'"] .price')).toHaveText(prices[i]);
   await expect(dialog.locator('[data-plan-summary]:visible')).toHaveCount(1);
   await expect(page.locator('body')).toHaveCSS('overflow','hidden');
   await page.keyboard.press('Shift+Tab');await expect(dialog.locator('[type=submit]')).toBeFocused();
   await page.keyboard.press('Tab');await expect(dialog.locator('[data-close-dialog]')).toBeFocused();
   await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
  }
  await page.locator('[data-open-checkout=yearly]').click();await dialog.locator('[data-plan]').selectOption('monthly');await expect(dialog).toHaveAttribute('data-plan-id','monthly');
  await dialog.locator('[data-close-dialog]').click();await expect(dialog).not.toBeVisible();
  await page.locator('#language').selectOption('ru');await page.locator('[data-open-checkout=trial]').click();
  await expect(dialog.locator('[data-plan-summary=trial]')).toContainText('Один раз');
  await dialog.locator('[type=submit]').click();await expect(dialog.locator('#checkout-email')).toHaveAttribute('aria-invalid','true');
  await dialog.locator('#checkout-email').fill('demo@example.test');await expect(dialog.locator('#checkout-email')).toHaveAttribute('aria-invalid','false');
  await dialog.locator('[type=submit]').click();await expect(dialog.locator('[data-form-message]')).toContainText('API');
  await page.mouse.click(2,2);await expect(dialog).not.toBeVisible();
 });
 test(prefix+' auth: errors, correction, recovery, registration, persistence',async({page})=>{
  await page.goto(prefix+'/login.html');const form=page.locator('[data-form=login]');
  await form.locator('[type=submit]').click();await expect(form.locator('#email')).toBeFocused();
  await form.locator('#email').fill('demo@example.test');await expect(form.locator('#email')).toHaveAttribute('aria-invalid','false');await expect(form.locator('#password')).toHaveAttribute('aria-invalid','true');
  await form.locator('#password').fill('samplepass');await form.locator('[data-password]').click();await expect(form.locator('#password')).toHaveAttribute('type','text');
  await page.locator('#language').selectOption('ru');await expect(form.locator('[data-password]')).toHaveText('Скрыть');
  await form.locator('[type=submit]').click();await expect(form.locator('[data-form-message]')).toContainText('API');
  await form.locator('a[href="./create-account.html"]').click();await expect(page.locator('html')).toHaveAttribute('lang','ru');
  const register=page.locator('[data-form=register]');await register.locator('#register-email').fill('demo@example.test');await register.locator('#register-password').fill('samplepass');await register.locator('#register-confirm').fill('different');await register.locator('[type=submit]').click();await expect(register.locator('#register-confirm')).toHaveAttribute('aria-invalid','true');await register.locator('#register-confirm').fill('samplepass');await expect(register.locator('#register-confirm')).toHaveAttribute('aria-invalid','false');
  await register.locator('[type=submit]').click();await expect(register.locator('[data-form-message]')).toContainText('API');
  await page.goto(prefix+'/forgot-password.html?token=expired');await expect(page.locator('[data-token-state]')).toContainText('истёк');await expect(page.locator('[data-form=reset] [type=submit]')).toBeDisabled();
  await page.goto(prefix+'/forgot-password.html?token=demo');await expect(page.locator('[data-form=reset] [type=submit]')).toBeEnabled();
 });
 test(prefix+' support and mobile menu',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(prefix+'/index.html');
  await page.locator('[data-menu]').click();await page.locator('nav a[href="./index.html#support"]').click();await expect(page.locator('[data-menu]')).toHaveAttribute('aria-expanded','false');
  await page.locator('[data-topic=billing]').click();await expect(page.locator('[data-topic-card]:visible')).toHaveCount(1);
  await page.locator('[data-topic=all]').click();await page.locator('[data-search]').fill('not-found-zzzz');await expect(page.locator('[data-topic-card]:visible')).toHaveCount(0);
  await page.locator('[data-search]').fill('');await page.locator('[data-topic-card=contact]').click();await expect(page.locator('[data-topic-help]')).toBeVisible();await expect(page.locator('.faq')).toHaveCount(0);
  await page.locator('#language').selectOption('ru');await expect(page.locator('[data-topic-help]')).toContainText('Контакт');
 });
 test(prefix+' account tabs, edit, billing and subscription states',async({page})=>{
  await page.goto(prefix+'/account.html');await page.locator('[data-edit-profile]').click();await expect(page.locator('#profile-name')).toBeFocused();
  await page.locator('#profile-name').fill('Sample');await page.locator('#profile-edit [type=submit]').click();await expect(page.locator('#profile-edit [data-form-message]')).toContainText('API');
  await page.locator('[data-tab=account]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-tab=subscription]')).toBeFocused();await expect(page.locator('#panel-subscription')).toBeVisible();
  await page.locator('#subscription-state').selectOption('active');await expect(page.locator('[data-demo-group=subscription][data-demo-state=active]')).toContainText('55');
  await page.locator('#subscription-state').selectOption('expired');await expect(page.locator('[data-demo-group=subscription][data-demo-state=expired]')).toBeVisible();
  await page.locator('[data-tab=billing]').click();for(const state of ['loading','error','sample','empty']){await page.locator('#billing-state').selectOption(state);await expect(page.locator('[data-demo-group=billing][data-demo-state='+state+']:visible')).toHaveCount(2);}
  await page.locator('[data-tab=security]').click();await page.locator('[data-preview-session]').click();await expect(page.locator('[data-session-message]')).toContainText('expired');
  await page.locator('[data-tab=preferences]').click();await page.locator('#account-language').selectOption('ru');await expect(page.locator('#language')).toHaveValue('ru');await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','ru');
 });
}
test('responsive matrix and section screenshots',async({page,browserName})=>{
 fs.mkdirSync('docs/qa/screenshots',{recursive:true});
 for(const width of [320,375,390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('/index.html');await page.locator('#language').selectOption('ru');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  if(width<=390)for(const selector of ['.plans','.platform-grid','.topic-grid'])expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);
  if(browserName==='chromium')await page.locator('.header').screenshot({path:'docs/qa/screenshots/'+browserName+'-'+width+'-header.png'});
  if(browserName==='chromium'||width===390||width===1440)for(const id of ['home','features','apps','security','support','plans'])await page.locator('#'+id).screenshot({style:'.header,.skip{visibility:hidden!important}',path:'docs/qa/screenshots/'+browserName+'-'+width+'-'+id+'.png'});
  await page.locator('[data-open-checkout=trial]').click();await expect(page.locator('#checkout')).toBeVisible();if(width===390||width===1440)await page.locator('#checkout').screenshot({path:'docs/qa/screenshots/'+browserName+'-'+width+'-checkout.png'});await expect.poll(()=>page.locator('#checkout').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);if(width===390){await page.setViewportSize({width,height:420});await page.locator('#checkout-email').scrollIntoViewIfNeeded();await expect(page.locator('#checkout-email')).toBeInViewport();await page.locator('#checkout [type=submit]').scrollIntoViewIfNeeded();await expect(page.locator('#checkout [type=submit]')).toBeInViewport();await page.setViewportSize({width,height:1000});}
  await page.keyboard.press('Escape');await expect(page.locator('#checkout')).not.toBeVisible();
  for(const file of ['login','forgot-password','create-account','account']){await page.goto('/'+file+'.html');if(width===390||width===1440)await page.locator('main').screenshot({style:'.header,.skip{visibility:hidden!important}',path:'docs/qa/screenshots/'+browserName+'-'+width+'-'+file+'.png'});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('/index.html');await page.evaluate(()=>{document.documentElement.style.zoom='2';});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('reduced motion and blocked storage',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});});await page.goto('/index.html');await expect(page.locator('html')).toHaveAttribute('lang','en');await page.locator('#language').selectOption('ru');await expect(page.locator('html')).toHaveAttribute('lang','ru');await page.locator('[data-open-checkout=trial]').click();await expect(page.locator('#checkout')).toHaveCSS('transition-duration','0s');await page.keyboard.press('Escape');await expect(page.locator('#checkout')).not.toBeVisible();
});

test('removed preview and home benefits',async({page})=>{await page.goto('/index.html');await expect(page.locator('.product-preview,.faq,[data-faq]')).toHaveCount(0);await expect(page.locator('#home + .benefit-dark article')).toHaveCount(4);await expect(page.locator('#home .button.large svg')).toHaveCount(2);});
