// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountReflexAssessment } from '../../src/ui/reflexAssessmentScreen.js';
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
it('reuses the real reaction engine for three short stages and resets the transient recommendation',async()=>{
 let clock=0,current;vi.spyOn(window.performance,'now').mockImplementation(()=>clock);const core=createCore(),screen=document.createElement('main');document.body.append(screen);const dispose=vi.fn();
 const view=mountReflexAssessment({screen,core,loadPreview:async()=>({mountPreview(_stage,options){current=options;return {dispose};}})});screen.querySelector('button').click();await flush();
 for(let round=0;round<3;round++){
  const {session,exercise,onTick}=current;let visibleAt=null;
  for(let frame=0;frame<245;frame++){clock+=100;session.update(.1);exercise.update(.1);onTick();const p=exercise.snapshot();if(p.phase==='cue-visible'){visibleAt??=clock;if(clock-visibleAt>=200)exercise.snapshot().cue?.answer&&exercise.respond(exercise.snapshot().cue.answer,clock);}else visibleAt=null;}
  if(round<2){[...screen.querySelectorAll('button')].find(b=>b.textContent==='Próxima tentativa').click();await flush();}
 }
 expect(screen.textContent).toContain('Nível inicial sugerido: 9/10');expect(screen.textContent).toContain('não altera sua classificação');expect(dispose).toHaveBeenCalledTimes(3);[...screen.querySelectorAll('button')].find(b=>b.textContent==='Refazer avaliação').click();expect(screen.textContent).not.toContain('9/10');view.dispose();core.dispose();screen.remove();
});
