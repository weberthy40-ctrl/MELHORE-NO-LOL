// @vitest-environment jsdom
import * as THREE from 'three';
import {afterEach, expect, it, vi} from 'vitest';
import {createCore} from '../../src/core/createCore.js';
import {mountNavigation} from '../../src/ui/navigation.js';
import {attachPreviewControls} from '../../src/game3d/previewControls.js';
import {seedDodgePlacement} from '../fixtures/dodgePlacement.js';

const cleanups=[];
afterEach(()=>{
 cleanups.splice(0).reverse().forEach(cleanup=>cleanup());
 document.body.replaceChildren();window.localStorage.clear();window.history.replaceState(null,'','/');vi.restoreAllMocks();
});
function harness(mode,seed){
 vi.spyOn(document,'hidden','get').mockReturnValue(false);
 const random=window.crypto.getRandomValues.bind(window.crypto);
 vi.spyOn(window.crypto,'getRandomValues').mockImplementation(array=>array instanceof Uint32Array&&array.length===1?(array[0]=seed,array):random(array));
 if(mode==='normal')seedDodgePlacement(window.localStorage,5);
 window.history.replaceState(null,'',`#/play/dodge/${mode}/5`);
 const root=document.createElement('div');document.body.append(root);const core=createCore(),displayed=[],damage=[];let tick,live,controls;
 core.events.on('dodge:damage',event=>damage.push(event));
 const repository={saveCompletedAttempt:vi.fn(async()=>({status:'saved'})),close:vi.fn()};
 const navigation=mountNavigation({root,core,attemptRepository:repository,loadPreview:async()=>({mountPreview(stage,options){
  stage.dataset.visuals='ready';
  if(options.controls===false)return {presentFrame:frame=>displayed.push(frame),dispose(){}};
  live=options;const canvas=document.createElement('canvas');stage.append(canvas);
  controls=attachPreviewControls({...options,container:stage,renderer:{domElement:canvas},camera:new THREE.PerspectiveCamera(44,1.6,.1,160),character:{setPose(){}},visuals:{sync(){}},render(){},requestFrame:callback=>{tick=callback;return 1;},cancelFrame:()=>{tick=null;}});
  return {movement:controls.movement,dispose:()=>{controls.dispose();canvas.remove();}};
 }})});
 cleanups.push(()=>{navigation.dispose();core.dispose();});
 return {root,core,displayed,damage,repository,get live(){return live;},get controls(){return controls;},advance(time){tick(time);}};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
for(const [mode,seed,fatal]of [['survival',1,2.3],['normal',2,5.65]])it(`keeps the real off-grid fatal frame navigable in ${mode}`,async()=>{
 const h=harness(mode,seed);await flush();h.root.querySelector('.arena-ready button').click();h.advance(0);
 for(let frame=1;frame<2400&&h.live.session.snapshot().state==='running';frame++)h.advance(frame*25);
 expect(h.live.session.snapshot().state).toBe('completed');expect(h.damage.at(-1).elapsed).toBeCloseTo(fatal);
 expect(h.live.exercise.snapshot().elapsed).toBeCloseTo(h.damage.at(-1).elapsed);
 const originalMetrics=h.live.exercise.snapshot(),position=h.controls.movement.snapshot().position;
 h.root.querySelector('.replay-open').click();await flush();
 const slider=h.root.querySelector('.replay-controls input');slider.value=slider.max;slider.dispatchEvent(new Event('input'));
 const last=h.displayed.at(-1);
 // Before E008 the final 25 ms were discarded by the 50 ms sample gate.
 expect(last.time).toBeCloseTo(h.damage.at(-1).elapsed,10);
 expect(last.snapshot.projectiles).toEqual(originalMetrics.projectiles);expect(last.player).toEqual(position);
 const contacts=[...h.root.querySelectorAll('.replay-event')];
 expect(contacts.at(-1).textContent).toContain(`${h.damage.at(-1).elapsed.toFixed(2)} s`);
 contacts.at(-1).click();expect(h.displayed.at(-1).time).toBeLessThanOrEqual(last.time-1+1e-8);
 expect(h.live.session.snapshot().state).toBe('completed');expect(h.live.exercise.snapshot()).toEqual(originalMetrics);
 expect(h.repository.saveCompletedAttempt).toHaveBeenCalledTimes(1);
});
it('captures the actual paused state on manual analysis without adding pause time or manufacturing contacts',async()=>{
 const h=harness('survival',1);await flush();h.root.querySelector('.arena-ready button').click();h.advance(0);
 for(let n=1;n<=9;n++)h.advance(n*25);
 const elapsed=h.live.session.snapshot().elapsed;h.live.session.pause();h.advance(1000);
 expect(h.live.session.snapshot().elapsed).toBe(elapsed);
 h.root.querySelector('.dodge-analyze').click();expect(h.live.session.snapshot().state).toBe('completed');
 h.root.querySelector('.replay-open').click();await flush();
 const slider=h.root.querySelector('.replay-controls input');slider.value=slider.max;slider.dispatchEvent(new Event('input'));
 expect(h.displayed.at(-1).time).toBe(elapsed);expect(h.root.querySelectorAll('.replay-event')).toHaveLength(0);
 expect(h.repository.saveCompletedAttempt).not.toHaveBeenCalled();
});
it('does not create a result on abandonment and gives the restarted attempt its own terminal recording',async()=>{
 const h=harness('survival',1);await flush();h.root.querySelector('.arena-ready button').click();h.advance(0);h.advance(25);
 const old=h.live.session.snapshot().id;
 window.history.replaceState(null,'','#/');window.dispatchEvent(new Event('hashchange'));
 expect(h.root.querySelector('dialog')).toBeNull();expect(h.repository.saveCompletedAttempt).not.toHaveBeenCalled();
 window.history.replaceState(null,'','#/play/dodge/survival/5');window.dispatchEvent(new Event('hashchange'));await flush();
 expect(h.live.session.snapshot().id).not.toBe(old);h.root.querySelector('.arena-ready button').click();h.advance(0);
 for(let n=1;n<2400&&h.live.session.snapshot().state==='running';n++)h.advance(n*25);
 expect(h.root.querySelector('dialog').open).toBe(true);
 expect(h.root.querySelectorAll('.replay-event')).toHaveLength(1);expect(h.repository.saveCompletedAttempt).toHaveBeenCalledTimes(1);
});
