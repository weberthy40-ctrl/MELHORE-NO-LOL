import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

/** Native DOM/lifecycle with real assessment engines and a controlled renderer/clock. Not WebGL or player calibration. */
export async function checkAssessmentMemory(page){
 const reports=[];
 for(const modality of ['precision','kiting','reflex']){
  await page.go(`/assessment/${modality}`);
  await page.evaluate(`(async()=>{
   const {createCore}=await import('/src/core/createCore.js');
   const {createAssessmentMemory}=await import('/src/ui/assessmentMemory.js');
   const module=await import('/src/ui/${modality}AssessmentScreen.js');
   const mount=module[Object.keys(module).find(key=>key.startsWith('mount'))];
   const core=createCore(),memory=createAssessmentMemory(),screen=document.querySelector('main');
   screen.replaceChildren();const state=window.qaAssessment={core,memory,screen,mount};
   state.loadPreview=async()=>({mountPreview(_stage,frame){state.frame=frame;return {dispose(){}};}});
   state.view=mount({screen,core,assessmentMemory:memory,loadPreview:state.loadPreview});
  })()`);
  try{
   await page.clickButton('Iniciar avaliação');
   for(let round=0;round<3;round++){
    await page.waitFor('Boolean(qaAssessment.frame)');
    await page.evaluate(`(()=>{const {session,exercise,onTick}=qaAssessment.frame;delete qaAssessment.frame;for(let i=0;i<245;i++){session.update(.1);exercise.update?.(.1);onTick();}})()`);
    if(round<2)await page.clickButton('Próxima tentativa');
   }
   assert.equal(await page.evaluate(`qaAssessment.memory.get('${modality}').length`),3);
   await page.evaluate(`(()=>{const q=qaAssessment;q.before=JSON.stringify(q.memory.get('${modality}'));q.view.dispose();q.view=q.mount({screen:q.screen,core:q.core,assessmentMemory:q.memory,loadPreview:q.loadPreview});})()`);
   assert.equal(await page.evaluate("document.querySelector('main').textContent.includes('Resultado desta sessão')"),true);
   for(const width of [1366,390]){
    await page.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});
    const layout=await page.evaluate(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent==='Refazer avaliação');b.scrollIntoView({block:'center',behavior:'instant'});b.focus({preventScroll:true});const r=b.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,visible:r.top>=0&&r.bottom<=innerHeight,reachable:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b};})()`);
    assert.equal(layout.overflow,false);assert.equal(layout.visible,true);assert.equal(layout.reachable,true);
    if(process.env.QA_ARTIFACT_DIR){await mkdir(process.env.QA_ARTIFACT_DIR,{recursive:true});await writeFile(`${process.env.QA_ARTIFACT_DIR}/assessment-${modality}-${width}.png`,Buffer.from((await page.send('Page.captureScreenshot',{format:'png'})).data,'base64'));}
   }
   await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:600,deviceScaleFactor:1,mobile:false});
   await page.evaluate('scrollTo(0,0)');
   await page.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:200,y:300,deltaX:0,deltaY:700});
   await page.waitFor('scrollY>0',{timeout:2000});
   await page.clickButton('Refazer avaliação');await page.clickButton('Iniciar avaliação');await page.waitFor('Boolean(qaAssessment.frame)');await page.clickButton('Cancelar avaliação');
   await page.clickButton('Ver última avaliação desta sessão');assert.equal(await page.evaluate(`qaAssessment.before===JSON.stringify(qaAssessment.memory.get('${modality}'))`),true);
   reports.push({modality,restored:true,cancelPreserved:true,widths:[1366,390]});
  }finally{
   await page.evaluate('(()=>{const q=window.qaAssessment;q?.view.dispose();q?.memory.dispose();q?.core.dispose();delete window.qaAssessment;})()');
  }
 }
 await page.go('/');return {scope:'real engines, controlled renderer/clock, native DOM; no official gameplay',reports};
}
