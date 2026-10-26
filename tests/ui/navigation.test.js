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
    go('/train/dodge/8'); expect(root.textContent).toContain('60 segundos · 3 vidas'); expect(root.textContent).toContain('Tempo ilimitado · 1 vida');
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
