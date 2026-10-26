// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountKiting } from '../../src/ui/kitingScreen.js';
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
it('ends a fatal combat in a centered summary, saves it once and replays with full health',async()=>{
 const screen=document.createElement('main');screen.className='training-screen';document.body.append(screen);const core=createCore(),repository={saveCompletedAttempt:vi.fn(async()=>{})};let current;
 const view=mountKiting({screen,core,timed:true,initialLevel:5,repository,loadPreview:async()=>({mountPreview(_stage,options){current=options;return {movement:{snapshot:()=>({position:{x:0,z:0}})},dispose(){}};}})});await flush();[...screen.querySelectorAll('button')].find(b=>b.textContent==='Iniciar treino').click();const originalId=current.session.snapshot().id;
 for(let i=0;i<600&&!screen.querySelector('dialog').open;i++){const before=current.session.snapshot().elapsed;current.session.update(.1);current.exercise.update(current.session.snapshot().elapsed-before);current.onTick();}await flush();const dialog=screen.querySelector('dialog');expect(dialog.open).toBe(true);expect(dialog.hidden).toBe(false);expect(dialog.textContent).toContain('Derrota');expect(dialog.textContent).toContain('Vida 0/100');expect(dialog.querySelector('.result-actions').textContent).toContain('Voltar ao menu');expect(repository.saveCompletedAttempt).toHaveBeenCalledOnce();expect(repository.saveCompletedAttempt.mock.calls[0][0]).toMatchObject({variant:'combat',endReason:'defeat',metrics:{health:0,damageTaken:100}});
 dialog.querySelector('.result-actions button').click();await flush();expect(dialog.open).toBe(false);expect(current.session.snapshot().id).not.toBe(originalId);expect(current.exercise.snapshot()).toMatchObject({health:100,defeated:false});view.dispose();core.dispose();screen.remove();
});
