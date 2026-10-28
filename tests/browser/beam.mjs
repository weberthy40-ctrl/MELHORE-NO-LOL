import console from 'node:console';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openBrowserPage,pause} from '../../scripts/cdp.js';
const page=await openBrowserPage();
const out=process.env.QA_ARTIFACT_DIR??'/tmp/rift-beam-evidence';await mkdir(out,{recursive:true});
async function shot(name){await writeFile(`${out}/${name}.png`,Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));}
try{
 await page.go('/profile');await page.waitFor("document.querySelectorAll('.rank-badge').length===4");
 await page.evaluate(`window.qaBeamCounts=async()=>{const result=[];for(const item of await indexedDB.databases()){if(!item.name)continue;const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(item.name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const stores=[];for(const name of db.objectStoreNames){const count=await new Promise((resolve,reject)=>{const r=db.transaction(name).objectStore(name).count();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});stores.push([name,count]);}db.close();result.push([item.name,stores]);}return JSON.stringify(result);}`);
 const before=await page.evaluate('qaBeamCounts()');
 await page.go('/train/dodge');assert.equal(await page.evaluate("Boolean(document.querySelector('a[href=\"#/drill/dodge/sidestep\"]'))"),true);
 await page.go('/drill/dodge/sidestep');await page.waitFor("document.querySelector('.arena-ready button')?.disabled===false",{timeout:45000});
 await page.send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});await shot('beam-ready');
 assert.match(await page.evaluate("document.querySelector('.dodge-drill-status').textContent"),/0.0 \/ 45/);
 await page.evaluate("document.querySelector('.arena-ready button').focus()");await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await page.waitFor("!document.querySelector('.arena-ready')");await pause(2000);await page.clickButton('Pausar');const frozen=await page.evaluate("document.querySelector('.dodge-drill-status').textContent");await pause(700);assert.equal(await page.evaluate("document.querySelector('.dodge-drill-status').textContent"),frozen);await page.clickButton('Retomar');
 await page.mouse({x:800,y:550},'right');await shot('beam-playing');
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:600,deviceScaleFactor:1,mobile:false});assert.equal(await page.evaluate('document.documentElement.scrollWidth>innerWidth'),false);await shot('beam-playing-390');await page.send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
 await page.waitFor("document.querySelector('.dodge-drill-result')?.hidden===false",{timeout:90000});
 assert.match(await page.evaluate("document.querySelector('.dodge-drill-result').textContent"),/45 segundos ativos/);
 for(const width of [1366,390]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});const layout=await page.evaluate("(()=>{const b=document.querySelector('.dodge-drill-result button');b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,visible:r.top>=0&&r.bottom<=innerHeight,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b};})()");assert.deepEqual(layout,{overflow:false,visible:true,hit:true});await shot(`beam-result-${width}`);}
 assert.equal(await page.evaluate('qaBeamCounts()'),before,'No additional persistent records');
 await page.clickButton('Repetir série');await page.waitFor("document.querySelector('.arena-ready button')?.disabled===false",{timeout:45000});assert.match(await page.evaluate("document.querySelector('.dodge-drill-status').textContent"),/0.0 \/ 45/);await page.go('/');await page.waitFor("document.querySelectorAll('canvas').length===0");assert.deepEqual(page.errors,[]);
 console.log(JSON.stringify({status:'PASSOU',nativeWebGL:true,seconds:45,pauseFrozen:true,restart:true,storageCountsUnchanged:true,viewports:[1366,390]}));
}finally{await page.close();}
