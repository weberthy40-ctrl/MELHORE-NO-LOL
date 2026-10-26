import { it,expect } from 'vitest';
import { precisionRecord as record } from '../fixtures/precisionRecord.js';
import { recordFixture } from '../fixtures/record.js';
import { calculatePrecisionProgress,preparePrecisionEvolution } from '../../src/progression/precisionProgress.js';
import { validateAttemptRecord,createAttemptRecord } from '../../src/persistence/attemptRecord.js';
it('preserves official precision snapshots including zero, rejecting diagnostic and malformed data',()=>{
 const zero=record({hits:0});expect(validateAttemptRecord(zero)).toBe(zero);expect(zero.score.score).toBe(0);expect(zero.metrics.accuracy).toBeNull();
 for(const change of [{origin:'diagnostic'},{hits:Infinity},{elapsedActiveSeconds:20},{endReason:'abandoned'}])expect(()=>createAttemptRecord({...zero.metrics,...change},zero.score)).toThrow();
 expect(calculatePrecisionProgress([zero,recordFixture()]).total).toBe(1);
});
it('rates only the three most recent static sessions and can downgrade without requiring earlier levels',()=>{
 const records=Array.from({length:3},(_,i)=>record({id:`a${i}`,level:8,date:`2026-10-0${i+1}T00:00:00.000Z`}));
 expect(calculatePrecisionProgress(records.slice(0,2)).rating.rating).toBeNull();expect(calculatePrecisionProgress([...records,...records]).rating.rating).toBe(8);
 records.push(record({id:'failure1',level:8,hits:0,date:'2026-10-04T00:00:00.000Z'}),record({id:'failure2',level:8,hits:0,date:'2026-10-05T00:00:00.000Z'}));
 expect(calculatePrecisionProgress(records).rating.rating).toBeNull();expect(calculatePrecisionProgress(records.map(r=>record({id:r.attemptId,variant:'multi-static'}))).rating.rating).toBeNull();
});
it('derives exactly six achievements with first evidence and totals from all contexts',()=>{
 const data=['single-static','single-moving','multi-static','multi-moving'].map((variant,i)=>record({id:String(i),variant,level:i+1,hits:60,date:`2026-10-0${i+1}T00:00:00.000Z`}));
 const progress=calculatePrecisionProgress([...data].reverse());expect(progress.achievements).toHaveLength(6);expect(progress.achievements.every(a=>a.unlocked)).toBe(true);expect(progress.achievements.find(a=>a.id==='versatile').completedAt).toBe(data[3].completedAt);expect(progress.stats.total).toBe(4);
});
it('selects records deterministically with missing accuracy and filters before limiting evolution',()=>{
 const data=[record({id:'z',hits:0}),record({id:'b',hits:30}),record({id:'a',hits:30})];
 for(const order of [data,[...data].reverse(),[data[1],data[0],data[2]]])expect(calculatePrecisionProgress(order).records[0].attemptId).toBe('a');
 const many=Array.from({length:80},(_,i)=>record({id:String(i).padStart(3,'0'),variant:i%2?'single-moving':'single-static'}));
 const points=preparePrecisionEvolution(many);expect(points).toHaveLength(30);expect(points[0].attemptId).toBe('020');expect(points.at(-1).attemptId).toBe('078');expect(points[0].accuracy).toBe(100);expect(Object.isFrozen(points)).toBe(true);
});
