const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('@playwright/test');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['scripts/serve.js'],{env:{...process.env,PORT:'3228'},stdio:'pipe'});
 let browser;
 const report={observations:[],errors:[]};
 try{
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3228/index.html')).ok)break;}catch{ /* Wait until this QA server is ready. */ }await sleep(100);}
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:320,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:3228/index.html#help-start');
  await page.locator('#language').selectOption('ru');
  await page.evaluate(()=>document.querySelector('#help-start').scrollIntoView());
  report.observations.push({name:'FAQ direct anchor 320 RU',data:await page.evaluate(()=>({headerBottom:document.querySelector('.header').getBoundingClientRect().bottom,summary:document.querySelector('#help-start summary').getBoundingClientRect().toJSON()}))});
  await page.screenshot({path:'docs/qa/recheck-visual/anchor-320.png'});
  await page.goto('http://127.0.0.1:3228/index.html');
  await page.locator('[data-open-checkout=trial]').click();
  await page.locator('#checkout-email').fill('sample@example.test');
  // Start an asynchronous prototype request, close and reopen before its timer completes.
  await page.evaluate(()=>{document.querySelector('#checkout form').requestSubmit();document.querySelector('#checkout [data-close-dialog]').click();});
  await page.locator('#checkout').waitFor({state:'hidden'});
  await page.locator('[data-open-checkout=yearly]').click();
  report.observations.push({name:'reopen while previous submit pending',data:await page.locator('#checkout').evaluate(d=>({plan:d.dataset.planId,email:d.querySelector('input').value,disabled:d.querySelector('[type=submit]').disabled,busy:d.querySelector('form').getAttribute('aria-busy'),message:d.querySelector('[data-form-message]').textContent}))});
  await sleep(400);
  report.observations.push({name:'old result after reopen',data:await page.locator('#checkout').evaluate(d=>({plan:d.dataset.planId,message:d.querySelector('[data-form-message]').textContent}))});
  await page.screenshot({path:'docs/qa/recheck-visual/checkout-stale-result.png'});
  await page.keyboard.press('Escape');
  await page.goto('http://127.0.0.1:3228/account.html');
  await page.locator('[data-tab=subscription]').click();await page.locator('#subscription-state').selectOption('active');
  report.observations.push({name:'active subscription plan count',data:await page.locator('[data-demo-state=active] .subscription-preview').count()});
  await page.goto('http://127.0.0.1:3228/index.html');
  const metrics=await page.evaluate(()=>{
   const lum=c=>{const vals=c.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});return vals[0]*.2126+vals[1]*.7152+vals[2]*.0722;};
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
   const failures=[];let count=0;
   for(const e of document.querySelectorAll('body *')){
    const cs=getComputedStyle(e);if(!e.getClientRects().length||cs.visibility==='hidden'||e.closest('button:disabled')||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    let bg;let a=e;let complex=false;
    while(a){const ac=getComputedStyle(a);if(ac.backgroundImage!=='none'){complex=true;break;}const c=rgb(ac.backgroundColor);if(c.length>=3&&(c.length===3||c[3]===1)){bg=c;break;}if(c[3]>0){complex=true;break;}a=a.parentElement;}
    if(complex||!bg)continue;
    const fg=rgb(cs.color);const l1=lum(fg),l2=lum(bg);const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);const size=parseFloat(cs.fontSize);const large=size>=24||(size>=18.66&&parseInt(cs.fontWeight)>=700);count++;
    if(ratio<(large?3:4.5))failures.push({tag:e.tagName,text:e.textContent.trim().slice(0,70),color:cs.color,background:bg,ratio:Math.round(ratio*100)/100,size});
   }
   return {count,failures,note:'Opaque flat backgrounds only; excludes images, gradients, opacity compositing and disabled controls.'};
  });
  report.observations.push({name:'computed flat-background text contrast',data:metrics});
 }catch(e){report.errors.push(e.stack);process.exitCode=1;}
 finally{if(browser)await browser.close();server.kill();fs.writeFileSync('docs/qa/recheck-edge.json',JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
