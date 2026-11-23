const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page._errors=errors;});
test.afterEach(async({page})=>expect(page._errors).toEqual([]));
for(const prefix of ['', '/preview']){
 test(prefix+' DQA checkout resets operations, validation and selected offer',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(prefix+'/index.html');
  for(const id of ['trial','monthly','quarterly','yearly']){
   await page.locator('[data-open-checkout=trial]').click();
   await page.locator('#checkout-email').fill('sample@example.test');await page.locator('#payment-method').selectOption('wallet');
   await page.evaluate(next=>{
    const dialog=document.querySelector('#checkout');dialog.querySelector('form').requestSubmit();dialog.close();document.querySelector('[data-open-checkout="'+next+'"]').click();
   },id);
   await expect(page.locator('#checkout')).toHaveAttribute('data-plan-id',id);
   await expect(page.locator('#checkout [type=submit]')).toBeEnabled();
   await expect(page.locator('#checkout form')).not.toHaveAttribute('aria-busy','true');
   await expect(page.locator('#checkout-email')).toHaveValue('');await expect(page.locator('#payment-method')).toHaveValue('card');
   await page.waitForTimeout(400);
   await expect(page.locator('#checkout [data-form-message]')).toBeEmpty();
   await page.locator('#checkout-email').fill('bad');
   await expect(page.locator('#checkout-email')).not.toHaveAttribute('aria-invalid','true');
   await page.locator('#checkout [type=submit]').click();await expect(page.locator('#checkout-email')).toHaveAttribute('aria-invalid','true');
   await page.keyboard.press('Escape');await expect(page.locator('#checkout')).not.toBeVisible();
   await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
  }
  await page.locator('[data-open-checkout=trial]').click();await page.locator('#checkout-email').fill('sample@example.test');
  await page.locator('#checkout [type=submit]').click();await expect(page.locator('#checkout [data-form-message]')).toContainText('API');
  await page.keyboard.press('Escape');await expect(page.locator('#checkout')).not.toBeVisible();
  await page.locator('[data-open-checkout=yearly]').click();await page.locator('#checkout-email').fill('bad');await expect(page.locator('#checkout-email')).not.toHaveAttribute('aria-invalid','true');
  await page.locator('#checkout-email').fill('sample@example.test');
  await page.evaluate(()=>{document.querySelector('#checkout form').requestSubmit();const select=document.querySelector('#checkout-plan');select.value='quarterly';select.dispatchEvent(new Event('change'));});
  await page.waitForTimeout(400);await expect(page.locator('#checkout [data-form-message]')).toBeEmpty();await expect(page.locator('#checkout [type=submit]')).toBeEnabled();await expect(page.locator('#checkout-email')).toHaveValue('');
  await expect(page.locator('[data-plan-card].is-selected')).toHaveCount(1);await expect(page.locator('[data-open-checkout=quarterly]')).toHaveAttribute('aria-pressed','true');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{document.querySelector('#checkout [data-close-dialog]').click();document.querySelector('[data-open-checkout=monthly]').click();});
  await page.waitForTimeout(250);await expect(page.locator('#checkout')).toBeVisible();await expect(page.locator('#checkout')).toHaveAttribute('data-plan-id','monthly');await expect(page.locator('body')).toHaveCSS('overflow','hidden');
  await page.keyboard.press('Escape');await expect(page.locator('#checkout')).not.toBeVisible();await expect(page.locator('[data-open-checkout=monthly]')).toBeFocused();await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
 });
 test(prefix+' DQA account overview, one subscription, help and semantic icons',async({page})=>{
  await page.goto(prefix+'/account.html');
  await expect(page.locator('#panel-account .account-overview')).toBeVisible();
  await expect(page.locator('#panel-account .card:visible')).toHaveCount(4);
  await page.locator('#panel-account [data-open-tab=subscription]').click();
  await page.locator('#subscription-state').selectOption('active');
  await expect(page.locator('[data-demo-state=active] .subscription-preview')).toHaveCount(1);
  await expect(page.locator('[data-subscription-plan=yearly] .price')).toHaveText('55');
  await expect(page.locator('[data-demo-state=active]')).toContainText('5 devices');
  for(const state of ['expired','empty']){await page.locator('#subscription-state').selectOption(state);await expect(page.locator('[data-demo-state=active]')).not.toBeVisible();}
  const icons=await page.locator('[data-tab] svg').evaluateAll(nodes=>nodes.map(node=>node.innerHTML));expect(new Set(icons).size).toBe(5);
  await page.setViewportSize({width:320,height:900});await expect(page.locator('.account-sidebar .help-card')).toBeVisible();
  await expect(page.locator('.account-sidebar .help-card a')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
test('DQA anchors and 44px effective targets in both languages',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,375,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const language of ['en','ru']){
   await page.goto('/index.html#support');await page.locator('#language').selectOption(language);
   const visible=()=>page.evaluate(()=>document.querySelector('#support').getBoundingClientRect().top>=document.querySelector('.header').getBoundingClientRect().bottom+7);
   await expect.poll(visible).toBe(true);
   if(width<1181){await page.locator('[data-menu]').click();await page.locator('nav a[href="./index.html#support"]').click();await expect(page.locator('[data-menu]')).toHaveAttribute('aria-expanded','false');await expect.poll(visible).toBe(true);await page.locator('[data-topic-card=start]').click();await expect(page.locator('[data-topic-help]')).toBeVisible();}
   await page.goto('/login.html');await page.locator('#language').selectOption(language);
   const tooSmall=await page.locator('.brand,.form-options a,label.check,[data-form=login] p a,.footer a').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>({text:node.textContent.trim(),w:node.getBoundingClientRect().width,h:node.getBoundingClientRect().height})).filter(r=>r.w<43.9||r.h<43.9));expect(tooSmall).toEqual([]);
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('/index.html#support');await page.locator('#language').selectOption('ru');await page.evaluate(()=>document.documentElement.style.zoom='2');
 await expect.poll(()=>page.evaluate(()=>document.querySelector('#support').getBoundingClientRect().top>=document.querySelector('.header').getBoundingClientRect().bottom+7)).toBe(true);
});
test('DQA icon meaning, version availability and mobile auth order',async({page})=>{
 await page.goto('/index.html');
 for(const selector of ['.everyday svg','.security-points svg']){const paths=await page.locator(selector).evaluateAll(nodes=>nodes.map(node=>node.innerHTML));expect(new Set(paths).size).toBe(paths.length);}
 await expect(page.locator('.platform-card details')).toHaveCount(0);await expect(page.locator('.platform-card .version-status')).toHaveCount(5);
 for(const width of [1440,1672]){await page.setViewportSize({width,height:1000});for(const id of ['home','features','apps','security','support']){const bounds=await page.locator('#'+id).evaluate(section=>{const outer=section.getBoundingClientRect(),art=section.querySelector('.section-art').getBoundingClientRect();return{top:art.top-outer.top,bottom:outer.bottom-art.bottom};});expect(bounds.top,id+' artwork top').toBeGreaterThanOrEqual(-1);expect(bounds.bottom,id+' artwork bottom').toBeGreaterThanOrEqual(-1);}}
 await expect(page.locator('[data-plan-card] .plan-calendar')).toHaveCount(0);await expect(page.locator('[data-plan-card].is-selected')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 for(const file of ['login','forgot-password','create-account']){await page.goto('/'+file+'.html');expect(await page.locator('.form-card').evaluate(el=>el.getBoundingClientRect().top)).toBeLessThan(await page.locator('.auth-art').evaluate(el=>el.getBoundingClientRect().top));}
});
