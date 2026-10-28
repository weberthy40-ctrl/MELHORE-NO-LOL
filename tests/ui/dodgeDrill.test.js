// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {createCore} from '../../src/core/createCore.js';
import {mountDodgeDrill} from '../../src/ui/dodgeDrillScreen.js';
import {resolveRoute} from '../../src/ui/routes.js';
const flush=async()=>{for(let n=0;n<6;n++)await Promise.resolve();};
const cleanup=[];
afterEach(()=>{cleanup.splice(0).forEach(fn=>fn());vi.restoreAllMocks();document.body.replaceChildren();});
function button(screen,text){const b=[...screen.querySelectorAll('button')].find(b=>b.textContent===text);expect(b).toBeTruthy();return b;}
async function mount(){
 const screen=document.createElement('main');document.body.append(screen);const core=createCore();let frame,disposed=0;
 const view=mountDodgeDrill({screen,core,loadPreview:async()=>({mountPreview(stage,options){frame=options;stage.dataset.visuals='ready';return {dispose(){disposed++;}};}})});
 cleanup.push(()=>{view.dispose();core.dispose();});await flush();return {screen,core,view,get frame(){return frame;},get disposed(){return disposed;}};
}
function advance(frame,count){const p={x:0,z:0};for(let i=0;i<count;i++){const before=frame.session.snapshot().elapsed;frame.session.update(.1);const dt=frame.session.snapshot().elapsed-before;frame.exercise.update(dt,p,p);frame.onTick();}}
it('runs a real beam-only practice for45 active seconds, preserves pause and restarts with a fresh idle session without writes',async()=>{
 const writes=vi.spyOn(Storage.prototype,'setItem'),q=await mount();
 expect(q.frame.session.snapshot()).toMatchObject({state:'idle',elapsed:0});expect(q.frame.exercise.snapshot().focus).toBe('sidestep');
 advance(q.frame,20);expect(q.frame.session.snapshot().elapsed).toBe(0);expect(q.frame.exercise.snapshot().shots).toBe(0);
 button(q.screen,'Iniciar desafio').click();advance(q.frame,20);expect(q.frame.session.snapshot().elapsed).toBeGreaterThan(1);
 button(q.screen,'Pausar').click();const elapsed=q.frame.session.snapshot().elapsed,metrics=q.frame.exercise.snapshot();advance(q.frame,50);expect(q.frame.session.snapshot().elapsed).toBe(elapsed);expect(q.frame.exercise.snapshot().shots).toBe(metrics.shots);
 button(q.screen,'Retomar').click();const seen=new Set();for(let n=0;n<450;n++){advance(q.frame,1);for(const p of q.frame.exercise.snapshot().projectiles)seen.add(p.variant);}
 expect([...seen]).toEqual(['sun_beam']);expect(q.frame.session.snapshot()).toMatchObject({state:'completed',elapsed:45});
 const result=q.screen.querySelector('.dodge-drill-result');expect(result.hidden).toBe(false);expect(result.textContent).toContain(`${q.frame.exercise.snapshot().impacts} contatos`);expect(result.textContent).toContain('não gera nota');expect(writes).not.toHaveBeenCalled();
 const old=q.frame.session.snapshot().id;button(q.screen,'Repetir série').click();await flush();expect(q.frame.session.snapshot()).toMatchObject({state:'idle',elapsed:0});expect(q.frame.session.snapshot().id).not.toBe(old);expect(q.disposed).toBe(1);
});
it('guards late import after disposal, and never constructs a renderer',async()=>{
 let resolve;const pending=new Promise(r=>{resolve=r;});const factory=vi.fn(),screen=document.createElement('main'),core=createCore();const view=mountDodgeDrill({screen,core,loadPreview:()=>pending});await flush();view.dispose();resolve({mountPreview:factory});await flush();expect(factory).not.toHaveBeenCalled();expect(screen.children).toHaveLength(0);core.dispose();
});
it('reports unavailable rendering instead of a completed series',async()=>{
 const screen=document.createElement('main'),core=createCore();const view=mountDodgeDrill({screen,core,loadPreview:async()=>{throw new Error('no WebGL');}});await flush();expect(screen.textContent).toContain('Nenhum resultado foi atribuído');expect(screen.querySelector('.arena-ready')).toBeNull();expect(screen.querySelector('.dodge-drill-result')).toBeNull();view.dispose();core.dispose();
});
it('recognizes only the explicit drill path and keeps obsolete practice redirects',()=>{
 expect(resolveRoute('#/drill/dodge/sidestep')).toEqual({path:'/drill/dodge/sidestep'});expect(resolveRoute('#/drill/dodge/unknown').path).toBe('/404');expect(resolveRoute('#/practice/dodge/sidestep').path).toBe('/train/dodge');
});
