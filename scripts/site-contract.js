const assert=require('node:assert/strict');
const expected=['account.html','create-account.html','forgot-password.html','index.html','login.html','privacy.html','terms.html'];
const sections=['home','features','apps','security','support','plans'];
function attributes(html,name){return [...html.matchAll(new RegExp('\\b'+name+'=(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\\s>]+))','g'))].map(m=>m[1]??m[2]??m[3]);}
function validateSite(files,exists){
 assert.deepEqual([...files.keys()].sort(),expected,'Expected seven HTML pages');
 const ids=new Map();
 for(const [file,html]of files){assert.equal((html.match(/<h1[ >]/g)||[]).length,1,'One H1: '+file);const values=attributes(html,'id');assert.equal(new Set(values).size,values.length,'Duplicate ID: '+file);ids.set(file,new Set(values));assert.ok(!/(?:checkout|features|apps|security|support|plans)\.html/.test(html),'Legacy route: '+file);}
 const index=files.get('index.html');let last=-1;
 for(const id of sections){const pos=[...ids.get('index.html')].indexOf(id);assert.ok(ids.get('index.html').has(id),'Missing section '+id);assert.ok(pos>last,'Section order '+id);last=pos;}
 assert.ok(!ids.get('index.html').has('login'),'Login belongs on its own page');assert.ok(ids.get('login.html').has('login'),'Missing login page form');
 assert.match(index,/<dialog\b/);assert.equal((index.match(/data-open-checkout=/g)||[]).length,4);
 for(const [file,html]of files)for(const name of ['href','src','srcset'])for(const raw of attributes(html,name)){
  const url=raw.split(' ')[0];if(/^(https?:|mailto:|data:)/.test(url))continue;
  assert.ok(!url.startsWith('/'),'Absolute URL '+url);
  const [pathname,hash]=url.split('#');const target=pathname?pathname.replace(/^\.\//,'').split('?')[0]:file;
  assert.ok(!target.includes('..'),'Unsafe path '+url);
  if(hash){assert.ok(ids.has(target)&&ids.get(target).has(hash),'Missing anchor '+url);}
  else assert.ok(files.has(target)||exists(target),'Missing asset '+url);
 }
 return true;
}
module.exports={validateSite,attributes};
