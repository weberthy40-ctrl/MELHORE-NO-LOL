import { it,expect } from 'vitest';
import { createCueBag,createReflexExercise } from '../../src/training/reflex/exercise.js';
import { createRandom } from '../../src/core/random.js';
import { reflexDifficulty,REFLEX_VARIANTS } from '../../src/training/reflex/difficulty.js';
function runner(variant='simple',technical=true){let clock=0;const e=createReflexExercise({variant,technical,now:()=>clock,rng:createRandom(42)});e.start();e.setRunning(true);return {e,advance(seconds){for(let i=0;i<Math.round(seconds*100);i++){clock+=10;e.update(.01);}},setClock(value){clock=value;},present(){e.present();}};}
it('balances every technical bag with bounded runs over many seeds',()=>{
 for(const variant of Object.keys(REFLEX_VARIANTS))for(let seed=0;seed<200;seed++){const bag=createCueBag(variant,createRandom(seed));expect(bag).toHaveLength(REFLEX_VARIANTS[variant].rounds);if(variant!=='simple')for(let i=3;i<bag.length;i++)expect(new Set(bag.slice(i-3,i+1)).size).toBeGreaterThan(1);if(variant==='inhibition'){expect(bag.filter(c=>c==='go')).toHaveLength(8);expect(bag.filter(c=>c==='noGo')).toHaveLength(4);}}
});
it('waits for actual presentation, measures monotonic latency, rejects duplicate and early events',()=>{
 const r=runner();r.advance(4);expect(r.e.snapshot().phase).toBe('cue-pending');expect(r.e.respond('Space')).toBe(false);r.advance(2);r.present();r.advance(.2);expect(r.e.respond('Space')).toBe(true);expect(r.e.respond('Space')).toBe(false);expect(r.e.snapshot().rounds[0]).toMatchObject({status:'correct',reactionMs:200});expect(r.e.respond('KeyF')).toBe(false);
});
it('freezes wait and reaction clocks during pause and distinguishes omissions from anticipation',()=>{
 const r=runner();expect(r.e.respond('Space')).toBe(true);expect(r.e.snapshot().rounds[0]).toMatchObject({status:'anticipated',reactionMs:null});r.advance(4);r.present();r.advance(.1);r.e.setRunning(false);const before=r.e.snapshot();r.advance(10);expect(r.e.snapshot()).toEqual(before);expect(r.e.respond('Space')).toBe(false);r.e.setRunning(true);r.advance(.2);r.e.respond('Space');expect(r.e.snapshot().rounds[1].reactionMs).toBe(300);r.advance(4);r.present();r.advance(3);expect(r.e.snapshot().rounds[2]).toMatchObject({status:'missed',reactionMs:null});
});
it('keeps twelve Go/No-Go presentations despite early presses and never invents inhibitory latency',()=>{
 const r=runner('inhibition');r.e.respond('KeyF');expect(r.e.snapshot().summary.anticipations).toBe(1);expect(r.e.snapshot().rounds).toHaveLength(0);
 for(let i=0;i<12;i++){r.advance(3);r.present();if(r.e.snapshot().cue.answer){r.advance(.2);r.e.respond('KeyF');}else r.advance(1.2);r.advance(.5);}
 const s=r.e.snapshot();expect(s.state).toBe('completed');expect(s.summary).toMatchObject({presented:12,goPresented:8,noGoPresented:4,inhibited:4,correct:12,anticipations:1,meanMs:200});expect(s.rounds.filter(r=>r.status==='inhibited').every(r=>r.reactionMs===null)).toBe(true);
});
it('has ten gradual official profiles and unchanged independent technical configurations',()=>{
 for(const variant of Object.keys(REFLEX_VARIANTS)){expect(reflexDifficulty(10,variant).responseWindow).toBeLessThan(reflexDifficulty(1,variant).responseWindow);expect(reflexDifficulty(10,variant,{technical:true})).toEqual(reflexDifficulty(1,variant,{technical:true}));}
 expect(reflexDifficulty(1,'choice').responseWindow).toBe(1800);expect(reflexDifficulty(10,'choice').responseWindow).toBe(850);expect(()=>reflexDifficulty(11,'simple')).toThrow();
});
