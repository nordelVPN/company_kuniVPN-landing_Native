const fs=require('node:fs');const assert=require('node:assert/strict');const webpack=require('webpack');const Server=require('webpack-dev-server');const config=require('../webpack/webpack.dev');
assert.equal(config.devServer.port,3000);
config.stats='errors-warnings';const compiler=webpack(config);const server=new Server({...config.devServer,port:0,host:'127.0.0.1',open:false},compiler);
const nextBuild=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Watch timed out')),15000);let done=false;compiler.hooks.done.tap('Probe'+Math.random(),stats=>{if(done)return;done=true;clearTimeout(timer);if(stats.hasErrors())reject(Error(stats.toString()));else resolve();});});
(async()=>{let browser;try{
 let ready=nextBuild();await server.start();await ready;const port=server.server.address().port;const url='http://127.0.0.1:'+port+'/index.html';
 assert.equal((await fetch(url)).status,200);
 browser=await require('@playwright/test').chromium.launch();const page=await browser.newPage();const connected=page.waitForEvent('console',{predicate:msg=>msg.text().includes('[webpack-dev-server] connected'),timeout:10000});await page.goto(url);await page.waitForFunction(()=>document.readyState==='complete');await connected;
 const contains=async expected=>{try{return(await page.content()).includes(expected);}catch(error){if(error.message.includes('navigating'))return false;throw error;}};
 for(const [file,change,expected]of [
 ['pages/index.hbs',s=>s.replace('id="home"','data-watch-probe="template" id="home"'),'data-watch-probe="template"'],
 ['src/templates/partials/footer.hbs',s=>s.replace('<footer','<footer data-watch-probe="partial"'),'data-watch-probe="partial"'],
 ['src/data/pages.js',s=>s.replace("price:55","price:56"),'>56<'],
 ['src/data/locales.json',s=>s.replace('"Freedom for"','"Watch probe English"'),'Watch probe English']
 ]){
  const original=fs.readFileSync(file,'utf8');try{ready=nextBuild();fs.writeFileSync(file,change(original));await ready;assert.ok((await(await fetch(url)).text()).includes(expected),file+' did not refresh');const deadline=Date.now()+10000;while(!await contains(expected)&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,100));assert.ok(await contains(expected),file+' did not live-reload in Chromium');}finally{ready=nextBuild();fs.writeFileSync(file,original);await ready;await page.waitForTimeout(300);await page.waitForLoadState('networkidle');}
 }
 console.log('Default port 3000; free-port override, HTTP and live template/partial/data/locale rebuilds and Chromium live reload passed. Files restored.');
 }finally{await browser?.close();await server.stop();compiler.close(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});
