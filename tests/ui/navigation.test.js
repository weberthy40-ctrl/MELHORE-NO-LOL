// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCore } from '../../src/core/createCore.js';
import { mountNavigation } from '../../src/ui/navigation.js';
import { resolveRoute } from '../../src/ui/routes.js';
const cleanups = [];
afterEach(() => { cleanups.splice(0).forEach(fn => fn()); document.body.replaceChildren(); window.history.replaceState(null,'','/'); });
function mount(loadPreview) {
  const root = document.createElement('div'); document.body.append(root);
  const core = createCore(); const nav = mountNavigation({root,core,loadPreview});
  cleanups.push(() => {nav.dispose();core.dispose();}); return {root,core,nav};
}
function go(path) { window.history.replaceState(null,'',`#${path}`); window.dispatchEvent(new Event('hashchange')); }
describe('navigation', () => {
  it('validates routes and levels without treating DPI as training', () => {
    expect(resolveRoute('#/train/dodge/10')).toEqual({path:'/train/dodge/10',modality:'dodge',level:10});
    for (const path of ['/train/dodge/0','/train/dpi/1','/train/kiting/11','/missing']) expect(resolveRoute(`#${path}`).path).toBe('/404');
  });
  it('offers all 40 levels and a separate DPI tool', () => {
    const {root} = mount(); go('/levels');
    expect(root.querySelectorAll('.level')).toHaveLength(40);
    expect(root.querySelectorAll('.level[aria-disabled]')).toHaveLength(0);
    expect(root.querySelector('.tool-card').hash).toBe('#/dpi');
    go('/train/dodge/8'); expect(root.textContent).toContain('Tempo ilimitado · 3 vidas'); expect(root.textContent).toContain('Tempo ilimitado · 1 vida');
    go('/diagnostics'); expect(root.querySelectorAll('.mode-card')).toHaveLength(4);
    expect(root.querySelectorAll('.level')).toHaveLength(0);
  });
  it('handles browser location changes and unknown pages', () => {
    const {root,nav} = mount(); go('/profile'); expect(root.textContent).toContain('Quatro habilidades. Um jogador cada vez melhor.');
    go('/unknown'); expect(root.textContent).toContain('Página não encontrada');
    nav.dispose(); go('/levels'); expect(root.children).toHaveLength(0);
  });
  it('cancels a late preview import and cleans a mounted preview', async () => {
    let resolve; const pending = new Promise(r => {resolve=r;}); const factory = vi.fn();
    const {nav} = mount(() => pending); go('/preview'); go('/profile');
    resolve({mountPreview:factory}); await pending; await Promise.resolve(); expect(factory).not.toHaveBeenCalled(); nav.dispose();
  });
});
for(const [mode,lives]of [['normal',3],['survival',1]])it(`puts replay and menu inside the central result after ${mode} defeat`,async()=>{
 let frame;const loadPreview=async()=>({mountPreview(_stage,options){frame=options;return {dispose(){}};}});
 const {root,core}=mount(loadPreview);go(`/play/dodge/${mode}/5`);await Promise.resolve();await Promise.resolve();
 const lose=()=>{const {session,onStep,onTick}=frame;for(let i=0;i<31;i++)session.update(.1);
  for(let hit=1;hit<=lives;hit++){for(let i=0;i<10;i++){session.update(.1);onStep(.1,{x:0,z:0},{x:0,z:0});}const event={attemptId:session.snapshot().id,id:`projectile-${hit}`,variant:'fast'};core.events.emit('dodge:spawn',event);core.events.emit('dodge:impact',event);onStep(0,{x:0,z:0},{x:0,z:0});onTick();}
 };
 lose();const dialog=root.querySelector('dialog.result-metrics'),actions=dialog.querySelector('.result-actions');expect(dialog.open).toBe(true);expect(dialog.textContent).toContain('Derrota');expect(root.querySelector('.session-hud').hidden).toBe(true);
 const replay=actions.querySelector('button');expect(replay.textContent).toBe('Jogar novamente');expect(actions.querySelector('a').hash).toBe('#/');expect(actions.textContent).toContain('Voltar ao menu');expect(document.activeElement).toBe(replay);
 const id=frame.session.snapshot().id;replay.click();await Promise.resolve();await Promise.resolve();expect(frame.session.snapshot().id).not.toBe(id);expect(root.querySelector('.result-metrics').open).toBe(false);expect(root.querySelector('.session-hud').hidden).toBe(false);
 lose();const menu=root.querySelector('.result-actions a');go(menu.hash.slice(1));expect(root.querySelector('dialog')).toBeNull();expect(root.querySelector('h1').textContent).toContain('Mecânica afiada');
});
it('blocks the context menu across dodge canvas, HUD and controls, and releases the handler on exit',()=>{
 const {root}=mount(async()=>({mountPreview(){return {dispose(){}};}}));let old;
 for(const path of ['/dodge-tech/3','/play/dodge/normal/3','/assessment/dodge','/practice/dodge/micro/6']){go(path);old=root.querySelector('main');for(const target of [old.querySelector('h1'),old.querySelector('button')??old]){const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});target.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);}}
 go('/levels');for(const target of [old,root.querySelector('main')]){const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});target.dispatchEvent(event);expect(event.defaultPrevented).toBe(false);}expect(resolveRoute('#/practice/dodge/sidestep/7')).toEqual({path:'/practice/dodge/sidestep/7',focus:'sidestep',level:7});
});
