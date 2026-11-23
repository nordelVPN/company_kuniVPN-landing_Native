const fs=require('node:fs');const path=require('node:path');
const {validateSite}=require('./site-contract');
const root=path.resolve(__dirname,'../build/prod');
const files=new Map(fs.readdirSync(root).filter(f=>f.endsWith('.html')).map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
validateSite(files,target=>fs.existsSync(path.join(root,target)));
console.log('Validated five pages, section order, unique IDs, fragment links, assets and dialog.');
require('./check-plans');require('./check-i18n');require('./check-contract-negative');
