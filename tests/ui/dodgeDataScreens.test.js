// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { recordFixture } from '../fixtures/record.js';
import { mountDodgeData } from '../../src/ui/dodgeDataScreens.js';
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
it('loads real-compatible history and resets pagination with combined filters',async()=>{
 const screen=document.createElement('main'),repository={listCompletedAttempts:vi.fn().mockResolvedValue({items:[recordFixture()],total:21,invalid:0})};
 const view=mountDodgeData({screen,kind:'history',repository});expect(screen.textContent).toContain('Carregando');await flush();
 expect(screen.querySelectorAll('tbody tr')).toHaveLength(1);expect(screen.textContent).toContain('94/100');
 [...screen.querySelectorAll('button')].find(b=>b.textContent==='Próxima').click();await flush();expect(repository.listCompletedAttempts.mock.calls.at(-1)[0].offset).toBe(10);
 const [mode,level]=screen.querySelectorAll('select');mode.value='survival';level.value='3';mode.dispatchEvent(new Event('change'));await flush();
 expect(repository.listCompletedAttempts.mock.calls.at(-1)[0]).toMatchObject({mode:'survival',level:3,offset:0});view.dispose();
});
it('offers retry and ignores responses after a newer filter or unmount',async()=>{
 const screen=document.createElement('main');let first,second;
 const repository={listCompletedAttempts:vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{first=resolve;})).mockImplementationOnce(()=>new Promise(resolve=>{second=resolve;}))};
 const view=mountDodgeData({screen,kind:'history',repository});screen.querySelector('select').value='normal';screen.querySelector('select').dispatchEvent(new Event('change'));
 second({items:[],total:0,invalid:0});await flush();expect(screen.textContent).toContain('Nenhum resultado');first({items:[recordFixture()],total:1,invalid:0});await flush();expect(screen.querySelectorAll('tbody tr')).toHaveLength(0);view.dispose();
 const errorScreen=document.createElement('main'),retryRepo={listCompletedAttempts:vi.fn().mockRejectedValueOnce(Error('unavailable')).mockResolvedValue({items:[],total:0,invalid:0})};
 const errorView=mountDodgeData({screen:errorScreen,kind:'history',repository:retryRepo});await flush();expect(errorScreen.textContent).toContain('Não foi possível');errorScreen.querySelector('button').click();await flush();expect(errorScreen.textContent).toContain('Nenhuma tentativa');errorView.dispose();
});
it('draws an accessible chart and table from saved points without a write API',async()=>{
 const screen=document.createElement('main'),repository={listCompletedAttempts:vi.fn().mockResolvedValue({items:[recordFixture()],total:1,invalid:0})};
 const view=mountDodgeData({screen,kind:'evolution',repository});await flush();expect(screen.querySelector('svg[role=img]')).not.toBeNull();expect(screen.querySelectorAll('circle')).toHaveLength(1);expect(screen.querySelectorAll('polyline')).toHaveLength(0);expect(screen.querySelectorAll('tbody tr')).toHaveLength(1);view.dispose();
});
it('filters precision history by modality and variant, displaying actual counters',async()=>{
 const {precisionRecord}=await import('../fixtures/precisionRecord.js');const screen=document.createElement('main'),repository={listCompletedAttempts:vi.fn().mockResolvedValue({items:[precisionRecord({hits:0})],total:1,invalid:0})};
 const view=mountDodgeData({screen,kind:'history',modality:'precision',repository});await flush();expect(screen.textContent).toContain('0/100');expect(screen.textContent).toContain('Acertos: 0');
 const [variant,level]=screen.querySelectorAll('select');variant.value='multi-moving';level.value='10';variant.dispatchEvent(new Event('change'));await flush();expect(repository.listCompletedAttempts.mock.calls.at(-1)[0]).toMatchObject({modality:'precision',variant:'multi-moving',level:10,offset:0});view.dispose();
});
