const fs=require('node:fs');const assert=require('node:assert/strict');const {validateSite}=require('./site-contract');
const original=new Map(['index','forgot-password','create-account','account','login'].map(n=>[n+'.html',fs.readFileSync('build/prod/'+n+'.html','utf8')]));
const mutations=[
 files=>files.delete('account.html'),
 files=>files.set('index.html',files.get('index.html').replace(/id=(?:"security"|security)/,'id="removed-security"')),
 files=>files.set('index.html',files.get('index.html')+'<div id="home"></div>'),
 files=>files.set('index.html',files.get('index.html')+'<a href="#missing">bad</a>'),
 files=>files.set('account.html',files.get('account.html')+'<a href="./index.html#missing">bad</a>'),
 files=>files.set('index.html',files.get('index.html')+'<a href="./checkout.html">bad</a>')
];
for(const mutate of mutations){const files=new Map(original);mutate(files);assert.throws(()=>validateSite(files,()=>true));}
console.log('Six independent negative contract fixtures rejected.');
