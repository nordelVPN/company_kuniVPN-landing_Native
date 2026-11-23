const fs=require('node:fs');const {spawn}=require('node:child_process');const {chromium}=require('@playwright/test');const sharp=require('sharp');
const out='docs/qa/dqa-fixes';fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{const server=spawn(process.execPath,['scripts/serve.js'],{env:{...process.env,PORT:'3229'},stdio:'pipe'});let browser;
 const report={environment:{node:process.version,date:new Date().toISOString()},geometry:[],errors:[],cropNote:'Actuals are individual sections with header/skip hidden only for screenshots. References are full original PNGs, including header. CSS scale in the gallery is equal for a given viewport, not pixel-diff.'};
 try{
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3229/index.html')).ok)break;}catch{/* Wait for owned server. */}await sleep(100);}
  browser=await chromium.launch();const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',error=>report.errors.push(error.message));
  for(const width of [320,375,390,1440,1672])for(const language of ['en','ru']){
   await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:3229/index.html');await page.locator('#language').selectOption(language);
   for(const id of ['home','features','apps','security','support','plans','login']){
    const section=page.locator('#'+id);const height=Math.ceil((await section.boundingBox()).height);await page.setViewportSize({width,height:Math.max(1000,height+256)});await section.scrollIntoViewIfNeeded();await section.locator('img').evaluateAll(async images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
    const file=language+'-'+width+'-'+id;await section.screenshot({style:'.header,.skip{visibility:hidden!important}',path:out+'/'+file+'.png'});
    await sharp(out+'/'+file+'.png').resize({width:width>1000?1100:width}).jpeg({quality:70}).toFile(out+'/'+file+'.jpg');
    report.geometry.push({width,language,section:id,viewportHeight:page.viewportSize().height,box:await section.boundingBox(),art:await section.locator('.section-art').count()?await section.locator('.section-art').boundingBox():null});await page.setViewportSize({width,height:1000});
   }
   if(width===390||width===1440){for(const name of ['account','forgot-password','create-account']){await page.goto('http://127.0.0.1:3229/'+name+'.html');await page.locator('main').screenshot({style:'.header,.skip{visibility:hidden!important}',path:out+'/'+language+'-'+width+'-'+name+'.png'});}}
  }
  const refs={home:'01-home',features:'02-features',apps:'03-apps',security:'04-security',support:'05-support',plans:'07-plans',login:'06-login'};
  let html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>DQA fixes: references and actual</title><style>body{background:#222;color:#fff;font:16px Arial;margin:24px}a{color:#ff941f}article{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;margin-bottom:60px}img{width:100%;height:auto}h2{grid-column:1/-1}figure{margin:0}figcaption{padding:12px;background:#111}@media(max-width:800px){article{grid-template-columns:1fr}}</style><h1>DQA fixes</h1><p>Source: full PNG with header. Actual: section at viewport 1672, without sticky header. Viewport height expands to fit each section; width remains 1672. Same display scale; different crop/height. No pixel-perfect claim.</p><a href="../dqa-fixes.md">Report</a>';
  for(const [id,name]of Object.entries(refs))html+='<article><h2>'+id+'</h2><figure><img src="../../images/consept/desktop/'+name+'.png"><figcaption>Original '+name+'</figcaption></figure><figure><img src="en-1672-'+id+'.png"><figcaption>Actual EN / 1672</figcaption></figure></article>';
  html+='<h2>RU and mobile</h2>';for(const width of [320,375,390,1440,1672])for(const language of ['en','ru']){html+='<p>'+language+' '+width+': ';for(const id of Object.keys(refs))html+='<a href="'+language+'-'+width+'-'+id+'.png">'+id+'</a> ';html+='</p>';}html+='</html>';
  fs.writeFileSync(out+'/index.html',html);if(report.errors.length)process.exitCode=1;
 }finally{await browser?.close();server.kill();fs.writeFileSync(out+'/capture.json',JSON.stringify(report,null,2));}
 console.log(JSON.stringify({captures:report.geometry.length,errors:report.errors}));
})().catch(error=>{console.error(error);process.exitCode=1;});
