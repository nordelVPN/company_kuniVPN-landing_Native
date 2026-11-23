const {spawnSync}=require('node:child_process');const path=require('node:path');
const browser=process.argv[2];if(!['chromium','firefox','webkit'].includes(browser))throw Error('Pass chromium, firefox or webkit');
const result=spawnSync(process.execPath,[require.resolve('@playwright/test/cli'),'test','--project='+browser],{stdio:'inherit',env:{...process.env,QA_REPORT:path.resolve('docs/qa/browser-results-'+browser+'.json')}});
process.exitCode=result.status??1;
