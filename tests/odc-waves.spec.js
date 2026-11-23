const {test,expect}=require('@playwright/test');
test('ODC waves: full width, typography, scene geometry and support in EN/RU',async({page})=>{
 test.setTimeout(40000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1440,1672,1920,2560])for(const lang of ['en','ru']){
 await page.setViewportSize({width,height:1100});await page.goto('/index.html');await page.locator('#language').selectOption(lang);await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.faq,[data-faq],.product-preview')).toHaveCount(0);
 await expect(page.locator('#home + .benefit-dark article')).toHaveCount(4);
 await expect(page.locator('.topic-card')).toHaveCount(4);
 await expect(page.locator('.topic-arrow')).toHaveCount(4);
 await expect(page.locator('[data-open-checkout]')).toHaveCount(4);
 const result=await page.evaluate(()=>{
 const overlaps=[];for(const id of ['home','features','apps','security','support']){
 const section=document.getElementById(id),art=section.querySelector('.section-art').getBoundingClientRect();
 const copy=section.querySelector(id==='home'?'.hero-copy':id==='security'?':scope>div':'.hero>div').getBoundingClientRect();
 if(Math.min(art.right,copy.right)-Math.max(art.left,copy.left)>1&&Math.min(art.bottom,copy.bottom)-Math.max(art.top,copy.top)>1)overlaps.push(id);
 }
 return{width:innerWidth,scroll:document.documentElement.scrollWidth,header:document.querySelector('.header').getBoundingClientRect().width,home:document.querySelector('#home').getBoundingClientRect().width,overlaps,font:document.fonts.check('700 24px Montserrat'),footer:document.querySelector('.footer').textContent};
 });
 expect(result.scroll).toBe(result.width);expect(result.header).toBe(result.width);expect(result.home).toBe(result.width);expect(result.overlaps).toEqual([]);expect(result.font).toBe(true);expect(result.footer).not.toMatch(/prototype|прототип|Project in development|Проект в разработке/);
 for(const topic of ['start','trouble','billing','contact']){await page.locator('[data-topic-card='+topic+']').click();await expect(page.locator('[data-topic-help]')).not.toBeEmpty();}
 await page.locator('[data-search]').fill(lang==='en'?'billing':'оплат');await expect(page.locator('[data-topic-card]:visible')).toHaveCount(1);
 }
 expect(errors).toEqual([]);
});
