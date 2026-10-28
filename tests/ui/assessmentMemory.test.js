// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { createAssessmentMemory } from '../../src/ui/assessmentMemory.js';
import { mountPrecisionAssessment } from '../../src/ui/precisionAssessmentScreen.js';
import { mountKitingAssessment } from '../../src/ui/kitingAssessmentScreen.js';
import { mountReflexAssessment } from '../../src/ui/reflexAssessmentScreen.js';
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
const click=(screen,text)=>{const b=[...screen.querySelectorAll('button')].find(b=>b.textContent===text);expect(b,`button ${text}`).toBeTruthy();b.click();};
for(const [modality,mount] of [['precision',mountPrecisionAssessment],['kiting',mountKitingAssessment],['reflex',mountReflexAssessment]]) {
 it(`${modality}: keeps only complete real diagnostics across remount, retry/cancel and late loading; clears on disposal`,async()=>{
  const memory=createAssessmentMemory(),core=createCore(),screen=document.createElement('main');let current;
  const factory=vi.fn((_stage,options)=>{current=options;return {dispose(){}};});
  const loadPreview=async()=>({mountPreview:factory});let view=mount({screen,core,loadPreview,assessmentMemory:memory});
  expect(memory.get(modality)).toBeNull();click(screen,'Iniciar avaliação');await flush();
  for(let round=0;round<3;round++){
   const {session,exercise,onTick}=current;
   for(let frame=0;frame<245;frame++){session.update(.1);exercise.update?.(.1);onTick();}
   if(round<2){expect(memory.get(modality)).toBeNull();click(screen,'Próxima tentativa');await flush();}
  }
  expect(screen.textContent).toContain('Resultado da avaliação');const saved=memory.get(modality);expect(saved).toHaveLength(3);expect(Object.isFrozen(saved[0])).toBe(true);
  expect(screen.textContent).toContain('Resultado desta sessão');expect(memory.save(modality,[])).toBe(false);expect(memory.save('unknown',saved)).toBe(false);expect(memory.get(modality)).toEqual(saved);
  view.dispose();const calls=factory.mock.calls.length;
  view=mount({screen,core,loadPreview,assessmentMemory:memory});expect(screen.textContent).toContain('Resultado da avaliação');expect(factory).toHaveBeenCalledTimes(calls);
  click(screen,'Refazer avaliação');click(screen,'Iniciar avaliação');await flush();click(screen,'Cancelar avaliação');
  expect(memory.get(modality)).toEqual(saved);click(screen,'Ver última avaliação desta sessão');expect(screen.textContent).toContain('Resultado da avaliação');
  click(screen,'Refazer avaliação');let resolve;const deferred=new Promise(r=>{resolve=r;});view.dispose();view=mount({screen,core,loadPreview:()=>deferred,assessmentMemory:memory});click(screen,'Refazer avaliação');click(screen,'Iniciar avaliação');await flush();view.dispose();resolve({mountPreview:factory});await flush();expect(factory).toHaveBeenCalledTimes(calls+1);expect(memory.get(modality)).toEqual(saved);
  memory.dispose();expect(memory.get(modality)).toBeNull();expect(memory.save(modality,saved)).toBe(false);const fresh=createAssessmentMemory();expect(fresh.get(modality)).toBeNull();fresh.dispose();core.dispose();
 });
}

it('keeps a completed precision assessment through application navigation but not a new navigation instance',async()=>{
 const {mountNavigation}=await import('../../src/ui/navigation.js');const root=document.createElement('div');document.body.append(root);let current;
 const loadPreview=async()=>({mountPreview(_stage,options){current=options;return {dispose(){}};}});
 const go=path=>{window.history.replaceState(null,'',`#${path}`);window.dispatchEvent(new Event('hashchange'));};
 const core=createCore(),nav=mountNavigation({root,core,loadPreview});go('/assessment/precision');click(root,'Iniciar avaliação');await flush();
 for(let round=0;round<3;round++){
  const {session,onTick}=current;for(let frame=0;frame<245;frame++){session.update(.1);onTick();}
  if(round<2){click(root,'Próxima tentativa');await flush();}
 }
 expect(root.textContent).toContain('Resultado da avaliação');go('/');go('/assessment/precision');expect(root.textContent).toContain('Resultado desta sessão');expect(root.textContent).toContain('Resultado da avaliação');
 nav.dispose();core.dispose();const nextCore=createCore(),next=mountNavigation({root,core:nextCore,loadPreview});expect(root.textContent).not.toContain('Resultado da avaliação');expect(root.textContent).toContain('Iniciar avaliação');next.dispose();nextCore.dispose();root.remove();window.history.replaceState(null,'','/');
});
