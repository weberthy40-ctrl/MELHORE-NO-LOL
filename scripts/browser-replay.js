import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { openBrowserPage } from './cdp.js';

// Controlled recording + real renderer: this composition is not an official attempt.
const page = await openBrowserPage();
const reports = [];
try {
  for (const width of [1366, 390]) {
    await page.send('Emulation.setDeviceMetricsOverride', {width, height: 844, deviceScaleFactor: 1, mobile: false});
    await page.evaluate(`(async () => {
      window.qaReplay?.dispose();
      const {mountDodgeReplayReview} = await import('/src/ui/dodgeReplayReview.js');
      const {createTechnicalDodge} = await import('/src/training/dodge/technicalDodge.js');
      const {createRandom} = await import('/src/core/random.js');
      const game = createTechnicalDodge({level: 9, rng: createRandom(42)});
      const frames = [];
      for(let i=0; i<=120; i++) {
        if(i) game.update(.05, {x:0,z:0}, {x:0,z:0});
        frames.push({time:i*.05, player:{x:0,z:0}, angle:0, snapshot:game.snapshot()});
      }
      game.dispose();
      const main = document.querySelector('main');main.classList.add('training-screen');
      main.replaceChildren();
      const dialog = document.createElement('dialog');dialog.className='result-metrics';
      const title = document.createElement('h2');title.textContent='Revisão de treino';
      const content = document.createElement('div');content.className='result-content';
      dialog.append(title, content);main.append(dialog);
      window.qaReplay = mountDodgeReplayReview({container:content, recording:{frames, counts:{arcane_bolt:1}, markers:[
        {time:4, variant:'arcane_bolt'}, {time:.25, variant:'cage'},
        {time:4, variant:'artillery'}, {time:6, variant:'sun_beam'}, {time:-1,variant:'cage'}
      ]}});
      dialog.showModal();
    })()`);
    await page.clickButton('Rever últimos 6 s', 'dialog');
    await page.waitFor("document.querySelector('.replay-stage')?.dataset.visuals==='ready'", {timeout:45000});
    assert.equal(await page.evaluate("document.querySelectorAll('.replay-event').length"), 4);
    // A native keyboard activation must seek to 1 s before contact, and pause.
    await page.evaluate("document.querySelectorAll('.replay-event')[1].focus()");
    assert.equal(await page.evaluate("document.activeElement===document.querySelectorAll('.replay-event')[1]"), true);
    assert.equal(await page.evaluate("document.querySelector('.replay-controls select').value"), '0.5');
    await page.clickButton('Reproduzir', 'dialog');
    await page.waitFor("Number(document.querySelector('.replay-controls input').value)>0");
    // Chromium needs the character event as well as keydown for native button activation.
    await page.send('Input.dispatchKeyEvent', {type:'keyDown', key:'Enter', code:'Enter', windowsVirtualKeyCode:13, text:'\r', unmodifiedText:'\r'});
    await page.send('Input.dispatchKeyEvent', {type:'keyUp', key:'Enter', code:'Enter', windowsVirtualKeyCode:13, nativeVirtualKeyCode:13});
    assert.equal(await page.evaluate("document.querySelector('.replay-controls input').value"), '60');
    assert.equal(await page.evaluate("document.querySelectorAll('.replay-event')[1].getAttribute('aria-pressed')"), 'true');
    assert.equal(await page.evaluate("document.querySelector('.replay-controls button').textContent"), 'Reproduzir');
    assert.equal(await page.evaluate("document.querySelector('main').scrollWidth<=innerWidth"), true);
    const size = await page.evaluate("(()=>{const r=document.querySelector('.replay-event').getBoundingClientRect();return {width:r.width,height:r.height};})()");
    assert.ok(size.width>=44 && size.height>=44, 'Event controls have usable click targets');
    assert.equal(await page.evaluate("(()=>{const b=document.querySelector('.replay-open'),r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()"), true, 'Close replay remains visible and reachable after focus scroll');
    if(process.env.QA_ARTIFACT_DIR) {
      await mkdir(process.env.QA_ARTIFACT_DIR, {recursive:true});
      const shot=await page.send('Page.captureScreenshot', {format:'png'});
      await writeFile(`${process.env.QA_ARTIFACT_DIR}/replay-${width}.png`, Buffer.from(shot.data,'base64'));
    }
    await page.clickButton('Fechar revisão', 'dialog');
    await page.waitFor("document.querySelector('.replay-stage canvas')===null");
    reports.push({width,events:4,keyboardSeekSeconds:3,closedWithoutCanvas:true});
    await page.evaluate("qaReplay.dispose();document.querySelector('dialog').close()");
  }
  assert.deepEqual(page.errors, []);
  console.log(JSON.stringify({status:'PASSOU',scope:'controlled recording, real WebGL and native keyboard; not official gameplay',reports}, null, 2));
} finally {
  await page.close();
}
