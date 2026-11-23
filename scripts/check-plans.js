const assert=require('node:assert/strict');const fs=require('node:fs');
const {plans}=require('../src/data/pages');
assert.deepEqual(plans.map(({id,price,devices})=>[id,price,devices]),[['trial',1,5],['monthly',7,5],['quarterly',15,5],['yearly',55,5]]);
assert.equal(plans[2].monthlyEquivalent,'5');assert.equal(plans[3].monthlyEquivalent,(55/12).toFixed(2));
const html=fs.readFileSync('build/prod/index.html','utf8');
for(const plan of plans)assert.ok(html.includes('data-open-checkout="'+plan.id+'"')||html.includes('data-open-checkout='+plan.id));
console.log('Plan model and four dialog triggers passed; interactions covered in Playwright.');
