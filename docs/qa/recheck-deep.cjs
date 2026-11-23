const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('@playwright/test');
const sharp=require('sharp');
const out=path.join(__dirname,'recheck-visual');
fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['scripts/serve.js'],{env:{...process.env,PORT:'3227'},stdio:'pipe'});
 let browser;
 const report={environment:{node:process.version,date:new Date().toISOString()},observations:[],errors:[]};
 try{
  for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:3227/index.html');if(r.ok)break;}catch{ /* Wait until this QA server is ready. */ }await sleep(100);}
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1672,height:941},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto('http://127.0.0.1:3227/index.html');
  await page.locator('#language').selectOption('en');
  for(const id of ['home','features','apps','security','support','plans','login']){
   await page.locator('#'+id).scrollIntoViewIfNeeded();
   await page.locator('#'+id+' img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));});
   await page.locator('#'+id).screenshot({style:'.header,.skip{visibility:hidden!important}',path:out+'/en-1672-'+id+'.png'});
   await sharp(out+'/en-1672-'+id+'.png').resize({width:960}).jpeg({quality:75}).toFile(out+'/en-'+id+'.jpg');
  }
  report.observations.push({name:'desktop layout',data:await page.evaluate(()=>({headerHeight:document.querySelector('.header').getBoundingClientRect().height,font:getComputedStyle(document.querySelector('h1')).fontFamily,heroHeight:document.querySelector('#home').getBoundingClientRect().height,artWidth:document.querySelector('#home picture').getBoundingClientRect().width,featureTitleSize:getComputedStyle(document.querySelector('#features h2')).fontSize,platformIconSources:[...document.querySelectorAll('.platform-card h3 img')].map(i=>i.getAttribute('src')),securityIconPaths:[...document.querySelectorAll('.security-points svg')].map(x=>x.innerHTML),everydayIcons:[...document.querySelectorAll('.everyday svg')].map(x=>x.innerHTML)}))});
  await page.locator('[data-open-checkout=yearly]').click();
  await page.locator('#checkout-email').fill('first@example.test');
  await page.locator('#checkout [type=submit]').click();
  await page.locator('#checkout [data-form-message]').filter({hasText:'API'}).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('#checkout').waitFor({state:'hidden'});
  await page.locator('[data-open-checkout=monthly]').click();
  report.observations.push({name:'checkout reopen',data:await page.locator('#checkout').evaluate(d=>({plan:d.dataset.planId,select:d.querySelector('[data-plan]').value,email:d.querySelector('input').value,status:d.querySelector('[data-form-message]').textContent,busy:d.querySelector('form').getAttribute('aria-busy')}))});
  await page.locator('#checkout-email').fill('bad');
  report.observations.push({name:'checkout validation before new submit',data:await page.locator('#checkout-email').getAttribute('aria-invalid')});
  await page.keyboard.press('Escape');
  for(const width of [320,375,390,768,1024,1440]){
   await page.setViewportSize({width,height:900});
   await page.goto('http://127.0.0.1:3227/index.html#login');
   await page.locator('#language').selectOption('ru');
   await page.locator('#login').scrollIntoViewIfNeeded();
   const targets=await page.evaluate(()=>[...document.querySelectorAll('a,button,input,select,summary,label.check')].filter(e=>e.getClientRects().length&&!e.disabled&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,text:e.textContent.trim().slice(0,70),w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10};}).filter(x=>x.w<44||x.h<44));
   report.observations.push({name:'targets '+width,data:targets});
   await page.locator('.header-actions a[href="./index.html#apps"]').click();
   const anchor=await page.evaluate(()=>({headerBottom:document.querySelector('.header').getBoundingClientRect().bottom,sectionTop:document.querySelector('#apps').getBoundingClientRect().top,scrollPadding:getComputedStyle(document.documentElement).scrollPaddingTop}));
   report.observations.push({name:'anchor '+width,data:anchor});
   if(width===320||width===390){
    for(const id of ['home','features','apps','security','support','plans','login']){
     await page.locator('#'+id).screenshot({style:'.header,.skip{visibility:hidden!important}',path:out+'/ru-'+width+'-'+id+'.png'});
     await sharp(out+'/ru-'+width+'-'+id+'.png').resize({width:390}).jpeg({quality:70}).toFile(out+'/ru-'+width+'-'+id+'.jpg');
    }
   }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3227/account.html');
  report.observations.push({name:'mobile account help',data:{helpLinks:await page.locator('a[href="./index.html#support"]').count(),visibleHelpLinks:await page.locator('a[href="./index.html#support"]:visible').count()}});
  await page.locator('[data-tab=subscription]').click();await page.locator('#subscription-state').selectOption('active');
  report.observations.push({name:'active subscription',data:await page.locator('[data-demo-state=active]').innerText()});
  await page.locator('main').screenshot({style:'.header,.skip{visibility:hidden!important}',path:out+'/mobile-account-active.png'});
  const nojs=await browser.newContext({javaScriptEnabled:false});
  const p=await nojs.newPage();await p.goto('http://127.0.0.1:3227/index.html');
  report.observations.push({name:'noJS content',data:{h1:await p.locator('h1').innerText(),plans:await p.locator('[data-plan-card]').count(),login:await p.locator('[data-form=login]').count()}});
  await nojs.close();
 }catch(e){report.errors.push(e.stack);process.exitCode=1;}
 finally{if(browser)await browser.close();server.kill();fs.writeFileSync(path.join(__dirname,'recheck-deep.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
