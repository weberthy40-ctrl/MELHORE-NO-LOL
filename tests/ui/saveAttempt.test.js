// @vitest-environment jsdom
import { it,expect,vi } from 'vitest';
import { recordFixture } from '../fixtures/record.js';
import { mountSaveAttempt } from '../../src/ui/saveAttempt.js';
it('retries the same frozen record and confirms status only after commit promise',async()=>{
 const container=document.createElement('section'),r=recordFixture();let finish;
 const repository={saveCompletedAttempt:vi.fn().mockRejectedValueOnce(Error('quota')).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}))};
 const core={errors:{report:vi.fn()}};
 mountSaveAttempt({container,repository,metrics:r.metrics,score:r.score,core,isActive:()=>true});
 await Promise.resolve();await Promise.resolve();expect(container.textContent).toContain('Não foi possível salvar');
 container.querySelector('button').click();expect(container.textContent).toContain('Salvando...');expect(container.textContent).not.toContain('Salvo neste dispositivo');
 expect(repository.saveCompletedAttempt.mock.calls[0][0]).toBe(repository.saveCompletedAttempt.mock.calls[1][0]);finish();await Promise.resolve();expect(container.textContent).toContain('Salvo neste dispositivo');
});
it('does not apply an old attempt save completion to a detached result',async()=>{
 const container=document.createElement('section'),r=recordFixture();let active=true,finish;
 mountSaveAttempt({container,repository:{saveCompletedAttempt:()=>new Promise(resolve=>{finish=resolve;})},metrics:r.metrics,score:r.score,core:{errors:{report:vi.fn()}},isActive:()=>active});
 active=false;finish();await Promise.resolve();expect(container.textContent).not.toContain('Salvo neste dispositivo');
});
