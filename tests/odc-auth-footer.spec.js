const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('ODC login route, complete footer and uncropped auth artwork',async({page,browserName})=>{
 test.setTimeout(45000);
 fs.mkdirSync('docs/qa/odc-auth-footer',{recursive:true});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const language of ['en','ru']){
   for(const file of ['index','login','create-account','forgot-password','account']){
    await page.goto('/'+file+'.html');await page.locator('#language').selectOption(language);
    const headerLinks=await page.locator('.header a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    const footerLinks=await page.locator('.footer a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    for(const href of headerLinks)expect(footerLinks).toContain(href);
    for(const href of footerLinks){const url=new URL(href,page.url());const response=await page.request.get(url.href);expect(response.ok(),href).toBe(true);if(url.hash)expect(await response.text()).toMatch(new RegExp('id=(?:"'+url.hash.slice(1)+'"|'+url.hash.slice(1)+'[ >])'));}
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(file==='index')await expect(page.locator('[data-form=login]')).toHaveCount(0);
    if(['login','create-account','forgot-password'].includes(file)){
     const art=page.locator('main .auth-art');
     expect(await art.evaluate(el=>getComputedStyle(el).overflow)).toBe('visible');
     const fits=await art.evaluate(el=>{const a=el.getBoundingClientRect(),i=el.querySelector('img').getBoundingClientRect();return i.left>=a.left&&i.right<=a.right&&i.top>=a.top&&i.bottom<=a.bottom;});expect(fits).toBe(true);
     if(browserName==='chromium'&&file==='login'&&width!==768)await page.locator('#login').screenshot({path:'docs/qa/odc-auth-footer/after-'+width+'-'+language+'-login.png'});
    }
    if(browserName==='chromium'&&file==='index'&&width!==768)await page.locator('.footer').screenshot({path:'docs/qa/odc-auth-footer/after-'+width+'-'+language+'-footer.png'});
   }
  }
 }
 await page.goto('/preview/index.html');await page.locator('.header-actions a[href="./login.html"]').click();await expect(page).toHaveURL(/\/preview\/login.html$/);
 await page.locator('#email').fill('demo@example.test');await page.locator('#password').fill('samplepass');await page.locator('[data-form=login] [type=submit]').click();await expect(page.locator('[data-form=login]')).toHaveAttribute('aria-busy','true');await expect(page.locator('[data-form-message]')).toContainText('API');
});
