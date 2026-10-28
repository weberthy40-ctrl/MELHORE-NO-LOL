import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

/** Controlled valid records in a dedicated native IndexedDB, never the player's database. */
export async function checkProfileAdvice(page){
 let primaryError,report;
 try{
 await page.go('/profile');await page.waitFor("document.querySelectorAll('.rank-badge').length===4");
 await page.evaluate(`(async()=>{
  const {adviceRecord}=await import('/tests/fixtures/adviceRecords.js');
  const {mountProfile}=await import('/src/ui/profileScreen.js');
  const {createAttemptRepository}=await import('/src/persistence/attemptRepository.js');
  const databaseName='rift-advice-qa-'+crypto.randomUUID(),repository=createAttemptRepository({databaseName});
  window.qaProfile={repository,databaseName,reads:0,writes:0};
  const records=['dodge','precision','kiting','reflex'].map(modality=>adviceRecord(modality));
  for(const record of records)await repository.saveCompletedAttempt(record);
  qaProfile.before=JSON.stringify(await repository.exportBackupData());
  const originalScan=repository.scanCompletedAttempts.bind(repository);
  const readOnly={scanCompletedAttempts(options){qaProfile.reads++;return originalScan(options);},saveCompletedAttempt(){qaProfile.writes++;throw new Error('Advice must never write');}};
  const screen=document.querySelector('main');screen.replaceChildren();
  qaProfile.view=mountProfile({screen,repository:readOnly});
 })()`);
  await page.waitFor("document.querySelectorAll('.training-advice[data-status=ready]').length===4");
  assert.equal(await page.evaluate('qaProfile.reads'),4);
  assert.equal(await page.evaluate('qaProfile.writes'),0);
  assert.equal(await page.evaluate("(async()=>JSON.stringify(await qaProfile.repository.exportBackupData())===qaProfile.before)()"),true);
  const reports=[];
  for(const width of [1366,390]){
   await page.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
   const layout=await page.evaluate(`(()=>{
    const links=[...document.querySelectorAll('.advice-action')];
    const link=document.querySelector('[data-mode=precision] .advice-action');link.scrollIntoView({block:'center',behavior:'instant'});link.focus({preventScroll:true});
    const r=link.getBoundingClientRect();
    return {paths:links.map(a=>a.hash),focused:document.activeElement===link,visible:r.top>=0&&r.bottom<=innerHeight,width:r.width,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth};
   })()`);
   assert.deepEqual(layout.paths,['#/train/dodge','#/timed/precision/3','#/timed/kiting/3','#/timed/reflex/3']);
   assert.equal(layout.focused,true);assert.equal(layout.visible,true);assert.equal(layout.overflow,false);assert.ok(layout.width>=44&&layout.height>=44);
   if(process.env.QA_ARTIFACT_DIR){await mkdir(process.env.QA_ARTIFACT_DIR,{recursive:true});const shot=await page.send('Page.captureScreenshot',{format:'png'});await writeFile(`${process.env.QA_ARTIFACT_DIR}/profile-advice-${width}.png`,Buffer.from(shot.data,'base64'));}
   reports.push({width,advice:4,reads:4,writes:0,overflow:false});
  }
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await page.waitFor("location.hash==='#/timed/precision/3'");
  await page.go('/');
  report={scope:'controlled records with native isolated IndexedDB; not official gameplay',keyboardAction:true,reports};
 }catch(error){primaryError=error;}
 try{
  await page.evaluate(`(async()=>{const state=window.qaProfile;if(!state)return;state.view?.dispose();state.repository.close();await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(state.databaseName);request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('QA database deletion blocked'));});delete window.qaProfile;})()`);
 }catch(cleanupError){
  if(primaryError)throw new AggregateError([primaryError,cleanupError],'Profile QA and cleanup both failed',{cause:cleanupError});
  throw cleanupError;
 }
 if(primaryError)throw primaryError;
 return report;
}
