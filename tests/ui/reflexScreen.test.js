// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountReflex } from '../../src/ui/reflexScreen.js';
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
it('ignores editing, repeats, held keys and input after unmount while preserving technical counts',async()=>{
 let clock=0,current;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);const screen=document.createElement('main');document.body.append(screen);const core=createCore(),dispose=vi.fn();
 const view=mountReflex({screen,core,loadPreview:async()=>({mountPreview(_stage,options){current=options;return {dispose};}})});await flush();[...screen.querySelectorAll('button')].find(b=>b.textContent==='Iniciar prática').click();
 for(let i=0;i<31;i++){clock+=100;current.session.update(.1);current.exercise.update(.1);current.onTick();}
 const key=(repeat=false,target=window)=>{const event=new KeyboardEvent('keydown',{code:'Space',key:' ',repeat,bubbles:true});Object.defineProperty(event,'timeStamp',{value:clock});target.dispatchEvent(event);};
 const input=document.createElement('input');screen.append(input);key(false,input);window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));expect(current.exercise.snapshot().rounds).toHaveLength(0);
 key();key(true);expect(current.exercise.snapshot().rounds).toHaveLength(1);expect(current.exercise.snapshot().rounds[0].status).toBe('anticipated');key();expect(current.exercise.snapshot().rounds).toHaveLength(1);window.dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));
 const previous=current;view.dispose();key();expect(previous.exercise.snapshot().rounds).toHaveLength(1);expect(dispose).toHaveBeenCalledTimes(1);core.dispose();screen.remove();
});
it('applies the chosen exercise and level before starting and rejects stale imports',async()=>{
 let current;const core=createCore(),screen=document.createElement('main'),view=mountReflex({screen,core,timed:true,loadPreview:async()=>({mountPreview(_stage,options){current=options;return {dispose(){}};}})});await flush();const [variant,level]=screen.querySelectorAll('select');variant.value='direction';level.value='10';variant.dispatchEvent(new Event('change'));await flush();expect(current.exercise.config).toMatchObject({variant:'direction',level:10,responseWindow:850});view.dispose();core.dispose();
});
