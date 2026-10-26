import { it,expect } from 'vitest';
import { kitingRecord as record } from '../fixtures/kitingRecord.js';
import { precisionRecord } from '../fixtures/precisionRecord.js';
import { validateAttemptRecord,createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculateKitingProgress,prepareKitingEvolution } from '../../src/progression/kitingProgress.js';
import { KITING_PRESETS,KITING_DIAGNOSTIC_VERSION,createKitingAssessmentFlow,calculateKitingGuidedAssessment } from '../../src/training/assessment/kitingAssessment.js';
it('preserves official Kiting records including zero and rejects foreign origins and corrupt metrics',()=>{
 const zero=record({hits:0});expect(zero.score.score).toBe(0);expect(validateAttemptRecord(zero)).toBe(zero);
 for(const patch of [{origin:'diagnostic'},{elapsedActiveSeconds:20},{hits:Infinity},{histogram:[0,0]},{rhythmCycles:1}])expect(()=>createAttemptRecord({...zero.metrics,...patch},zero.score)).toThrow();
 expect(calculateKitingProgress([record(),precisionRecord(),zero]).total).toBe(1); // Same stable ID is counted once.
});
it('derives six achievements at thresholds, preserving the earliest evidence independently of input order',()=>{
 const data=Array.from({length:25},(_,i)=>record({id:String(i).padStart(2,'0'),variant:['static','moving','spacing'][i%3],score:i===1?95:80,date:`2026-10-${String(i+1).padStart(2,'0')}T00:00:00.000Z`}));
 expect(calculateKitingProgress(data.slice(0,1)).achievements.filter(a=>a.unlocked)).toHaveLength(2);expect(calculateKitingProgress(data.slice(0,4)).achievements.find(a=>a.id==='kiting:five-sessions').unlocked).toBe(false);expect(calculateKitingProgress(data.slice(0,5)).achievements.find(a=>a.id==='kiting:five-sessions').unlocked).toBe(true);
 const r=calculateKitingProgress([...data].reverse());expect(r.achievements.every(a=>a.unlocked)).toBe(true);expect(r.achievements.find(a=>a.id==='kiting:twenty-five-sessions').completedAt).toBe(data[24].completedAt);expect(r.achievements.find(a=>a.id==='kiting:all-variants').completedAt).toBe(data[2].completedAt);
});
it('uses only the three recent static scores per level for rating and all records for statistics',()=>{
 const a=Array.from({length:3},(_,i)=>record({id:`a${i}`,level:8,score:60,date:`2026-10-0${i+1}T00:00:00.000Z`}));expect(calculateKitingProgress(a).rating.rating).toBe(8);
 a.push(record({id:'bad1',level:8,score:59,date:'2026-10-04T00:00:00.000Z'}),record({id:'bad2',level:8,score:59,date:'2026-10-05T00:00:00.000Z'}));expect(calculateKitingProgress(a).rating.rating).toBeNull();expect(calculateKitingProgress(a.map(r=>record({id:r.attemptId,variant:'moving'}))).rating.rating).toBeNull();
 const result=calculateKitingProgress(a);expect(result.stats.meanScore).toBeCloseTo(59.6);expect(prepareKitingEvolution(a,{level:8}).at(-1).score).toBe(59);
});
function rounds(hits=12){return KITING_PRESETS.map((p,i)=>({...p,origin:'diagnostic',modality:'kiting',diagnosticVersion:KITING_DIAGNOSTIC_VERSION,attemptId:`r${i}`,index:i+1,durationTarget:20,activeSeconds:20,endReason:'diagnostic-time',complete:true,accepted:hits,shots:hits,hits,cancellations:0,totalDistanceMoved:hits,rhythmOpportunities:Math.max(0,hits-1),rhythmCycles:Math.max(0,hits-1),histogram:[hits,0,0,0]}));}
it('calculates a distinct 20-second diagnostic with ordered real presets and four windows',()=>{
 const data=rounds(),original=JSON.stringify(data),r=calculateKitingGuidedAssessment(data);expect(r.status).toBe('recommended');expect(r.recommendedStartingLevel).toBeGreaterThanOrEqual(1);expect(r.perAttempt[0].targetHits20).toBe(18/3);expect(r.perAttempt[0].consistency).toBe(.25);expect(JSON.stringify(data)).toBe(original);
 const distributed=rounds();distributed.forEach(r=>{r.histogram=[3,3,3,3];});expect(calculateKitingGuidedAssessment(distributed).perAttempt[0].qi).toBeGreaterThan(r.perAttempt[0].qi);
 const flow=createKitingAssessmentFlow();flow.start();for(let i=0;i<3;i++){flow.running();expect(flow.finishRound(data[i])).toBe(true);if(i<2)flow.next();}expect(flow.snapshot().state).toBe('completed');
 for(const result of data)expect(()=>createAttemptRecord(result,{})).toThrow();
});
it('never substitutes inactivity, invalid configuration or official data with a numeric diagnostic level',()=>{
 expect(calculateKitingGuidedAssessment(rounds(2)).status).toBe('insufficient-evidence');expect(calculateKitingGuidedAssessment(rounds(0)).recommendedStartingLevel).toBeNull();
 for(const patch of [{origin:'official'},{variant:'spacing'},{shots:1},{rhythmCycles:12},{histogram:[1,1,1,1]},{activeSeconds:19},{attemptId:'r1'},{hits:NaN}]){const data=rounds();Object.assign(data[0],patch);expect(calculateKitingGuidedAssessment(data).status).toBe('invalid-data');}
 expect(calculateKitingGuidedAssessment(rounds(),KITING_PRESETS.map(p=>({...p,targetHits20:0}))).status).toBe('invalid-config');
});
