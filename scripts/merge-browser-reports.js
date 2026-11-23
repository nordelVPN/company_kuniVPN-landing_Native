const fs=require('node:fs');const assert=require('node:assert/strict');
const reports=Object.fromEntries(['chromium','firefox','webkit'].map(name=>[name,JSON.parse(fs.readFileSync('docs/qa/browser-results-'+name+'.json','utf8'))]));
for(const report of Object.values(reports)){assert.equal(report.stats.unexpected,0);assert.equal(report.stats.expected,17);assert.equal(report.stats.skipped,0);}
fs.writeFileSync('docs/qa/browser-results.json',JSON.stringify({kind:'per-browser-run-summary',reports:Object.fromEntries(Object.entries(reports).map(([name,report])=>[name,{file:'browser-results-'+name+'.json',stats:report.stats}])),totalPassed:Object.values(reports).reduce((total,report)=>total+report.stats.expected,0)},null,2)+'\n');
console.log(Object.values(reports).reduce((total,report)=>total+report.stats.expected,0)+' browser scenarios passed across three complete independent runs.');
