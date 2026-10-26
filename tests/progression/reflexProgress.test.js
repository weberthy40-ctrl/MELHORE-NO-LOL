import { it,expect } from 'vitest';
import { reflexRecord as record } from '../fixtures/reflexRecord.js';
import { calculateReflexScore } from '../../src/training/reflex/score.js';
import { calculateReflexProgress } from '../../src/progression/reflexProgress.js';
import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
it('scores all four exercises using only real correct latencies, and allows legitimate zero',()=>{
 for(const variant of ['simple','choice','inhibition','direction']){const r=record({variant}),s=calculateReflexScore(r.metrics);expect(s.score).toBeGreaterThan(90);expect(s.score).toBeLessThanOrEqual(100);expect(s.components.map(c=>c.weight)).toEqual([55,25,20]);}
 const zero=record({status:'missed'});expect(zero.score.score).toBe(0);expect(zero.metrics.summary.meanMs).toBeNull();
 const slow=record({reactionMs:1000});expect(slow.score.score).toBeLessThan(record().score.score);
 for(const change of [{origin:'diagnostic'},{endReason:'abandoned'},{elapsedActiveSeconds:20},{summary:{opportunities:0}},{rounds:[]}]){const m={...zero.metrics,...change};expect(calculateReflexScore(m).score).toBeNull();expect(()=>createAttemptRecord(m,zero.score)).toThrow();}
});
it('has six derived achievements and rates only recent Reação Simples results',()=>{
 const records=Array.from({length:10},(_,i)=>record({id:`a${i}`,variant:['simple','choice','inhibition','direction'][i%4],level:10,date:`2026-10-${String(i+1).padStart(2,'0')}T00:00:00.000Z`}));const result=calculateReflexProgress([...records,...records]);expect(result.total).toBe(10);expect(result.achievements).toHaveLength(6);expect(result.achievements.every(a=>a.unlocked)).toBe(true);expect(result.rating.rating).toBe(10);
 records.push(record({id:'bad1',level:10,status:'missed',date:'2026-10-11T00:00:00.000Z'}),record({id:'bad2',level:10,status:'missed',date:'2026-10-12T00:00:00.000Z'}));expect(calculateReflexProgress(records).rating.rating).toBeNull();
});
it('uses mixed sessions as a separate reference after three samples without pooling simple results',()=>{
 const sessions=[record({id:'simple-one',level:8}),record({id:'mixed-one',variant:'mixed',level:8}),record({id:'mixed-two',variant:'mixed',level:8})];
 expect(calculateReflexProgress(sessions).rating.rating).toBeNull();sessions.push(record({id:'mixed-three',variant:'mixed',level:8}));
 expect(calculateReflexProgress(sessions).rating).toMatchObject({rating:8,referenceVariant:'mixed'});
});
