// @vitest-environment jsdom
import {it,expect} from 'vitest';
import {mountProfile} from '../../src/ui/profileScreen.js';
import {recordFixture} from '../fixtures/record.js';
it('renders real dodge and empty modality summaries without assuming shared progress schemas',async()=>{
 const screen=document.createElement('main'),repository={async scanCompletedAttempts({modality,onRecord}){if(modality==='dodge')onRecord(recordFixture());return {invalid:0};}};
 const view=mountProfile({screen,repository});await new Promise(resolve=>setTimeout(resolve,0));
 expect(screen.querySelectorAll('.skill-card')).toHaveLength(4);expect(screen.textContent).not.toContain('Dados indisponíveis');expect(screen.querySelector('[data-mode=dodge]').textContent).toContain('94/100');expect(screen.querySelector('[data-mode=kiting]').textContent).toContain('Seu primeiro treino');view.dispose();
});
