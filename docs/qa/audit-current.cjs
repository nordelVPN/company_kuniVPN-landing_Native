// Run from repository root: node docs/qa/audit-current.cjs
// Read-only probes of current production output and real modules; no browser emulation claim.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const manifest = require(path.join(root,'webpack/pages'));
const dict = require(path.join(root,'src/data/locales.json'));
console.log('MANIFEST',manifest.map(p=>p.name).join(','));
const home = read('build/prod/index.html');
for (const id of ['home','features','apps','security','support','plans','login'])
 console.log('SECTION',id,new RegExp('id=["\']'+id+'["\']').test(home));
for (const name of ['forgot-password','create-account'])
 console.log('SERVICE_PAGE',name,fs.existsSync(path.join(root,'build/prod',name+'.html')));
console.log('DIALOG',/<dialog\b|role="dialog"/.test(home));
for(const lang of Object.keys(dict)){
 const missing=Object.keys(dict.en).filter(key=>!Object.hasOwn(dict[lang],key));
 console.log('DICTIONARY',lang,'keys',Object.keys(dict[lang]).length,'missing',missing.length);
 assert.equal(missing.length,0);
}
const listeners={};
const invalid={validity:{valid:false},attrs:{},setAttribute(k,v){this.attrs[k]=v;},focus(){this.focused=true;}};
const message={dataset:{},textContent:''};
let valid=false;
const form={querySelectorAll:()=>[invalid],checkValidity:()=>valid,querySelector:()=>invalid};
const document={
 querySelector:s=>s==='[data-login]'?{addEventListener:(e,cb)=>{listeners[e]=cb;}}:s==='#form-message'?message:null,
 querySelectorAll:()=>[],addEventListener:()=>{}
};
vm.runInNewContext(read('src/modules/main.js'),{
 require:()=>({t:k=>k,init:()=>{}}),document,location:{pathname:'/login.html',search:''},URL,URLSearchParams
});
listeners.submit({preventDefault(){},currentTarget:form});
assert.equal(invalid.attrs['aria-invalid'],'true');
assert.equal(invalid.focused,true);
console.log('LOGIN_INVALID_SUBMIT','PASS: invalid marked and focused');
invalid.validity.valid=true;
// There is no input/change handler in the module to clear an obsolete error.
console.log('LOGIN_AFTER_CORRECTION','aria-invalid='+invalid.attrs['aria-invalid'],'message='+message.textContent);
assert.equal(invalid.attrs['aria-invalid'],'true');
valid=true;
listeners.submit({preventDefault(){},currentTarget:form});
assert.equal(invalid.attrs['aria-invalid'],'false');
assert.ok(message.textContent.includes('API'));
console.log('LOGIN_VALID_SUBMIT','PASS: explicitly unavailable; no false authentication success');
const login=read('build/prod/login.html');
for(const token of ['forgot-password.html','create-account.html','type="checkbox"'])
 console.log('LOGIN_COMPONENT',token,login.includes(token));
const checker=read('scripts/check-build.js');
console.log('CHECKER_SKIPS_FRAGMENT_URLS',checker.includes("url.startsWith('#')"));
console.log('PROBES_FINISHED');
