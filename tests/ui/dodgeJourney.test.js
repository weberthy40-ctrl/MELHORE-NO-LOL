// @vitest-environment jsdom
import { it,expect,afterEach,vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountNavigation } from '../../src/ui/navigation.js';
import { readDodgePlacement } from '../../src/progression/dodgePlacement.js';
import { seedDodgePlacement } from '../fixtures/dodgePlacement.js';
const cleanups=[];afterEach(()=>{cleanups.splice(0).forEach(f=>f());document.body.replaceChildren();localStorage.clear();history.replaceState(null,'','/');});
const settle=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};
function mount(){let frame;const root=document.createElement('div');document.body.append(root);const core=createCore(),repository={close(){},saveCompletedAttempt:vi.fn().mockResolvedValue({status:'saved'})},view=mountNavigation({root,core,attemptRepository:repository,loadPreview:async()=>({mountPreview(_stage,options){_stage.dataset.visuals='ready';frame=options;return {dispose(){}};}})});cleanups.push(()=>{view.dispose();core.dispose();});return {root,core,repository,get frame(){return frame;}};}
function go(path){history.replaceState(null,'',`#${path}`);window.dispatchEvent(new Event('hashchange'));}
it('gates direct Normal URLs, resumes only the assigned level and removes obsolete practice routes',async()=>{
 const app=mount();go('/play/dodge/normal/20');expect(location.hash).toBe('#/assessment/dodge');expect(app.root.textContent).toContain('Iniciar avaliação');expect(app.root.querySelector('.stage')).toBeNull();seedDodgePlacement(localStorage,6);go('/play/dodge/normal/20');await settle();expect(location.hash).toBe('#/play/dodge/normal/6');expect(app.frame.exercise.snapshot().level).toBe(6);go('/train/dodge');expect(app.root.querySelector('.placement-evidence').textContent).toContain('Ver minha avaliação');expect(app.root.querySelectorAll('.placement-evidence li')).toHaveLength(3);
 for(const old of ['/dodge-tech/6','/practice/dodge','/practice/dodge/micro/6']){go(old);expect(app.root.querySelector('.stage')).toBeNull();expect(app.root.textContent).not.toContain('sem pontuação');expect(app.root.textContent).not.toContain('Laboratório');}
});
it('lets Survival select and launch level twenty without any placement',async()=>{
 const app=mount();go('/train/dodge');const select=app.root.querySelector('[aria-label="Nível da Sobrevivência"]');expect(select.options).toHaveLength(20);select.value='20';select.dispatchEvent(new Event('change'));const play=[...app.root.querySelectorAll('a')].find(a=>a.textContent==='Jogar Sobrevivência →');expect(play.hash).toBe('#/play/dodge/survival/20');go(play.hash.slice(1));await settle();expect(app.frame.exercise.snapshot().level).toBe(20);expect(app.root.textContent).toContain('Vidas: 1/1');expect(readDodgePlacement(localStorage)).toBeNull();
});
it('persists a real completed five-round adaptive diagnostic before opening Normal automatically',async()=>{
 const app=mount();go('/assessment/dodge');[...app.root.querySelectorAll('button')].find(b=>b.textContent==='Iniciar avaliação').click();await settle();
 for(let round=0;round<5;round++){const f=app.frame;expect(f.session.snapshot().state).toBe('idle');app.root.querySelector('.arena-ready button').click();expect(f.session.snapshot().state).toBe('running');for(let hit=1;hit<=3;hit++){for(let tick=0;tick<10;tick++){f.session.update(.1);f.onStep(.1,{x:0,z:0},{x:0,z:0});}const event={attemptId:f.session.snapshot().id,id:`projectile-${hit}`,variant:'arcane_bolt'};app.core.events.emit('dodge:spawn',event);app.core.events.emit('dodge:impact',event);f.onStep(0,{x:0,z:0},{x:0,z:0});f.onTick();}
  if(round<4){expect(readDodgePlacement(localStorage)).toBeNull();[...app.root.querySelectorAll('button')].find(b=>b.textContent==='Próxima tentativa').click();await settle();}
 }
 expect(readDodgePlacement(localStorage).level).toBe(1);expect(location.hash).toBe('#/play/dodge/normal/1');window.dispatchEvent(new Event('hashchange'));await settle();expect(app.frame.exercise.snapshot().level).toBe(1);expect(app.root.textContent).toContain('Vidas: 3/3');expect(app.repository.saveCompletedAttempt).not.toHaveBeenCalled();go('/train/dodge');expect(app.root.querySelectorAll('.placement-evidence li')).toHaveLength(5);
});
it('advances Normal only after the qualifying attempt is saved successfully',async()=>{
 seedDodgePlacement(localStorage,1);const app=mount();let resolveSave;app.repository.saveCompletedAttempt.mockImplementation(()=>new Promise(resolve=>{resolveSave=resolve;}));go('/play/dodge/normal');await settle();const f=app.frame;expect(f.session.snapshot().state).toBe('idle');app.root.querySelector('.arena-ready button').click();expect(f.session.snapshot().state).toBe('running');
 for(let tick=0;tick<460;tick++){f.session.update(.1);if(tick%20===0){const event={attemptId:f.session.snapshot().id,id:`projectile-${tick/20+1}`};app.core.events.emit('dodge:spawn',event);app.core.events.emit('dodge:trajectory',{...event,radius:.2,from:{x:-2,z:1},to:{x:2,z:1},playerFrom:{x:0,z:0},playerTo:{x:0,z:0}});app.core.events.emit('dodge:removed',{...event,reason:'expired'});}f.onStep(.1,{x:0,z:0},{x:0,z:0});f.onTick();}
 [...app.root.querySelectorAll('button')].find(b=>b.textContent==='Encerrar e analisar').click();expect(readDodgePlacement(localStorage).level).toBe(1);expect(app.repository.saveCompletedAttempt).toHaveBeenCalledOnce();resolveSave({status:'saved'});await settle();expect(readDodgePlacement(localStorage).level).toBe(2);expect(app.root.querySelector('.result-actions').textContent).toContain('Jogar nível 2');
});
