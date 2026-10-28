// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
import {precisionRecord} from '../fixtures/precisionRecord.js';
import {adviceRecord} from '../fixtures/adviceRecords.js';
import {mountProfile} from '../../src/ui/profileScreen.js';
import {recordFixture} from '../fixtures/record.js';
it('renders real dodge and empty modality summaries without assuming shared progress schemas',async()=>{
 const screen=document.createElement('main'),repository={async scanCompletedAttempts({modality,onRecord}){if(modality==='dodge')onRecord(recordFixture());return {invalid:0};}};
 const view=mountProfile({screen,repository});await new Promise(resolve=>setTimeout(resolve,0));
 expect(screen.querySelectorAll('.skill-card')).toHaveLength(4);expect(screen.textContent).not.toContain('Dados indisponíveis');expect(screen.querySelector('[data-mode=dodge]').textContent).toContain('94/100');expect(screen.querySelector('[data-mode=kiting]').textContent).toContain('Seu primeiro treino');view.dispose();
});
it('shows points from the first saved attempt and marks incomplete overall coverage',async()=>{
 const screen=document.createElement('main'),repository={async scanCompletedAttempts({modality,onRecord}){if(modality==='dodge')onRecord(recordFixture());return {invalid:0};}},view=mountProfile({screen,repository});await new Promise(resolve=>setTimeout(resolve,0));const dodge=screen.querySelector('[data-mode=dodge]');expect(dodge.querySelector('.rank-badge').textContent).toBe('Ferro');expect(dodge.querySelector('.skill-gauge').textContent).toContain('PONTOS');expect(dodge.textContent).toContain('Patente provisória');expect(screen.querySelector('.overall-rank').textContent).toContain('1/4 avaliadas');expect(dodge.querySelector('.button').hash).toBe('#/assessment/dodge');view.dispose();
});

const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,0));};
it('shows neutral advice for empty history using the same four read queries and no writes',async()=>{
 const screen=document.createElement('main'),repository={scanCompletedAttempts:vi.fn(async()=>({invalid:0})),saveCompletedAttempt:vi.fn()};
 const view=mountProfile({screen,repository});await settle();
 expect(repository.scanCompletedAttempts).toHaveBeenCalledTimes(4);expect(repository.saveCompletedAttempt).not.toHaveBeenCalled();
 for(const card of screen.querySelectorAll('.skill-card')){
  expect(card.querySelector('.training-advice').dataset.status).toBe('empty');
  expect(card.querySelector('.advice-action').hash).toBe(`#/assessment/${card.dataset.mode}`);
 }
 view.dispose();
});
it('keeps advice unavailable on a failed modality, while retry and other modalities remain independent',async()=>{
 let failed=true;const screen=document.createElement('main'),repository={scanCompletedAttempts:vi.fn(async({modality})=>{
  if(modality==='precision'&&failed)throw new Error('unavailable');return {invalid:0};
 })};
 const view=mountProfile({screen,repository});await settle();const precision=screen.querySelector('[data-mode=precision]');
 expect(precision.textContent).toContain('Dados indisponíveis');expect(precision.querySelector('.training-advice')).toBeNull();
 expect(screen.querySelectorAll('.training-advice')).toHaveLength(3);
 failed=false;precision.querySelector('button').click();await settle();
 expect(precision.querySelector('.training-advice').dataset.status).toBe('empty');expect(repository.scanCompletedAttempts).toHaveBeenCalledTimes(5);view.dispose();
});
it('ignores older retry responses and late responses after disposal',async()=>{
 const pending=[];let count=0;const screen=document.createElement('main'),repository={scanCompletedAttempts:vi.fn(({modality,onRecord})=>{
  if(modality!=='precision')return Promise.resolve({invalid:0});
  if(++count===1)return Promise.reject(new Error('initial failure'));
  return new Promise(resolve=>pending.push({onRecord,resolve}));
 })};
 const view=mountProfile({screen,repository});await settle();
 const retry=screen.querySelector('[data-mode=precision] button');retry.click();retry.click();
 pending[1].onRecord(precisionRecord({id:'newer',date:'2026-10-05T00:00:00.000Z'}));pending[1].resolve({invalid:0});await settle();
 const latest=screen.querySelector('[data-mode=precision]').textContent;
 pending[0].onRecord(precisionRecord({id:'older',date:'2026-10-01T00:00:00.000Z'}));pending[0].resolve({invalid:0});await settle();
 expect(screen.querySelector('[data-mode=precision]').textContent).toBe(latest);view.dispose();
 const delayed=[],other=document.createElement('main'),second=mountProfile({screen:other,repository:{scanCompletedAttempts:()=>new Promise(resolve=>delayed.push(resolve))}});
 second.dispose();for(const resolve of delayed)resolve({invalid:0});await settle();expect(other.children).toHaveLength(0);
});

it('renders current last-attempt advice with safe paths, without extra scans or rewriting the records',async()=>{
 const modes=['dodge','precision','kiting','reflex'],records=modes.map(mode=>adviceRecord(mode)),before=JSON.stringify(records);
 const screen=document.createElement('main'),repository={scanCompletedAttempts:vi.fn(async({modality,onRecord})=>{
  for(const record of records)if(record.modality===modality)onRecord(record);return {invalid:0};
 }),saveCompletedAttempt:vi.fn()};
 const view=mountProfile({screen,repository});await settle();
 for(const mode of modes){const card=screen.querySelector(`[data-mode=${mode}]`),advice=card.querySelector('.training-advice');
  expect(advice.dataset.status).toBe('ready');expect(advice.textContent).toContain('Baseado somente no último treino salvo');
  expect(advice.querySelector('.advice-action').hash).toBe(mode==='dodge'?'#/train/dodge':`#/timed/${mode}/3`);
 }
 expect(repository.scanCompletedAttempts).toHaveBeenCalledTimes(4);expect(repository.saveCompletedAttempt).not.toHaveBeenCalled();expect(JSON.stringify(records)).toBe(before);view.dispose();
});
it('uses the last valid attempt independently of scan order, not an older more favorable sample',async()=>{
 const newer=adviceRecord('precision',{clicks:4,misses:2,date:'2026-10-27T12:00:00.000Z'}),older=adviceRecord('precision',{clicks:32,misses:0,date:'2026-10-26T12:00:00.000Z'});
 for(const order of [[older,newer],[newer,older]]){
  const screen=document.createElement('main'),view=mountProfile({screen,repository:{async scanCompletedAttempts({modality,onRecord}){
   if(modality==='precision')for(const record of order)onRecord(record);return {invalid:0};
  }}});await settle();
  const advice=screen.querySelector('[data-mode=precision] .training-advice');expect(advice.dataset.status).toBe('insufficient');expect(advice.querySelector('.advice-evidence').textContent).toContain('4 cliques');view.dispose();
 }
});
