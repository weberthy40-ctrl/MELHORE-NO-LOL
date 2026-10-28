import assert from 'node:assert/strict';
import {openBrowserPage} from './cdp.js';
import {checkProfileAdvice} from './browser-profile-cases.js';
import {checkAssessmentMemory} from './browser-assessment-cases.js';
const page=await openBrowserPage();
try{
 const report=await checkProfileAdvice(page);assert.deepEqual(page.errors,[]);
 const assessments=await checkAssessmentMemory(page);assert.deepEqual(page.errors,[]);
 console.log(JSON.stringify({status:'PASSOU',...report,assessments},null,2));
}finally{await page.close();}
