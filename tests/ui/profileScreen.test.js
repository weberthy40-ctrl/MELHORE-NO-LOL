// @vitest-environment jsdom
import {it,expect} from 'vitest';
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
