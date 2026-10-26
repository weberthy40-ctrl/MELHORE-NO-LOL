// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountPrecisionAssessment } from '../../src/ui/precisionAssessmentScreen.js';
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
it('runs three real model rounds, pauses, shows diagnostic results and resets without persistence',async()=>{
 const screen=document.createElement('main'),core=createCore();let current;
 const dispose=vi.fn(),loadPreview=async()=>({mountPreview(_stage,options){current=options;return {dispose};}});
 const view=mountPrecisionAssessment({screen,core,loadPreview});screen.querySelector('button').click();await flush();
 for(let round=0;round<3;round++){
  const {session,exercise,onTick}=current;for(let i=0;i<31;i++)session.update(.1);onTick();session.pause();const elapsed=session.snapshot().elapsed;session.update(.1);expect(session.snapshot().elapsed).toBe(elapsed);session.resume();
  for(let i=0;i<15;i++)exercise.hit(exercise.snapshot().targets[0].id);
  for(let i=0;i<201;i++){session.update(.1);onTick();}
  expect(exercise.hit('late')).toBe(false);
  if(round<2)[...screen.querySelectorAll('button')].find(b=>b.textContent==='Próxima tentativa').click();await flush();
 }
 expect(screen.textContent).toContain('Nível inicial sugerido para treino: 10/10');expect(screen.textContent).toContain('não altera seu nível pessoal no Perfil');expect(dispose).toHaveBeenCalledTimes(3);
 [...screen.querySelectorAll('button')].find(b=>b.textContent==='Refazer avaliação').click();expect(screen.textContent).not.toContain('10/10');view.dispose();core.dispose();
});
it('ignores late scene imports after unmount and reports no fabricated recommendation',async()=>{
 const screen=document.createElement('main'),core=createCore();let resolve;const promise=new Promise(r=>{resolve=r;}),factory=vi.fn();
 const view=mountPrecisionAssessment({screen,core,loadPreview:()=>promise});screen.querySelector('button').click();await flush();view.dispose();resolve({mountPreview:factory});await flush();expect(factory).not.toHaveBeenCalled();expect(screen.children).toHaveLength(0);core.dispose();
});
