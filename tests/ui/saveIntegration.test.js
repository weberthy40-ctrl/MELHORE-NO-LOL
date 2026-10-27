// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { seedDodgePlacement } from '../fixtures/dodgePlacement.js';
import { createCore } from '../../src/core/createCore.js';
import { mountNavigation } from '../../src/ui/navigation.js';
it('a committed eligible result updates the active screen status',async()=>{
 const root=document.createElement('div');document.body.append(root);window.history.replaceState(null,'','#/play/dodge/normal/1');
 seedDodgePlacement(window.localStorage,1);const core=createCore(),repository={saveCompletedAttempt:vi.fn().mockResolvedValue({status:'saved'}),close:vi.fn()};let options;
 const navigation=mountNavigation({root,core,attemptRepository:repository,loadPreview:async()=>({mountPreview:(_container,value)=>{options=value;return {dispose:vi.fn()};}})});
 await Promise.resolve();await Promise.resolve();
 while(options.session.snapshot().state==='countdown')options.session.update(.1);
 let id=0;
 for(let frame=0;frame<600;frame++){
  const before=options.session.snapshot().elapsed;options.session.update(.1);const dt=options.session.snapshot().elapsed-before;
  if(frame%100===50){const attackId=`projectile-${++id}`,attemptId=options.session.snapshot().id;
   core.events.emit('dodge:spawn',{id:attackId,attemptId});
   core.events.emit('dodge:trajectory',{id:attackId,attemptId,radius:.2,from:{x:-2,z:1},to:{x:2,z:1},playerFrom:{x:0,z:0},playerTo:{x:0,z:0}});
   core.events.emit('dodge:removed',{id:attackId,attemptId,reason:'expired'});
  }
  options.onStep(dt,{x:0,z:0},{x:0,z:0});options.onTick();
 }
 expect(repository.saveCompletedAttempt).not.toHaveBeenCalled();[...root.querySelectorAll('button')].find(b=>b.textContent==='Encerrar e analisar').click();options.onStep(0,{x:0,z:0},{x:0,z:0});options.onTick();await Promise.resolve();await Promise.resolve();
 expect(repository.saveCompletedAttempt).toHaveBeenCalledTimes(1);expect(root.textContent).toContain('Salvo neste dispositivo');
 options.onTick();expect(repository.saveCompletedAttempt).toHaveBeenCalledTimes(1);
 navigation.dispose();core.dispose();window.localStorage.clear();root.remove();window.history.replaceState(null,'','/');
});
